import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { createClientForm, createClientPerson } from "../../../../../app/portail_client/clientFormSlice";
import type { ClientFormPayload } from "../../../../../app/portail_client/clientFormSlice";
import { ChevronRight, ChevronLeft, Loader2, X, CheckCircle, User } from "lucide-react";
import { useParams } from "react-router-dom";

const SECTIONS = [
  {
    title: "Identité",
    fields: [
      { name: "nom",            label: "Nom",               type: "text" },
      { name: "prenom",         label: "Prénom",            type: "text" },
      { name: "sexe",           label: "Sexe",              type: "text",  placeholder: "M / F" },
      { name: "dateNaissance",  label: "Date de naissance", type: "date" },
      { name: "lieuNaissance",  label: "Lieu de naissance", type: "text" },
      { name: "nationalite",    label: "Nationalité",       type: "text" },
      { name: "etatCivil",      label: "État civil",        type: "text" },
      { name: "numero",         label: "Téléphone",         type: "text" },
      { name: "email",          label: "Email",             type: "email" },
      { name: "adresse",        label: "Adresse",           type: "text" },
      { name: "paysResidence",  label: "Pays de résidence", type: "text" },
    ],
  },
  {
    title: "Contact d'urgence",
    fields: [
      { name: "nomContactUrgence",    label: "Nom",       type: "text" },
      { name: "prenomContactUrgence", label: "Prénom",    type: "text" },
      { name: "numeroContactUrgence", label: "Téléphone", type: "text" },
      { name: "emailContactUrgence",  label: "Email",     type: "email" },
    ],
  },
  {
    title: "Profession",
    fields: [
      { name: "professionActuelle",   label: "Profession",    type: "text" },
      { name: "nomEmployeur",         label: "Employeur",     type: "text" },
      { name: "numeroTelephone",      label: "Téléphone pro", type: "text" },
      { name: "emailProfessionnel",   label: "Email pro",     type: "email" },
      { name: "adresseProfessionnel", label: "Adresse pro",   type: "text" },
    ],
  },
  {
    title: "Formation",
    fields: [
      { name: "etablissement", label: "Établissement", type: "text" },
      { name: "diplome",       label: "Diplôme",       type: "text" },
    ],
  },
  {
    title: "Document d'identité",
    fields: [
      { name: "typeDoc",           label: "Type de document",   type: "text", placeholder: "PASSEPORT / CNI" },
      { name: "referenceDoc",      label: "Référence",          type: "text" },
      { name: "dateDelivranceDoc", label: "Date de délivrance", type: "date" },
      { name: "dateValiditeDoc",   label: "Date de validité",   type: "date" },
    ],
  },
];

const EMPTY_FORM: ClientFormPayload = {
  nom: "", prenom: "", sexe: "", dateNaissance: "", lieuNaissance: "",
  nationalite: "", etatCivil: "", numero: "", email: "", adresse: "",
  paysResidence: "", nomContactUrgence: "", prenomContactUrgence: "",
  numeroContactUrgence: "", emailContactUrgence: "", professionActuelle: "",
  nomEmployeur: "", numeroTelephone: "", emailProfessionnel: "",
  adresseProfessionnel: "", etablissement: "", diplome: "", referenceDoc: "",
  typeDoc: "", dateDelivranceDoc: "", dateValiditeDoc: "",
};

// Convertir une date ISO en format date input (YYYY-MM-DD)
const toDateInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  return iso.split("T")[0];
};

interface Props {
  initialData?: Partial<ClientFormPayload>;
  prefillPersons?: Array<{
    nom: string;
    prenom: string;
    sexe: string;
    dateNaissance: string;
    lieuNaissance: string;
    nationalite: string;
    etatCivil: string;
    numero: string;
    email: string;
    adresse: string;
    paysResidence: string;
    typePerson: string;
  }>;
}

const InlineClientForm = ({ initialData, prefillPersons = [] }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useParams<{ userId: string }>();
  const { loading, error } = useSelector((s: RootState) => s.user);

  const [form,    setForm]    = useState<ClientFormPayload>({ ...EMPTY_FORM, ...initialData });
  const [step,    setStep]    = useState(0);
  const [success, setSuccess] = useState(false);
  const [creatingPersons, setCreatingPersons] = useState(false);

  const currentSection = SECTIONS[step];
  const isLast  = step === SECTIONS.length - 1;
  const isFirst = step === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // 1. Créer le formulaire principal
    const result = await dispatch(createClientForm({ userId: userId!, payload: form }));
    if (!createClientForm.fulfilled.match(result)) return;

    const newFormId = (result.payload as any)?.id;

    // 2. Si des personnes sont à pré-créer et qu'on a l'id du nouveau form
    if (prefillPersons.length > 0 && newFormId) {
      setCreatingPersons(true);
      for (const person of prefillPersons) {
        await dispatch(createClientPerson({
          userId: userId!,
          payload: {
            ...person,
            userId: userId!,
            dateNaissance: person.dateNaissance?.split('T')[0] ?? '',
            clientBeneficiaireFormId: newFormId,
          },
        }));
      }
      setCreatingPersons(false);
    }

    setSuccess(true);
  };

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Dossier soumis avec succès !</h3>
        <p className="text-sm text-gray-400">Vos informations ont été enregistrées.</p>
        {prefillPersons.length > 0 && (
          <p className="text-xs text-green-600 mt-2">
            ✓ {prefillPersons.length} personne(s) liée(s) importée(s) automatiquement
          </p>
        )}
      </div>
    );
  }

  // ── Loading création personnes ─────────────────────────────────────────────
  if (creatingPersons) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <Loader2 size={28} className="text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-600">
          Import des personnes liées en cours...
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {prefillPersons.length} personne(s) à importer
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header + Stepper — inchangé */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Étape {step + 1} / {SECTIONS.length} — {currentSection.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Complétez toutes les sections pour soumettre votre dossier
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            {Math.round(((step + 1) / SECTIONS.length) * 100)}%
          </span>
        </div>
        <div className="flex gap-1.5">
          {SECTIONS.map((s, idx) => (
            <div key={idx} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${
                idx < step   ? 'bg-green-500' :
                idx === step ? 'bg-blue-600'  : 'bg-gray-200'
              }`} />
              <span className={`text-[10px] font-medium truncate ${
                idx === step  ? 'text-blue-600'  :
                idx < step    ? 'text-green-600' : 'text-gray-400'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview personnes à importer — visible sur toutes les étapes */}
      {prefillPersons.length > 0 && (
        <div className="mx-6 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <User size={14} className="text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 mb-1">
              {prefillPersons.length} personne(s) liée(s) seront importées automatiquement
            </p>
            <div className="flex flex-wrap gap-2">
              {prefillPersons.map((p, i) => (
                <span key={i} className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded-full">
                  {p.typePerson === 'CONJOINT' ? '💍' : '👶'} {p.prenom} {p.nom}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Champs */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {currentSection.fields.map(({ name, label, type, placeholder }) => (
            <div key={name} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                placeholder={placeholder ?? ""}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
            <X size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={isFirst}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Envoi...</> : "Soumettre"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            Suivant <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineClientForm;