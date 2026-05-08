import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIF:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    créé:    'bg-blue-50 text-blue-700 border-blue-200',
    INACTIF: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase ${colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {status}
    </span>
  );
};

export const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export const EmptyState = ({ label }: { label: string }) => (
  <tr><td colSpan={99} className="text-center py-10 text-sm text-gray-400 italic">{label}</td></tr>
);

export const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100 ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
    {children}
  </td>
);

export const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder:text-gray-300"
    />
  </div>
);

export const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <select
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
    >
      {children}
    </select>
  </div>
);

export const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition text-lg leading-none">×</button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  </div>
);

export const SubmitBtn = ({ loading, label }: { loading: boolean; label: string }) => (
  <button
    type="submit"
    disabled={loading}
    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
  >
    {loading ? <Spinner /> : null}
    {loading ? 'Enregistrement…' : label}
  </button>
);

export const TableHeader = ({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{count}</span>
    </div>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
    >
      + Ajouter
    </button>
  </div>
);

/* ── Composants de structure stylisés ── */
export const SectionTitle = ({ icon: Icon, title, badge }: any) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={16} className="text-slate-400" />
    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    {badge && <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{badge}</span>}
  </div>
);

export const InfoCard = ({ children, className = "" }: any) => (
  <div className={`bg-white border border-slate-300 rounded-2xl p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

// Card.tsx - Un look plus "SaaS" moderne
export const Card = ({ title, children, action, defaultCollapsed = false }: any) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden transition-all">
      <div className="px-5 py-3.5 bg-slate-50/50 flex items-center justify-between border-b border-slate-300">
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex items-center gap-3 group"
        >
          <div className={`p-1 rounded-lg bg-white border border-slate-200 shadow-sm transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`}>
            <FiChevronDown size={14} className="text-slate-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">
            {title}
          </h3>
        </button>
        {action && <div className="animate-in fade-in zoom-in duration-200">{action}</div>}
      </div>

      {!collapsed && (
        <div className="px-6 py-5 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

// Field.tsx - Plus de douceur
export const Field = ({ label, value }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    <span className="text-[13px] font-semibold text-slate-800">{value ?? '—'}</span>
  </div>
);

export const DataRow = ({ label, value, valueClass = '' }: {
  label: string; value: React.ReactNode; valueClass?: string;
  }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-900 text-right ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );

/** Petit label de section réutilisable */
export const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-2 border-b border-gray-200">
    <span className="px-3 py-1 bg-white text-[11px] font-bold uppercase tracking-widest text-gray-500 w-fit">
      {label}
    </span>
  </div>
);
