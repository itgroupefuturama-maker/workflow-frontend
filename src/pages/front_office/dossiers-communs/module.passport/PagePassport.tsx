import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllClientBeneficiaireInfos, type ClientBeneficiaireInfo } from '../../../../app/portail_client/clientBeneficiaireInfosSlice';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../../service/env';

// ── Utilitaires ────────────────────────────────────────────────────────────

function getMonthsUntilExpiry(dateValiditeDoc: string): number {
  const today  = new Date();
  const expiry = new Date(dateValiditeDoc);
  return (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
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

// ── Helpers ────────────────────────────────────────────────────────────────

function getValidityBucket(dateValiditeDoc: string): ValidityBucket {
  const m = getMonthsUntilExpiry(dateValiditeDoc);
  if (m < 3)  return 'CRITIQUE';
  if (m < 6)  return 'ATTENTION_BAS';
  if (m < 9)  return 'ATTENTION_HAUT';
  if (m < 12) return 'BIENTOT';
  return 'VALIDE';
}

function getValidityDisplay(dateValiditeDoc: string): {
  dotClass: string;
  textClass: string;
  label: string;
} {
  const m      = getMonthsUntilExpiry(dateValiditeDoc);
  const bucket = getValidityBucket(dateValiditeDoc);
  const days   = Math.round(m * 30);
  const months = Math.round(m);

  switch (bucket) {
    case 'CRITIQUE':      return { dotClass: 'bg-red-500',    textClass: 'text-red-700',    label: `${days}j restants` };
    case 'ATTENTION_BAS': return { dotClass: 'bg-orange-500', textClass: 'text-orange-700', label: `${months} mois` };
    case 'ATTENTION_HAUT':return { dotClass: 'bg-orange-400', textClass: 'text-orange-600', label: `${months} mois` };
    case 'BIENTOT':       return { dotClass: 'bg-yellow-400', textClass: 'text-yellow-700', label: `${months} mois` };
    case 'VALIDE':        return { dotClass: 'bg-green-500',  textClass: 'text-green-700',  label: `${months} mois` };
  }
}

// ── Constantes sidebar ─────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  TOUS: '#888780', PASSEPORT: '#378add', CIN: '#7f77dd', LAISSE_PASSER: '#b4b2a9',
  ADULTE: '#a78bfa', ENFANT: '#ec4899', JEUNE: '#6366f1', BEBE: '#f59e0b',
};

// ── Composant SideItem ─────────────────────────────────────────────────────

const SideItem: React.FC<{
  label: string;
  count: number;
  colorKey: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, colorKey, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors
      ${active
        ? 'bg-white text-[#1e1a17] font-medium'
        : 'text-[#6b5e52] hover:bg-white/60'}`}
  >
    <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: DOT_COLORS[colorKey] }} />
    <span className="flex-1 truncate">{label}</span>
    <span className="text-[11px] text-slate-600">{count}</span>
  </div>
);

// ── Composant Dropdown ─────────────────────────────────────────────────────

const Dropdown: React.FC<{
  label: string;
  icon: string;
  active: boolean;
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-colors
          ${active
            ? 'border-[#c0b8b0] bg-[#ece7e1] text-[#1e1a17]'
            : 'border-[#e0d9d2] bg-white text-[#3d3530] hover:bg-[#f5f0eb]'}`}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {!!badge && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full
            bg-[#3d3530] text-white text-[10px] font-medium">
            {badge}
          </span>
        )}
        <span className="text-[10px] text-slate-600">▾</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 bg-white border border-[#e0d9d2]
          rounded-xl shadow-sm p-1.5 min-w-[220px]">
          {children}
        </div>
      )}
    </div>
  );
};

const DdLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest px-2 pt-2 pb-1">{children}</p>
);

const DdItem: React.FC<{ onClick: () => void; children: React.ReactNode; active?: boolean }> = ({ onClick, children, active }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors
      ${active ? 'bg-[#f0ebe5] text-[#1e1a17] font-medium' : 'text-[#3d3530] hover:bg-[#f5f0eb]'}`}
  >
    {children}
  </div>
);

const DdSep = () => <div className="h-px bg-[#f0ebe5] my-1" />;

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

  const sortLabels: Record<NonNullable<SortKey>, string> = {
    nom:            'Nom A→Z',
    nom_desc:       'Nom Z→A',
    validite_asc:   'Validité ↑',
    validite_desc:  'Validité ↓',
    delivrance_asc: 'Délivrance ↑',
    delivrance_desc:'Délivrance ↓',
  };

  // Compteurs sidebar
  const counts = {
    pass:   list.filter((i) => i.typeDoc === 'PASSEPORT').length,
    cin:    list.filter((i) => i.typeDoc === 'CIN').length,
    lp:     list.filter((i) => i.typeDoc !== 'PASSEPORT' && i.typeDoc !== 'CIN').length,
    adulte: list.filter((i) => i.clientType === 'ADULTE').length,
    enfant: list.filter((i) => i.clientType === 'ENFANT').length,
    jeune:  list.filter((i) => i.clientType === 'JEUNE').length,
    bebe:   list.filter((i) => i.clientType === 'BEBE').length,
  };

  // Filtrage + tri
  const filtered = useMemo(() => {
    let data = list.filter((info) => {
      if (filterDoc === 'PASSEPORT'     && info.typeDoc !== 'PASSEPORT')                          return false;
      if (filterDoc === 'CIN'           && info.typeDoc !== 'CIN')                                return false;
      if (filterDoc === 'LAISSE_PASSER' && (info.typeDoc === 'PASSEPORT' || info.typeDoc === 'CIN')) return false;
      if (filterType !== 'TOUS' && info.clientType !== filterType)                                return false;

      if (validityFilter.size > 0) {
        if (info.typeDoc !== 'PASSEPORT') return false; // validité uniquement sur passeport
        if (!validityFilter.has(getValidityBucket(info.dateValiditeDoc))) return false;
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
          case 'nom':            return a.nom.localeCompare(b.nom);
          case 'nom_desc':       return b.nom.localeCompare(a.nom);
          case 'validite_asc':   return new Date(a.dateValiditeDoc ?? 0).getTime() - new Date(b.dateValiditeDoc ?? 0).getTime();
          case 'validite_desc':  return new Date(b.dateValiditeDoc ?? 0).getTime() - new Date(a.dateValiditeDoc ?? 0).getTime();
          case 'delivrance_asc': return new Date(a.dateDelivranceDoc).getTime() - new Date(b.dateDelivranceDoc).getTime();
          case 'delivrance_desc':return new Date(b.dateDelivranceDoc).getTime() - new Date(a.dateDelivranceDoc).getTime();
          default: return 0;
        }
      });
    }

    return data;
  }, [list, filterDoc, filterType, validityFilter, sortKey, search]);

  // ── Rendu ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full text-sm font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-[#e0d9d2] bg-slate-200 p-2 overflow-y-auto flex flex-col gap-0.5">

        <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest px-2 pt-3 pb-1">
          Type de doc
        </p>
        <SideItem label="Tous"           count={list.length} colorKey="TOUS"         active={filterDoc === 'TOUS'}         onClick={() => setFilterDoc('TOUS')} />
        <SideItem label="Passeports"     count={counts.pass} colorKey="PASSEPORT"    active={filterDoc === 'PASSEPORT'}    onClick={() => setFilterDoc((v) => v === 'PASSEPORT'     ? 'TOUS' : 'PASSEPORT')} />
        <SideItem label="CIN"            count={counts.cin}  colorKey="CIN"          active={filterDoc === 'CIN'}          onClick={() => setFilterDoc((v) => v === 'CIN'           ? 'TOUS' : 'CIN')} />
        <SideItem label="Laissez-passer" count={counts.lp}   colorKey="LAISSE_PASSER" active={filterDoc === 'LAISSE_PASSER'} onClick={() => setFilterDoc((v) => v === 'LAISSE_PASSER' ? 'TOUS' : 'LAISSE_PASSER')} />

        <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest px-2 pt-4 pb-1">
          Type client
        </p>
        {(['ADULTE', 'ENFANT', 'JEUNE', 'BEBE'] as FilterType[]).map((t) => (
          <SideItem
            key={t}
            label={t.charAt(0) + t.slice(1).toLowerCase()}
            count={counts[t.toLowerCase() as keyof typeof counts] as number}
            colorKey={t}
            active={filterType === t}
            onClick={() => setFilterType((v) => v === t ? 'TOUS' : t)}
          />
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">

        {/* Header */}
        <div className="px-8 pt-6 pb-0 shrink-0">
          <button onClick={() => navigate(-1)} className="text-slate-700 hover:text-[#6b5e52] text-sm mb-2">
            ← Retour
          </button>
          <h1 className="text-2xl font-semibold text-[#1e1a17]">Documents clients</h1>
          <p className="text-slate-600 text-[13px] mt-1 mb-4">
            {list.length} document{list.length > 1 ? 's' : ''} au total · Passeports, CIN et laissez-passer
          </p>
        </div>

        {/* Toolbar */}
        <div className="px-8 pb-3 flex items-center gap-2 flex-wrap shrink-0">

          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0b8b0] text-base">🔍</span>
            <input
              type="text"
              placeholder="Nom, prénom, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-[12px] bg-white border border-[#e0d9d2] rounded-full
                focus:outline-none focus:border-[#c0b8b0] placeholder:text-[#c0b8b0]"
            />
          </div>

          {/* Filtre validité */}
          <Dropdown
            label="Validité"
            icon="🗓"
            active={validityFilter.size > 0}
            badge={validityFilter.size || undefined}
          >
            <DdLabel>Filtrer par validité</DdLabel>
            {([
              ['CRITIQUE',       '🔴', 'Critique — moins de 3 mois'],
              ['ATTENTION_BAS',  '🟠', 'Attention — 3 à 6 mois'],
              ['ATTENTION_HAUT', '🟡', 'Attention — 6 à 9 mois'],
              ['BIENTOT',        '🟡', 'Bientôt — 9 à 12 mois'],
              ['VALIDE',         '🟢', 'Valide — plus de 12 mois'],
            ] as [ValidityBucket, string, string][]).map(([bucket, dot, label]) => (
              <label key={bucket} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                text-[12px] text-[#3d3530] hover:bg-[#f5f0eb] transition-colors">
                <input
                  type="checkbox"
                  checked={validityFilter.has(bucket)}
                  onChange={() => toggleValidity(bucket)}
                  className="rounded"
                />
                <span>{dot}</span>
                <span>{label}</span>
              </label>
            ))}
            {validityFilter.size > 0 && (
              <>
                <DdSep />
                <DdItem onClick={() => setValidityFilter(new Set())}>
                  ✕ Réinitialiser
                </DdItem>
              </>
            )}
          </Dropdown>

          {/* Tri */}
          <Dropdown
            label={sortKey ? sortLabels[sortKey] : 'Trier'}
            icon="↕"
            active={!!sortKey}
          >
            <DdLabel>Trier par</DdLabel>
            <DdItem onClick={() => setSortKey('nom')}            active={sortKey === 'nom'}>            Nom (A → Z)</DdItem>
            <DdItem onClick={() => setSortKey('nom_desc')}       active={sortKey === 'nom_desc'}>       Nom (Z → A)</DdItem>
            <DdSep />
            <DdItem onClick={() => setSortKey('validite_asc')}   active={sortKey === 'validite_asc'}>   Date validité (croissant)</DdItem>
            <DdItem onClick={() => setSortKey('validite_desc')}  active={sortKey === 'validite_desc'}>  Date validité (décroissant)</DdItem>
            <DdSep />
            <DdItem onClick={() => setSortKey('delivrance_asc')} active={sortKey === 'delivrance_asc'}> Date délivrance (croissant)</DdItem>
            <DdItem onClick={() => setSortKey('delivrance_desc')}active={sortKey === 'delivrance_desc'}>Date délivrance (décroissant)</DdItem>
            {sortKey && (
              <>
                <DdSep />
                <DdItem onClick={() => setSortKey(null)}>✕ Réinitialiser</DdItem>
              </>
            )}
          </Dropdown>
        </div>

        {/* Tableau */}
        <div className="flex-1 min-h-0 overflow-hidden mx-8 mb-6 bg-white rounded-2xl border border-[#e8e2db] flex flex-col">

          {/* En-tête tableau */}
          <div className="px-4 py-3 border-b border-[#f0ebe5] shrink-0">
            <span className="text-[12px] text-slate-600">
              {loadingList ? 'Chargement...' : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Zone scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loadingList && (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="h-10 rounded-lg bg-[#f5f0eb] animate-pulse" />
                ))}
              </div>
            )}

            {error && (
              <div className="m-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">
                {error}
              </div>
            )}

            {!loadingList && !error && (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    {[
                      { label: 'Nom / Prénom',  key: 'nom'            as SortKey, w: 'w-[160px]' },
                      { label: 'Type doc',       key: null,                         w: 'w-[110px]' },
                      { label: 'Référence',      key: null,                         w: 'w-[120px]' },
                      { label: 'Nationalité',    key: null,                         w: 'w-[110px]' },
                      { label: 'Délivrance',     key: 'delivrance_asc' as SortKey, w: 'w-[100px]' },
                      { label: 'Validité',       key: 'validite_asc'   as SortKey, w: 'w-[200px]'          },
                      { label: 'Client',         key: null,                         w: 'w-[80px]'  },
                      { label: 'Doc',            key: null,                         w: 'w-[60px]'  },
                    ].map(({ label, key, w }) => (
                      <th
                        key={label}
                        onClick={key ? () => setSortKey((v) => v === key ? (key.endsWith('asc') ? key.replace('asc','desc') as SortKey : key.replace('desc','asc') as SortKey) : key) : undefined}
                        className={`${w} text-left text-[11px] font-medium text-slate-700 px-4 py-2.5
                          border-b border-r border-[#f0ebe5] last:border-r-0 select-none
                          ${key ? 'cursor-pointer hover:text-[#6b5e52]' : ''}`}
                      >
                        {label}
                        {key && <span className="ml-1 text-[10px]">{sortKey === key || sortKey === key?.replace('asc','desc') ? '▲' : '⇅'}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-[#c0b8b0] text-[13px]">
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
                        <tr key={info.id} className="hover:bg-[#faf8f6] transition-colors group">

                          {/* Nom */}
                          <td className="px-4 py-2.5 text-[12px] border-r border-[#f0ebe5]">
                            <span className="font-medium text-[#1e1a17]">{info.nom}</span>{' '}
                            <span className="text-slate-600">{info.prenom}</span>
                          </td>

                          {/* Type doc */}
                          <td className="px-4 py-2.5 border-r border-[#f0ebe5]">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                              ${isPass ? 'bg-blue-50 text-blue-800'
                              : isCin  ? 'bg-purple-50 text-purple-800'
                                       : 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
                              {isPass ? 'Passeport' : isCin ? 'CIN' : 'Laissez-passer'}
                            </span>
                          </td>

                          {/* Référence */}
                          <td className="px-4 py-2.5 text-[11px] font-mono text-[#5f5e5a] tracking-wide border-r border-[#f0ebe5]">
                            {info.referenceDoc}
                          </td>

                          {/* Nationalité */}
                          <td className="px-4 py-2.5 text-[12px] text-slate-600 border-r border-[#f0ebe5]">
                            {info.nationalite}
                          </td>

                          {/* Délivrance */}
                          <td className="px-4 py-2.5 text-[12px] text-slate-600 border-r border-[#f0ebe5]">
                            {formatDate(info.dateDelivranceDoc)}
                          </td>

                          {/* Validité */}
                          <td className="px-4 py-2.5 text-[12px] border-r border-[#f0ebe5]">
                            {validity ? (
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${validity.dotClass}`} />
                                <span className={validity.textClass}>{validity.label}</span>
                                <span className="text-slate-700 ml-1">{formatDate(info.dateValiditeDoc)}</span>
                              </span>
                            ) : (
                              <span className="text-[#c0b8b0]">—</span>
                            )}
                          </td>

                          {/* Type client */}
                          <td className="px-4 py-2.5 text-[11px] text-slate-600 border-r border-[#f0ebe5]">
                            {info.clientType
                              ? info.clientType.charAt(0) + info.clientType.slice(1).toLowerCase()
                              : '—'}
                          </td>

                          {/* Doc */}
                          <td className="px-4 py-2.5 border-r border-[#f0ebe5]">
                            {info.document ? (
                              <a
                                href={`${API_URL}/${info.document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Voir →
                              </a>
                            ) : (
                              <span className="text-[#c0b8b0] text-[11px]">—</span>
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
      </main>
    </div>
  );
};

export default PagePassport;