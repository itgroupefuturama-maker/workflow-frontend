import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  fetchEtatVente,
  fetchEvolutionCurrentYear,
  fetchEvolutionPreviousYear,
  type EtatVenteLigne,
} from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  FiTrendingUp, FiFileText, FiAlertCircle, FiPercent,
  FiX,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import TabContainer from '../../../../layouts/TabContainer';
import { fetchModules } from '../../../../app/back_office/modulesSlice';

// ── Constantes ────────────────────────────────────────────────

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

const getModuleColor = (moduleName: string) =>
  MODULE_COLORS[moduleName.toLowerCase()] ?? '#6B7280';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'MGA', maximumFractionDigits: 0,
  }).format(value);

// ── Sous-composants ───────────────────────────────────────────

interface KpiColorProps {
  label: string;
  value: string;
  sub?: string;
  colorClass: string; // "bg-X text-X text-X"
}
const KpiColor: React.FC<KpiColorProps> = ({ label, value, sub, colorClass }) => {
  const [bg, textValue, textLabel] = colorClass.split(' ');
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className={`text-xs ${textLabel} font-medium uppercase tracking-wide`}>{label}</p>
      <p className={`text-2xl font-bold ${textValue} mt-1 truncate`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

interface KpiIconProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
}
const KpiIcon: React.FC<KpiIconProps> = ({ label, value, sub, icon: Icon, loading }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon size={16} className="text-gray-500" />
      </div>
      {sub && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sub}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">
      {loading
        ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
        : value}
    </p>
    <p className="text-xs text-gray-400 font-medium">{label}</p>
  </div>
);

const ChartWrapper: React.FC<{ title: string; children: React.ReactElement }> =
  ({ title, children }) => (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        {children}
      </ResponsiveContainer>
    </div>
  );

// ── Onglets internes au dashboard ─────────────────────────────

const DASH_TABS = [
  { id: 'dossiers',  label: 'Dossiers' },
  { id: 'financier', label: 'CA / Commission / Engagement' },
];

// ── Types ─────────────────────────────────────────────────────

type Module = 'ticketing' | 'attestation' | 'hotel' | 'visa' | 'assurance';

// ── Composant principal ───────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR');

const AccueilView = ({ module }: { module?: Module }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [activeTab,     setActiveTab]     = useState(location.state?.targetTab || 'dashboard');
  const [activeDashTab, setActiveDashTab] = useState('dossiers');
  const [prevTargetTab, setPrevTargetTab] = useState(location.state?.targetTab);

  if (prevTargetTab !== location.state?.targetTab) {
    setPrevTargetTab(location.state?.targetTab);
    if (location.state?.targetTab) setActiveTab(location.state.targetTab);
  }

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

  // ── État des ventes ──────────────────────────────────────────
  const { etatVenteResultat, loadingEtatVente, errorEtatVente } =
    useSelector((state: RootState) => state.dashboard);
  const { data: modules } =
    useSelector((state: RootState) => state.modules);

  const [dateDebut,     setDateDebut]     = useState('');
  const [dateFin,       setDateFin]       = useState('');
  const [clientFacture, setClientFacture] = useState('');

  // Résolution automatique de l'id du module à partir du nom reçu en prop
  const moduleResolu = modules.find(
    (m) => m.nom.toLowerCase() === module?.toLowerCase()
  );
  const moduleIdResolu = moduleResolu?.id ?? '';

  useEffect(() => {
    dispatch(fetchModules());
  }, [dispatch]);

  const handleSearchEtat = () => {
    dispatch(fetchEtatVente({
      dateDebut,
      dateFin,
      moduleId: moduleIdResolu,
      clientFacture,
    }));
  };

  const handleResetEtat = () => {
    setDateDebut('');
    setDateFin('');
    setClientFacture('');
  };

  const lignes: EtatVenteLigne[] = etatVenteResultat?.data ?? [];

  const groupesParDate = lignes.reduce<Record<string, EtatVenteLigne[]>>(
    (acc, ligne) => {
      const dateKey = formatDate(ligne.dateTransaction);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(ligne);
      return acc;
    }, {}
  );

  const totalGeneral = {
    fcCAriary:  lignes.reduce((s, l) => s + l.fcCAriary,  0),
    commission: lignes.reduce((s, l) => s + l.commission, 0),
    cmCAriary:  lignes.reduce((s, l) => s + l.cmCAriary,  0),
  };

  // ── Filtrage par module ──────────────────────────────────────
  // On cherche le module par nom (insensible à la casse)
  // Les champs du module : nombreDossiers / chiffreAffaire / engagementFournisseur / commission
  const filterByModule = (data: typeof evolutionCurrentYear) =>
    data.map((m) => {
      if (!module) {
        // Pas de filtre → totaux globaux du mois
        return {
          mois:       m.mois,
          dossiers:   m.dossiers,
          ca:         m.ca,
          fc:         m.fc,
          commission: m.commission,
        };
      }

      const mod = m.modules.find(
        (md) => md.moduleName.toLowerCase() === module.toLowerCase()
      );

      // ✅ Correction : utiliser nombreDossiers (et non dossiers)
      return {
        mois:       m.mois,
        dossiers:   mod?.nombreDossiers        ?? 0,
        ca:         mod?.chiffreAffaire        ?? 0,
        fc:         mod?.engagementFournisseur ?? 0,
        commission: mod?.commission            ?? 0,
      };
    });

  const filteredCurrent  = filterByModule(evolutionCurrentYear);
  const filteredPrevious = filterByModule(evolutionPreviousYear);

  // ── KPIs dossiers ────────────────────────────────────────────
  const totalDossiersCurrent  = filteredCurrent.reduce((s, m) => s + m.dossiers, 0);
  const totalDossiersPrevious = filteredPrevious.reduce((s, m) => s + m.dossiers, 0);
  const totalDossiersMonth    = filteredCurrent[currentMonthIndex]?.dossiers ?? 0;

  // ── KPIs financiers ──────────────────────────────────────────
  const totalCACurrent    = filteredCurrent.reduce((s, m) => s + m.ca, 0);
  const totalFCCurrent    = filteredCurrent.reduce((s, m) => s + m.fc, 0);
  const totalCommCurrent  = filteredCurrent.reduce((s, m) => s + m.commission, 0);
  const totalCAPrevious   = filteredPrevious.reduce((s, m) => s + m.ca, 0);
  const totalFCPrevious   = filteredPrevious.reduce((s, m) => s + m.fc, 0);
  const totalCommPrevious = filteredPrevious.reduce((s, m) => s + m.commission, 0);
  const totalCAMonth      = filteredCurrent[currentMonthIndex]?.ca         ?? 0;
  const totalFCMonth      = filteredCurrent[currentMonthIndex]?.fc         ?? 0;
  const totalCommMonth    = filteredCurrent[currentMonthIndex]?.commission ?? 0;

  // ── Croissances ──────────────────────────────────────────────
  const growthDossiers =
    totalDossiersPrevious > 0
      ? `${(((totalDossiersCurrent - totalDossiersPrevious) / totalDossiersPrevious) * 100).toFixed(1)}%`
      : 'N/A';

  const growthCA =
    totalCAPrevious > 0
      ? `${(((totalCACurrent - totalCAPrevious) / totalCAPrevious) * 100).toFixed(1)}%`
      : 'N/A';

  // ── Données graphes ──────────────────────────────────────────
  const chartDossiersCurrent  = filteredCurrent.map((m) =>
    ({ mois: MOIS_LABELS[m.mois - 1], Dossiers: m.dossiers }));
  const chartDossiersPrevious = filteredPrevious.map((m) =>
    ({ mois: MOIS_LABELS[m.mois - 1], Dossiers: m.dossiers }));

  const chartFinancierCurrent  = filteredCurrent.map((m) => ({
    mois: MOIS_LABELS[m.mois - 1], CA: m.ca, Engagement: m.fc, Commission: m.commission,
  }));
  const chartFinancierPrevious = filteredPrevious.map((m) => ({
    mois: MOIS_LABELS[m.mois - 1], CA: m.ca, Engagement: m.fc, Commission: m.commission,
  }));

  const moduleColor = module ? getModuleColor(module) : '#3B82F6';

  // ── Onglets principaux ───────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'etat',      label: 'État des ventes'  },
  ];

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* ══════════════════════════════════════════════════════════
          ONGLET DASHBOARD
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 mt-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 capitalize">
                Tableau de bord — {module ?? 'Général'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Analyse comparative des performances
              </p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
              Période : {previousYearNum} — {currentYearNum}
            </span>
          </div>

          {/* KPI résumé (4 cards avec icônes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiIcon
              label="Dossiers actifs"
              value={totalDossiersCurrent}
              sub={`${currentYearNum}`}
              icon={FiFileText}
              loading={isLoading}
            />
            <KpiIcon
              label="Croissance dossiers"
              value={isLoading ? '' : growthDossiers}
              sub="vs année préc."
              icon={FiTrendingUp}
              loading={isLoading}
            />
            <KpiIcon
              label="Dossiers ce mois"
              value={totalDossiersMonth}
              sub={`${MOIS_LABELS[currentMonthIndex]} ${currentYearNum}`}
              icon={FiAlertCircle}
              loading={isLoading}
            />
            <KpiIcon
              label="Croissance CA"
              value={isLoading ? '' : growthCA}
              sub="vs année préc."
              icon={FiPercent}
              loading={isLoading}
            />
          </div>

          {/* État chargement / erreur */}
          {isLoading && (
            <p className="text-sm text-gray-400 animate-pulse">Chargement des données...</p>
          )}
          {!isLoading && hasError && (
            <p className="text-sm text-red-500">{errorEvolutionCurrent || errorEvolutionPrevious}</p>
          )}

          {/* Sous-onglets + graphes */}
          {!isLoading && !hasError && (
            <>
              <div className="flex gap-1 border-b border-gray-200">
                {DASH_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDashTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeDashTab === tab.id
                        ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

                {/* ── Dossiers ── */}
                {activeDashTab === 'dossiers' && (
                  <>
                    <h3 className="text-base font-semibold text-gray-700">
                      Évolution mensuelle des dossiers
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <KpiColor
                        label={`Total ${currentYearNum}`}
                        value={totalDossiersCurrent.toString()}
                        sub="dossiers"
                        colorClass="bg-blue-50 text-blue-700 text-blue-500"
                      />
                      <KpiColor
                        label={`${MOIS_LABELS[currentMonthIndex]} ${currentYearNum}`}
                        value={totalDossiersMonth.toString()}
                        sub="dossiers ce mois"
                        colorClass="bg-green-50 text-green-700 text-green-500"
                      />
                      <KpiColor
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
                          <Bar dataKey="Dossiers" fill={moduleColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartWrapper>

                      <ChartWrapper title={`Dossiers par mois — ${previousYearNum}`}>
                        <BarChart data={chartDossiersPrevious}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Dossiers" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartWrapper>
                    </div>
                  </>
                )}

                {/* ── Financier ── */}
                {activeDashTab === 'financier' && (
                  <>
                    <h3 className="text-base font-semibold text-gray-700">
                      Chiffre d'affaire / Engagement / Commission
                    </h3>

                    {/* Année courante */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {currentYearNum}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiColor label="CA total"          value={formatMoney(totalCACurrent)}   sub={`année ${currentYearNum}`} colorClass="bg-blue-50 text-blue-700 text-blue-500" />
                        <KpiColor label="Engagement total"  value={formatMoney(totalFCCurrent)}   sub={`année ${currentYearNum}`} colorClass="bg-orange-50 text-orange-700 text-orange-500" />
                        <KpiColor label="Commission totale" value={formatMoney(totalCommCurrent)} sub={`année ${currentYearNum}`} colorClass="bg-green-50 text-green-700 text-green-500" />
                      </div>
                    </div>

                    {/* Mois en cours */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {MOIS_LABELS[currentMonthIndex]} {currentYearNum}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiColor label="CA du mois"          value={formatMoney(totalCAMonth)}   sub="mois en cours" colorClass="bg-blue-50 text-blue-700 text-blue-500" />
                        <KpiColor label="Engagement du mois"  value={formatMoney(totalFCMonth)}   sub="mois en cours" colorClass="bg-orange-50 text-orange-700 text-orange-500" />
                        <KpiColor label="Commission du mois"  value={formatMoney(totalCommMonth)} sub="mois en cours" colorClass="bg-green-50 text-green-700 text-green-500" />
                      </div>
                    </div>

                    {/* Année précédente */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {previousYearNum}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiColor label="CA total"          value={formatMoney(totalCAPrevious)}   sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
                        <KpiColor label="Engagement total"  value={formatMoney(totalFCPrevious)}   sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
                        <KpiColor label="Commission totale" value={formatMoney(totalCommPrevious)} sub={`année ${previousYearNum}`} colorClass="bg-gray-50 text-gray-700 text-gray-500" />
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
                          <Bar dataKey="CA"         name="CA"         fill={moduleColor} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Engagement" name="Engagement" fill="#F97316"     radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Commission" name="Commission" fill="#10B981"     radius={[4, 4, 0, 0]} />
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

              </div>
            </>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET ÉTAT DES VENTES
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'etat' && (
        <div className="space-y-6 mt-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 capitalize">
                État des ventes — {module ?? 'Général'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {moduleResolu
                  ? `Filtré automatiquement sur le module « ${moduleResolu.nom} »`
                  : 'Module non résolu — vérifiez la correspondance des noms'}
              </p>
            </div>
          </div>

          {/* Barre de filtres — sans sélecteur de module (pré-filtré) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Date début */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Date début
                </label>
                <input
                  type="month"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              </div>

              {/* Date fin */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Date fin
                </label>
                <input
                  type="month"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              </div>

              {/* Client facturé */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Client facturé
                </label>
                <input
                  type="text"
                  value={clientFacture}
                  onChange={(e) => setClientFacture(e.target.value)}
                  placeholder="Ex : Client Air France"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              </div>
            </div>

            {/* Module badge — informatif, non modifiable */}
            {moduleResolu && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Module :
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: moduleColor }}
                >
                  {moduleResolu.nom}
                </span>
              </div>
            )}

            {/* Boutons */}
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={handleResetEtat}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <FiX size={14} />
                Réinitialiser
              </button>
              <button
                onClick={handleSearchEtat}
                disabled={loadingEtatVente || !moduleIdResolu}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
              >
                {loadingEtatVente
                  ? <FiRefreshCw size={14} className="animate-spin" />
                  : <FiSearch size={14} />
                }
                Rechercher
              </button>
            </div>
          </div>

          {/* Erreur */}
          {!loadingEtatVente && errorEtatVente && (
            <p className="text-sm text-red-500">{errorEtatVente}</p>
          )}

          {/* Tableau */}
          {!loadingEtatVente && etatVenteResultat && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                <table className="min-w-full border-collapse">

                  {/* En-têtes */}
                  <thead>
                    <tr className="bg-[#2563EB]">
                      <th colSpan={4} className="px-4 py-3 text-center text-sm font-bold text-white border border-blue-400">
                        État de Vente
                      </th>
                    </tr>
                    <tr className="bg-[#BFDBFE]">
                      <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                        Période
                      </th>
                      <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                        Prestation
                      </th>
                    </tr>
                    <tr className="bg-[#DBEAFE]">
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Du</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Au</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">De</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">À</th>
                    </tr>
                    <tr className="bg-[#EFF6FF]">
                      <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                        {dateDebut || '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                        {dateFin || '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                        {moduleResolu?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                        {clientFacture || 'Tous'}
                      </td>
                    </tr>
                    <tr className="bg-[#2563EB]">
                      {['Date', 'Prix Prestataire', 'Commission', 'Prix Client'].map((h) => (
                        <th key={h} className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide border border-blue-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {lignes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-sm text-gray-400">
                          Aucune donnée — veuillez lancer une recherche
                        </td>
                      </tr>
                    ) : (
                      <>
                        {Object.entries(groupesParDate).map(([dateKey, itemsDate]) => {

                          const groupesParPrestation = itemsDate.reduce<Record<string, EtatVenteLigne[]>>(
                            (acc, l) => {
                              if (!acc[l.prestation]) acc[l.prestation] = [];
                              acc[l.prestation].push(l);
                              return acc;
                            }, {}
                          );

                          const totalDate = {
                            fcCAriary:  itemsDate.reduce((s, l) => s + l.fcCAriary,  0),
                            commission: itemsDate.reduce((s, l) => s + l.commission, 0),
                            cmCAriary:  itemsDate.reduce((s, l) => s + l.cmCAriary,  0),
                          };

                          return (
                            <React.Fragment key={dateKey}>

                              {/* Ligne date */}
                              <tr className="bg-[#EFF6FF]">
                                <td colSpan={4} className="px-4 py-2 text-xs font-bold text-gray-700 border border-blue-100">
                                  {dateKey}
                                </td>
                              </tr>

                              {Object.entries(groupesParPrestation).map(([prestationNom, itemsPrestation]) => {

                                const totalPrestation = {
                                  fcCAriary:  itemsPrestation.reduce((s, l) => s + l.fcCAriary,  0),
                                  commission: itemsPrestation.reduce((s, l) => s + l.commission, 0),
                                  cmCAriary:  itemsPrestation.reduce((s, l) => s + l.cmCAriary,  0),
                                };

                                return (
                                  <React.Fragment key={prestationNom}>
                                    {itemsPrestation.map((ligne, idx) => (
                                      <tr
                                        key={ligne.id}
                                        className={idx % 2 === 0 ? 'bg-[#DBEAFE]/40' : 'bg-[#EFF6FF]/60'}
                                      >
                                        <td className="px-4 py-2.5 text-xs text-gray-500 border border-blue-100 whitespace-nowrap">
                                          {idx === 0 && (
                                            <span className="font-semibold text-gray-700">{ligne.prestation}</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                          {formatMoney(ligne.fcCAriary)}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                          {formatMoney(ligne.commission)}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                          {formatMoney(ligne.cmCAriary)}
                                        </td>
                                      </tr>
                                    ))}

                                    {/* Total prestation */}
                                    <tr className="bg-[#9CA3AF]/25">
                                      <td className="px-4 py-2 text-xs font-black text-gray-700 text-right border border-gray-300">
                                        Total {prestationNom}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                        {formatMoney(totalPrestation.fcCAriary)}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                        {formatMoney(totalPrestation.commission)}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                        {formatMoney(totalPrestation.cmCAriary)}
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}

                              {/* Total date */}
                              <tr className="bg-[#BFDBFE]/60">
                                <td className="px-4 py-2 text-xs font-black text-gray-800 text-right border border-blue-200">
                                  Total
                                </td>
                                <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                  {formatMoney(totalDate.fcCAriary)}
                                </td>
                                <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                  {formatMoney(totalDate.commission)}
                                </td>
                                <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                  {formatMoney(totalDate.cmCAriary)}
                                </td>
                              </tr>

                            </React.Fragment>
                          );
                        })}

                        {/* Total général */}
                        <tr className="bg-[#2563EB]">
                          <td className="px-4 py-3 text-xs font-black text-white border border-blue-400">
                            Total Mois
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                            {formatMoney(totalGeneral.fcCAriary)}
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                            {formatMoney(totalGeneral.commission)}
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                            {formatMoney(totalGeneral.cmCAriary)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </TabContainer>
  );
};

export default AccueilView;