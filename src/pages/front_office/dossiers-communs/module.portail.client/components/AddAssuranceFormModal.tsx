import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { X, Loader2, UserPlus } from "lucide-react";
import { createClientAssuranceForm, type ClientAssuranceFormPayload } from "../../../../../app/portail_client/clientFormSlice";

interface Props {
  beneficiaireId: string;
  userId: string;
  onClose: () => void;
  initialData?: Partial<ClientAssuranceFormPayload>; // ← ajouter
}

const initialForm: ClientAssuranceFormPayload = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  numero: "",
  email: "",
  adresse: "",
  numeroPassport: "",
};

// ← EN DEHORS de AddAssuranceFormModal
const Field = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: keyof ClientAssuranceFormPayload;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
    />
  </div>
);


const AddAssuranceFormModal = ({ beneficiaireId, userId, onClose, initialData }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.clientForm);

  const [form, setForm] = useState<ClientAssuranceFormPayload>({
    ...initialForm,
    ...initialData, // ← fusionner avec les données pré-remplies
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const result = await dispatch(createClientAssuranceForm({beneficiaireId, userId, payload: form }));
    if (result.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Formulaire d'assurance</h2>
              <p className="text-xs text-gray-400">Renseignez les informations de l'assuré</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <Field label="Prénom"           name="prenom"        value={form.prenom}        onChange={handleChange} placeholder="John" />
            <Field label="Nom"              name="nom"            value={form.nom}           onChange={handleChange} placeholder="DOE" />
            <Field label="Date de naissance" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} type="date" />
            <Field label="Téléphone"        name="numero"         value={form.numero}        onChange={handleChange} placeholder="0123456789" />
            <Field label="Email"            name="email"          value={form.email}         onChange={handleChange} type="email" placeholder="john@example.com" />
            <Field label="N° Passport"      name="numeroPassport" value={form.numeroPassport} onChange={handleChange} placeholder="123456789" />
            <div className="col-span-2">
            <Field label="Adresse complète" name="adresse"      value={form.adresse}       onChange={handleChange} placeholder="1 rue de la Paix..." />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="mx-6 mb-4 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Enregistrer
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddAssuranceFormModal;