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
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiTag, FiTruck, FiArrowLeft} from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const FournisseurPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: fournisseurs, loading, error: globalError } = useSelector((state: RootState) => state.fournisseurs);
  const { data: transactions } = useSelector((state: RootState) => state.transactions);

  useEffect(() => {
    dispatch(fetchFournisseurs());
  }, [dispatch]);

  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  const [libelle, setLibelle] = useState('');
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

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

        setMessage({ text: 'Fournisseur mis à jour avec succès !', isError: false });
      } else {
        // Création (inchangée)
        const result = await dispatch(createFournisseur({
          libelle,
          transactionIds: selectedTransactionIds.length > 0 ? selectedTransactionIds : undefined,
        }));
        if (createFournisseur.fulfilled.match(result)) {
          setMessage({ text: 'Fournisseur créé avec succès !', isError: false });
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
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* OVERLAY DE CHARGEMENT GLOBAL */}
      {isSubmitting && (
        <div className="fixed inset-0 z-100 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 flex flex-col items-center gap-4">
            <FiLoader className="text-indigo-600 animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mise à jour en cours...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Fournisseurs
            </h2>
            <p className="text-gray-500 font-medium italic text-sm">Répertoire des prestataires de services.</p>
          </div>
        </div>  
        <button
          onClick={() => setActiveModal('form')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-sm"
        >
          <FiPlus size={20} /> Nouveau Fournisseur
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 font-bold">
          <FiAlertCircle size={20} /> {globalError}
        </div>
      )}

      {/* TABLEAU AVEC SCROLL RESPONSIVE */}
      <div className="bg-white border border-gray-100  overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-6 text-left whitespace-nowrap">Code Fournisseur</th>
                <th className="px-6 py-6 text-left whitespace-nowrap">Libellé Fournisseur / Prestataire</th>
                <th className="px-6 py-6 text-left whitespace-nowrap">Prestation / Transaction</th>
                <th className="px-6 py-6 text-center whitespace-nowrap">Date d'App.</th>
                <th className="px-6 py-6 text-center whitespace-nowrap">Statut</th>
                <th className="px-6 py-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {fournisseurs.map((fourn) => (
                <tr key={fourn.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-black bg-gray-50 text-indigo-500 px-3 py-1.5 rounded-lg border border-gray-100">
                      <FiTag size={12} /> {fourn.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FiTruck size={18} />
                      </div>
                      <span className="text-gray-900 font-bold text-sm uppercase tracking-tight">{fourn.libelle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* <div className="p-2.5 bg-indigo-50 text-blue-600 rounded-xl border border-indigo-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FiTruck size={18} />
                      </div> */}
                      <span className="text-gray-900 font-bold text-sm uppercase tracking-tight">
                      {fourn.transactions && fourn.transactions.length > 0 ? (
                        <ul className="space-y-1 list-disc">
                          {fourn.transactions.map((transaction) => (
                            <li key={transaction.id} className="text-xs text-gray-700">{transaction.module?.nom || 'Module inconnu'}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-gray-500 text-sm">Aucune transaction associée</span>
                      )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-[11px] font-bold text-gray-500">
                    {new Date(fourn.dateApplication).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      fourn.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                      fourn.status === 'CREER' ? 'bg-blue-100 text-blue-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        fourn.status === 'ACTIF' ? 'bg-green-500' : 
                        fourn.status === 'CREER' ? 'bg-blue-500' : 
                        'bg-red-500'
                      }`} />
                      
                      {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                      {fourn.status === 'CREER' ? 'Créé' : fourn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-[11px]">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(fourn)} title="Modifier" className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                        Modifier
                      </button>
                      <button
                        onClick={() => handleAction(fourn.status === 'ACTIF' ? deactivateFournisseur : activateFournisseur, fourn.id)}
                        title={fourn.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                        className={`p-2.5 rounded-xl transition-all ${fourn.status === 'ACTIF' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {fourn.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => { setAuditEntityId(fourn.id); setAuditEntityName(fourn.libelle); }}
                        title="Historique"
                        className="p-2.5 text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
                      >
                        Historique
                      </button>
                      <button
                        onClick={() => window.confirm('Supprimer ce fournisseur ?') && handleAction(deleteFournisseur, fourn.id)}
                        title="Supprimer"
                        className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="p-20 flex flex-col items-center justify-center bg-gray-50/30 gap-4">
            <FiLoader className="animate-spin text-indigo-600" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Chargement des données...</p>
          </div>
        )}
      </div>

      {/* MODALE DE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-800">
                  {editingFournisseur ? 'Édition' : 'Nouveau Prestataire'}
                </h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Informations du compte</p>
              </div>
              <button onClick={closeModal} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-gray-400 transition-all">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-indigo-600 transition-colors">
                  Nom du Fournisseur / Libellé
                </label>
                <input
                  type="text"
                  placeholder="ex: AIR MAD - KLM"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value.toUpperCase())}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300 uppercase"
                  required
                />
              </div>

              {/* Sélecteur de transactions */}
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Transactions associées
                </label>
                <div className="max-h-64 overflow-y-auto border-2 border-gray-100 rounded-2xl bg-gray-50 p-4">
                  {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucune transaction disponible</p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((trans) => {
                        // Déclaration correcte ici
                        const isCurrentlyAssociated = editingFournisseur 
                          ? editingFournisseur.transactions?.some(t => t.id === trans.id)
                          : false;

                        return (
                          <label
                            key={trans.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-indigo-50 cursor-pointer transition-all border border-gray-100"
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
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-sm text-gray-800">
                                {trans.module?.nom || 'Sans module'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {trans.transactiontype.transactionType} • {trans.transactiontype.event}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                                trans.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {trans.status}
                              </span>
                              {isCurrentlyAssociated && (
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">
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
                <p className="text-xs text-gray-500 mt-2">
                  {selectedTransactionIds.length} transaction{selectedTransactionIds.length > 1 ? 's' : ''} sélectionnée{selectedTransactionIds.length > 1 ? 's' : ''}
                </p>
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs animate-in slide-in-from-top-2 ${message.isError ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {message.isError ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                  {editingFournisseur ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="FOURNISSEUR"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default FournisseurPage;