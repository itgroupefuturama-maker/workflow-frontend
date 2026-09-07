import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommunsPaginated, setCurrentClientFactureId, type DossierCommun } from '../../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import {FiFolder, FiSearch, FiRefreshCw, FiArrowLeft, FiCalendar, FiUser, FiCheck} from 'react-icons/fi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import Pagination from '../../../components/Pagination';

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREER', label: 'Actif' },
  { value: 'ANNULER', label: 'Annulé' },
];

const useAppDispatch = () => useDispatch<AppDispatch>();

function ListeDossierByModule() {
  const { module } = useParams<{ module: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    listData: filteredDossiers = [],
    listMeta: meta = { total: 0, page: 1, limit: 10, totalPages: 1 },
    listLoading: loadingDossiers,
  } = useSelector((state: RootState) => state.dossierCommun);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statutFilter, setStatutFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Ferme les menus Filtrer/Trier au clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) setShowFilterMenu(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Revenir à la page 1 quand la recherche ou le filtre changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter]);

  const loadList = () => {
    dispatch(fetchDossiersCommunsPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
      module,
    }));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch, statutFilter, module]);

  // Tri appliqué sur la page courante (la liste est déjà paginée côté serveur)
  const sortedDossiers = [...filteredDossiers].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleRefresh = () => {
    loadList();
  };

  const handleOpenDossier = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    navigate(`/dossiers-communs/${module}/pages`, {
      state: { targetTab: 'prospection' }
    });
  };


  return (
    <div className="h-screen flex flex-col bg-gray-50/50 overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-6 pt-4 flex flex-col flex-1 min-h-0">
        
        {/* Header navigation — shrink-0 pour ne jamais être compressé */}
        <header className="shrink-0 bg-white w-70 rounded-2xl mb-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="p-3 flex items-center space-x-5 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Retour à la page d'accueil</span>
            </button>
          </div>
        </header>

        {/* Titre + barre de filtres — shrink-0 */}
        <div className="shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Listes de Dossier {module}</h1>
              <p className="text-slate-500 text-sm">Gérez l'ensemble de vos dossiers ici.</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-gray-200 mb-4">
            {/* Onglets */}
            <div className="flex gap-8 overflow-x-auto scrollbar-hide">
              <button className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                module === 'attestation' ? 'text-red-600 border-red-600'
                : module === 'ticketing' ? 'text-yellow-500 border-yellow-400'
                : module === 'hotel' ? 'text-orange-600 border-orange-600'
                : 'border-transparent'
              }`}>
                Tous les dossiers
              </button>
            </div>

            {/* Recherche & Actions */}
            <div className="flex flex-wrap items-center gap-3 pb-3">
              <div className="relative group min-w-[280px]">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Rechercher un dossier..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loadingDossiers}
                  title="Actualiser"
                  className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
                >
                  <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={16} />
                </button>

                <div className="relative" ref={filterMenuRef}>
                  <button
                    onClick={() => { setShowFilterMenu(o => !o); setShowSortMenu(false); }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all shadow-sm ${
                      statutFilter
                        ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${statutFilter ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtrer
                    {statutFilter && (
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">1</span>
                    )}
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
                      {STATUT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setStatutFilter(opt.value); setShowFilterMenu(false); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {opt.label}
                          {statutFilter === opt.value && <FiCheck size={14} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => { setShowSortMenu(o => !o); setShowFilterMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Trier
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
                      {([
                        { value: 'desc', label: 'Date création — Plus récent' },
                        { value: 'asc', label: 'Date création — Plus ancien' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortOrder(opt.value); setShowSortMenu(false); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {opt.label}
                          {sortOrder === opt.value && <FiCheck size={14} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Zone tableau — prend tout l'espace restant, scroll interne uniquement */}
        <div className="flex-1 min-h-0 mb-4">
          <div className="h-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            
            {/* ✅ Seul ce div scrolle */}
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dossier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Réf Travel</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date création</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">WhatsApp</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Créé par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingDossiers ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={9} className="px-6 py-6">
                          <div className="h-12 bg-slate-100 rounded-lg"></div>
                        </td>
                      </tr>
                    ))
                  ) : sortedDossiers.map((dossier) => (
                    <tr
                      key={dossier.id}
                      onClick={() => handleOpenDossier(dossier)}
                      className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-lg shadow-indigo-500/30 ${
                            module === 'attestation' ? 'bg-red-500'
                            : module === 'ticketing' ? 'bg-yellow-500'
                            : module === 'hotel' ? 'bg-orange-500'
                            : 'bg-indigo-500'
                          }`}>
                            <FiFolder size={18} className="text-white" />
                          </div>
                          <div className="text-sm font-bold text-slate-900">{dossier.numero}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-slate-600">{dossier.referenceTravelPlaner || '-'}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiCalendar size={14} className="text-slate-400" />
                          {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          dossier.status === 'CREER' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : dossier.status === 'ANNULER' ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            dossier.status === 'CREER' ? 'bg-emerald-500'
                            : dossier.status === 'ANNULER' ? 'bg-red-500'
                            : 'bg-slate-400'
                          }`}></span>
                          {dossier.status === 'CREER' ? 'Actif' : dossier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-[200px] truncate" title={dossier.description}>{dossier.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{dossier.clientfacture?.libelle || 'Non défini'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                            <FiUser size={14} className="text-slate-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{dossier.contactPrincipal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {dossier.whatsapp ? (
                          <a
                            href={`https://wa.me/${dossier.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                          >
                            {dossier.whatsapp}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{dossier.user?.nom} {dossier.user?.prenom}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {!loadingDossiers && filteredDossiers.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/30">
                <FiSearch size={40} className="text-gray-200 mb-4" />
                <p className="text-sm text-gray-400 font-medium">Aucun dossier trouvé pour "{searchTerm}".</p>
              </div>
            )}

            <Pagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              itemLabel="dossier"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default ListeDossierByModule;