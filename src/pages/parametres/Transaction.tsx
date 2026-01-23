import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTransaction,
  updateTransaction,
  activateTransaction,
  deactivateTransaction,
  deleteTransaction,
} from '../../app/back_office/transactionsSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Transaction } from '../../app/back_office/transactionsSlice';
import type { ModuleRef } from '../../app/back_office/commissionsSlice';
import { FiPlus, FiCalendar,  FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiArrowLeft} from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const TransactionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: transactions, loading: transLoading } = useSelector((state: RootState) => state.transactions);
  const { data: modules, loading: modulesLoading } = useSelector((state: RootState) => state.modules);
  const { data: types, loading: typesLoading } = useSelector((state: RootState) => state.transactionTypes);
  const { data: fournisseurs } = useSelector((state: RootState) => state.fournisseurs);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrans, setEditingTrans] = useState<Transaction | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  // const [dateApplication, setDateApplication] = useState('');

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  const loading = transLoading || modulesLoading || typesLoading;
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const closeModals = () => {
    setIsModalOpen(false);
    setEditingTrans(null);
    setSelectedModuleId('');
    setSelectedTypeId('');
    // setDateApplication('');
    setSelectedFournisseurId('');
    setMessage({ text: '', isError: false });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    // Date du jour au format ISO (ex: 2026-01-05T10:30:00.000Z)
    const today = new Date().toISOString();

    const basePayload = {
      moduleId: selectedModuleId,
      transactionId: selectedTypeId,
      dateApplication: today, // ← Automatique !
      fournisseurId: selectedFournisseurId || undefined,
    };

    let action;
    if (editingTrans) {
      action = updateTransaction({
        id: editingTrans.id,
        ...basePayload,
      });
    } else {
      action = createTransaction(basePayload);
    }

    const result = await dispatch(action);

    if (createTransaction.fulfilled.match(result) || updateTransaction.fulfilled.match(result)) {
      setMessage({ text: editingTrans ? 'Transaction mise à jour !' : 'Transaction planifiée !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Une erreur est survenue.', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn({ id }));
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette transaction ?')) return;
    setIsSubmitting(true);
    await dispatch(deleteTransaction({ id }));
    setIsSubmitting(false);
  };

  const openEdit = (trans: Transaction) => {
    setEditingTrans(trans);
    setSelectedModuleId(trans.moduleId || '');
    setSelectedTypeId(trans.transactionId || trans.transactiontype?.id || '');
    // setDateApplication(trans.dateApplication.slice(0, 16));
    setSelectedFournisseurId(trans.fournisseur?.id || ''); // ← Pré-sélection
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global pour actions rapides */}
      {isSubmitting && !isModalOpen && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mise à jour...</p>
          </div>
        </div>
      )}

      {/* BARRE DE RECHERCHE GLOBALE */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher une transaction, un module, un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiCalendar className="text-indigo-600" /> Transaction
            </h2>
            <p className="text-gray-500 font-medium italic">Programmez l'exécution des flux de transactions par module.</p>
          </div>
        </div>
        <button
          onClick={() => { closeModals(); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouvel Transaction
        </button>
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        {/* Wrapper pour le scroll horizontal */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
              <tr className="uppercase text-[10px] font-black text-gray-400 tracking-[0.15em]">
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Code Prestation</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Prestation</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Fournisseur</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Statut</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Date App.</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Type Transaction</th>
                <th className="px-6 py-5 text-left border-b border-gray-100 whitespace-nowrap">Evénement</th>
                {/* Colonnes de processus groupées visuellement par une couleur de fond légère */}
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">Approb. BC Client</th>
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">Facture Client</th>
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">BC Fourn.</th>
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">Approb. BC Fourn.</th>
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">BR Fourn.</th>
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">Facture Fourn.</th>
                {/* Colonne Actions FIGÉE à droite */}
                <th className="px-4 py-5 text-center border-b border-gray-100 bg-indigo-50/30 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white font-medium">
              {transactions
              .filter((trans) => {
                if (!searchQuery) return true;

                const query = searchQuery.toLowerCase();
                return (
                  trans.module?.nom.toLowerCase().includes(query) ||
                  trans.module?.code.toLowerCase().includes(query) ||
                  trans.transactiontype?.transactionType.toLowerCase().includes(query) ||
                  trans.transactiontype?.event.toLowerCase().includes(query) ||
                  trans.fournisseur?.libelle.toLowerCase().includes(query) ||
                  trans.fournisseur?.code.toLowerCase().includes(query) ||
                  trans.status.toLowerCase().includes(query)
                );
              })
              .map((trans) => (
              <tr key={trans.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.module?.code}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.module?.nom}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.fournisseur?.libelle}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    trans.status === 'ACTIF' ? 'bg-green-100 text-green-700' :
                    trans.status === 'CREER' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      trans.status === 'ACTIF' ? 'bg-green-500' :
                      trans.status === 'CREER' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`} />
                    {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                    {trans.status === 'CREER' ? 'Créé' : trans.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{new Date(trans.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.transactionType}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.event}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.approbation_BC_Client}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.creation_Facture_Client}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.creation_BC_Fournisseur}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.approbation_BC_Fournisseur}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.creation_BR_Fournisseur}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className="block text-[10px] text-indigo-500 font-mono uppercase">{trans.transactiontype?.creation_Facture_Fournisseur}</span>
                </td>
                <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-4 text-[11px] font-black uppercase">
                  <button onClick={() => openEdit(trans)} className="text-blue-600 hover:underline">Modifier</button>
                  <button
                      onClick={() => handleAction(trans.status === 'ACTIF' ? deactivateTransaction : activateTransaction, trans.id)}
                      className={trans.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                  >
                    {trans.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => { setAuditEntityId(trans.id); setAuditEntityName(trans.transactiontype?.transactionType || 'N/A'); }} className="text-purple-600 hover:underline">Tracer</button>
                  <button onClick={() => handleDelete(trans.id)} className="text-red-500 hover:underline border-l border-gray-100 pl-4">Supprimer</button>
                </div>
              </td>
              </tr>
              ))}
              </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 flex flex-col items-center justify-center bg-white border-t border-gray-50">
            <FiLoader className="animate-spin text-indigo-600 mb-3" size={24} />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chargement des données...</span>
          </div>
        )}
      </div>

      {/* MODALE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {editingTrans ? 'Modifier Plan' : 'Nouveau Plan'}
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600 transition-colors"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Module cible</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                >
                  <option value="">Sélectionner un module...</option>
                  {modules.map((m: ModuleRef) => (
                    <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Type de Flux</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                >
                  <option value="">Sélectionner un type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.transactionType} — {t.event}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Fournisseur associé
                </label>
                <select
                  value={selectedFournisseurId}
                  onChange={(e) => setSelectedFournisseurId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                >
                  <option value="">Aucun fournisseur (désassocier)</option>
                  {fournisseurs
                    .filter(f => f.status === 'ACTIF' || f.status === 'CREER')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.libelle} ({f.code})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  {selectedFournisseurId 
                    ? 'Ce prestataire sera lié à cette transaction.' 
                    : 'Aucun prestataire spécifique pour cette transaction.'}
                </p>
              </div>

              {/* <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date d'application</label>
                <input
                  type="datetime-local"
                  value={dateApplication}
                  onChange={(e) => setDateApplication(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div> */}

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />} {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 border border-gray-100 rounded-2xl font-bold text-gray-400">Annuler</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : editingTrans ? 'Mettre à jour' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="TRANSACTION"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default TransactionPage;