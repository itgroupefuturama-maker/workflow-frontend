import React, { useEffect } from 'react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFolder, FiRefreshCw } from 'react-icons/fi';
import { fetchDossiersCommuns } from '../../../../app/front_office/dossierCommunSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const PageResultatStatDossierCommun = () => {
  const dispatch      = useAppDispatch();
  const navigate      = useNavigate();
  const { data: dossiers, loading: loadingDossiers } =
    useSelector((state: RootState) => state.dossierCommun);

  useEffect(() => {
    dispatch(fetchDossiersCommuns());
  }, [dispatch]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all group"
          >
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <h1 className="text-xl font-bold text-gray-900">Liste des dossiers communs</h1>
        </div>

        <button
          onClick={() => dispatch(fetchDossiersCommuns())}
          disabled={loadingDossiers}
          title="Actualiser"
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={15} />
        </button>
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
                  'Client Facturé', 'Crée par', 'Modules',
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
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingDossiers && dossiers.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center">
              <FiFolder size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">Aucun dossier trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageResultatStatDossierCommun;