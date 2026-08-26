type Status = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

interface StatusBadgeProps {
  status: Status;
  children: React.ReactNode;
}

const STATUS_CLASSES: Record<Status, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-700',
};

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}
