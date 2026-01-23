import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProfiles,
  createProfil,
  updateProfil,
  // deleteProfil,
} from '../../app/back_office/profilesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Profil } from '../../app/back_office/profilesSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiShield, FiArrowLeft} from 'react-icons/fi';
// import AuditModal from '../../components/AuditModal';
// import type { User } from '../../app/usersSlice';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ProfilPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: profiles, loading, error: globalError } = useSelector((state: RootState) => state.profiles);

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProfil, setEditingProfil] = useState<Profil | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [nomProfil, setNomProfil] = useState('');
  // const [statut, setStatut] = useState('');

  // const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  // const [auditEntityName, setAuditEntityName] = useState('');

  const closeModal = () => {
    setActiveModal('none');
    setEditingProfil(null);
    setNomProfil('');
    // setStatut('ACTIF');
    setMessage({ text: '', isError: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { profil: nomProfil };

    if (editingProfil) {
      const result = await dispatch(updateProfil({ id: editingProfil.id, ...payload }));
      if (updateProfil.fulfilled.match(result)) {
        setMessage({ text: 'Profil mis à jour !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la mise à jour.', isError: true });
      }
    } else {
      const result = await dispatch(createProfil(payload));
      if (createProfil.fulfilled.match(result)) {
        setMessage({ text: 'Profil créé !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la création.', isError: true });
      }
    }
    setIsSubmitting(false);
  };

  // const openEdit = (prof: Profil) => {
  //   setEditingProfil(prof);
  //   setNomProfil(prof.profil);
  //   setStatut(prof.status);
  //   setActiveModal('form');
  // };

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
              <FiShield className="text-indigo-600" /> Profils
            </h2>
            <p className="text-gray-500 font-medium italic">Gestion des rôles et permissions dans le système.</p>
          </div>
        </div>
        <button
          onClick={() => setActiveModal('form')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouveau Profil
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* TABLEAU PROFILS */}

      <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Nom du Profil</th>
              <th className="px-6 py-5 text-left">Privilèges</th>
              <th className="px-6 py-5 text-left">Modules</th>
              <th className="px-6 py-5 text-left">Utilisateurs</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-left">Date Création</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {profiles.map((prof) => (
              <tr key={prof.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <FiShield size={18} />
                    </div>
                    <span className="text-gray-900 font-black text-sm uppercase">{prof.profil}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="flex flex-col gap-2">
                    {prof.privileges?.map((p) => (
                      <span key={p.privilege.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mr-2">
                        {p.privilege.privilege}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="flex flex-col gap-2">
                    {prof.modules?.map((p) => (
                      <span key={p.module.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {p.module.nom}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="flex flex-col gap-2">
                    {prof.users?.map((p) => (
                      <span key={p.user.id} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        {p.user.nom} {p.user.prenom}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${prof.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${prof.status === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {prof.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase`}>
                    <span className={`h-1.5 w-1.5 rounded-full`} />
                    {prof.dateCreation ? new Date(prof.dateCreation).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button 
                      onClick={() => navigate(`/parametre/profil/${prof.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    {/* <button
                      onClick={() => { setAuditEntityId(prof.id); setAuditEntityName(prof.profil); }}
                      className="text-purple-600 hover:underline"
                    >
                      Tracer
                    </button> */}
                    {/* <button
                      onClick={() => window.confirm('Supprimer ce profil ?') && dispatch(deleteProfil(prof.id))}
                      className="text-red-500 hover:underline border-l border-gray-100 pl-4"
                    >
                      Supprimer
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && profiles.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement des profils...</p>
          </div>
        )}
      </div>



      {/* MODALE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {editingProfil ? 'Modifier Profil' : 'Nouveau Profil'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom du Profil</label>
                <input
                  type="text"
                  placeholder="ex: ADMIN, AGENT, MANAGER"
                  value={nomProfil}
                  onChange={(e) => setNomProfil(e.target.value.toUpperCase())}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                  required
                />
              </div>

              {/* <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Statut</label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                >
                  <option value="ACTIF">ACTIF</option>
                  <option value="INACTIF">INACTIF</option>
                </select>
              </div> */}

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">
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

      {/* <AuditModal
        entity="PROFIL"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      /> */}
    </div>
  );
};

export default ProfilPage;