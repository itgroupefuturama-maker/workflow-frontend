import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns } from '../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../app/store';
import { FiFolder, FiCheckCircle, FiTag, FiFileText, FiLock, FiSettings, FiHome } from 'react-icons/fi';
import { fetchTodos } from '../../app/front_office/todosSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ALL_MODULES = [
  { label: 'Dossier',             desc: 'Accédez à vos fichiers partagés',        path: '/dossiers-communs',            icon: FiFolder,      color: 'blue',   locked: false },
  { label: 'To Do List',          desc: 'Gérez vos tâches quotidiennes',           path: '/dossiers-communs/todolist',   icon: FiCheckCircle, color: 'green',  locked: false },
  { label: 'Vol',                 desc: 'Suivez vos demandes et tickets',          path: '/dossiers-communs/ticketing',  icon: FiTag,         color: 'amber',  locked: false },
  { label: 'Attestation Voyage',  desc: 'Générez vos attestations',                path: '/dossiers-communs/attestation',icon: FiFileText,    color: 'rose',   locked: false },
  { label: 'Paramètre',           desc: 'Commentaires et configurations',          path: '/dossiers-communs/parametre',  icon: FiSettings,    color: 'violet', locked: false },
  { label: 'Hôtel',               desc: 'Gestion des réservations',                path: '/dossiers-communs/hotel',      icon: FiHome,        color: 'orange', locked: false },
  { label: 'Assurance',           desc: 'Contrats et garanties',                   path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Visa',                desc: 'Suivi des demandes',                      path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Location',            desc: 'Véhicules et matériel',                   path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Activité',            desc: 'Excursions et loisirs',                   path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Guidage',             desc: 'Planning des guides',                     path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Résultats Stats',     desc: 'Analyses de données',                     path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Tableau de bord',     desc: "Vue d'ensemble",                          path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Miles',               desc: 'Fidélité voyageurs',                      path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Contrôle',            desc: 'Audit et vérification',                   path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Profil',              desc: 'Paramètres utilisateur',                  path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'SAV',                 desc: 'Service après-vente',                     path: '',                             icon: FiLock,        color: 'gray',   locked: true  },
];

const COLOR_MAP: Record<string, { blob: string; iconBg: string; iconText: string; iconHover: string; border: string }> = {
  blue:   { blob: 'bg-blue-500/5',   iconBg: 'bg-blue-500/10',   iconText: 'text-blue-600',   iconHover: 'group-hover:bg-blue-500',   border: 'hover:border-blue-200'   },
  green:  { blob: 'bg-green-500/5',  iconBg: 'bg-green-500/10',  iconText: 'text-green-600',  iconHover: 'group-hover:bg-green-500',  border: 'hover:border-green-200'  },
  amber:  { blob: 'bg-amber-500/5',  iconBg: 'bg-amber-500/10',  iconText: 'text-amber-400',  iconHover: 'group-hover:bg-amber-400',  border: 'hover:border-amber-200'  },
  rose:   { blob: 'bg-rose-500/5',   iconBg: 'bg-rose-500/10',   iconText: 'text-rose-600',   iconHover: 'group-hover:bg-rose-500',   border: 'hover:border-rose-200'   },
  violet: { blob: 'bg-violet-500/5', iconBg: 'bg-violet-500/10', iconText: 'text-violet-600', iconHover: 'group-hover:bg-violet-500', border: 'hover:border-violet-200' },
  orange: { blob: 'bg-orange-500/5', iconBg: 'bg-orange-500/10', iconText: 'text-orange-600', iconHover: 'group-hover:bg-orange-500', border: 'hover:border-orange-200' },
  gray:   { blob: 'bg-gray-500/5',   iconBg: 'bg-gray-100',      iconText: 'text-gray-300',   iconHover: '',                          border: ''                        },
};

function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    dispatch(fetchDossiersCommuns());
    dispatch(fetchTodos());
  }, [dispatch, token, navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">

        {/* ── Header ── */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Listes des modules
          </h1>
          <p className="text-sm text-slate-500">
            Gérez l'ensemble de vos dossiers ici.
          </p>
        </div>

        {/* ── Grille unique ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {ALL_MODULES.map((mod) => {
            const c = COLOR_MAP[mod.color];
            const Icon = mod.icon;

            if (mod.locked) {
              return (
                <div
                  key={mod.label}
                  className="relative bg-white rounded-xl p-5 sm:p-6 border border-gray-100 cursor-not-allowed overflow-hidden"
                >
                  {/* Badge Bientôt */}
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    En cours
                  </span>

                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <FiLock className="text-gray-300" size={20} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-1 leading-snug">
                    {mod.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className={`group relative bg-white rounded-xl p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 ${c.border} overflow-hidden`}
              >
                {/* Blob décoratif */}
                <div className={`absolute top-0 right-0 w-28 h-28 sm:w-32 sm:h-32 ${c.blob} rounded-full -mr-14 -mt-14 sm:-mr-16 sm:-mt-16 group-hover:scale-150 transition-transform duration-500`} />

                <div className="relative z-10">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 ${c.iconBg} rounded-lg flex items-center justify-center mb-4 ${c.iconHover} transition-colors duration-300`}>
                    <Icon className={`${c.iconText} group-hover:text-white transition-colors duration-300`} size={22} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 leading-snug">
                    {mod.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default HomePage;