import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiSettings, FiChevronDown, FiBarChart2, FiActivity, FiLayers,
  FiMap, FiList, FiPlusSquare, FiFolder, FiLoader, FiArrowLeft, FiUsers,
  FiSearch, FiCheck
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../app/store';
import { setCurrentClientFactureId, type DossierCommun } from '../app/front_office/dossierCommunSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

interface SidebarProps {
  module?: 'ticketing' | 'attestation' | 'hotel' | 'visa' | 'assurance';
}

type NavLink = { label: string; path: string; icon: ReactNode; tab: string };
type PanelId = 'dossiers' | string | null; // 'dossiers' ou le titre d'un menu ("Contrôle", "Paramètres")

/**
 * Barre de navigation horizontale (remplace l'ancienne sidebar verticale).
 * Le nom `Sidebar` et les props sont conservés pour ne pas changer les appels.
 *
 * ⚠️ Le layout parent doit empiler la barre au-dessus du contenu (flex-col),
 *    voir la note en bas du fichier.
 */
export default function Sidebar({ module }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  const dispatch = useAppDispatch();

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

  useEffect(() => {
    if (loadingDossiers || dossiersTicketing.length === 0) return;
    const activeIsInModule = dossiersTicketing.some(d => d.id === currentClientFactureId?.id);
    if (!currentClientFactureId || !activeIsInModule) {
      dispatch(setCurrentClientFactureId(dossiersTicketing[0]));
    }
  }, [loadingDossiers, dossiersTicketing.length, module]);

  const activeDossier = dossiersTicketing.find(d => d.id === currentClientFactureId?.id);

  // ── Menus déroulants (un seul ouvert à la fois) ──
  const navRef = useRef<HTMLElement>(null);
  const [openPanel, setOpenPanel] = useState<PanelId>(null);
  const [query, setQuery] = useState('');

  const togglePanel = (id: string) => {
    setQuery('');
    setOpenPanel(prev => (prev === id ? null : id));
  };
  const closePanel = () => setOpenPanel(null);

  // Ferme au clic extérieur et avec Échap
  useEffect(() => {
    if (!openPanel) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenPanel(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openPanel]);

  const isTabActive = (tab: string): boolean => {
    const navTab = location.state?.targetTab as string | undefined;
    if (navTab) return navTab === tab;
    return pathname.split('/').includes(tab) || pathname.endsWith(tab);
  };

  const staticMenuConfig: { title: string; icon: ReactNode; links: NavLink[] }[] = [
    {
      title: 'Contrôle',
      icon: <FiHome size={15} />,
      links: [
        { label: 'Tableau de bord', path: 'accueil', icon: <FiBarChart2 size={15} />, tab: 'dashboard' },
        { label: 'État',            path: 'accueil', icon: <FiActivity  size={15} />, tab: 'etat'      },
      ]
    },
    {
      title: 'Paramètres',
      icon: <FiSettings size={15} />,
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
            { label: 'Plateform',         path: 'parametres', icon: <FiLayers size={15} />, tab: 'plateformes'           },
            { label: 'Type chambre',      path: 'parametres', icon: <FiMap    size={15} />, tab: 'typeChambre'           },
            { label: 'Service',           path: 'parametres', icon: <FiMap    size={15} />, tab: 'service'               },
            { label: 'Devise',            path: 'parametres', icon: <FiMap    size={15} />, tab: 'devise'                },
            { label: 'Raison Annulation', path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : module === 'visa'
        ? [
            { label: 'Type de Visa',          path: 'parametres', icon: <FiLayers size={15} />, tab: 'type'                  },
            { label: 'Durée de Visa',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'duree'                 },
            { label: 'Visa Entrée',           path: 'parametres', icon: <FiMap    size={15} />, tab: 'entree'                },
            { label: 'Paramétre de Visa',     path: 'parametres', icon: <FiMap    size={15} />, tab: 'params'                },
            { label: 'Paramétre de Document', path: 'parametres', icon: <FiMap    size={15} />, tab: 'docsparams'            },
            { label: 'Document Visa',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'docs'                  },
            { label: 'Visa Consulat',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'consulat'              },
            { label: 'Raison Annulation',     path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : module === 'assurance'
        ? [
            { label: 'Assurance Parametre', path: 'parametres', icon: <FiLayers size={15} />, tab: 'params'                },
            { label: 'Assurance Document',  path: 'parametres', icon: <FiMap    size={15} />, tab: 'docs'                  },
            { label: 'Tarif Plein',         path: 'parametres', icon: <FiMap    size={15} />, tab: 'tarifPlein'            },
            { label: 'Tarif Réduit',        path: 'parametres', icon: <FiMap    size={15} />, tab: 'tarifReduit'           },
            { label: 'Raison Annulation',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
        : [
            { label: 'Service & spécifique', path: 'parametres', icon: <FiLayers size={15} />, tab: 'listeService'          },
            { label: 'Exigence de voyage',   path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeExigence'         },
            { label: 'Raison Annulation',    path: 'parametres', icon: <FiMap    size={15} />, tab: 'listeRaisonAnnulation' },
          ]
    }
  ];

  const pagesPath = `/dossiers-communs/${module}/pages`;

  const subLinks: NavLink[] =
    module === 'ticketing'
      ? [
          { label: 'Entête Prospection', path: pagesPath, icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Billets',      path: pagesPath, icon: <FiList       size={14} />, tab: 'billet'       },
          { label: 'Liste Bénéficiaire', path: pagesPath, icon: <FiUsers      size={14} />, tab: 'beneficiaire' },
        ]
      : module === 'hotel'
      ? [
          { label: 'Liste Benchmarking', path: pagesPath, icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Reservation',  path: pagesPath, icon: <FiList       size={14} />, tab: 'hotel'        },
          { label: 'Liste Bénéficiaire', path: pagesPath, icon: <FiUsers      size={14} />, tab: 'beneficiaire' },
        ]
      : module === 'attestation'
      ? [
          { label: 'Entête Attestation', path: pagesPath, icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Bénéficiaire', path: pagesPath, icon: <FiUsers      size={14} />, tab: 'beneficiaire' },
        ]
      : module === 'visa'
      ? [
          { label: 'Liste Prospection',  path: pagesPath, icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Reservation',  path: pagesPath, icon: <FiList       size={14} />, tab: 'visa'         },
          { label: 'Liste Bénéficiaire', path: pagesPath, icon: <FiUsers      size={14} />, tab: 'beneficiaire' },
        ]
      : module === 'assurance'
      ? [
          { label: 'Liste Prospection',  path: pagesPath, icon: <FiPlusSquare size={14} />, tab: 'prospection'  },
          { label: 'Liste Reservation',  path: pagesPath, icon: <FiList       size={14} />, tab: 'assurance'    },
          { label: 'Liste Bénéficiaire', path: pagesPath, icon: <FiUsers      size={14} />, tab: 'beneficiaire' },
        ]
      : [];

  const handleDossierSelect = async (dossier: DossierCommun) => {
    closePanel();
    await dispatch(setCurrentClientFactureId(dossier));
    if (module) navigate(pagesPath, { state: { targetTab: 'prospection' } });
  };

  const handleSubPageClick = (path: string, tab: string) => {
    closePanel();
    navigate(path, { state: { targetTab: tab } });
  };

  // Config par module
  const moduleConfig = {
    ticketing:   { label: 'Ticketing',   icon: <FiList   size={15} />, gradient: 'from-amber-400 to-orange-500', activeText: 'text-amber-500', dotColor: 'bg-amber-400'  },
    attestation: { label: 'Attestation', icon: <FiFolder size={15} />, gradient: 'from-rose-400 to-pink-500',    activeText: 'text-rose-500',  dotColor: 'bg-rose-400'   },
    hotel:       { label: 'Hôtel',       icon: <FiHome   size={15} />, gradient: 'from-orange-400 to-red-500',   activeText: 'text-orange-500', dotColor: 'bg-orange-400' },
    visa:        { label: 'Visa',        icon: <FiMap    size={15} />, gradient: 'from-blue-400 to-indigo-500',  activeText: 'text-blue-500',  dotColor: 'bg-blue-400'   },
    assurance:   { label: 'Assurance',   icon: <FiMap    size={15} />, gradient: 'from-green-600 to-green-500',  activeText: 'text-green-600', dotColor: 'bg-green-400'  },
  };

  const current = module
    ? moduleConfig[module]
    : { label: '—', icon: <FiLayers size={15} />, gradient: 'from-slate-400 to-slate-500', activeText: 'text-slate-600', dotColor: 'bg-slate-400' };

  // ── Recherche dans la liste des dossiers (affichée dès qu'il y en a beaucoup) ──
  const showSearch = dossiersTicketing.length > 5;
  const q = query.trim().toLowerCase();
  const filteredDossiers = q
    ? dossiersTicketing.filter(d =>
        `${d.numero ?? ''} ${d.clientfacture?.libelle ?? ''}`.toLowerCase().includes(q)
      )
    : dossiersTicketing;

  const dossiersOpen = openPanel === 'dossiers';

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-40 w-full shrink-0 bg-slate-700 border-b border-slate-600 shadow-sm"
    >
      <div className="flex items-stretch h-12 px-3 gap-2">

        {/* ══ Module ══ */}
        <div className="flex items-center gap-2 pr-1 self-center">
          <div className={`w-8 h-8 bg-linear-to-br ${current.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
            <span className="text-white">{current.icon}</span>
          </div>
          <span className="hidden md:block text-[11px] font-bold text-white uppercase tracking-widest">
            {current.label}
          </span>
        </div>

        <div className="w-px h-6 bg-slate-500/60 self-center" />

        {/* ══ Sélecteur de dossier ══ */}
        <div className="relative self-center">
          <button
            onClick={() => togglePanel('dossiers')}
            aria-haspopup="listbox"
            aria-expanded={dossiersOpen}
            className={`flex items-center gap-2.5 h-9 pl-3 pr-2.5 max-w-[280px] rounded-lg border text-left transition-colors ${
              dossiersOpen
                ? 'bg-slate-600 border-slate-400/60'
                : 'bg-slate-600/50 border-slate-500/50 hover:bg-slate-600'
            }`}
          >
            {loadingDossiers ? (
              <FiLoader className="animate-spin text-white shrink-0" size={13} />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor}`} />
            )}
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-bold text-white truncate">
                {activeDossier ? `N° ${activeDossier.numero}` : 'Aucun dossier'}
              </span>
              <span className="block text-[10px] text-slate-300 truncate">
                {activeDossier?.clientfacture?.libelle || (loadingDossiers ? 'Chargement...' : 'Sélectionner un dossier')}
              </span>
            </span>
            <FiChevronDown
              size={14}
              className={`text-slate-300 shrink-0 transition-transform duration-200 ${dossiersOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dossiersOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 w-80 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 overflow-hidden">
              {/* Retour à la liste complète */}
              <button
                onClick={() => {
                  closePanel();
                  if (module) navigate(`/dossiers-communs/liste-by-module/${module}`);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              >
                <FiArrowLeft size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Tous les dossiers {current.label}
                </span>
                <span className="ml-auto text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {dossiersTicketing.length}
                </span>
              </button>

              {showSearch && (
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Rechercher un dossier..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-700 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto py-1" role="listbox">
                {loadingDossiers ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 bg-linear-to-br ${current.gradient} rounded-full flex items-center justify-center`}>
                      <FiLoader className="animate-spin text-white" size={16} />
                    </div>
                    <span className="text-xs text-slate-400">Chargement...</span>
                  </div>
                ) : filteredDossiers.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FiFolder className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400">
                      {dossiersTicketing.length === 0 ? 'Aucun dossier disponible' : 'Aucun résultat'}
                    </p>
                  </div>
                ) : (
                  filteredDossiers.map(dossier => {
                    const isActive = currentClientFactureId?.id === dossier.id;
                    return (
                      <button
                        key={dossier.id}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => handleDossierSelect(dossier)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor}`} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-bold text-slate-800 truncate">
                            N° {dossier.numero}
                          </span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {dossier.clientfacture?.libelle || 'Client...'}
                          </span>
                        </span>
                        {isActive && <FiCheck size={14} className="text-slate-700 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ Sous-liens du dossier actif (onglets) ══ */}
        {activeDossier && subLinks.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-500/60 self-center" />
            <div className="flex items-stretch">
              {subLinks.map(link => {
                const active = isTabActive(link.tab);
                return (
                  <button
                    key={link.tab}
                    onClick={() => handleSubPageClick(link.path, link.tab)}
                    title={link.label}
                    className={`relative flex items-center gap-2 px-3 text-xs transition-colors ${
                      active
                        ? 'text-white font-semibold'
                        : 'text-slate-300 font-medium hover:text-white hover:bg-slate-600/50'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-slate-300'}>{link.icon}</span>
                    <span className="hidden lg:inline whitespace-nowrap">{link.label}</span>
                    {active && (
                      <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full ${current.dotColor}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ══ Menus Contrôle / Paramètres ══ */}
        <div className="ml-auto flex items-center gap-1">
          {staticMenuConfig.map((menu, index) => {
            const isOpen = openPanel === menu.title;
            const hasActive = menu.links.some(l => isTabActive(l.tab));
            return (
              <div key={menu.title} className="relative">
                <button
                  onClick={() => togglePanel(menu.title)}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  className={`flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    isOpen || hasActive
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-200 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  <span className={hasActive ? current.activeText : ''}>{menu.icon}</span>
                  <span className="hidden sm:inline">{menu.title}</span>
                  <FiChevronDown
                    size={13}
                    className={`text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div
                    role="menu"
                    className={`absolute top-full mt-2 z-50 w-64 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 overflow-hidden py-1 ${
                      index === 0 ? 'right-0' : 'right-0'
                    }`}
                  >
                    <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {menu.title}
                    </div>
                    {menu.links.map(link => {
                      const active = isTabActive(link.tab);
                      return (
                        <button
                          key={link.label}
                          role="menuitem"
                          onClick={() => {
                            closePanel();
                            navigate(link.path, { state: { targetTab: link.tab } });
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                            active
                              ? 'bg-slate-100 text-slate-900 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className={active ? current.activeText : 'text-slate-400'}>{link.icon}</span>
                          {link.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Statut système */}
          <div
            className="flex items-center pl-2"
            title="Système opérationnel · v1.4.0"
          >
            <span className={`w-2 h-2 rounded-full ${current.dotColor} animate-pulse`} />
          </div>
        </div>
      </div>
    </nav>
  );
}