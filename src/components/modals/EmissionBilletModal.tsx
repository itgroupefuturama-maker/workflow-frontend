// src/components/modals/EmissionBilletModal.tsx
import {useState } from 'react';
import { toast } from '../Toast/toast';

interface EmissionBilletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reference: string) => Promise<void>;
  initialReference?: string;
}

export default function EmissionBilletModal({
  isOpen,
  onClose,
  onConfirm,
  initialReference = '',
}: EmissionBilletModalProps) {
  const [reference, setReference] = useState(initialReference);
  // L'envoi à Odoo peut prendre jusqu'à ~10 s : boutons bloqués pendant ce temps
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reference.trim()) {
      toast.warning('La référence BC client est obligatoire');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reference.trim());
      setReference('');
      onClose();
    } catch (err) {
      // La modal reste ouverte : « Confirmer » relance le même envoi (renvoi après un 502)
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi à Odoo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold mb-1">Émettre le billet</h3>
        <p className="text-sm text-slate-500 mb-4">
          L'achat est envoyé à Odoo. Le billet passera « émis » quand Odoo l'aura validé.
        </p>

        <label className="block text-sm font-medium text-slate-700 mb-2">
          Référence BC client <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value.trimStart())}
          placeholder="Référence du bon de commande client"
          disabled={submitting}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoFocus
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setReference('');
              onClose();
            }}
            disabled={submitting}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reference.trim() || submitting}
            className={`px-5 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 ${
              reference.trim() && !submitting
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-300 cursor-not-allowed'
            }`}
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submitting ? 'Envoi à Odoo…' : 'Envoyer à Odoo'}
          </button>
        </div>
      </div>
    </div>
  );
}