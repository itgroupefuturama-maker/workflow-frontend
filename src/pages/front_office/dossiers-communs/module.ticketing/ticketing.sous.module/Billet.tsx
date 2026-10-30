import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../app/store';
import {
  fetchBilletById,
  addReservationToLigne,
  type BilletLigne,
  emitBilletLigne,
  soumettreVenteOdoo,
  soumettreAchatOdoo,
  annulerBillet,
  type AnnulationBilletPayload,
  reprogrammerLigne,
  type ServiceSpecifique,
  reporterLigne,
} from '../../../../../app/front_office/billetSlice';
import AnnulationBilletModal from '../../../../../components/modals/AnnulationBilletModal';
import ReservationModal from '../../../../../components/modals/ReservationModal';
import EmissionModal from '../../../../../components/modals/EmissionModal';
import { fetchClientFactureById } from '../../../../../app/back_office/clientFacturesSlice';
import BeneficiaireInfosModal from '../../../../../components/modals/BeneficiaireInfosModal';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchSuivisPaginated } from '../../../../../app/front_office/suiviSlice';
import EmissionBilletModal from '../../../../../components/modals/EmissionBilletModal';
import { fetchCommentairesByPrestation,  } from '../../../../../app/front_office/commentaireSlice';
import BilletInfoCards from './components.billet/BilletInfoCards';
import BilletTable from './components.billet/BilletTable';
import ServiceTable from './components.billet/ServiceTable';
// import SuiviTab from './components.billet/SuiviTable';
import ReprogrammationModal from '../../../../../components/modals/ReprogrammationModal';
import { TicketingHeader } from './components.billet/TicketingHeader';
import { billetDetailItems } from './components.billet/utils/ticketingHeaderItems';
import PageSkeleton from '../../../../../components/ui/PageSkeleton';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import { toast } from '../../../../../components/Toast/toast';
import { onBilletStatut } from '../../../../../service/notifications';
import Button from '../../../../../components/ui/Button';
import { selectServicesByType } from '../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';

// Les thunks rejettent avec le message du back (string) : on l'affiche tel quel
const messageErreur = (err: unknown, fallback: string): string =>
  typeof err === 'string' ? err : err instanceof Error && err.message ? err.message : fallback;

// Reprogrammation, annulation ou modification de réservation après un envoi à Odoo : le billet repasse en CREER
const MSG_A_RESOUMETTRE = 'Dossier modifié : à soumettre de nouveau à Odoo (bouton Approuver)';

const Billet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { enteteId, prestationId } = useParams<{ enteteId: string , prestationId : string}>();
  // const [searchParams] = useSearchParams();

  const [showAnnulModal, setShowAnnulModal] = useState(false);
  const [annulType, setAnnulType] = useState<'reservation' | 'emission' | null>(null);
  const [annulLoading, setAnnulLoading] = useState(false);

  // const prospectionEnteteId = searchParams.get('prospectionEnteteId');
  // const prestationId = searchParams.get('prestationId');

  const [activeTab, setActiveTab] = useState('billet');

  // Envoi à Odoo en cours depuis cette page : le back attend l'accusé de réception d'Odoo (≈ 10 s max)
  const [envoiOdooEnCours, setEnvoiOdooEnCours] = useState<'VENTE' | 'ACHAT' | null>(null);

  const [showEmissionModal, setShowEmissionModal] = useState(false);

  const [showReprogModal, setShowReprogModal] = useState(false);
  const [selectedLigneForReprog, setSelectedLigneForReprog] = useState<BilletLigne | null>(null);
  const [reprogSubmitting, setReprogSubmitting] = useState(false);
  // Réservation / émission de ligne en cours : bloque le double clic (2e requête refusée par le back)
  const [ligneSubmitting, setLigneSubmitting] = useState<'RESA' | 'EMISSION' | null>(null);

  // Dans le composant Billet
  const services = useSelector(selectServicesByType('TICKET'));

  const tabs = [
    // { id: 'prospection', label: 'Listes des entête prospection' },
    // { id: 'billet', label: 'Listes des billets' }
  ];

  const [innerTab, setInnerTab] = useState('billet');

  const innerTabs = [
    { id: 'billet', label: 'Billet' },
    { id: 'services', label: 'Services' },
    { id: 'specifique', label: 'Spécifique' },
    { id: 'suivi', label: 'Suivi' },
  ];

  const { current: billet, loading } = useSelector((state: RootState) => state.billet);
  const { current: clientFacture, loading: cfLoading, error: cfError } = useSelector(
    (state: RootState) => state.clientFactures
  );
  const clientFactureId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  const dossier = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId
  );

  const serviceById = useMemo(() => {
    const map = new Map<string, ServiceSpecifique>();
      services.forEach((svc) => {
        map.set(svc.id, svc);
      });
      return map;
  }, [services]);

  // Charger les suivis (une seule fois ou quand l'entête change)
  // NB : `state.suivi` n'est lu par aucun composant de cet écran (l'onglet "Suivi" ci-dessous
  // affiche en réalité <SuiviTabSection> qui se base sur `todos`/commentaires/évolution par
  // prestation, pas sur ce fetch global). On garde l'appel (comportement historique) mais on
  // le bascule en pagination pour éviter de rapatrier toute la table `/suivi` à chaque fois.
  useEffect(() => {
    if (enteteId && billet) {
      dispatch(fetchSuivisPaginated({ page: 1, limit: 20 }));
    }
  }, [dispatch, enteteId, billet]);

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchCommentairesByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
    if (id === 'prospection') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/ticketing/pages`, {
        state: { targetTab: 'prospection' }
      });
    } else {
      setActiveTab(id);
    }
  };

  // Dans Billet.tsx, avant le return
  const handleReprogrammer = (ligne: BilletLigne) => {
    if (!ligne || !ligne.id) {
      toast.error('Impossible de reprogrammer : ligne invalide');
      return;
    }

    setSelectedLigneForReprog(ligne);
    setShowReprogModal(true);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLigne, setSelectedLigne] = useState<BilletLigne | null>(null);
  const [emissionModalOpen, setEmissionModalOpen] = useState(false);
  const [selectedLigneForEmission, setSelectedLigneForEmission] = useState<BilletLigne | null>(null);

  const [infosModalOpen, setInfosModalOpen] = useState(false);
  const [selectedBenefName] = useState<string>('');
  const [selectedBenefId] = useState<string | null>(null);

  // Premier chargement de CE billet : seul cas où toute la page passe en squelette. Les re-fetch
  // déclenchés par les actions (réservation, émission, report…) n'affichent qu'un voile sur le tableau.
  const [initialLoad, setInitialLoad] = useState<{ enteteId: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!enteteId) return;
    let active = true;
    dispatch(fetchBilletById(enteteId)).then((res) => {
      if (active) setInitialLoad({ enteteId, ok: fetchBilletById.fulfilled.match(res) });
    });
    return () => { active = false; };
  }, [enteteId, dispatch]);

  // Odoo a changé le statut de CE billet (socket 'billet:statut', envoyé à tous) : on recharge pour
  // mettre à jour statut, boutons et odooEnvois sans action de l'agent.
  const billetEnteteId = billet?.id;
  useEffect(() => {
    if (!enteteId || !billetEnteteId) return;
    return onBilletStatut((e) => {
      if (e.billetEnteteId === billetEnteteId) dispatch(fetchBilletById(enteteId));
    });
  }, [enteteId, billetEnteteId, dispatch]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [clientFactureId, dispatch]);

  const { list: beneficiaireInfosList, loadingList: infosLoading, error: infosError } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );


  const handleOpenReservation = (ligne: BilletLigne) => {
    setSelectedLigne(ligne);
    setModalOpen(true);
  };

  const handleSubmitReservation = async (data: any) => {
    if (!selectedLigne || ligneSubmitting) return;
    // Modifier la réservation d'une ligne FAIT après un envoi à Odoo remet le billet en CREER
    const modifApresEnvoi = selectedLigne.statut === 'FAIT' && (billet?.odooEnvois?.length ?? 0) > 0;

    setLigneSubmitting('RESA');
    try {
      await dispatch(
        addReservationToLigne({
          ligneId: selectedLigne.id,
          payload: data,   // ← maintenant compatible avec le format { passagerIds: [...], ... }
        })
      ).unwrap();

      if (enteteId) dispatch(fetchBilletById(enteteId));
      setModalOpen(false);
      setSelectedLigne(null);
      if (modifApresEnvoi) toast.info(MSG_A_RESOUMETTRE);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la réservation'));
    } finally {
      setLigneSubmitting(null);
    }
  };

  const handleReporter = async (ligne: BilletLigne) => {
    if (!enteteId) return;
    try {
      await dispatch(reporterLigne(ligne.id)).unwrap();
      dispatch(fetchBilletById(enteteId));
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du report'));
    }
  };

  const handleOpenEmission = (ligne: BilletLigne) => {
    setSelectedLigneForEmission(ligne);
    setEmissionModalOpen(true);
  };

  const handleSubmitEmission = async (data: any) => {
    if (!selectedLigneForEmission || ligneSubmitting) return;

    setLigneSubmitting('EMISSION');
    try {
      await dispatch(
        emitBilletLigne({
          ligneId: selectedLigneForEmission.id,
          payload: data, // { emissionTauxChange, billets: [{billetId, numeroBillet}], pjBillets: [File, File, ...] }
        })
      ).unwrap();

      if (enteteId) dispatch(fetchBilletById(enteteId));
      setEmissionModalOpen(false);
      setSelectedLigneForEmission(null);
    } catch (err) {
      const message = messageErreur(err, "Erreur lors de l'émission");
      // « doit être 'FAIT' avant d'ajouter l'émission (statut actuel : CLOTURER) » : une requête précédente
      // a déjà émis la ligne → on recharge au lieu d'afficher un échec
      if (message.includes("avant d'ajouter l'émission") && message.includes('CLOTURER')) {
        if (enteteId) dispatch(fetchBilletById(enteteId));
        setEmissionModalOpen(false);
        setSelectedLigneForEmission(null);
        toast.info('La ligne est déjà émise');
      } else {
        toast.error(message);
      }
    } finally {
      setLigneSubmitting(null);
    }
  };

  const billetLignes = billet?.billetLigne;

  // On filtre uniquement les lignes "actives" (on ignore ANNULATION et ANNULER)
  const lignesActives = billetLignes?.filter(
    l => l.statusLigne !== 'ANNULATION' && l.statusLigne !== 'ANNULER'
  ) ?? [];

  // Parmi les lignes actives, on vérifie les statuts
  const allLinesReservation = lignesActives.length > 0 &&
    lignesActives.every(l => l.statut === 'FAIT' || l.statut === 'MODIFIER' || l.statut === 'ANNULER');

  // Émission possible seulement quand toutes les lignes sont traitées (CLOTURER, MODIFIER ou ANNULER)
  // et qu'au moins une est CLOTURER (sinon il n'y a rien à émettre)
  const allLinesEmission = lignesActives.length > 0 &&
    lignesActives.every(l => l.statut === 'CLOTURER' || l.statut === 'MODIFIER' || l.statut === 'ANNULER') &&
    lignesActives.some(l => l.statut === 'CLOTURER');

  // Le statut n'avance plus ici : il change plus tard, quand Odoo valide. On recharge quand même
  // le billet après l'envoi (succès ou échec) pour afficher le nouvel état dans odooEnvois.
  const handleSoumettreVente = async (billetId: string) => {
    if (!enteteId || envoiOdooEnCours) return;
    setEnvoiOdooEnCours('VENTE');
    try {
      await dispatch(soumettreVenteOdoo({ enteteId: billetId })).unwrap();
      toast.success('Dossier envoyé à Odoo, en attente de validation');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : "Erreur lors de l'envoi de la vente à Odoo");
    } finally {
      setEnvoiOdooEnCours(null);
      dispatch(fetchBilletById(enteteId));
    }
  };

  // Rejette avec le message du back : EmissionBilletModal l'affiche et reste ouverte (« Confirmer » = renvoyer)
  const handleSoumettreAchat = async (referenceBcClient: string) => {
    if (!billet?.id || !enteteId) return;
    setEnvoiOdooEnCours('ACHAT');
    try {
      await dispatch(soumettreAchatOdoo({ billetId: billet.id, referenceBcClient })).unwrap();
      toast.success('Dossier envoyé à Odoo, en attente de validation');
    } catch (err) {
      throw new Error(typeof err === 'string' ? err : "Erreur lors de l'envoi de l'achat à Odoo");
    } finally {
      setEnvoiOdooEnCours(null);
      dispatch(fetchBilletById(enteteId));
    }
  };

  // Référence BC client du dernier envoi d'achat, pour pré-remplir un renvoi
  const derniereReferenceBcClient =
    billet?.odooEnvois?.find((e) => e.eventType === 'TICKET_PURCHASE_ORDER_SUBMITTED')?.referenceBcClient ?? '';

  // ─── Regroupement ───
  const lignes = (billet?.billetLigne || []).filter((l) => l?.prospectionLigne);

  const groups = useMemo(() => {
    const map = new Map<string, {
      key: string;
      first: BilletLigne;
      lignes: BilletLigne[];
      count: number;
      allReserved: boolean;
      allEmitted: boolean;
      remainingToReserve: number;
      remainingToEmit: number;
    }>();

    lignes.forEach((ligne) => {
      const p = ligne.prospectionLigne;
      const key = [
        p?.numeroVol || '',
        p?.itineraire || '',
        p?.classe || '',
        p?.typePassager || '',
      ].join('|||');

      if (!map.has(key)) {
        map.set(key, {
          key,
          first: ligne,
          lignes: [],
          count: 0,
          allReserved: true,
          allEmitted: true,
          remainingToReserve: 0,
          remainingToEmit: 0,
        });
      }

      const g = map.get(key)!;
      g.lignes.push(ligne);
      g.count++;

      if (!ligne.reservation?.trim()) {
        g.allReserved = false;
        g.remainingToReserve++;
      }
      if (ligne.statut !== 'CLOTURER') {
        g.allEmitted = false;
        g.remainingToEmit++;
      }
    });

    return Array.from(map.values());
  }, [lignes]);

  const [ligneToAnnul, setLigneToAnnul] = useState<BilletLigne | null>(null);

  const handleAnnulerLigne = (ligne: BilletLigne) => {
    setLigneToAnnul(ligne);
    setShowAnnulModal(true);
    // Option : setAnnulType('reservation') ou autre selon ton besoin
  };

  // if (!enteteId) return <div className="p-8 text-red-600">ID du billet manquant</div>;

  // if (loading || cfLoading || cfError) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600" />
  //       <span className="ml-4 text-slate-600 font-medium">Chargement...</span>
  //     </div>
  //   );
  // }

  const isFirstLoad = initialLoad?.enteteId !== enteteId;

  if (isFirstLoad || (cfLoading && !clientFacture) || cfError) return <PageSkeleton />;

  if (!initialLoad?.ok || !billet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {/* Icône d'avertissement ou de document */}
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Billet introuvable
          </h2>
          
          <p className="text-slate-600 mb-8">
            Aucun billet n'est encore associé à cette prospection.
            Veuillez en créer un pour continuer.
          </p>

          {/* Debug info - discret */}
          <div className="text-[10px] text-slate-400 font-mono mb-8 bg-slate-50 py-2 rounded">
            REF: {enteteId}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
              <div className='flex items-center justify-between'>
                <TicketingHeader items={billetDetailItems(billet?.numeroBillet)} />
              </div>
            </div>

            <div className='px-4 bg-slate-200 rounded-b-xl'>
              {/* Infos principales */}
              <BilletInfoCards
                billet={billet}
                clientFacture={clientFacture}
                dossier={dossier}
              />

              {/* Tableau groupé avec Sous-Onglets */}
              <div className="my-2 flex items-center">
                <nav className="flex p-1 bg-slate-300 rounded-xl" aria-label="Inner Tabs">
                  {innerTabs.map((tab) => {
                    const isActive = innerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setInnerTab(tab.id)}
                        className={`
                          px-10 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                          ${isActive 
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-4">
              {/* CONTENU : BILLET */}
              {innerTab === 'billet' && (
                <BilletTable
                  loading={loading}
                  lignes={lignes}
                  groups={groups}
                  billet={billet}
                  billetLignes={billet?.billetLigne || []}
                  handleOpenReservation={handleOpenReservation}
                  handleOpenEmission={handleOpenEmission}
                  handleReprogrammer={handleReprogrammer}
                  handleRemove={handleAnnulerLigne}
                  handleReporter={handleReporter}
                  serviceById={serviceById}
                  allLinesEmission={allLinesEmission}
                  allLinesReservation={allLinesReservation}
                  envoiOdooEnCours={envoiOdooEnCours}
                  onApprouver={() => handleSoumettreVente(billet.id)}
                  onShowEmission={() => setShowEmissionModal(true)}
                  onRenvoyerAchat={() => setShowEmissionModal(true)}
                  onActualiser={() => enteteId && dispatch(fetchBilletById(enteteId))}
                  onAnnulerReservation={() => {
                    setAnnulType('reservation');
                    setShowAnnulModal(true);
                  }}
                  onAnnulerEmission={() => {
                    setAnnulType('emission');
                    setShowAnnulModal(true);
                  }}
                />
              )}

              {/* Onglet SERVICES */}
              {innerTab === 'services' && (
                <ServiceTable
                  lignes={lignes}
                  groups={groups}
                  serviceById={serviceById}
                  typeFilter="SERVICE"
                />
              )}

              {/* Onglet SPÉCIFIQUE */}
              {innerTab === 'specifique' && (
                <ServiceTable
                  lignes={lignes}
                  groups={groups}
                  serviceById={serviceById}
                  typeFilter="SPECIFIQUE"
                />
              )}

              {/* CONTENU : SUIVI (Déplacé ici pour correspondre à l'image) */}
              {innerTab === 'suivi' && (
                <SuiviTabSection
                    prestationId={enteteId || ''}
                    moduleName="ticketing"
                  />
              )}
            </div>

            {/* Monté seulement à l'ouverture pour repartir de la dernière référence envoyée */}
            {showEmissionModal && (
              <EmissionBilletModal
                isOpen={showEmissionModal}
                initialReference={derniereReferenceBcClient}
                onClose={() => setShowEmissionModal(false)}
                onConfirm={handleSoumettreAchat}
              />
            )}

            {showReprogModal && (
            <>
              { selectedLigneForReprog && (
                <ReprogrammationModal
                  isOpen={showReprogModal}
                  onClose={() => {
                    setShowReprogModal(false);
                    setSelectedLigneForReprog(null);
                  }}
                  onSubmit={async (payload) => {
                  if (!billet?.id || !selectedLigneForReprog) return;

                  setReprogSubmitting(true);
                  try {
                    await dispatch(
                      reprogrammerLigne({
                        billetId: billet.id,                    // ← ID ENTÊTE ici (dans l'URL)
                        payload,
                      })
                    ).unwrap();

                    toast.success('Ligne reprogrammée');
                    if (billet.odooEnvois?.length) toast.info(MSG_A_RESOUMETTRE);
                    setShowReprogModal(false);
                    setSelectedLigneForReprog(null);
                    dispatch(fetchBilletById(enteteId!));
                  } catch (err) {
                    // La modal reste ouverte : la saisie n'est pas perdue, l'utilisateur peut corriger
                    // (le backend garantit que rien n'est enregistré en cas d'échec).
                    toast.error(messageErreur(err, 'Erreur lors de la reprogrammation'));
                  } finally {
                    setReprogSubmitting(false);
                  }
                }}
                  ligne={selectedLigneForReprog}
                  loading={reprogSubmitting}
                  serviceById={serviceById}
                />
              )}
              </>
            )}

            {/* Modals */}
            {/* Monté à chaque ouverture (key) : la modal s'initialise avec la ligne choisie (modif d'une ligne FAIT) */}
            {selectedLigne && modalOpen && (
              <ReservationModal
                key={selectedLigne.id}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmitReservation}
                ligne={selectedLigne}
                loading={ligneSubmitting === 'RESA'}
              />
            )}

            {selectedLigneForEmission && (
              <EmissionModal
                isOpen={emissionModalOpen}
                onClose={() => setEmissionModalOpen(false)}
                onSubmit={handleSubmitEmission}
                ligne={selectedLigneForEmission}
                numeroBillet={billet?.numeroBillet || ''}
                loading={ligneSubmitting === 'EMISSION'}
              />
            )}

            {selectedBenefId && (
              <BeneficiaireInfosModal
                isOpen={infosModalOpen}
                onClose={() => setInfosModalOpen(false)}
                infos={beneficiaireInfosList}
                beneficiaireName={selectedBenefName}
                loading={infosLoading}
                error={infosError}
              />
            )}

            {showAnnulModal && billet && (
              <AnnulationBilletModal
                isOpen={showAnnulModal}
                onClose={() => {
                  setShowAnnulModal(false);
                  setLigneToAnnul(null);
                  setAnnulType(null);
                }}
                onSubmit={async (payload: AnnulationBilletPayload) => {
                  if (!billet?.id || annulLoading) return;
                  setAnnulLoading(true);
                  try {
                    // Même route avant et après émission ; la ligne à annuler est dans payload.id
                    await dispatch(annulerBillet({ billetId: billet.id, payload })).unwrap();
                    toast.success('Ligne annulée');
                    if (billet.odooEnvois?.length) toast.info(MSG_A_RESOUMETTRE);
                    dispatch(fetchBilletById(enteteId!));
                  } catch (err) {
                    toast.error(messageErreur(err, "Erreur lors de l'annulation"));
                  } finally {
                    setAnnulLoading(false);
                    setShowAnnulModal(false);
                    setLigneToAnnul(null);
                    setAnnulType(null);
                  }
                }}
                lignes={ligneToAnnul ? [ligneToAnnul] : billet?.billetLigne ?? []}
                type={annulType ?? 'reservation'}
                loading={annulLoading}
                enteteId={billet?.id ?? ''}
              />
            )}
          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default Billet;