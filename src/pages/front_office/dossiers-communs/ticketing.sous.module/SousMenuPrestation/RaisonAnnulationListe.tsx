import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store';

export default function RaisonAnnulationListe() {
  const { items, loading, error } = useSelector((state: RootState) => state.raisonAnnulation);

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse text-slate-500">
        Chargement des raisons d'annulation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 italic">
        Aucune raison d'annulation trouvée
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Libellé</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Statut</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Créé le</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.libelle}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.statut === 'ACTIF'
                      ? 'bg-green-100 text-green-800'
                      : item.statut === 'CREER'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.statut}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}