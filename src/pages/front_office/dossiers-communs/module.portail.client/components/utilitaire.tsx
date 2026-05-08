// ── Utilitaires ──
const InfoField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
    <p className="text-sm font-medium text-gray-800">
      {value || <span className="text-gray-300 italic">—</span>}
    </p>
  </div>
);


const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${className}`}>{children}</td>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left bg-gray-50/80">
    {children}
  </th>
);

export { InfoField, Td, Th };