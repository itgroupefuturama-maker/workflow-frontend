import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTransactionType,
  activateTransactionType,
  deactivateTransactionType,
  deleteTransactionType,
} from '../../app/back_office/transactionTypesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import { 
  FiSettings, FiPlus, FiX, FiCheckCircle, 
  FiAlertCircle, FiActivity, FiLoader , FiArrowLeft, FiChevronDown
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const TRANSACTION_TYPES = ['AUTOMATIQUE', 'SEMI_AUTOMATIQUE', 'MANUEL'] as const;
const BC_TYPES = ['AUTOMATIQUE', 'MANUEL'] as const;

const EVENTS = [
  'APPROBATION_BC_CLIENT',
  'CREATION_FACTURE_CLIENT',
  'CREATION_BC_FOURNISSEUR',
  'APPROBATION_BC_FOURNISSEUR',
  'CREATION_BR_FOURNISSEUR',
  'CREATION_FACTURE_FOURNISSEUR',
] as const;



const TypeTransaction = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: types, loading: globalLoading, error: globalError } = useSelector((state: RootState) => state.transactionTypes);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Chargement spécifique aux actions
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [transactionType, setTransactionType] = useState<'AUTOMATIQUE' | 'SEMI_AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  
  const [event, setEvent] = useState<typeof EVENTS[number]>(EVENTS[0]);
  // const [executionMode, setExecutionMode] = useState<'MANUEL' | 'AUTOMATIQUE'>('MANUEL');
  
  const [approbation_BC_Client, setApprobation_BC_Client] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  const [creation_Facture_Client, setCreation_Facture_Client] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  const [creation_BC_Fournisseur, setCreation_BC_Fournisseur] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  const [approbation_BC_Fournisseur, setApprobation_BC_Fournisseur] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  const [creation_BR_Fournisseur, setCreation_BR_Fournisseur] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');
  const [creation_Facture_Fournisseur, setCreation_Facture_Fournisseur] = useState<'AUTOMATIQUE' | 'MANUEL'>('AUTOMATIQUE');

  const closeModals = () => {
    setIsModalOpen(false);
    setMessage({ text: '', isError: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await dispatch(createTransactionType({ 
      transactionType,
      event,
      approbation_BC_Client,
      creation_Facture_Client,
      creation_BC_Fournisseur,
      approbation_BC_Fournisseur,
      creation_BR_Fournisseur,
      creation_Facture_Fournisseur
    }));

    if (createTransactionType.fulfilled.match(result)) {
      setMessage({ text: 'Type de transaction créé !', isError: false });
      setTimeout(() => {
        setTransactionType('AUTOMATIQUE');
        setEvent(EVENTS[0]);
        setApprobation_BC_Client('AUTOMATIQUE');
        setCreation_Facture_Client('AUTOMATIQUE');
        setCreation_BC_Fournisseur('AUTOMATIQUE');
        setApprobation_BC_Fournisseur('AUTOMATIQUE');
        setCreation_BR_Fournisseur('AUTOMATIQUE');
        setCreation_Facture_Fournisseur('AUTOMATIQUE');
        closeModals();
      }, 1500);
    } else {
      setMessage({ text: 'Erreur lors de la création', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn({ id }));
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce type de transaction ?')) return;
    setIsSubmitting(true);
    await dispatch(deleteTransactionType({ id }));
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay de chargement global */}
      {isSubmitting && !isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement en cours</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiSettings className="text-indigo-600" /> Types de Transaction
            </h2>
            <p className="text-gray-500 font-medium italic">Définissez les règles d'automatisation de vos flux de documents.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 w-fit"
        >
          <FiPlus size={20} /> Nouveau Type
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* TABLEAU DES TYPES */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type de Transaction</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Événement</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Approbation BC Client</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Création Facture Client</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Création BC Fournisseur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Approbation BC Fournisseur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Création BR Fournisseur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Création Facture Fournisseur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white font-medium">
              {types.map((type) => (
                <tr key={type.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FiActivity size={18} />
                      </div>
                      <span className="text-gray-900 font-black tracking-tight uppercase text-sm">{type.transactionType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.event}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.approbation_BC_Client}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.creation_Facture_Client}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.creation_BC_Fournisseur}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.approbation_BC_Fournisseur}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.creation_BR_Fournisseur}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-700 font-mono bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      {type.creation_Facture_Fournisseur}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      type.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                      type.status === 'CREER' ? 'bg-blue-100 text-blue-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        type.status === 'ACTIF' ? 'bg-green-500' : 
                        type.status === 'CREER' ? 'bg-blue-500' : 
                        'bg-red-500'
                      }`} />
                      
                      {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                      {type.status === 'CREER' ? 'Créé' : type.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                      {type.status !== 'ACTIF' ? (
                        <button onClick={() => handleAction(activateTransactionType, type.id)} className="text-green-600 hover:text-green-800 transition-colors underline underline-offset-4 decoration-2">Activer</button>
                      ) : (
                        <button onClick={() => handleAction(deactivateTransactionType, type.id)} className="text-amber-600 hover:text-amber-800 transition-colors underline underline-offset-4 decoration-2">Désactiver</button>
                      )}
                      <button onClick={() => handleDelete(type.id)} className="text-red-500 hover:text-red-700 transition-colors border-l border-gray-100 pl-4 underline underline-offset-4 decoration-2">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {globalLoading && types.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <FiLoader className="animate-spin" size={30} />
              <p className="font-bold uppercase text-[10px] tracking-widest">Chargement des paramètres...</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
       <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-300">
          {/* Ajustement : h-full sur mobile pour éviter les bugs de scroll, max-h-screen sur PC */}
          <div className="bg-white shadow-2xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-3xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col">
            {/* HEADER FIXE - Reste en haut */}
            <div className="p-5 md:p-7 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-indigo-600 rounded-xl md:rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <FiPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-gray-800 tracking-tight">Configuration Flux</h3>
                  <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paramétrage des règles</p>
                </div>
              </div>
              <button onClick={closeModals} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            {/* FORMULAIRE - Zone scrollable optimisée */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                
                {/* GRILLE : 1 colonne mobile, 2 colonnes PC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 md:gap-y-6">
                  
                  <div className="col-span-full mb-1">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-600 rounded-full"/> Identité du Flux
                    </h4>
                  </div>

                  {/* Type de Flux */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de Flux</label>
                    <div className="relative">
                      <select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value as any)}
                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl md:rounded-2xl outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer text-sm"
                        required
                      >
                        {TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <FiChevronDown />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Événement Déclencheur</label>
                    <select
                      value={event}
                      onChange={(e) => setEvent(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                      required
                    >
                      {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  {/* SECTION 2 : PROCESSUS (LES 6 SELECTS RESTANTS) */}
                  <div className="col-span-full mt-4 mb-2">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-600 rounded-full"/> Workflow de validation
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Approbation BC client</label>
                    <select
                      value={approbation_BC_Client}
                      onChange={(e) => setApprobation_BC_Client(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Creation Facture Client</label>
                    <select
                      value={creation_Facture_Client}
                      onChange={(e) => setCreation_Facture_Client(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Création BC fournisseur</label>
                    <select
                      value={creation_BC_Fournisseur}
                      onChange={(e) => setCreation_BC_Fournisseur(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Approbation BC Fournisseur</label>
                    <select
                      value={approbation_BC_Fournisseur}
                      onChange={(e) => setApprobation_BC_Fournisseur(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Création Br Fournisseur</label>
                    <select
                      value={creation_BR_Fournisseur}
                      onChange={(e) => setCreation_BR_Fournisseur(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Création Facture Fournisseur</label>
                    <select
                      value={creation_Facture_Fournisseur}
                      onChange={(e) => setCreation_Facture_Fournisseur(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-gray-700"
                      required
                    >
                      {BC_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* NOTIFICATION MESSAGE */}
              {message.text && (
                <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${message.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  <span className="text-[11px] font-black uppercase tracking-wide">{message.text}</span>
                </div>
              )}

              {/* FOOTER FIXE EN BAS - Boutons toujours visibles */}
              <div className="p-6 md:p-8 border-t border-gray-100 bg-white">
                <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
                  <button 
                    type="button" 
                    onClick={closeModals} 
                    className="w-full md:flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:text-gray-600 transition-all text-sm uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full md:flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                  >
                    {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={18} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeTransaction;