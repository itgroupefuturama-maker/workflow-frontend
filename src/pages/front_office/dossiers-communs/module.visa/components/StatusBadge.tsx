{/* StatusBadge amélioré */}
const COLORS: Record<string, string> = {
  créé    : 'bg-blue-50 text-blue-700 border border-blue-200',
  envoyé  : 'bg-green-50 text-green-700 border border-green-200',
  annulé  : 'bg-red-50 text-red-600 border border-red-200',
  initiale : 'bg-gray-100 text-gray-600 border border-gray-200',
  approuvé : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  assigné : 'bg-amber-50 text-amber-700 border border-amber-200',
};

const DOTS: Record<string, string> = {
  créé    : 'bg-blue-500',
  envoyé  : 'bg-green-500',
  ANNULER  : 'bg-red-500',
  INITIALE : 'bg-gray-400',
  APPROUVE : 'bg-emerald-500',
  ASSIGNER : 'bg-amber-500',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`uppercase inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${COLORS[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] ?? 'bg-gray-400'}`} />
    {status}
  </span>
);

export default StatusBadge;