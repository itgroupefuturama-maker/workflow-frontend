import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiSettings, FiChevronDown, FiChevronRight,
  FiBarChart2, FiActivity, FiLayers, FiMap, FiList, FiPlusSquare,
  FiFolder, FiLoader, FiGlobe, FiArrowLeft, FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../app/store';
import { fetchDossiersCommuns, setCurrentClientFactureId, type DossierCommun } from '../app/front_office/dossierCommunSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

interface SidebarProps {
  module?: 'ticketing' | 'attestation' | 'hotel';
}

export default function Sidebar({ module }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const dispatch = useAppDispatch();

  // ── NOUVEAU : état collapsed ─────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  const { data: dossiers, loading: loadingDossiers, currentClientFactureId } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  const dossiersTicketing = dossiers.filter(dossier => {
    return (dossier.dossierCommunColab || []).some(colab =>
      colab?.status === "CREER" &&
      colab?.module?.nom?.toLowerCase() === module?.toLowerCase() &&
      (colab.prestation || []).length > 0
    );
  });

  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Accueil: true,
    Paramètres: true,
  });

  useEffect(() => {
    dispatch(fetchDossiersCommuns());
  }, [dispatch]);

  useEffect(() => {
    if (loadingDossiers || dossiersTicketing.length === 0) return;
    const activeIsInModule = dossiersTicketing.some(
      (d) => d.id === currentClientFactureId?.id
    );
    if (!currentClientFactureId || !activeIsInModule) {
      dispatch(setCurrentClientFactureId(dossiersTicketing[0]));
    }
  }, [loadingDossiers, dossiersTicketing.length, module]);

  const isTabActive = (tab: string): boolean => {
    const navTab = location.state?.targetTab as string | undefined;
    if (navTab) return navTab === tab;
    return pathname.split('/').includes(tab) || pathname.endsWith(tab);
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const staticMenuConfig = [
    {
      title: 'Accueil',
      icon: <FiHome size={18} />,
      links: [
        { label: 'Tableau de bord', path: 'accueil', icon: <FiBarChart2 size={16} />, tab: 'dashboard' },
        { label: 'État',            path: 'accueil', icon: <FiActivity  size={16} />, tab: 'etat'      },
      ]
    },
    {
      title: 'Paramètres',
      icon: <FiSettings size={18} />,
      links: module === 'attestation'
        ? [
            { label: 'Raison Annulation', path: `parametres/${module}`, icon: <FiMap    size={16} />, tab: 'listeRaisonAnnulation' },
            { label: 'Exigence de voyage',path: `parametres/${module}`, icon: <FiMap    size={16} />, tab: 'listeExigence'         },
            { label: 'Gestion de prix',   path: `parametres/${module}`, icon: <FiLayers size={16} />, tab: 'gestionPrix'           },
          ]
        : module === 'ticketing'
        ? [
            { label: 'Raison Annulation',   path: `parametres/${module}`, icon: <FiMap    size={16} />, tab: 'listeRaisonAnnulation' },
            { label: 'Service & spécifique',path: `parametres/${module}`, icon: <FiLayers size={16} />, tab: 'listeService'          },
            { label: 'Exigence de voyage',  path: `parametres/${module}`, icon: <FiMap    size={16} />, tab: 'listeExigence'         },
          ]
        : module === 'hotel'
        ? [
            { label: 'Plateform',         path: 'parametres', icon: <FiLayers size={16} />, tab: 'plateformes'          },
            { label: 'Type chambre',      path: 'parametres', icon: <FiMap    size={16} />, tab: 'typeChambre'           },
            { label: 'Service',           path: 'parametres', icon: <FiMap    size={16} />, tab: 'service'               },
            { label: 'Raison Annulation', path: 'parametres', icon: <FiMap    size={16} />, tab: 'listeRaisonAnnulation' },
          ]
        : [
            { label: 'Service & spécifique',path: 'parametres', icon: <FiLayers size={16} />, tab: 'listeService'          },
            { label: 'Exigence de voyage',  path: 'parametres', icon: <FiMap    size={16} />, tab: 'listeExigence'         },
            { label: 'Raison Annulation',   path: 'parametres', icon: <FiMap    size={16} />, tab: 'listeRaisonAnnulation' },
          ]
    }
  ];

  const subLinks =
    module === 'ticketing'
      ? [
          { label: 'Entête Prospection', path: '/dossiers-communs/ticketing/pages', icon: <FiPlusSquare size={16} />, tab: 'prospection' },
          { label: 'Liste Billets',      path: '/dossiers-communs/ticketing/pages', icon: <FiList       size={16} />, tab: 'billet'      },
        ]
      : module === 'hotel'
      ? [
          { label: 'Liste Benchmarking', path: '/dossiers-communs/hotel/pages', icon: <FiPlusSquare size={16} />, tab: 'benchmarking' },
          { label: 'Liste Reservation',  path: '/dossiers-communs/hotel/pages', icon: <FiList       size={16} />, tab: 'hotel'  },
        ]
      : module === 'attestation'
      ? [
          { label: 'Entête Attestation', path: '/dossiers-communs/attestation/pages', icon: <FiPlusSquare size={16} />, tab: 'attestation' },
        ]
      : [];

  const handleDossierSelect = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    if (module === 'ticketing')   navigate('/dossiers-communs/ticketing/pages',   { state: { targetTab: 'prospection'  } });
    if (module === 'attestation') navigate('/dossiers-communs/attestation/pages', { state: { targetTab: 'attestation'  } });
    if (module === 'hotel')       navigate('/dossiers-communs/hotel/pages',       { state: { targetTab: 'benchmarking' } });
  };

  const handleSubPageClick = (path: string, tab: string) => {
    navigate(path, { state: { targetTab: tab } });
  };

  const moduleConfig = {
    ticketing:   { label: 'Ticketing',   icon: <FiList   size={16} />, color: 'yellow' },
    attestation: { label: 'Attestation', icon: <FiFolder size={16} />, color: 'red'    },
    hotel:       { label: 'Hotel',       icon: <FiFolder size={16} />, color: 'orange' },
  };

  const current = module ? moduleConfig[module] : { label: module, icon: <FiLayers size={16} />, color: 'slate' };

  const colorClasses = {
    yellow: { border: 'border-l-yellow-500', iconBg: 'bg-yellow-500', text: 'text-yellow-600' },
    orange: { border: 'border-l-orange-500', iconBg: 'bg-orange-500', text: 'text-orange-600' },
    red:    { border: 'border-l-red-500',    iconBg: 'bg-red-500',    text: 'text-red-600'    },
    slate:  { border: 'border-l-slate-400',  iconBg: 'bg-slate-400',  text: 'text-slate-600'  },
  };

  const colors = colorClasses[current.color];

  // ── Toutes les icônes à afficher en mode collapsed (dans l'ordre) ──
  const allCollapsedIcons = [
    // Accueil
    ...staticMenuConfig[0].links.map(link => ({ icon: link.icon, tab: link.tab, path: link.path, tooltip: link.label })),
    // Paramètres
    ...staticMenuConfig[1].links.map(link => ({ icon: link.icon, tab: link.tab, path: link.path, tooltip: link.label })),
  ];

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* ── Header module ── */}
      <div className="p-3 flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className={`flex-1 bg-white border border-gray-200 rounded-lg border-l-4 ${colors.border} p-3 mr-2`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gray-500 block mb-0.5">Espace</span>
                <h2 className={`text-sm font-semibold truncate ${colors.text}`}>{current.label}</h2>
              </div>
              <div className={`${colors.iconBg} text-white p-2 rounded-lg shrink-0`}>
                {current.icon}
              </div>
            </div>
          </div>
        )}

        {/* Bouton toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          {collapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

        {/* ══ MODE COLLAPSED : uniquement les icônes avec tooltip ══ */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 py-3 px-2">

            {/* Séparateur Paramètres Globaux */}
            <div className="w-8 h-px bg-gray-200 my-1" />

            {allCollapsedIcons.map((item) => {
              const active = isTabActive(item.tab);
              return (
                <div key={item.tab} className="relative group">
                  <button
                    onClick={() => navigate(item.path, { state: { targetTab: item.tab } })}
                    className={`p-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {item.icon}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {item.tooltip}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Séparateur Dossiers */}
            <div className="w-8 h-px bg-gray-200 my-1" />

            {/* Icônes dossiers */}
            {dossiersTicketing.map((dossier) => {
              const isFolderActive = currentClientFactureId?.id === dossier.id;
              return (
                <div key={dossier.id} className="relative group">
                  <button
                    onClick={() => handleDossierSelect(dossier)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isFolderActive
                        ? `${colors.iconBg} text-white shadow-md`
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <FiFolder size={16} />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {dossier.numero}
                      <span className="block text-gray-400 text-[10px]">
                        {dossier.clientfacture?.libelle || 'Client...'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Sous-liens du dossier actif */}
            {subLinks.map((link) => {
              const active = isTabActive(link.tab);
              return (
                <div key={link.tab} className="relative group">
                  <button
                    onClick={() => handleSubPageClick(link.path, link.tab)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {link.icon}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {link.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          /* ══ MODE EXPANDED : rendu original ══ */
          <>
            {/* Paramètres globaux */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 px-2 mb-3">
                <FiGlobe size={14} className="text-gray-500" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paramètres Globaux</h3>
              </div>

              <div className="space-y-1">
                {staticMenuConfig.map((menu) => {
                  const isOpen = openMenus[menu.title];
                  return (
                    <div key={menu.title}>
                      <button
                        onClick={() => toggleMenu(menu.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{menu.icon}</span>
                          <span className="font-medium text-sm">{menu.title}</span>
                        </div>
                        {isOpen
                          ? <FiChevronDown  size={16} className="text-gray-400" />
                          : <FiChevronRight size={16} className="text-gray-400" />
                        }
                      </button>

                      {isOpen && (
                        <div className="mt-1 ml-3 pl-6 border-l border-gray-200 space-y-1">
                          {menu.links.map((link) => {
                            const active = isTabActive(link.tab);
                            return (
                              <button
                                key={link.label}
                                onClick={() => navigate(link.path, { state: { targetTab: link.tab } })}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                  active
                                    ? 'bg-white text-gray-900 font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                }`}
                              >
                                <span className={active ? 'text-gray-700' : 'text-gray-400'}>{link.icon}</span>
                                {link.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dossiers spécifiques */}
            <div className="p-3">
              <div className="inline-flex items-center mb-5">
                <button
                  onClick={() => navigate(`/dossiers-communs/liste-by-module/${module}`)}
                  className="flex items-center gap-2 pb-1 group border-b border-transparent hover:border-slate-800 transition-all duration-300"
                >
                  <FiArrowLeft size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:-translate-x-1 transition-all" />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">
                    Voir Tous les dossiers
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-2 mb-3">
                <FiFolder size={14} className="text-gray-500" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dossiers {module}</h3>
                {dossiersTicketing.length > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                    {dossiersTicketing.length}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {loadingDossiers ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <FiLoader className="animate-spin text-gray-400" size={20} />
                    <span className="text-xs text-gray-500">Chargement...</span>
                  </div>
                ) : dossiersTicketing.length === 0 ? (
                  <div className="py-6 text-center">
                    <FiFolder className="mx-auto mb-2 text-gray-300" size={24} />
                    <p className="text-xs text-gray-500">Aucun dossier</p>
                  </div>
                ) : (
                  dossiersTicketing.map((dossier) => {
                    const isFolderActive = currentClientFactureId?.id === dossier.id;
                    return (
                      <div key={dossier.id}>
                        <button
                          onClick={() => handleDossierSelect(dossier)}
                          className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isFolderActive
                              ? `${colors.iconBg} text-white shadow-md`
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <FiFolder size={18} className={`shrink-0 mt-0.5 ${isFolderActive ? 'text-white' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm font-semibold truncate ${isFolderActive ? 'text-white' : 'text-gray-900'}`}>
                              {dossier.numero}
                            </p>
                            <p className={`text-xs truncate mt-0.5 ${isFolderActive ? 'text-white' : 'text-gray-500'}`}>
                              {dossier.clientfacture?.libelle || 'Client...'}
                            </p>
                          </div>
                        </button>

                        {isFolderActive && subLinks.length > 0 && (
                          <div className="mt-1 ml-9 pl-3 border-l-2 border-gray-200 space-y-1">
                            {subLinks.map((link) => {
                              const active = isTabActive(link.tab);
                              return (
                                <button
                                  key={link.label}
                                  onClick={() => handleSubPageClick(link.path, link.tab)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                                    active
                                      ? 'bg-gray-100 text-gray-900 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <span className={active ? 'text-gray-700' : 'text-gray-400'}>{link.icon}</span>
                                  {link.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`px-4 py-3 border-t border-gray-200 bg-gray-50 shrink-0 ${collapsed ? 'text-center' : ''}`}>
        {collapsed
          ? <span className="text-[10px] text-gray-400 font-bold">v1.2</span>
          : <p className="text-xs text-center text-gray-500 font-medium">Ticketing v1.2.0</p>
        }
      </div>
    </aside>
  );
}