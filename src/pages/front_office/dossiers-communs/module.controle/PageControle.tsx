import React, { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft, FiUserCheck, FiFileText, FiAlertCircle,
  FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchControles } from '../../../../app/front_office/parametre_controle/controleSlice';
import { API_URL } from '../../../../service/env';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Types filtres ─────────────────────────────────────────────────────────────
type SearchField = 'numDos' | 'prestation';
type FilterKey   = 'transaction' | 'dateTransaction' | 'partenaire' | 'module' | 'prestataire';

const SEARCH_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'numDos',     label: 'N° Dossier' },
  { value: 'prestation', label: 'Prestation'  },
];

const DATE_OPTIONS = [
  { value: '',          label: 'Toutes les dates' },
  { value: 'today',     label: "Aujourd'hui"       },
  { value: 'thisWeek',  label: 'Cette semaine'     },
  { value: 'thisMonth', label: 'Ce mois'           },
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

const matchDate = (iso: string, filter: string) => {
  if (!filter) return true;
  const d = new Date(iso);
  const now = new Date();
  if (filter === 'today')     return d.toDateString() === now.toDateString();
  if (filter === 'thisWeek')  {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (filter === 'thisMonth') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
};

// ── Composant ─────────────────────────────────────────────────────────────────
const PageControle = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // ── Sélecteurs ──────────────────────────────────────────────────────────────
  const { list, meta: rawMeta, loading, error } = useSelector((state: RootState) => state.controle);
  const meta = rawMeta ?? { total: 0, page: 1, limit: 10, totalPages: 1 };

  // ── Pagination locale ────────────────────────────────────────────────────────
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(10);

  // ── Recherche & filtres ──────────────────────────────────────────────────────
  const [searchField, setSearchField] = useState<SearchField>('numDos');
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    transaction: '', dateTransaction: '', partenaire: '', module: '', prestataire: '',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  // ── Chargement (re-fetch à chaque changement de page ou limit) ───────────────
  useEffect(() => {
    dispatch(fetchControles({ page, limit }));
  }, [dispatch, page, limit]);

  // Quand on change le limit on revient à la page 1
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // ── Options dynamiques ───────────────────────────────────────────────────────
  const filterOptions = useMemo(() => ({
    transaction: [...new Set(list.map(i => i.transaction))].filter(Boolean),
    partenaire:  [...new Set(list.map(i => i.fournisseur?.libelle).filter(Boolean))] as string[],
    module:      [...new Set(list.map(i => i.module?.nom).filter(Boolean))]          as string[],
    prestataire: [...new Set(list.map(i => `${i.user?.nom ?? ''} ${i.user?.prenom ?? ''}`.trim()).filter(Boolean))] as string[],
  }), [list]);

  const setFilter = (key: FilterKey, value: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    setOpenFilter(null);
  };

  const clearAll = () => {
    setSearchValue('');
    setFilters({ transaction: '', dateTransaction: '', partenaire: '', module: '', prestataire: '' });
  };

  const activeCount = Object.values(filters).filter(Boolean).length + (searchValue ? 1 : 0);

  // ── Filtrage côté client (sur la page courante uniquement) ───────────────────
  const filtered = useMemo(() => {
    return list.filter(item => {
      if (searchValue.trim()) {
        const q = searchValue.trim().toLowerCase();
        if (searchField === 'numDos') {
          if (!item.numDosCommun?.toLowerCase().includes(q) && !item.numDosPrestation?.toLowerCase().includes(q)) return false;
        } else {
          if (!item.prestation?.toLowerCase().includes(q)) return false;
        }
      }
      if (filters.transaction    && item.transaction !== filters.transaction) return false;
      if (filters.dateTransaction && !matchDate(item.dateTransaction, filters.dateTransaction)) return false;
      if (filters.partenaire     && item.fournisseur?.libelle !== filters.partenaire) return false;
      if (filters.module         && item.module?.nom !== filters.module) return false;
      if (filters.prestataire) {
        const full = `${item.user?.nom ?? ''} ${item.user?.prenom ?? ''}`.trim();
        if (full !== filters.prestataire) return false;
      }
      return true;
    });
  }, [list, searchValue, searchField, filters]);

  // ── Config boutons filtre ────────────────────────────────────────────────────
  const FILTER_BUTTONS: { key: FilterKey; label: string; options: { value: string; label: string }[] }[] = [
    { key: 'transaction',     label: 'Type',        options: filterOptions.transaction.map(v => ({ value: v, label: v })) },
    { key: 'dateTransaction', label: 'Date',        options: DATE_OPTIONS.slice(1) },
    { key: 'partenaire',      label: 'Partenaire',  options: filterOptions.partenaire.map(v => ({ value: v, label: v })) },
    { key: 'module',          label: 'Module',      options: filterOptions.module.map(v => ({ value: v, label: v })) },
    { key: 'prestataire',     label: 'Prestataire', options: filterOptions.prestataire.map(v => ({ value: v, label: v })) },
  ];

  const COLUMNS = [
    'Date transaction', 'Type', 'Statut transaction',
    'Catégorie Prestation',
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

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div onClick={() => setOpenFilter(null)}>

      {/* HEADER */}
      <div className="bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="pl-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-gray-200 shadow-md rounded-xl hover:bg-gray-200 transition-all"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiUserCheck className="text-indigo-600" /> Contrôle
            </h2>
            <p className="text-gray-500 font-medium italic">Audit et vérification.</p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3 pr-5">
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">{filtered.length}</p>
              <p className="text-xs text-gray-400">sur cette page</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-right">
              <p className="text-2xl font-black text-gray-800">{meta.total}</p>
              <p className="text-xs text-gray-400">total</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-6">

        {/* BARRE RECHERCHE + FILTRES */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex gap-2 mb-3">
              <div className="relative">
                <select
                  value={searchField}
                  onChange={e => setSearchField(e.target.value as SearchField)}
                  className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {SEARCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>

              <div className="relative flex-1">
                <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder={searchField === 'numDos' ? 'Rechercher par N° dossier…' : 'Rechercher par prestation…'}
                  className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                />
                {searchValue && (
                  <button onClick={() => setSearchValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="h-10 px-3 text-xs text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <FiX size={13} /> Tout effacer ({activeCount})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <FiFilter size={12} /> Filtres :
              </span>
              {FILTER_BUTTONS.map(fb => {
                const active = filters[fb.key];
                const isOpen = openFilter === fb.key;
                return (
                  <div key={fb.key} className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenFilter(isOpen ? null : fb.key)}
                      className={[
                        'h-8 px-3 text-xs rounded-lg border transition-colors flex items-center gap-1.5',
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600',
                      ].join(' ')}
                    >
                      {fb.label}
                      {active && (
                        <span className="bg-white/20 text-white rounded px-1 max-w-[80px] truncate">
                          {active === 'today' ? 'Auj.' : active === 'thisWeek' ? 'Sem.' : active === 'thisMonth' ? 'Mois' : active}
                        </span>
                      )}
                      <span className="text-[10px] opacity-60">▾</span>
                    </button>
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[160px] py-1 overflow-hidden">
                        {fb.options.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-400 italic">Aucune option</p>
                        ) : fb.options.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setFilter(fb.key, opt.value)}
                            className={[
                              'w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors flex items-center justify-between gap-2',
                              filters[fb.key] === opt.value ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700',
                            ].join(' ')}
                          >
                            {opt.label}
                            {filters[fb.key] === opt.value && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTATS */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement des contrôles…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
            <FiAlertCircle size={20} /> <span>{error}</span>
          </div>
        )}

        {/* TABLEAU */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {COLUMNS.map(col => (
                      <th key={col} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length} className="text-center py-16 text-gray-400">
                        <FiFileText size={32} className="mx-auto mb-3 opacity-40" />
                        {list.length === 0 ? 'Aucune donnée disponible' : 'Aucun résultat pour ces filtres'}
                      </td>
                    </tr>
                  ) : filtered.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <Td muted>{formatDate(item.dateTransaction)}</Td>
                      <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                        <Badge label={item.transaction} color={item.transaction === 'VENTE' ? 'indigo' : 'amber'} />
                      </td>
                      <td className="px-3 py-2.5 uppercase">
                        <Badge label={item.statutTransaction == 'ANNULER' ? 'Annulée' : item.statutTransaction == 'MODIFIER' ? 'Modifiée' : item.statutTransaction} color="gray" />
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
                      <td className="px-3 py-2.5 align-middle whitespace-nowrap"><Badge label={item.statusBC} color="gray" /></td>
                      <Td muted>{formatDate(item.dateFc)}</Td>
                      <Td mono>{item.refFc || '—'}</Td>
                      <td className="px-3 py-2.5 align-middle whitespace-nowrap"><Badge label={item.statusFc} color="gray" /></td>
                      <Td muted>{formatDate(item.dateReglement)}</Td>
                      <Td mono>{item.refReglement || '—'}</Td>
                      <td className="px-3 py-2.5 align-middle">
                        {item.pjControle.length === 0 ? (
                          <span className="text-gray-400 text-xs italic">Aucune</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {item.pjControle.map(pj => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── FOOTER PAGINATION ───────────────────────────────────────────── */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">

              {/* Gauche : info + sélecteur limite */}
              <div className="flex items-center gap-3">
                <span>
                  Page <span className="font-semibold text-gray-700">{meta.page}</span> sur{' '}
                  <span className="font-semibold text-gray-700">{meta.totalPages}</span>
                  {' '}— {meta.total} entrée{meta.total > 1 ? 's' : ''} au total
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Lignes :</span>
                  <select
                    value={limit}
                    onChange={e => handleLimitChange(Number(e.target.value))}
                    className="h-7 pl-2 pr-6 text-xs border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {LIMIT_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Droite : boutons de navigation */}
              <div className="flex items-center gap-1">
                {/* Première page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  title="Première page"
                >
                  «
                </button>
                {/* Page précédente */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  <FiChevronLeft size={13} />
                </button>

                {/* Numéros de pages */}
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="h-7 w-7 flex items-center justify-center text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={[
                          'h-7 w-7 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors',
                          page === p
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600',
                        ].join(' ')}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                {/* Page suivante */}
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  <FiChevronRight size={13} />
                </button>
                {/* Dernière page */}
                <button
                  onClick={() => setPage(meta.totalPages)}
                  disabled={page === meta.totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  title="Dernière page"
                >
                  »
                </button>
              </div>
            </div>
            {/* ── FIN FOOTER ──────────────────────────────────────────────────── */}

          </div>
        )}
      </div>
    </div>
  );
};

export default PageControle;