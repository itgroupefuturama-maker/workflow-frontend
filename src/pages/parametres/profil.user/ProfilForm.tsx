import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  updateProfil,
  assignPrivilegeToProfil,
  deactivatePrivilegeFromProfil,
  assignModuleToProfil,
  deactivateModuleFromProfil,
  assignUserToProfil,
  deactivateUserFromProfil,
  fetchProfiles,
} from '../../../app/back_office/profilesSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import { FiArrowLeft,  FiSearch, FiPlus, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { fetchAutorisations } from '../../../app/back_office/autorisationsSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ProfilFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: profiles } = useSelector((state: RootState) => state.profiles);
  const { data: privileges } = useSelector((state: RootState) => state.privileges);
  const { data: modules } = useSelector((state: RootState) => state.modules);
  const { data: users } = useSelector((state: RootState) => state.users);

  const [showAddPrivilege, setShowAddPrivilege] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const currentProfil = profiles.find(p => p.id === id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const [nomProfil, setNomProfil] = useState('');
  const [statut, setStatut] = useState<'ACTIF' | 'INACTIF'>('ACTIF');

  const [searchPrivilege, setSearchPrivilege] = useState('');
  const [searchModule, setSearchModule] = useState('');
  const [searchUser, setSearchUser] = useState('');

//   useEffect(() => {
//     if (currentProfil) {
//         setNomProfil(currentProfil.profil);
//         setStatut(currentProfil.status);
//     }
//     }, [id, currentProfil]);
  const hasChanges = useMemo(() => {
    if (!currentProfil) return false;
    // On compare avec les valeurs initiales du profil
    const nameChanged = nomProfil !== '' && nomProfil !== currentProfil.profil;
    const statusChanged = statut !== currentProfil.status;
    return nameChanged || statusChanged;
  }, [nomProfil, statut, currentProfil]);

  const isFormInvalid = nomProfil.trim() === '' && currentProfil?.profil === '';

  const handleSave = async () => {
    if (!currentProfil) return;
    setIsSubmitting(true);
    const result = await dispatch(updateProfil({ id: currentProfil.id, profil: nomProfil || currentProfil.profil, status: statut }));
    if (updateProfil.fulfilled.match(result)) {
      setMessage({ text: 'Profil mis à jour avec succès !', isError: false });
      dispatch(fetchAutorisations());
      setTimeout(() => navigate(-1), 1500);
    } else {
      setMessage({ text: 'Erreur lors de la sauvegarde.', isError: true });
    }
    setIsSubmitting(false);
  };

  // Gestion des attributions
  const handleAssignPrivilege = async (privilegeId: string) => {
    setIsSubmitting(true);
    const result = await dispatch(assignPrivilegeToProfil({ profilId: id!, privilegeId }));
    if (assignPrivilegeToProfil.fulfilled.match(result)) {
      setMessage({ text: 'Privilège accordé avec succès !', isError: false });
      setTimeout(() => setMessage({ text: '', isError: false }), 2000); // Notification éphémère
    }
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };

  const handleDeactivatePrivilege = async (privilegeId: string) => {
    setIsSubmitting(true);
    await dispatch(deactivatePrivilegeFromProfil({ profilId: id!, privilegeId }));
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };

  const handleAssignModule = async (moduleId: string) => {
    setIsSubmitting(true);
    await dispatch(assignModuleToProfil({ profilId: id!, moduleId }));
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };

  const handleDeactivateModule = async (moduleId: string) => {
    setIsSubmitting(true);
    await dispatch(deactivateModuleFromProfil({ profilId: id!, moduleId }));
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };

  const handleAssignUser = async (userId: string) => {
    setIsSubmitting(true);
    await dispatch(assignUserToProfil({ profilId: id!, userId }));
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };

  const handleDeactivateUser = async (userId: string) => {
    setIsSubmitting(true);
    await dispatch(deactivateUserFromProfil({ profilId: id!, userId }));
    await dispatch(fetchProfiles());
    setIsSubmitting(false);
  };


  // Filtres disponibles
  const availablePrivileges = useMemo(() => {
    const assignedIds = currentProfil?.privileges.map(p => p.privilege.id) || [];
    return privileges.filter(p => 
      !assignedIds.includes(p.id) &&
      (p.privilege.toLowerCase().includes(searchPrivilege.toLowerCase()) || 
       p.fonctionnalite.toLowerCase().includes(searchPrivilege.toLowerCase()))
    );
  }, [privileges, currentProfil, searchPrivilege]);

  const availableModules = useMemo(() => {
    const assignedIds = currentProfil?.modules.map(m => m.module.id) || [];
    return modules.filter(m => 
      !assignedIds.includes(m.id) &&
      m.nom.toLowerCase().includes(searchModule.toLowerCase())
    );
  }, [modules, currentProfil, searchModule]);

  const availableUsers = useMemo(() => {
    const assignedIds = currentProfil?.users.map(u => u.user.id) || [];
    return users.filter(u => 
      !assignedIds.includes(u.id) &&
      (u.email.toLowerCase().includes(searchUser.toLowerCase()) || 
       `${u.prenom} ${u.nom}`.toLowerCase().includes(searchUser.toLowerCase()))
    );
  }, [users, currentProfil, searchUser]);

  if (!currentProfil) {
    return <div className="p-8 text-center text-gray-500">Chargement du profil...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-900">
            Édition du profil : {currentProfil.profil}
          </h2>
          <p className="text-gray-500 italic">Gestion des privilèges, modules et utilisateurs</p>
        </div>
      </div>

      {message.text && (
        <div className="fixed top-6 right-6 z-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            message.isError ? 'bg-red-600 border-red-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
          }`}>
            {message.isError ? <FiPlus className="rotate-45" /> : <FiCheckCircle />}
            <span className="font-bold text-sm tracking-wide">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Infos générales */}
        <div className="space-y-6">
          {/* CARTE DES INFORMATIONS GÉNÉRALES */}
          <div className="bg-white border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                Configuration Générale
              </h4>
            </div>

            <div className="space-y-8">
              {/* Champ Nom du Profil */}
              <div className="group">
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-indigo-600 transition-colors">
                  Désignation du rôle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nomProfil || currentProfil.profil}
                    onChange={(e) => setNomProfil(e.target.value.toUpperCase())}
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 uppercase outline-none transition-all placeholder:text-gray-300"
                    placeholder="EX: ADMINISTRATEUR"
                  />
                </div>
              </div>

              {/* Champ Statut avec indicateur visuel */}
              <div className="group">
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-indigo-600 transition-colors">
                  État d'activation
                </label>
                <div className="relative">
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="ACTIF">🟢 &nbsp; PROFIL ACTIF</option>
                    <option value="INACTIF">🔴 &nbsp; PROFIL INACTIF</option>
                  </select>
                  {/* Petite flèche personnalisée pour le select */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOUTONS D'ACTION : Design flottant et moderne */}
          <div className="bg-gray-50/50 p-4 border border-dashed border-gray-200 rounded-3xl">
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !hasChanges || isFormInvalid}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg font-black uppercase tracking-[0.15em] text-xs ${
                  hasChanges && !isFormInvalid
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" size={20} />
                ) : (
                  <FiCheckCircle size={20} />
                )}
                {hasChanges ? 'Enregistrer le profil' : 'Aucun changement'}
              </button>

              <button 
                onClick={() => navigate(-1)} 
                className="w-full py-4 bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
          
          {/* Note informative discrète */}
          <p className="px-6 text-[10px] text-gray-400 text-center leading-relaxed">
            Toute modification du nom ou du statut affectera immédiatement les accès des utilisateurs rattachés à ce profil.
          </p>
        </div>

        {/* Attributions */}
        <div className="lg:col-span-2 space-y-1">
          {/* Privilèges */}
          <div className="bg-white p-8 border border-gray-100">
            {/* Header de section avec bouton Ajouter */}
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Privilèges ({currentProfil.privileges.length})
              </h4>
              <button 
                onClick={() => setShowAddPrivilege(!showAddPrivilege)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showAddPrivilege 
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {showAddPrivilege ? 'Fermer' : '+ Ajouter'}
              </button>
            </div>

            {/* Liste simple des privilèges actifs */}
            <div className="divide-y divide-gray-50 mb-6">
              {currentProfil.privileges.map((p) => (
                <div key={p.privilege.id} className="py-4 flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{p.privilege.privilege}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-tighter">
                      {p.privilege.fonctionnalite}
                    </span>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold ${p.status === 'ACTIF' ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleDeactivatePrivilege(p.privilege.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                        p.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          p.status === 'ACTIF' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone de Recherche et Ajout (Conditionnelle) */}
            {showAddPrivilege && (
              <div className="mt-4 pt-6 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="relative mb-4">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un privilège à ajouter..."
                    value={searchPrivilege}
                    onChange={(e) => setSearchPrivilege(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                
                <div className="max-h-52 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {availablePrivileges.length > 0 ? (
                    availablePrivileges.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAssignPrivilege(p.id)}
                        className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl flex justify-between items-center group transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{p.privilege}</p>
                          <p className="text-[10px] text-gray-400">{p.fonctionnalite}</p>
                        </div>
                        <FiPlus className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-gray-400 italic">Aucun résultat trouvé</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modules */}
          <div className="bg-white p-8 border border-gray-100">
            {/* Header de section avec bouton toggle pour l'ajout */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  Modules ({currentProfil.modules.length})
                </h4>
              </div>
              <button 
                onClick={() => setShowAddModule(!showAddModule)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showAddModule 
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {showAddModule ? 'Fermer' : '+ Activer un module'}
              </button>
            </div>

            {/* Liste simple des modules rattachés */}
            <div className="divide-y divide-gray-50 mb-6">
              {currentProfil.modules.length > 0 ? (
                currentProfil.modules.map((m) => (
                  <div key={m.module.id} className="py-4 flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{m.module.nom}</span>
                      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                        Code : {m.module.code}
                      </span>
                    </div>
                    
                    {/* Toggle Switch pour le statut du module */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold ${m.status === 'ACTIF' ? 'text-emerald-500' : 'text-gray-300'}`}>
                        {m.status}
                      </span>
                      <button
                        onClick={() => handleDeactivateModule(m.module.id)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                          m.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            m.status === 'ACTIF' ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 italic">Aucun module assigné à ce profil.</p>
                </div>
              )}
            </div>

            {/* Zone de Recherche et Sélection (s'affiche au clic sur le bouton +) */}
            {showAddModule && (
              <div className="mt-4 pt-6 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative mb-4">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un module à installer..."
                    value={searchModule}
                    onChange={(e) => setSearchModule(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                
                <div className="max-h-52 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {availableModules.length > 0 ? (
                    availableModules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleAssignModule(m.id)}
                        className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl flex justify-between items-center group transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{m.nom}</p>
                          <p className="text-[10px] text-gray-400">{m.code}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">Ajouter</span>
                          <FiPlus className="text-indigo-600" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-gray-400 italic font-medium">
                      Tous les modules sont déjà activés ou aucun ne correspond.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Utilisateurs */}
          <div className="bg-white p-8 border border-gray-100">
            {/* Header de section */}
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Utilisateurs rattachés ({currentProfil.users.length})
              </h4>
              <button 
                onClick={() => setShowAddUser(!showAddUser)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showAddUser 
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {showAddUser ? 'Fermer' : '+ Rattacher un membre'}
              </button>
            </div>

            {/* Liste des utilisateurs rattachés */}
            <div className="divide-y divide-gray-50 mb-6">
              {currentProfil.users.length > 0 ? (
                currentProfil.users.map((u) => (
                  <div key={u.user.id} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      {/* Avatar discret (Initiales) */}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {u.user.prenom[0]}{u.user.nom[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">
                          {u.user.prenom} {u.user.nom}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {u.user.email} • <span className="uppercase">{u.user.departement}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Toggle Switch pour l'accès utilisateur */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold ${u.status === 'ACTIF' ? 'text-emerald-500' : 'text-gray-300'}`}>
                        {u.status}
                      </span>
                      <button
                        onClick={() => handleDeactivateUser(u.user.id)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                          u.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            u.status === 'ACTIF' ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  <p className="text-sm text-gray-400 italic font-medium">Aucun utilisateur rattaché à ce profil.</p>
                </div>
              )}
            </div>

            {/* Zone de Recherche (Conditionnelle) */}
            {showAddUser && (
              <div className="mt-4 pt-6 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="relative mb-4">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                
                <div className="max-h-52 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAssignUser(u.id)}
                        className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl flex justify-between items-center group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {u.prenom[0]}{u.nom[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{u.prenom} {u.nom}</p>
                            <p className="text-[10px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                        <FiPlus className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-gray-400 italic">Tout le monde est déjà assigné.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilFormPage;