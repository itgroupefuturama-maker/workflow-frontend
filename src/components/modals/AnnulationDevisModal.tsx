import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
// import type { Ligne } from '../../app/front_office/devisSlice'; // ajuste le chemin

interface AnnulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    raisonAnnul: string;
    // lignes: {
    //   id: string;
    //   puPenaliteCompagnieDevise: number;
    //   montantPenaliteCompagnieDevise: number;
    //   conditionAnnul: string;
    // }[];
  }) => void;
  // lignes: Ligne[];
  loading?: boolean;
}

export default function AnnulationDevisModal({
  isOpen,
  onClose,
  onSubmit,
  // lignes,
  loading = false,
}: AnnulationModalProps) {
  const [raison, setRaison] = useState('');
  // const [lignePenalites, setLignePenalites] = useState<
  //   Record<string, { pu: number; montant: number; condition: string }>
  // >(
  //   lignes.reduce((acc, l) => ({
  //     ...acc,
  //     [l.id]: { pu: 0, montant: 0, condition: '' },
  //   }), {})
  // );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raison.trim()) return alert('La raison d\'annulation est obligatoire');

    // const lignesData = lignes.map(l => ({
    //   id: l.id,
    //   puPenaliteCompagnieDevise: Number(lignePenalites[l.id]?.pu || 0),
    //   montantPenaliteCompagnieDevise: Number(lignePenalites[l.id]?.montant || 0),
    //   conditionAnnul: lignePenalites[l.id]?.condition || '',
    // }));

    onSubmit({
      raisonAnnul: raison,
      // lignes: lignesData,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">
              Annulation du devis
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Raison globale */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Raison de l'annulation *
            </label>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
              placeholder="Expliquez la raison de l'annulation..."
              required
            />
          </div>

          {/* Tableau des pénalités par ligne */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-3">Pénalités par ligne</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Réf. ligne</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Itinéraire</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">PU Pénalité Cie</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Montant Pénalité Cie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3 text-sm">{ligne.numeroDosRef || ligne.id.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm">{ligne.itineraire || '—'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={lignePenalites[ligne.id]?.pu ?? 0}
                          onChange={(e) => setLignePenalites({
                            ...lignePenalites,
                            [ligne.id]: {
                              ...lignePenalites[ligne.id],
                              pu: Number(e.target.value),
                            },
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={lignePenalites[ligne.id]?.montant ?? 0}
                          onChange={(e) => setLignePenalites({
                            ...lignePenalites,
                            [ligne.id]: {
                              ...lignePenalites[ligne.id],
                              montant: Number(e.target.value),
                            },
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={lignePenalites[ligne.id]?.condition ?? ''}
                          onChange={(e) => setLignePenalites({
                            ...lignePenalites,
                            [ligne.id]: {
                              ...lignePenalites[ligne.id],
                              condition: e.target.value,
                            },
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Condition d'annulation..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div> */}

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Traitement...
                </>
              ) : (
                'Confirmer l\'annulation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}