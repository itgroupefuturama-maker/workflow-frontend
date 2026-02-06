import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../app/store';
import {
  fetchBilletById,
  addReservationToLigne,
  updateBilletEnteteStatut,
  type BilletLigne,
  emitBilletLigne,
  updateApprouverBilletEnteteStatut,
  emettreFactureClient,
  reglerFactureClient,
  annulerBillet,
  type AnnulationBilletPayload,
  reprogrammerLigne,
  type ServiceSpecifique,
} from '../../../../app/front_office/billetSlice';
import AnnulationBilletModal from '../../../../components/modals/AnnulationBilletModal';
import ReservationModal from '../../../../components/modals/ReservationModal';
import EmissionModal from '../../../../components/modals/EmissionModal';
import { fetchClientFactureById } from '../../../../app/back_office/clientFacturesSlice';
import BeneficiaireInfosModal from '../../../../components/modals/BeneficiaireInfosModal';
import TabContainer from '../../../../layouts/TabContainer';
import { fetchSuivis } from '../../../../app/front_office/suiviSlice';
import EmissionBilletModal from '../../../../components/modals/EmissionBilletModal';
import FactureClientModal from '../../../../components/modals/FactureClientModal';
import { fetchCommentairesByPrestation, createCommentaire, type Commentaire, updateCommentaire, deleteCommentaire } from '../../../../app/front_office/commentaireSlice';
import { deleteTodo,markAsDone } from '../../../../app/front_office/todosSlice';
import { BilletHeader } from './components.billet/BilletHeader';
import { BilletActions } from './components.billet/BilletActions';
import BilletInfoCards from './components.billet/BilletInfoCards';
import BilletTable from './components.billet/BilletTable';
import ServiceTable from './components.billet/ServiceTable';
import SuiviTab from './components.billet/SuiviTable';
import ReprogrammationModal from '../../../../components/modals/ReprogrammationModal';

const Billet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { enteteId, prestationId } = useParams<{ enteteId: string , prestationId : string}>();
  // const [searchParams] = useSearchParams();

  const [newComment, setNewComment] = useState('');
  const [creating, setCreating] = useState(false);

  // Dans le composant
  const { list: commentaires, loading: commLoading, error: commError } = useSelector(
    (state: RootState) => state.commentaire
  );
  const { items: todos, loading: todosLoading, error: todosError } = useSelector(
    (state: RootState) => state.todos
  );

  const [showAnnulModal, setShowAnnulModal] = useState(false);
  const [annulType, setAnnulType] = useState<'reservation' | 'emission' | null>(null);
  const [annulLoading, setAnnulLoading] = useState(false);

  // const prospectionEnteteId = searchParams.get('prospectionEnteteId');
  // const prestationId = searchParams.get('prestationId');

  const [activeTab, setActiveTab] = useState('billet');
  console.log(`prestationId: ${enteteId}`);

  const [showFactureModal, setShowFactureModal] = useState(false);
  const [, setFactureReference] = useState('');

  const [showEmissionModal, setShowEmissionModal] = useState(false);
  const [, setEmissionReference] = useState('');

  const [showReprogModal, setShowReprogModal] = useState(false);
  const [selectedLigneForReprog, setSelectedLigneForReprog] = useState<BilletLigne | null>(null);

  // Dans le composant Billet
  const serviceState = useSelector((state: RootState) => state.serviceSpecifique);
  const services = serviceState.items;   // ← tableau des services { id, code, libelle, type, ... }

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [updating, setUpdating] = useState(false);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet', label: 'Listes des billets' }
  ];

  const [innerTab, setInnerTab] = useState('billet');

  const innerTabs = [
    { id: 'billet', label: 'Billet' },
    { id: 'services', label: 'Services' },
    { id: 'specifique', label: 'Spécifique' },
    { id: 'suivi', label: 'Suivi' },
  ];

  const { current: billet, loading, error } = useSelector((state: RootState) => state.billet);
  const { current: clientFacture, loading: cfLoading, error: cfError } = useSelector(
    (state: RootState) => state.clientFactures
  );
  const clientFactureId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  // Selectors
  const { list: suivis, loading: suivisLoading, error: suivisError } = useSelector(
    (state: RootState) => state.suivi
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
  useEffect(() => {
    if (enteteId && billet) {
      // Option 1 : fetch global (si l'API renvoie tout)
      dispatch(fetchSuivis());
    }
  }, [dispatch, enteteId, billet]);

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchCommentairesByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  // Fonction pour démarrer l'édition
  const startEditing = (comment: Commentaire) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.commentaire);
  };

  // Fonction pour annuler l'édition
  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // Fonction pour sauvegarder la modification
  const saveEdit = async (id: string) => {
    if (!editCommentText.trim()) {
      alert('Le commentaire ne peut pas être vide');
      return;
    }

    setUpdating(true);

    try {
      await dispatch(
        updateCommentaire({
          id,
          commentaire: editCommentText.trim(),
        })
      ).unwrap();

      // Le slice met déjà à jour la liste → pas besoin de refetch
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (err: any) {
      alert('Erreur : ' + (err.message || 'Échec modification'));
    } finally {
      setUpdating(false);
    }
  };

  // Handler pour supprimer un commentaire
  const handleDeleteComment = async (id: string, commentairePreview: string) => {
    // Confirmation simple (tu peux utiliser une modale plus jolie si tu veux)
    if (!window.confirm(`Voulez-vous vraiment supprimer ce commentaire ?\n\n"${commentairePreview.substring(0, 60)}${commentairePreview.length > 60 ? '...' : ''}"`)) {
      return;
    }

    try {
      await dispatch(deleteCommentaire(id)).unwrap();
      // Le slice retire déjà l'élément → pas besoin de refetch
    } catch (err: any) {
      alert('Erreur : ' + (err.message || 'Échec suppression'));
    }
  };

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
    if (id === 'prospection') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/${billet?.prospectionEntete.prestationId}/pages`, { 
        state: { targetTab: 'prospection' }
      });
    } else {
      setActiveTab(id);
    }
  };

  // Dans Billet.tsx, avant le return
  const handleReprogrammer = (ligne: BilletLigne) => {
    console.log('handleReprogrammer appelé avec :', ligne); // ← AJOUTE ÇA

    if (!ligne || !ligne.id) {
      console.warn('Ligne invalide reçue pour reprogrammation');
      alert('Impossible de reprogrammer : ligne invalide');
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

  useEffect(() => {
    if (enteteId) dispatch(fetchBilletById(enteteId));
  }, [enteteId, dispatch]);

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
    if (!selectedLigne) return;

    // --- AJOUT DU LOG ICI ---
    console.log("Données envoyées à la réservation :", {
      ligneId: selectedLigne.id,
      payload: {
        nombre: data.nombre,
        clientbeneficiaireInfoId: data.clientbeneficiaireInfoId,
        reservation: data.reservation,
        puResaBilletCompagnieDevise: data.puResaBilletCompagnieDevise,
        puResaServiceCompagnieDevise: data.puResaServiceCompagnieDevise,
        puResaPenaliteCompagnieDevise: data.puResaPenaliteCompagnieDevise,
        devise: data.devise,
        resaTauxEchange: data.resaTauxEchange,
        puResaMontantBilletCompagnieDevise: data.puResaMontantBilletCompagnieDevise,
        puResaMontantServiceCompagnieDevise: data.puResaMontantServiceCompagnieDevise,
        puResaMontantPenaliteCompagnieDevise: data.puResaMontantPenaliteCompagnieDevise,
      },
    });
    // ------------------------

    try {
      await dispatch(
        addReservationToLigne({
          ligneId: selectedLigne.id,
          payload: {
            nombre: data.nombre,
            clientbeneficiaireInfoId: data.clientbeneficiaireInfoId,
            reservation: data.reservation,
            puResaBilletCompagnieDevise: data.puResaBilletCompagnieDevise,
            puResaServiceCompagnieDevise: data.puResaServiceCompagnieDevise,
            puResaPenaliteCompagnieDevise: data.puResaPenaliteCompagnieDevise,
            devise: data.devise,
            resaTauxEchange: data.resaTauxEchange,
            puResaMontantBilletCompagnieDevise: data.puResaMontantBilletCompagnieDevise,
            puResaMontantServiceCompagnieDevise: data.puResaMontantServiceCompagnieDevise,
            puResaMontantPenaliteCompagnieDevise: data.puResaMontantPenaliteCompagnieDevise,
          },
        })
      ).unwrap();

      if (enteteId) dispatch(fetchBilletById(enteteId));
      setModalOpen(false);
      setSelectedLigne(null);
    } catch (err: any) {
      alert('Erreur lors de la réservation : ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleOpenEmission = (ligne: BilletLigne) => {
    setSelectedLigneForEmission(ligne);
    setEmissionModalOpen(true);
  };

  const handleSubmitEmission = async (data: any) => {
    if (!selectedLigneForEmission) return;
    try {
      await dispatch(
        emitBilletLigne({
          ligneId: selectedLigneForEmission.id,
          payload: {
            emissionTauxChange: data.emissionTauxChange,
            numeroBillet: data.numeroBillet,
            pjBillet: data.pjBillet || undefined,
            puEmissionBilletCompagnieAriary: data.puEmissionBilletCompagnieAriary,
            // Ajoute les autres champs si besoin
          },
        })
      ).unwrap();

      if (enteteId) dispatch(fetchBilletById(enteteId));
      setEmissionModalOpen(false);
      setSelectedLigneForEmission(null);
    } catch (err: any) {
      alert("Erreur lors de l'émission : " + (err.message || 'Erreur inconnue'));
    }
  };

  const billetLignes = billet?.billetLigne;

  const allLinesReservation = billetLignes?.every(l => l.statut === 'FAIT' || l.statut === 'MODIFIER' || l.statut === 'ANNULER' ) ?? false;
  const allLinesEmission    = billetLignes?.every(l => l.statut === 'CLOTURER') ?? false;

  const handleMarkAsReserved = async (billetId: string) => {
    if (!enteteId) return;
    try {
      await dispatch(updateApprouverBilletEnteteStatut({ enteteId: billetId })).unwrap();
      dispatch(fetchBilletById(enteteId));
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleReglerFacture = async () => {
    if (!billet?.id) return;

    if (!confirm("Confirmez-vous que la facture a été réglée ? ")) return;

    try {
      await dispatch(reglerFactureClient(billet.id)).unwrap();

      if (enteteId) dispatch(fetchBilletById(enteteId));
      alert("Facture marquée comme réglée !");
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Échec règlement facture"));
    }
  };

  // Handler de soumission
  const handleAddComment = async () => {
    if (!newComment.trim() || !prestationId) {
      alert('Veuillez entrer un commentaire et vérifier que la prestation est chargée.');
      return;
    }

    setCreating(true);

    try {
      await dispatch(
        createCommentaire({
          commentaire: newComment.trim(),
          prestationId: prestationId,
          // date: new Date().toISOString(),   ← optionnel si l’API le gère
        })
      ).unwrap();

      setNewComment(''); // reset champ
      // Le slice ajoute déjà le nouveau commentaire → pas besoin de refetch
    } catch (err: any) {
      alert('Erreur : ' + (err.message || 'Échec création commentaire'));
    } finally {
      setCreating(false);
    }
  };

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

  if (!enteteId) return <div className="p-8 text-red-600">ID du billet manquant</div>;

  if (loading || cfLoading || cfError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600" />
        <span className="ml-4 text-slate-600 font-medium">Chargement...</span>
      </div>
    );
  }

  if (error || !billet) {
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
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
        <div className="flex-1 overflow-y-auto ">
          <BilletHeader
            numeroBillet={billet?.numeroBillet} 
            prestationId={billet?.prospectionEntete.prestationId} 
            navigate={navigate} 
          />

          <BilletActions
            billet={billet}
            allLinesEmission={allLinesEmission}
            allLinesReservation={allLinesReservation}
            onShowFacture={() => setShowFactureModal(true)}
            onRegler={handleReglerFacture}
            onApprouver={() => handleMarkAsReserved(billet.id)}
            onShowEmission={() => setShowEmissionModal(true)}
            onAnnulerReservation={() => {
              setAnnulType('reservation');
              setShowAnnulModal(true);
            }}
            onAnnulerEmission={() => {
              setAnnulType('emission');
              setShowAnnulModal(true);
            }}
          />

          {/* Infos principales */}
          <BilletInfoCards 
            billet={billet} 
            clientFacture={clientFacture} 
            dossier={dossier} 
          />

          {/* Tableau groupé avec Sous-Onglets */}
          <div className="mt-8 p-1 rounded-t-lg flex space-x-1">
            {innerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInnerTab(tab.id)}
                className={`
                  px-6 py-2 text-sm font-semibold rounded-t-lg transition-all
                  ${innerTab === tab.id 
                    ? 'bg-[#4A77BE] text-white shadow-sm' 
                    : 'bg-[#CBD5E1] text-[#1E3A8A] hover:bg-[#B9C9E0]'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden">
            {/* CONTENU : BILLET */}
            {innerTab === 'billet' && (
              <BilletTable
                lignes={lignes}
                groups={groups}
                billet={billet}
                billetLignes={billet?.billetLigne || []}
                handleOpenReservation={handleOpenReservation}
                handleOpenEmission={handleOpenEmission}
                handleReprogrammer={handleReprogrammer}
                serviceById={serviceById}   // ← AJOUT ICI
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
                typeFilter="SERVICE"
              />
            )}

            {/* CONTENU : SUIVI (Déplacé ici pour correspondre à l'image) */}
            {innerTab === 'suivi' && (
              <SuiviTab 
                // Suivis
                suivis={suivis}
                suivisLoading={suivisLoading}
                suivisError={suivisError}
                // Commentaires
                commentaires={commentaires}
                commLoading={commLoading}
                commError={commError}
                newComment={newComment}
                setNewComment={setNewComment}
                handleAddComment={handleAddComment}
                creating={creating}
                // Edition
                editingCommentId={editingCommentId}
                editCommentText={editCommentText}
                setEditCommentText={setEditCommentText}
                startEditing={startEditing}
                cancelEdit={cancelEdit}
                saveEdit={saveEdit}
                updating={updating}
                handleDeleteComment={handleDeleteComment}
                // Todos
                todos={todos}
                todosLoading={todosLoading}
                todosError={todosError}
                onMarkAsDone={(id) => dispatch(markAsDone(id))}
                onDeleteTodo={(id) => dispatch(deleteTodo(id))}
              />
            )}
          </div>

          <FactureClientModal
            isOpen={showFactureModal}
            onClose={() => {
              setShowFactureModal(false);
              setFactureReference('');
            }}
            onConfirm={async (reference) => {
              await dispatch(
                emettreFactureClient({
                  billetId: billet!.id,
                  referenceFacClient: reference,
                })
              ).unwrap();
              dispatch(fetchBilletById(enteteId!));
              alert('Facture émise avec succès');
            }}
          />

          <EmissionBilletModal
            isOpen={showEmissionModal}
            onClose={() => {
              setShowEmissionModal(false);
              setEmissionReference('');
            }}
            onConfirm={async (reference) => {
              await dispatch(
                updateBilletEnteteStatut({
                  billetId: billet!.id,
                  referenceFacClient: reference,     // ← attention : le nom du champ est peut-être trompeur
                })
              ).unwrap();
              dispatch(fetchBilletById(enteteId!));
              alert('Billet marqué comme émis avec succès');
            }}
          />

          {showReprogModal && (
          <>
            {console.log('Modal Reprogrammation rendu avec ligne :', selectedLigneForReprog)}
            { selectedLigneForReprog && (
              <ReprogrammationModal
                isOpen={showReprogModal}
                onClose={() => {
                  setShowReprogModal(false);
                  setSelectedLigneForReprog(null);
                }}
                onSubmit={async (payload) => {
                if (!billet?.id || !selectedLigneForReprog) return;

                try {
                  await dispatch(
                    reprogrammerLigne({
                      billetId: billet.id,                    // ← ID ENTÊTE ici (dans l'URL)
                      payload,
                    })
                  ).unwrap();

                  alert('Reprogrammation effectuée');
                  dispatch(fetchBilletById(enteteId!));
                } catch (err: any) {
                  alert(err?.message || 'Erreur lors de la reprogrammation');
                } finally {
                  setShowReprogModal(false);
                  setSelectedLigneForReprog(null);
                }
              }}
                ligne={selectedLigneForReprog}
                loading={false} // à connecter si tu as un loading spécifique
                serviceById={serviceById}
              />
            )}
            </>
          )}

          {/* Modals */}
          {selectedLigne && (
            <ReservationModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={handleSubmitReservation}
              ligne={selectedLigne}
            />
          )}

          {selectedLigneForEmission && (
            <EmissionModal
              isOpen={emissionModalOpen}
              onClose={() => setEmissionModalOpen(false)}
              onSubmit={handleSubmitEmission}
              ligne={selectedLigneForEmission}
              numeroBillet={billet?.numeroBillet || ''}
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

          {showAnnulModal && billet && billet.billetLigne?.length > 0 && (
            <AnnulationBilletModal
              isOpen={showAnnulModal}
              onClose={() => {
                setShowAnnulModal(false);
                setAnnulType(null);
              }}
              onSubmit={async (payload: AnnulationBilletPayload) => {
              if (!billet?.id) return;

              setAnnulLoading(true);
              try {
                await dispatch(
                  annulerBillet({
                    billetId: billet.id,
                    payload,
                  })
                ).unwrap();

                alert('Annulation effectuée avec succès');
                dispatch(fetchBilletById(enteteId!));
              } catch (err: any) {
                // ← Correction ici
                const errorMessage =
                  err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                    ? err
                    : 'Erreur inconnue lors de l\'annulation';
                console.log('Erreur capturée dans catch :', err, typeof err);

                alert(errorMessage);
                console.error('Erreur annulation détaillée :', err); // ← utile pour debug
              } finally {
                setAnnulLoading(false);
                setShowAnnulModal(false);
                setAnnulType(null);
              }
            }}
              lignes={billet?.billetLigne ?? []}           // ?? au lieu de ||  (meilleure gestion null/undefined)
              type={annulType ?? 'reservation'}
              loading={annulLoading}
              enteteId={billet?.id ?? ''}
            />
          )}
        </div>
      </div>
    </TabContainer>
  );
};

export default Billet;