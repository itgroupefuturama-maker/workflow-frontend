import React, { useEffect, useMemo, useState } from 'react';
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

// function getValidityStyle(dateValiditeDoc: string): {
//   rowBg: string; dot: string; label: string; labelColor: string;
// } {
//   const m = getMonthsUntilExpiry(dateValiditeDoc);
//   if (m < 3)  return { rowBg: 'bg-red-50',    dot: 'bg-red-500',    label: `Critique (${Math.round(m * 30)}j)`,  labelColor: 'text-red-700' };
//   if (m < 6)  return { rowBg: 'bg-orange-50', dot: 'bg-orange-500', label: `Attention (${Math.round(m)} mois)`, labelColor: 'text-orange-700' };
//   if (m < 9)  return { rowBg: 'bg-orange-50', dot: 'bg-orange-400', label: `Attention (${Math.round(m)} mois)`, labelColor: 'text-orange-600' };
//   if (m < 12) return { rowBg: 'bg-yellow-50', dot: 'bg-yellow-400', label: `Bientôt (${Math.round(m)} mois)`,  labelColor: 'text-yellow-700' };
//   return        { rowBg: 'bg-green-50',  dot: 'bg-green-500',  label: `Valide (${Math.round(m)} mois)`,   labelColor: 'text-green-700' };
// }

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Couleurs cartes ────────────────────────────────────────────────────────

// const CARD_COLORS = [
//   'bg-[#d4e8c2]', 'bg-[#d4c5f0]', 'bg-[#f5e6c8]',
//   'bg-[#f0d4d4]', 'bg-[#c5dff0]', 'bg-[#f0f0c5]',
// ];

// const CLIENT_TYPE_COLORS: Record<string, string> = {
//   ADULTE: 'bg-blue-100 text-blue-800',
//   ENFANT: 'bg-purple-100 text-purple-800',
//   BEBE:   'bg-pink-100 text-pink-800',
//   JEUNE:  'bg-indigo-100 text-indigo-800',
// };

// ── Carte bénéficiaire ─────────────────────────────────────────────────────

// ── Helpers validité ───────────────────────────────────────────────────────

function getValidityStyle(dateValiditeDoc: string): {
  stripe: string;       // couleur de la barre en haut de la carte
  rowBg: string;        // fond de la ligne validité
  dot: string;          // couleur du point
  label: string;        // texte affiché
  labelColor: string;   // couleur du texte
} {
  const m = getMonthsUntilExpiry(dateValiditeDoc);
  if (m < 3)  return { stripe: 'bg-red-500',    rowBg: 'bg-red-50',    dot: 'bg-red-500',    label: `Critique — ${Math.round(m * 30)}j restants`, labelColor: 'text-red-700' };
  if (m < 6)  return { stripe: 'bg-orange-500', rowBg: 'bg-orange-50', dot: 'bg-orange-500', label: `Attention — ${Math.round(m)} mois`,           labelColor: 'text-orange-700' };
  if (m < 9)  return { stripe: 'bg-orange-400', rowBg: 'bg-orange-50', dot: 'bg-orange-400', label: `Attention — ${Math.round(m)} mois`,            labelColor: 'text-orange-600' };
  if (m < 12) return { stripe: 'bg-yellow-400', rowBg: 'bg-yellow-50', dot: 'bg-yellow-400', label: `Bientôt — ${Math.round(m)} mois`,              labelColor: 'text-yellow-700' };
  return               { stripe: 'bg-green-500', rowBg: 'bg-green-50',  dot: 'bg-green-500',  label: `Valide — ${Math.round(m)} mois`,               labelColor: 'text-green-700' };
}

// ── Carte ──────────────────────────────────────────────────────────────────

const ClientCard: React.FC<{ info: ClientBeneficiaireInfo; idx: number }> = ({ info }) => {
  const isPassport = info.typeDoc === 'PASSEPORT';
  const isCin      = info.typeDoc === 'CIN';
  const validity   = isPassport ? getValidityStyle(info.dateValiditeDoc) : null;

  // Barre colorée en haut : couleur validité pour passeport, neutre sinon
  const stripe = validity ? validity.stripe : 'bg-[#e8e2db]';

  // Badge type doc
  const docBadgeClass = isPassport
    ? 'bg-blue-50 text-blue-800'
    : isCin
    ? 'bg-purple-50 text-purple-800'
    : 'bg-[#f1efe8] text-[#5f5e5a]';

  const docLabel = isPassport ? 'Passeport' : isCin ? 'CIN' : 'Laissez-passer';

  // Icône document
  const docIcon = isPassport ? '🛂' : isCin ? '🪪' : '📋';
  const docIconBg = isPassport
    ? 'bg-blue-50'
    : isCin
    ? 'bg-purple-50'
    : 'bg-[#f1efe8]';

  return (
    <div className="bg-white rounded-xl border border-[#e8e2db] overflow-hidden
      cursor-pointer hover:shadow-md transition-shadow group relative"
    >
      {/* Barre colorée — encode la criticité pour les passeports */}
      <div className={`h-[3px] w-full ${stripe}`} />

      <div className="p-4 flex flex-col gap-2.5">

        {/* Ligne 1 : année + badge type */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#a09080] font-medium">
            {new Date(info.dateDelivranceDoc).getFullYear()}
          </span>
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${docBadgeClass}`}>
            {docLabel}
          </span>
        </div>

        {/* Ligne 2 : icône + identité */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${docIconBg}`}>
            {docIcon}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1e1a17] leading-snug">
              {info.prenom} {info.nom}
            </p>
            <p className="text-[11px] text-[#7a6e64]">{info.nationalite}</p>
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-[#f0ebe5]" />

        {/* Ligne validité — passeport uniquement */}
        {isPassport && validity && (
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${validity.rowBg}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${validity.dot}`} />
            <span className={`text-[11px] font-medium ${validity.labelColor}`}>{validity.label}</span>
            <span className="text-[11px] text-[#7a6e64] ml-auto">
              {formatDate(info.dateValiditeDoc)}
            </span>
          </div>
        )}

        {/* Référence */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#a09080]">Réf</span>
          <span className="text-[11px] font-semibold text-[#1e1a17] font-mono tracking-wide">
            {info.referenceDoc}
          </span>
        </div>

        {/* Footer : pills + lien doc */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {info.clientType && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f0eb] text-[#6b5e52]">
              {info.clientType}
            </span>
          )}
          {info.clientbeneficiaire && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f0eb] text-[#6b5e52]">
              {info.clientbeneficiaire.code}
            </span>
          )}
          {info.document && (
            <a
              href={`${API_URL}/${info.document}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700
                hover:bg-blue-100 transition-colors ml-auto"
            >
              Voir doc →
            </a>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Types filtres ──────────────────────────────────────────────────────────

type FilterDoc      = 'TOUS' | 'PASSEPORT' | 'LAISSE_PASSER' | 'CIN';
type FilterValidity = 'TOUS' | 'CRITIQUE' | 'ATTENTION' | 'BIENTOT' | 'VALIDE';
type FilterType     = 'TOUS' | 'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE';

// ── Page principale ────────────────────────────────────────────────────────

const DOT: Record<string, string> = {
  TOUS: '#6b5e52', PASSEPORT: '#3b82f6', LAISSE_PASSER: '#a09080', CIN: '#8b5cf6',
  CRITIQUE: '#ef4444', ATTENTION: '#f97316', BIENTOT: '#eab308', VALIDE: '#22c55e',
  ADULTE: '#a78bfa', ENFANT: '#ec4899', BEBE: '#f59e0b', JEUNE: '#6366f1',
};

const SideItem = ({
  label, count, colorKey, active, onClick,
}: { label: string; count: number; colorKey: string; active: boolean; onClick: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors
      ${active ? 'bg-[#d4cdc6] text-[#2d2520] font-medium' : 'text-[#6b5e52] hover:bg-[#ddd8d2]'}`}
  >
    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DOT[colorKey] }} />
    <span className="flex-1 truncate">{label}</span>
    <span className="text-[11px] text-[#a09080]">{count}</span>
  </div>
);

const PagePassport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list, loadingList, error } = useSelector((s: RootState) => s.clientBeneficiaireInfos);

  const [filterDoc,      setFilterDoc]      = useState<FilterDoc>('TOUS');
  const [filterValidity, setFilterValidity] = useState<FilterValidity>('TOUS');
  const [filterType,     setFilterType]     = useState<FilterType>('TOUS');
  const [search,         setSearch]         = useState('');

  useEffect(() => { dispatch(fetchAllClientBeneficiaireInfos()); }, [dispatch]);

  // Compteurs
  const passports = list.filter((i) => i.typeDoc === 'PASSEPORT');
  const counts = {
    critique: passports.filter((i) => getMonthsUntilExpiry(i.dateValiditeDoc) < 3).length,
    attention: passports.filter((i) => { const m = getMonthsUntilExpiry(i.dateValiditeDoc); return m >= 3 && m < 9; }).length,
    bientot:   passports.filter((i) => { const m = getMonthsUntilExpiry(i.dateValiditeDoc); return m >= 9 && m < 12; }).length,
    valide:    passports.filter((i) => getMonthsUntilExpiry(i.dateValiditeDoc) >= 12).length,
  };

  // Filtrage
  const filtered = useMemo(() => list.filter((info) => {
    if (filterDoc === 'PASSEPORT'    && info.typeDoc !== 'PASSEPORT')    return false;
    if (filterDoc === 'LAISSE_PASSER' && info.typeDoc !== 'LAISSE_PASSER') return false;
    if (filterDoc === 'CIN' && info.typeDoc !== 'CIN') return false;
    if (filterType !== 'TOUS' && info.clientType !== filterType) return false;
    if (filterValidity !== 'TOUS' && info.typeDoc === 'PASSEPORT') {
      const m = getMonthsUntilExpiry(info.dateValiditeDoc);
      if (filterValidity === 'CRITIQUE'  && m >= 3)          return false;
      if (filterValidity === 'ATTENTION' && (m < 3 || m >= 9)) return false;
      if (filterValidity === 'BIENTOT'   && (m < 9 || m >= 12)) return false;
      if (filterValidity === 'VALIDE'    && m < 12)           return false;
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
  }), [list, filterDoc, filterValidity, filterType, search]);

  return (
    <div className="flex h-full text-sm font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 border-r border-[#e0d9d2] bg-slate-200 p-3 overflow-y-auto flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-widest px-2 pt-3 pb-1">
          Type de doc
        </p>
        <SideItem label="Tous"            count={list.length}                                      colorKey="TOUS"         active={filterDoc === 'TOUS'}         onClick={() => setFilterDoc('TOUS')} />
        <SideItem label="Passeports"      count={list.filter(i => i.typeDoc === 'PASSEPORT').length}   colorKey="PASSEPORT"    active={filterDoc === 'PASSEPORT'}    onClick={() => setFilterDoc('PASSEPORT')} />
        <SideItem label="CIN"             count={list.filter(i => i.typeDoc === 'CIN').length}        colorKey="CIN"          active={filterDoc === 'CIN'}          onClick={() => setFilterDoc('CIN')} />
        <SideItem label="Laissez-passer"  count={list.filter(i => i.typeDoc !== 'PASSEPORT' && i.typeDoc !== 'CIN').length}   colorKey="LAISSE_PASSER" active={filterDoc === 'LAISSE_PASSER'} onClick={() => setFilterDoc('LAISSE_PASSER')} />

        <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-widest px-2 pt-4 pb-1">
          Validité
        </p>
        <SideItem label="Critique"  count={counts.critique}  colorKey="CRITIQUE"  active={filterValidity === 'CRITIQUE'}  onClick={() => setFilterValidity(v => v === 'CRITIQUE'  ? 'TOUS' : 'CRITIQUE')} />
        <SideItem label="Attention" count={counts.attention} colorKey="ATTENTION" active={filterValidity === 'ATTENTION'} onClick={() => setFilterValidity(v => v === 'ATTENTION' ? 'TOUS' : 'ATTENTION')} />
        <SideItem label="Bientôt"   count={counts.bientot}   colorKey="BIENTOT"   active={filterValidity === 'BIENTOT'}   onClick={() => setFilterValidity(v => v === 'BIENTOT'   ? 'TOUS' : 'BIENTOT')} />
        <SideItem label="Valide"    count={counts.valide}    colorKey="VALIDE"    active={filterValidity === 'VALIDE'}    onClick={() => setFilterValidity(v => v === 'VALIDE'    ? 'TOUS' : 'VALIDE')} />

        <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-widest px-2 pt-4 pb-1">
          Type client
        </p>
        {(['ADULTE', 'ENFANT', 'BEBE', 'JEUNE'] as FilterType[]).map((t) => (
          <SideItem
            key={t} label={t.charAt(0) + t.slice(1).toLowerCase()}
            count={list.filter(i => i.clientType === t).length}
            colorKey={t} active={filterType === t}
            onClick={() => setFilterType(v => v === t ? 'TOUS' : t)}
          />
        ))}
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden flex flex-col p-8 min-w-0">

        <div className="mb-1">
          <button onClick={() => navigate(-1)} className="text-[#a09080] hover:text-[#6b5e52] text-sm">
            ← Retour
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-semibold text-[#1e1a17]">Documents clients</h1>
        </div>
        <p className="text-[#7a6e64] text-[13px] mb-5">
          {list.length} document{list.length > 1 ? 's' : ''} au total · Passeports et laissez-passer
        </p>

        {/* Stat cards — fixes */}
        <div className="grid grid-cols-4 gap-3 mb-5 shrink-0">
          {[
            { label: 'Critique', count: counts.critique, dot: 'bg-red-500',    key: 'CRITIQUE'  as FilterValidity },
            { label: 'Attention', count: counts.attention, dot: 'bg-orange-500', key: 'ATTENTION' as FilterValidity },
            { label: 'Bientôt',  count: counts.bientot,  dot: 'bg-yellow-400', key: 'BIENTOT'   as FilterValidity },
            { label: 'Valide',   count: counts.valide,   dot: 'bg-green-500',  key: 'VALIDE'    as FilterValidity },
          ].map(({ label, count, dot, key }) => (
            <button
              key={key}
              onClick={() => setFilterValidity(v => v === key ? 'TOUS' : key)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors
                ${filterValidity === key
                  ? 'border-[#c0b8b0] bg-[#ece7e1]'
                  : 'bg-white border-transparent hover:border-[#e0d9d2]'}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
              <div>
                <p className="text-lg font-semibold text-[#1e1a17]">{count}</p>
                <p className="text-[11px] text-[#7a6e64]">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Recherche — fixe */}
        <div className="mb-4 shrink-0">
          <input
            type="text"
            placeholder="Rechercher nom, prénom, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-[13px] bg-white border border-[#e0d9d2] rounded-full
              focus:outline-none focus:border-[#c0b8b0] placeholder:text-[#c0b8b0]"
          />
        </div>

        {/* Panneau blanc — flex-1 avec scroll interne */}
        <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-0">

          {/* Header fixe */}
          <div className="px-6 pt-5 pb-4 shrink-0 border-b border-[#f5f0eb]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#a09080]">
                {loadingList ? 'Chargement...' : `Items (${filtered.length}) · ${
                  filterDoc === 'TOUS' ? 'Tous les documents'
                  : filterDoc === 'PASSEPORT' ? 'Passeports'
                  : filterDoc === 'CIN' ? 'CIN'
                  : 'Laissez-passer'
                }`}
              </span>
              <div className="grow border-b border-[#f5f0eb] ml-1" />
            </div>
          </div>

          {/* Zone scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">

            {loadingList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-xl bg-[#f5f0eb] animate-pulse min-h-36" />
                ))}
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">
                {error}
              </div>
            )}

            {!loadingList && !error && filtered.length === 0 && (
              <div className="flex items-center justify-center h-full text-[#c0b8b0]">
                <p className="text-[13px]">Aucun document trouvé.</p>
              </div>
            )}

            {!loadingList && filtered.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((info, idx) => (
                  <ClientCard key={info.id} info={info} idx={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PagePassport;