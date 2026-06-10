import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { History } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchControles } from '../../../../app/front_office/parametre_controle/controleSlice';
import { API_URL } from '../../../../service/env';
import { FiFileText } from 'react-icons/fi';

// ── Helpers ───────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso || iso.startsWith('1970')) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatAriary = (n: number) =>
  n === 0 ? '—' : n.toLocaleString('fr-FR') + ' Ar';

const formatDevise = (n: number, devise: string) =>
  n === 0 ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + devise;

// ── Sous-composants ───────────────────────────────────────────

const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`sticky top-0 bg-slate-50 text-slate-500 px-3 py-3 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 text-left whitespace-nowrap z-10 ${className}`}>
    {children}
  </th>
);

const Td = ({ children, right = false, mono = false, muted = false }: {
  children: React.ReactNode; right?: boolean; mono?: boolean; muted?: boolean;
}) => (
  <td className={[
    'px-3 py-2.5 text-sm whitespace-nowrap align-middle',
    right ? 'text-right' : '',
    mono  ? 'font-mono text-xs' : '',
    muted ? 'text-gray-400' : 'text-gray-700',
  ].join(' ')}>
    {children}
  </td>
);

const Badge = ({ label, color }: { label: string; color: string }) => {
  const styles: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber:  'bg-amber-50  text-amber-700  border-amber-200',
    gray:   'bg-gray-100  text-gray-600   border-gray-200',
    green:  'bg-green-50  text-green-700  border-green-200',
    red:    'bg-red-50    text-red-700    border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles[color] ?? styles.gray}`}>
      {label}
    </span>
  );
};

// ── Colonnes ──────────────────────────────────────────────────

const COLUMNS = [
  'Date transaction', 'Type', 'Statut transaction', 'Catégorie Prestation',
  'N° Dos. commun', 'N° Dos. prestation', 'Origine ligne',
  'Prestation', 'Commentaire', 'Partenaire', 'Prestataire',
  'Com PU Devise', 'Com CU Devise', 'Com Devise', 'Com Taux change',
  'Com PU Ariary', 'Com CU Ariary', 'Com M Devise', 'Com C Devise',
  'Com M Ariary', 'Com C Ariary',
  'Fac PU Devise', 'Fac CU Devise', 'Fac Devise', 'Fac Taux change',
  'Fac PU Ariary', 'Fac CU Ariary', 'Fac M Devise', 'Fac C Devise',
  'Fac M Ariary', 'Fac C Ariary',
  'Durée', 'Quantité',
  'Date BC', 'Réf. BC', 'Statut BC',
  'Date FC', 'Réf. FC', 'Statut FC',
  'Date règlement', 'Réf. règlement',
  'Pièces jointes',
];

// ── Composant principal ───────────────────────────────────────

const EvolutionClientTable: React.FC<{ prestationId: string; moduleName?: string }> = ({
  prestationId,
  moduleName = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const { list, loading, error } = useSelector((state: RootState) => state.controle);
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  // Fetch au montage (page large pour avoir toutes les lignes du dossier)
  useEffect(() => {
    dispatch(fetchControles({ page: 1, limit: 500 }));
  }, [dispatch, prestationId]);

  // ── Filtrage automatique ──────────────────────────────────
  // 1. par numéro de dossier commun → dossierActif.numero
  // 2. par module → moduleName (comparaison insensible à la casse)
  const filtered = list.filter((item) => {
    const matchDossier = dossierActif?.numero
      ? item.numDosCommun?.includes(dossierActif.numero.toString())
      : true;

    const matchModule = moduleName
      ? item.module?.nom?.toLowerCase() === moduleName.toLowerCase()
      : true;

    return matchDossier && matchModule;
  });

  // ── Rendu ─────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <History size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-700 text-sm">
              Évolution Client — Dossier N°{dossierActif?.numero ?? '—'}
              {moduleName && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white bg-indigo-500 capitalize">
                  {moduleName}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? 'Chargement…' : `${filtered.length} ligne${filtered.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* État chargement */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Chargement…</span>
        </div>
      )}

      {/* Erreur */}
      {!loading && error && (
        <p className="px-5 py-8 text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Tableau */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {COLUMNS.map((col) => (
                  <TableHeader key={col}>{col}</TableHeader>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-16 text-gray-400">
                    <FiFileText size={32} className="mx-auto mb-3 opacity-40" />
                    Aucune donnée pour ce dossier{moduleName ? ` / ${moduleName}` : ''}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <Td muted>{formatDate(item.dateTransaction)}</Td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <Badge label={item.transaction} color={item.transaction === 'VENTE' ? 'indigo' : 'amber'} />
                    </td>
                    <td className="px-3 py-2.5 uppercase">
                      <Badge
                        label={
                          item.statutTransaction === 'ANNULER' ? 'Annulée'
                          : item.statutTransaction === 'MODIFIER' ? 'Modifiée'
                          : item.statutTransaction
                        }
                        color="gray"
                      />
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap uppercase">
                      <Badge label={item.module.nom} color="gray" />
                    </td>
                    <Td>N° {item.numDosCommun}</Td>
                    <Td>{item.numDosPrestation}</Td>
                    <Td mono muted>{item.origineLigne}</Td>
                    <Td>{item.prestation}</Td>
                    <Td mono>{item.commentaire || '—'}</Td>
                    <Td mono muted>{item.fournisseur?.libelle}</Td>
                    <Td mono muted>{item.user?.nom} {item.user?.prenom}</Td>
                    <Td right>{formatDevise(item.cmPuDevise, item.cmDevise)}</Td>
                    <Td right>{formatDevise(item.cmCuDevise, item.cmDevise)}</Td>
                    <Td>{item.cmDevise}</Td>
                    <Td right>{item.cmTauxChange.toLocaleString('fr-FR')}</Td>
                    <Td right>{formatAriary(item.cmPuAriary)}</Td>
                    <Td right>{formatAriary(item.cmCuAriary)}</Td>
                    <Td right><span className="font-semibold text-indigo-700">{formatDevise(item.cmMDevise, item.cmDevise)}</span></Td>
                    <Td right>{item.cmCDevise.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</Td>
                    <Td right><span className="font-semibold text-indigo-700">{formatAriary(item.cmMAriary)}</span></Td>
                    <Td right>{item.cmCAriary.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</Td>
                    <Td right>{formatDevise(item.fcPuDevise, item.fcDevise)}</Td>
                    <Td right>{formatDevise(item.fcCuDevise, item.fcDevise)}</Td>
                    <Td>{item.fcDevise}</Td>
                    <Td right>{item.fcTauxChange === 0 ? '—' : item.fcTauxChange.toLocaleString('fr-FR')}</Td>
                    <Td right>{formatAriary(item.fcPuAriary)}</Td>
                    <Td right>{formatAriary(item.fcCuAriary)}</Td>
                    <Td right><span className="font-semibold text-amber-700">{formatDevise(item.fcMDevise, item.fcDevise)}</span></Td>
                    <Td right>{item.fcCDevise.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</Td>
                    <Td right><span className="font-semibold text-amber-700">{formatAriary(item.fcMAriary)}</span></Td>
                    <Td right>{item.fcCAriary.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</Td>
                    <Td>{item.duree}</Td>
                    <Td right>{item.quantite}</Td>
                    <Td muted>{formatDate(item.dateBC)}</Td>
                    <Td mono>{item.refBC || '—'}</Td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <Badge label={item.statusBC} color="gray" />
                    </td>
                    <Td muted>{formatDate(item.dateFc)}</Td>
                    <Td mono>{item.refFc || '—'}</Td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <Badge label={item.statusFc} color="gray" />
                    </td>
                    <Td muted>{formatDate(item.dateReglement)}</Td>
                    <Td mono>{item.refReglement || '—'}</Td>
                    <td className="px-3 py-2.5 align-middle">
                      {item.pjControle.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">Aucune</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {item.pjControle.map((pj) => (
                            <a
                              key={pj.id}
                              href={`${API_URL}/${pj.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs hover:bg-indigo-100 transition-colors"
                            >
                              <FiFileText size={11} /> {pj.type}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvolutionClientTable;