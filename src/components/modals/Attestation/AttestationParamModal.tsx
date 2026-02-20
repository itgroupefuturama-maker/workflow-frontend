// src/components/modals/AttestationParamModal.tsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../app/store';
import { createAttestationParam, fetchAttestationParams } from '../../../app/front_office/parametre_attestation/attestationParamsSlice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const defaultForm = {
  prix: '',
  // date_activation: '',
};

export default function AttestationParamModal({ isOpen, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { creating, createError } = useSelector(
    (state: RootState) => state.attestationParams
  );

  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setForm(defaultForm);
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.prix || isNaN(Number(form.prix)) || Number(form.prix) <= 0) {
      setFormError('Veuillez entrer un prix valide');
      return;
    }
    // if (!form.date_activation) {
    //   setFormError("Veuillez choisir une date d'activation");
    //   return;
    // }

    setFormError(null);

    try {
      await dispatch(
        createAttestationParam({
          prix: Number(form.prix),
          // date_activation: new Date(form.date_activation).toISOString(),
        })
      ).unwrap();

      dispatch(fetchAttestationParams());

      handleClose();
    } catch {
      // l'erreur est déjà dans createError du slice
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-950 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base tracking-wide">
              Nouveau paramètre de prix
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Le prix actif sera automatiquement désactivé
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={creating}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Prix <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                placeholder="ex : 8000"
                disabled={creating}
                className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                Ar
              </span>
            </div>
          </div>

          {/* Date activation */}
          {/* <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Date d'activation <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.date_activation}
              onChange={(e) => setForm({ ...form, date_activation: e.target.value })}
              disabled={creating}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
            />
          </div> */}

          {/* Erreurs */}
          {(formError || createError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {formError || createError}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex gap-3">
            <button
              onClick={handleClose}
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Création...
                </>
              ) : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}