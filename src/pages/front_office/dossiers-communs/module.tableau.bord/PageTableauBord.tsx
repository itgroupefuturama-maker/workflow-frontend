import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvolutionCurrentYear,
  fetchEvolutionPreviousYear,
} from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
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

const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'MGA', maximumFractionDigits: 0,
  }).format(value);

const TABS = [
  { id: 'dossiers',  label: 'Dossiers' },
  { id: 'financier', label: 'CA / Commission / Engagement' },
  { id: 'ca_detail', label: 'CA par module' },
  { id: 'fc_detail', label: 'Engagement par module' },
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

// ─── Sous-composants ──────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'green' | 'orange' | 'violet' | 'gray';
}

const COLOR_MAP: Record<KpiCardProps['color'], string> = {
  blue:   'text-blue-600',
  green:  'text-emerald-600',
  orange: 'text-orange-500',
  violet: 'text-violet-600',
  gray:   'text-gray-500',
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, color }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-semibold truncate ${COLOR_MAP[color]}`}>{value}</p>
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

// ─── Composant principal ──────────────────────────────────────

const PageTableauBord: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dossiers');

  const {
    evolutionCurrentYear,
    evolutionPreviousYear,
    loadingEvolutionCurrent,
    loadingEvolutionPrevious,
    errorEvolutionCurrent,
    errorEvolutionPrevious,
  } = useSelector((state: RootState) => state.dashboard);

  const currentYearNum    = new Date().getFullYear();
  const previousYearNum   = currentYearNum - 1;
  const currentMonthIndex = new Date().getMonth(); // 0-based

  useEffect(() => {
    dispatch(fetchEvolutionCurrentYear(currentYearNum));
    dispatch(fetchEvolutionPreviousYear(previousYearNum));
  }, [dispatch, currentYearNum, previousYearNum]);

  const isLoading = loadingEvolutionCurrent || loadingEvolutionPrevious;
  const hasError  = errorEvolutionCurrent   || errorEvolutionPrevious;

  // ── Données du mois actuel et précédent (par index) ──
  const currentMonthData  = evolutionCurrentYear[currentMonthIndex];
  const previousMonthData = evolutionPreviousYear[currentMonthIndex];

  // ── Section 1 : Dossiers ──
  const dossiersCurrent  = evolutionCurrentYear.map((m) => m.dossiers);
  const dossiersPrevious = evolutionPreviousYear.map((m) => m.dossiers);

  const cumul = (arr: number[]) => {
    let s = 0;
    return arr.map((v) => (s += v));
  };
  const cumulCurrent  = cumul(dossiersCurrent);
  const cumulPrevious = cumul(dossiersPrevious);

  const totalDossiersCurrent  = dossiersCurrent.reduce((a, b) => a + b, 0);
  const totalDossiersPrevious = dossiersPrevious.reduce((a, b) => a + b, 0);
  const totalDossiersMonth    = currentMonthData?.dossiers ?? 0;

  const dossierBarData = {
    labels: MOIS_LABELS,
    datasets: [
      {
        label: `${currentYearNum}`,
        data: dossiersCurrent.map((v, i) => (i <= currentMonthIndex ? v : null)),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `${previousYearNum}`,
        data: dossiersPrevious,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
  };

  const dossierLineData = {
    labels: MOIS_LABELS,
    datasets: [
      {
        label: `${currentYearNum}`,
        data: cumulCurrent.map((v, i) => (i <= currentMonthIndex ? v : null)),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: '#3B82F6',
      },
      {
        label: `${previousYearNum}`,
        data: cumulPrevious,
        borderColor: '#9CA3AF',
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        fill: false, tension: 0.4, pointRadius: 2,
        pointBackgroundColor: '#9CA3AF',
      },
    ],
  };

  // ── Donut dossiers par module — mois actuel vs précédent ──
  const modulesCurrentMonth  = currentMonthData?.modules  ?? [];
  const modulesPreviousMonth = previousMonthData?.modules ?? [];

  // Noms de modules présents ce mois
  const moduleNamesMonth = Array.from(
    new Set([
      ...modulesCurrentMonth.map((m) => m.moduleName),
      ...modulesPreviousMonth.map((m) => m.moduleName),
    ])
  );

  const donutDossiersCurrentData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesCurrentMonth.find((m) => m.moduleName === name)?.nombreDossiers ?? 0
      ),
      backgroundColor: moduleNamesMonth.map(getModuleColor),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const donutDossiersPreviousData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesPreviousMonth.find((m) => m.moduleName === name)?.nombreDossiers ?? 0
      ),
      backgroundColor: moduleNamesMonth.map((n) => getModuleColor(n) + 'BB'),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const donutOptions = (title: string) => ({
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
  });

  // ── Section 2 : CA / Commission / Engagement ──
  const caArr   = evolutionCurrentYear.map((m) => m.ca);
  const fcArr   = evolutionCurrentYear.map((m) => m.fc);
  const commArr = evolutionCurrentYear.map((m) => m.commission);
  const caArr25   = evolutionPreviousYear.map((m) => m.ca);
  const fcArr25   = evolutionPreviousYear.map((m) => m.fc);
  const commArr25 = evolutionPreviousYear.map((m) => m.commission);

  const totalCACurrent    = caArr.reduce((a, b) => a + b, 0);
  const totalFCCurrent    = fcArr.reduce((a, b) => a + b, 0);
  const totalCommCurrent  = commArr.reduce((a, b) => a + b, 0);
  const totalCAPrevious   = caArr25.reduce((a, b) => a + b, 0);
  const totalFCPrevious   = fcArr25.reduce((a, b) => a + b, 0);
  const totalCommPrevious = commArr25.reduce((a, b) => a + b, 0);
  const totalCAMonth      = currentMonthData?.ca ?? 0;
  const totalFCMonth      = currentMonthData?.fc ?? 0;
  const totalCommMonth    = currentMonthData?.commission ?? 0;

  // Barres groupées annuelles
  const financierBarData = {
    labels: MOIS_LABELS.slice(0, currentMonthIndex + 1),
    datasets: [
      { label: 'CA',         data: caArr.slice(0, currentMonthIndex + 1),   backgroundColor: '#3B82F6', borderRadius: 3, borderSkipped: false as const },
      { label: 'Engagement', data: fcArr.slice(0, currentMonthIndex + 1),   backgroundColor: '#F97316', borderRadius: 3, borderSkipped: false as const },
      { label: 'Commission', data: commArr.slice(0, currentMonthIndex + 1), backgroundColor: '#10B981', borderRadius: 3, borderSkipped: false as const },
    ],
  };

  // Courbe CA superposée N vs N-1
  const caLineData = {
    labels: MOIS_LABELS.slice(0, currentMonthIndex + 1),
    datasets: [
      {
        label: `CA ${currentYearNum}`,
        data: caArr.slice(0, currentMonthIndex + 1),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
      },
      {
        label: `CA ${previousYearNum}`,
        data: caArr25.slice(0, currentMonthIndex + 1),
        borderColor: '#93C5FD',
        borderDash: [6, 4],
        backgroundColor: 'rgba(147,197,253,0.07)',
        fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: '#93C5FD',
      },
    ],
  };

  // ── Graphe mois actuel — détail par module (financier) ──
  // Barres horizontales superposées N vs N-1 pour CA, FC, Commission
  const financierMonthBarData = {
    labels: moduleNamesMonth,
    datasets: [
      {
        label: `CA ${currentYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesCurrentMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0
        ),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `CA ${previousYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesPreviousMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0
        ),
        backgroundColor: '#BFDBFE',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `Engagement ${currentYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesCurrentMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0
        ),
        backgroundColor: '#F97316',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `Engagement ${previousYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesPreviousMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0
        ),
        backgroundColor: '#FED7AA',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `Commission ${currentYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesCurrentMonth.find((m) => m.moduleName === name)?.commission ?? 0
        ),
        backgroundColor: '#10B981',
        borderRadius: 4,
        borderSkipped: false as const,
      },
      {
        label: `Commission ${previousYearNum}`,
        data: moduleNamesMonth.map((name) =>
          modulesPreviousMonth.find((m) => m.moduleName === name)?.commission ?? 0
        ),
        backgroundColor: '#A7F3D0',
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
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

  // ── Section 3 & 4 : par module annuel ──
  const allModuleNames = Array.from(
    new Set([
      ...evolutionCurrentYear.flatMap((m) => m.modules.map((mod) => mod.moduleName)),
      ...evolutionPreviousYear.flatMap((m) => m.modules.map((mod) => mod.moduleName)),
    ])
  );

  const buildStackedData = (
    data: typeof evolutionCurrentYear,
    field: 'chiffreAffaire' | 'engagementFournisseur',
    months: number
  ) => ({
    labels: MOIS_LABELS.slice(0, months),
    datasets: allModuleNames.map((name) => ({
      label: name,
      data: data.slice(0, months).map((m) => {
        const mod = m.modules.find((mod) => mod.moduleName === name);
        return mod ? mod[field] : 0;
      }),
      backgroundColor: getModuleColor(name),
      stack: 'a',
      borderSkipped: false as const,
    })),
  });

  const caModuleCurrentData  = buildStackedData(evolutionCurrentYear,  'chiffreAffaire',        currentMonthIndex + 1);
  const caModulePreviousData = buildStackedData(evolutionPreviousYear, 'chiffreAffaire',        currentMonthIndex + 1);
  const fcModuleCurrentData  = buildStackedData(evolutionCurrentYear,  'engagementFournisseur', currentMonthIndex + 1);
  const fcModulePreviousData = buildStackedData(evolutionPreviousYear, 'engagementFournisseur', currentMonthIndex + 1);

  // Donut CA par module — mois actuel
  const donutCAMonthCurrentData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesCurrentMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0
      ),
      backgroundColor: moduleNamesMonth.map(getModuleColor),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const donutCAMonthPreviousData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesPreviousMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0
      ),
      backgroundColor: moduleNamesMonth.map((n) => getModuleColor(n) + 'BB'),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const donutMoneyOptions = (year: number) => ({
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
  });

  // Donut Engagement par module — mois actuel
  const donutFCMonthCurrentData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesCurrentMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0
      ),
      backgroundColor: moduleNamesMonth.map(getModuleColor),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const donutFCMonthPreviousData = {
    labels: moduleNamesMonth,
    datasets: [{
      data: moduleNamesMonth.map((name) =>
        modulesPreviousMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0
      ),
      backgroundColor: moduleNamesMonth.map((n) => getModuleColor(n) + 'BB'),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }],
  };

  const totalCAModuleCurrent  = evolutionCurrentYear.reduce((s, m) => s + m.ca, 0);
  const totalCAModulePrevious = evolutionPreviousYear.reduce((s, m) => s + m.ca, 0);
  const totalCAModuleMonth    = currentMonthData?.ca ?? 0;
  const totalFCModuleCurrent  = evolutionCurrentYear.reduce((s, m) => s + m.fc, 0);
  const totalFCModulePrevious = evolutionPreviousYear.reduce((s, m) => s + m.fc, 0);
  const totalFCModuleMonth    = currentMonthData?.fc ?? 0;

  const moisLabel = MOIS_LABELS[currentMonthIndex];

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
        <p className="text-sm text-red-500 pt-4">{errorEvolutionCurrent || errorEvolutionPrevious}</p>
      )}

      {!isLoading && !hasError && (
        <div className="space-y-5">

          {/* ══ DOSSIERS ══ */}
          {activeTab === 'dossiers' && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label={`Total ${currentYearNum}`}  value={totalDossiersCurrent.toString()}  sub="dossiers" color="blue" />
                <KpiCard label={`${moisLabel} ${currentYearNum}`} value={totalDossiersMonth.toString()} sub="dossiers ce mois" color="green" />
                <KpiCard label={`Total ${previousYearNum}`} value={totalDossiersPrevious.toString()} sub="dossiers" color="gray" />
              </div>

              {/* Graphes annuels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title={`Dossiers mensuels — ${currentYearNum} vs ${previousYearNum}`}
                  legend={
                    <>
                      <LegendItem color="#3B82F6" label={`${currentYearNum}`} />
                      <LegendItem color="#E5E7EB" label={`${previousYearNum}`} />
                    </>
                  }
                >
                  <Bar data={dossierBarData} options={baseOptions} />
                </ChartCard>

                <ChartCard
                  title="Cumul dossiers — tendance"
                  legend={
                    <>
                      <LegendItem color="#3B82F6" label={`${currentYearNum}`} />
                      <LegendItem color="#9CA3AF" label={`${previousYearNum}`} dashed />
                    </>
                  }
                >
                  <Line data={dossierLineData} options={baseOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois actuel par module ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail par prestation — {moisLabel} {currentYearNum} vs {moisLabel} {previousYearNum}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard
                    title={`Dossiers par module — ${moisLabel} ${currentYearNum}`}
                    subtitle={`${totalDossiersMonth} dossiers au total ce mois`}
                    legend={
                      <>
                        {moduleNamesMonth.map((name) => (
                          <LegendItem key={name} color={getModuleColor(name)} label={name} />
                        ))}
                      </>
                    }
                    height={240}
                  >
                    <Doughnut data={donutDossiersCurrentData} options={donutOptions(`${currentYearNum}`)} />
                  </ChartCard>

                  <ChartCard
                    title={`Dossiers par module — ${moisLabel} ${previousYearNum}`}
                    subtitle={`${previousMonthData?.dossiers ?? 0} dossiers au total ce mois`}
                    legend={
                      <>
                        {moduleNamesMonth.map((name) => (
                          <LegendItem key={name} color={getModuleColor(name) + 'BB'} label={name} />
                        ))}
                      </>
                    }
                    height={240}
                  >
                    <Doughnut data={donutDossiersPreviousData} options={donutOptions(`${previousYearNum}`)} />
                  </ChartCard>
                </div>

                {/* Tableau récap par module */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        <th className="text-right px-4 py-3 font-medium">Dossiers {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Dossiers {previousYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Évolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesCurrentMonth.find((m) => m.moduleName === name)?.nombreDossiers ?? 0;
                        const prev = modulesPreviousMonth.find((m) => m.moduleName === name)?.nombreDossiers ?? 0;
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
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">{curr}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{prev}</td>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{currentYearNum}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="CA total"          value={formatMoney(totalCACurrent)}   sub={`année ${currentYearNum}`} color="blue" />
                <KpiCard label="Engagement total"  value={formatMoney(totalFCCurrent)}   sub={`année ${currentYearNum}`} color="orange" />
                <KpiCard label="Commission totale" value={formatMoney(totalCommCurrent)} sub={`année ${currentYearNum}`} color="green" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-1">
                {moisLabel} {currentYearNum}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="CA du mois"          value={formatMoney(totalCAMonth)}   sub="mois en cours" color="blue" />
                <KpiCard label="Engagement du mois"  value={formatMoney(totalFCMonth)}   sub="mois en cours" color="orange" />
                <KpiCard label="Commission du mois"  value={formatMoney(totalCommMonth)} sub="mois en cours" color="green" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-1">{previousYearNum}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="CA total"          value={formatMoney(totalCAPrevious)}   sub={`année ${previousYearNum}`} color="gray" />
                <KpiCard label="Engagement total"  value={formatMoney(totalFCPrevious)}   sub={`année ${previousYearNum}`} color="gray" />
                <KpiCard label="Commission totale" value={formatMoney(totalCommPrevious)} sub={`année ${previousYearNum}`} color="gray" />
              </div>

              {/* Graphes annuels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title={`CA / Engagement / Commission — ${currentYearNum}`}
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
                  title={`Évolution CA — ${currentYearNum} vs ${previousYearNum}`}
                  legend={
                    <>
                      <LegendItem color="#3B82F6" label={`${currentYearNum}`} />
                      <LegendItem color="#93C5FD" label={`${previousYearNum}`} dashed />
                    </>
                  }
                >
                  <Line data={caLineData} options={moneyOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois actuel par module ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail par prestation — {moisLabel} {currentYearNum} vs {moisLabel} {previousYearNum}
                </p>

                <ChartCard
                  title={`CA / Engagement / Commission par module — ${moisLabel}`}
                  subtitle="Comparaison année courante (plein) vs année précédente (clair)"
                  legend={
                    <>
                      <LegendItem color="#3B82F6" label={`CA ${currentYearNum}`} />
                      <LegendItem color="#BFDBFE" label={`CA ${previousYearNum}`} />
                      <LegendItem color="#F97316" label={`Engagement ${currentYearNum}`} />
                      <LegendItem color="#FED7AA" label={`Engagement ${previousYearNum}`} />
                      <LegendItem color="#10B981" label={`Commission ${currentYearNum}`} />
                      <LegendItem color="#A7F3D0" label={`Commission ${previousYearNum}`} />
                    </>
                  }
                  height={moduleNamesMonth.length * 60 + 60}
                >
                  <Bar data={financierMonthBarData} options={financierMonthOptions} />
                </ChartCard>

                {/* Tableau récap */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        <th className="text-right px-4 py-3 font-medium">CA {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">CA {previousYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Eng. {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Eng. {previousYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Comm. {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Comm. {previousYearNum}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesCurrentMonth.find((m) => m.moduleName === name);
                        const prev = modulesPreviousMonth.find((m) => m.moduleName === name);
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatMoney(curr?.chiffreAffaire ?? 0)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{formatMoney(prev?.chiffreAffaire ?? 0)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-orange-500">{formatMoney(curr?.engagementFournisseur ?? 0)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{formatMoney(prev?.engagementFournisseur ?? 0)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatMoney(curr?.commission ?? 0)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{formatMoney(prev?.commission ?? 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ CA PAR MODULE ══ */}
          {activeTab === 'ca_detail' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label={`CA total ${currentYearNum}`}       value={formatMoney(totalCAModuleCurrent)}  sub="tous modules" color="blue" />
                <KpiCard label={`CA ${moisLabel}`}                  value={formatMoney(totalCAModuleMonth)}    sub="mois en cours" color="green" />
                <KpiCard label={`CA total ${previousYearNum}`}      value={formatMoney(totalCAModulePrevious)} sub="tous modules" color="gray" />
              </div>

              {/* Graphes annuels empilés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title={`CA par module — ${currentYearNum}`}
                  legend={allModuleNames.map((name) => (
                    <LegendItem key={name} color={getModuleColor(name)} label={name} />
                  ))}
                >
                  <Bar data={caModuleCurrentData} options={moneyOptions} />
                </ChartCard>

                <ChartCard
                  title={`CA par module — ${previousYearNum}`}
                  legend={allModuleNames.map((name) => (
                    <LegendItem key={name} color={getModuleColor(name)} label={name} />
                  ))}
                >
                  <Bar data={caModulePreviousData} options={moneyOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois actuel ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail CA par prestation — {moisLabel} {currentYearNum} vs {moisLabel} {previousYearNum}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard
                    title={`CA par module — ${moisLabel} ${currentYearNum}`}
                    subtitle={`Total : ${formatMoney(totalCAModuleMonth)}`}
                    legend={moduleNamesMonth.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name)} label={name} />
                    ))}
                    height={240}
                  >
                    <Doughnut data={donutCAMonthCurrentData} options={donutMoneyOptions(currentYearNum)} />
                  </ChartCard>

                  <ChartCard
                    title={`CA par module — ${moisLabel} ${previousYearNum}`}
                    subtitle={`Total : ${formatMoney(previousMonthData?.ca ?? 0)}`}
                    legend={moduleNamesMonth.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name) + 'BB'} label={name} />
                    ))}
                    height={240}
                  >
                    <Doughnut data={donutCAMonthPreviousData} options={donutMoneyOptions(previousYearNum)} />
                  </ChartCard>
                </div>

                {/* Tableau récap CA */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        <th className="text-right px-4 py-3 font-medium">CA {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">CA {previousYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Évolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesCurrentMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0;
                        const prev = modulesPreviousMonth.find((m) => m.moduleName === name)?.chiffreAffaire ?? 0;
                        const diff = curr - prev;
                        const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatMoney(curr)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{formatMoney(prev)}</td>
                            <td className="px-4 py-3 text-right">
                              {prev > 0 ? (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  {diff >= 0 ? '+' : ''}{pct}%
                                </span>
                              ) : <span className="text-gray-300 text-xs">—</span>}
                            </td>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label={`Engagement total ${currentYearNum}`}  value={formatMoney(totalFCModuleCurrent)}  sub="tous modules" color="orange" />
                <KpiCard label={`Engagement ${moisLabel}`}             value={formatMoney(totalFCModuleMonth)}    sub="mois en cours" color="green" />
                <KpiCard label={`Engagement total ${previousYearNum}`} value={formatMoney(totalFCModulePrevious)} sub="tous modules" color="gray" />
              </div>

              {/* Graphes annuels empilés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title={`Engagement par module — ${currentYearNum}`}
                  legend={allModuleNames.map((name) => (
                    <LegendItem key={name} color={getModuleColor(name)} label={name} />
                  ))}
                >
                  <Bar data={fcModuleCurrentData} options={moneyOptions} />
                </ChartCard>

                <ChartCard
                  title={`Engagement par module — ${previousYearNum}`}
                  legend={allModuleNames.map((name) => (
                    <LegendItem key={name} color={getModuleColor(name)} label={name} />
                  ))}
                >
                  <Bar data={fcModulePreviousData} options={moneyOptions} />
                </ChartCard>
              </div>

              {/* ─── Détail mois actuel ─── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Détail engagement par prestation — {moisLabel} {currentYearNum} vs {moisLabel} {previousYearNum}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard
                    title={`Engagement par module — ${moisLabel} ${currentYearNum}`}
                    subtitle={`Total : ${formatMoney(totalFCModuleMonth)}`}
                    legend={moduleNamesMonth.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name)} label={name} />
                    ))}
                    height={240}
                  >
                    <Doughnut data={donutFCMonthCurrentData} options={donutMoneyOptions(currentYearNum)} />
                  </ChartCard>

                  <ChartCard
                    title={`Engagement par module — ${moisLabel} ${previousYearNum}`}
                    subtitle={`Total : ${formatMoney(previousMonthData?.fc ?? 0)}`}
                    legend={moduleNamesMonth.map((name) => (
                      <LegendItem key={name} color={getModuleColor(name) + 'BB'} label={name} />
                    ))}
                    height={240}
                  >
                    <Doughnut data={donutFCMonthPreviousData} options={donutMoneyOptions(previousYearNum)} />
                  </ChartCard>
                </div>

                {/* Tableau récap Engagement */}
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Module</th>
                        <th className="text-right px-4 py-3 font-medium">Engagement {currentYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Engagement {previousYearNum}</th>
                        <th className="text-right px-4 py-3 font-medium">Évolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {moduleNamesMonth.map((name) => {
                        const curr = modulesCurrentMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0;
                        const prev = modulesPreviousMonth.find((m) => m.moduleName === name)?.engagementFournisseur ?? 0;
                        const diff = curr - prev;
                        const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: getModuleColor(name) }} />
                              <span className="font-medium text-gray-700">{name}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-orange-500">{formatMoney(curr)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{formatMoney(prev)}</td>
                            <td className="px-4 py-3 text-right">
                              {prev > 0 ? (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  {diff >= 0 ? '+' : ''}{pct}%
                                </span>
                              ) : <span className="text-gray-300 text-xs">—</span>}
                            </td>
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