import type { ReactNode } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import Button from '../ui/Button';

interface CreateEnteteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  loadingLabel?: string;
  children: ReactNode;
}

// Coquille de modale partagée par tous les modules pour la création d'en-tête
// (ticketing, hotel, visa, assurance, attestation) — même bouton, même design,
// même position. Chaque module fournit ses propres champs via `children`.
export default function CreateEnteteModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  submitDisabled = false,
  submitLabel = 'Créer',
  loadingLabel = 'Création...',
  children,
}: CreateEnteteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-indigo-600 text-indigo-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FiPlus size={18} />
            </div>
            <h3 className="text-lg font-bold">Ajouter un en-tête</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {children}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading || submitDisabled}>
            {loading ? loadingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
