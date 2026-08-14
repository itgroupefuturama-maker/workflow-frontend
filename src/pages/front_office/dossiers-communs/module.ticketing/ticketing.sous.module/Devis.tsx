import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiCheckCircle, FiChevronDown, FiChevronRight, FiEye, FiMoreVertical, FiRefreshCw, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { approuverDirectionDevis, fetchDevisByEntete, updateApprouverDevisStatut, updateValidateDevisStatut, type Ligne } from '../../../../../app/front_office/devisSlice';
import { annulerDevis } from '../../../../../app/front_office/devisSlice';
import axios from '../../../../../service/Axios';
import TabContainer from '../../../../../layouts/TabContainer';
import AnnulationDevisModal from '../../../../../components/modals/AnnulationDevisModal';
import { API_URL } from '../../../../../service/env';
import { TicketingHeader } from './components.billet/TicketingHeader';
import { devisListeItems } from './components.billet/utils/ticketingHeaderItems';
import { PdfDownloadButton } from '../../module.pdf/pdf.generation/components/PdfDownloadButton';

const useAppDispatch = () => useDispatch<AppDispatch>();

/* ------------------------------------------------------------------ */
/*  Badge de statut                                                    */
/* ------------------------------------------------------------------ */
const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  CREER:               { label: 'Créé',       className: 'bg-slate-100 text-slate-600 border-slate-200' },
  DEVIS_A_APPROUVER:   { label: 'À approuver', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  DEVIS_APPROUVE:      { label: 'Approuvé',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANNULER:             { label: 'Annulé',      className: 'bg-red-50 text-red-700 border-red-200' },
};

function StatusBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[11px] font-medium whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions par ligne : un bouton principal contextuel (texte) +       */
/*  un menu "..." pour les actions secondaires                         */
/* ------------------------------------------------------------------ */
type PrimaryAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant: 'primary' | 'success' | 'neutral';
  loading?: boolean;
} | null;

function getPrimaryAction(
  statut: string,
  handlers: {
    onEnvoyerDirection: () => void;
    onEnvoyerClient: () => void;
    onApprouverClient: () => void;
    onTransformer: () => void;
  },
  _directionLoading: boolean
): PrimaryAction {
  switch (statut) {
    case 'CREER':
      // Deux actions possibles au même statut : on affiche la plus fréquente
      // en principal, l'autre part dans le menu "..."
      return {
        label: 'Envoyer au client',
        icon: <FiCheckCircle size={14} />,
        onClick: handlers.onEnvoyerClient,
        variant: 'success',
      };
    case 'DEVIS_A_APPROUVER':
      return {
        label: 'Approuver / Client',
        icon: <FiCheck size={14} />,
        onClick: handlers.onApprouverClient,
        variant: 'primary',
      };
    case 'DEVIS_APPROUVE':
      return {
        label: 'Transformer / Billet',
        icon: <FiRefreshCw size={14} />,
        onClick: handlers.onTransformer,
        variant: 'success',
      };
    default:
      return null; // ANNULER -> pas d'action principale
  }
}

function PrimaryActionButton({ action }: { action: PrimaryAction }) {
  if (!action) return <span className="text-xs text-slate-300 italic px-2">—</span>;
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    neutral: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  };
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-60 ${variants[action.variant]}`}
    >
      {action.loading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/70 border-t-transparent" /> : action.icon}
      {action.loading ? 'En cours…' : action.label}
    </button>
  );
}

const ROW_MENU_WIDTH = 208; // w-52

function RowMenu({ items, onOpen }: { items: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }[]; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Ferme le menu si la ligne défile hors de l'écran, pour éviter qu'il reste affiché ailleurs.
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const menuHeight = items.length * 34 + 8;

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) {
        onOpen?.();
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) {
          const openUpward = rect.bottom + menuHeight > window.innerHeight;
          setPosition({
            top: openUpward ? rect.top - menuHeight : rect.bottom + 4,
            left: rect.right - ROW_MENU_WIDTH,
          });
        }
      }
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Plus d'actions"
      >
        <FiMoreVertical size={16} />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: position.top, left: position.left, width: ROW_MENU_WIDTH }}
          className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={() => { item.onClick(); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Devis () {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { enteteId } = useParams<{ enteteId: string }>();

  const { items: devisList, loading, error } = useSelector((state: RootState) => state.devis);
  const [openDevisId, setOpenDevisId] = useState<string | null>(null);

  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [selectedDevisForCancel, setSelectedDevisForCancel] = useState<any | null>(null);
  const [annulationLoading, setAnnulationLoading] = useState(false);

  const [directionLoading, setDirectionLoading] = useState<{ [key: string]: boolean }>({});

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet', label: 'Listes des billets' }
  ];

  const [showValidateModal, setShowValidateModal] = useState(false);
  const [pendingValidateId, setPendingValidateId] = useState<string | null>(null);
  const [preuveClient, setPreuveClient] = useState<File | null>(null);
  const [preuveClientPreview, setPreuveClientPreview] = useState<string | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('prospection');

  const handleTabChange = (id: string) => {
    if (id === 'billet') {
      navigate(`/dossiers-communs/ticketing/pages`, { state: { targetTab: 'billet' } });
    } else {
      setActiveTab(id);
    }
  };

  useEffect(() => {
    if (enteteId) {
      dispatch(fetchDevisByEntete(enteteId));
    }
  }, [enteteId, dispatch]);

  const toggleDevis = (devisId: string) => {
    setOpenDevisId(openDevisId === devisId ? null : devisId);
  };

  const handleAsAapprouved = async (billetId: string) => {
    if (!enteteId) return;
    try {
      await dispatch(updateApprouverDevisStatut({ enteteId: billetId })).unwrap();
      dispatch(fetchDevisByEntete(enteteId));
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleAsValidate = (billetId: string) => {
    setPendingValidateId(billetId);
    setPreuveClient(null);
    setPreuveClientPreview(null);
    setShowValidateModal(true);
  };

  const handleConfirmValidate = async () => {
    if (!pendingValidateId || !enteteId) return;
    setValidateLoading(true);
    try {
      await dispatch(
        updateValidateDevisStatut({ enteteId: pendingValidateId, preuveClient })
      ).unwrap();
      dispatch(fetchDevisByEntete(enteteId));
      setShowValidateModal(false);
      setPendingValidateId(null);
      setPreuveClient(null);
      setPreuveClientPreview(null);
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    } finally {
      setValidateLoading(false);
    }
  };

  const handleApprouverDirection = async (devisId: string, reference: string) => {
    if (!enteteId) return;
    if (!window.confirm(`Envoyer le devis ${reference} à la direction ?\nCela générera le PDF commission.`)) return;

    setDirectionLoading((prev) => ({ ...prev, [devisId]: true }));
    try {
      const payload = {
        client: "CLIENT EXAMPLE SAS",
        facture: `FACT-${new Date().getFullYear()}-${reference.split('-')[2] || 'XXXX'}`,
      };
      const result = await dispatch(
        approuverDirectionDevis({ devisId, client: payload.client, facture: payload.facture })
      ).unwrap();

      const filepath = result?.data?.filepath;
      if (filepath) {
        const pdfUrl = `${API_URL}/${filepath}`;
        window.open(pdfUrl, '_blank');
        dispatch(fetchDevisByEntete(enteteId));
      } else {
        throw new Error('Chemin du PDF non reçu');
      }
    } catch (err: any) {
      console.error('Erreur approuver direction :', err);
      alert('Erreur : ' + (err.message || 'Impossible de générer le PDF commission'));
    } finally {
      setDirectionLoading((prev) => ({ ...prev, [devisId]: false }));
    }
  };

  if (!enteteId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-red-600">
        ID de l'en-tête manquant dans l'URL
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 px-4 bg-white">
              <TicketingHeader items={devisListeItems(enteteId)} />
            </div>

            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600"></div>
                <span className="ml-3 text-sm text-slate-500 font-medium">Chargement des devis…</span>
              </div>
            )}

            {error && !loading && (
              <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <strong>Erreur :</strong> {error}
              </div>
            )}

            {!loading && !error && (
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                {devisList.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center mt-4">
                    <p className="text-slate-500 text-sm">Aucun devis généré pour cet en-tête.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-3">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr className="border-b border-slate-200">
                          <th className="w-8"></th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Référence</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Créé le</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fournisseur</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Type de vol</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Commission Appliquée</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Commission Proposée</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                          <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                          <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Preuve client</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devisList.map((devis) => {
                          const entete = devis.data?.entete || {};
                          const prospectionEntete = devis.prospectionEntete || {};
                          const lignes = devis.data?.lignes || [];
                          const isOpen = openDevisId === devis.id;

                          const handleCreateBillet = async () => {
                            try {
                              const payload = {
                                devisId: devis.id,
                                prospectionEnteteId: entete.id,
                              };
                              const response = await axios.post('/billet/entete', payload);
                              if (response.data?.success && response.data?.data?.id) {
                                navigate(`/dossiers-communs/ticketing/pages/billet/${devis.id}?prospectionEnteteId=${devis.data?.entete?.id}`);
                              } else {
                                alert('Erreur lors de la création du billet');
                              }
                            } catch (err: any) {
                              console.error('Erreur création billet:', err);
                              const msg = err.response?.data?.message || 'Erreur serveur';
                              alert(`Échec création billet : ${msg}`);
                            }
                          };

                          return (
                            <>
                              <tr
                                key={devis.id}
                                onClick={() => toggleDevis(devis.id)}
                                className={`border-b border-slate-100 cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                              >
                                <td className="pl-4">
                                  {isOpen ? <FiChevronDown size={14} className="text-slate-400" /> : <FiChevronRight size={14} className="text-slate-400" />}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800">{devis.reference}</td>
                                <td className="px-4 py-3 text-slate-500">
                                  {new Date(devis.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{entete.fournisseur?.libelle || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{entete.typeVol || '—'}</td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                  {entete.commissionAppliquer != null ? `${entete.commissionAppliquer} %` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                  {entete.commissionPropose != null ? `${entete.commissionPropose} %` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-slate-800">
                                  {devis.totalGeneral.toLocaleString('fr-FR')} Ar
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <StatusBadge statut={devis.statut} />
                                </td>
                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  {prospectionEntete?.preuveClient ? (
                                    <a
                                      href={`${API_URL}/${prospectionEntete.preuveClient}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center"
                                    >
                                      <img
                                        src={`${API_URL}/${prospectionEntete.preuveClient}`}
                                        alt="Preuve client"
                                        className="h-9 w-14 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity"
                                      />
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <PrimaryActionButton
                                      action={getPrimaryAction(
                                        devis.statut,
                                        {
                                          onEnvoyerDirection: () => handleApprouverDirection(devis.id, devis.reference),
                                          onEnvoyerClient: () => handleAsAapprouved(devis.id),
                                          onApprouverClient: () => handleAsValidate(devis.id),
                                          onTransformer: handleCreateBillet,
                                        },
                                        !!directionLoading[devis.id]
                                      )}
                                    />
                                    <PdfDownloadButton
                                    data={devis}                           // ← devis est déjà un DevisListItem
                                    filename={`${devis.reference}.pdf`}
                                  />
                                    <RowMenu
                                      onOpen={() => setOpenDevisId(devis.id)}
                                      items={[
                                        {
                                          label: 'Envoyer à la direction',
                                          icon: <FiCheck size={14} />,
                                          disabled: devis.statut !== 'CREER',
                                          onClick: () => handleApprouverDirection(devis.id, devis.reference),
                                        },
                                        {
                                          label: 'Voir les billets',
                                          icon: <FiEye size={14} />,
                                          disabled: devis.statut !== 'DEVIS_APPROUVE',
                                          onClick: () => navigate(`/dossiers-communs/ticketing/pages/billet/${devis.id}?prospectionEnteteId=${devis.data?.entete?.id}`),
                                        },
                                        {
                                          label: 'Annuler le devis',
                                          icon: <FiX size={14} />,
                                          danger: true,
                                          disabled: devis.statut === 'ANNULER' || devis.statut === 'DEVIS_APPROUVE',
                                          onClick: () => {
                                            setSelectedDevisForCancel(devis);
                                            setShowAnnulationModal(true);
                                          },
                                        },
                                      ]}
                                    />
                                  </div>
                                </td>
                              </tr>

                              {isOpen && (
                                <tr className="bg-slate-50/60">
                                  <td colSpan={11} className="px-4 pb-5 pt-1">
                                    {lignes.length > 0 ? (
                                      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                                        <table className="min-w-full text-xs">
                                          <thead className="bg-slate-50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wide">Vol & itinéraire</th>
                                              <th className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wide">Passager / classe</th>
                                              <th className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wide">Horaires</th>
                                              <th className="px-3 py-2 text-right font-medium text-emerald-600 uppercase tracking-wide">Tarif compagnie</th>
                                              <th className="px-3 py-2 text-right font-medium text-indigo-500 uppercase tracking-wide">Tarif client</th>
                                              <th className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wide">Services & conditions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {lignes.map((ligne: Ligne) => (
                                              <tr key={ligne.id} className="hover:bg-slate-50/60">
                                                <td className="px-3 py-2">
                                                  <p className="font-medium text-indigo-600">{ligne.numeroVol || 'N/A'}</p>
                                                  <p className="text-slate-600 mt-0.5">{ligne.itineraire}</p>
                                                  <p className="text-slate-400 mt-1 text-[10px] uppercase">Réf : {ligne.numeroDosRef || '—'}</p>
                                                </td>
                                                <td className="px-3 py-2">
                                                  <p className="text-slate-600">{ligne.typePassager}</p>
                                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                                                    Classe {ligne.classe}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                  <p>Départ : {new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                                  <p>Arrivée : {ligne.dateHeureArrive ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', { timeStyle: 'short' }) : '—'}</p>
                                                  <p className="text-indigo-400 font-medium text-[10px] uppercase mt-1">
                                                    {ligne.avion || 'N/A'} · {ligne.aeroportDepart || 'N/A'} → {ligne.aeroportArrivee || 'N/A'}
                                                  </p>
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700">
                                                  {(ligne.montantBilletCompagnieDevise + ligne.montantServiceCompagnieDevise).toLocaleString()} {ligne.devise}
                                                </td>
                                                <td className="px-3 py-2 text-right text-indigo-700 font-medium">
                                                  {(ligne.montantBilletClientDevise + ligne.montantServiceClientDevise).toLocaleString()} {ligne.devise}
                                                </td>
                                                <td className="px-3 py-2">
                                                  <div className="flex flex-wrap gap-1">
                                                    {ligne.serviceProspectionLigne?.length > 0
                                                      ? ligne.serviceProspectionLigne.map((svc) => (
                                                          <span key={svc.id} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-medium rounded border border-indigo-100">
                                                            {svc.serviceSpecifique?.libelle}: {svc.valeur === 'true' ? 'Oui' : svc.valeur === 'false' ? 'Non' : svc.valeur}
                                                          </span>
                                                        ))
                                                      : <span className="text-slate-300 italic text-[10px]">Aucun service</span>}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic py-3">Aucune ligne dans ce devis</p>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {selectedDevisForCancel && (
              <AnnulationDevisModal
                isOpen={showAnnulationModal}
                onClose={() => {
                  setShowAnnulationModal(false);
                  setSelectedDevisForCancel(null);
                }}
                onSubmit={async (data) => {
                  if (!selectedDevisForCancel) return;
                  setAnnulationLoading(true);
                  try {
                    await dispatch(annulerDevis({ devisId: selectedDevisForCancel.id, payload: data })).unwrap();
                    if (enteteId) dispatch(fetchDevisByEntete(enteteId));
                    setShowAnnulationModal(false);
                    setSelectedDevisForCancel(null);
                  } catch (err: any) {
                    alert(err || 'Erreur lors de l\'annulation');
                  } finally {
                    setAnnulationLoading(false);
                  }
                }}
                lignes={selectedDevisForCancel?.data?.lignes || []}
                loading={annulationLoading}
              />
            )}

            {showValidateModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <FiCheck size={18} />
                        Approuver le devis
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vous pouvez joindre une preuve d'accord client (optionnel)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowValidateModal(false);
                        setPendingValidateId(null);
                        setPreuveClient(null);
                        setPreuveClientPreview(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded transition-colors"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-700">
                      Confirmez-vous l'approbation du devis par le client ?
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Preuve client <span className="text-gray-400 font-normal">(image optionnelle)</span>
                      </label>
                      <label className="cursor-pointer group block">
                        <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                          preuveClient ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-white'
                        }`}>
                          <div className="flex flex-col items-center gap-2">
                            {preuveClient ? (
                              <FiCheckCircle size={28} className="text-green-500" />
                            ) : (
                              <svg className="w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5" />
                              </svg>
                            )}
                            <p className="text-sm font-medium text-gray-700">
                              {preuveClient ? preuveClient.name : 'Cliquez pour choisir une image'}
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, WEBP — max 5 Mo</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPreuveClient(file);
                            setPreuveClientPreview(file ? URL.createObjectURL(file) : null);
                          }}
                        />
                      </label>
                    </div>

                    {preuveClientPreview && (
                      <div className="relative inline-block">
                        <img
                          src={preuveClientPreview}
                          alt="Aperçu preuve client"
                          className="w-full max-h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => { setPreuveClient(null); setPreuveClientPreview(null); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowValidateModal(false);
                        setPendingValidateId(null);
                        setPreuveClient(null);
                        setPreuveClientPreview(null);
                      }}
                      disabled={validateLoading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleConfirmValidate}
                      disabled={validateLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validateLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          En cours...
                        </>
                      ) : (
                        <>
                          <FiCheck size={16} />
                          Confirmer l'approbation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </TabContainer>
    </div>
  );
}