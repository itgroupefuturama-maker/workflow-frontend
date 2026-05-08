import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { createClientForm } from "../../../../../app/portail_client/clientFormSlice";
import type { ClientFormPayload } from "../../../../../app/portail_client/clientFormSlice";
import { X, Loader2, ChevronRight, ChevronLeft } from "lucide-react";

// ── Champs par section ──────────────────────────────────
const SECTIONS = [
  {
    title: "Identité",
    fields: [
      { name: "nom",           label: "Nom",              type: "text" },
      { name: "prenom",        label: "Prénom",           type: "text" },
      { name: "sexe",          label: "Sexe",             type: "text",  placeholder: "M / F" },
      { name: "dateNaissance", label: "Date de naissance",type: "date" },
      { name: "lieuNaissance", label: "Lieu de naissance",type: "text" },
      { name: "nationalite",   label: "Nationalité",      type: "text" },
      { name: "etatCivil",     label: "État civil",       type: "text" },
      { name: "numero",        label: "Téléphone",        type: "text" },
      { name: "email",         label: "Email",            type: "email" },
      { name: "adresse",       label: "Adresse",          type: "text" },
      { name: "paysResidence", label: "Pays de résidence",type: "text" },
    ],
  },
  {
    title: "Contact d'urgence",
    fields: [
      { name: "nomContactUrgence",    label: "Nom",      type: "text" },
      { name: "prenomContactUrgence", label: "Prénom",   type: "text" },
      { name: "numeroContactUrgence", label: "Téléphone",type: "text" },
      { name: "emailContactUrgence",  label: "Email",    type: "email" },
    ],
  },
  {
    title: "Profession",
    fields: [
      { name: "professionActuelle",   label: "Profession",     type: "text" },
      { name: "nomEmployeur",         label: "Employeur",      type: "text" },
      { name: "numeroTelephone",      label: "Téléphone pro",  type: "text" },
      { name: "emailProfessionnel",   label: "Email pro",      type: "email" },
      { name: "adresseProfessionnel", label: "Adresse pro",    type: "text" },
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
      { name: "typeDoc",          label: "Type de document",   type: "text", placeholder: "PASSEPORT / CNI" },
      { name: "referenceDoc",     label: "Référence",          type: "text" },
      { name: "dateDelivranceDoc",label: "Date de délivrance", type: "date" },
      { name: "dateValiditeDoc",  label: "Date de validité",   type: "date" },
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

interface Props {
  beneficiaireId: string;
  userId: string;
  onClose: () => void;
}

const AddBeneficiaireModal = ({ beneficiaireId, userId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.clientForm);

  console.log("userIdssssss", userId);

  const [form, setForm] = useState<ClientFormPayload>(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);

  const currentSection = SECTIONS[step];
  const isLast = step === SECTIONS.length - 1;
  const isFirst = step === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const result = await dispatch(createClientForm({ beneficiaireId: beneficiaireId!, userId: userId!, payload: form }));
    if (createClientForm.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouveau bénéficiaire</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Étape {step + 1} / {SECTIONS.length} — {currentSection.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 px-6 pt-4">
          {SECTIONS.map((s, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx <= step ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Succès */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-green-600">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <ChevronRight size={24} />
            </div>
            <p className="font-semibold text-gray-800">Bénéficiaire ajouté avec succès !</p>
          </div>
        ) : (
          <>
            {/* Champs */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      placeholder={placeholder || ""}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Erreur API */}
              {error && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                  <X size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={isFirst}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    "Soumettre"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddBeneficiaireModal;