type Variant = 'success' | 'primary' | 'purple' | 'warning' | 'danger';

const variantStyles: Record<Variant, { base: string; active: string }> = {
  success: {
    base:   'border-emerald-200 text-emerald-700 bg-emerald-50',
    active: 'hover:bg-emerald-100 hover:border-emerald-300',
  },
  primary: {
    base:   'border-blue-200 text-blue-700 bg-blue-50',
    active: 'hover:bg-blue-100 hover:border-blue-300',
  },
  purple: {
    base:   'border-violet-200 text-violet-700 bg-violet-50',
    active: 'hover:bg-violet-100 hover:border-violet-300',
  },
  warning: {
    base:   'border-amber-200 text-amber-700 bg-amber-50',
    active: 'hover:bg-amber-100 hover:border-amber-300',
  },
  danger: {
    base:   'border-red-200 text-red-600 bg-red-50',
    active: 'hover:bg-red-100 hover:border-red-300',
  },
};

const ActionButton = ({
  label,
  enabled,
  variant,
  onClick,
  icon,
}: {
  label: string;
  enabled: boolean;
  variant: Variant;
  onClick: () => void;
  icon: React.ReactNode;
}) => {
  const { base, active } = variantStyles[variant];
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5
        text-xs font-medium rounded-lg border transition-colors
        ${base}
        ${enabled ? active : 'opacity-40 cursor-not-allowed'}
      `}
    >
      {icon}
      {label}
    </button>
  );
};

export default ActionButton;