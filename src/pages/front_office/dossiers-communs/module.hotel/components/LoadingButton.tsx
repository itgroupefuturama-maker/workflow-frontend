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

const LoadingButton = ({
  label,
  loadingLabel,
  isLoading,
  disabled,
  onClick,
  variant,
  icon,
  title,
}: {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant: Variant;
  icon: React.ReactNode;
  title?: string;
}) => {
  const { base, active } = variantStyles[variant];
  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5
        text-xs font-medium rounded-lg border transition-colors
        ${base}
        ${!isDisabled ? active : 'opacity-40 cursor-not-allowed'}
      `}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
};

export default LoadingButton;