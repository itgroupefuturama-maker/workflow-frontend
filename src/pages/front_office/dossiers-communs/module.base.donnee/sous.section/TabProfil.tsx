import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2, AlertCircle, Plane, Hotel, FileText,
  Shield, Award, BarChart3, TableIcon, PieChartIcon,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { AppDispatch, RootState } from "../../../../../app/store";
import { fetchClientProfilage } from "../../../../../app/front_office/parametre_baseDonnee/clientProfilageSlice";

/* ── Styles ─────────────────────────────────────────────────────────────── */
const typeClientStyle: Record<string, { badge: string; label: string }> = {
  BRONZE: { badge: "bg-orange-50 text-orange-700 border-orange-200", label: "Bronze" },
  SILVER: { badge: "bg-slate-100 text-slate-600 border-slate-200",   label: "Silver" },
  GOLD:   { badge: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Gold"   },
};

const moduleConfig = [
  { key: "ticketing",   label: "Ticketing",  color: "#6366f1", bg: "bg-indigo-50",  text: "text-indigo-600",  icon: <Plane size={14} />    },
  { key: "hotel",       label: "Hôtel",       color: "#3b82f6", bg: "bg-blue-50",    text: "text-blue-600",    icon: <Hotel size={14} />    },
  { key: "visa",        label: "Visa",        color: "#f59e0b", bg: "bg-amber-50",   text: "text-amber-600",   icon: <FileText size={14} /> },
  { key: "attestation", label: "Attestation", color: "#a855f7", bg: "bg-purple-50",  text: "text-purple-600",  icon: <Award size={14} />    },
  { key: "assurance",   label: "Assurance",   color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", icon: <Shield size={14} />   },
] as const;

type ModuleKey = typeof moduleConfig[number]["key"];

/* ── Tooltip personnalisé ────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-black text-gray-800">{name}</p>
      <p className="text-gray-500 mt-0.5">
        <span className="font-bold" style={{ color: p.fill }}>{value}</span> dossier{value > 1 ? "s" : ""}
      </p>
    </div>
  );
};

/* ── Label inline dans les parts ─────────────────────────────────────────── */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null; // masque les toutes petites parts
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="text-[11px] font-black" fontSize={11} fontWeight={800}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── Graphique camembert par année ───────────────────────────────────────── */
const AnneeChart = ({ row }: {
  row: { annee: string; ticketing: number; hotel: number; visa: number; attestation: number; assurance: number; total: number };
}) => {
  const chartData = moduleConfig
    .map(m => ({ name: m.label, value: row[m.key as ModuleKey], fill: m.color }))
    .filter(d => d.value > 0);

  if (chartData.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
      <PieChartIcon size={28} />
      <p className="text-xs text-gray-400">Aucune activité cette année</p>
    </div>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">

      {/* En-tête carte */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BarChart3 size={13} className="text-indigo-500" />
          </div>
          <span className="text-sm font-black text-gray-800">{row.annee}</span>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          {row.total} dossier{row.total > 1 ? "s" : ""}
        </span>
      </div>

      {/* Camembert */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs font-semibold text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Mini stats sous le graphique */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-50">
        {moduleConfig.filter(m => row[m.key as ModuleKey] > 0).map(m => (
          <div key={m.key} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${m.bg}`}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <div>
              <p className="text-[10px] font-bold text-gray-400">{m.label}</p>
              <p className="text-sm font-black" style={{ color: m.color }}>{row[m.key as ModuleKey]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Composant principal ─────────────────────────────────────────────────── */
const TabProfil = ({ clientId }: { clientId: string }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.clientProfilage);
  const [view, setView] = useState<"table" | "chart">("chart");

  useEffect(() => {
    dispatch(fetchClientProfilage(clientId));
  }, [clientId, dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
      <Loader2 size={18} className="animate-spin text-indigo-500" />
      <span className="text-sm">Chargement du profil…</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center py-20 gap-2 text-red-400">
      <AlertCircle size={18} />
      <span className="text-sm">{error ?? "Profil introuvable."}</span>
    </div>
  );

  const tc = typeClientStyle[data.typeClient] ?? typeClientStyle.BRONZE;

  return (
    <div className="bg-white p-6 space-y-6">

      {/* ── Identité ── */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 text-xl font-black flex items-center justify-center shrink-0">
          {data.libelle?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-base font-black text-gray-900">{data.nomComplet}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{data.code}</p>
        </div>
        <span className={`ml-auto text-xs font-black px-3 py-1.5 rounded-full border ${tc.badge}`}>
          {tc.label}
        </span>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Modules globaux ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
            <BarChart3 size={12} className="text-indigo-600" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Activité globale</p>
          <span className="ml-auto text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {data.modules.total} dossier{data.modules.total > 1 ? "s" : ""} au total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {moduleConfig.map(({ key, label, icon, text, bg }) => (
            <div key={key} className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-gray-100 ${bg}`}>
              <div className={text}>{icon}</div>
              <p className={`text-2xl font-black ${text}`}>{data.modules[key as ModuleKey]}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Détail par année — header avec toggle ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
            <BarChart3 size={12} className="text-gray-500" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Détail par année</p>

          {/* Toggle tableau / graphiques */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "table"
                  ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <TableIcon size={12} strokeWidth={2} />
              Tableau
            </button>
            <button
              onClick={() => setView("chart")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "chart"
                  ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <PieChartIcon size={12} strokeWidth={2} />
              Graphiques
            </button>
          </div>
        </div>

        {/* Vue tableau */}
        {view === "table" && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Année", "Ticketing", "Hôtel", "Visa", "Attestation", "Assurance", "Total"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.parAnnee.map(row => (
                  <tr key={row.annee} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-black text-indigo-600">{row.annee}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{row.ticketing}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{row.hotel}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{row.visa}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{row.attestation}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{row.assurance}</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs">
                        {row.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vue graphiques — une card par année */}
        {view === "chart" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.parAnnee.map(row => (
              <AnneeChart key={row.annee} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabProfil;