import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiSettings, FiChevronDown, FiChevronRight,
  FiBarChart2, FiActivity, FiLayers, FiMap, FiList, FiPlusSquare,
  FiFolder, FiLoader, FiGlobe,
  FiArrowLeft
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../app/store';
import { fetchDossiersCommuns, setCurrentClientFactureId, type DossierCommun } from '../app/front_office/dossierCommunSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  const { data: dossiers, loading: loadingDossiers, currentClientFactureId } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  const dossiersTicketing = dossiers.filter(dossier => {
    return (dossier.dossierCommunColab || []).some(colab =>
      colab?.status === "CREER" &&
      colab?.module?.nom?.toLowerCase() === "ticketing" &&
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

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const staticMenuConfig = [
    {
      title: 'Accueil',
      icon: <FiHome size={18} />,
      links: [
        { label: 'Tableau de bord', path: 'accueil', icon: <FiBarChart2 size={16} />, tab: 'dashboard' },
        { label: 'État', path: 'accueil', icon: <FiActivity size={16} />, tab: 'etat' },
      ]
    },
    {
      title: 'Paramètres',
      icon: <FiSettings size={18} />,
      links: [
        { label: 'Service & spécifique', path: 'parametres', icon: <FiLayers size={16} />, tab: 'listeService' },
        { label: 'Exigence de voyage', path: 'parametres', icon: <FiMap size={16} />, tab: 'listeExigence' },
      ]
    }
  ];

  const pageLinks = [
    { label: 'Entête Prospection', path: '/dossiers-communs/prestation-detail/pages', icon: <FiPlusSquare size={16} />, tab: 'prospection' },
    { label: 'Liste Billets', path: '/dossiers-communs/prestation-detail/pages', icon: <FiList size={16} />, tab: 'billet' },
  ];

  const handleDossierSelect = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    navigate('/dossiers-communs/prestation-detail/pages', {
      state: { targetTab: 'prospection' }
    });
  };

  const handleSubPageClick = (path: string, tab: string) => {
    navigate(path, { state: { targetTab: tab } });
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Navigation</h2>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* SECTION GLOBALE */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 px-2 mb-3">
            <FiGlobe size={14} className="text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Paramètres Globaux
            </h3>
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
                    {isOpen ? (
                      <FiChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <FiChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-1 ml-3 pl-6 border-l border-gray-200 space-y-1">
                      {menu.links.map((link) => (
                        <button
                          key={link.label}
                          onClick={() => navigate(link.path, { state: { targetTab: link.tab } })}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname.includes(link.tab)
                              ? 'bg-white text-gray-900 font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-white hover:text-gray-900'
                          }`}
                        >
                          <span className={pathname.includes(link.tab) ? 'text-gray-700' : 'text-gray-400'}>
                            {link.icon}
                          </span>
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION DOSSIERS SPÉCIFIQUES */}
        <div className="p-3">
          <div className="inline-flex items-center mb-5">
            <button
              onClick={() => navigate('/dossiers-communs/ticketing')}
              className="flex items-center gap-2 pb-1 group border-b border-transparent hover:border-slate-800 transition-all duration-300"
            >
              <FiArrowLeft 
                size={14} 
                className="text-slate-400 group-hover:text-slate-900 group-hover:-translate-x-1 transition-all" 
              />
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">
                Voir Tous les dossiers
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 px-2 mb-3">
            <FiFolder size={14} className="text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Dossiers Ticketing
            </h3>
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
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <FiFolder 
                        size={18} 
                        className={`flex-shrink-0 mt-0.5 ${isFolderActive ? 'text-gray-300' : 'text-gray-400'}`}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-semibold truncate ${
                          isFolderActive ? 'text-white' : 'text-gray-900'
                        }`}>
                          {dossier.numero}
                        </p>
                        <p className={`text-xs truncate mt-0.5 ${
                          isFolderActive ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {dossier.clientfacture?.libelle || 'Client...'}
                        </p>
                      </div>
                    </button>

                    {/* Sous-menu du dossier */}
                    {isFolderActive && (
                      <div className="mt-1 ml-9 pl-3 border-l-2 border-gray-200 space-y-1">
                        {pageLinks.map((link) => (
                          <button
                            key={link.label}
                            onClick={() => handleSubPageClick(link.path, link.tab)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                              pathname.includes(link.tab)
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span className={pathname.includes(link.tab) ? 'text-gray-700' : 'text-gray-400'}>
                              {link.icon}
                            </span>
                            {link.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-center text-gray-500 font-medium">
          Ticketing v1.2.0
        </p>
      </div>
    </aside>
  );
}