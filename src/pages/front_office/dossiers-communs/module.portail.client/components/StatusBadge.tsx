const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    VALIDER: 'bg-green-100 text-green-700',
    REFUSER: 'bg-red-100 text-red-600',
    CREER: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;