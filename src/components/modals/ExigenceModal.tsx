// src/components/modals/ExigenceModal.tsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { createExigence } from '../../app/front_office/parametre_ticketing/exigenceSlice';

interface ExigenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ExigenceModal({ isOpen, onClose }: ExigenceModalProps) {
  const dispatch = useAppDispatch();
  const { creating, error: reduxError } = useSelector((state: RootState) => state.exigence);

  const [form, setForm] = useState({
    type: '',
    description: '',
    perimetre: '',
  });

  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.type.trim()) {
      setLocalError('Le type est requis');
      return;
    }
    if (!form.description.trim()) {
      setLocalError('La description est requise');
      return;
    }
    if (!form.perimetre.trim()) {
      setLocalError('Le périmètre est requis');
      return;
    }

    const resultAction = await dispatch(createExigence(form));

    if (createExigence.fulfilled.match(resultAction)) {
      onClose();
      setForm({ type: '', description: '', perimetre: '' });
    } else {
      setLocalError(resultAction.payload as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-6">Nouvelle Exigence de Voyage</h2>

        {(localError || reduxError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {localError || reduxError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type *
            </label>
            <input
              type="text"
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Visa, Vaccin, Document..."
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Visa obligatoire pour les ressortissants malgaches..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Périmètre *
            </label>
            <input
              type="text"
              name="perimetre"
              value={form.perimetre}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Europe, Tous, Schengen..."
              required
            />
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