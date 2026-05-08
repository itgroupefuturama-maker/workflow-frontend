import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { createClientPerson } from "../../../../../app/portail_client/clientFormSlice";
import type { ClientPersonPayload } from "../../../../../app/portail_client/clientFormSlice";
import { X, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

const EMPTY_FORM: Omit<ClientPersonPayload, 'clientBeneficiaireFormId'> = {
  nom: '',
  prenom: '',
  sexe: '',
  dateNaissance: '',
  lieuNaissance: '',
  nationalite: '',
  etatCivil: '',
  numero: '',
  email: '',
  adresse: '',
  paysResidence: '',
  typePerson: 'CONJOINT',
};

const FIELDS: { name: keyof typeof EMPTY_FORM; label: string; type: string }[] = [
  { name: 'nom',           label: 'Nom',               type: 'text'  },
  { name: 'prenom',        label: 'Prénom',             type: 'text'  },
  { name: 'sexe',          label: 'Sexe (M / F)',       type: 'text'  },
  { name: 'dateNaissance', label: 'Date de naissance',  type: 'date'  },
  { name: 'lieuNaissance', label: 'Lieu de naissance',  type: 'text'  },
  { name: 'nationalite',   label: 'Nationalité',        type: 'text'  },
  { name: 'etatCivil',     label: 'État civil',         type: 'text'  },
  { name: 'numero',        label: 'Téléphone',          type: 'text'  },
  { name: 'email',         label: 'Email',              type: 'email' },
  { name: 'adresse',       label: 'Adresse',            type: 'text'  },
  { name: 'paysResidence', label: 'Pays de résidence',  type: 'text'  },
];

interface Props {
  beneficiaireId: string;
  userId: string;
  beneficiaireNom: string;
  onClose: () => void;
}

const AddPersonModal = ({ beneficiaireId, userId, beneficiaireNom, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.clientForm);

  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const payload: ClientPersonPayload = {
      ...form,
      clientBeneficiaireFormId: beneficiaireId,
    };

    const result = await dispatch(createClientPerson({ beneficiaireId, userId, payload }));
    if (createClientPerson.fulfilled.match(result)) {
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
            <h2 className="text-lg font-bold text-gray-900">Ajouter une personne</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bénéficiaire — {beneficiaireNom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-green-600">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl font-bold">✓</div>
            <p className="font-semibold text-gray-800">Personne ajoutée avec succès !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

            {/* Champs */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Type de personne */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type de personne
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['CONJOINT', 'ENFANT'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, typePerson: type }))}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        form.typePerson === type
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {type === 'CONJOINT' ? '💍 Conjoint(e)' : '👶 Enfant'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autres champs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {FIELDS.map(({ name, label, type }) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={(form as any)[name]}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Erreur API */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                  <X size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-800 mr-4 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddPersonModal;