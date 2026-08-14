import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvolutionByYear } from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import type { ModuleEvolution, MoisEvolution } from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import type { AppDispatch, RootState } from '../../../../app/store';
import { FiArrowLeft } from 'react-icons/fi';
import { LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Filler, Tooltip, Legend
);

// ─── Constantes ───────────────────────────────────────────────

const MOIS_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

const MODULE_COLORS: Record<string, string> = {
  ticketing:   '#3B82F6',
  hotel:       '#10B981',
  visa:        '#F59E0B',
  assurance:   '#8B5CF6',
  attestation: '#EF4444',
};

const getModuleColor = (name: string) =>
  MODULE_COLORS[name.toLowerCase()] ?? '#6B7280';

// Couleur de l'année de référence + palette pour les années de comparaison (max 4)
const REFERENCE_YEAR_COLOR = '#3B82F6';
const COMPARISON_YEAR_COLORS = ['#9CA3AF', '#F59E0B', '#10B981', '#8B5CF6'];
const MAX_COMPARISON_YEARS = 4;

// Repli stable (redux-persist peut restaurer un state antérieur à l'ajout de ces champs).
const EMPTY_EVOLUTION_BY_YEAR: Record<number, MoisEvolution[]> = {};
const EMPTY_LOADING_YEARS: Record<number, boolean> = {};
const EMPTY_ERROR_YEARS: Record<number, string | null> = {};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'MGA', maximumFractionDigits: 0,
  }).format(value);

const TABS = [
  { id: 'dossiers',  label: 'Dossiers' },
  { id: 'financier', label: 'CA / Commission / Engagement' },
  { id: 'ca_detail', label: 'CA par Prestation' },
  { id: 'fc_detail', label: 'Engagement par Prestation' },
];

// ─── Options Chart.js ─────────────────────────────────────────

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 0 },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 } },
    },
  },
};

const moneyOptions = {
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: (ctx: any) =>
          `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`,
      },
    },
  },
};

const financierMonthOptions = {
  ...moneyOptions,
  indexAxis: 'y' as const,
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { size: 11 },
        callback: (v: any) => {
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
          return v;
        },
      },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 } },
    },
  },
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: { font: { size: 12 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          `${ctx.label}: ${ctx.parsed} dossier${ctx.parsed > 1 ? 's' : ''}`,
      },
    },
  },
};

const donutMoneyOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: { font: { size: 12 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          `${ctx.label}: ${formatMoney(Number(ctx.raw))}`,
      },
    },
  },
};

// ─── Sous-composants ──────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  colorHex: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, colorHex }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-semibold truncate" style={{ color: colorHex }}>{value}</p>
    <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
  </div>
);

interface LegendItemProps { color: string; label: string; dashed?: boolean; }
const LegendItem: React.FC<LegendItemProps> = ({ color, label, dashed }) => (
  <span className="flex items-center gap-1.5 text-xs text-gray-500">
    <span
      className="inline-block w-2.5 h-2.5 rounded-sm"
      style={{
        background: color,
        border: dashed ? `1px dashed ${color}` : undefined,
      }}
    />
    {label}
  </span>
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}
const ChartCard: React.FC<ChartCardProps> = ({
  title, subtitle, legend, children, height = 260,
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5">
    <div className="mb-3">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {legend && <div className="flex flex-wrap gap-3 mb-3">{legend}</div>}
    <div style={{ position: 'relative', height }}>
      {children}
    </div>
  </div>
);

// ─── COMPOSANT FILTRAGE : ANNÉES + PLAGE DE MOIS ───────────────

interface YearFilterProps {
  referenceYear: number;
  referenceYearOptions: number[];
  onReferenceYearChange: (year: number) => void;
  comparisonYears: number[];
  comparisonYearOptions: number[];
  onToggleComparisonYear: (year: number) => void;
  customStart: number;
  customEnd: number;
  onCustomRangeChange: (start: number, end: number) => void;
}

const YearFilter: React.FC<YearFilterProps> = ({
  referenceYear,
  referenceYearOptions,
  onReferenceYearChange,
  comparisonYears,
  comparisonYearOptions,
  onToggleComparisonYear,
  customStart,
  customEnd,
  onCustomRangeChange,
}) => {
  const pillBase = "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors border";
  const pillActive   = "bg-indigo-600 text-white border-indigo-600";
  const pillInactive = "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200";
  const pillDisabled = "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed";

  const comparisonLimitReached = comparisonYears.length >= MAX_COMPARISON_YEARS;

  // Le mois de début prend toujours le 1er jour, le mois de fin son dernier jour
  // (28/29/30/31 selon le mois et l'année de référence, pour gérer les années bissextiles).
  const getLastDayOfMonth = (monthIndex: number) => new Date(referenceYear, monthIndex + 1, 0).getDate();
  const lastDayEnd = getLastDayOfMonth(customEnd);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
      {/* SECTION 1 : Année de référence */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Année de référence
        </p>
        <select
          value={referenceYear}
          onChange={(e) => onReferenceYearChange(parseInt(e.target.value, 10))}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {referenceYearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* SECTION 2 : Années de comparaison */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Années à comparer (jusqu'à {MAX_COMPARISON_YEARS})
        </p>
        <p className="text-[11px] text-gray-400 mb-3">
          Uniquement des années antérieures à {referenceYear}. {comparisonYears.length}/{MAX_COMPARISON_YEARS} sélectionnée(s).
        </p>
        <div className="flex gap-2 flex-wrap">
          {comparisonYearOptions.map((y) => {
            const active = comparisonYears.includes(y);
            const disabled = !active && comparisonLimitReached;
            return (
              <button
                key={y}
                type="button"
                disabled={disabled}
                onClick={() => onToggleComparisonYear(y)}
                className={`${pillBase} ${active ? pillActive : disabled ? pillDisabled : pillInactive}`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 : Plage de mois */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Plage de mois
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Mois de début
            </label>
            <select
              value={customStart}
              onChange={(e) => onCustomRangeChange(parseInt(e.target.value, 10), customEnd)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {MOIS_LABELS.map((label, index) => (
                <option key={index} value={index}>{label} (jour 1)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Mois de fin
            </label>
            <select
              value={customEnd}
              onChange={(e) => onCustomRangeChange(customStart, parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {MOIS_LABELS.map((label, index) => (
                <option key={index} value={index}>{label} (jour {getLastDayOfMonth(index)})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg max-w-md">
          <p className="text-xs text-indigo-700 font-medium">
            📅 Période retenue : du 1 {MOIS_LABELS[customStart]} au {lastDayEnd} {MOIS_LABELS[customEnd]} (base {referenceYear})
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────

const PageTableauBord: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dossiers');

  const currentYearActual  = new Date().getFullYear();
  const currentMonthActual = new Date().getMonth();

  const [referenceYear, setReferenceYear] = useState<number>(currentYearActual);
  const [comparisonYears, setComparisonYears] = useState<number[]>([currentYearActual - 1]);
  const [customStart, setCustomStart] = useState<number>(0);
  const [customEnd, setCustomEnd] = useState<number>(
    currentYearActual === referenceYear ? currentMonthActual : 11
  );

  const referenceYearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => currentYearActual - i),
    [currentYearActual]
  );
  const comparisonYearOptions = useMemo(
    () => Array.from({ length: 15 }, (_, i) => referenceYear - 1 - i),
    [referenceYear]
  );

  // Empêche qu'une année de comparaison devienne >= à l'année de référence
  const handleReferenceYearChange = (year: number) => {
    setReferenceYear(year);
    setComparisonYears((prev) => prev.filter((y) => y < year));
  };

  const handleToggleComparisonYear = (year: number) => {
    setComparisonYears((prev) => {
      if (prev.includes(year)) return prev.filter((y) => y !== year);
      if (prev.length >= MAX_COMPARISON_YEARS) return prev;
      return [...prev, year];
    });
  };

  const {
    evolutionByYear: evolutionByYearRaw,
    loadingYears: loadingYearsRaw,
    errorYears: errorYearsRaw,
  } = useSelector((state: RootState) => state.dashboard);
  const evolutionByYear = evolutionByYearRaw ?? EMPTY_EVOLUTION_BY_YEAR;
  const loadingYears = loadingYearsRaw ?? EMPTY_LOADING_YEARS;
  const errorYears = errorYearsRaw ?? EMPTY_ERROR_YEARS;

  // Années effectivement affichées : référence en tête, puis comparaisons triées (plus récente d'abord)
  const sortedYears = useMemo(() => {
    const comps = [...comparisonYears].sort((a, b) => b - a);
    return [referenceYear, ...comps];
  }, [referenceYear, comparisonYears]);

  useEffect(() => {
    sortedYears.forEach((y) => {
      if (!evolutionByYear[y] && !loadingYears[y]) {
        dispatch(fetchEvolutionByYear(y));
      }
    });
  }, [dispatch, sortedYears, evolutionByYear, loadingYears]);

  const getYearColor = (year: number) => {
    if (year === referenceYear) return REFERENCE_YEAR_COLOR;
    const idx = comparisonYears.slice().sort((a, b) => b - a).indexOf(year);
    return COMPARISON_YEAR_COLORS[idx % COMPARISON_YEAR_COLORS.length];
  };

  const isLoading = sortedYears.some((y) => loadingYears[y] || (!evolutionByYear[y] && !errorYears[y]));
  const hasError  = sortedYears.some((y) => errorYears[y]);
  const errorMessage = sortedYears.map((y) => errorYears[y]).find(Boolean) ?? null;

  const filteredLabels = MOIS_LABELS.slice(customStart, customEnd + 1);
  const moisLabel = MOIS_LABELS[customEnd];

  const getFilteredForYear = (y: number) =>
    (evolutionByYear[y] ?? []).slice(customStart, customEnd + 1);
  const getMonthDataForYear = (y: number) => (evolutionByYear[y] ?? [])[customEnd];

  const cumul = (arr: number[]) => {
    let s = 0;
    return arr.map((v) => (s += v));
  };

  // ── Section Dossiers ──
  const dossiersByYear = sortedYears.map((y) => {
    const monthly = getFilteredForYear(y).map((m) => m.dossiers);
    return {
      year: y,
      color: getYearColor(y),
      monthly,
      cumulative: cumul(monthly),
      total: monthly.reduce((a, b) => a + b, 0),
      month: getMonthDataForYear(y)?.dossiers ?? 0,
    };
  });

  const dossierBarData = {
    labels: filteredLabels,
    datasets: dossiersByYear.map((d) => ({
      label: `${d.year}`,
      data: d.monthly,
      backgroundColor: d.color,
      borderRadius: 4,
      borderSkipped: false as const,
    })),
  };

  const dossierLineData = {
    labels: filteredLabels,
    datasets: dossiersByYear.map((d) => ({
      label: `${d.year}`,
      data: d.cumulative,
      borderColor: d.color,
      backgroundColor: hexToRgba(d.color, d.year === referenceYear ? 0.08 : 0),
      fill: d.year === referenceYear,
      tension: 0.4,
      pointRadius: d.year === referenceYear ? 3 : 2,
      pointBackgroundColor: d.color,
      borderDash: d.year === referenceYear ? undefined : [5, 4] as [number, number],
    })),
  };

  // ── Modules du mois sélectionné, par année ──
  const modulesByYearMonth: Record<number, ModuleEvolution[]> = {};
  sortedYears.forEach((y) => {
    modulesByYearMonth[y] = getMonthDataForYear(y)?.modules ?? [];
  });

  const moduleNamesMonth = Array.from(
    new Set(sortedYears.flatMap((y) => modulesByYearMonth[y].map((m) => m.moduleName)))
  );

  const buildDonutDataForYear = (y: number, field: 'nombreDossiers' | 'chiffreAffaire' | 'engagementFournisseur') => ({
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesByYearMonth[y].find((m) => m.moduleName === name)?.[field] ?? 0
      ),
      backgroundColor: moduleNamesMonth.map(getModuleColor),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  });

  // ── Section Financier ──
  const financierByYear = sortedYears.map((y) => {
    const data = getFilteredForYear(y);
    const ca   = data.map((m) => m.ca);
    const fc   = data.map((m) => m.fc);
    const comm = data.map((m) => m.commission);
    return {
      year: y,
      color: getYearColor(y),
      ca, fc, comm,
      totalCA:   ca.reduce((a, b) => a + b, 0),
      totalFC:   fc.reduce((a, b) => a + b, 0),
      totalComm: comm.reduce((a, b) => a + b, 0),
      monthCA:   getMonthDataForYear(y)?.ca ?? 0,
      monthFC:   getMonthDataForYear(y)?.fc ?? 0,
      monthComm: getMonthDataForYear(y)?.commission ?? 0,
    };
  });

  const referenceFinancier = financierByYear.find((f) => f.year === referenceYear)!;

  // Barres groupées : composition CA/Engagement/Commission de l'année de référence
  const financierBarData = {
    labels: filteredLabels,
    datasets: [
      { label: 'CA',         data: referenceFinancier.ca,   backgroundColor: '#3B82F6', borderRadius: 3, borderSkipped: false as const },
      { label: 'Engagement', data: referenceFinancier.fc,   backgroundColor: '#F97316', borderRadius: 3, borderSkipped: false as const },
      { label: 'Commission', data: referenceFinancier.comm, backgroundColor: '#10B981', borderRadius: 3, borderSkipped: false as const },
    ],
  };

  // Courbe CA superposée sur toutes les années sélectionnées
  const caLineData = {
    labels: filteredLabels,
    datasets: financierByYear.map((f) => ({
      label: `CA ${f.year}`,
      data: f.ca,
      borderColor: f.color,
      backgroundColor: hexToRgba(f.color, f.year === referenceYear ? 0.1 : 0.07),
      fill: true,
      tension: 0.4,
      pointRadius: f.year === referenceYear ? 4 : 3,
      pointBackgroundColor: f.color,
      borderDash: f.year === referenceYear ? undefined : [6, 4] as [number, number],
    })),
  };

  const buildMonthlyMetricBarData = (field: 'chiffreAffaire' | 'engagementFournisseur' | 'commission') => ({
    labels: moduleNamesMonth,
    datasets: sortedYears.map((y) => ({
      label: `${y}`,
      data: moduleNamesMonth.map((name) =>
        modulesByYearMonth[y].find((m) => m.moduleName === name)?.[field] ?? 0
      ),
      backgroundColor: getYearColor(y),
      borderRadius: 4,
      borderSkipped: false as const,
    })),
  });

  // ── Sections CA / Engagement par module (annuel, empilé) ──
  const allModuleNames = Array.from(
    new Set(sortedYears.flatMap((y) => getFilteredForYear(y).flatMap((m) => m.modules.map((mod) => mod.moduleName))))
  );

  const buildStackedDataForYear = (
    y: number,
    field: 'chiffreAffaire' | 'engagementFournisseur',
  ) => ({
    labels: filteredLabels,
    datasets: allModuleNames.map((name) => ({
      label: name,
      data: getFilteredForYear(y).map((m) => {
        const mod = m.modules.find((mod) => mod.moduleName === name);
        return mod ? mod[field] : 0;
      }),
      backgroundColor: getModuleColor(name),
      stack: 'a',
      borderSkipped: false as const,
    })),
  });

  const caModuleTotalsByYear = sortedYears.map((y) => ({
    year: y,
    color: getYearColor(y),
    total: getFilteredForYear(y).reduce((s, m) => s + m.ca, 0),
    month: getMonthDataForYear(y)?.ca ?? 0,
  }));

  const fcModuleTotalsByYear = sortedYears.map((y) => ({
    year: y,
    color: getYearColor(y),
    total: getFilteredForYear(y).reduce((s, m) => s + m.fc, 0),
    month: getMonthDataForYear(y)?.fc ?? 0,
  }));

  // Évolution vs référence uniquement pertinente quand une seule année de comparaison est active
  const singleComparisonYear = comparisonYears.length === 1 ? comparisonYears[0] : null;

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4 bg-white">

      {/* HEADER */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-indigo-600" size={20} />
            Dashboard
          </h2>
          <p className="text-sm text-gray-400 italic">Vue d'ensemble des performances</p>
        </div>
      </div>

      {/* FILTRAGE ANNÉES + PLAGE DE MOIS */}
      <YearFilter
        referenceYear={referenceYear}
        referenceYearOptions={referenceYearOptions}
        onReferenceYearChange={handleReferenceYearChange}
        comparisonYears={comparisonYears}
        comparisonYearOptions={comparisonYearOptions}
        onToggleComparisonYear={handleToggleComparisonYear}
        customStart={customStart}
        customEnd={customEnd}
        onCustomRangeChange={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
        }}
      />

      {/* TABS */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-gray-400 animate-pulse pt-4">Chargement des données...</p>
      )}
      {!isLoading && hasError && (
        <p className="text-sm text-red-500 pt-4">{errorMessage}</p>
      )}

      {!isLoading && !hasError && (
        <div className="space-y-5">

          {/* ══ DOSSIERS ══ */}
          {activeTab === 'dossiers' && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {dossiersByYear.map((d) => (
                  <KpiCard
                    key={d.year}
                    label={`Total ${d.year}`}
                    value={d.total.toString()}
                    sub="dossiers"
                    colorHex={d.color}
                  />
                ))}
                <KpiCard
                  label={`${moisLabel} ${referenceYear}`}
                  value={(dossiersByYear.find((d) => d.year === referenceYear)?.month ?? 0).toString()}
                  sub="dossiers ce mois"
                  colorHex={REFERENCE_YEAR_COLOR}
                />
              </div>

              {/* Graphes annuels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title="Dossiers mensuels — comparaison par année"
                  legend={dossiersByYear.map((d) => (
                    <LegendItem key={d.year} color={d.color} label={`${d.year}`} />
                  ))}
                >
                  <Bar data={dossierBarData} options={baseOptions} />
                </ChartCard>

                <ChartCard
                  title="Cumul dossiers — tendance"
                  legend={dossiersByYear.map((d) => (
                    <LegendItem key={d.year} color={d.color} label={`${d.year}`} dashed={d.year !== referenceYear} />
                  ))}
                >
                  <Line data={dossierLineData} options={baseOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois sélectionné par module ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail par prestation — {moisLabel}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedYears.map((y) => (
                    <ChartCard
                      key={y}
                      title={`Dossiers par module — ${moisLabel} ${y}`}
                      subtitle={`${modulesByYearMonth[y].reduce((s, m) => s + m.nombreDossiers, 0)} dossiers au total ce mois`}
                      legend={moduleNamesMonth.map((name) => (
                        <LegendItem key={name} color={getModuleColor(name)} label={name} />
                      ))}
                      height={240}
                    >
                      <Doughnut data={buildDonutDataForYear(y, 'nombreDossiers')} options={donutOptions} />
                    </ChartCard>
                  ))}
                </div>

                {/* Tableau récap par module */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        {sortedYears.map((y) => (
                          <th key={y} className="text-right px-4 py-3 font-medium whitespace-nowrap">Dossiers {y}</th>
                        ))}
                        {singleComparisonYear !== null && (
                          <th className="text-right px-4 py-3 font-medium">Évolution</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesByYearMonth[referenceYear]?.find((m) => m.moduleName === name)?.nombreDossiers ?? 0;
                        const prev = singleComparisonYear !== null
                          ? modulesByYearMonth[singleComparisonYear]?.find((m) => m.moduleName === name)?.nombreDossiers ?? 0
                          : 0;
                        const diff = curr - prev;
                        const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                style={{ background: getModuleColor(name) }}
                              />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            {sortedYears.map((y) => (
                              <td key={y} className="px-4 py-3 text-right text-gray-700">
                                {modulesByYearMonth[y]?.find((m) => m.moduleName === name)?.nombreDossiers ?? 0}
                              </td>
                            ))}
                            {singleComparisonYear !== null && (
                              <td className="px-4 py-3 text-right">
                                {prev > 0 ? (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    diff >= 0
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : 'bg-red-50 text-red-500'
                                  }`}>
                                    {diff >= 0 ? '+' : ''}{pct}%
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ FINANCIER ══ */}
          {activeTab === 'financier' && (
            <>
              {financierByYear.map((f) => (
                <div key={f.year}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{f.year}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <KpiCard label="CA total"          value={formatMoney(f.totalCA)}   sub={`période ${f.year}`} colorHex={f.color} />
                    <KpiCard label="Engagement total"  value={formatMoney(f.totalFC)}   sub={`période ${f.year}`} colorHex={f.color} />
                    <KpiCard label="Commission totale" value={formatMoney(f.totalComm)} sub={`période ${f.year}`} colorHex={f.color} />
                  </div>
                </div>
              ))}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-1">
                  {moisLabel} {referenceYear}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <KpiCard label="CA du mois"          value={formatMoney(referenceFinancier.monthCA)}   sub="mois sélectionné" colorHex={REFERENCE_YEAR_COLOR} />
                  <KpiCard label="Engagement du mois"  value={formatMoney(referenceFinancier.monthFC)}   sub="mois sélectionné" colorHex="#F97316" />
                  <KpiCard label="Commission du mois"  value={formatMoney(referenceFinancier.monthComm)} sub="mois sélectionné" colorHex="#10B981" />
                </div>
              </div>

              {/* Graphes annuels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title={`CA / Engagement / Commission — ${referenceYear}`}
                  legend={
                    <>
                      <LegendItem color="#3B82F6" label="CA" />
                      <LegendItem color="#F97316" label="Engagement" />
                      <LegendItem color="#10B981" label="Commission" />
                    </>
                  }
                >
                  <Bar data={financierBarData} options={moneyOptions} />
                </ChartCard>

                <ChartCard
                  title="Évolution CA — comparaison par année"
                  legend={financierByYear.map((f) => (
                    <LegendItem key={f.year} color={f.color} label={`${f.year}`} dashed={f.year !== referenceYear} />
                  ))}
                >
                  <Line data={caLineData} options={moneyOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois sélectionné par module ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail par prestation — {moisLabel}
                </p>

                <div className="space-y-4">
                  <ChartCard
                    title={`CA par module — ${moisLabel}`}
                    legend={sortedYears.map((y) => (
                      <LegendItem key={y} color={getYearColor(y)} label={`${y}`} />
                    ))}
                    height={moduleNamesMonth.length * 40 + 60}
                  >
                    <Bar data={buildMonthlyMetricBarData('chiffreAffaire')} options={financierMonthOptions} />
                  </ChartCard>

                  <ChartCard
                    title={`Engagement par module — ${moisLabel}`}
                    legend={sortedYears.map((y) => (
                      <LegendItem key={y} color={getYearColor(y)} label={`${y}`} />
                    ))}
                    height={moduleNamesMonth.length * 40 + 60}
                  >
                    <Bar data={buildMonthlyMetricBarData('engagementFournisseur')} options={financierMonthOptions} />
                  </ChartCard>

                  <ChartCard
                    title={`Commission par module — ${moisLabel}`}
                    legend={sortedYears.map((y) => (
                      <LegendItem key={y} color={getYearColor(y)} label={`${y}`} />
                    ))}
                    height={moduleNamesMonth.length * 40 + 60}
                  >
                    <Bar data={buildMonthlyMetricBarData('commission')} options={financierMonthOptions} />
                  </ChartCard>
                </div>

                {/* Tableau récap */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th rowSpan={2} className="text-left px-4 py-3 font-medium align-bottom">Module</th>
                        {sortedYears.map((y) => (
                          <th key={y} colSpan={3} className="text-center px-4 py-2 font-medium border-l border-gray-100">{y}</th>
                        ))}
                      </tr>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        {sortedYears.map((y) => (
                          <React.Fragment key={y}>
                            <th className="text-right px-4 py-2 font-medium border-l border-gray-100">CA</th>
                            <th className="text-right px-4 py-2 font-medium">Eng.</th>
                            <th className="text-right px-4 py-2 font-medium">Comm.</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => (
                        <tr key={name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 flex items-center gap-2 whitespace-nowrap">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                            <span className="font-medium text-gray-700">{name}</span>
                          </td>
                          {sortedYears.map((y) => {
                            const mod = modulesByYearMonth[y]?.find((m) => m.moduleName === name);
                            return (
                              <React.Fragment key={y}>
                                <td className="px-4 py-3 text-right text-blue-600 font-semibold border-l border-gray-50 whitespace-nowrap">{formatMoney(mod?.chiffreAffaire ?? 0)}</td>
                                <td className="px-4 py-3 text-right text-orange-500 font-semibold whitespace-nowrap">{formatMoney(mod?.engagementFournisseur ?? 0)}</td>
                                <td className="px-4 py-3 text-right text-emerald-600 font-semibold whitespace-nowrap">{formatMoney(mod?.commission ?? 0)}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ CA PAR MODULE ══ */}
          {activeTab === 'ca_detail' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {caModuleTotalsByYear.map((c) => (
                  <KpiCard key={c.year} label={`CA total ${c.year}`} value={formatMoney(c.total)} sub="période sélectionnée" colorHex={c.color} />
                ))}
                <KpiCard
                  label={`CA ${moisLabel}`}
                  value={formatMoney(caModuleTotalsByYear.find((c) => c.year === referenceYear)?.month ?? 0)}
                  sub="mois sélectionné"
                  colorHex={REFERENCE_YEAR_COLOR}
                />
              </div>

              {/* Graphes annuels empilés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedYears.map((y) => (
                  <ChartCard
                    key={y}
                    title={`CA par module — ${y}`}
                    legend={allModuleNames.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name)} label={name} />
                    ))}
                  >
                    <Bar data={buildStackedDataForYear(y, 'chiffreAffaire')} options={moneyOptions} />
                  </ChartCard>
                ))}
              </div>

              {/* ─── Détail mois sélectionné ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail CA par prestation — {moisLabel}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedYears.map((y) => (
                    <ChartCard
                      key={y}
                      title={`CA par module — ${moisLabel} ${y}`}
                      subtitle={`Total : ${formatMoney(modulesByYearMonth[y].reduce((s, m) => s + m.chiffreAffaire, 0))}`}
                      legend={moduleNamesMonth.map((name) => (
                        <LegendItem key={name} color={getModuleColor(name)} label={name} />
                      ))}
                      height={240}
                    >
                      <Doughnut data={buildDonutDataForYear(y, 'chiffreAffaire')} options={donutMoneyOptions} />
                    </ChartCard>
                  ))}
                </div>

                {/* Tableau récap CA */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        {sortedYears.map((y) => (
                          <th key={y} className="text-right px-4 py-3 font-medium whitespace-nowrap">CA {y}</th>
                        ))}
                        {singleComparisonYear !== null && (
                          <th className="text-right px-4 py-3 font-medium">Évolution</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesByYearMonth[referenceYear]?.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0;
                        const prev = singleComparisonYear !== null
                          ? modulesByYearMonth[singleComparisonYear]?.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0
                          : 0;
                        const diff = curr - prev;
                        const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            {sortedYears.map((y) => (
                              <td key={y} className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                                {formatMoney(modulesByYearMonth[y]?.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0)}
                              </td>
                            ))}
                            {singleComparisonYear !== null && (
                              <td className="px-4 py-3 text-right">
                                {prev > 0 ? (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                  }`}>
                                    {diff >= 0 ? '+' : ''}{pct}%
                                  </span>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ ENGAGEMENT PAR MODULE ══ */}
          {activeTab === 'fc_detail' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {fcModuleTotalsByYear.map((c) => (
                  <KpiCard key={c.year} label={`Engagement total ${c.year}`} value={formatMoney(c.total)} sub="période sélectionnée" colorHex={c.color} />
                ))}
                <KpiCard
                  label={`Engagement ${moisLabel}`}
                  value={formatMoney(fcModuleTotalsByYear.find((c) => c.year === referenceYear)?.month ?? 0)}
                  sub="mois sélectionné"
                  colorHex={REFERENCE_YEAR_COLOR}
                />
              </div>

              {/* Graphes annuels empilés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedYears.map((y) => (
                  <ChartCard
                    key={y}
                    title={`Engagement par module — ${y}`}
                    legend={allModuleNames.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name)} label={name} />
                    ))}
                  >
                    <Bar data={buildStackedDataForYear(y, 'engagementFournisseur')} options={moneyOptions} />
                  </ChartCard>
                ))}
              </div>

              {/* ─── Détail mois sélectionné ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail engagement par prestation — {moisLabel}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedYears.map((y) => (
                    <ChartCard
                      key={y}
                      title={`Engagement par module — ${moisLabel} ${y}`}
                      subtitle={`Total : ${formatMoney(modulesByYearMonth[y].reduce((s, m) => s + m.engagementFournisseur, 0))}`}
                      legend={moduleNamesMonth.map((name) => (
                        <LegendItem key={name} color={getModuleColor(name)} label={name} />
                      ))}
                      height={240}
                    >
                      <Doughnut data={buildDonutDataForYear(y, 'engagementFournisseur')} options={donutMoneyOptions} />
                    </ChartCard>
                  ))}
                </div>

                {/* Tableau récap Engagement */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        {sortedYears.map((y) => (
                          <th key={y} className="text-right px-4 py-3 font-medium whitespace-nowrap">Engagement {y}</th>
                        ))}
                        {singleComparisonYear !== null && (
                          <th className="text-right px-4 py-3 font-medium">Évolution</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesByYearMonth[referenceYear]?.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0;
                        const prev = singleComparisonYear !== null
                          ? modulesByYearMonth[singleComparisonYear]?.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0
                          : 0;
                        const diff = curr - prev;
                        const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            {sortedYears.map((y) => (
                              <td key={y} className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                                {formatMoney(modulesByYearMonth[y]?.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0)}
                              </td>
                            ))}
                            {singleComparisonYear !== null && (
                              <td className="px-4 py-3 text-right">
                                {prev > 0 ? (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                  }`}>
                                    {diff >= 0 ? '+' : ''}{pct}%
                                  </span>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default PageTableauBord;
