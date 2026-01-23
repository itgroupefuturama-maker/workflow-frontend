// src/components/modals/PaysModal.tsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { createPays } from '../../app/front_office/parametre_ticketing/paysSlice';

interface PaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function PaysModal({ isOpen, onClose }: PaysModalProps) {
  const dispatch = useAppDispatch();
  const { creating, error: reduxError } = useSelector((state: RootState) => state.pays);

  const [pays, setPays] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pays.trim()) {
      setLocalError('Le nom du pays est requis');
      return;
    }
    if (!photoFile) {
      setLocalError('Une photo est requise');
      return;
    }

    const resultAction = await dispatch(
      createPays({
        pays,
        photo: photoFile,
      })
    );

    if (createPays.fulfilled.match(resultAction)) {
      onClose();
      setPays('');
      setPhotoFile(null);
    } else {
      setLocalError(resultAction.payload as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-6">Nouveau Pays</h2>

        {(localError || reduxError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {localError || reduxError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom du pays *
            </label>
            <input
              type="text"
              value={pays}
              onChange={(e) => {
                setPays(e.target.value);
                setLocalError(null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Islande, Japon, Brésil..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Photo *
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              required
            />
            {photoFile && (
              <p className="mt-2 text-sm text-slate-600">
                Fichier sélectionné : {photoFile.name}
              </p>
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
              disabled={creating}
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