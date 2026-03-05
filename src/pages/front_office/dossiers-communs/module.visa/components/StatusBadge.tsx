const COLORS: Record<string, string> = {
  CREER     : 'bg-blue-100 text-blue-700',
  VALIDER   : 'bg-green-100 text-green-700',
  ANNULER   : 'bg-red-100 text-red-700',
  INITIALE  : 'bg-gray-100 text-gray-600',
  APPROUVE  : 'bg-emerald-100 text-emerald-700',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export default StatusBadge;