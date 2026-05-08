import { useState } from "react";
import { Shield } from "lucide-react";
import { InfoField, SubTab } from "./atoms";
import type { ClientBeneficiaireDetail } from "../../../../../app/front_office/parametre_baseDonnee/clientBeneficiaireDetailSlice";

const TabAssurance = ({ assuranceForms }: { assuranceForms: ClientBeneficiaireDetail["clientAssuranceForm"] }) => {
  const [assSubTab, setAssSubTab] = useState<"infos" | "lignes">("infos");

  if (assuranceForms.length === 0) return (
    <div className="flex flex-col items-center py-16 text-gray-300">
      <Shield size={32} className="mb-3" />
      <p className="text-sm text-gray-400">Aucun dossier assurance.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {assuranceForms.map((af, idx) => {
        const lignes = af.assurance ?? [];
        return (
          <div key={af.id} className="bg-white border border-gray-100 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                  {af.prenom?.[0]}{af.nom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{af.prenom} {af.nom}</p>
                  <p className="text-xs text-gray-400">Passport : {af.numeroPassport}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {lignes.length} ligne{lignes.length > 1 ? "s" : ""}
                </span>
                {assuranceForms.length > 1 && <span className="text-xs text-gray-400">Dossier {idx + 1}</span>}
              </div>
            </div>

            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <SubTab label="Informations"    active={assSubTab === "infos"}   onClick={() => setAssSubTab("infos")} />
              <SubTab label="Lignes assurance" active={assSubTab === "lignes"} onClick={() => setAssSubTab("lignes")} count={lignes.length} />
            </div>

            {assSubTab === "infos" && (
              <div className="p-5">
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <InfoField label="Nom"               value={af.nom} />
                  <InfoField label="Prénom"            value={af.prenom} />
                  <InfoField label="Date de naissance" value={new Date(af.dateNaissance).toLocaleDateString("fr-FR")} />
                  <InfoField label="Téléphone"         value={af.numero} />
                  <InfoField label="Email"             value={af.email} />
                  <InfoField label="N° Passport"       value={af.numeroPassport} />
                  <div className="col-span-3"><InfoField label="Adresse" value={af.adresse} /></div>
                </div>
              </div>
            )}

            {assSubTab === "lignes" && (
              <div className="p-5">
                {lignes.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-300">
                    <Shield size={28} className="mb-2" />
                    <p className="text-xs text-gray-400">Aucune ligne assurance.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Police", "Quittance", "Statut", "Taux change", "PU Assureur", "PU Client", "Commission"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {lignes.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600">{a.numeroPolice}</td>
                            <td className="px-4 py-3 font-mono text-indigo-600">{a.numeroQuittance}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                                a.statut === "FAIT" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}>{a.statut}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{a.tauxChangeFacture?.toLocaleString("fr-FR") ?? "—"} Ar</td>
                            <td className="px-4 py-3 text-gray-700">{a.puFactureAssureurAriary?.toLocaleString("fr-FR") ?? "—"} Ar</td>
                            <td className="px-4 py-3 text-gray-700">{a.puFactureClientAriary?.toLocaleString("fr-FR") ?? "—"} Ar</td>
                            <td className="px-4 py-3 font-semibold text-emerald-700">{a.commissionFactureAriary?.toLocaleString("fr-FR") ?? "—"} Ar</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabAssurance;