import React from "react";

export const InfoField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
  </div>
);

export const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 min-h-[36px]">
      {value || <span className="text-gray-300">—</span>}
    </div>
  </div>
);

export const Tab = ({
  label, icon, active, onClick, count,
}: {
  label: string; icon?: string; active: boolean; onClick: () => void; count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-10 py-2 text-sm rounded-tl-xl rounded-tr-xl font-medium transition-all duration-150 border-0 outline-none cursor-pointer
      ${active ? "bg-white text-indigo-600" : "bg-slate-200 text-gray-400 hover:bg-white/50 hover:text-gray-700"}`}
  >
    {icon && <span className="text-[15px]">{icon}</span>}
    {label}
    {count !== undefined && (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
        active ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400"
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const SubTab = ({
  label, active, onClick, count,
}: {
  label: string; active: boolean; onClick: () => void; count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
      }`}>
        {count}
      </span>
    )}
  </button>
);