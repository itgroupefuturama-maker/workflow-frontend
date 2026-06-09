import { useNavigate } from 'react-router-dom';
import { FiFolder, FiCheckCircle, FiTag, FiFileText, FiLock, FiSettings, FiHome, FiArrowRight, FiMapPin, FiShield, FiDatabase, FiMessageSquare, FiUsers, FiPlusCircle, FiList, FiUserCheck, FiUser, FiHeadphones, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const CATEGORIES = [
  {
    key: 'workspace',
    label: 'Espace de travail',
    desc: 'Ressources partagées, tâches quotidiennes et outils transversaux.',
    icon: FiHome,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    modules: [
      { label: 'Dossier',             desc: 'Accédez à vos fichiers partagés',      path: '/dossiers-communs',                         defaultTab: null, icon: FiFolder,      color: 'blue'  },
      { label: 'To Do List',          desc: 'Gérez vos tâches quotidiennes',        path: '/dossiers-communs/todolist',                defaultTab: null, icon: FiCheckCircle, color: 'teal'  },
      { label: 'Base de Connaissance',desc: 'Consultation information',             path: '/dossiers-communs/base-connaissance',       defaultTab: null, icon: FiDatabase,    color: 'cyan'  },
      { label: 'Contrôle',            desc: 'Audit et vérification',                path: '/dossiers-communs/pageControle',            defaultTab: null, icon: FiShield,     color: 'slate' },
      { label: 'Résultats Stats',     desc: 'Analyses de données',                  path: '/dossiers-communs/pageResultatStatDossierCommun', icon: FiBarChart2,  color: 'indigo' },
      { label: 'Tableau de bord',     desc: "Vue d'ensemble",                       path: '/dossiers-communs/pageTableauBord',             icon: FiPieChart,   color: 'blue'   },
      { label: 'Etat de Vente',       desc: "Vue d'ensemble des ventes",            path: '/dossiers-communs/pageEtatVente',               icon: FiTrendingUp, color: 'teal'   },
    ],
  },
  {
    key: 'clients',
    label: 'Gestion des clients',
    desc: 'Profils voyageurs, documents, fidélité et listes de passagers.',
    icon: FiUsers,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    modules: [
      { label: 'Client Bénéficiaire',         desc: 'Consultation & base de données',                    path: '/dossiers-communs/AllClientBeneficiairePage',         defaultTab: null, icon: FiUserCheck,    color: 'green'     },
      { label: 'Profilage',                   desc: 'Profilages des clients bénéficiaires',              path: '/dossiers-communs/pageProfilage',                     defaultTab: null, icon: FiUser,         color: 'teal'      },
      { label: 'Gestion des Document Client', desc: 'Passeport, CIN et autres pièces',                   path: '/dossiers-communs/pagePassport',                      defaultTab: null, icon: FiFileText,     color: 'cyan'      },
      { label: 'SMS Anniversaire',            desc: 'Fidélité voyageurs, Miles Al Bouraq Travel',        path: '/dossiers-communs/pageAnniversaire',                  defaultTab: null, icon: FiMessageSquare,color: 'roseSombre'},
      { label: 'Liste Passager',              desc: 'Liste des passagers',                               path: '/dossiers-communs/pageListePassage',                  defaultTab: null, icon: FiList,         color: 'navy'      },
      { label: 'Miles Compagnie',             desc: 'Gestion des miles compagnie',                       path: '/dossiers-communs/pageMilesCompagnie',                defaultTab: null, icon: FiFileText,     color: 'fluo'      },
    ],
  },
  {
    key: 'sav',
    label: 'Service après-vente',
    desc: 'Suivi des demandes et support client.',
    icon: FiHeadphones,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    modules: [
      { label: 'SAV', desc: 'Service après-vente', path: '/dossiers-communs/pageSAV', defaultTab: null, icon: FiPlusCircle, color: 'amber' },
    ],
  },
  {
    key: 'prestation',
    label: 'Modules prestation',
    desc: 'Gestion complète des prestations clients : tickets, hébergements, assurances, visas et documents.',
    icon: FiTag,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    modules: [
      { label: 'Ticketing',          desc: 'Suivez vos demandes et tickets', path: '/dossiers-communs/ticketing/pages',    defaultTab: 'prospection', icon: FiTag,      color: 'amber'  },
      { label: 'Hôtel',              desc: 'Gestion des réservations',        path: '/dossiers-communs/hotel/pages',       defaultTab: 'prospection', icon: FiHome,     color: 'orange' },
      { label: 'Assurance',          desc: 'Contrats et garanties',           path: '/dossiers-communs/assurance/pages',   defaultTab: 'prospection', icon: FiShield,   color: 'green'  },
      { label: 'Visa',               desc: 'Gestion des visas',               path: '/dossiers-communs/visa/pages',        defaultTab: 'prospection', icon: FiMapPin,   color: 'indigo' },
      { label: 'Attestation Voyage', desc: 'Générez vos attestations',        path: '/dossiers-communs/attestation/pages', defaultTab: 'prospection', icon: FiFileText, color: 'rose'   },
    ],
  },
  {
    key: 'parametres',
    label: "Paramètres globaux de l'application",
    desc: 'Configurations générales, modèles PDF, gestion des commentaires et des utilisateurs.',
    icon: FiSettings,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    modules: [
      { label: 'Paramètre Application', desc: 'Réglage et configurations',               path: '/dossiers-communs/parametre',            defaultTab: null, icon: FiSettings,     color: 'violet' },
      { label: 'Paramètre Pdf',         desc: 'Ajouter vos modèle, Logo et Cachet',      path: '/dossiers-communs/parametrePdf',         defaultTab: null, icon: FiFileText,     color: 'violet' },
      { label: 'Gestion Commentaire',   desc: 'Ajouter vos commentaire et modification', path: '/dossiers-communs/parametreCommentaire', defaultTab: null, icon: FiMessageSquare,color: 'violet' },
      { label: 'Paramètre Utilisateur', desc: 'Gestion de votre profil',                 path: '/dossiers-communs/parametreUtilisateur', defaultTab: null, icon: FiUsers,        color: 'violet' },
      { label: 'Gestion Couleurs',      desc: 'Palettes et thèmes écran',                path: '/dossiers-communs/couleurs',             defaultTab: null, icon: FiSettings,     color: 'violet' },
    ],
  },
  // {
  //   key: 'locked',
  //   label: 'En cours de développement',
  //   desc: 'Ces modules seront disponibles prochainement.',
  //   icon: FiLock,
  //   iconColor: 'text-gray-400',
  //   iconBg: 'bg-gray-100',
  //   modules: [
  //     { label: 'Résultats Stats', desc: 'Analyses de données', path: '', defaultTab: null, icon: FiLock, color: 'gray', locked: true },
  //     { label: 'Tableau de bord', desc: "Vue d'ensemble",      path: '', defaultTab: null, icon: FiLock, color: 'gray', locked: true },
  //   ],
  // },
];

const COLOR_MAP: Record<string, {
  gradient: string;
  iconBg: string;
  iconText: string;
  border: string;
  glow: string;
  arrow: string;
}> = {
  blue:       { gradient: 'from-blue-500 to-blue-600',      iconBg: 'bg-blue-50',       iconText: 'text-blue-600',    border: 'border-slate-200 hover:border-blue-300',    glow: 'hover:shadow-blue-100',    arrow: 'text-blue-500'    },
  teal:       { gradient: 'from-teal-500 to-emerald-600',   iconBg: 'bg-teal-50',        iconText: 'text-teal-600',    border: 'border-slate-200 hover:border-teal-300',    glow: 'hover:shadow-teal-100',    arrow: 'text-teal-500'    },
  cyan:       { gradient: 'from-cyan-400 to-cyan-600',      iconBg: 'bg-cyan-50',        iconText: 'text-cyan-600',    border: 'border-slate-200 hover:border-cyan-300',    glow: 'hover:shadow-cyan-100',    arrow: 'text-cyan-500'    },
  slate:      { gradient: 'from-slate-400 to-slate-600',    iconBg: 'bg-slate-100',      iconText: 'text-slate-500',   border: 'border-slate-200 hover:border-slate-300',   glow: 'hover:shadow-slate-100',   arrow: 'text-slate-400'   },
  green:      { gradient: 'from-emerald-500 to-green-600',  iconBg: 'bg-green-50',       iconText: 'text-green-600',   border: 'border-slate-200 hover:border-green-300',   glow: 'hover:shadow-green-100',   arrow: 'text-green-500'   },
  roseSombre: { gradient: 'from-rose-700 to-pink-900',      iconBg: 'bg-fuchsia-50',     iconText: 'text-rose-700',    border: 'border-slate-200 hover:border-rose-300',    glow: 'hover:shadow-rose-100',    arrow: 'text-rose-500'    },
  navy:       { gradient: 'from-blue-700 to-blue-900',      iconBg: 'bg-blue-50',        iconText: 'text-blue-700',    border: 'border-slate-200 hover:border-blue-300',    glow: 'hover:shadow-blue-100',    arrow: 'text-blue-600'    },
  fluo:       { gradient: 'from-green-600 to-green-800',    iconBg: 'bg-green-50',       iconText: 'text-green-700',   border: 'border-slate-200 hover:border-green-300',   glow: 'hover:shadow-green-100',   arrow: 'text-green-600'   },
  amber:      { gradient: 'from-amber-400 to-orange-500',   iconBg: 'bg-amber-50',       iconText: 'text-amber-600',   border: 'border-slate-200 hover:border-amber-300',   glow: 'hover:shadow-amber-100',   arrow: 'text-amber-500'   },
  orange:     { gradient: 'from-orange-400 to-red-500',     iconBg: 'bg-orange-50',      iconText: 'text-orange-500',  border: 'border-slate-200 hover:border-orange-300',  glow: 'hover:shadow-orange-100',  arrow: 'text-orange-500'  },
  indigo:     { gradient: 'from-indigo-500 to-blue-700',    iconBg: 'bg-indigo-50',      iconText: 'text-indigo-600',  border: 'border-slate-200 hover:border-indigo-300',  glow: 'hover:shadow-indigo-100',  arrow: 'text-indigo-500'  },
  rose:       { gradient: 'from-rose-500 to-pink-600',      iconBg: 'bg-rose-50',        iconText: 'text-rose-500',    border: 'border-slate-200 hover:border-rose-300',    glow: 'hover:shadow-rose-100',    arrow: 'text-rose-400'    },
  violet:     { gradient: 'from-violet-500 to-purple-600',  iconBg: 'bg-violet-50',      iconText: 'text-violet-600',  border: 'border-slate-200 hover:border-violet-300',  glow: 'hover:shadow-violet-100',  arrow: 'text-violet-500'  },
  gray:       { gradient: 'from-gray-300 to-gray-400',      iconBg: 'bg-gray-100',       iconText: 'text-gray-300',    border: 'border-gray-200',                           glow: '',                         arrow: ''                 },
};

const ACTIVE_COUNT = CATEGORIES.filter(c => c.key !== 'locked').reduce((sum, c) => sum + c.modules.length, 0);

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-100 via-white to-blue-50/40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-linear-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-linear-to-tl from-violet-400/10 to-purple-500/8 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Contenu */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-blue-500 rounded-full px-3 py-1 mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600">{ACTIVE_COUNT} modules actifs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Liste des modules
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-md">
            Accédez à tous les outils de gestion depuis cet espace centralisé.
          </p>
        </div>

        {/* Catégories */}
        <div className="space-y-10">
          {CATEGORIES.map((category) => {
            const CatIcon = category.icon;
            return (
              <div key={category.key}>

                {/* En-tête de catégorie */}
                <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${category.iconBg}`}>
                    <CatIcon className={category.iconColor} size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 mb-0.5">{category.label}</h2>
                    <p className="text-xs text-slate-400">{category.desc}</p>
                  </div>
                </div>

                {/* Grille de modules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.modules.map((mod) => {
                    const c = COLOR_MAP[mod.color];
                    const Icon = mod.icon;
                    const isLocked = (mod as any).locked;

                    if (isLocked) {
                      return (
                        <div
                          key={mod.label}
                          className="relative shadow-sm bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 cursor-not-allowed overflow-hidden"
                        >
                          <span className="absolute top-3 right-3 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            En cours
                          </span>
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                            <FiLock className="text-gray-300" size={16} />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-400 mb-1">{mod.label}</h3>
                          <p className="text-xs text-gray-300 leading-relaxed">{mod.desc}</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={mod.path}
                        onClick={() => navigate(mod.path, {
                          state: mod.defaultTab ? { targetTab: mod.defaultTab } : undefined,
                        })}
                        className={`
                          group relative shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl p-5
                          cursor-pointer border ${c.border}
                          transition-all duration-300
                          hover:shadow-xl ${c.glow} hover:-translate-y-1.5
                          overflow-hidden
                        `}
                      >
                        {/* Barre colorée en haut au hover */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />

                        {/* Blob décoratif */}
                        <div className={`absolute -top-6 -right-6 w-24 h-24 bg-linear-to-br ${c.gradient} opacity-[0.06] rounded-full group-hover:scale-150 group-hover:opacity-[0.10] transition-all duration-500`} />

                        <div className="relative z-10">
                          <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105`}>
                            <Icon className={`${c.iconText}`} size={22} />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-1">{mod.label}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.desc}</p>
                          <div className={`flex items-center gap-1 text-xs font-medium ${c.arrow} opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0`}>
                            <span>Accéder</span>
                            <FiArrowRight size={11} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 mt-12">
          2 modules en cours de développement
        </p>
      </div>
    </div>
  );
}

export default HomePage;