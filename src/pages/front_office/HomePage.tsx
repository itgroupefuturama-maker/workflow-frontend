import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns } from '../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../app/store';
import { FiFolder, FiCheckCircle, FiTag, FiFileText, FiLock, FiSettings, FiHome, FiArrowRight, FiMapPin } from 'react-icons/fi';
import { fetchTodos } from '../../app/front_office/todosSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ALL_MODULES = [
  { label: 'Dossier',            desc: 'Accédez à vos fichiers partagés',        path: '/dossiers-communs',             icon: FiFolder,      color: 'blue',   locked: false },
  { label: 'To Do List',         desc: 'Gérez vos tâches quotidiennes',           path: '/dossiers-communs/todolist',    icon: FiCheckCircle, color: 'green',  locked: false },
  { label: 'Ticketing',          desc: 'Suivez vos demandes et tickets',          path: '/dossiers-communs/ticketing',   icon: FiTag,         color: 'amber',  locked: false },
  { label: 'Attestation Voyage', desc: 'Générez vos attestations',                path: '/dossiers-communs/attestation', icon: FiFileText,    color: 'rose',   locked: false },
  { label: 'Paramètre',          desc: 'Commentaires et configurations',          path: '/dossiers-communs/parametre',   icon: FiSettings,    color: 'violet', locked: false },
  { label: 'Hôtel',              desc: 'Gestion des réservations',                path: '/dossiers-communs/hotel',       icon: FiHome,        color: 'orange', locked: false },
  { label: 'Assurance',          desc: 'Contrats et garanties',                   path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Visa',               desc: 'Gestion des visas',                       path: '/dossiers-communs/visa',        icon: FiMapPin,      color: 'blue',   locked: false  },
  // { label: 'Location',           desc: 'Véhicules et matériel',                   path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  // { label: 'Activité',           desc: 'Excursions et loisirs',                   path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  // { label: 'Guidage',            desc: 'Planning des guides',                     path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Résultats Stats',    desc: 'Analyses de données',                     path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Tableau de bord',    desc: "Vue d'ensemble",                          path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Miles',              desc: 'Fidélité voyageurs',                      path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Contrôle',           desc: 'Audit et vérification',                   path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'Profil',             desc: 'Paramètres utilisateur',                  path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
  { label: 'SAV',                desc: 'Service après-vente',                     path: '',                              icon: FiLock,        color: 'gray',   locked: true  },
];

const COLOR_MAP: Record<string, {
  gradient: string;
  iconBg: string;
  iconText: string;
  border: string;
  glow: string;
  badge: string;
  arrow: string;
}> = {
  blue:   { gradient: 'from-blue-500 to-blue-600',    iconBg: 'bg-blue-500/10',   iconText: 'text-blue-500',   border: 'border-blue-100 hover:border-blue-300',   glow: 'hover:shadow-blue-100',   badge: 'bg-blue-50 text-blue-600',   arrow: 'text-blue-400' },
  green:  { gradient: 'from-emerald-500 to-green-600',iconBg: 'bg-emerald-500/10',iconText: 'text-emerald-500',border: 'border-green-100 hover:border-green-300',  glow: 'hover:shadow-green-100',  badge: 'bg-green-50 text-green-600', arrow: 'text-green-400' },
  amber:  { gradient: 'from-amber-400 to-orange-500', iconBg: 'bg-amber-500/10',  iconText: 'text-amber-500',  border: 'border-amber-100 hover:border-amber-300',  glow: 'hover:shadow-amber-100',  badge: 'bg-amber-50 text-amber-600', arrow: 'text-amber-400' },
  rose:   { gradient: 'from-rose-500 to-pink-600',    iconBg: 'bg-rose-500/10',   iconText: 'text-rose-500',   border: 'border-rose-100 hover:border-rose-300',    glow: 'hover:shadow-rose-100',   badge: 'bg-rose-50 text-rose-600',   arrow: 'text-rose-400' },
  violet: { gradient: 'from-violet-500 to-purple-600',iconBg: 'bg-violet-500/10', iconText: 'text-violet-500', border: 'border-violet-100 hover:border-violet-300', glow: 'hover:shadow-violet-100', badge: 'bg-violet-50 text-violet-600',arrow: 'text-violet-400' },
  orange: { gradient: 'from-orange-400 to-red-500',   iconBg: 'bg-orange-500/10', iconText: 'text-orange-500', border: 'border-orange-100 hover:border-orange-300', glow: 'hover:shadow-orange-100', badge: 'bg-orange-50 text-orange-600',arrow: 'text-orange-400' },
  gray:   { gradient: 'from-gray-300 to-gray-400',    iconBg: 'bg-gray-100',      iconText: 'text-gray-300',   border: 'border-gray-100',                          glow: '',                        badge: '',                           arrow: '' },
};

// Compteur de modules actifs
const ACTIVE_COUNT = ALL_MODULES.filter(m => !m.locked).length;

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
    <div className="min-h-screen relative overflow-hidden bg-slate-50">

      {/* ══════════════════════════════════════════
          FOND DÉCORATIF
      ══════════════════════════════════════════ */}

      {/* Gradient de base */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-100 via-white to-blue-50/40 pointer-events-none" />

      {/* Grande forme floue haut-gauche */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-linear-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grande forme floue bas-droite */}
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-linear-to-tl from-violet-400/10 to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Forme médiane centre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-linear-to-r from-sky-300/5 to-indigo-300/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grille de points subtile */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ligne décorative diagonale haut-droite */}
      <svg className="absolute top-0 right-0 w-96 h-96 opacity-[0.04] pointer-events-none" viewBox="0 0 400 400">
        <line x1="400" y1="0" x2="0" y2="400" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="400" y1="40" x2="40" y2="400" stroke="#3b82f6" strokeWidth="1" />
        <line x1="400" y1="80" x2="80" y2="400" stroke="#3b82f6" strokeWidth="0.5" />
        <circle cx="380" cy="20" r="4" fill="#6366f1" />
        <circle cx="340" cy="60" r="2" fill="#6366f1" />
        <circle cx="300" cy="20" r="3" fill="#3b82f6" />
      </svg>

      {/* Cercles discrets bas-gauche */}
      <svg className="absolute bottom-10 left-10 w-48 h-48 opacity-[0.06] pointer-events-none" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" stroke="#8b5cf6" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="55" stroke="#8b5cf6" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="30" stroke="#8b5cf6" strokeWidth="1" fill="none" />
      </svg>

      {/* ══════════════════════════════════════════
          CONTENU
      ══════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16">

        {/* ── Header ── */}
        <div className="mb-10 sm:mb-12">
          {/* Petite pastille au-dessus */}
          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-3 py-1 mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600">
              {ACTIVE_COUNT} modules actifs
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Liste des modules
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-md">
            Accédez à tous les outils de gestion depuis cet espace centralisé.
          </p>
        </div>

        {/* ── Grille ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {ALL_MODULES.map((mod) => {
            const c = COLOR_MAP[mod.color];
            const Icon = mod.icon;

            /* ── Carte verrouillée ── */
            if (mod.locked) {
              return (
                <div
                  key={mod.label}
                  className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-gray-100 cursor-not-allowed overflow-hidden"
                >
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    En cours
                  </span>
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <FiLock className="text-gray-300" size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{mod.label}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{mod.desc}</p>
                </div>
              );
            }

            /* ── Carte active ── */
            return (
              <div
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className={`
                  group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6
                  cursor-pointer border ${c.border}
                  transition-all duration-300
                  hover:shadow-xl ${c.glow} hover:-translate-y-1.5
                  overflow-hidden
                `}
              >
                {/* Barre colorée en haut */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />

                {/* Blob décoratif interne */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 bg-linear-to-br ${c.gradient} opacity-[0.06] rounded-full group-hover:scale-150 group-hover:opacity-[0.10] transition-all duration-500`} />

                <div className="relative z-10">
                  {/* Icône */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 ${c.iconBg} rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105`}>
                    <Icon className={`${c.iconText} transition-all duration-300`} size={22} />
                  </div>

                  {/* Texte */}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1 leading-snug">
                    {mod.label}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {mod.desc}
                  </p>

                  {/* Lien bas de carte */}
                  <div className={`flex items-center gap-1 text-xs font-medium ${c.arrow} opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0`}>
                    <span>Accéder</span>
                    <FiArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer discret ── */}
        <p className="text-center text-xs text-slate-300 mt-12">
          {ALL_MODULES.filter(m => m.locked).length} modules en cours de développement
        </p>
      </div>
    </div>
  );
}

export default HomePage;