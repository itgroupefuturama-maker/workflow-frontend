import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDemandeClientAttributs } from '../../../../../app/front_office/parametre_specification/demandeClientAttributSlice';
import { createDemandeClientBatch } from '../../../../../app/front_office/parametre_specification/demandeClientSlice';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

type Field = {
  demandeClientAttributId: string;
  nom: string;
  valeur: string;
  isCustom: boolean;
};

type Props = {
  prestationId: string;
  numero: number;
  onSuccess?: () => void;
};

const emptyField = (): Field => ({
  demandeClientAttributId: '',
  nom: '',
  valeur: '',
  isCustom: false,
});

const FormulaireDemandeClientDropdown = ({ prestationId, numero, onSuccess }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: attributs, loading: loadingAttributs } = useSelector(
    (state: RootState) => state.demandeClientAttribut
  );
  const { creating } = useSelector((state: RootState) => state.demandeClient);

  const [fields, setFields] = useState<Field[]>([emptyField()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchDemandeClientAttributs());
  }, [dispatch]);

  // Réinitialise les champs quand on change d'onglet
  useEffect(() => {
    setFields([emptyField()]);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [numero]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAttributChange = (index: number, value: string) => {
    const updated = [...fields];
    if (value === '__custom__') {
      updated[index] = { demandeClientAttributId: '', nom: '', valeur: '', isCustom: true };
    } else if (value === '') {
      updated[index] = emptyField();
    } else {
      const found = attributs.find((a) => a.id === value);
      updated[index] = {
        demandeClientAttributId: value,
        nom: found?.nom ?? '',
        valeur: '',     // ← toujours vide, l'utilisateur saisit
        isCustom: false,
      };
    }
    setFields(updated);
  };

  const handleNomChange = (index: number, nom: string) => {
    const updated = [...fields];
    updated[index].nom = nom;
    setFields(updated);
  };

  const handleValeurChange = (index: number, valeur: string) => {
    const updated = [...fields];
    updated[index].valeur = valeur;
    setFields(updated);
  };

  const addField = () => setFields([...fields, emptyField()]);

  const removeField = (index: number) => {
    if (fields.length === 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  // ── Soumission ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Vérifier qu'au moins un champ est rempli
    const filled = fields.filter((f) => f.nom.trim() && f.valeur.trim());
    if (filled.length === 0) {
      setSubmitError('Ajoutez au moins un champ avec un nom et une valeur.');
      return;
    }

    // Vérifier les champs partiellement remplis
    const partial = fields.some(
      (f) => (f.nom.trim() && !f.valeur.trim()) || (!f.nom.trim() && f.valeur.trim())
    );
    if (partial) {
      setSubmitError('Certains champs sont incomplets (nom ou valeur manquant).');
      return;
    }

    const payload = {
      prestationId,
      numero,
      fields: filled.map((f) => ({
        demandeClientAttributId: f.demandeClientAttributId, // "" si custom
        nom: f.nom,
        valeur: f.valeur,
      })),
    };

    try {
      await dispatch(createDemandeClientBatch(payload)).unwrap();
      setFields([emptyField()]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      setSubmitError(err || 'Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3 bg-neutral-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
            Formulaire
          </p>
          <h3 className="text-sm font-bold text-white">
            Ajouter des éléments — Demande #{numero}
          </h3>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un champ
        </button>
      </div>

      {/* Champs */}
      <div className="divide-y divide-neutral-100">
        {fields.map((field, index) => (
          <div key={index} className="px-5 py-4 space-y-3">

            {/* Ligne numéro + supprimer */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Champ {index + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sélecteur attribut */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                Attribut
              </label>
              <div className="relative">
                <select
                  value={field.isCustom ? '__custom__' : field.demandeClientAttributId}
                  onChange={(e) => handleAttributChange(index, e.target.value)}
                  disabled={loadingAttributs}
                  className="w-full appearance-none border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 pr-8"
                >
                  <option value="">— Sélectionner un attribut —</option>
                  {attributs.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                  <option value="__custom__">✚ Nouvel attribut personnalisé</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Nom — lecture seule si attribut existant, éditable si custom */}
            {(field.demandeClientAttributId || field.isCustom) && (
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={field.nom}
                  onChange={(e) => handleNomChange(index, e.target.value)}
                  readOnly={!field.isCustom}
                  placeholder="Nom de l'attribut"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
                    field.isCustom
                      ? 'border-neutral-300 bg-white text-neutral-800'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed'
                  }`}
                />
              </div>
            )}

            {/* Valeur — toujours un input texte libre */}
            {(field.demandeClientAttributId || field.isCustom) && (
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Valeur
                </label>
                <input
                  type="text"
                  value={field.valeur}
                  onChange={(e) => handleValeurChange(index, e.target.value)}
                  placeholder="Saisir la valeur"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Erreur / succès */}
      {submitError && (
        <div className="mx-5 mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}
      {submitSuccess && (
        <div className="mx-5 mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-emerald-700">Demande #{numero} enregistrée !</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {fields.filter(f => f.nom && f.valeur).length} / {fields.length} champ(s) rempli(s)
        </p>
        <button
          type="submit"
          disabled={creating}
          className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            creating
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900 text-white hover:bg-neutral-700'
          }`}
        >
          {creating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            `Enregistrer la demande #${numero}`
          )}
        </button>
      </div>

    </form>
  );
};

export default FormulaireDemandeClientDropdown;