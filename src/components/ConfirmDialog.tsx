import { FiAlertTriangle, FiLoader, FiX } from 'react-icons/fi';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const TONE_STYLES: Record<string, { iconBg: string; iconColor: string; confirmBtn: string }> = {
  danger: { iconBg: 'bg-red-100', iconColor: 'text-red-600', confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200' },
  warning: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' },
  primary: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' },
};

export default function ConfirmDialog({
  isOpen,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const styles = TONE_STYLES[tone];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[130] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="px-6 pt-6 pb-2 flex justify-between items-start">
          <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
            <FiAlertTriangle className={styles.iconColor} size={20} />
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-white rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${styles.confirmBtn}`}
          >
            {isLoading && <FiLoader className="animate-spin" size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
