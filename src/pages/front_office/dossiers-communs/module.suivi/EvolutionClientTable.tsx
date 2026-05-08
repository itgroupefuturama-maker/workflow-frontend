import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { History, Calendar, FileText, CheckCircle, CreditCard } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchSuivis } from '../../../../app/front_office/suiviSlice';

// Header de colonne stylisé
const TableHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <th className={`sticky top-0 bg-slate-50 text-slate-500 px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 text-center z-10 ${className}`}>
    {children}
  </th>
);

const EvolutionClientTable: React.FC<{ prestationId: string }> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: suivis } = useSelector((state: RootState) => state.suivi);

  useEffect(() => {
    if (prestationId) dispatch(fetchSuivis());
  }, [dispatch, prestationId]);

  const fmt = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
      {/* Header de section */}
      <div className="px-5 py-4 border-b border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <History size={18} />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Évolution Client</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="divide-x divide-slate-100">
              <TableHeader className="text-left pl-6">Flux</TableHeader>
              <TableHeader>Statut</TableHeader>
              <TableHeader>Origine</TableHeader>
              <TableHeader>Envoi Devis</TableHeader>
              <TableHeader>Approbation</TableHeader>
              <TableHeader className="bg-blue-50/30 text-blue-600">Réf. BC</TableHeader>
              <TableHeader className="bg-blue-50/30">Création BC</TableHeader>
              <TableHeader className="bg-blue-50/30">Soumission BC</TableHeader>
              <TableHeader className="bg-blue-50/30">Approb. BC</TableHeader>
              <TableHeader className="bg-emerald-50/30 text-emerald-600">Réf. FAC</TableHeader>
              <TableHeader className="bg-emerald-50/30">Création FAC</TableHeader>
              <TableHeader className="bg-emerald-50/30">Règlement</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suivis.map((suivi: any) => (
              <tr key={suivi.id} className="group hover:bg-slate-50/50 transition-colors divide-x divide-slate-100">
                {/* Flux */}
                <td className="px-4 py-3 pl-6">
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                    Client
                  </span>
                </td>

                {/* Statut */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-slate-600 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    {suivi.statut.replace(/_/g, ' ')}
                  </span>
                </td>

                {/* Origine */}
                <td className="px-4 py-3 text-xs text-slate-500 text-center font-medium">{suivi.origineLigne}</td>

                {/* Devis */}
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400 text-center">{fmt(suivi.dateEnvoieDevis)}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-emerald-600 text-center font-bold">{fmt(suivi.dateApprobation)}</td>

                {/* BC Section (Blue) */}
                <td className="px-4 py-3 text-xs font-bold text-blue-700 bg-blue-50/10 text-center">{suivi.referenceBcClient || '—'}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-500 bg-blue-50/10 text-center">{fmt(suivi.dateCreationBc)}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-500 bg-blue-50/10 text-center">{fmt(suivi.dateSoumisBc)}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-700 bg-blue-50/10 text-center font-semibold">{fmt(suivi.dateApprobationBc)}</td>

                {/* FAC Section (Emerald) */}
                <td className="px-4 py-3 text-xs font-bold text-emerald-700 bg-emerald-50/10 text-center">{suivi.referenceFacClient || '—'}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-500 bg-emerald-50/10 text-center">{fmt(suivi.dateCreationFac)}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-emerald-700 bg-emerald-50/10 text-center font-black">
                  <div className="flex items-center justify-center gap-1">
                    <CreditCard size={10} /> {fmt(suivi.dateReglement)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvolutionClientTable;