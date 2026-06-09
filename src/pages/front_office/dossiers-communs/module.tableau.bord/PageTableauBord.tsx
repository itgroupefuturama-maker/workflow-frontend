import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  fetchEvolutionCurrentYear,
  fetchEvolutionPreviousYear,
} from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import type { AppDispatch, RootState } from '../../../../app/store';
import { FiArrowLeft, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// ─── Constantes ───────────────────────────────────────────────

const MOIS_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

// Couleurs fixes par module — uniformisées sur tous les graphes
const MODULE_COLORS: Record<string, string> = {
  ticketing:   '#3B82F6', // bleu
  hotel:       '#10B981', // vert
  visa:        '#F59E0B', // orange
  assurance:   '#8B5CF6', // violet
  attestation: '#EF4444', // rouge
};

const getModuleColor = (moduleName: string): string => {
  const key = moduleName.toLowerCase();
  return MODULE_COLORS[key] ?? '#6B7280'; // gris par défaut
};

// Formatage monétaire
const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 })
    .format(value);

// ─── Onglets ──────────────────────────────────────────────────

const TABS = [
  { id: 'dossiers',    label: 'Dossiers' },
  { id: 'financier',   label: 'CA / Commission / Engagement' },
  { id: 'ca_detail',   label: 'CA par module' },
  { id: 'fc_detail',   label: 'Engagement par module' },
];

// ─── Composant principal ──────────────────────────────────────

const PageTableauBord = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('dossiers');

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

  // ── Données Section 1 : Dossiers ──
  const chartDossiersCurrent  = evolutionCurrentYear.map((m) => ({ mois: MOIS_LABELS[m.mois - 1], dossiers: m.dossiers }));
  const chartDossiersPrevious = evolutionPreviousYear.map((m) => ({ mois: MOIS_LABELS[m.mois - 1], dossiers: m.dossiers }));

  const totalDossiersCurrent  = evolutionCurrentYear.reduce((s, m) => s + m.dossiers, 0);
  const totalDossiersPrevious = evolutionPreviousYear.reduce((s, m) => s + m.dossiers, 0);
  const totalDossiersMonth    = evolutionCurrentYear[currentMonthIndex]?.dossiers ?? 0;

  // ── Données Section 2 : CA / FC / Commission ──
  const chartFinancierCurrent  = evolutionCurrentYear.map((m) => ({
    mois: MOIS_LABELS[m.mois - 1],
    CA: m.ca,
    Engagement: m.fc,
    Commission: m.commission,
  }));
  const chartFinancierPrevious = evolutionPreviousYear.map((m) => ({
    mois: MOIS_LABELS[m.mois - 1],
    CA: m.ca,
    Engagement: m.fc,
    Commission: m.commission,
  }));

  const totalCACurrent      = evolutionCurrentYear.reduce((s, m) => s + m.ca, 0);
  const totalFCCurrent      = evolutionCurrentYear.reduce((s, m) => s + m.fc, 0);
  const totalCommCurrent    = evolutionCurrentYear.reduce((s, m) => s + m.commission, 0);
  const totalCAPrevious     = evolutionPreviousYear.reduce((s, m) => s + m.ca, 0);
  const totalFCPrevious     = evolutionPreviousYear.reduce((s, m) => s + m.fc, 0);
  const totalCommPrevious   = evolutionPreviousYear.reduce((s, m) => s + m.commission, 0);
  const totalCAMonth        = evolutionCurrentYear[currentMonthIndex]?.ca ?? 0;
  const totalFCMonth        = evolutionCurrentYear[currentMonthIndex]?.fc ?? 0;
  const totalCommMonth      = evolutionCurrentYear[currentMonthIndex]?.commission ?? 0;

  // ── Données Section 3 & 4 : détail par module ──
  // Récupère tous les noms de modules distincts présents dans les données
  const allModuleNames = Array.from(
    new Set([
      ...evolutionCurrentYear.flatMap((m) => m.modules.map((mod) => mod.moduleName)),
      ...evolutionPreviousYear.flatMap((m) => m.modules.map((mod) => mod.moduleName)),
    ])
  );

  const buildModuleChart = (
    data: typeof evolutionCurrentYear,
    field: 'chiffreAffaire' | 'engagementFournisseur'
  ) =>
    data.map((m) => {
      const row: Record<string, string | number> = { mois: MOIS_LABELS[m.mois - 1] };
      allModuleNames.forEach((name) => {
        const mod = m.modules.find((mod) => mod.moduleName === name);
        row[name] = mod ? mod[field] : 0;
      });
      return row;
    });

  const chartCAModuleCurrent    = buildModuleChart(evolutionCurrentYear,  'chiffreAffaire');
  const chartCAModulePrevious   = buildModuleChart(evolutionPreviousYear, 'chiffreAffaire');
  const chartFCModuleCurrent    = buildModuleChart(evolutionCurrentYear,  'engagementFournisseur');
  const chartFCModulePrevious   = buildModuleChart(evolutionPreviousYear, 'engagementFournisseur');

  const totalCAModuleCurrent    = evolutionCurrentYear.reduce((s, m) => s + m.ca, 0);
  const totalCAModulePrevious   = evolutionPreviousYear.reduce((s, m) => s + m.ca, 0);
  const totalCAModuleMonth      = evolutionCurrentYear[currentMonthIndex]?.ca ?? 0;
  const totalFCModuleCurrent    = evolutionCurrentYear.reduce((s, m) => s + m.fc, 0);
  const totalFCModulePrevious   = evolutionPreviousYear.reduce((s, m) => s + m.fc, 0);
  const totalFCModuleMonth      = evolutionCurrentYear[currentMonthIndex]?.fc ?? 0;

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
        {/* HEADER */}
        <div className="bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="pl-5 flex items-center gap-4">
            <button
                onClick={() => navigate(-1)}
                className="p-3 bg-white border border-gray-200 shadow-md rounded-xl hover:bg-gray-200 transition-all"
            >
                <FiArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <FiUserCheck className="text-indigo-600" /> Dashboard
                </h2>
                <p className="text-gray-500 font-medium italic">Vue d'ensemble des performances.</p>
            </div>
            </div>
        </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
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
        <div className="bg-white rounded-2xl shadow p-6 space-y-6">

          {/* ══════════════════════════════════════════════
              SECTION 1 — Dossiers
          ══════════════════════════════════════════════ */}
          {activeTab === 'dossiers' && (
            <>
              <h2 className="text-lg font-semibold text-gray-700">
                Évolution mensuelle des dossiers
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  label={`Total ${currentYearNum}`}
                  value={totalDossiersCurrent.toString()}
                  sub="dossiers"
                  colorClass="bg-blue-50 text-blue-700 text-blue-500"
                />
                <KpiCard
                  label={`${MOIS_LABELS[currentMonthIndex]} ${currentYearNum}`}
                  value={totalDossiersMonth.toString()}
                  sub="dossiers ce mois"
                  colorClass="bg-green-50 text-green-700 text-green-500"
                />
                <KpiCard
                  label={`Total ${previousYearNum}`}
                  value={totalDossiersPrevious.toString()}
                  sub="dossiers"
                  colorClass="bg-gray-50 text-gray-700 text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title={`Dossiers par mois — ${currentYearNum}`}>
                  <BarChart data={chartDossiersCurrent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="dossiers" name="Dossiers" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartWrapper>

                <ChartWrapper title={`Dossiers par mois — ${previousYearNum}`}>
                  <BarChart data={chartDossiersPrevious}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="dossiers" name="Dossiers" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartWrapper>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 2 — CA / Commission / Engagement
          ══════════════════════════════════════════════ */}
          {activeTab === 'financier' && (
            <>
              <h2 className="text-lg font-semibold text-gray-700">
                Chiffre d'affaire / Commission / Engagement
              </h2>

              {/* KPI année courante */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {currentYearNum}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard label="CA total" value={formatMoney(totalCACurrent)}   sub={`année ${currentYearNum}`} colorClass="bg-blue-50 text-blue-700 text-blue-500" />
                  <KpiCard label="Engagement total" value={formatMoney(totalFCCurrent)}   sub={`année ${currentYearNum}`} colorClass="bg-orange-50 text-orange-700 text-orange-500" />
                  <KpiCard label="Commission totale" value={formatMoney(totalCommCurrent)} sub={`année ${currentYearNum}`} colorClass="bg-green-50 text-green-700 text-green-500" />
                </div>
              </div>

              {/* KPI mois en cours */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {MOIS_LABELS[currentMonthIndex]} {currentYearNum}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard label="CA du mois" value={formatMoney(totalCAMonth)}   sub="mois en cours" colorClass="bg-blue-50 text-blue-700 text-blue-500" />
                  <KpiCard label="Engagement du mois" value={formatMoney(totalFCMonth)}   sub="mois en cours" colorClass="bg-orange-50 text-orange-700 text-orange-500" />
                  <KpiCard label="Commission du mois" value={formatMoney(totalCommMonth)} sub="mois en cours" colorClass="bg-green-50 text-green-700 text-green-500" />
                </div>
              </div>

              {/* KPI année précédente */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {previousYearNum}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard label="CA total" value={formatMoney(totalCAPrevious)}   sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
                  <KpiCard label="Engagement total" value={formatMoney(totalFCPrevious)}   sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
                  <KpiCard label="Commission totale" value={formatMoney(totalCommPrevious)} sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
                </div>
              </div>

              {/* Graphes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title={`CA / Engagement / Commission — ${currentYearNum}`}>
                  <BarChart data={chartFinancierCurrent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    <Bar dataKey="CA"         name="CA"         fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Engagement" name="Engagement" fill="#F97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Commission" name="Commission" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartWrapper>

                <ChartWrapper title={`CA / Engagement / Commission — ${previousYearNum}`}>
                  <BarChart data={chartFinancierPrevious}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    <Bar dataKey="CA"         name="CA"         fill="#93C5FD" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Engagement" name="Engagement" fill="#FDBA74" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Commission" name="Commission" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartWrapper>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 3 — CA détail par module
          ══════════════════════════════════════════════ */}
          {activeTab === 'ca_detail' && (
            <>
              <h2 className="text-lg font-semibold text-gray-700">
                Chiffre d'affaire par module
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label={`CA total ${currentYearNum}`}  value={formatMoney(totalCAModuleCurrent)}  sub="tous modules" colorClass="bg-blue-50 text-blue-700 text-blue-500" />
                <KpiCard label={`CA ${MOIS_LABELS[currentMonthIndex]}`} value={formatMoney(totalCAModuleMonth)} sub="mois en cours" colorClass="bg-green-50 text-green-700 text-green-500" />
                <KpiCard label={`CA total ${previousYearNum}`} value={formatMoney(totalCAModulePrevious)} sub="tous modules" colorClass="bg-gray-50 text-gray-700 text-gray-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title={`CA par module — ${currentYearNum}`}>
                  <BarChart data={chartCAModuleCurrent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    {allModuleNames.map((name) => (
                      <Bar key={name} dataKey={name} name={name} stackId="a"
                        fill={getModuleColor(name)} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ChartWrapper>

                <ChartWrapper title={`CA par module — ${previousYearNum}`}>
                  <BarChart data={chartCAModulePrevious}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    {allModuleNames.map((name) => (
                      <Bar key={name} dataKey={name} name={name} stackId="a"
                        fill={getModuleColor(name)} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ChartWrapper>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 4 — Engagement détail par module
          ══════════════════════════════════════════════ */}
          {activeTab === 'fc_detail' && (
            <>
              <h2 className="text-lg font-semibold text-gray-700">
                Engagement fournisseur par module
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label={`Engagement total ${currentYearNum}`}  value={formatMoney(totalFCModuleCurrent)}  sub="tous modules" colorClass="bg-orange-50 text-orange-700 text-orange-500" />
                <KpiCard label={`Engagement ${MOIS_LABELS[currentMonthIndex]}`} value={formatMoney(totalFCModuleMonth)} sub="mois en cours" colorClass="bg-green-50 text-green-700 text-green-500" />
                <KpiCard label={`Engagement total ${previousYearNum}`} value={formatMoney(totalFCModulePrevious)} sub="tous modules" colorClass="bg-gray-50 text-gray-700 text-gray-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title={`Engagement par module — ${currentYearNum}`}>
                  <BarChart data={chartFCModuleCurrent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    {allModuleNames.map((name) => (
                      <Bar key={name} dataKey={name} name={name} stackId="a"
                        fill={getModuleColor(name)} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ChartWrapper>

                <ChartWrapper title={`Engagement par module — ${previousYearNum}`}>
                  <BarChart data={chartFCModulePrevious}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Legend />
                    {allModuleNames.map((name) => (
                      <Bar key={name} dataKey={name} name={name} stackId="a"
                        fill={getModuleColor(name)} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ChartWrapper>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

// ─── Sous-composants ──────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  colorClass: string; // "bg-X text-X text-X" (bg, value color, label color)
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, colorClass }) => {
  const [bg, textValue, textLabel] = colorClass.split(' ');
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className={`text-xs ${textLabel} font-medium uppercase tracking-wide`}>{label}</p>
      <p className={`text-2xl font-bold ${textValue} mt-1 truncate`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
};

interface ChartWrapperProps {
  title: string;
  children: React.ReactElement;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-3">{title}</h3>
    <ResponsiveContainer width="100%" height={260}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default PageTableauBord;