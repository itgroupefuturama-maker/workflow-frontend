import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { createServiceSpecifique } from '../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';

interface ServiceSpecifiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ServiceSpecifiqueModal({ isOpen, onClose }: ServiceSpecifiqueModalProps) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    libelle: '',
    type: 'SERVICE' as 'SERVICE' | 'SPECIFIQUE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.libelle.trim()) {
      setError('Le libellé est requis');
      return;
    }

    setSubmitting(true);
    setError(null);

    const resultAction = await dispatch(createServiceSpecifique(form));

    if (createServiceSpecifique.fulfilled.match(resultAction)) {
      onClose();
      setForm({ libelle: '', type: 'SERVICE' });
    } else {
      setError(resultAction.payload as string);
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-6">Nouveau paramètre Ticketing</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              value={form.libelle}
              onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Pet, Choix Siège, Bagage cabine..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as 'SERVICE' | 'SPECIFIQUE' })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SERVICE">SERVICE</option>
              <option value="SPECIFIQUE">SPECIFIQUE</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}