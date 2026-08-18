import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../app/store';
import { FiLoader, FiSearch } from 'react-icons/fi';
import { fetchAllMiles } from '../../../../../app/front_office/parametre_client_beneficiaire/clientMilesSlice';
import { useDebouncedValue } from '../../../../../hooks/useDebouncedValue';
import Pagination from '../../../../../components/Pagination';

const typeClientColor: Record<string, string> = {
  SIMPLE:    'bg-gray-100 text-gray-600',
  SILVER:    'bg-slate-100 text-slate-600',
  GOLD:      'bg-yellow-100 text-yellow-700',
  BRONZE:    'bg-orange-100 text-orange-700',
  VIP:       'bg-purple-100 text-purple-700',
  PLATINIUM: 'bg-sky-100 text-sky-700',
};

const TabMilesClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items = [],
    meta = { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading,
    error,
  } = useSelector((state: RootState) => state.clientMiles);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [statutFilter, setStatutFilter] = useState<'' | 'ACTIF' | 'INACTIF'>('');
  const [typeClientFilter, setTypeClientFilter] = useState<'' | 'SIMPLE' | 'GOLD' | 'SILVER' | 'BRONZE' | 'VIP'>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Revenir à la page 1 quand la recherche ou les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter, typeClientFilter]);

  useEffect(() => {
    dispatch(fetchAllMiles({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
      typeClient: typeClientFilter || undefined,
    }));
  }, [dispatch, page, limit, debouncedSearch, statutFilter, typeClientFilter]);

  if (error) {
    return <p className="p-8 text-red-500 font-bold">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom ou code du bénéficiaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm outline-none text-sm font-medium"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as '' | 'ACTIF' | 'INACTIF')}
          className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm outline-none font-bold text-xs uppercase tracking-widest text-gray-600 cursor-pointer"
        >
          <option value="">Tous statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>
        <select
          value={typeClientFilter}
          onChange={(e) => setTypeClientFilter(e.target.value as typeof typeClientFilter)}
          className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm outline-none font-bold text-xs uppercase tracking-widest text-gray-600 cursor-pointer"
        >
          <option value="">Tous types</option>
          <option value="SIMPLE">SIMPLE</option>
          <option value="GOLD">GOLD</option>
          <option value="SILVER">SILVER</option>
          <option value="BRONZE">BRONZE</option>
          <option value="VIP">VIP</option>
        </select>
      </div>

      {/* Résumé global (page courante — le total de clients reflète l'ensemble filtré) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total clients</p>
          <p className="text-2xl font-black text-gray-900">{meta.total}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total miles ABT</p>
          <p className="text-2xl font-black text-indigo-700">
            {items.reduce((acc, i) => acc + i.milesABT, 0).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Total miles compagnies</p>
          <p className="text-2xl font-black text-emerald-700">
            {items.reduce((acc, i) => acc + i.milesCompagnie.reduce((a, m) => a + m.miles, 0), 0).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Clients avec miles</p>
          <p className="text-2xl font-black text-amber-700">
            {items.filter(i => i.milesABT > 0 || i.milesCompagnie.some(m => m.miles > 0)).length}
          </p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-blue-800 uppercase text-[10px] font-black text-white tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Code</th>
              <th className="px-6 py-5 text-left">Bénéficiaire</th>
              <th className="px-6 py-5 text-left">Type</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-right">Miles ABT</th>
              <th className="px-6 py-5 text-left">Miles Compagnies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <FiLoader className="animate-spin text-indigo-500 mx-auto" size={28} />
                </td>
              </tr>
            ) : items.map((item) => {

              return (
                <tr key={item.beneficiaire.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-black text-indigo-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      {item.beneficiaire.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">{item.beneficiaire.libelle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      typeClientColor[item.beneficiaire.typeClient] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.beneficiaire.typeClient}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      item.beneficiaire.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.beneficiaire.statut === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {item.beneficiaire.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-black ${item.milesABT > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                      {item.milesABT.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.milesCompagnie.length === 0 ? (
                      <span className="text-gray-300 text-xs italic">Aucune</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {item.milesCompagnie.map((mc) => (
                          <span key={mc.idCompagnieClient} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
                            <span className="font-bold text-emerald-700">{mc.compagnie.code}</span>
                            <span className="text-gray-400">·</span>
                            <span className={`font-black ${mc.miles > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {mc.miles.toLocaleString('fr-FR')} mi
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && items.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-400 font-medium italic">Aucune donnée de miles disponible.</p>
          </div>
        )}
        <Pagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          itemLabel="client"
        />
      </div>
    </div>
  );
};

export default TabMilesClient;