import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createModule,
  updateModule,
  activateModule,
  deactivateModule,
  deleteModule,
} from '../../app/back_office/modulesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Module } from '../../app/back_office/modulesSlice';
import { FiPackage, FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLayers, FiLoader, FiTag, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ModulePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: modules, loading: modulesLoading, error: globalError } = useSelector((state: RootState) => state.modules);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // État pour la modale d'audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  // Form States
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');

  const closeModals = () => {
    setActiveModal('none');
    setEditingModule(null);
    setCode(''); setNom(''); setDescription('');
    setMessage({ text: '', isError: false });
  };

  const handleAction = async (actionFn: any, payload: any) => {
    setIsSubmitting(true);
    await dispatch(actionFn(payload));
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const action = editingModule 
      ? updateModule({ id: editingModule.id, code, nom, description })
      : createModule({ code, nom, description });

    const result = await dispatch(action);
    
    if (updateModule.fulfilled.match(result) || createModule.fulfilled.match(result)) {
      setMessage({ text: editingModule ? 'Module mis à jour !' : 'Module créé !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Une erreur est survenue.', isError: true });
    }
    setIsSubmitting(false);
  };

  const openEdit = (mod: Module) => {
    setEditingModule(mod);
    setCode(mod.code);
    setNom(mod.nom);
    setDescription(mod.description);
    setActiveModal('form');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global */}
      {isSubmitting && activeModal === 'none' && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mise à jour...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiLayers className="text-indigo-600" /> Paramétrage des Modules
            </h2>
            <p className="text-gray-500 font-medium italic">Gérez les briques logicielles et l'organisation du système.</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingModule(null); setActiveModal('form'); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouveau Module
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Identifiant (Code)</th>
              <th className="px-6 py-5 text-left">Module</th>
              <th className="px-6 py-5 text-left">Description</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {modules.map((mod) => (
              <tr key={mod.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-black bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg border border-gray-100">
                    <FiTag size={12} /> {mod.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <FiPackage size={18} />
                    </div>
                    <span className="text-gray-900 font-black uppercase text-sm tracking-tight">{mod.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-gray-500 font-bold max-w-xs truncate italic" title={mod.description}>
                    {mod.description || 'Aucune description fournie'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    mod.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                    mod.status === 'CREER' ? 'bg-blue-100 text-blue-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      mod.status === 'ACTIF' ? 'bg-green-500' : 
                      mod.status === 'CREER' ? 'bg-blue-500' : 
                      'bg-red-500'
                    }`} />
                    
                    {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                    {mod.status === 'CREER' ? 'Créé' : mod.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEdit(mod)} className="text-blue-600 hover:underline">Modifier</button>
                    <button 
                      onClick={() => handleAction(mod.status === 'ACTIF' ? deactivateModule : activateModule, { id: mod.id })}
                      className={mod.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {mod.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => { setAuditEntityId(mod.id); setAuditEntityName(mod.nom); }}
                      className="text-purple-600 hover:underline"
                    >
                      Tracer
                    </button>
                    <button onClick={() => window.confirm('Supprimer ?') && handleAction(deleteModule, { id: mod.id })} className="text-red-500 hover:underline border-l border-gray-100 pl-4">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modulesLoading && modules.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Initialisation des modules...</p>
          </div>
        )}
      </div>

      {/* MODALE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {editingModule ? 'Édition Module' : 'Nouveau Module'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Code Système</label>
                  <input 
                    type="text" 
                    placeholder="ex: ACT,ASS,ATT,GUI,..." 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase placeholder:text-gray-300" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom du Module</label>
                  <input 
                    type="text" 
                    placeholder="ex: Activité, Assurance, Location" 
                    value={nom} 
                    onChange={(e) => setNom(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea 
                    placeholder="Décrivez les fonctionnalités de ce module..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-32 resize-none" 
                  />
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="MODULE"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default ModulePage;