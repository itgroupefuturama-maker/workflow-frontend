import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns, setCurrentClientFactureId, type DossierCommun } from '../../../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../../../app/store';
import { FiPlus, FiFolder, FiSearch, FiRefreshCw, FiGrid, FiFilter, FiChevronDown, FiX, FiArrowUp, FiArrowDown, FiArrowLeft } from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

type SortField = 'date' | 'status' | null;
type SortDir   = 'asc' | 'desc';

interface Filters {
  statuts: string[];
  clientFacture: string;
  creePar: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  statuts: [],
  clientFacture: '',
  creePar: '',
  dateFrom: '',
  dateTo: '',
};

// ── Hook clic extérieur ────────────────────────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

function DossierCommun() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: modules }                       = useSelector((state: RootState) => state.modules);
  const { data: dossiers, loading: loadingDossiers } = useSelector((state: RootState) => state.dossierCommun);

  const [searchTerm,     setSearchTerm]     = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [filters,        setFilters]        = useState<Filters>(EMPTY_FILTERS);
  const [sortField,      setSortField]      = useState<SortField>(null);
  const [sortDir,        setSortDir]        = useState<SortDir>('asc');
  const [openFilter,     setOpenFilter]     = useState(false);
  const [openSort,       setOpenSort]       = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setOpenFilter(false));
  useClickOutside(sortRef,   () => setOpenSort(false));

  // ── Valeurs uniques pour les selects ──────────────────────────────────────
  const uniqueClients = [...new Set(dossiers.map((d) => d.clientfacture?.libelle).filter(Boolean))] as string[];
  const uniqueUsers   = [...new Set(dossiers.map((d) => `${d.user?.nom} ${d.user?.prenom}`.trim()).filter(Boolean))] as string[];

  // ── Nombre de filtres actifs (badge) ──────────────────────────────────────
  const activeFilterCount =
    filters.statuts.length +
    (filters.clientFacture ? 1 : 0) +
    (filters.creePar ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0);

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  // ── Toggle statut dans le multi-select ────────────────────────────────────
  const toggleStatut = (s: string) =>
    setFilters((prev) => ({
      ...prev,
      statuts: prev.statuts.includes(s)
        ? prev.statuts.filter((x) => x !== s)
        : [...prev.statuts, s],
    }));

  // ── Toggle tri ────────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setOpenSort(false);
  };

  // ── Pipeline : filtre → tri ───────────────────────────────────────────────
  const processedDossiers = dossiers
    .filter((dossier) => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        dossier.numero?.toString().toLowerCase().includes(term) ||
        dossier.contactPrincipal?.toLowerCase().includes(term) ||
        dossier.clientfacture?.libelle?.toLowerCase().includes(term) ||
        dossier.description?.toLowerCase().includes(term);

      const matchesModule = selectedModule === null
        ? true
        : dossier.dossierCommunColab
            ?.filter((c) => c.status === 'CREER')
            .some((c) => c.module?.nom === selectedModule);

      const matchesStatut = filters.statuts.length === 0
        ? true
        : filters.statuts.includes(dossier.status);

      const matchesClient = filters.clientFacture
        ? dossier.clientfacture?.libelle === filters.clientFacture
        : true;

      const matchesUser = filters.creePar
        ? `${dossier.user?.nom} ${dossier.user?.prenom}`.trim() === filters.creePar
        : true;

      const dossierDate = new Date(dossier.createdAt).getTime();
      const matchesDateFrom = filters.dateFrom
        ? dossierDate >= new Date(filters.dateFrom).getTime()
        : true;
      const matchesDateTo = filters.dateTo
        ? dossierDate <= new Date(filters.dateTo + 'T23:59:59').getTime()
        : true;

      return matchesSearch && matchesModule && matchesStatut && matchesClient && matchesUser && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      if (sortField === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      return 0;
    });

  const countByModule = (moduleName: string) =>
    dossiers.filter((d) =>
      d.dossierCommunColab?.filter((c) => c.status === 'CREER').some((c) => c.module?.nom === moduleName)
    ).length;

  return (
    <div className="flex h-full  overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-60 flex flex-col py-6 px-3 gap-1">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-3 mb-3">Modules</p>

        <button
          onClick={() => setSelectedModule(null)}
          className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedModule === null ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2.5"><FiGrid size={15} /><span>Tous</span></div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${selectedModule === null ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {dossiers.length}
          </span>
        </button>

        {modules.map((mod) => {
          const isActive = selectedModule === mod.nom;
          const count    = countByModule(mod.nom);
          return (
            <button
              key={mod.id}
              onClick={() => setSelectedModule(isActive ? null : mod.nom)}
              className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FiFolder size={15} className="shrink-0" />
                <span className="truncate">{mod.nom}</span>
              </div>
              {count > 0 && (
                <span className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* ── CONTENU PRINCIPAL ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8">

        {/* Header */}
        <div className="shrink-0 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className='flex space-x-5 items-center'>
              <div className="bg-slate-300 flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-400 hover:text-white rounded-lg transition-all group cursor-pointer" 
                onClick={() => navigate('/')}
              >
                <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Retour</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-700">{selectedModule ?? 'Tous les dossiers'}</h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {processedDossiers.length} dossier{processedDossiers.length !== 1 ? 's' : ''}
                  {selectedModule ? ` dans le module ${selectedModule}` : ' au total'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dossiers-communs/nouveau')}
              className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 text-sm"
            >
              <FiPlus size={16} /> Nouveau Dossier
            </button>
          </div>

          {/* ── Barre d'outils ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Recherche */}
            <div className="relative group flex-1 max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Séparateur */}
            <div className="h-6 w-px bg-gray-200" />

            {/* ── Bouton FILTRE ── */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setOpenFilter((p) => !p); setOpenSort(false); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all shadow-sm ${
                  openFilter || activeFilterCount > 0
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FiFilter size={14} />
                Filtrer
                {activeFilterCount > 0 && (
                  <span className="bg-white text-indigo-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <FiChevronDown size={13} className={`transition-transform ${openFilter ? 'rotate-180' : ''}`} />
              </button>

              {/* Panel filtre */}
              {openFilter && (
                <div className="absolute left-0 top-full mt-2 w-90 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5 flex flex-col gap-4">

                  {/* Header panel */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-gray-800">Filtres</p>
                    {activeFilterCount > 0 && (
                      <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                        <FiX size={12} /> Réinitialiser
                      </button>
                    )}
                  </div>

                  {/* Statut — multi-select visuel */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'CREER',   label: 'Ouvert',   color: 'emerald' },
                        { value: 'ANNULER', label: 'Annulé',   color: 'red'     },
                      ].map(({ value, label, color }) => (
                        <button
                          key={value}
                          onClick={() => toggleStatut(value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            filters.statuts.includes(value)
                              ? color === 'emerald'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-red-500 text-white border-red-500'
                              : color === 'emerald'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Client facturé */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client facturé</p>
                    <select
                      value={filters.clientFacture}
                      onChange={(e) => setFilters((p) => ({ ...p, clientFacture: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all bg-white text-gray-700"
                    >
                      <option value="">Tous les clients</option>
                      {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Créé par */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Créé par</p>
                    <select
                      value={filters.creePar}
                      onChange={(e) => setFilters((p) => ({ ...p, creePar: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all bg-white text-gray-700"
                    >
                      <option value="">Tous les utilisateurs</option>
                      {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Date de création */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date de création</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                      />
                      <span className="text-xs text-gray-400 font-semibold shrink-0">→</span>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Bouton TRI ── */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setOpenSort((p) => !p); setOpenFilter(false); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all shadow-sm ${
                  openSort || sortField
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sortDir === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                Trier
                {sortField && (
                  <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
                    {sortField === 'date' ? 'Date' : 'Statut'}
                  </span>
                )}
                <FiChevronDown size={13} className={`transition-transform ${openSort ? 'rotate-180' : ''}`} />
              </button>

              {/* Panel tri */}
              {openSort && (
                <div className="absolute left-0 top-full mt-2 w-70 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">Trier par</p>

                  {[
                    { field: 'date'   as SortField, label: 'Date de création' },
                    { field: 'status' as SortField, label: 'Statut'           },
                  ].map(({ field, label }) => (
                    <button
                      key={field!}
                      onClick={() => handleSort(field)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        sortField === field ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{label}</span>
                      {sortField === field && (
                        <span className="flex items-center gap-1 text-xs text-indigo-500 font-bold">
                          {sortDir === 'asc' ? <><FiArrowUp size={12} /> Croissant</> : <><FiArrowDown size={12} /> Décroissant</>}
                        </span>
                      )}
                    </button>
                  ))}

                  {sortField && (
                    <>
                      <div className="h-px bg-gray-100 mx-2 my-1" />
                      <button
                        onClick={() => { setSortField(null); setOpenSort(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all"
                      >
                        <FiX size={12} /> Retirer le tri
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actualiser */}
            <button
              onClick={() => dispatch(fetchDossiersCommuns())}
              disabled={loadingDossiers}
              title="Actualiser"
              className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
            >
              <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={15} />
            </button>
          </div>

          {/* ── Chips filtres actifs ─────────────────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400 font-semibold">Filtres actifs :</span>

              {filters.statuts.map((s) => (
                <span key={s} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                  {s === 'CREER' ? 'Ouvert' : 'Annulé'}
                  <button onClick={() => toggleStatut(s)} className="hover:text-indigo-900"><FiX size={11} /></button>
                </span>
              ))}

              {filters.clientFacture && (
                <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                  {filters.clientFacture}
                  <button onClick={() => setFilters((p) => ({ ...p, clientFacture: '' }))} className="hover:text-indigo-900"><FiX size={11} /></button>
                </span>
              )}

              {filters.creePar && (
                <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                  {filters.creePar}
                  <button onClick={() => setFilters((p) => ({ ...p, creePar: '' }))} className="hover:text-indigo-900"><FiX size={11} /></button>
                </span>
              )}

              {(filters.dateFrom || filters.dateTo) && (
                <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                  {filters.dateFrom || '…'} → {filters.dateTo || '…'}
                  <button onClick={() => setFilters((p) => ({ ...p, dateFrom: '', dateTo: '' }))} className="hover:text-indigo-900"><FiX size={11} /></button>
                </span>
              )}

              <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors ml-1">
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* ── Tableau ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col mb-6">
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/70 sticky top-0 z-10">
                <tr>
                  {['N° Dos','Réf Travel Planner','Date Création','Statut','Description','Date Annulation','Raison Annulation','Client Facturé','Contact Principal','Whatsapp','Crée par','Modules'].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingDossiers ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={12} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                    </tr>
                  ))
                ) : processedDossiers.map((dossier) => (
                  <tr
                    key={dossier.id}
                    onClick={async () => { await dispatch(setCurrentClientFactureId(dossier)); navigate('/dossiers-communs/dossier-detail'); }}
                    className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><FiFolder size={14} /></div>
                        <span className="text-sm font-black text-gray-900">{dossier.numero}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">{dossier.referenceTravelPlaner || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        dossier.status === 'CREER' ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : dossier.status === 'ANNULER' ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        {dossier.status === 'CREER' ? 'Ouvert' : dossier.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-[140px] truncate">{dossier.description || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-red-400 whitespace-nowrap">
                      {dossier.dateAnnulation ? new Date(dossier.dateAnnulation).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 italic">{dossier.raisonAnnulation || '—'}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{dossier.clientfacture?.libelle || 'Non défini'}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">{dossier.contactPrincipal}</td>
                    <td className="px-5 py-3.5 text-xs text-emerald-600">{dossier.whatsapp || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{dossier.user?.nom} {dossier.user?.prenom}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-row gap-1">
                        {dossier.dossierCommunColab?.filter((c) => c.status === 'CREER').map((c, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            c.module?.nom === selectedModule
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {c.module?.nom}
                          </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loadingDossiers && processedDossiers.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center">
                <FiFolder size={40} className="text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">Aucun dossier trouvé</p>
                <p className="text-xs text-gray-300 mt-1">
                  {activeFilterCount > 0 ? 'Essaie de modifier ou réinitialiser les filtres' : `Aucun résultat pour "${searchTerm}"`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DossierCommun;