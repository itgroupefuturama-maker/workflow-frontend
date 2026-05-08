import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { updateClientPerson } from "../../../../../app/portail_client/clientFormSlice";
import type { ClientBeneficiairePerson } from "../../../../../app/portail_client/clientFormSlice";
import { X, Loader2, CheckCircle } from "lucide-react";
import { useParams } from "react-router-dom";

const FIELDS: { name: string; label: string; type: string }[] = [
  { name: 'nom',           label: 'Nom',              type: 'text'  },
  { name: 'prenom',        label: 'Prénom',            type: 'text'  },
  { name: 'sexe',          label: 'Sexe (M / F)',      type: 'text'  },
  { name: 'dateNaissance', label: 'Date de naissance', type: 'date'  },
  { name: 'lieuNaissance', label: 'Lieu de naissance', type: 'text'  },
  { name: 'nationalite',   label: 'Nationalité',       type: 'text'  },
  { name: 'etatCivil',     label: 'État civil',        type: 'text'  },
  { name: 'numero',        label: 'Téléphone',         type: 'text'  },
  { name: 'email',         label: 'Email',             type: 'email' },
  { name: 'adresse',       label: 'Adresse',           type: 'text'  },
  { name: 'paysResidence', label: 'Pays de résidence', type: 'text'  },
];

// Formate une date ISO → "YYYY-MM-DD" pour <input type="date">
const toDateInput = (iso?: string) => iso?.slice(0, 10) ?? "";

const buildInitialForm = (p: ClientBeneficiairePerson) => ({
  nom:           p.nom           ?? "",
  prenom:        p.prenom        ?? "",
  sexe:          p.sexe          ?? "",
  dateNaissance: toDateInput(p.dateNaissance),
  lieuNaissance: p.lieuNaissance ?? "",
  nationalite:   p.nationalite   ?? "",
  etatCivil:     p.etatCivil     ?? "",
  numero:        p.numero        ?? "",
  email:         p.email         ?? "",
  adresse:       p.adresse       ?? "",
  paysResidence: p.paysResidence ?? "",
  typePerson:    p.typePerson,
});

interface Props {
  beneficiaireId: string;
  person: ClientBeneficiairePerson;
  onClose: () => void;
}

const EditPersonModal = ({ beneficiaireId, person, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.user);

  const [form, setForm]       = useState(buildInitialForm(person));
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaireId) return;

    const result = await dispatch(
      updateClientPerson({ beneficiaireId, id: person.id, payload: form })
    );
    if (updateClientPerson.fulfilled.match(result)) {
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
            <h2 className="text-lg font-bold text-gray-900">Modifier la personne</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {person.prenom} {person.nom}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">Personne mise à jour !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

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
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    />
                  </div>
                ))}
              </div>

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
                  <><Loader2 size={15} className="animate-spin" /> Envoi...</>
                ) : (
                  'Mettre à jour'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPersonModal;