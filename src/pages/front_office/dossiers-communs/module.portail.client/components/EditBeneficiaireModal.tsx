import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { updateClientForm } from "../../../../../app/portail_client/clientFormSlice";
import type { ClientFormPayload, ClientBeneficiaireForm } from "../../../../../app/portail_client/clientFormSlice";
import { X, Loader2, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { useParams } from "react-router-dom";

// ── Réutilise exactement les mêmes SECTIONS que AddBeneficiaireModal ──
const SECTIONS = [
  {
    title: "Identité",
    fields: [
      { name: "nom",            label: "Nom",               type: "text" },
      { name: "prenom",         label: "Prénom",            type: "text" },
      { name: "sexe",           label: "Sexe",              type: "text", placeholder: "M / F" },
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
      { name: "typeDoc",           label: "Type de document",  type: "text", placeholder: "PASSEPORT / CNI" },
      { name: "referenceDoc",      label: "Référence",         type: "text" },
      { name: "dateDelivranceDoc", label: "Date de délivrance",type: "date" },
      { name: "dateValiditeDoc",   label: "Date de validité",  type: "date" },
    ],
  },
];

// ── Helper : formate une date ISO → "YYYY-MM-DD" pour <input type="date"> ──
const toDateInput = (iso?: string) => {
  if (!iso) return "";
  return iso.slice(0, 10); // "2024-03-07T00:00:00.000Z" → "2024-03-07"
};

// ── Construit le form initial depuis les données existantes ──
const buildInitialForm = (b: ClientBeneficiaireForm): ClientFormPayload => ({
  userId: b.userId,
  nom:                   b.nom               ?? "",
  prenom:                b.prenom            ?? "",
  sexe:                  b.sexe              ?? "",
  dateNaissance:         toDateInput(b.dateNaissance),
  lieuNaissance:         b.lieuNaissance     ?? "",
  nationalite:           b.nationalite       ?? "",
  etatCivil:             b.etatCivil         ?? "",
  numero:                b.numero            ?? "",
  email:                 b.email             ?? "",
  adresse:               b.adresse           ?? "",
  paysResidence:         b.paysResidence     ?? "",
  nomContactUrgence:     b.nomContactUrgence     ?? "",
  prenomContactUrgence:  b.prenomContactUrgence  ?? "",
  numeroContactUrgence:  b.numeroContactUrgence  ?? "",
  emailContactUrgence:   b.emailContactUrgence   ?? "",
  professionActuelle:    b.professionActuelle    ?? "",
  nomEmployeur:          b.nomEmployeur          ?? "",
  numeroTelephone:       b.numeroTelephone        ?? "",
  emailProfessionnel:    b.emailProfessionnel     ?? "",
  adresseProfessionnel:  b.adresseProfessionnel   ?? "",
  etablissement:         b.etablissement     ?? "",
  diplome:               b.diplome           ?? "",
  typeDoc:               b.typeDoc           ?? "",
  referenceDoc:          b.referenceDoc      ?? "",
  dateDelivranceDoc:     toDateInput(b.dateDelivranceDoc),
  dateValiditeDoc:       toDateInput(b.dateValiditeDoc),
});

interface Props {
  beneficiaire: ClientBeneficiaireForm; // données actuelles à pré-remplir
  onClose: () => void;
}

const EditBeneficiaireModal = ({ beneficiaire, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useParams<{ userId: string }>();
  const { loading, error } = useSelector((state: RootState) => state.user);

  const [form, setForm]       = useState<ClientFormPayload>(buildInitialForm(beneficiaire));
  const [step, setStep]       = useState(0);
  const [success, setSuccess] = useState(false);

  const currentSection = SECTIONS[step];
  const isLast  = step === SECTIONS.length - 1;
  const isFirst = step === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const result = await dispatch(
      updateClientForm({ userId: userId!, id: beneficiaire.id, payload: form })
    );
    if (updateClientForm.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Modifier le bénéficiaire</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Étape {step + 1} / {SECTIONS.length} — {currentSection.title}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 px-6 pt-4">
          {SECTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx <= step ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Succès */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-green-600">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <p className="font-semibold text-gray-800">Informations mises à jour !</p>
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
                      placeholder={placeholder ?? ""}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                  <X size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={isFirst}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} /> Précédent
              </button>

              {isLast ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Envoi...</>
                  ) : (
                    "Mettre à jour"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditBeneficiaireModal;