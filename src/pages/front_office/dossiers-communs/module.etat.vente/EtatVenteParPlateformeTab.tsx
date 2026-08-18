import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiRefreshCw, FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  fetchEtatVenteParPlateforme,
  type PlateformeStat,
  type PlateformeReservation,
} from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import Pagination from '../../../../components/Pagination';

// Statuts connus des réservations hôtel (le backend ne renvoie plus la liste complète
// des réservations par plateforme une fois paginé — impossible de la déduire des données
// affichées, donc on fixe la liste des valeurs possibles).
const STATUTS_RESERVATION = ['FAIT', 'CLOTURER', 'CREER'];

const useAppDispatch = () => useDispatch<AppDispatch>();

const PLATFORM_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6'];
const STATUT_COLORS: Record<string, string> = {
  FAIT: '#94A3B8',
  CLOTURER: '#10B981',
  CREER: '#F59E0B',
};
const statutColor = (s: string) => STATUT_COLORS[s] || '#CBD5E1';

const formatMoney = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v || 0) + ' Ar';

const formatDevise = (v: number, devise: string) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(v || 0) + ' ' + devise;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR');

// ─── Donut chart (répartition réservations par plateforme) ────

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; centerLabel: string }> = ({
  data,
  centerLabel,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const stops = data.map((d) => {
    const start = (acc / total) * 360;
    acc += d.value;
    const end = (acc / total) * 360;
    return `${d.color} ${start}deg ${end}deg`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0"
        style={{ background: total > 0 ? gradient : '#E5E7EB' }}
      >
        <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-lg font-black text-gray-800">{total}</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-gray-600 font-medium">{d.label}</span>
            <span className="text-gray-400">
              {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Barres horizontales comparatives (résa / confirmation / commission) ─

const ComparisonBars: React.FC<{
  data: { label: string; resa: number; confirmation: number; commission: number; color: string }[];
}> = ({ data }) => {
  const max = Math.max(...data.flatMap((d) => [d.resa, d.confirmation, d.commission]), 1);

  const Row = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[10px] text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="w-28 text-[10px] text-right font-mono text-gray-500 shrink-0">{formatMoney(value)}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => (
        <div key={d.label} className="space-y-1.5">
          <p className="text-xs font-bold text-gray-700">{d.label}</p>
          <Row value={d.resa} color={d.color} label="Résa" />
          <Row value={d.confirmation} color={d.color + '99'} label="Confirmation" />
          <Row value={d.commission} color="#94A3B8" label="Commission" />
        </div>
      ))}
    </div>
  );
};

// ─── Barre empilée par statut ──────────────────────────────────

const StatutStackedBar: React.FC<{ plateforme: PlateformeStat }> = ({ plateforme }) => {
  const counts = plateforme.reservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1;
    return acc;
  }, {});
  const total = plateforme.reservations.length || 1;
  const entries = Object.entries(counts);

  return (
    <div className="space-y-1">
      <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-100">
        {entries.map(([statut, count]) => (
          <div
            key={statut}
            style={{ width: `${(count / total) * 100}%`, background: statutColor(statut) }}
            title={`${statut}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(([statut, count]) => (
          <span key={statut} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ background: statutColor(statut) }} />
            {statut} ({count})
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Badge statut ───────────────────────────────────────────────

const StatutBadge: React.FC<{ statut: string }> = ({ statut }) => (
  <span
    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
    style={{ background: statutColor(statut) }}
  >
    {statut}
  </span>
);

// ─── Carte résumé plateforme ────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({
  label,
  value,
  sub,
  accent = '#2563EB',
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex-1 min-w-[150px]">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-lg font-black mt-1" style={{ color: accent }}>
      {value}
    </p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Ligne réservation (avec détail dépliable) ──────────────────

const ReservationRow: React.FC<{ r: PlateformeReservation; idx: number }> = ({ r, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
        <td className="px-3 py-2 text-xs text-gray-400">
          <button onClick={() => setOpen((o) => !o)} className="hover:text-indigo-600">
            {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        </td>
        <td className="px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">{r.hotel}</td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.numeroResa || '—'}</td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.fournisseur?.libelle}</td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
          {r.typeChambre?.type} ({r.typeChambre?.capacite}p) ×{r.nombreChambre}
        </td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.ville}, {r.pays}</td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
          {formatDate(r.du)} → {formatDate(r.au)}
        </td>
        <td className="px-3 py-2 text-xs text-center text-gray-500">{r.nuite}</td>
        <td className="px-3 py-2 text-xs text-center">
          <StatutBadge statut={r.statut} />
        </td>
        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.devise}</td>
        <td className="px-3 py-2 text-xs text-right font-mono text-gray-600 whitespace-nowrap">
          {formatMoney(r.puResaMontantAriary)}
        </td>
        <td className="px-3 py-2 text-xs text-center text-gray-500">{r.pourcentageCommission}%</td>
        <td className="px-3 py-2 text-xs text-right font-mono text-gray-600 whitespace-nowrap">
          {formatMoney(r.puConfMontantNuitHotelAriary)}
        </td>
        <td className="px-3 py-2 text-xs text-right font-mono font-bold text-indigo-600 whitespace-nowrap">
          {formatMoney(r.confirmationCommissionAriary)}
        </td>
      </tr>
      {open && (
        <tr className="bg-indigo-50/40">
          <td colSpan={13} className="px-6 py-3 text-[11px] text-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
              <div><span className="text-gray-400">Réf. ligne :</span> {r.referenceLine}</div>
              <div><span className="text-gray-400">Statut ligne :</span> {r.statusLigne}</div>
              <div><span className="text-gray-400">Code fournisseur :</span> {r.fournisseur?.code}</div>
              <div><span className="text-gray-400">PU nuit (devise) :</span> {formatDevise(r.puResaNuiteHotelDevise, r.devise)}</div>
              <div><span className="text-gray-400">PU nuit (Ariary) :</span> {formatMoney(r.puResaNuiteHotelAriary)}</div>
              <div><span className="text-gray-400">Montant résa (devise) :</span> {formatDevise(r.puResaMontantDevise, r.devise)}</div>
              <div><span className="text-gray-400">Taux confirmation :</span> {formatMoney(r.tauxConfirmation)}</div>
              <div><span className="text-gray-400">PU conf. prix/nuit hôtel :</span> {formatMoney(r.puConfPrixNuitHotelAriary)}</div>
              <div><span className="text-gray-400">PU conf. prix/nuit client :</span> {formatMoney(r.puConfPrixNuitClientArary)}</div>
              <div><span className="text-gray-400">Montant conf. nuit client :</span> {formatMoney(r.puConfMontantNuitClientAriary)}</div>
              <div><span className="text-gray-400">Créé le :</span> {formatDateTime(r.createdAt)}</div>
              <div><span className="text-gray-400">ID :</span> <span className="font-mono">{r.id}</span></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Bloc détail d'une plateforme ───────────────────────────────

const PlateformeBlock: React.FC<{
  pf: PlateformeStat;
  color: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}> = ({ pf, color, onPageChange, onLimitChange }) => {
  const [expanded, setExpanded] = useState(true);
  const tauxCommissionMoyen = pf.montantResaAriary > 0 ? (pf.commissionTotaleAriary / pf.montantResaAriary) * 100 : 0;
  const ecartConfirmation = pf.montantResaAriary - pf.montantConfirmationAriary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h3 className="text-sm font-black text-gray-800">{pf.plateforme.nom}</h3>
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-mono">
            {pf.plateforme.code}
          </span>
          <span className="text-[10px] text-gray-400">{pf.nombreReservations} réservation(s)</span>
        </div>
        {expanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* Cartes chiffres clés */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Montant réservé" value={formatMoney(pf.montantResaAriary)} accent={color} />
            <StatCard label="Montant confirmation" value={formatMoney(pf.montantConfirmationAriary)} accent={color} />
            <StatCard label="Commission totale" value={formatMoney(pf.commissionTotaleAriary)} accent="#059669" />
            <StatCard
              label="Taux commission moyen"
              value={`${tauxCommissionMoyen.toFixed(2)}%`}
              sub={`Écart résa/confirmation : ${formatMoney(ecartConfirmation)}`}
              accent="#7C3AED"
            />
          </div>

          {/* Répartition statuts */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Répartition par statut
            </p>
            <StatutStackedBar plateforme={pf} />
          </div>

          {/* Tableau détaillé */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2 w-6"></th>
                  <th className="px-3 py-2">Hôtel</th>
                  <th className="px-3 py-2">N° Résa</th>
                  <th className="px-3 py-2">Fournisseur</th>
                  <th className="px-3 py-2">Chambre</th>
                  <th className="px-3 py-2">Ville / Pays</th>
                  <th className="px-3 py-2">Période</th>
                  <th className="px-3 py-2 text-center">Nuits</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2">Devise</th>
                  <th className="px-3 py-2 text-right">Montant résa</th>
                  <th className="px-3 py-2 text-center">% Comm.</th>
                  <th className="px-3 py-2 text-right">Montant conf.</th>
                  <th className="px-3 py-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {pf.reservations.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-xs text-gray-400">
                      Aucune réservation pour ce filtre
                    </td>
                  </tr>
                ) : (
                  pf.reservations.map((r, idx) => <ReservationRow key={r.id} r={r} idx={idx} />)
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-black text-xs">
                  <td colSpan={10} className="px-3 py-2 text-right text-gray-600">
                    Total {pf.plateforme.nom}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatMoney(pf.montantResaAriary)}</td>
                  <td />
                  <td className="px-3 py-2 text-right font-mono">{formatMoney(pf.montantConfirmationAriary)}</td>
                  <td className="px-3 py-2 text-right font-mono text-indigo-700">
                    {formatMoney(pf.commissionTotaleAriary)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {pf.reservationsMeta && (
            <Pagination
              meta={pf.reservationsMeta}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
              itemLabel="réservation"
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Composant principal de l'onglet ────────────────────────────

const EtatVenteParPlateformeTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { etatVenteParPlateformeResultat, loadingEtatVenteParPlateforme, errorEtatVenteParPlateforme } = useSelector(
    (state: RootState) => state.dashboard
  );

  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2027-06-30');
  const [statut, setStatut] = useState('');
  // Pagination du tableau `reservations` — un seul contrôle piloté depuis n'importe quel
  // groupe de plateforme (le backend n'accepte qu'un couple page/limit par requête ; chaque
  // groupe affiche néanmoins son propre <Pagination> avec son propre `reservationsMeta`,
  // car chaque plateforme a son propre total/totalPages).
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const loadData = (overrides?: { page?: number; limit?: number }) => {
    dispatch(fetchEtatVenteParPlateforme({
      du: dateDebut || undefined,
      au: dateFin || undefined,
      statut: statut || undefined,
      page: overrides?.page ?? page,
      limit: overrides?.limit ?? limit,
    }));
  };

  useEffect(() => {
    loadData({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadData({ page: 1 });
  };

  const handleReset = () => {
    setDateDebut('');
    setDateFin('');
    setStatut('');
    setPage(1);
    dispatch(fetchEtatVenteParPlateforme({ page: 1, limit }));
  };

  const handleGroupPageChange = (newPage: number) => {
    setPage(newPage);
    loadData({ page: newPage });
  };

  const handleGroupLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    loadData({ page: 1, limit: newLimit });
  };

  // Groupes tels que renvoyés par le backend — les agrégats (nombreReservations, montants)
  // sont calculés côté serveur sur toute la période, jamais recalculés ici à partir du
  // tableau `reservations` (qui n'est qu'une page).
  const plateformes: PlateformeStat[] = useMemo(
    () => etatVenteParPlateformeResultat?.plateformes || [],
    [etatVenteParPlateformeResultat]
  );

  const totalGlobal = useMemo(
    () => ({
      reservations: plateformes.reduce((s, p) => s + p.nombreReservations, 0),
      montantResa: plateformes.reduce((s, p) => s + p.montantResaAriary, 0),
      montantConfirmation: plateformes.reduce((s, p) => s + p.montantConfirmationAriary, 0),
      commission: plateformes.reduce((s, p) => s + p.commissionTotaleAriary, 0),
    }),
    [plateformes]
  );

  const donutData = plateformes.map((p, i) => ({
    label: p.plateforme.nom,
    value: p.nombreReservations,
    color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
  }));

  const comparisonData = plateformes.map((p, i) => ({
    label: p.plateforme.nom,
    resa: p.montantResaAriary,
    confirmation: p.montantConfirmationAriary,
    commission: p.commissionTotaleAriary,
    color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* ── Filtres ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-0.5 min-w-[150px]">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-[150px]">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-[160px]">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
            >
              <option value="">Tous les statuts</option>
              {STATUTS_RESERVATION.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
            >
              <FiX size={13} /> Réinitialiser
            </button>
            <button
              onClick={handleSearch}
              disabled={loadingEtatVenteParPlateforme}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              {loadingEtatVenteParPlateforme ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSearch size={13} />}
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {errorEtatVenteParPlateforme && <p className="text-sm text-red-500">{errorEtatVenteParPlateforme}</p>}

      {loadingEtatVenteParPlateforme && (
        <div className="py-20 text-center text-sm text-gray-400">Chargement…</div>
      )}

      {!loadingEtatVenteParPlateforme && etatVenteParPlateformeResultat && (
        <>
          {/* ── Cartes totaux globaux ── */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total réservations" value={String(totalGlobal.reservations)} accent="#111827" />
            <StatCard label="Montant réservé (total)" value={formatMoney(totalGlobal.montantResa)} accent="#2563EB" />
            <StatCard label="Montant confirmation (total)" value={formatMoney(totalGlobal.montantConfirmation)} accent="#0EA5E9" />
            <StatCard label="Commission totale" value={formatMoney(totalGlobal.commission)} accent="#059669" />
          </div>

          {/* ── Graphiques ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-black text-gray-700 mb-4">Répartition des réservations par plateforme</p>
              <DonutChart data={donutData} centerLabel="résa" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-black text-gray-700 mb-4">Montants par plateforme (résa / confirmation / commission)</p>
              <ComparisonBars data={comparisonData} />
            </div>
          </div>

          {/* ── Détail par plateforme ── */}
          <div className="space-y-4">
            {plateformes.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
                Aucune donnée pour ce filtre
              </div>
            ) : (
              plateformes.map((pf, i) => (
                <PlateformeBlock
                  key={pf.plateforme.id}
                  pf={pf}
                  color={PLATFORM_COLORS[i % PLATFORM_COLORS.length]}
                  onPageChange={handleGroupPageChange}
                  onLimitChange={handleGroupLimitChange}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EtatVenteParPlateformeTab;