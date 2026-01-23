import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDevisTransactions,
  createDevisTransaction,
  updateDevisTransaction,
  activateDevisTransaction,
  deactivateDevisTransaction,
  deleteDevisTransaction,
} from '../../app/back_office/devisTransactionsSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { DevisTransaction } from '../../app/back_office/devisTransactionsSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiFileText, FiPackage, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

type OuiNonButtonProps = {
  value: 'OUI' | 'NON';
  setValue: (v: 'OUI' | 'NON') => void;
  label: string;
};

const OuiNonButton: React.FC<OuiNonButtonProps> = ({ value, setValue, label }) => (
  <div className="flex gap-3 items-center">
    <button
      type="button"
      onClick={() => setValue('OUI')}
      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
        value === 'OUI'
          ? 'bg-green-100 text-green-700 border-2 border-green-300'
          : 'bg-gray-100 text-gray-500 border-2 border-transparent'
      }`}
    >
      Oui
    </button>
    <button
      type="button"
      onClick={() => setValue('NON')}
      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
        value === 'NON'
          ? 'bg-red-100 text-red-700 border-2 border-red-300'
          : 'bg-gray-100 text-gray-500 border-2 border-transparent'
      }`}
    >
      Non
    </button>
    <span className="text-sm font-medium text-gray-600 ml-4">{label}</span>
  </div>
);

const useAppDispatch = () => useDispatch<AppDispatch>();

const DevisTransactionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: devisTransactions, loading, error: globalError } = useSelector((state: RootState) => state.devisTransactions);
  const { data: modules } = useSelector((state: RootState) => state.modules);

  useEffect(() => {
    dispatch(fetchDevisTransactions());
  }, [dispatch]);

  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<DevisTransaction | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [moduleId, setModuleId] = useState('');
  const [multiDevise, setMultiDevise] = useState<'OUI' | 'NON'>('OUI');
  const [devisPrestataire, setDevisPrestataire] = useState<'OUI' | 'NON'>('OUI');
  const [devisClient, setDevisClient] = useState<'OUI' | 'NON'>('NON');
  const [bcPrestataire, setBcPrestataire] = useState<'OUI' | 'NON'>('OUI');
  const [bcClient, setBcClient] = useState<'OUI' | 'NON'>('NON');
  const [facturationClient, setFacturationClient] = useState<'OUI' | 'NON'>('OUI');
  const [facturationPrestataire, setFacturationPrestataire] = useState<'OUI' | 'NON'>('NON');

  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  const closeModal = () => {
    setActiveModal('none');
    setEditingItem(null);
    setModuleId('');
    setMultiDevise('OUI');
    setDevisPrestataire('OUI');
    setDevisClient('NON');
    setBcPrestataire('OUI');
    setBcClient('NON');
    setFacturationClient('OUI');
    setFacturationPrestataire('NON');
    setMessage({ text: '', isError: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      moduleId,
      multiDevise,
      devisPrestataire,
      devisClient,
      bcPrestataire,
      bcClient,
      facturationClient,
      facturationPrestataire,
    };

    if (editingItem) {
      const result = await dispatch(updateDevisTransaction({ id: editingItem.id, ...payload }));
      if (updateDevisTransaction.fulfilled.match(result)) {
        setMessage({ text: 'Configuration mise à jour !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la mise à jour.', isError: true });
      }
    } else {
      const result = await dispatch(createDevisTransaction(payload));
      if (createDevisTransaction.fulfilled.match(result)) {
        setMessage({ text: 'Configuration créée !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la création.', isError: true });
      }
    }
    setIsSubmitting(false);
  };

  const openEdit = (item: DevisTransaction) => {
    setEditingItem(item);
    setModuleId(item.moduleId);
    setMultiDevise(item.multiDevise);
    setDevisPrestataire(item.devisPrestataire);
    setDevisClient(item.devisClient);
    setBcPrestataire(item.bcPrestataire);
    setBcClient(item.bcClient);
    setFacturationClient(item.facturationClient);
    setFacturationPrestataire(item.facturationPrestataire);
    setActiveModal('form');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {isSubmitting && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
        
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiFileText className="text-indigo-600" /> Gestion de devise par transaction
            </h2>
            <p className="text-gray-500 font-medium italic">Configuration des devis, bons de commande et facturation par module.</p>
          </div>
        </div>  
        <button
          onClick={() => setActiveModal('form')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouvelle Configuration
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Module</th>
              <th className="px-6 py-5 text-left">Multi Devise</th>
              <th className="px-6 py-5 text-left">Devis Prest.</th>
              <th className="px-6 py-5 text-left">Devis Client</th>
              <th className="px-6 py-5 text-left">BC Prest.</th>
              <th className="px-6 py-5 text-left">BC Client</th>
              <th className="px-6 py-5 text-left">Fact. Client</th>
              <th className="px-6 py-5 text-left">Fact. Prest.</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-left">Date Application</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {devisTransactions.map((item) => (
              <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <FiPackage size={18} />
                    </div>
                    <div>
                      <span className="text-gray-900 font-black text-sm">{item.module.nom}</span>
                      <p className="text-xs text-gray-500">{item.module.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${item.multiDevise === 'OUI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.multiDevise}
                  </span>
                </td>
                {['devisPrestataire', 'devisClient', 'bcPrestataire', 'bcClient', 'facturationClient', 'facturationPrestataire'].map((field) => (
                  <td key={field} className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${(item as any)[field] === 'OUI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(item as any)[field]}
                    </span>
                  </td>
                ))}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    item.status === 'ACTIF' ? 'bg-green-100 text-green-700' :
                    item.status === 'CREER' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.status === 'ACTIF' ? 'bg-green-500' :
                      item.status === 'CREER' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`} />
                    {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                    {item.status === 'CREER' ? 'Créé' : item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-gray-500">{new Date(item.dateApplication).toLocaleDateString('fr-FR')}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">Modifier</button>
                    <button
                      onClick={() => dispatch(item.status === 'ACTIF' ? deactivateDevisTransaction(item.id) : activateDevisTransaction(item.id))}
                      className={item.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {item.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => { setAuditEntityId(item.id); setAuditEntityName(item.module.nom); }} className="text-purple-600 hover:underline">
                      Tracer
                    </button>
                    <button onClick={() => window.confirm('Supprimer ?') && dispatch(deleteDevisTransaction(item.id))} className="text-red-500 hover:underline border-l border-gray-100 pl-4">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && devisTransactions.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement des configurations...</p>
          </div>
        )}
      </div>

      {/* MODALE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          {/* Ajout de flex flex-col et max-h-full pour le responsive */}
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
            
            {/* HEADER : Reste fixe en haut */}
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-gray-800">
                {editingItem ? 'Modifier Configuration Devis' : 'Nouvelle Configuration Devis'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            {/* FORMULAIRE : Devient scrollable si le contenu dépasse */}
            <form 
              id="devis-form"
              onSubmit={handleSubmit} 
              className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Module concerné</label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">Sélectionner un module</option>
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.nom} ({mod.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-6">
                <OuiNonButton value={multiDevise} setValue={setMultiDevise} label="Multi-devise autorisée" />
                <OuiNonButton value={devisPrestataire} setValue={setDevisPrestataire} label="Devis Prestataire" />
                <OuiNonButton value={devisClient} setValue={setDevisClient} label="Devis Client" />
                <OuiNonButton value={bcPrestataire} setValue={setBcPrestataire} label="Bon de Commande Prestataire" />
                <OuiNonButton value={bcClient} setValue={setBcClient} label="Bon de Commande Client" />
                <OuiNonButton value={facturationClient} setValue={setFacturationClient} label="Facturation Client" />
                <OuiNonButton value={facturationPrestataire} setValue={setFacturationPrestataire} label="Facturation Prestataire" />
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  {message.text}
                </div>
              )}
            </form>

            {/* FOOTER : Les boutons restent fixes en bas */}
            <div className="p-6 md:p-8 border-t bg-white shrink-0">
              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  form="devis-form"
                  disabled={isSubmitting || !moduleId}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuditModal
        entity="DEVISTRANSACTION"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default DevisTransactionPage;