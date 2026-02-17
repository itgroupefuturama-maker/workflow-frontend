import React from 'react';

interface ServiceTableProps {
  lignes: any[];
  groups: any[];
  serviceById: Map<string, any>; // Ta Map pour retrouver les libellés
  typeFilter: 'SERVICE' | 'SPECIFIQUE'; // Pour filtrer dynamiquement
}

const ServiceTable: React.FC<ServiceTableProps> = ({ 
  lignes, 
  groups, 
  serviceById, 
  typeFilter 
}) => {
  
  if (lignes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 italic">
        Aucune ligne enregistrée pour ce billet
      </div>
    );
  }

  // Style dynamique selon le type
  const isService = typeFilter === 'SERVICE';
  const badgeStyles = isService 
    ? "bg-blue-50 text-blue-800 border-blue-200" 
    : "bg-purple-50 text-purple-800 border-purple-200";

  return (
    <div className="bg-white overflow-hidden border border-slate-200">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">
          Lignes du {isService ? 'Service' : 'Spécifique'}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Vol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Itinéraire</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Classe</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wide">Éléments Spécifiques</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map((group) => {
              const { first } = group;
              const p = first.prospectionLigne;

              // Filtrage dynamique selon la prop typeFilter
              const specificServices = p.serviceProspectionLigne?.filter((s: any) => {
                const svc = serviceById.get(s.serviceSpecifiqueId);
                return s.valeur && s.valeur !== "false" && svc?.type === typeFilter;
              });

              return (
                <tr key={group.key} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{p.numeroVol || '—'}</td>
                  <td className="px-4 py-3 text-sm">{p.itineraire || '—'}</td>
                  <td className="px-4 py-3 text-sm">{p.classe || '—'}</td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap justify-end gap-1.5 max-w-[280px] ml-auto">
                      {specificServices && specificServices.length > 0 ? (
                        specificServices.map((s: any) => {
                          const svc = serviceById.get(s.serviceSpecifiqueId);
                          const libelle = svc?.libelle || "Inconnu";
                          const valeur = s.valeur;

                          return (
                            <span
                              key={s.id}
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 ${badgeStyles}`}
                            >
                              {libelle}
                              {valeur !== "true" && (
                                <span className="ml-1 opacity-80 text-[0.9em]">({valeur})</span>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 text-xs italic">Aucun élément spécifique</span>
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
  );
};

export default ServiceTable;