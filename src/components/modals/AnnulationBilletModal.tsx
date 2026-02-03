// src/components/modals/AnnulationBilletModal.tsx
// (très proche de celui du devis, juste les noms de champs changés)

import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import type { BilletLigne } from '../../app/front_office/billetSlice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { raisonAnnul: string; lignes: any[] }) => void;
  lignes: BilletLigne[];
  type: 'reservation' | 'emission';
  loading?: boolean;
}

export default function AnnulationBilletModal({ isOpen, onClose, onSubmit, lignes, type, loading = false }: Props) {
  const [raison, setRaison] = useState('');
  const [penalites, setPenalites] = useState<Record<string, { pu: number; montant: number; condition: string }>>(
    lignes.reduce((acc, l) => ({ ...acc, [l.id]: { pu: 0, montant: 0, condition: '' } }), {})
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raison.trim()) return alert('Raison obligatoire');

    const lignesData = lignes.map(l => ({
      id: l.id,
      puResaPenaliteCompagnieDevise: Number(penalites[l.id]?.pu || 0),
      puResaMontantPenaliteCompagnieDevise: Number(penalites[l.id]?.montant || 0),
      conditionAnnul: penalites[l.id]?.condition || '',
    }));

    onSubmit({ raisonAnnul: raison, lignes: lignesData });
  };

  if (!isOpen) return null;

  const title = type === 'reservation' ? 'Annuler la réservation' : 'Annuler l’émission';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600 text-2xl" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose}><FiX size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block font-medium mb-2">Raison d'annulation *</label>
            <textarea
              value={raison}
              onChange={e => setRaison(e.target.value)}
              className="w-full border rounded-lg p-3 min-h-[90px]"
              required
            />
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pénalités par ligne</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Réf. ligne</th>
                    <th className="px-4 py-2 text-right">PU Pénalité Resa</th>
                    <th className="px-4 py-2 text-right">Montant Pénalité Resa</th>
                    <th className="px-4 py-2">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map(l => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">{l.id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={penalites[l.id]?.pu ?? 0}
                          onChange={e => setPenalites(p => ({
                            ...p,
                            [l.id]: { ...p[l.id], pu: Number(e.target.value) }
                          }))}
                          className="w-full border rounded p-2 text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={penalites[l.id]?.montant ?? 0}
                          onChange={e => setPenalites(p => ({
                            ...p,
                            [l.id]: { ...p[l.id], montant: Number(e.target.value) }
                          }))}
                          className="w-full border rounded p-2 text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={penalites[l.id]?.condition ?? ''}
                          onChange={e => setPenalites(p => ({
                            ...p,
                            [l.id]: { ...p[l.id], condition: e.target.value }
                          }))}
                          className="w-full border rounded p-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 rounded">
              Fermer
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Confirmer l'annulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}