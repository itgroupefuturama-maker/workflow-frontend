import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { createRaisonAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RaisonAnnulationModal({ isOpen, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { createLoading, createError } = useSelector((state: RootState) => state.raisonAnnulation);

  const [libelle, setLibelle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

//   useEffect(() => {
//     if (isOpen) {
//       setLibelle('');
//       setFormError(null);
//     }
//   }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle.trim()) {
      setFormError('Le libellé est requis');
      return;
    }

    try {
      await dispatch(createRaisonAnnulation(libelle.trim())).unwrap();
      onClose();
    } catch (err) {
      // l'erreur est déjà gérée dans le slice
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Nouvelle raison d'annulation</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ex: Client absent"
              autoFocus
            />
            {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
          </div>

          {createError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              disabled={createLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={createLoading}
            >
              {createLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}