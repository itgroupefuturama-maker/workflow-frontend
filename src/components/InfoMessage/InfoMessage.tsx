// components/InfoMessage/InfoMessage.tsx

type InfoMessageProps = {
  title: string;
  description?: string;
  icon?: 'info' | 'empty' | 'warning';
};

const icons = {
  info: (
    <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
      strokeLinecap="round" strokeLinejoin="round" />
  ),
  empty: (
    <path d="M3 7h18M3 12h18M3 17h10" strokeLinecap="round" strokeLinejoin="round" />
  ),
  warning: (
    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      strokeLinecap="round" strokeLinejoin="round" />
  ),
};

const InfoMessage = ({ title, description, icon = 'info' }: InfoMessageProps) => (
  <div className="min-h-[280px] flex items-center justify-center p-6">
    <div className="flex flex-col items-center text-center gap-3 max-w-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          className="text-gray-400">
          {icons[icon]}
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      )}
    </div>
  </div>
);

export default InfoMessage;