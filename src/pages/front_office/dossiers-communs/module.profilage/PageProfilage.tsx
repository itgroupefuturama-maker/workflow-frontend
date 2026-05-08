import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, Plane, Hotel, FileText,
  Shield, Award, BarChart3, Users, TrendingUp,
  PieChartIcon, TableIcon, Search, X,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchAllProfilage } from '../../../../app/front_office/parametre_baseDonnee/clientProfilageSlice';
import type { ClientProfilage } from '../../../../app/front_office/parametre_baseDonnee/clientProfilageSlice';
import { FiArrowLeft } from 'react-icons/fi';

/* ── Config ──────────────────────────────────────────────────────────────── */
const MODULE_CONFIG = [
  { key: 'ticketing',   label: 'Ticketing',  color: '#6366f1', bg: 'bg-indigo-50',  text: 'text-indigo-600',  icon: <Plane size={14} />    },
  { key: 'hotel',       label: 'Hôtel',       color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-600',    icon: <Hotel size={14} />    },
  { key: 'visa',        label: 'Visa',        color: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-600',   icon: <FileText size={14} /> },
  { key: 'attestation', label: 'Attestation', color: '#a855f7', bg: 'bg-purple-50',  text: 'text-purple-600',  icon: <Award size={14} />    },
  { key: 'assurance',   label: 'Assurance',   color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <Shield size={14} />   },
] as const;

type ModuleKey = typeof MODULE_CONFIG[number]['key'];

const TYPE_STYLE: Record<string, { badge: string; dot: string }> = {
  SIMPLE:    { badge: 'bg-gray-100   text-gray-600   border-gray-200',   dot: 'bg-gray-400'    },
  BRONZE:    { badge: 'bg-orange-50  text-orange-700 border-orange-200', dot: 'bg-orange-400'  },
  SILVER:    { badge: 'bg-slate-100  text-slate-600  border-slate-200',  dot: 'bg-slate-400'   },
  GOLD:      { badge: 'bg-yellow-50  text-yellow-700 border-yellow-200', dot: 'bg-yellow-400'  },
  PLATINIUM: { badge: 'bg-cyan-50    text-cyan-700   border-cyan-200',   dot: 'bg-cyan-400'    },
};

/* ── Tooltip recharts ────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-black text-gray-800">{payload[0].name}</p>
      <p className="mt-0.5" style={{ color: payload[0].fill ?? payload[0].color }}>
        <span className="font-bold">{payload[0].value}</span> dossier{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  );
};

/* ── KPI Card ────────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, icon, color, bg }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
}) => (
  <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-100 bg-white shadow-sm`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
      <span className={color}>{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Ligne du tableau ─────────────────────────────────────────────────────── */
const ClientRow = ({ c, onClick }: { c: ClientProfilage; onClick: () => void }) => {
  const ts = TYPE_STYLE[c.typeClient] ?? TYPE_STYLE.SIMPLE;
  const max = Math.max(...MODULE_CONFIG.map(m => c.modules[m.key]));
  return (
    <tr
      onClick={onClick}
      className="group hover:bg-indigo-50/40 transition-colors cursor-pointer"
    >
      {/* Client */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
            {c.libelle?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
              {c.nomComplet}
            </p>
            <p className="text-[10px] text-gray-400 font-mono">{c.code}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-5 py-3">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${ts.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ts.dot}`} />
          {c.typeClient}
        </span>
      </td>

      {/* Modules — mini barres */}
      {MODULE_CONFIG.map(m => (
        <td key={m.key} className="px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums w-5 text-right text-gray-700">
              {c.modules[m.key]}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: max > 0 ? `${(c.modules[m.key] / max) * 100}%` : '0%',
                  backgroundColor: m.color,
                  opacity: c.modules[m.key] === 0 ? 0.2 : 1,
                }}
              />
            </div>
          </div>
        </td>
      ))}

      {/* Total */}
      <td className="px-5 py-3">
        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {c.modules.total}
        </span>
      </td>
    </tr>
  );
};

/* ── Page principale ─────────────────────────────────────────────────────── */
const PageProfilage = () => {
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const { all, loading, error } = useSelector((s: RootState) => s.clientProfilage);
  const clients = all ?? [];

  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [chartView,  setChartView]  = useState<'bar' | 'pie'>('bar');

  useEffect(() => { dispatch(fetchAllProfilage()); }, [dispatch]);

  /* ── Données filtrées ── */
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.nomComplet.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.libelle.toLowerCase().includes(q);
    const matchT = !typeFilter || c.typeClient === typeFilter;
    return matchQ && matchT;
  });

  /* ── KPIs globaux ── */
  const totalDossiers  = clients.reduce((s, c) => s + c.modules.total, 0);
  const totalClients   = clients.length;
  const topClient      = [...clients].sort((a, b) => b.modules.total - a.modules.total)[0];
  const modulesTotaux  = MODULE_CONFIG.map(m => ({
    ...m,
    total: clients.reduce((s, c) => s + c.modules[m.key], 0),
  }));

  /* ── Données graphique comparatif ── */
  const barData = filtered.map(c => ({
    name: c.libelle,
    ...Object.fromEntries(MODULE_CONFIG.map(m => [m.key, c.modules[m.key]])),
    total: c.modules.total,
  }));

  /* ── Données camembert global ── */
  const pieData = modulesTotaux
    .filter(m => m.total > 0)
    .map(m => ({ name: m.label, value: m.total, fill: m.color }));

  /* ── Types disponibles ── */
  const types = [...new Set(clients.map(c => c.typeClient))];

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-indigo-500" />
      <span className="text-sm">Chargement du profilage…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96 gap-3 text-red-400">
      <AlertCircle size={20} />
      <span className="text-sm">{error}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans text-slate-900">

      {/* ── Header ── */}
      <div className="bg-white shrink-0 px-8 py-5">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
                className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
                <FiArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-xl font-black text-gray-900">Profilage des clients</h2>
                <p className="text-sm text-gray-400 font-medium italic mt-0.5">
                    Vue globale de l'activité par client
                </p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Clients suivis"
            value={totalClients}
            icon={<Users size={18} />}
            color="text-indigo-600" bg="bg-indigo-50"
          />
          <KpiCard
            label="Dossiers au total"
            value={totalDossiers}
            icon={<TrendingUp size={18} />}
            color="text-emerald-600" bg="bg-emerald-50"
          />
          {modulesTotaux.sort((a, b) => b.total - a.total).slice(0, 1).map(m => (
            <KpiCard
              key={m.key}
              label="Module le plus actif"
              value={m.label}
              sub={`${m.total} dossier${m.total > 1 ? 's' : ''}`}
              icon={m.icon}
              color={m.text} bg={m.bg}
            />
          ))}
          {topClient && (
            <KpiCard
              label="Client le plus actif"
              value={topClient.libelle}
              sub={`${topClient.modules.total} dossier${topClient.modules.total > 1 ? 's' : ''}`}
              icon={<Award size={18} />}
              color="text-amber-600" bg="bg-amber-50"
            />
          )}
        </div>

        {/* ── Graphiques globaux ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Camembert global */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                <PieChartIcon size={12} className="text-indigo-600" />
              </div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Répartition globale
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false}
                  label={({ percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Légende manuelle */}
            <div className="flex flex-col gap-1.5 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-gray-500">{d.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique comparatif clients */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                <BarChart3 size={12} className="text-gray-500" />
              </div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Comparatif clients
              </p>
              {/* Toggle bar / pie */}
              <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setChartView('bar')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    chartView === 'bar'
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <TableIcon size={11} /> Barres
                </button>
                <button onClick={() => setChartView('pie')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    chartView === 'pie'
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <PieChartIcon size={11} /> Total
                </button>
              </div>
            </div>

            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} iconType="circle"
                    formatter={v => <span className="text-[11px] font-semibold text-gray-500">{v}</span>} />
                  {MODULE_CONFIG.map(m => (
                    <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[3, 3, 0, 0]} maxBarSize={16} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'pie' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {filtered.map(c => {
                  const pd = MODULE_CONFIG
                    .map(m => ({ name: m.label, value: c.modules[m.key], fill: m.color }))
                    .filter(d => d.value > 0);
                  return (
                    <div key={c.clientBeneficiaireId} className="flex flex-col items-center gap-1">
                      <p className="text-[11px] font-black text-gray-600 truncate max-w-full">{c.libelle}</p>
                      <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                          <Pie data={pd} cx="50%" cy="50%" outerRadius={42} dataKey="value" labelLine={false}>
                            {pd.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-xs font-black text-indigo-600">{c.modules.total} dos.</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Tableau détaillé ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

          {/* Barre filtres */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <Search size={13} className="text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un client…"
                className="text-sm bg-transparent outline-none text-gray-700 w-44 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-gray-600 outline-none cursor-pointer"
            >
              <option value="">Tous les types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <span className="ml-auto text-xs text-gray-400 font-medium">
              {filtered.length} / {clients.length} client{clients.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-800 text-white uppercase text-[10px] font-black tracking-widest">
                  <th className="px-5 py-4 text-left whitespace-nowrap">Client</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Type</th>
                  {MODULE_CONFIG.map(m => (
                    <th key={m.key} className="px-5 py-4 text-left whitespace-nowrap">{m.label}</th>
                  ))}
                  <th className="px-5 py-4 text-left whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-gray-400 italic text-sm">
                      Aucun client trouvé.
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <ClientRow
                    key={c.clientBeneficiaireId}
                    c={c}
                    onClick={() => navigate(`/dossiers-communs/base-donnee/details/${c.clientBeneficiaireId}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PageProfilage;