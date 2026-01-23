import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createPrivilege, 
  updatePrivilege, 
  deletePrivilege, 
  activatePrivilege, 
  deactivatePrivilege, 
  // fetchAutorisationsByPrivilege 
} from '../../app/back_office/privilegesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Privilege } from '../../app/back_office/privilegesSlice';
import { 
  FiPlus, FiX, FiCheckCircle, FiAlertCircle, 
  FiLoader, FiKey, FiActivity,  FiArrowLeft
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const PrivilegeComponent = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: privileges, loading: privLoading, error: globalError } = useSelector((state: RootState) => state.privileges);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'create' | 'edit' | 'view-auth'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [privilegeName, setPrivilegeName] = useState('');
  const [fonctionnalite, setFonctionnalite] = useState('');
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);

  // Autorisations liées
  // const [selectedPrivilegeAutorisations, setSelectedPrivilegeAutorisations] = useState<Autorisation[]>([]);
  // const [selectedPrivilegeName, setSelectedPrivilegeName] = useState('');

  const closeModals = () => {
    setActiveModal('none');
    setPrivilegeName('');
    setFonctionnalite('');
    setEditingPrivilege(null);
    setMessage({ text: '', isError: false });
  };

  const handleAction = async (actionFn: any, payload: any) => {
    setIsSubmitting(true);
    await dispatch(actionFn(payload));
    setIsSubmitting(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await dispatch(createPrivilege({ privilege: privilegeName, fonctionnalite }));
    if (createPrivilege.fulfilled.match(result)) {
      setMessage({ text: 'Privilège créé avec succès !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Erreur lors de la création', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrivilege) return;
    setIsSubmitting(true);
    const result = await dispatch(updatePrivilege({
      id: editingPrivilege.id,
      privilege: privilegeName,
      fonctionnalite,
    }));
    if (updatePrivilege.fulfilled.match(result)) {
      setMessage({ text: 'Privilège mis à jour !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Erreur lors de la modification', isError: true });
    }
    setIsSubmitting(false);
  };

  const openEdit = (p: Privilege) => {
    setEditingPrivilege(p);
    setPrivilegeName(p.privilege);
    setFonctionnalite(p.fonctionnalite);
    setActiveModal('edit');
  };

  // const openAutorisations = async (p: Privilege) => {
  //   setIsSubmitting(true);
  //   const result = await dispatch(fetchAutorisationsByPrivilege({ id: p.id }));
  //   if (fetchAutorisationsByPrivilege.fulfilled.match(result)) {
  //     // setSelectedPrivilegeAutorisations(result.payload.data);
  //     setSelectedPrivilegeName(p.privilege);
  //     setActiveModal('view-auth');
  //   }
  //   setIsSubmitting(false);
  // };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global */}
      {isSubmitting && activeModal === 'none' && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Action en cours...</p>
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
              <FiKey className="text-indigo-600" /> Gestion des Privilèges
            </h2>
            <p className="text-gray-500 font-medium italic">Définissez les droits d'accès granulaires par fonctionnalité.</p>
          </div>
        </div>
        <button
          onClick={() => setActiveModal('create')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouveau Privilège
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Privilège</th>
              <th className="px-6 py-5 text-left">Fonctionnalité</th>
              {/* <th className="px-6 py-5 text-left">Autorisations liées</th> */}
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {privileges.map((p) => (
              <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                    {p.privilege}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                    <FiActivity className="text-gray-300" /> {p.fonctionnalite}
                  </div>
                </td>
                
                {/* SECTION AUTORISATIONS NON COMPRESSÉE */}
                {/* <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                    {p.autorisations && p.autorisations.length > 0 ? (
                      p.autorisations.map((aut: any) => (
                        <span key={aut.id} className="text-[9px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-tighter whitespace-nowrap">
                          {aut.nom}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">Aucune liaison</span>
                    )}
                  </div>
                </td> */}

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                    p.status === 'CREER' ? 'bg-blue-100 text-blue-700' : // Couleur bleue pour le statut "Créé"
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      p.status === 'ACTIF' ? 'bg-green-500' : 
                      p.status === 'CREER' ? 'bg-blue-500' : 
                      'bg-red-500'
                    }`} />
                    
                    {/* Traduction du statut pour l'affichage */}
                    {p.status === 'CREER' ? 'Créé' : p.status === 'ACTIF' ? 'Actif' : p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">Modifier</button>
                    <button
                      onClick={() => handleAction(p.status === 'ACTIF' ? deactivatePrivilege : activatePrivilege, { id: p.id })}
                      className={p.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {p.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    {/* <button onClick={() => openAutorisations(p)} className="text-purple-600 hover:underline">Détails</button> */}
                    <button onClick={() => window.confirm('Supprimer ?') && handleAction(deletePrivilege, { id: p.id })} className="text-red-500 hover:underline border-l border-gray-100 pl-4">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {privLoading && privileges.length === 0 && (
          <div className="p-20 text-center"><FiLoader className="animate-spin mx-auto text-indigo-600" size={30} /></div>
        )}
      </div>

      {/* MODALE FORMULAIRE */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {activeModal === 'create' ? 'Nouveau Privilège' : 'Modifier Privilège'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={activeModal === 'create' ? handleCreateSubmit : handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 tracking-widest mb-2 ml-1">Privilège</label>
                <input
                  type="text"
                  placeholder="ex: LECTURE_TOTALE"
                  value={privilegeName}
                  onChange={(e) => setPrivilegeName(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fonctionnalité</label>
                <input
                  type="text"
                  placeholder="ex: Gestion des flux"
                  value={fonctionnalite}
                  onChange={(e) => setFonctionnalite(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
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
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default PrivilegeComponent;