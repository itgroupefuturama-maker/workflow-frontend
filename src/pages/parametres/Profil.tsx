import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProfiles,
  createProfil,
  updateProfil,
} from '../../app/back_office/profilesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Profil } from '../../app/back_office/profilesSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ── Composant badge liste avec collapse ──────────────────────────────────────
const BadgeList = ({
  items,
  colorClass,
}: {
  items: string[];
  colorClass: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 2;
  const visible = expanded ? items : items.slice(0, LIMIT);
  const rest = items.length - LIMIT;

  if (items.length === 0) return <span className="text-xs text-gray-300 italic">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
      {visible.map((label, i) => (
        <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colorClass}`}>
          {label}
        </span>
      ))}
      {!expanded && rest > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          +{rest}
        </button>
      )}
      {expanded && rest > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          Réduire
        </button>
      )}
    </div>
  );
};

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
  const [nomProfil, setNomProfil] = useState('');

  const closeModal = () => {
    setActiveModal('none');
    setEditingProfil(null);
    setNomProfil('');
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto">

      {isSubmitting && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={28} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement...</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <FiShield className="text-indigo-600" size={22} /> Profils
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-0.5">Gestion des rôles et permissions</p>
          </div>
        </div>
        <button
          onClick={() => setActiveModal('form')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 self-start sm:self-auto"
        >
          <FiPlus size={16} /> Nouveau Profil
        </button>
      </div>

      {globalError && (
        <div className="mb-5 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm font-semibold">
          <FiAlertCircle size={16} /> {globalError}
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Profil', 'Privilèges', 'Modules', 'Utilisateurs', 'Statut', 'Créé le', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest ${h === '' ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {profiles.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50/60 transition-colors align-top">

                  {/* Profil */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
                        <FiShield size={15} />
                      </div>
                      <span className="text-sm font-black text-gray-900 uppercase">{prof.profil}</span>
                    </div>
                  </td>

                  {/* Privilèges */}
                  <td className="px-5 py-4">
                    <BadgeList
                      items={prof.privileges?.map((p) => p.privilege.privilege) ?? []}
                      colorClass="bg-purple-50 text-purple-700 border border-purple-100"
                    />
                  </td>

                  {/* Modules */}
                  <td className="px-5 py-4">
                    <BadgeList
                      items={prof.modules?.map((p) => p.module.nom) ?? []}
                      colorClass="bg-blue-50 text-blue-700 border border-blue-100"
                    />
                  </td>

                  {/* Utilisateurs */}
                  <td className="px-5 py-4">
                    <BadgeList
                      items={prof.users?.map((p) => `${p.user.prenom} ${p.user.nom}`) ?? []}
                      colorClass="bg-emerald-50 text-emerald-700 border border-emerald-100"
                    />
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      prof.status === 'ACTIF'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${prof.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {prof.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {prof.dateCreation
                      ? new Date(prof.dateCreation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => navigate(`/parametre/profil/${prof.id}`)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && profiles.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={28} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="p-16 text-center text-gray-400 text-sm">
            Aucun profil trouvé
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-800">
                {editingProfil ? 'Modifier le profil' : 'Nouveau profil'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Nom du Profil
                </label>
                <input
                  type="text"
                  placeholder="ex: ADMIN, AGENT, MANAGER"
                  value={nomProfil}
                  onChange={(e) => setNomProfil(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                  required
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-semibold ${
                  message.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {message.isError ? <FiAlertCircle size={15} /> : <FiCheckCircle size={15} />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" size={14} /> : <FiCheckCircle size={14} />}
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilPage;