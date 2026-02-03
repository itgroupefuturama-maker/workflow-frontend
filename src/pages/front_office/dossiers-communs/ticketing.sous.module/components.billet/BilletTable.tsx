import React from 'react';

// --- Sous-composant pour les cellules de prix (évite la répétition et les erreurs de rendu) ---
const PriceCell = ({ value, isCurrency = false, className = "" }: { value: number, isCurrency?: boolean, className?: string }) => (
  <td className={`px-4 py-3 text-right text-sm ${className}`}>
    {value?.toLocaleString('fr-FR', isCurrency ? { minimumFractionDigits: 2 } : {}) || '—'}
  </td>
);

interface BilletTableProps {
  lignes: any[];
  groups: any[];
  billet: any;
  billetLignes: any[];
  handleOpenReservation: (ligne: any) => void;
  handleOpenEmission: (ligne: any) => void;
}

const BilletTable: React.FC<BilletTableProps> = ({
  lignes,
  groups,
  billet,
  billetLignes,
  handleOpenReservation,
  handleOpenEmission
}) => {
  if (lignes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 italic">
        Aucune ligne enregistrée pour ce billet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-white overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Lignes du billet</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Vol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Compagnie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Itinéraire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Classe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type passager</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Date départ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Date arrivée</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Statut global</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Statut ligne</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Nb pers.</th>
                
                {/* Headers Prix Compagnie */}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase italic">PU Billet Devise</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase italic">PU Svc Devise</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase italic">PU Pén. Devise</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">PU Billet Ar</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">PU Svc Ar</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">PU Pén. Ar</th>

                {/* Headers Prix Réservés */}
                <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase">PU Billet Resa</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase">PU Svc Resa</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase">PU Pén. Resa</th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => {
                const { first, count, allReserved, allEmitted, remainingToReserve, remainingToEmit } = group;
                const p = first.prospectionLigne;
                const fournisseurLibelle = billet?.prospectionEntete?.fournisseur?.libelle || '—';

                return (
                  <tr key={group.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{fournisseurLibelle}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.numeroVol || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{fournisseurLibelle}</td>
                    <td className="px-4 py-3 text-sm">{p.itineraire || '—'}</td>
                    <td className="px-4 py-3 text-sm">{p.classe || '—'}</td>
                    <td className="px-4 py-3 text-sm">{p.typePassager || '—'}</td>
                    
                    <td className="px-4 py-3 text-center text-sm">
                      {p.dateHeureDepart ? new Date(p.dateHeureDepart).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {p.dateHeureArrive ? new Date(p.dateHeureArrive).toLocaleDateString('fr-FR') : '—'}
                    </td>

                    {/* Statut Global */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                        allEmitted ? 'bg-emerald-100 text-emerald-800' :
                        allReserved ? 'bg-green-100 text-green-800' :
                        remainingToReserve < count ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {allEmitted ? 'ÉMIS' : allReserved ? 'RÉSERVÉ' : 'PARTIEL'} ×{count}
                      </span>
                    </td>

                    {/* Statut Ligne détaillée */}
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {billetLignes?.filter(l => l.prospectionLigneId === p.id).map((ligne) => (
                        <div key={ligne.id} className="border-b last:border-0 border-slate-100">{ligne.statut}</div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-center text-sm font-medium">{count}</td>

                    {/* Prix Compagnie Devise */}
                    <PriceCell value={p.puBilletCompagnieDevise} isCurrency />
                    <PriceCell value={p.puServiceCompagnieDevise} isCurrency />
                    <PriceCell value={p.puPenaliteCompagnieDevise} isCurrency />

                    {/* Prix Compagnie Ariary */}
                    <PriceCell value={p.puBilletCompagnieAriary} className="font-medium text-emerald-700" />
                    <PriceCell value={p.puServiceCompagnieAriary} className="font-medium text-emerald-700" />
                    <PriceCell value={p.puPenaliteCompagnieAriary} className="font-medium text-emerald-700" />

                    {/* Prix Réservés Ariary */}
                    <PriceCell value={first.puResaBilletCompagnieAriary} className="font-medium text-indigo-700" />
                    <PriceCell value={first.puResaServiceCompagnieAriary} className="font-medium text-indigo-700" />
                    <PriceCell value={first.puResaPenaliteCompagnieAriary} className="font-medium text-indigo-700" />

                    {/* Actions */}
                    <td className="px-4 py-3 text-center space-x-2 min-w-[150px]">
                      {remainingToReserve > 0 && (
                        <button
                          onClick={() => handleOpenReservation(group.lignes.find(l => !l.reservation?.trim())!)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Réserver ({remainingToReserve})
                        </button>
                      )}

                      {remainingToEmit > 0 && billet?.statut !== 'CREER' && group.lignes.some(l => l.statut === 'FAIT') && (
                        <button
                          onClick={() => handleOpenEmission(group.lignes.find(l => l.statut === 'FAIT')!)}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                        >
                          Émettre ({remainingToEmit})
                        </button>
                      )}

                      {allEmitted && <span className="text-emerald-700 font-bold text-xs">TERMINÉ</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BilletTable;