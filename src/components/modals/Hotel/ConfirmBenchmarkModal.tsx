import { useState } from "react";
import { FiX } from "react-icons/fi";

interface ConfirmBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isRefundable: boolean) => void;
  isLoading: boolean;
}

const ConfirmBenchmarkModal: React.FC<ConfirmBenchmarkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [isRefundable, setIsRefundable] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Définir le minimum
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Confirmez-vous de définir ce benchmarking comme <strong>référence</strong> ?
          </p>

          {/* Choix isRefundable */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Remboursable ?
              </p>
            </div>
            <div className="p-4 flex gap-4">
              <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isRefundable 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="isRefundable"
                  checked={isRefundable}
                  onChange={() => setIsRefundable(true)}
                  className="accent-green-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Oui</p>
                  <p className="text-xs text-gray-500">Remboursable</p>
                </div>
              </label>

              <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                !isRefundable 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="isRefundable"
                  checked={!isRefundable}
                  onChange={() => setIsRefundable(false)}
                  className="accent-red-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Non</p>
                  <p className="text-xs text-gray-500">Non remboursable</p>
                </div>
              </label>
            </div>
          </div>

          {/* Badge récapitulatif */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isRefundable 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{isRefundable ? '✓' : '✗'}</span>
            Ce benchmark sera défini comme {isRefundable ? 'remboursable' : 'non remboursable'}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(isRefundable)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBenchmarkModal;