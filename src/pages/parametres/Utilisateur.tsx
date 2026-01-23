import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createUser, 
  assignProfileToUser, 
  activateUser, 
  deactivateUser, 
  deleteUser, 
  updateUser 
} from '../../app/back_office/usersSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { User } from '../../app/back_office/usersSlice';
import AuditModal from '../../components/AuditModal';
import { 
  FiUserPlus, FiX, FiCheckCircle, FiAlertCircle, 
  FiLoader, FiUserCheck, FiMail, FiMapPin, FiArrowLeft, FiEyeOff, FiEye, FiPlus, FiUsers
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const Utilisateur = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: users, error: globalError } = useSelector((state: RootState) => state.users);
  const { data: profiles } = useSelector((state: RootState) => state.profiles);

  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'create' | 'assign' | 'edit'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states (Création / Édition)
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [departement, setDepartement] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editingUserId, setEditingUserId] = useState('');

  // Assignation
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  const closeModals = () => {
    setActiveModal('none');
    setMessage({ text: '', isError: false });
    setEditingUserId('');
    // Reset form fields
    setEmail(''); setMotDePasse(''); setNom(''); setPrenom(''); setPseudo(''); setDepartement('');
  };

  const handleAction = async (actionFn: any, payload: any) => {
    setIsSubmitting(true);
    await dispatch(actionFn(payload));
    setIsSubmitting(false);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await dispatch(createUser({ email, motDePasse, nom, prenom, pseudo, departement }));
    if (createUser.fulfilled.match(result)) {
      setMessage({ text: 'Utilisateur créé avec succès !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Erreur lors de la création', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setIsSubmitting(true);
    const result = await dispatch(updateUser({
      id: editingUserId, email, nom, prenom, pseudo, departement, status: editStatus,
    }));
    if (updateUser.fulfilled.match(result)) {
      setMessage({ text: 'Utilisateur mis à jour !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: 'Erreur de modification', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleSubmitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await dispatch(assignProfileToUser({ userId: selectedUserId, profileId: selectedProfileId }));
    if (assignProfileToUser.fulfilled.match(result)) {
      setMessage({ text: 'Profil assigné avec succès !', isError: false });
      setTimeout(closeModals, 1500);
    } else {
      setMessage({ text: "Erreur lors de l'assignation", isError: true });
    }
    setIsSubmitting(false);
  };

  const openEdit = (user: User) => {
    setEditingUserId(user.id);
    setPrenom(user.prenom);
    setNom(user.nom);
    setEmail(user.email);
    setPseudo(user.pseudo);
    setDepartement(user.departement);
    setEditStatus(user.status);
    setActiveModal('edit');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global pour les actions de statut/suppression */}
      {isSubmitting && activeModal === 'none' && (
        <div className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
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
              <FiUserCheck className="text-indigo-600" /> Annuaire Utilisateurs
            </h2>
            <p className="text-gray-500 font-medium italic">Gérez les comptes, les accès et les affectations par département.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveModal('create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <FiUserPlus size={20} /> Nouvel Utilisateur
          </button>
        </div>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Utilisateur</th>
                <th className="px-6 py-5 text-left">Département</th>
                <th className="px-6 py-5 text-left">Statut</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white font-medium">
              {users.map((user: User) => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">
                        {user.prenom[0]}{user.nom[0]}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{user.prenom} {user.nom}</div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 uppercase">
                          <FiMail className="inline" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <FiMapPin className="text-gray-300" /> {user.departement}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.status}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4">
                    {user.profile ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase border border-gray-200">
                        {user.profile.profil}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic font-bold">Non assigné</span>
                    )}
                  </td> */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                      <button onClick={() => openEdit(user)} className="text-blue-600 hover:underline">Modifier</button>
                      {user.status !== 'ACTIF' ? (
                        <button onClick={() => handleAction(activateUser, { userId: user.id })} className="text-green-600 hover:underline">Activer</button>
                      ) : (
                        <button onClick={() => handleAction(deactivateUser, { userId: user.id })} className="text-amber-600 hover:underline">Désactiver</button>
                      )}
                      <button onClick={() => { setAuditEntityId(user.id); setAuditEntityName(`${user.prenom} ${user.nom}`); }} className="text-purple-600 hover:underline">Tracer</button>
                      <button onClick={() => window.confirm('Supprimer ?') && handleAction(deleteUser, { userId: user.id })} className="text-red-500 hover:underline border-l border-gray-100 pl-4">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS UNIFIÉS */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
            
            {/* HEADER STYLISÉ */}
            <div className={`p-8 border-b border-gray-200 flex justify-between items-center ${
              activeModal === 'assign' ? 'bg-emerald-50/30' : 'bg-indigo-50/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  activeModal === 'assign' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {activeModal === 'create' ? <FiPlus size={24} /> : activeModal === 'edit' ? <FiLoader size={24} /> : <FiUsers size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {activeModal === 'create' ? 'Nouveau Membre' : activeModal === 'edit' ? 'Modifier Membre' : 'Assigner Profil'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Portail Administration</p>
                </div>
              </div>
              <button 
                onClick={closeModals} 
                className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-gray-400 hover:text-red-500"
              >
                <FiX size={24} />
              </button>
            </div>

            <form 
              onSubmit={activeModal === 'create' ? handleSubmitCreate : activeModal === 'edit' ? handleSubmitEdit : handleSubmitAssign} 
              className="p-8 space-y-6"
            >
              {activeModal === 'assign' ? (
                <div className="space-y-6 py-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Sélection de l'utilisateur</label>
                    <select 
                      value={selectedUserId} 
                      onChange={(e) => setSelectedUserId(e.target.value)} 
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all appearance-none cursor-pointer" 
                      required
                    >
                      <option value="">Choisir un membre...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom} — {u.email}</option>)}
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Rôle à attribuer</label>
                    <select 
                      value={selectedProfileId} 
                      onChange={(e) => setSelectedProfileId(e.target.value)} 
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all appearance-none cursor-pointer" 
                      required
                    >
                      <option value="">Choisir un profil...</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.profil}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="relative">
                      <input type="text" placeholder="PRÉNOM" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all" required />
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="NOM" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all" required />
                    </div>
                    <div className="relative">
                      <input type="email" placeholder="EMAIL PROFESSIONNEL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {activeModal === 'create' && (
                      <div className="relative group">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="MOT DE PASSE" 
                          value={motDePasse} 
                          onChange={(e) => setMotDePasse(e.target.value)} 
                          className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all pr-12" 
                          required 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <input type="text" placeholder="PSEUDO / IDENTIFIANT" value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all" required />
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="DÉPARTEMENT" value={departement} onChange={(e) => setDepartement(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all" required />
                    </div>
                    {activeModal === 'edit' && (
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all">
                        <option value="ACTIF">🟢 &nbsp; COMPTE ACTIF</option>
                        <option value="INACTIF">🔴 &nbsp; COMPTE INACTIF</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-[11px] uppercase tracking-wider animate-bounce ${
                  message.isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {message.isError ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />} 
                  {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={closeModals} 
                  className="flex-1 py-4 bg-white border-2 border-gray-100 hover:border-gray-200 rounded-2xl font-bold text-gray-400 hover:text-gray-600 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    activeModal === 'assign' 
                    ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' 
                    : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={20} />}
                  <span className="uppercase text-xs tracking-widest">Confirmer l'opération</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="USER"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default Utilisateur;