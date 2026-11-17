
import { useNavigate } from 'react-router-dom';
import {
  FiFolder,
  FiCheckCircle,
  FiTag,
  FiFileText,
  FiLock,
  FiSettings,
  FiHome,
  FiArrowRight,
  FiMapPin,
  FiShield,
  FiDatabase,
  FiMessageSquare,
  FiUsers,
  FiPlusCircle,
  FiList,
  FiUserCheck,
  FiUser,
  FiHeadphones,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiClipboard,
  FiAward,
} from 'react-icons/fi';
import { useState } from "react";

const CATEGORIES = [
  {
    key: 'prestation',
    label: 'Modules prestation',
    desc: 'Gestion des prestations clients.',
    icon: FiTag,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    modules: [
      { label: 'Ticketing', desc: 'Suivi des demandes et tickets', path: '/dossiers-communs/ticketing/pages', defaultTab: 'prospection', icon: FiTag, color: 'amber' },
      { label: 'Hôtel', desc: 'Gestion des réservations', path: '/dossiers-communs/hotel/pages', defaultTab: 'prospection', icon: FiHome, color: 'orange' },
      { label: 'Assurance', desc: 'Contrats et garanties', path: '/dossiers-communs/assurance/pages', defaultTab: 'prospection', icon: FiShield, color: 'green' },
      { label: 'Visa', desc: 'Gestion des visas', path: '/dossiers-communs/visa/pages', defaultTab: 'prospection', icon: FiMapPin, color: 'indigo' },
      { label: 'Attestation Voyage', desc: 'Génération des attestations', path: '/dossiers-communs/attestation/pages', defaultTab: 'prospection', icon: FiFileText, color: 'rose' },
    ],
  },
  {
    key: 'workspace',
    label: 'Espace de travail',
    desc: 'Documents, tâches et outils partagés.',
    icon: FiHome,
    iconColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
    modules: [
      { label: 'Dossier', desc: 'Fichiers partagés', path: '/dossiers-communs', defaultTab: null, icon: FiFolder, color: 'blue' },
      { label: 'Liste de tâches', desc: 'Tâches quotidiennes', path: '/dossiers-communs/todolist', defaultTab: null, icon: FiCheckCircle, color: 'teal' },
      { label: 'Base de connaissances', desc: 'Informations et ressources', path: '/dossiers-communs/base-connaissance', defaultTab: null, icon: FiDatabase, color: 'cyan' },
      { label: 'Contrôle', desc: 'Audit et vérification', path: '/dossiers-communs/pageControle', defaultTab: null, icon: FiClipboard, color: 'slate' },
      { label: 'Résultats et statistiques', desc: 'Analyses de données', path: '/dossiers-communs/pageResultatStatDossierCommun', defaultTab: null, icon: FiBarChart2, color: 'indigo' },
      { label: 'Tableau de bord', desc: "Vue d'ensemble", path: '/dossiers-communs/pageTableauBord', defaultTab: null, icon: FiPieChart, color: 'blue' },
      { label: 'État des ventes', desc: 'Suivi des ventes', path: '/dossiers-communs/pageEtatVente', defaultTab: null, icon: FiTrendingUp, color: 'teal' },
    ],
  },
  {
    key: 'clients',
    label: 'Gestion des clients',
    desc: 'Profils, documents et fidélité des voyageurs.',
    icon: FiUsers,
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    modules: [
      { label: 'Clients bénéficiaires', desc: 'Base de données clients', path: '/dossiers-communs/AllClientBeneficiairePage', defaultTab: null, icon: FiUserCheck, color: 'green' },
      { label: 'Profilage', desc: 'Profils des bénéficiaires', path: '/dossiers-communs/pageProfilage', defaultTab: null, icon: FiUser, color: 'teal' },
      { label: 'Documents clients', desc: 'Passeport, CIN et pièces', path: '/dossiers-communs/pagePassport', defaultTab: null, icon: FiFileText, color: 'cyan' },
      { label: 'SMS Anniversaire', desc: 'Fidélité et anniversaires', path: '/dossiers-communs/pageAnniversaire', defaultTab: null, icon: FiMessageSquare, color: 'roseSombre' },
      { label: 'Liste des passagers', desc: 'Passagers par vol et dossier', path: '/dossiers-communs/pageListePassage', defaultTab: null, icon: FiList, color: 'navy' },
      { label: 'Miles compagnies', desc: 'Miles des compagnies', path: '/dossiers-communs/pageMilesCompagnie', defaultTab: null, icon: FiAward, color: 'fluo' },
    ],
  },
  {
    key: 'sav',
    label: 'Service après-vente',
    desc: 'Demandes et assistance client.',
    icon: FiHeadphones,
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-50',
    modules: [
      { label: 'SAV', desc: 'Service après-vente', path: '/dossiers-communs/pageSAV', defaultTab: null, icon: FiPlusCircle, color: 'amber' },
    ],
  },
  {
    key: 'parametres',
    label: "Paramètres globaux de l'application",
    desc: 'Configuration et gestion des utilisateurs.',
    icon: FiSettings,
    iconColor: 'text-violet-700',
    iconBg: 'bg-violet-50',
    modules: [
      { label: 'Paramètres de l’application', desc: 'Configuration générale', path: '/dossiers-communs/parametre', defaultTab: null, icon: FiSettings, color: 'violet' },
      { label: 'Paramètres PDF', desc: 'Modèles, logo et cachet', path: '/dossiers-communs/parametrePdf', defaultTab: null, icon: FiFileText, color: 'violet' },
      { label: 'Gestion des commentaires', desc: 'Gestion des commentaires', path: '/dossiers-communs/parametreCommentaire', defaultTab: null, icon: FiMessageSquare, color: 'violet' },
      { label: 'Paramètres utilisateurs', desc: 'Gestion des profils', path: '/dossiers-communs/parametreUtilisateur', defaultTab: null, icon: FiUsers, color: 'violet' },
      { label: 'Gestion des couleurs', desc: 'Palettes et thèmes', path: '/dossiers-communs/couleurs', defaultTab: null, icon: FiSettings, color: 'violet' },
    ],
  },
];

const COLOR_MAP: Record<string, {
  iconBg: string;
  iconText: string;
  hoverBorder: string;
}> = {
  blue:       { iconBg: 'bg-blue-50',    iconText: 'text-blue-700',    hoverBorder: 'hover:border-blue-300' },
  teal:       { iconBg: 'bg-teal-50',    iconText: 'text-teal-700',    hoverBorder: 'hover:border-teal-300' },
  cyan:       { iconBg: 'bg-cyan-50',    iconText: 'text-cyan-700',    hoverBorder: 'hover:border-cyan-300' },
  slate:      { iconBg: 'bg-slate-100',  iconText: 'text-slate-600',   hoverBorder: 'hover:border-slate-300' },
  green:      { iconBg: 'bg-green-50',   iconText: 'text-green-700',   hoverBorder: 'hover:border-green-300' },
  roseSombre: { iconBg: 'bg-rose-50',    iconText: 'text-rose-700',    hoverBorder: 'hover:border-rose-300' },
  navy:       { iconBg: 'bg-blue-50',    iconText: 'text-blue-800',    hoverBorder: 'hover:border-blue-300' },
  fluo:       { iconBg: 'bg-emerald-50', iconText: 'text-emerald-700', hoverBorder: 'hover:border-emerald-300' },
  amber:      { iconBg: 'bg-amber-50',   iconText: 'text-amber-700',   hoverBorder: 'hover:border-amber-300' },
  orange:     { iconBg: 'bg-orange-50',  iconText: 'text-orange-700',  hoverBorder: 'hover:border-orange-300' },
  indigo:     { iconBg: 'bg-indigo-50',  iconText: 'text-indigo-700',  hoverBorder: 'hover:border-indigo-300' },
  rose:       { iconBg: 'bg-rose-50',    iconText: 'text-rose-700',    hoverBorder: 'hover:border-rose-300' },
  violet:     { iconBg: 'bg-violet-50',  iconText: 'text-violet-700',  hoverBorder: 'hover:border-violet-300' },
  gray:       { iconBg: 'bg-gray-100',   iconText: 'text-gray-500',    hoverBorder: 'hover:border-gray-300' },
};

// Seuls les modules affichés sur la page sont comptés (les paramètres globaux sont dans le menu ⚙).
const ACTIVE_COUNT = CATEGORIES.filter((category) => category.key !== 'parametres').reduce(
  (total, category) => total + category.modules.length,
  0
);



function HomePage() {
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsCategory = CATEGORIES.find(
    (category) => category.key === "parametres"
  );

  const visibleCategories = CATEGORIES.filter(
    (category) => category.key !== "parametres"
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* En-tête compact */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FiFolder size={20} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Liste des modules
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Accédez aux outils de gestion Al Bouraq.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {ACTIVE_COUNT} modules
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-label="Ouvrir les paramètres globaux"
                aria-expanded={settingsOpen}
                className={`flex h-10 w-10 items-center justify-center rounded-lg
                  border transition-colors
                  ${
                    settingsOpen
                      ? "border-slate-400 bg-slate-100 text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <FiSettings size={18} />
              </button>

              {settingsOpen && settingsCategory && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72
                  overflow-hidden rounded-xl border border-slate-200
                  bg-white p-2 shadow-xl">

                  <p className="px-3 py-2 text-xs font-semibold uppercase
                    tracking-wider text-slate-400">
                    Paramètres globaux
                  </p>

                  {settingsCategory.modules.map((mod) => {
                    const Icon = mod.icon;

                    return (
                      <button
                        key={mod.path}
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          navigate(mod.path);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg
                          px-3 py-2.5 text-left text-sm text-slate-700
                          transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center
                          justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon size={16} />
                        </span>

                        <span className="min-w-0 flex-1">{mod.label}</span>

                        <FiArrowRight
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Catégories */}
        <div className="space-y-6">
          {visibleCategories.map((category) => {
            const CategoryIcon = category.icon;

            return (
              <section key={category.key}>
                {/* Titre de catégorie */}
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${category.iconBg}`}
                  >
                    <CategoryIcon
                      className={category.iconColor}
                      size={16}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-800">
                      {category.label}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {category.desc}
                    </p>
                  </div>

                  <div className="ml-auto hidden h-px flex-1 bg-slate-200 sm:block" />
                  <span className="shrink-0 text-xs text-slate-400">
                    {category.modules.length}
                  </span>
                </div>

                {/* Grille compacte */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {category.modules.map((mod) => {
                    const Icon = mod.icon;
                    const colors = COLOR_MAP[mod.color] ?? COLOR_MAP.blue;
                    const isLocked = Boolean((mod as any).locked);

                    if (isLocked) {
                      return (
                        <div
                          key={mod.path}
                          aria-disabled="true"
                          className="flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-100/70 px-3 py-3 opacity-70"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                            <FiLock size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-slate-600">
                              {mod.label}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {mod.desc}
                            </p>
                          </div>

                          <span className="shrink-0 text-[10px] font-medium text-slate-500">
                            En cours
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={mod.path}
                        type="button"
                        onClick={() =>
                          navigate(mod.path, {
                            state: mod.defaultTab
                              ? { targetTab: mod.defaultTab }
                              : undefined,
                          })
                        }
                        className={`group flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition-colors duration-150 ${colors.hoverBorder} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold leading-5 text-slate-800">
                            {mod.label}
                          </h3>
                          <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-slate-500">
                            {mod.desc}
                          </p>
                        </div>

                        <FiArrowRight
                          size={15}
                          className="shrink-0 text-white transition-colors group-hover:text-slate-700"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Pied de page */}
        <footer className="mt-7 border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Copyright © {new Date().getFullYear()} ABT IT Développement
          </p>
        </footer>
      </div>
    </main>
  );
}

export default HomePage;
