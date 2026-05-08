import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  fetchPassagersByDateRange,
  type Passager,
} from '../../../../app/front_office/parametre_liste_passager/passagerListeSlice';
import { fetchPays } from '../../../../app/front_office/parametre_ticketing/paysSlice';
import { FiArrowLeft, FiDownload, FiEye, FiX, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { usePassagerPdf } from '../module.pdf/pdf.generation/hooks/usePdfGenerator';
import type { PassagerPdfFilters } from '../module.pdf/pdf.generation/generators/passager.generator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDefaultRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { startDate, endDate };
};

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const thisWeek = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
};

const statusStyle: Record<string, string> = {
  PLANIFIE: 'bg-blue-50 text-blue-700',
  ANNULE:   'bg-red-50 text-red-700',
  REPORTE: 'bg-yellow-50 text-yellow-700',
};

// ─── Types filtres ─────────────────────────────────────────────────────────────

interface Filters {
  nom: string; pnr: string; owner: string; numeroVol: string;
  typeVol: string; status: string; villeDepart: string; villeArrivee: string;
}

const emptyFilters: Filters = {
  nom: '', pnr: '', owner: '', numeroVol: '',
  typeVol: '', status: '', villeDepart: '', villeArrivee: '',
};

// ─── FilterCell : cellule de la barre filtre ──────────────────────────────────

const FilterCell: React.FC<{ label: string; last?: boolean; children: React.ReactNode }> = ({
  label, last, children,
}) => (
  <div className={`flex flex-col gap-0.5 px-4 py-2.5 ${!last ? 'border-r border-gray-100' : ''} min-w-[130px]`}>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

// ─── ActiveFilterBadge ────────────────────────────────────────────────────────

const ActiveFilterBadge: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
    {label}
    <button onClick={onRemove} className="flex items-center hover:text-indigo-800"><FiX size={10} /></button>
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PageListePassage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { passagers, loading, error } = useSelector((state: RootState) => state.passagerListe);
  const { items: paysList } = useSelector((state: RootState) => state.pays);

  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate]     = useState(defaults.endDate);
  const [filters, setFilters]     = useState<Filters>(emptyFilters);
  const [search, setSearch]       = useState('');

  const allVilles = useMemo(() => {
    const set = new Set<string>();
    paysList.forEach((p) => p.DestinationVoyage?.forEach((d) => set.add(d.ville)));
    return Array.from(set).sort();
  }, [paysList]);

  const allTypeVols = useMemo(() => {
    const set = new Set(passagers.map((p) => p.typeVol).filter(Boolean));
    return Array.from(set).sort();
  }, [passagers]);

  useEffect(() => { dispatch(fetchPays()); }, [dispatch]);
  useEffect(() => {
    if (startDate && endDate) dispatch(fetchPassagersByDateRange({ startDate, endDate }));
  }, [dispatch, startDate, endDate]);

  const applyDateShortcut = (type: 'today' | 'tomorrow' | 'week' | 'month') => {
    if (type === 'today')    { const d = today();    setStartDate(d); setEndDate(d); }
    else if (type === 'tomorrow') { const d = tomorrow(); setStartDate(d); setEndDate(d); }
    else if (type === 'week')  { const { startDate: s, endDate: e } = thisWeek();        setStartDate(s); setEndDate(e); }
    else                       { const { startDate: s, endDate: e } = getDefaultRange(); setStartDate(s); setEndDate(e); }
  };

  const filtered = useMemo(() => {
    return passagers.filter((p) => {
      const [itiDepart = '', itiArrivee = ''] = p.itineraire?.split('→').map((s) => s.trim()) ?? [];
      const q = search.toLowerCase();
      const matchSearch = !q || [p.nom, p.pnr, p.owner, p.numeroVol].some((v) => v?.toLowerCase().includes(q));
      return (
        matchSearch &&
        (!filters.typeVol    || p.typeVol === filters.typeVol) &&
        (!filters.status     || p.status === filters.status) &&
        (!filters.villeDepart   || itiDepart.toLowerCase().includes(filters.villeDepart.toLowerCase())) &&
        (!filters.villeArrivee  || itiArrivee.toLowerCase().includes(filters.villeArrivee.toLowerCase()))
      );
    });
  }, [passagers, filters, search]);

  const setFilter = (key: keyof Filters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearAllFilters = () => { setFilters(emptyFilters); setSearch(''); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  const { generate: generatePdf, preview: previewPdf, loading: pdfLoading } = usePassagerPdf();

  const buildPdfFilters = (): PassagerPdfFilters => ({
    startDate, endDate,
    ...(filters.nom          && { nom:          filters.nom }),
    ...(filters.pnr          && { pnr:          filters.pnr }),
    ...(filters.owner        && { owner:        filters.owner }),
    ...(filters.numeroVol    && { numeroVol:    filters.numeroVol }),
    ...(filters.typeVol      && { typeVol:      filters.typeVol }),
    ...(filters.status       && { status:       filters.status }),
    ...(filters.villeDepart  && { villeDepart:  filters.villeDepart }),
    ...(filters.villeArrivee && { villeArrivee: filters.villeArrivee }),
  });

  const shortcuts = [
    ['today',    "Aujourd'hui"],
    ['tomorrow', 'Demain'],
    ['week',     'Cette semaine'],
    ['month',    'Ce mois'],
  ] as const;

  return (
    <div className="font-sans text-gray-900">

      {/* HEADER */}
      <div className="bg-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900">Liste Passager</h2>
            <p className="text-gray-500 font-medium italic text-sm">Gestion des comptes des client bénéficiaire.</p>
          </div>
        </div>
      </div>

      {/* ══════════ CARTE UNIFIÉE : filtres + tableau ══════════ */}
      <div className="bg-white m-5 border border-gray-100 rounded-xl overflow-hidden">

        {/* ── Ligne 1 : barre de filtres dropdown ── */}
        <div className="flex items-stretch flex-wrap border-b border-gray-100">

          {/* Date du */}
          <FilterCell label="Du">
            <input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm text-gray-800 border-none outline-none bg-transparent cursor-pointer" />
          </FilterCell>

          {/* Date au */}
          <FilterCell label="Au">
            <input type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm text-gray-800 border-none outline-none bg-transparent cursor-pointer" />
          </FilterCell>

          {/* Départ */}
          <FilterCell label="Départ">
            <select value={filters.villeDepart} onChange={(e) => setFilter('villeDepart', e.target.value)}
              className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer pr-1">
              <option value="">Toutes</option>
              {allVilles.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FilterCell>

          {/* Arrivée */}
          <FilterCell label="Arrivée">
            <select value={filters.villeArrivee} onChange={(e) => setFilter('villeArrivee', e.target.value)}
              className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer pr-1">
              <option value="">Toutes</option>
              {allVilles.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FilterCell>

          {/* Statut */}
          <FilterCell label="Statut">
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}
              className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer pr-1">
              <option value="">Tous</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="REPORTE">Reporté</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </FilterCell>

          {/* Type vol */}
          <FilterCell label="Type vol" last>
            <select value={filters.typeVol} onChange={(e) => setFilter('typeVol', e.target.value)}
              className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer pr-1">
              <option value="">Tous</option>
              {allTypeVols.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterCell>

          {/* Spacer + Search + Boutons — poussé à droite */}
          <div className="ml-auto flex items-center gap-2 px-4 py-2 border-l border-gray-100">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <FiSearch size={14} className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="text-sm bg-transparent outline-none text-gray-700 w-36 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Aperçu PDF */}
            {filtered.length > 0 && (
              <button
                onClick={() => previewPdf(filtered, buildPdfFilters())}
                disabled={pdfLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <FiEye size={14} /> Aperçu
              </button>
            )}

            {/* Export PDF */}
            {filtered.length > 0 && (
              <button
                onClick={() => generatePdf(filtered, buildPdfFilters(), undefined, `passagers-${startDate}-${endDate}.pdf`)}
                disabled={pdfLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                <FiDownload size={14} />
                {pdfLoading ? 'Génération…' : `Exporter (${filtered.length})`}
              </button>
            )}
          </div>
        </div>

        {/* ── Ligne 2 : raccourcis + badges actifs + compteur ── */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/60 border-b border-gray-100 flex-wrap">
          {/* Raccourcis */}
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mr-1">Période :</span>
          {shortcuts.map(([key, label]) => (
            <button key={key} onClick={() => applyDateShortcut(key)}
              className="px-3 py-0.5 text-xs font-bold border border-gray-200 rounded-full bg-white text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              {label}
            </button>
          ))}

          {/* Séparateur */}
          {activeFilterCount > 0 && <span className="w-px h-4 bg-gray-200 mx-1" />}

          {/* Badges filtres actifs */}
          {filters.villeDepart   && <ActiveFilterBadge label={`Départ: ${filters.villeDepart}`}   onRemove={() => setFilter('villeDepart', '')} />}
          {filters.villeArrivee  && <ActiveFilterBadge label={`Arrivée: ${filters.villeArrivee}`} onRemove={() => setFilter('villeArrivee', '')} />}
          {filters.status        && <ActiveFilterBadge label={`Statut: ${filters.status}`}         onRemove={() => setFilter('status', '')} />}
          {filters.typeVol       && <ActiveFilterBadge label={`Type: ${filters.typeVol}`}          onRemove={() => setFilter('typeVol', '')} />}
          {search                && <ActiveFilterBadge label={`Recherche: ${search}`}              onRemove={() => setSearch('')} />}

          {/* Compteur + reset — à droite */}
          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs text-gray-400 font-medium">
                {filtered.length} / {passagers.length} passager(s)
              </span>
            )}
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl transition-all">
                <FiX size={11} /> Réinitialiser ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* ── États loading / error ── */}
        {loading && <p className="px-6 py-4 text-sm text-gray-400 italic">Chargement…</p>}
        {error   && <p className="px-6 py-4 text-sm text-red-500 font-medium">{error}</p>}

        {/* ── Tableau ── */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50 text-sm">
              <thead className="bg-blue-800">
                <tr className="text-[11px] font-black text-white uppercase tracking-widest">
                  <th className="px-5 py-4 text-left whitespace-nowrap">Date départ</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Heure départ</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Heure arrivée</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Passager</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">PNR</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Owner</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Vol</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Itinéraire</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Type</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-gray-400 italic text-sm">
                      Aucun passager trouvé pour cette période.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p: Passager, idx: number) => (
                    <tr key={`${p.pnr}-${p.nom}-${idx}`}
                      className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                        {new Date(p.dateDepart).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.heureDepart}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.heureArrive}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">{p.nom}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-2.5 py-0.5 rounded-full">
                          {p.pnr}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.owner}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.numeroVol}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.itineraire}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{p.typeVol}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${statusStyle[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageListePassage;