import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../app/store';
import { FiLoader, FiAward } from 'react-icons/fi';
import { fetchAllMiles } from '../../../../../app/front_office/parametre_client_beneficiaire/clientMilesSlice';

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
  const { items, loading, error } = useSelector((state: RootState) => state.clientMiles);

  useEffect(() => {
    dispatch(fetchAllMiles());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
        <FiLoader className="animate-spin text-indigo-600" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest">Chargement des miles...</p>
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-red-500 font-bold">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Résumé global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total clients</p>
          <p className="text-2xl font-black text-gray-900">{items.length}</p>
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
            {items.map((item) => {

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
      </div>
    </div>
  );
};

export default TabMilesClient;