import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFournisseurs,
  createFournisseur,
  updateFournisseur,
  activateFournisseur,
  deactivateFournisseur,
  deleteFournisseur,
  updateFournisseurTransactions,
  removeFournisseurTransactions,
} from '../../app/back_office/fournisseursSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Fournisseur } from '../../app/back_office/fournisseursSlice';
import {
  FiPlus,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiTag,
  FiTruck,
  FiArrowLeft,
  FiEdit2,
  FiPower,
  FiClock,
  FiTrash2,
} from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { ActionButtons, EmptyRow, LoadingRow, SectionHeader, TableWrapper } from '../../layouts/Utilitaire';
import { fetchVisaConsultats } from '../../app/front_office/parametre_visa/visaConsultatSlice';
import CreateVisaConsultatModal from '../front_office/dossiers-communs/module.visa/components/CreateVisaConsultatModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

/* ---------------------------------------------------------------------- */
/*  Petits composants utilitaires de présentation                         */
/* ---------------------------------------------------------------------- */

// Bouton d'action icône + texte, cohérent avec les autres pages de paramètres
const IconAction = ({
  icon,
  label,
  onClick,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
}) => {
  const tones: Record<string, string> = {
    neutral: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    primary: 'text-blue-600 hover:bg-blue-50',
    success: 'text-emerald-600 hover:bg-emerald-50',
    warning: 'text-amber-600 hover:bg-amber-50',
    danger: 'text-red-600 hover:bg-red-50',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight transition-colors ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
};

// Badge de statut unifié
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { dot: string; text: string; bg: string; label: string }> = {
    ACTIF: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Actif' },
    CREER: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Créé' },
  };
  const style = map[status] ?? { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: status };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

/* ---------------------------------------------------------------------- */

const FournisseurPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: fournisseurs, loading, error: globalError } = useSelector((state: RootState) => state.fournisseurs);
  const { data: transactions } = useSelector((state: RootState) => state.transactions);

  const [showConsultatModal, setShowConsultatModal] = useState(false);
  const visaConsultats = useSelector((s: RootState) => s.visaConsultat);

  useEffect(() => {
    dispatch(fetchFournisseurs());
    dispatch(fetchVisaConsultats());
  }, [dispatch]);

  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  const [libelle, setLibelle] = useState('');
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'toggle'; fournisseur: Fournisseur } | null>(null);

  const closeModal = () => {
    setActiveModal('none');
    setEditingFournisseur(null);
    setLibelle('');
    setSelectedTransactionIds([]);
    setMessage({ text: '', isError: false });
  };

  // Fonction générique pour gérer le chargement lors des actions de ligne (Activer/Supprimer/etc)
  const handleAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn(id));
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingFournisseur) {
        // 1. Mise à jour du libellé (si changé)
        if (libelle.trim() !== editingFournisseur.libelle.trim()) {
          const updateResult = await dispatch(updateFournisseur({ id: editingFournisseur.id, libelle }));
          if (!updateFournisseur.fulfilled.match(updateResult)) {
            setMessage({ text: 'Erreur lors de la mise à jour du libellé.', isError: true });
            setIsSubmitting(false);
            return;
          }
        }

        // 2. Gestion des transactions : calcul des ajouts et suppressions
        const currentTransactionIds = editingFournisseur.transactions ? editingFournisseur.transactions.map(t => t.id) : [];

        const toAdd = selectedTransactionIds.filter(id => !currentTransactionIds.includes(id));
        const toRemove = currentTransactionIds.filter(id => !selectedTransactionIds.includes(id));

        let transactionsOk = true;

        if (toAdd.length > 0) {
          const addResult = await dispatch(updateFournisseurTransactions({
            fournisseurId: editingFournisseur.id,
            transactionIds: toAdd,
          }));
          if (!updateFournisseurTransactions.fulfilled.match(addResult)) {
            transactionsOk = false;
          }
        }

        if (toRemove.length > 0) {
          const removeResult = await dispatch(removeFournisseurTransactions({
            fournisseurId: editingFournisseur.id,
            transactionIds: toRemove,
          }));
          if (!removeFournisseurTransactions.fulfilled.match(removeResult)) {
            transactionsOk = false;
          }
        }

        if (!transactionsOk) {
          setMessage({ text: 'Libellé mis à jour, mais erreur sur certaines transactions.', isError: true });
          setIsSubmitting(false);
          return;
        }

        setMessage({ text: 'Fournisseur mis à jour avec succès.', isError: false });
      } else {
        // Création (inchangée)
        const result = await dispatch(createFournisseur({
          libelle,
          transactionIds: selectedTransactionIds.length > 0 ? selectedTransactionIds : undefined,
        }));
        if (createFournisseur.fulfilled.match(result)) {
          setMessage({ text: 'Fournisseur créé avec succès.', isError: false });
        } else {
          setMessage({ text: 'Erreur lors de la création.', isError: true });
          setIsSubmitting(false);
          return;
        }
      }

      setTimeout(closeModal, 1500);
    } catch (err) {
      setMessage({ text: 'Une erreur inattendue est survenue.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (fourn: Fournisseur) => {
    setEditingFournisseur(fourn);
    setLibelle(fourn.libelle);
    setSelectedTransactionIds(fourn.transactions ? fourn.transactions.map(t => t.id) : []); // Pré-cocher les transactions associées
    setActiveModal('form');
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* OVERLAY DE CHARGEMENT GLOBAL */}
      {isSubmitting && (
        <div className="fixed inset-0 z-100 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded-xl shadow-lg flex flex-col items-center gap-3 border border-slate-200">
            <FiLoader className="text-blue-600 animate-spin" size={28} />
            <p className="text-xs font-medium text-slate-500">Mise à jour en cours…</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Fournisseurs</h2>
            <p className="text-slate-500 text-sm">Répertoire des prestataires de services</p>
          </div>
        </div>
        <button
          onClick={() => setActiveModal('form')}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors"
        >
          <FiPlus size={18} /> Nouveau fournisseur
        </button>
      </div>

      {globalError && (
        <div className="mb-6 px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2.5 text-sm font-medium">
          <FiAlertCircle size={18} className="shrink-0" /> {globalError}
        </div>
      )}

      {/* TABLEAU AVEC SCROLL RESPONSIVE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3.5 text-left whitespace-nowrap">Code</th>
                <th className="px-6 py-3.5 text-left whitespace-nowrap">Fournisseur / Prestataire</th>
                <th className="px-6 py-3.5 text-left whitespace-nowrap">Prestations</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Date d'application</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Statut</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fournisseurs.map((fourn) => (
                <tr key={fourn.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      <FiTag size={12} /> {fourn.code}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FiTruck size={16} />
                      </div>
                      <span className="text-slate-800 font-medium text-sm">{fourn.libelle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {fourn.transactions && fourn.transactions.length > 0 ? (
                      <ul className="space-y-0.5">
                        {fourn.transactions.map((transaction) => (
                          <li key={transaction.id} className="text-xs text-slate-600">
                            {transaction.module?.nom || 'Module inconnu'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="italic text-slate-400 text-xs">Aucune transaction associée</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center text-xs text-slate-500">
                    {new Date(fourn.dateApplication).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <StatusBadge status={fourn.status} />
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <IconAction icon={<FiEdit2 size={15} />} label="Modifier" tone="primary" onClick={() => openEdit(fourn)} />
                      <IconAction
                        icon={<FiPower size={15} />}
                        label={fourn.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                        tone={fourn.status === 'ACTIF' ? 'warning' : 'success'}
                        onClick={() => setConfirmAction({ type: 'toggle', fournisseur: fourn })}
                      />
                      <IconAction
                        icon={<FiClock size={15} />}
                        label="Historique"
                        onClick={() => { setAuditEntityId(fourn.id); setAuditEntityName(fourn.libelle); }}
                      />
                      <IconAction
                        icon={<FiTrash2 size={15} />}
                        label="Supprimer"
                        tone="danger"
                        onClick={() => setConfirmAction({ type: 'delete', fournisseur: fourn })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <FiLoader className="animate-spin text-blue-600" size={28} />
            <p className="text-xs text-slate-400">Chargement des données…</p>
          </div>
        )}
        {!loading && fournisseurs.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-slate-500">Aucun fournisseur enregistré</p>
            <p className="text-xs text-slate-400">Créez votre premier fournisseur pour commencer.</p>
          </div>
        )}
      </div>

      {/* LISTE DES CONSULATS */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Liste des consulats</h3>
          <SectionHeader label="Ajouter un consulat visa" onAdd={() => setShowConsultatModal(true)} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <TableWrapper headers={['Nom du consulat', 'Créé le']}>
            {visaConsultats.loading ? (
              <LoadingRow />
            ) : visaConsultats.data.length === 0 ? (
              <EmptyRow colSpan={3} />
            ) : (
              visaConsultats.data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-800 capitalize">{item.nom}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-3.5"><ActionButtons /></td>
                </tr>
              ))
            )}
          </TableWrapper>
        </div>
      </div>

      {/* MODALE DE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau prestataire'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Informations du compte</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Nom du fournisseur / libellé
                </label>
                <input
                  type="text"
                  placeholder="ex: AIR MAD - KLM"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal uppercase"
                  required
                />
              </div>

              {/* Sélecteur de transactions */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Transactions associées
                </label>
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2">
                  {transactions.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Aucune transaction disponible</p>
                  ) : (
                    <div className="space-y-1.5">
                      {transactions.map((trans) => {
                        const isCurrentlyAssociated = editingFournisseur
                          ? editingFournisseur.transactions?.some(t => t.id === trans.id)
                          : false;

                        return (
                          <label
                            key={trans.id}
                            className="flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-blue-50/60 cursor-pointer transition-colors border border-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTransactionIds.includes(trans.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTransactionIds([...selectedTransactionIds, trans.id]);
                                } else {
                                  setSelectedTransactionIds(selectedTransactionIds.filter(id => id !== trans.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">
                                {trans.module?.nom || 'Sans module'}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {trans.transactiontype?.transactionType ?? '—'} • {trans.transactiontype?.event ?? '—'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                trans.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {trans.status}
                              </span>
                              {isCurrentlyAssociated && (
                                <span className="text-[10px] font-medium text-blue-600">
                                  Déjà associé
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {selectedTransactionIds.length} transaction{selectedTransactionIds.length > 1 ? 's' : ''} sélectionnée{selectedTransactionIds.length > 1 ? 's' : ''}
                </p>
              </div>

              {message.text && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-2.5 text-sm font-medium ${
                  message.isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {message.isError ? <FiAlertCircle size={16} className="shrink-0" /> : <FiCheckCircle size={16} className="shrink-0" />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg font-medium text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
                  {editingFournisseur ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === 'delete'
            ? 'Supprimer ce fournisseur ?'
            : confirmAction?.fournisseur.status === 'ACTIF'
            ? 'Désactiver ce fournisseur ?'
            : 'Activer ce fournisseur ?'
        }
        message={
          confirmAction?.type === 'delete'
            ? `Cette action est irréversible. Le fournisseur "${confirmAction.fournisseur.libelle}" sera définitivement supprimé.`
            : confirmAction?.fournisseur.status === 'ACTIF'
            ? `Le fournisseur "${confirmAction?.fournisseur.libelle}" ne sera plus disponible tant qu'il ne sera pas réactivé.`
            : `Le fournisseur "${confirmAction?.fournisseur.libelle}" redeviendra disponible.`
        }
        confirmLabel={
          confirmAction?.type === 'delete'
            ? 'Supprimer'
            : confirmAction?.fournisseur.status === 'ACTIF'
            ? 'Désactiver'
            : 'Activer'
        }
        tone={
          confirmAction?.type === 'delete'
            ? 'danger'
            : confirmAction?.fournisseur.status === 'ACTIF'
            ? 'warning'
            : 'primary'
        }
        isLoading={isSubmitting}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction) return;
          const { type, fournisseur } = confirmAction;
          if (type === 'delete') {
            await handleAction(deleteFournisseur, fournisseur.id);
          } else {
            await handleAction(fournisseur.status === 'ACTIF' ? deactivateFournisseur : activateFournisseur, fournisseur.id);
          }
          setConfirmAction(null);
        }}
      />

      <AuditModal
        entity="FOURNISSEUR"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />

      {showConsultatModal && <CreateVisaConsultatModal onClose={() => setShowConsultatModal(false)} />}
    </div>
  );
};

export default FournisseurPage;