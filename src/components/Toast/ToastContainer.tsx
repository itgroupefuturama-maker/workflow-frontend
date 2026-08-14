import { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { subscribe, dismissToast, type ToastItem, type ToastType } from './toastStore';

const STYLES: Record<ToastType, { border: string; icon: React.ReactNode; iconColor: string }> = {
  success: { border: 'border-l-green-500', icon: <FiCheckCircle />, iconColor: 'text-green-600' },
  error: { border: 'border-l-red-500', icon: <FiXCircle />, iconColor: 'text-red-600' },
  warning: { border: 'border-l-amber-500', icon: <FiAlertTriangle />, iconColor: 'text-amber-600' },
  info: { border: 'border-l-blue-500', icon: <FiInfo />, iconColor: 'text-blue-600' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 border-l-4 ${s.border} rounded-lg shadow-lg px-4 py-3 animate-[toast-in_0.2s_ease-out]`}
          >
            <span className={`shrink-0 mt-0.5 text-lg ${s.iconColor}`}>{s.icon}</span>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-gray-900">{t.title}</p>}
              <p className="text-sm text-gray-600 leading-snug break-words">{t.message}</p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <FiX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
