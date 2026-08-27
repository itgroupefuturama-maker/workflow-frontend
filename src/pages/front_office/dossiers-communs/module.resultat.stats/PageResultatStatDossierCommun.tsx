import { useEffect, useState } from 'react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFolder, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { fetchDossiersCommunsPaginated } from '../../../../app/front_office/dossierCommunSlice';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import Pagination from '../../../../components/Pagination';

const useAppDispatch = () => useDispatch<AppDispatch>();

const PageResultatStatDossierCommun = () => {
  const dispatch = useAppDispatch();
  const navigate  = useNavigate();

  const {
    listData: dossiers = [],
    listMeta: meta = { total: 0, page: 1, limit: 10, totalPages: 1 },
    listLoading: loadingDossiers,
  } = useSelector((state: RootState) => state.dossierCommun);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Revenir à la page 1 quand la recherche change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadList = () => {
    dispatch(fetchDossiersCommunsPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
    }));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8 bg-slate-100 h-full">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all group"
          >
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <h1 className="text-xl font-bold text-gray-900">Résultat Statistiques par Dossier Commun</h1>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={loadList}
            disabled={loadingDossiers}
            title="Actualiser"
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
          >
            <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={15} />
          </button>
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col mb-6">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/70 sticky top-0 z-10">
              <tr>
                {[
                  'N° Dos', 'Réf Travel Planner', 'Date Création', 'Statut',
                  'Description',
                  'Client Facturé', 'Crée par', 'Modules', 'Action'
                ].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loadingDossiers ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={12} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                dossiers.map((dossier) => (
                  <tr
                    key={dossier.id}
                    onClick={() => navigate(`/dashboard/stats/${dossier.numero}`)}
                    className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <FiFolder size={14} />
                        </div>
                        <span className="text-sm font-black text-gray-900">{dossier.numero}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">
                      {dossier.referenceTravelPlaner || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        dossier.status === 'CREER'  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : dossier.status === 'ANNULER' ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        {dossier.status === 'CREER' ? 'Ouvert' : dossier.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-[140px] truncate">
                      {dossier.description || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                      {dossier.clientfacture?.libelle || 'Non défini'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {dossier.user?.nom} {dossier.user?.prenom}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-row gap-1">
                        {dossier.dossierCommunColab
                          ?.filter((c) => c.status === 'CREER')
                          .map((c, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100">
                              {c.module?.nom}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingDossiers && dossiers.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center">
              <FiFolder size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">
                {searchTerm ? `Aucun dossier trouvé pour "${searchTerm}".` : 'Aucun dossier trouvé'}
              </p>
            </div>
          )}
        </div>

        <Pagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          itemLabel="dossier"
        />
      </div>
    </div>
  );
};

export default PageResultatStatDossierCommun;
