// src/components/modals/DestinationModal.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { createDestination } from '../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays } from '../../app/front_office/parametre_ticketing/paysSlice'; // pour charger les pays si besoin

interface DestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function DestinationModal({ isOpen, onClose }: DestinationModalProps) {
  const dispatch = useAppDispatch();

  const { items: paysList, loading: paysLoading } = useSelector((state: RootState) => state.pays);
  const { creating, error: reduxError } = useSelector((state: RootState) => state.destination);

  const [ville, setVille] = useState('');
  const [paysId, setPaysId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Charger les pays si la liste est vide (sécurité)
  useEffect(() => {
    if (isOpen && paysList.length === 0 && !paysLoading) {
      dispatch(fetchPays());
    }
  }, [isOpen, paysList.length, paysLoading, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ville.trim()) {
      setLocalError('La ville est requise');
      return;
    }
    if (!paysId) {
      setLocalError('Veuillez sélectionner un pays');
      return;
    }

    const resultAction = await dispatch(
      createDestination({
        ville: ville.trim(),
        paysId,
      })
    );

    if (createDestination.fulfilled.match(resultAction)) {
      onClose();
      setVille('');
      setPaysId('');
    } else {
      setLocalError(resultAction.payload as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-6">Nouvelle Destination</h2>

        {(localError || reduxError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {localError || reduxError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ville *
            </label>
            <input
              type="text"
              value={ville}
              onChange={(e) => {
                setVille(e.target.value);
                setLocalError(null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Paris, New York, Tokyo..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pays *
            </label>
            {paysLoading ? (
              <div className="text-sm text-slate-500">Chargement des pays...</div>
            ) : paysList.length === 0 ? (
              <div className="text-sm text-red-600">Aucun pays disponible. Créez-en un d’abord.</div>
            ) : (
              <select
                value={paysId}
                onChange={(e) => {
                  setPaysId(e.target.value);
                  setLocalError(null);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Sélectionner un pays --</option>
                {paysList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pays}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              disabled={creating}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating || paysLoading || paysList.length === 0}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating && (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}