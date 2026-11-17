import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommunsPaginated, setCurrentClientFactureId } from '../../../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../../../app/store';
import { FiPlus, FiFolder, FiSearch, FiRefreshCw, FiGrid, FiFilter, FiChevronDown, FiX, FiArrowUp, FiArrowDown, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import Pagination from '../../../../components/Pagination';
import Button from '../../../../components/ui/Button';
import StatusBadge from '../../../../components/ui/StatusBadge';
import SkeletonTableRows from '../../../../components/ui/SkeletonTableRows';

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
  // Liste complète non paginée — sert uniquement aux compteurs par module de la sidebar et
  // aux options des filtres "Client facturé"/"Créé par" (le backend ne fournit pas d'agrégat
  // par module ni de recherche sur ces champs). Inchangée par rapport à avant ce chantier.
  const { data: dossiers } = useSelector((state: RootState) => state.dossierCommun);
  // Liste paginée — alimente le tableau affiché.
  const {
    listData: pagedDossiers = [],
    listMeta: meta = { total: 0, page: 1, limit: 10, totalPages: 1 },
    listLoading: loadingDossiers,
  } = useSelector((state: RootState) => state.dossierCommun);

  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(10);

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

  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  // Le backend n'accepte qu'une seule valeur de statut (pas un multi-select) : si les deux
  // statuts sont cochés (ou aucun), ça revient à ne pas filtrer côté serveur.
  const serverStatut = filters.statuts.length === 1 ? filters.statuts[0] : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedModule, serverStatut]);

  const loadList = () => {
    dispatch(fetchDossiersCommunsPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: serverStatut,
      module: selectedModule || undefined,
    }));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch, selectedModule, serverStatut]);

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
  // Recherche/module/statut sont maintenant filtrés côté serveur (voir loadList ci-dessus).
  // clientFacture/créé par/date de création restent filtrés ici, faute de support serveur —
  // ils ne s'appliquent donc qu'à la page actuellement chargée (`pagedDossiers`), pas à
  // l'ensemble des dossiers.
  const processedDossiers = pagedDossiers
    .filter((dossier) => {
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

      return matchesClient && matchesUser && matchesDateFrom && matchesDateTo;
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

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  const selectClass =
    'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition';

  const toolbarBtn = (active: boolean) =>
    `inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
    }`;

  const chip = (label: string, onRemove: () => void, key?: string) => (
    <span key={key} className="inline-flex items-center gap-1.5 bg-white text-slate-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-md border border-slate-200">
      {label}
      <button onClick={onRemove} className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Retirer">
        <FiX size={11} />
      </button>
    </span>
  );

  const COLUMNS = ['Dossier', 'Client facturé', 'Description', 'Modules', 'Statut', 'Création'];

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-slate-200">
        <div className="px-4 pt-6 pb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <FiArrowLeft size={14} /> Accueil
          </button>
        </div>

        <p className="px-4 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Modules</p>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-0.5">
          {[{ id: '__all__', nom: null as string | null, label: 'Tous les dossiers', count: dossiers.length, icon: <FiGrid size={15} /> },
            ...modules.filter((mod) => mod.status === 'ACTIF').map((mod) => ({
              id: mod.id, nom: mod.nom as string | null, label: mod.nom, count: countByModule(mod.nom), icon: <FiFolder size={15} />,
            })),
          ].map((item) => {
            const isActive = selectedModule === item.nom;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedModule(isActive && item.nom ? null : item.nom)}
                className={`relative flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-600" />}
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count > 0 && (
                  <span className={`shrink-0 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── CONTENU PRINCIPAL ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-8 pt-7">

        {/* Header */}
        <div className="shrink-0 mb-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Dossiers communs</p>
              <h1 className="text-2xl font-semibold text-slate-900">{selectedModule ?? 'Tous les dossiers'}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {meta.total} dossier{meta.total !== 1 ? 's' : ''}
                {selectedModule ? ` dans le module ${selectedModule}` : ' au total'}
              </p>
            </div>
            <Button icon={<FiPlus size={16} />} onClick={() => navigate('/dossiers-communs/nouveau')}>
              Nouveau dossier
            </Button>
          </div>

          {/* ── Barre d'outils ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Recherche */}
            <div className="relative flex-1 max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Rechercher un dossier…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ── Bouton FILTRE ── */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setOpenFilter((p) => !p); setOpenSort(false); }}
                className={toolbarBtn(openFilter || activeFilterCount > 0)}
              >
                <FiFilter size={14} />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-semibold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <FiChevronDown size={13} className={`text-slate-400 transition-transform ${openFilter ? 'rotate-180' : ''}`} />
              </button>

              {openFilter && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Filtres</p>
                    {activeFilterCount > 0 && (
                      <button onClick={resetFilters} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Statut</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'CREER', label: 'Ouvert' },
                          { value: 'ANNULER', label: 'Annulé' },
                        ].map(({ value, label }) => {
                          const on = filters.statuts.includes(value);
                          return (
                            <button
                              key={value}
                              onClick={() => toggleStatut(value)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                on ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {on && <FiCheck size={12} />}
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Client facturé</p>
                      <select
                        value={filters.clientFacture}
                        onChange={(e) => setFilters((p) => ({ ...p, clientFacture: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">Tous les clients</option>
                        {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Créé par</p>
                      <select
                        value={filters.creePar}
                        onChange={(e) => setFilters((p) => ({ ...p, creePar: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">Tous les utilisateurs</option>
                        {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Date de création</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          aria-label="Du"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                          className={selectClass}
                        />
                        <input
                          type="date"
                          aria-label="Au"
                          value={filters.dateTo}
                          onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                          className={selectClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Bouton TRI ── */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setOpenSort((p) => !p); setOpenFilter(false); }}
                className={toolbarBtn(openSort || !!sortField)}
              >
                {sortField && sortDir === 'desc' ? <FiArrowDown size={14} /> : <FiArrowUp size={14} />}
                {sortField ? `Tri : ${sortField === 'date' ? 'Date' : 'Statut'}` : 'Trier'}
                <FiChevronDown size={13} className={`text-slate-400 transition-transform ${openSort ? 'rotate-180' : ''}`} />
              </button>

              {openSort && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Trier par</p>
                  {[
                    { field: 'date'   as SortField, label: 'Date de création' },
                    { field: 'status' as SortField, label: 'Statut'           },
                  ].map(({ field, label }) => (
                    <button
                      key={field!}
                      onClick={() => handleSort(field)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        sortField === field ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{label}</span>
                      {sortField === field && (
                        <span className="flex items-center gap-1 text-xs">
                          {sortDir === 'asc' ? <><FiArrowUp size={12} /> Croissant</> : <><FiArrowDown size={12} /> Décroissant</>}
                        </span>
                      )}
                    </button>
                  ))}
                  {sortField && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={() => { setSortField(null); setOpenSort(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <FiX size={13} /> Retirer le tri
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actualiser */}
            <button
              onClick={loadList}
              disabled={loadingDossiers}
              title="Actualiser"
              aria-label="Actualiser"
              className="p-2.5 text-slate-500 bg-white border border-slate-300 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={14} />
            </button>
          </div>

          {/* ── Chips filtres actifs ─────────────────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {filters.statuts.map((s) => chip(s === 'CREER' ? 'Ouvert' : 'Annulé', () => toggleStatut(s), s))}
              {filters.clientFacture && chip(filters.clientFacture, () => setFilters((p) => ({ ...p, clientFacture: '' })))}
              {filters.creePar && chip(`Créé par ${filters.creePar}`, () => setFilters((p) => ({ ...p, creePar: '' })))}
              {(filters.dateFrom || filters.dateTo) &&
                chip(`${filters.dateFrom ? fmtDate(filters.dateFrom) : '…'} → ${filters.dateTo ? fmtDate(filters.dateTo) : '…'}`,
                  () => setFilters((p) => ({ ...p, dateFrom: '', dateTo: '' })))}
              <button onClick={resetFilters} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 ml-1">
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* ── Tableau ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col mb-6">
          <div className="overflow-auto flex-1">
            <table className="min-w-full">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  {COLUMNS.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDossiers ? (
                  <SkeletonTableRows columns={COLUMNS.length} />
                ) : processedDossiers.map((dossier) => {
                  const colabs = dossier.dossierCommunColab?.filter((c) => c.status === 'CREER') ?? [];
                  const isCancelled = dossier.status === 'ANNULER';
                  return (
                    <tr
                      key={dossier.id}
                      onClick={async () => { await dispatch(setCurrentClientFactureId(dossier)); navigate('/dossiers-communs/dossier-detail'); }}
                      className="hover:bg-slate-50 transition-colors cursor-pointer align-top"
                    >
                      {/* Dossier */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-semibold text-slate-900">{dossier.numero}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {dossier.referenceTravelPlaner ? `Réf. TP ${dossier.referenceTravelPlaner}` : 'Sans réf. TP'}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{dossier.clientfacture?.libelle || 'Non défini'}</p>
                        {(dossier.contactPrincipal || dossier.whatsapp) && (
                          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                            {[dossier.contactPrincipal, dossier.whatsapp].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm text-slate-600 truncate" title={dossier.description || undefined}>
                          {dossier.description || <span className="text-slate-300">—</span>}
                        </p>
                      </td>

                      {/* Modules */}
                      <td className="px-4 py-3">
                        {colabs.length === 0 ? (
                          <span className="text-slate-300 text-sm">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {colabs.map((c, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  c.module?.nom === selectedModule
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {c.module?.nom}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={dossier.status === 'CREER' ? 'success' : isCancelled ? 'danger' : 'neutral'}>
                          {dossier.status === 'CREER' ? 'Ouvert' : isCancelled ? 'Annulé' : dossier.status}
                        </StatusBadge>
                        {isCancelled && (dossier.dateAnnulation || dossier.raisonAnnulation) && (
                          <p className="text-xs text-slate-500 mt-1 max-w-[180px] truncate" title={dossier.raisonAnnulation || undefined}>
                            {fmtDate(dossier.dateAnnulation)}
                            {dossier.raisonAnnulation ? ` · ${dossier.raisonAnnulation}` : ''}
                          </p>
                        )}
                      </td>

                      {/* Création */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-slate-700">{fmtDate(dossier.createdAt)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{dossier.user?.prenom} {dossier.user?.nom}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loadingDossiers && processedDossiers.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <FiFolder size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">Aucun dossier trouvé</p>
                <p className="text-sm text-slate-500 mt-1">
                  {activeFilterCount > 0 || searchTerm
                    ? 'Modifiez la recherche ou les filtres.'
                    : 'Créez votre premier dossier commun pour commencer.'}
                </p>
              </div>
            )}
          </div>

          <Pagination
            meta={meta}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            itemLabel="dossier"
          />
        </div>
      </div>
    </div>
  );
}

export default DossierCommun;
