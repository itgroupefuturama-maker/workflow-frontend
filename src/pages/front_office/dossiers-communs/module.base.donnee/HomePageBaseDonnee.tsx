import React, { useEffect, useState } from 'react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchClientBeneficiaires } from '../../../../app/back_office/clientBeneficiairesSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ITEMS_PER_PAGE = 7;

const HomePageBaseDonnee = () => {
  const dispatch     = useAppDispatch();
  const navigate     = useNavigate();
  const { data: beneficiaires, loading } = useSelector((state: RootState) => state.clientBeneficiaires);

  const [search,      setSearch]      = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter,  setShowFilter]  = useState(false);

  useEffect(() => { dispatch(fetchClientBeneficiaires()); }, [dispatch]);

  const filtered = beneficiaires.filter(c => {
    const matchSearch = !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.libelle.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleFilter = (v: string) => { setFilterStatut(v); setCurrentPage(1); setShowFilter(false); };

  const statuts = ['ACTIF', 'INACTIF'];

  const pageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="h-full min-h-0 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">Base de données</h1>
              <p className="text-xs text-gray-400">Gestion des dossiers clients bénéficiaires</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-4">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4">

          {/* Gauche : filtres */}
          <div className="flex items-center gap-2">

            {/* Filtre statut */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(p => !p)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                  filterStatut
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
                </svg>
                {filterStatut || 'Statut'}
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`transition-transform ${showFilter ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFilter && (
                <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => handleFilter('')}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left hover:bg-gray-50 transition ${!filterStatut ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                  >
                    Tous
                    {!filterStatut && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-auto text-indigo-600">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  {statuts.map(s => (
                    <button
                      key={s}
                      onClick={() => handleFilter(s)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left hover:bg-gray-50 transition ${filterStatut === s ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {s}
                      {filterStatut === s && (
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-auto text-indigo-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filterStatut && (
              <button
                onClick={() => handleFilter('')}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Effacer
              </button>
            )}
          </div>

          {/* Droite : search */}
          <div className="relative">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder:text-gray-300"
            />
            {/* Raccourci clavier décoratif */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-mono pointer-events-none">⌘K</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="h-[calc(70vh)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-indigo-600 rounded" />
                </th>
                {[
                  { label: 'Code bénéficiaire', icon: true },
                  { label: 'Libellé bénéficiaire', icon: true },
                  { label: 'Type Client' },
                  { label: 'Code facturé' },
                  { label: 'Libellé facturé' },
                  { label: 'Date application', icon: true },
                  { label: '' },
                ].map(({ label, icon }) => (
                  <th key={label} className="px-5 py-3.5 text-left">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {label}
                      {icon && label && (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-400">
                    <div className="flex justify-center">
                      <svg className="animate-spin w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-400 italic">
                    Aucun résultat.
                  </td>
                </tr>
              ) : paginated.map((client, idx) => (
                <tr
                  key={client.id}
                  className={`group hover:bg-indigo-50/40 transition-colors cursor-pointer ${idx !== paginated.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-indigo-600 rounded" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                      {client.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {client.libelle?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{client.libelle}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-gray-800">{client.typeClient}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {client.factures.length === 0
                        ? <span className="text-xs text-gray-300 italic">—</span>
                        : client.factures.map(f => (
                          <span key={f.clientFacture.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {f.clientFacture.code}
                          </span>
                        ))
                      }
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {client.factures.length === 0
                        ? <span className="text-xs text-gray-300 italic">—</span>
                        : client.factures.map(f => (
                          <span key={f.clientFacture.id} className="text-sm text-gray-600">
                            {f.clientFacture.libelle}
                          </span>
                        ))
                      }
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(client.dateApplication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => navigate(`/dossiers-communs/base-donnee/details/${client.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition"
                    >
                      Voir le détail
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {currentPage} sur {totalPages} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-1">
            {/* Précédent */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Pages */}
            {pageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white border border-indigo-600'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Suivant */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Items par page */}
            <span className="ml-2 text-xs text-gray-400">{ITEMS_PER_PAGE} / page</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePageBaseDonnee;