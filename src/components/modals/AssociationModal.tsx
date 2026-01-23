import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { createAssociation } from '../../app/front_office/parametre_ticketing/associationsPaysVoyageSlice';
import { fetchPays } from '../../app/front_office/parametre_ticketing/paysSlice';
import { fetchExigences } from '../../app/front_office/parametre_ticketing/exigenceSlice';

interface AssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function AssociationModal({ isOpen, onClose }: AssociationModalProps) {
  const dispatch = useAppDispatch();

  const { items: pays, loading: paysLoading } = useSelector((state: RootState) => state.pays);
  const { items: exigences, loading: exigencesLoading } = useSelector((state: RootState) => state.exigence);
  const { creating, error: reduxError } = useSelector((state: RootState) => state.associationsPaysVoyage);

  const [paysId, setPaysId] = useState('');
  const [exigenceId, setExigenceId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (pays.length === 0 && !paysLoading) dispatch(fetchPays());
      if (exigences.length === 0 && !exigencesLoading) dispatch(fetchExigences());
    }
  }, [isOpen, pays.length, exigences.length, paysLoading, exigencesLoading, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paysId) {
      setLocalError('Veuillez sélectionner un pays');
      return;
    }
    if (!exigenceId) {
      setLocalError('Veuillez sélectionner une exigence');
      return;
    }

    const result = await dispatch(createAssociation({ paysId, exigenceVoyageId: exigenceId }));

    if (createAssociation.fulfilled.match(result)) {
      onClose();
      setPaysId('');
      setExigenceId('');
    } else {
      setLocalError(result.payload as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-6">Nouvelle Association Exigence ↔ Destination</h2>

        {(localError || reduxError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
            {localError || reduxError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pays *
            </label>
            {paysLoading ? (
              <div className="text-sm text-slate-500">Chargement...</div>
            ) : pays.length === 0 ? (
              <div className="text-sm text-amber-700">Aucun pays disponible. Créez-en un d’abord.</div>
            ) : (
              <select
                value={paysId}
                onChange={(e) => { setPaysId(e.target.value); setLocalError(null); }}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choisir un pays --</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.pays}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Exigence *
            </label>
            {exigencesLoading ? (
              <div className="text-sm text-slate-500">Chargement...</div>
            ) : exigences.length === 0 ? (
              <div className="text-sm text-amber-700">Aucune exigence disponible. Créez-en une d’abord.</div>
            ) : (
              <select
                value={exigenceId}
                onChange={(e) => { setExigenceId(e.target.value); setLocalError(null); }}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choisir une exigence --</option>
                {exigences.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.type} — {ex.description.substring(0, 80)}{ex.description.length > 80 ? '...' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              disabled={creating || pays.length === 0 || exigences.length === 0}
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Créer l'association
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}