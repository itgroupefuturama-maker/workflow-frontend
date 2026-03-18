import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import {
  Loader2, AlertCircle, ArrowLeft, User, FileText,
  Shield, Phone, Briefcase, GraduationCap, ChevronRight
} from "lucide-react";
import { fetchClientBeneficiaireDetail } from "../../../../../app/front_office/parametre_baseDonnee/clientBeneficiaireDetailSlice";
import React from "react";

/* ── Atoms ── */
const InfoField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 min-h-[36px]">
      {value || <span className="text-gray-300">—</span>}
    </div>
  </div>
);

const Tab = ({
  label, icon, active, onClick, count
}: {
  label: string; icon?: string; active: boolean; onClick: () => void; count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-10 py-2 text-sm rounded-tl-xl rounded-tr-xl font-medium transition-all duration-150 border-0 outline-none cursor-pointer
      ${active
        ? "bg-white text-indigo-600 shadow-[0_1px_4px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(79,70,229,0.18)]"
        : "bg-transparent text-gray-400 hover:bg-white/50 hover:text-gray-700"
      }`}
      
  >
    {icon && <span className="text-[15px]">{icon}</span>}
    {label}
    {count !== undefined && (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
        active ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400"
      }`}>
        {count}
      </span>
    )}
  </button>
);

const SubTab = ({
  label, active, onClick, count
}: {
  label: string; active: boolean; onClick: () => void; count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active
        ? "bg-indigo-600 text-white"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
      }`}>
        {count}
      </span>
    )}
  </button>
);

/* ── Page ── */
const PageDetailClient = () => {
  const { clientId } = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.clientBeneficiaireDetail);

  const [mainTab,    setMainTab]    = useState<"visa" | "assurance">("visa");
  const [visaSubTab, setVisaSubTab] = useState<"infos" | "personnes">("infos");
  const [assSubTab,  setAssSubTab]  = useState<"infos" | "lignes">("infos");

  useEffect(() => {
    if (clientId) dispatch(fetchClientBeneficiaireDetail(clientId));
  }, [clientId, dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-indigo-500" />
      <span className="text-sm">Chargement...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-96 gap-3 text-red-400">
      <AlertCircle size={20} />
      <span className="text-sm">{error || "Données introuvables."}</span>
    </div>
  );

  const infos          = data.clientbeneficiaireInfo;
  const assuranceForms = data.clientAssuranceForm ?? [];

  /* ── Agrège toutes les personnes liées ── */
  const allPersons = infos.flatMap(i => i.clientBeneficiaireForm?.clientBeneficiairePerson ?? []);
  // const allLignes  = assuranceForms.flatMap(af => af.assurance ?? []);

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate(-1)}>
                Base de données
              </span>
              <ChevronRight size={12} />
              <span className="text-gray-700 font-semibold">{data.libelle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{data.code}</span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              data.statut === "ACTIF"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}>
              {data.statut}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6 space-y-5">
          {/* ── Bannière compacte ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 text-lg font-bold flex items-center justify-center shrink-0">
              {data.libelle?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{data.libelle}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">
                  Créé le {new Date(data.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">
                  Application : {new Date(data.dateApplication).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            {/* Stats rapides */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 bg-indigo-50 rounded-xl">
                <p className="text-lg font-bold text-indigo-700">{infos.length}</p>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Dossier(s) visa</p>
              </div>
              <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl">
                <p className="text-lg font-bold text-emerald-700">{assuranceForms.length}</p>
                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Dossier(s) assurance</p>
              </div>
              <div className="text-center px-4 py-2 bg-purple-50 rounded-xl">
                <p className="text-lg font-bold text-purple-700">{allPersons.length}</p>
                <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">Personne(s) liée(s)</p>
              </div>
            </div>
          </div>

          {/* ── Onglets principaux ── */}
          <div className="">

            {/* Tab bar */}
            <div className="flex items-center border-b border-slate-300">
              <Tab
                label="Visa"
                active={mainTab === "visa"}
                onClick={() => setMainTab("visa")}
                count={infos.length}
              />
              <Tab
                label="Assurance"
                active={mainTab === "assurance"}
                onClick={() => setMainTab("assurance")}
                count={assuranceForms.length}
              />
            </div>

            {/* ── Contenu onglet VISA ── */}
            {mainTab === "visa" && (
              <div className="mt-2 space-y-5 p-2">
                {infos.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-gray-300">
                    <User size={32} className="mb-3" />
                    <p className="text-sm text-gray-400">Aucun dossier visa.</p>
                  </div>
                ) : infos.map((info, idx) => {
                  const form    = info.clientBeneficiaireForm;
                  const persons = form?.clientBeneficiairePerson ?? [];

                  return (
                    <div key={info.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                      {/* ── Header dossier ── */}
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
                          {infos.length > 1 && (
                            <span className="text-xs text-gray-400">Dossier {idx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* ── Stepper tabs ── */}
                      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-0">
                          {[
                            { key: 'infos',     label: 'Informations',    icon: <User size={13} /> },
                            { key: 'personnes', label: 'Personnes liées', icon: <User size={13} />, count: persons.length },
                          ].map((tab, tabIdx) => {
                            const isActive = visaSubTab === tab.key;
                            const isDone   = tabIdx === 0 && visaSubTab === 'personnes';
                            return (
                              <React.Fragment key={tab.key}>
                                <button
                                  onClick={() => setVisaSubTab(tab.key as any)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'bg-white border border-gray-200 text-indigo-600 shadow-sm'
                                      : isDone
                                      ? 'text-emerald-600'
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isActive  ? 'bg-indigo-600 text-white' :
                                    isDone    ? 'bg-emerald-500 text-white' :
                                                'bg-gray-200 text-gray-500'
                                  }`}>
                                    {isDone ? '✓' : tabIdx + 1}
                                  </div>
                                  {tab.label}
                                  {tab.count !== undefined && tab.count > 0 && (
                                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                      {tab.count}
                                    </span>
                                  )}
                                </button>
                                {tabIdx < 1 && (
                                  <div className="flex-1 h-px bg-gray-200 mx-2 max-w-[40px]" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Contenu : Infos ── */}
                      {visaSubTab === "infos" && form && (
                        <div className="p-6 space-y-6">

                          {/* Identité */}
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
                              <div className="col-span-2">
                                <Field label="Adresse" value={form.adresse} />
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100" />

                          {/* Document */}
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

                          {/* Profession */}
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
                                <div className="col-span-2">
                                  <Field label="Adresse pro" value={form.adresseProfessionnel} />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-5">
                              {/* Formation */}
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

                      {/* ── Contenu : Personnes liées ── */}
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
                                    {["Nom complet","Type","Sexe","Nationalité","Date naissance","Téléphone"].map(h => (
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
                                          p.typePerson === "CONJOINT"
                                            ? "bg-purple-50 text-purple-700"
                                            : "bg-blue-50 text-blue-700"
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
            )}

            {/* ── Contenu onglet ASSURANCE ── */}
            {mainTab === "assurance" && (
              <div className="mt-2 space-y-5 p-2">

                {assuranceForms.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-gray-300">
                    <Shield size={32} className="mb-3" />
                    <p className="text-sm text-gray-400">Aucun dossier assurance.</p>
                  </div>
                ) : assuranceForms.map((af, idx) => {
                  const lignes = af.assurance ?? [];

                  return (
                    <div key={af.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">

                      {/* En-tête */}
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
                            {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                          </span>
                          {assuranceForms.length > 1 && (
                            <span className="text-xs text-gray-400">Dossier {idx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Sous-onglets */}
                      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                        <SubTab
                          label="Informations"
                          active={assSubTab === "infos"}
                          onClick={() => setAssSubTab("infos")}
                        />
                        <SubTab
                          label="Lignes assurance"
                          active={assSubTab === "lignes"}
                          onClick={() => setAssSubTab("lignes")}
                          count={lignes.length}
                        />
                      </div>

                      {/* Sous-onglet : Infos assurance */}
                      {assSubTab === "infos" && (
                        <div className="p-5">
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <InfoField label="Nom"              value={af.nom} />
                            <InfoField label="Prénom"           value={af.prenom} />
                            <InfoField label="Date de naissance" value={new Date(af.dateNaissance).toLocaleDateString("fr-FR")} />
                            <InfoField label="Téléphone"        value={af.numero} />
                            <InfoField label="Email"            value={af.email} />
                            <InfoField label="N° Passport"      value={af.numeroPassport} />
                            <div className="col-span-3">
                              <InfoField label="Adresse" value={af.adresse} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sous-onglet : Lignes assurance */}
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
                                    {["Police","Quittance","Statut","Taux change","PU Assureur","PU Client","Commission"].map(h => (
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
                                          a.statut === "FAIT"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-amber-50 text-amber-700"
                                        }`}>{a.statut}</span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-600">
                                        {a.tauxChangeFacture?.toLocaleString("fr-FR") ?? '—'} Ar
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {a.puFactureAssureurAriary?.toLocaleString("fr-FR") ?? '—'} Ar
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {a.puFactureClientAriary?.toLocaleString("fr-FR") ?? '—'} Ar
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-emerald-700">
                                        {a.commissionFactureAriary?.toLocaleString("fr-FR") ?? '—'} Ar
                                      </td>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageDetailClient;