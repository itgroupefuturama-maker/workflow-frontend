import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchSuivis } from '../../../../app/front_office/suiviSlice';

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="bg-gray-200 text-slate-800 px-4 py-3 text-xs font-semibold border-r border-gray-100 text-left uppercase tracking-wide">
    {children}
  </th>
);

interface Props {
  prestationId: string;
}

const EvolutionClientTable: React.FC<Props> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { list: suivis } = useSelector((state: RootState) => state.suivi);

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchSuivis());
    }
  }, [dispatch, prestationId]);

  const fmt = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('fr-FR') : '—';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-linear-to-r from-indigo-500 to-indigo-400 px-4 py-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Évolution Client
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Type</TableHeader>
              <TableHeader>Statut</TableHeader>
              <TableHeader>Origine</TableHeader>
              <TableHeader>Envoi Devis</TableHeader>
              <TableHeader>Approbation</TableHeader>
              <TableHeader>Réf. BC</TableHeader>
              <TableHeader>Création BC</TableHeader>
              <TableHeader>Soumission BC</TableHeader>
              <TableHeader>Approb. BC</TableHeader>
              <TableHeader>Réf. FAC</TableHeader>
              <TableHeader>Création FAC</TableHeader>
              <TableHeader>Règlement</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {suivis.map((suivi: any) => (
              <tr key={suivi.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-center border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800">
                    CLIENT
                  </span>
                </td>
                <td className="px-4 py-3 text-center border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    {suivi.statut.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-700 border-r border-gray-200">{suivi.origineLigne}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateEnvoieDevis)}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateApprobation)}</td>
                <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 border-r border-gray-200">{suivi.referenceBcClient || '—'}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateCreationBc)}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateSoumisBc)}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateApprobationBc)}</td>
                <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 border-r border-gray-200">{suivi.referenceFacClient || '—'}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateCreationFac)}</td>
                <td className="px-4 py-3 text-center text-xs font-semibold text-green-700 border-r border-gray-200 whitespace-nowrap">{fmt(suivi.dateReglement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvolutionClientTable;