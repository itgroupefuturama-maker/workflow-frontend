import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiSettings, FiChevronDown, FiChevronRight,
  FiBarChart2, FiActivity, FiLayers, FiMap, FiList, FiPlusSquare,
  FiFolder, FiLoader, FiGlobe, FiArrowLeft, FiChevronsLeft, FiChevronsRight,
  FiUsers
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../app/store';
import { setCurrentClientFactureId, type DossierCommun } from '../app/front_office/dossierCommunSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

interface SidebarProps {
  module?: 'ticketing' | 'attestation' | 'hotel' | 'visa' | 'assurance';
}

export default function Sidebar({ module }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  
  const dispatch = useAppDispatch();

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
    Accueil: false,
    Paramètres: false,
  });

  useEffect(() => {
    if (loadingDossiers || dossiersTicketing.length === 0) return;
    const activeIsInModule = dossiersTicketing.some(d => d.id === currentClientFactureId?.id);
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
      icon: <FiHome size={16} />,
      links: [
        { label: 'Tableau de bord', path: 'accueil', icon: <FiBarChart2 size={15} />, tab: 'dashboard' },
        { label: 'État',            path: 'accueil', icon: <FiActivity  size={15} />, tab: 'etat'      },
      ]
    },
    {
      title: 'Paramètres',
      icon: <FiSettings size={16} />,
      links: module === 'attestation'
        ? [
            { label: 'Raison Annulation',  path: `parametres/${module}`, icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
            { label: 'Exigence de voyage', path: `parametres/${module}`, icon: <FiMap    size={15} />, tab: 'listeExigence'         },
            { label: 'Gestion de prix',    path: `parametres/${module}`, icon: <FiLayers size={15} />, tab: 'gestionPrix'           },
          ]
        : module === 'ticketing'
        ? [
            { label: 'Raison Annulation',    path: `parametres/${module}`, icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
            { label: 'Service & spécifique', path: `parametres/${module}`, icon: <FiLayers size={15} />, tab: 'listeService'          },
            { label: 'Exigence de voyage',   path: `parametres/${module}`, icon: <FiMap    size={15} />, tab: 'listeExigence'         },
          ]
        : module === 'hotel'
        ? [
            { label: 'Plateform',         path: 'parametres', icon: <FiLayers size={15} />, tab: 'plateformes'          },
            { label: 'Type chambre',      path: 'parametres', icon: <FiMap    size={15} />, tab: 'typeChambre'           },
            { label: 'Service',           path: 'parametres', icon: <FiMap    size={15} />, tab: 'service'               },
            { label: 'Raison Annulation', path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : module === 'visa'
        ? [
            { label: 'Type de Visa',              path: 'parametres', icon: <FiLayers size={15} />, tab: 'type'          },
            { label: 'Durée de Visa',             path: 'parametres', icon: <FiMap    size={15} />, tab: 'duree'           },
            { label: 'Visa Entrée',               path: 'parametres', icon: <FiMap    size={15} />, tab: 'entree'               },
            { label: 'Paramétre de Visa',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'params'               },
            { label: 'Paramétre de Document',     path: 'parametres', icon: <FiMap    size={15} />, tab: 'docsparams'               },
            { label: 'Document Visa',             path: 'parametres', icon: <FiMap    size={15} />, tab: 'docs'               },
            { label: 'Visa Consulat',             path: 'parametres', icon: <FiMap    size={15} />, tab: 'consulat'               },
            { label: 'Raison Annulation',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : module === 'assurance'
        ? [
            { label: 'Assurance Parametre', path: 'parametres', icon: <FiLayers size={15} />, tab: 'params'          },
            { label: 'Assurance Document',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'docs'         },
            { label: 'Tarif Plein',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'tarifPlein'         },
            { label: 'Tarif Réduit',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'tarifReduit'         },
            { label: 'Raison Annulation',    path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : [
            { label: 'Service & spécifique', path: 'parametres', icon: <FiLayers size={15} />, tab: 'listeService'          },
            { label: 'Exigence de voyage',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeExigence'         },
            { label: 'Raison Annulation',    path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
    }
  ];

  const subLinks =
    module === 'ticketing'
      ? [
          { label: 'Entête Prospection', path: '/dossiers-communs/ticketing/pages',   icon: <FiPlusSquare size={14} />, tab: 'prospection' },
          { label: 'Liste Billets',      path: '/dossiers-communs/ticketing/pages',   icon: <FiList       size={14} />, tab: 'billet'      },
          { label: 'Liste Bénéficiaire', path: '/dossiers-communs/ticketing/pages',   icon: <FiUsers      size={14} />, tab: 'beneficiaire'},
        ]
      : module === 'hotel'
      ? [
          { label: 'Liste Benchmarking', path: '/dossiers-communs/hotel/pages',       icon: <FiPlusSquare size={14} />, tab: 'prospection' },
          { label: 'Liste Reservation',  path: '/dossiers-communs/hotel/pages',       icon: <FiList       size={14} />, tab: 'hotel'        },
          { label: 'Liste Bénéficiaire', path: '/dossiers-communs/hotel/pages',       icon: <FiUsers      size={14} />, tab: 'beneficiaire'},
        ]
      : module === 'attestation'
      ? [
          { label: 'Entête Attestation', path: '/dossiers-communs/attestation/pages', icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Bénéficiaire', path: '/dossiers-communs/attestation/pages', icon: <FiUsers      size={14} />, tab: 'beneficiaire'},
        ]
      : module === 'visa'
      ? [
          { label: 'Liste Prospection', path: '/dossiers-communs/visa/pages',       icon: <FiPlusSquare size={14} />, tab: 'prospection' },
          { label: 'Liste Reservation',  path: '/dossiers-communs/visa/pages',       icon: <FiList       size={14} />, tab: 'visa'        },
          { label: 'Liste Bénéficiaire', path: '/dossiers-communs/visa/pages',   icon: <FiUsers      size={14} />, tab: 'beneficiaire'},
        ]
      : module === 'assurance'
      ? [
          { label: 'Liste Prospection', path: '/dossiers-communs/assurance/pages',       icon: <FiPlusSquare size={14} />, tab: 'prospection' },
          { label: 'Liste Reservation',  path: '/dossiers-communs/assurance/pages',       icon: <FiList       size={14} />, tab: 'assurance'        },
          { label: 'Liste Bénéficiaire', path: '/dossiers-communs/assurance/pages',   icon: <FiUsers      size={14} />, tab: 'beneficiaire'},
        ]
      : [];

  const handleDossierSelect = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    if (module === 'ticketing')   navigate('/dossiers-communs/ticketing/pages',   { state: { targetTab: 'prospection'  } });
    if (module === 'attestation') navigate('/dossiers-communs/attestation/pages', { state: { targetTab: 'prospection'  } });
    if (module === 'hotel')       navigate('/dossiers-communs/hotel/pages',       { state: { targetTab: 'prospection' } });
    if (module === 'visa')        navigate('/dossiers-communs/visa/pages',        { state: { targetTab: 'prospection' } });
    if (module === 'assurance')   navigate('/dossiers-communs/assurance/pages',   { state: { targetTab: 'prospection' } });
  };

  const handleSubPageClick = (path: string, tab: string) => {
    navigate(path, { state: { targetTab: tab } });
  };

  // Config par module
  const moduleConfig = {
    ticketing:   { label: 'Ticketing',        icon: <FiList   size={15} />, gradient: 'from-amber-400 to-orange-500',  iconBg: 'bg-amber-500',   activeBg: 'bg-amber-500',   activeText: 'text-amber-600',   border: 'border-amber-200',   dotColor: 'bg-amber-400'   },
    attestation: { label: 'Attestation',      icon: <FiFolder size={15} />, gradient: 'from-rose-400 to-pink-500',     iconBg: 'bg-rose-500',    activeBg: 'bg-rose-500',    activeText: 'text-rose-600',    border: 'border-rose-200',    dotColor: 'bg-rose-400'    },
    hotel:       { label: 'Hôtel',            icon: <FiHome   size={15} />, gradient: 'from-orange-400 to-red-500',    iconBg: 'bg-orange-500',  activeBg: 'bg-orange-500',  activeText: 'text-orange-600',  border: 'border-orange-200',  dotColor: 'bg-orange-400'  },
    visa:        { label: 'Visa',             icon: <FiMap    size={15} />, gradient: 'from-blue-400 to-indigo-500',   iconBg: 'bg-blue-500',    activeBg: 'bg-blue-500',    activeText: 'text-blue-600',    border: 'border-blue-200',    dotColor: 'bg-blue-400'    },
    assurance:   { label: 'Assurance',        icon: <FiMap    size={15} />, gradient: 'from-green-600 to-green-500',   iconBg: 'bg-green-500',    activeBg: 'bg-green-500',    activeText: 'text-green-600',    border: 'border-green-200',    dotColor: 'bg-green-400'    },
  };

  const current = module
    ? moduleConfig[module]
    : { label: '—', icon: <FiLayers size={15} />, gradient: 'from-slate-400 to-slate-500', iconBg: 'bg-slate-400', activeBg: 'bg-slate-500', activeText: 'text-slate-600', border: 'border-slate-200', dotColor: 'bg-slate-400' };

  const allCollapsedIcons = [
    ...staticMenuConfig[0].links.map(l => ({ icon: l.icon, tab: l.tab, path: l.path, tooltip: l.label })),
    ...staticMenuConfig[1].links.map(l => ({ icon: l.icon, tab: l.tab, path: l.path, tooltip: l.label })),
  ];

  return (
    <aside
      className={`h-full sticky top-0 flex flex-col bg-slate-700 border-r border-slate-200/80 transition-all duration-300 ease-in-out shadow-sm ${
        collapsed ? 'w-[60px]' : 'w-64'
      }`}
    >

      {/* ══ HEADER ══ */}
      <div className={`shrink-0 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            {/* Badge module */}
            <div className={`flex-1 flex items-center gap-2.5 bg-linear-to-r ${current.gradient} rounded-xl px-3 py-2.5 shadow-sm`}>
              <div className="bg-white/20 p-1.5 rounded-lg">
                <span className="text-white">{current.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/70 font-medium leading-none mb-0.5">Module actif</p>
                <p className="text-sm font-bold text-white truncate leading-none">{current.label}</p>
              </div>
              {/* Petite forme déco */}
              <div className="ml-auto w-6 h-6 rounded-full bg-white/10" />
            </div>

            {/* Bouton collapse */}
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg text-white hover:text-slate-100 hover:bg-slate-600 transition-colors shrink-0"
              title="Réduire"
            >
              <FiChevronsLeft size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Icône module seule */}
            <div className={`w-9 h-9 bg-linear-to-br ${current.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
              <span className="text-white">{current.icon}</span>
            </div>
            {/* Bouton expand */}
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-white hover:text-white hover:bg-slate-600 transition-colors"
              title="Agrandir"
            >
              <FiChevronsRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="mx-3 h-px bg-linear-to-r from-transparent via-slate-600 to-transparent shrink-0" />

      {/* ══ NAV ══ */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent py-2">

        {/* ── MODE COLLAPSED ── */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-2">

            {/* Section nav principale */}
            <div className="w-full space-y-1">
              {allCollapsedIcons.map((item) => {
                const active = isTabActive(item.tab);
                return (
                  <div key={item.tab} className="relative group">
                    <button
                      onClick={() => navigate(item.path, { state: { targetTab: item.tab } })}
                      className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? `bg-linear-to-br ${current.gradient} text-white shadow-sm`
                          : 'text-white hover:bg-slate-600 hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                      <div className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                        {item.tooltip}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Séparateur Dossiers */}
            <div className="w-7 h-px bg-white my-2" />

            {/* Dossiers */}
            {dossiersTicketing.map((dossier) => {
              const isActive = currentClientFactureId?.id === dossier.id;
              return (
                <div key={dossier.id} className="relative group w-full">
                  <button
                    onClick={() => handleDossierSelect(dossier)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-linear-to-br ${current.gradient} text-white shadow-sm`
                        : 'text-white hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    <FiFolder size={15} />
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {dossier.numero}
                      <span className="block text-white text-[10px] mt-0.5">
                        {dossier.clientfacture?.libelle || 'Client...'}
                      </span>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Sous-liens */}
            {subLinks.map((link) => {
              const active = isTabActive(link.tab);
              return (
                <div key={link.tab} className="relative group w-full">
                  <button
                    onClick={() => handleSubPageClick(link.path, link.tab)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    {link.icon}
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {link.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          /* ── MODE EXPANDED ── */
          <div className="px-3 space-y-1">

            {/* ── Paramètres Globaux ── */}
            <div className="mb-1">
              <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                <FiGlobe size={11} className="text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Navigation
                </span>
              </div>

              {staticMenuConfig.map((menu) => {
                const isOpen = openMenus[menu.title];
                return (
                  <div key={menu.title} className="mb-1">
                    <button
                      onClick={() => toggleMenu(menu.title)}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-white hover:bg-slate-600 hover:text-white rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white group-hover:text-white transition-colors">{menu.icon}</span>
                        <span className="text-sm font-semibold text-white">{menu.title}</span>
                      </div>
                      <span className="text-white">
                        {isOpen
                          ? <FiChevronDown  size={14} />
                          : <FiChevronRight size={14} />
                        }
                      </span>
                    </button>

                    {isOpen && (
                      <div className="ml-2 mt-0.5 pl-4 border-l-2 border-slate-600 space-y-0.5">
                        {menu.links.map((link) => {
                          const active = isTabActive(link.tab);
                          return (
                            <button
                              key={link.label}
                              onClick={() => navigate(link.path, { state: { targetTab: link.tab } })}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-all duration-200 ${
                                active
                                  ? `bg-linear-to-r ${current.gradient} text-white shadow-sm font-medium`
                                  : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                              }`}
                            >
                              <span className={active ? 'text-white/80' : 'text-slate-200'}>{link.icon}</span>
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

            {/* Séparateur */}
            <div className="h-px bg-linear-to-r from-transparent via-slate-600 to-transparent my-2" />

            {/* ── Dossiers ── */}
            <div>
              {/* Lien retour */}
              <button
                onClick={() => navigate(`/dossiers-communs/liste-by-module/${module}`)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-all group"
              >
                <FiArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Voir tous les dossiers
                </span>
              </button>

              {/* Titre section */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
                <FiFolder size={11} className="text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Dossiers {module}
                </span>
                {dossiersTicketing.length > 0 && (
                  <span className="ml-auto text-[10px] font-semibold text-white bg-slate-600 px-1.5 py-0.5 rounded-full">
                    {dossiersTicketing.length}
                  </span>
                )}
              </div>

              {/* Liste dossiers */}
              <div className="space-y-1.5">
                {loadingDossiers ? (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 bg-linear-to-br ${current.gradient} rounded-full flex items-center justify-center`}>
                      <FiLoader className="animate-spin text-white" size={16} />
                    </div>
                    <span className="text-xs text-slate-400">Chargement...</span>
                  </div>
                ) : dossiersTicketing.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FiFolder className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400">Aucun dossier disponible</p>
                  </div>
                ) : (
                  dossiersTicketing.map((dossier) => {
                    const isActive = currentClientFactureId?.id === dossier.id;
                    return (
                      <div key={dossier.id}>
                        <button
                          onClick={() => handleDossierSelect(dossier)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? `bg-linear-to-r ${current.gradient} text-white shadow-md`
                              : 'bg-slate-600 border border-slate-600 text-white hover:border-slate-400 hover:shadow-sm hover:bg-slate-500'
                          }`}
                        >
                          {/* Point indicateur */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white/60' : current.dotColor}`} />
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-white'}`}>
                              {dossier.numero}
                            </p>
                            <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white' : 'text-white'}`}>
                              {dossier.clientfacture?.libelle || 'Client...'}
                            </p>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0 animate-pulse" />
                          )}
                        </button>

                        {/* Sous-liens du dossier actif */}
                        {isActive && subLinks.length > 0 && (
                          <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-600 space-y-0.5">
                            {subLinks.map((link) => {
                              const active = isTabActive(link.tab);
                              return (
                                <button
                                  key={link.label}
                                  onClick={() => handleSubPageClick(link.path, link.tab)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                                    active
                                      ? 'bg-slate-500 text-white font-semibold'
                                      : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                                  }`}
                                >
                                  <span className={active ? 'text-white' : 'text-slate-300'}>{link.icon}</span>
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
          </div>
        )}
      </nav>

      {/* ══ FOOTER ══ */}
      <div className={`shrink-0 border-t border-slate-600 ${collapsed ? 'p-2' : 'px-4 py-3'}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <span className="text-[9px] font-bold text-slate-300 tracking-widest">v1.2</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${current.dotColor} animate-pulse`} />
              <span className="text-[10px] text-slate-400 font-medium">Système opérationnel</span>
            </div>
            <span className="text-[10px] text-slate-300 font-semibold">v1.4.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}