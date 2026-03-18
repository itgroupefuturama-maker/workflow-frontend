import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  children: ReactNode;
}

const VisaModal = ({ title, onClose, onSubmit, loading, children }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 text-base">🛂</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">{title}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="overflow-y-auto px-7 py-5 space-y-4 flex-1
                      scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {children}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
        <p className="text-[11px] text-gray-400">
          <span className="text-red-400 font-bold">*</span> Champs obligatoires
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100
                       text-sm font-medium transition"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700
                       text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  </div>
);

export default VisaModal;