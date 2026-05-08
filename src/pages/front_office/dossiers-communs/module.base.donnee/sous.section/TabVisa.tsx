import React, { useState } from "react";
import { User, FileText, Briefcase, GraduationCap, Phone } from "lucide-react";
import { Field } from "./atoms";
import type { ClientBeneficiaireDetail } from "../../../../../app/front_office/parametre_baseDonnee/clientBeneficiaireDetailSlice";

const TabVisa = ({ infos }: { infos: ClientBeneficiaireDetail["clientbeneficiaireInfo"] }) => {
  const [visaSubTab, setVisaSubTab] = useState<"infos" | "personnes">("infos");

  if (infos.length === 0) return (
    <div className="flex flex-col items-center py-16 text-gray-300">
      <User size={32} className="mb-3" />
      <p className="text-sm text-gray-400">Aucun dossier visa.</p>
    </div>
  );

  return (
    <div>
      {infos.map((info, idx) => {
        const form    = info.clientBeneficiaireForm;
        const persons = form?.clientBeneficiairePerson ?? [];

        return (
          <div key={info.id} className="bg-white overflow-hidden shadow-sm">

            {/* Header dossier */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                  {form?.prenom?.[0]}{form?.nom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{form?.prenom} {form?.nom}</p>
                  <p className="text-xs text-gray-400">{info.typeDoc} — {info.referenceDoc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  info.statut === "ACTIF" || info.statut === "CREER"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {info.statut}
                </span>
                {infos.length > 1 && <span className="text-xs text-gray-400">Dossier {idx + 1}</span>}
              </div>
            </div>

            {/* Stepper tabs */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-0">
                {[
                  { key: "infos",     label: "Informations" },
                  { key: "personnes", label: "Personnes liées", count: persons.length },
                ].map((tab, tabIdx) => {
                  const isActive = visaSubTab === tab.key;
                  return (
                    <React.Fragment key={tab.key}>
                      <button
                        onClick={() => setVisaSubTab(tab.key as "infos" | "personnes")}
                        className={`flex items-center gap-2 px-4 py-2 mr-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-white border border-gray-200 text-indigo-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600 bg-slate-100"
                        }`}
                      >
                        {/* <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                        }`}>
                          {tabIdx + 1}
                        </div> */}
                        {tab.label}
                        {/* {tab.count !== undefined && tab.count > 0 && (
                          <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {tab.count}
                          </span>
                        )} */}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Contenu Infos */}
            {visaSubTab === "infos" && form && (
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                      <User size={11} className="text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Identité</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field label="Prénom"            value={form.prenom} />
                    <Field label="Nom"               value={form.nom} />
                    <Field label="Sexe"              value={form.sexe} />
                    <Field label="État civil"        value={form.etatCivil} />
                    <Field label="Date de naissance" value={new Date(form.dateNaissance).toLocaleDateString("fr-FR")} />
                    <Field label="Lieu de naissance" value={form.lieuNaissance} />
                    <Field label="Nationalité"       value={form.nationalite} />
                    <Field label="Pays de résidence" value={form.paysResidence} />
                    <Field label="Téléphone"         value={form.numero} />
                    <Field label="Email"             value={form.email} />
                    <div className="col-span-2"><Field label="Adresse" value={form.adresse} /></div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                      <FileText size={11} className="text-amber-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Document d'identité</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field label="Type"            value={info.typeDoc} />
                    <Field label="Référence"       value={info.referenceDoc} />
                    <Field label="Date délivrance" value={new Date(info.dateDelivranceDoc).toLocaleDateString("fr-FR")} />
                    <Field label="Date validité"   value={new Date(info.dateValiditeDoc).toLocaleDateString("fr-FR")} />
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                        <Briefcase size={11} className="text-purple-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profession</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Profession"  value={form.professionActuelle} />
                      <Field label="Employeur"   value={form.nomEmployeur} />
                      <Field label="Tél. pro"    value={form.numeroTelephone} />
                      <Field label="Email pro"   value={form.emailProfessionnel} />
                      <div className="col-span-2"><Field label="Adresse pro" value={form.adresseProfessionnel} /></div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                          <GraduationCap size={11} className="text-green-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Formation</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Établissement" value={form.etablissement} />
                        <Field label="Diplôme"       value={form.diplome} />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
                          <Phone size={11} className="text-red-500" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact d'urgence</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Nom"       value={form.nomContactUrgence} />
                        <Field label="Prénom"    value={form.prenomContactUrgence} />
                        <Field label="Téléphone" value={form.numeroContactUrgence} />
                        <Field label="Email"     value={form.emailContactUrgence} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenu Personnes */}
            {visaSubTab === "personnes" && (
              <div className="p-6">
                {persons.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-300">
                    <User size={28} className="mb-2" />
                    <p className="text-xs text-gray-400">Aucune personne liée.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Nom complet", "Type", "Sexe", "Nationalité", "Date naissance", "Téléphone"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {persons.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                                  {p.prenom?.[0]}{p.nom?.[0]}
                                </div>
                                <span className="font-semibold text-gray-800">{p.prenom} {p.nom}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                p.typePerson === "CONJOINT" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {p.typePerson === "CONJOINT" ? "Conjoint(e)" : "Enfant"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">{p.sexe || "—"}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{p.nationalite || "—"}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{new Date(p.dateNaissance).toLocaleDateString("fr-FR")}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{p.numero || "—"}</td>
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

export default TabVisa;