// src/components/modals/FactureClientModal.tsx
import { useState } from 'react';

interface FactureClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reference: string) => Promise<void>;
  initialReference?: string;
}

export default function FactureClientModal({
  isOpen,
  onClose,
  onConfirm,
  initialReference = '',
}: FactureClientModalProps) {
  const [reference, setReference] = useState(initialReference);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reference.trim()) {
      alert('La référence est obligatoire');
      return;
    }
    try {
      await onConfirm(reference.trim());
      setReference('');
      onClose();
    } catch (err: any) {
      alert('Erreur : ' + (err.message || 'Échec émission facture'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Émission de la facture client</h3>

        <label className="block text-sm font-medium text-slate-700 mb-2">
          Référence facture
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value.trimStart())}
          placeholder="FAC-2026-001"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoFocus
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setReference('');
              onClose();
            }}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reference.trim()}
            className={`px-5 py-2.5 rounded-lg text-white font-medium ${
              reference.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-300 cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}