import React, { useState } from 'react';
import type { BilletLigne, ServiceProspectionLigne, ServiceSpecifique } from '../../../../../app/front_office/billetSlice';
import { FiFilter, FiX } from 'react-icons/fi';

// --- Sous-composant pour les cellules de prix (évite la répétition et les erreurs de rendu) ---
const PriceCell = ({ value, isCurrency = false, className = "" }: { value: number, isCurrency?: boolean, className?: string }) => (
  <td className={`px-4 py-3 text-right ${className}`}>
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
  handleReprogrammer: (ligne: BilletLigne) => void;   // ← CHANGEMENT ICI : une seule ligne
  handleRemove: (ligne: BilletLigne) => void;
  serviceById: Map<string, ServiceSpecifique>;
}

// ────────────────────────────────────────────────
// Sous-composant pour afficher les services spécifiques
// ────────────────────────────────────────────────
const ServicesSpecifiquesCell = ({
  services,
  serviceById,
}: {
  services: ServiceProspectionLigne[] | undefined;
  serviceById: Map<string, ServiceSpecifique>;
}) => {
  if (!services || services.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  return (
    <div className="flex flex-row gap-1">
      {services.map((svc) => {
      const serviceDef = serviceById.get(svc.serviceSpecifiqueId);
      // console.log(
      //   `Recherche service pour ID: ${svc.serviceSpecifiqueId} → trouvé ? `,
      //   !!serviceDef,
      //   serviceDef?.libelle || "(non trouvé)"
      // );

      const displayName = serviceDef?.libelle 
        ? serviceDef.libelle 
        : `Svc (${svc.serviceSpecifiqueId.slice(-6)})`;

        return (
          <span
            key={svc.id}
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200"
            title={`ID: ${svc.serviceSpecifiqueId}`}
          >
            {displayName}: {svc.valeur === 'true' ? 'Oui' : svc.valeur === 'false' ? 'Non' : svc.valeur}
          </span>
        );
      })}
    </div>
  );
};


const BilletTable: React.FC<BilletTableProps> = ({
  lignes,
  groups,
  billet,
  handleOpenReservation,
  handleOpenEmission,
  handleReprogrammer,
  handleRemove,
  serviceById,
}) => {
  const [sortOriginAsc, setSortOriginAsc] = useState(true);

  // On trie les lignes (copie pour ne pas muter la prop)
  const sortedLignes = [...lignes].sort((a, b) => {
    const valA = (a.referenceLine || '').toString().trim().toLowerCase();
    const valB = (b.referenceLine || '').toString().trim().toLowerCase();
    
    if (valA < valB) return sortOriginAsc ? -1 : 1;
    if (valA > valB) return sortOriginAsc ? 1 : -1;
    return 0;
  });

  const toggleSortOrigin = () => {
    setSortOriginAsc(prev => !prev);
  };

  if (lignes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucune ligne enregistrée pour ce billet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-white overflow-hidden border border-slate-200">
        {/* Titre + icône filtre */}
        <div className="border-b pl-5 pr-5 pb-1.5 pt-1.5 border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            Lignes du billet
          </h2>
          <button
              onClick={toggleSortOrigin}
              className="bg-slate-100 p-4 rounded-2xl text-slate-500 hover:text-slate-700 transition-colors"
              title="Trier par Origin Ligne (cliquer pour inverser)"
            >
              <FiFilter size={18} />
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs">
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase w-12">N°</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Origin Ligne</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Fournisseur</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">N° Réservation</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Avion</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">N° Vol</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Compagnie</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Itinéraire</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Classe</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Type passager</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Date départ</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Date arrivée</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Durée Vol</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Durée Escale</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Statut ligne</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Nb pers.</th>

                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">Taux de change</th>
                {/* Headers Prix Compagnie */}
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Billet Compagnie Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Service Compagnie Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Pén. Compagnie Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Billet Compagnie Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Service Compagnie Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Pén. Compagnie Ar</th>
                {/* Header Prix Client */}
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Billet Client Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Service Client Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Pén. Client Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Billet Client Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Service Client Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Pén. Client Ar</th>
                {/* Headers Prix Montant Compagnie */}
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Billet Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Svc Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Pén. Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Billet Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Svc Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Pén. Ar</th>
                {/* Headers Prix Montant Client */}
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Client Billet Devise </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Client Svc Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">PU Montant Client Pén. Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Client Billet Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Client Svc Ar</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700 uppercase">PU Montant Client Pén. Ar</th>

                {/* Headers Prix Montant Réservés */}
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">PU Montant Billet Resa</th>
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">PU Montant Svc Resa</th>
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">PU Montant Pén. Resa</th>
                {/* Headers Prix Commission */}
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">Commission En Devise</th>
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">Commission En Ariary</th>
                {/* Headers Annulation */}
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">Condition Modif</th>
                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">Condition Annulation</th>

                <th className="px-4 py-3 text-right font-semibold text-indigo-700 uppercase">Service Spécifique</th>

                <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase">Actions</th>
              </tr>

            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLignes.map((ligne, index) => {
                const p = ligne.prospectionLigne;
                const fournisseurLibelle = billet?.prospectionEntete?.fournisseur?.libelle || '—';

                // Calculs simples par ligne (plus de group)
                const isReserved = !!ligne.reservation?.trim();
                const isEmitted  = ligne.statut === 'CLOTURER';
                const canReserve = !isReserved && !['MODIFIER', 'ANNULER', 'FAIT'].includes(ligne.statut || '');
                const canEmit    = ligne.statut === 'FAIT' && billet?.statut !== 'CREER';
                const isAnnulerDisabled = 
                  ['ANNULER', 'CLOTURER', 'MODIFIER', 'CREER'].includes(ligne.statut) || 
                  ligne.statutligne === 'ANNULATION' || 
                  ligne.statusLigne === 'ANNULATION'; // Au cas où il y a un 's'

                return (
                    <tr key={ligne.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {ligne.referenceLine}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {ligne.reservation || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium">{p?.avion || '—'}</td>
                      <td className="px-4 py-3 font-medium">{p?.numeroVol || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                      <td className="px-4 py-3">{p?.itineraire || '—'}</td>
                      <td className="px-4 py-3">{p?.classe || '—'}</td>
                      <td className="px-4 py-3">{p?.typePassager || '—'}</td>

                      <td className="px-4 py-3 text-center">
                        {p?.dateHeureDepart 
                          ? new Date(p.dateHeureDepart).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p?.dateHeureArrive 
                          ? new Date(p.dateHeureArrive).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>

                      <td className="px-4 py-3">{p?.dureeVol || '—'}</td>
                      <td className="px-4 py-3">{p?.dureeEscale || '—'}</td>

                      {/* Statut Ligne détaillée */}
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {ligne.statusLigne || '—'}
                      </td>

                      <td className="px-4 py-3 text-center font-medium">{ligne.billet?.length || '—'}</td>

                      {/* Taux de change */}
                      <td className="px-4 py-3 text-center font-medium">{ligne.resaTauxEchange || '—'}</td>

                      {/* PU Montant Compagnie */}
                      <PriceCell value={ligne.puResaBilletCompagnieDevise} isCurrency />
                      <PriceCell value={ligne.puResaServiceCompagnieDevise} isCurrency />
                      <PriceCell value={ligne.puResaPenaliteCompagnieDevise} isCurrency />
                      <PriceCell value={ligne.puResaBilletCompagnieAriary} isCurrency />
                      <PriceCell value={ligne.puResaServiceCompagnieAriary} isCurrency />
                      <PriceCell value={ligne.puResaPenaliteCompagnieAriary} isCurrency />

                      {/* PU Montant Client */}
                      <PriceCell value={ligne.puResaBilletClientDevise} isCurrency />
                      <PriceCell value={ligne.puResaServiceClientDevise} isCurrency />
                      <PriceCell value={ligne.puResaPenaliteClientDevise} isCurrency />
                      <PriceCell value={ligne.puResaBilletClientAriary} isCurrency />
                      <PriceCell value={ligne.puResaServiceClientAriary} isCurrency />
                      <PriceCell value={ligne.puResaPenaliteClientAriary} isCurrency />

                      {/* Prix Compagnie Devise */}
                      <PriceCell value={ligne.puResaMontantBilletCompagnieDevise} isCurrency />
                      <PriceCell value={ligne.puResaMontantServiceCompagnieDevise} isCurrency />
                      <PriceCell value={ligne.puResaMontantPenaliteCompagnieDevise} isCurrency />

                      {/* Prix Compagnie Ariary */}
                      <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-emerald-700" />
                      <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-emerald-700" />
                      <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-emerald-700" />

                      {/* Prix Client Devise */}
                      <PriceCell value={ligne.puResaMontantBilletClientDevise} isCurrency />
                      <PriceCell value={ligne.puResaMontantServiceClientDevise} isCurrency />
                      <PriceCell value={ligne.puResaMontantPenaliteClientDevise} isCurrency />

                      {/* Prix Client Ariary */}
                      <PriceCell value={ligne.puResaMontantBilletClientAriary} className="font-medium text-emerald-700" />
                      <PriceCell value={ligne.puResaMontantServiceClientAriary} className="font-medium text-emerald-700" />
                      <PriceCell value={ligne.puResaMontantPenaliteClientAriary} className="font-medium text-emerald-700" />


                      {/* Prix Réservés Ariary */}
                      <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-indigo-700" />
                      <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-indigo-700" />
                      <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-indigo-700" />

                       {/* Prix Commission */}
                      <PriceCell value={ligne.resaCommissionEnDevise} className="font-medium text-indigo-700" />
                      <PriceCell value={ligne.resaCommissionEnAriary} className="font-medium text-indigo-700" />
                      
                      <td className="px-4 py-3">{p.conditionModif || '—'}</td>
                      <td className="px-4 py-3">{p.conditionAnnulation || '—'}</td>

                      <td className="px-4 py-3">
                        <ServicesSpecifiquesCell 
                          services={ligne.prospectionLigne?.serviceProspectionLigne} 
                          serviceById={serviceById} 
                        />
                      </td>

                      <td className="px-4 py-3 text-center min-w-[220px]">
                        <div className="flex items-center justify-center gap-2 flex-wrap">

                          {canReserve && (
                            <button
                              onClick={() => handleOpenReservation(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Réserver
                            </button>
                          )}

                          {canEmit&& (
                            <button
                              onClick={() => handleOpenEmission(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                              </svg>
                              Émettre
                            </button>
                          )}

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleReprogrammer(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Modifier
                          </button>

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleRemove(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <FiX size={14} />
                            Annuler
                          </button>

                          {isEmitted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              TERMINÉ
                            </span>
                          )}
                        </div>
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