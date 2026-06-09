import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllClientBeneficiaireInfos } from '../../../../app/portail_client/clientBeneficiaireInfosSlice';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../../service/env';

// ── Utilitaires ────────────────────────────────────────────────────────────

function getMonthsUntilExpiry(date: string) {
  return (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Types ──────────────────────────────────────────────────────────────────

type FilterDoc      = 'TOUS' | 'PASSEPORT' | 'LAISSE_PASSER' | 'CIN';
type FilterType     = 'TOUS' | 'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE';
type ValidityBucket = 'CRITIQUE' | 'ATTENTION_BAS' | 'ATTENTION_HAUT' | 'BIENTOT' | 'VALIDE';
type SortKey        =
  | 'nom' | 'nom_desc'
  | 'validite_asc' | 'validite_desc'
  | 'delivrance_asc' | 'delivrance_desc'
  | null;

// ── Validité ───────────────────────────────────────────────────────────────

function getValidityBucket(date: string): ValidityBucket {
  const m = getMonthsUntilExpiry(date);
  if (m < 3)  return 'CRITIQUE';
  if (m < 6)  return 'ATTENTION_BAS';
  if (m < 9)  return 'ATTENTION_HAUT';
  if (m < 12) return 'BIENTOT';
  return 'VALIDE';
}

const VALIDITY_DOT: Record<ValidityBucket, string> = {
  CRITIQUE:       'bg-red-500',
  ATTENTION_BAS:  'bg-orange-500',
  ATTENTION_HAUT: 'bg-orange-400',
  BIENTOT:        'bg-yellow-400',
  VALIDE:         'bg-green-500',
};

const VALIDITY_TEXT: Record<ValidityBucket, string> = {
  CRITIQUE:       'text-red-700',
  ATTENTION_BAS:  'text-orange-700',
  ATTENTION_HAUT: 'text-orange-600',
  BIENTOT:        'text-yellow-700',
  VALIDE:         'text-green-700',
};

function getValidityDisplay(date: string) {
  const m = getMonthsUntilExpiry(date);
  const bucket = getValidityBucket(date);
  const label = bucket === 'CRITIQUE'
    ? `${Math.round(m * 30)}j restants`
    : `${Math.round(m)} mois`;
  return { dot: VALIDITY_DOT[bucket], text: VALIDITY_TEXT[bucket], label };
}

// ── Dropdown ───────────────────────────────────────────────────────────────

const Dropdown: React.FC<{
  label: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
}> = ({ label, icon, active, badge, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-[7px] text-[12px] border rounded-lg transition-colors
          ${active
            ? 'border-slate-400 bg-slate-100 text-slate-900 font-medium'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
      >
        {icon}
        <span>{label}</span>
        {!!badge && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-medium">
            {badge}
          </span>
        )}
        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 bg-white border border-slate-200 rounded-xl p-1.5 min-w-[220px]">
          {children}
        </div>
      )}
    </div>
  );
};

const DdLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2 pt-2 pb-1">{children}</p>
);

const DdItem: React.FC<{ onClick: () => void; active?: boolean; children: React.ReactNode }> = ({ onClick, active, children }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors
      ${active ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
  >
    {children}
  </div>
);

const DdSep = () => <div className="h-px bg-slate-100 my-1" />;

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
);

// ── Chip filtre actif ──────────────────────────────────────────────────────

const ActiveChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <button
    onClick={onRemove}
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border border-slate-200 text-slate-500 bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors"
  >
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    {label}
  </button>
);

// ── Page principale ────────────────────────────────────────────────────────

const PagePassport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list, loadingList, error } = useSelector((s: RootState) => s.clientBeneficiaireInfos);

  const [filterDoc,      setFilterDoc]      = useState<FilterDoc>('TOUS');
  const [filterType,     setFilterType]     = useState<FilterType>('TOUS');
  const [validityFilter, setValidityFilter] = useState<Set<ValidityBucket>>(new Set());
  const [sortKey,        setSortKey]        = useState<SortKey>(null);
  const [search,         setSearch]         = useState('');

  useEffect(() => { dispatch(fetchAllClientBeneficiaireInfos()); }, [dispatch]);

  const toggleValidity = (bucket: ValidityBucket) => {
    setValidityFilter((prev) => {
      const next = new Set(prev);
      next.has(bucket) ? next.delete(bucket) : next.add(bucket);
      return next;
    });
  };

  const SORT_LABELS: Record<NonNullable<SortKey>, string> = {
    nom: 'Nom A→Z', nom_desc: 'Nom Z→A',
    validite_asc: 'Validité ↑', validite_desc: 'Validité ↓',
    delivrance_asc: 'Délivrance ↑', delivrance_desc: 'Délivrance ↓',
  };

  const filtered = useMemo(() => {
    let data = list.filter((info) => {
      if (filterDoc === 'PASSEPORT'     && info.typeDoc !== 'PASSEPORT')                              return false;
      if (filterDoc === 'CIN'           && info.typeDoc !== 'CIN')                                    return false;
      if (filterDoc === 'LAISSE_PASSER' && (info.typeDoc === 'PASSEPORT' || info.typeDoc === 'CIN'))  return false;
      if (filterType !== 'TOUS'         && info.clientType !== filterType)                            return false;
      if (validityFilter.size > 0) {
        if (info.typeDoc !== 'PASSEPORT' || !info.dateValiditeDoc) return false;
        if (!validityFilter.has(getValidityBucket(info.dateValiditeDoc)))  return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          info.nom.toLowerCase().includes(q) ||
          info.prenom.toLowerCase().includes(q) ||
          info.referenceDoc.toLowerCase().includes(q) ||
          info.nationalite.toLowerCase().includes(q) ||
          info.clientbeneficiaire?.libelle.toLowerCase().includes(q) ||
          info.clientbeneficiaire?.code.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortKey) {
      data = [...data].sort((a, b) => {
        switch (sortKey) {
          case 'nom':             return a.nom.localeCompare(b.nom);
          case 'nom_desc':        return b.nom.localeCompare(a.nom);
          case 'validite_asc':    return new Date(a.dateValiditeDoc ?? 0).getTime() - new Date(b.dateValiditeDoc ?? 0).getTime();
          case 'validite_desc':   return new Date(b.dateValiditeDoc ?? 0).getTime() - new Date(a.dateValiditeDoc ?? 0).getTime();
          case 'delivrance_asc':  return new Date(a.dateDelivranceDoc).getTime() - new Date(b.dateDelivranceDoc).getTime();
          case 'delivrance_desc': return new Date(b.dateDelivranceDoc).getTime() - new Date(a.dateDelivranceDoc).getTime();
          default: return 0;
        }
      });
    }
    return data;
  }, [list, filterDoc, filterType, validityFilter, sortKey, search]);

  // chips des filtres actifs
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filterDoc !== 'TOUS') {
    const labels: Record<string, string> = { PASSEPORT: 'Passeport', CIN: 'CIN', LAISSE_PASSER: 'Laissez-passer' };
    activeChips.push({ label: labels[filterDoc], onRemove: () => setFilterDoc('TOUS') });
  }
  if (filterType !== 'TOUS') {
    const labels: Record<string, string> = { ADULTE: 'Adulte', JEUNE: 'Jeune', ENFANT: 'Enfant', BEBE: 'Bébé' };
    activeChips.push({ label: labels[filterType], onRemove: () => setFilterType('TOUS') });
  }
  validityFilter.forEach((b) => {
    const labels: Record<ValidityBucket, string> = {
      CRITIQUE: 'Critique', ATTENTION_BAS: 'Att. 3-6m',
      ATTENTION_HAUT: 'Att. 6-9m', BIENTOT: 'Bientôt', VALIDE: 'Valide',
    };
    activeChips.push({ label: labels[b], onRemove: () => toggleValidity(b) });
  });

  const cycleSortKey = (asc: SortKey, desc: SortKey): void =>
    setSortKey((v) => v === asc ? desc : asc);

  return (
    <div className="flex flex-col h-full font-sans overflow-hidden bg-white">

      {/* Header */}
      <div className="px-7 pt-6 pb-0 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 text-sm mb-3 block">
          ← Retour
        </button>
        <h1 className="text-xl font-medium text-slate-900 mb-1">Documents clients</h1>
        <p className="text-[13px] text-slate-500 mb-5">
          {list.length} document{list.length > 1 ? 's' : ''} au total · Passeports, CIN et laissez-passer
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-7 flex items-center gap-2 flex-wrap mb-2 flex-shrink-0">

        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Nom, prénom, référence..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-[7px] text-[12px] bg-white border border-slate-200 rounded-full
              focus:outline-none focus:border-slate-400 placeholder:text-slate-300 text-slate-800"
          />
        </div>

        {/* Filtre type doc */}
        <Dropdown
          label={filterDoc === 'TOUS' ? 'Type de doc' : { PASSEPORT: 'Passeport', CIN: 'CIN', LAISSE_PASSER: 'Laissez-passer' }[filterDoc]}
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>}
          active={filterDoc !== 'TOUS'}
        >
          <DdLabel>Type de document</DdLabel>
          <DdItem onClick={() => setFilterDoc('TOUS')} active={filterDoc === 'TOUS'}><Dot color="#888780" />Tous</DdItem>
          <DdItem onClick={() => setFilterDoc('PASSEPORT')} active={filterDoc === 'PASSEPORT'}><Dot color="#378add" />Passeport</DdItem>
          <DdItem onClick={() => setFilterDoc('CIN')} active={filterDoc === 'CIN'}><Dot color="#7f77dd" />CIN</DdItem>
          <DdItem onClick={() => setFilterDoc('LAISSE_PASSER')} active={filterDoc === 'LAISSE_PASSER'}><Dot color="#b4b2a9" />Laissez-passer</DdItem>
        </Dropdown>

        {/* Filtre type client */}
        <Dropdown
          label={filterType === 'TOUS' ? 'Type client' : filterType[0] + filterType.slice(1).toLowerCase()}
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          active={filterType !== 'TOUS'}
        >
          <DdLabel>Type de client</DdLabel>
          {(['TOUS', 'ADULTE', 'JEUNE', 'ENFANT', 'BEBE'] as const).map((t) => {
            const colors: Record<string, string> = { TOUS: '#888780', ADULTE: '#a78bfa', JEUNE: '#6366f1', ENFANT: '#ec4899', BEBE: '#f59e0b' };
            const label = t === 'TOUS' ? 'Tous' : t[0] + t.slice(1).toLowerCase();
            return <DdItem key={t} onClick={() => setFilterType(t as FilterType)} active={filterType === t}><Dot color={colors[t]} />{label}</DdItem>;
          })}
        </Dropdown>

        {/* Filtre validité */}
        <Dropdown
          label="Validité"
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          active={validityFilter.size > 0}
          badge={validityFilter.size || undefined}
        >
          <DdLabel>Filtrer par validité</DdLabel>
          {([
            ['CRITIQUE',       '#ef4444', 'Critique — moins de 3 mois'],
            ['ATTENTION_BAS',  '#f97316', 'Attention — 3 à 6 mois'],
            ['ATTENTION_HAUT', '#fb923c', 'Attention — 6 à 9 mois'],
            ['BIENTOT',        '#eab308', 'Bientôt — 9 à 12 mois'],
            ['VALIDE',         '#22c55e', 'Valide — plus de 12 mois'],
          ] as [ValidityBucket, string, string][]).map(([bucket, color, label]) => (
            <label key={bucket} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] text-slate-700 hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={validityFilter.has(bucket)} onChange={() => toggleValidity(bucket)} className="rounded" />
              <Dot color={color} />
              {label}
            </label>
          ))}
          {validityFilter.size > 0 && (
            <>
              <DdSep />
              <DdItem onClick={() => setValidityFilter(new Set())}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Réinitialiser
              </DdItem>
            </>
          )}
        </Dropdown>

        {/* Tri */}
        <Dropdown
          label={sortKey ? SORT_LABELS[sortKey] : 'Trier'}
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
          active={!!sortKey}
        >
          <DdLabel>Trier par</DdLabel>
          <DdItem onClick={() => setSortKey('nom')}            active={sortKey === 'nom'}>Nom (A → Z)</DdItem>
          <DdItem onClick={() => setSortKey('nom_desc')}       active={sortKey === 'nom_desc'}>Nom (Z → A)</DdItem>
          <DdSep />
          <DdItem onClick={() => setSortKey('validite_asc')}   active={sortKey === 'validite_asc'}>Date validité (croissant)</DdItem>
          <DdItem onClick={() => setSortKey('validite_desc')}  active={sortKey === 'validite_desc'}>Date validité (décroissant)</DdItem>
          <DdSep />
          <DdItem onClick={() => setSortKey('delivrance_asc')} active={sortKey === 'delivrance_asc'}>Date délivrance (croissant)</DdItem>
          <DdItem onClick={() => setSortKey('delivrance_desc')} active={sortKey === 'delivrance_desc'}>Date délivrance (décroissant)</DdItem>
          {sortKey && (
            <>
              <DdSep />
              <DdItem onClick={() => setSortKey(null)}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Réinitialiser
              </DdItem>
            </>
          )}
        </Dropdown>
      </div>

      {/* Chips filtres actifs */}
      {activeChips.length > 0 && (
        <div className="px-7 flex gap-1.5 flex-wrap mb-2 shrink-0">
          {activeChips.map((chip, i) => <ActiveChip key={i} {...chip} />)}
        </div>
      )}

      {/* Tableau */}
      <div className="flex-1 min-h-0 overflow-hidden mx-7 mb-6 border border-slate-300 rounded-xl flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-100 shrink-0">
          <span className="text-[12px] text-slate-400">
            {loadingList ? 'Chargement...' : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loadingList && (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          )}

          {error && (
            <div className="m-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{error}</div>
          )}

          {!loadingList && !error && (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  {[
                    { label: 'Nom / Prénom',  sortAsc: 'nom'            as SortKey, sortDesc: 'nom_desc'        as SortKey },
                    { label: 'Type doc',       sortAsc: null,             sortDesc: null },
                    { label: 'Référence',      sortAsc: null,             sortDesc: null },
                    { label: 'Nationalité',    sortAsc: null,             sortDesc: null },
                    { label: 'Délivrance',     sortAsc: 'delivrance_asc' as SortKey, sortDesc: 'delivrance_desc' as SortKey },
                    { label: 'Validité',       sortAsc: 'validite_asc'   as SortKey, sortDesc: 'validite_desc'   as SortKey },
                    { label: 'Client',         sortAsc: null,             sortDesc: null },
                    { label: 'Doc',            sortAsc: null,             sortDesc: null },
                  ].map(({ label, sortAsc, sortDesc }) => (
                    <th
                      key={label}
                      onClick={sortAsc ? () => cycleSortKey(sortAsc, sortDesc!) : undefined}
                      className={`text-left text-[11px] font-medium text-white px-4 py-2.5 bg-blue-600
                        border-r last:border-r-0 select-none whitespace-nowrap
                        ${sortAsc ? 'cursor-pointer hover:text-slate-700' : ''}`}
                    >
                      {label}
                      {sortAsc && (
                        <span className="ml-1 opacity-40 text-[10px]">
                          {sortKey === sortAsc || sortKey === sortDesc ? '▲' : '⇅'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-[13px]">
                      Aucun document trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((info) => {
                    const isPass = info.typeDoc === 'PASSEPORT';
                    const isCin  = info.typeDoc === 'CIN';
                    const validity = isPass && info.dateValiditeDoc
                      ? getValidityDisplay(info.dateValiditeDoc)
                      : null;

                    return (
                      <tr key={info.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-[12px] border-r border-slate-100">
                          <span className="font-medium text-slate-900">{info.nom}</span>{' '}
                          <span className="text-slate-500">{info.prenom}</span>
                        </td>
                        <td className="px-4 py-2.5 border-r border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                            ${isPass ? 'bg-blue-50 text-blue-800'
                            : isCin  ? 'bg-purple-50 text-purple-800'
                                     : 'bg-slate-100 text-slate-600'}`}>
                            {isPass ? 'Passeport' : isCin ? 'CIN' : 'Laissez-passer'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500 tracking-wide border-r border-slate-100">
                          {info.referenceDoc}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-500 border-r border-slate-100">
                          {info.nationalite}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-500 border-r border-slate-100">
                          {formatDate(info.dateDelivranceDoc)}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] border-r border-slate-100">
                          {validity ? (
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${validity.dot}`} />
                              <span className={validity.text}>{validity.label}</span>
                              <span className="text-slate-400 ml-1">{formatDate(info.dateValiditeDoc)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-500 border-r border-slate-100">
                          {info.clientType
                            ? info.clientType[0] + info.clientType.slice(1).toLowerCase()
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {info.document ? (
                            <a
                              href={`${API_URL}/${info.document}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              Voir →
                            </a>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagePassport;