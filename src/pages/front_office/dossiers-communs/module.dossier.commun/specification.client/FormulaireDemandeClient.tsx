import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDemandeClientAttributs } from '../../../../../app/front_office/parametre_specification/demandeClientAttributSlice';
import { createDemandeClientBatch } from '../../../../../app/front_office/parametre_specification/demandeClientSlice';
import { Plus, Trash2, ChevronDown, Save } from 'lucide-react';

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

const FormulaireDemandeClientFormulaire = ({ prestationId, numero, onSuccess }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: attributs, loading: loadingAttributs } = useSelector(
    (state: RootState) => state.demandeClientAttribut
  );
  const { creating } = useSelector((state: RootState) => state.demandeClient);

  const [fields, setFields] = useState<Field[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 1. Charger les attributs au montage
  useEffect(() => {
    dispatch(fetchDemandeClientAttributs());
  }, [dispatch]);

  // 2. Initialiser le formulaire avec TOUS les attributs existants par défaut
  useEffect(() => {
    if (attributs.length > 0) {
      const initialFields: Field[] = attributs.map(attr => ({
        demandeClientAttributId: attr.id,
        nom: attr.nom,
        valeur: '',
        isCustom: false,
      }));
      setFields(initialFields);
    }
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [attributs, numero]);

  const handleValeurChange = (index: number, valeur: string) => {
    const updated = [...fields];
    updated[index].valeur = valeur;
    setFields(updated);
  };

  const handleNomCustomChange = (index: number, nom: string) => {
    const updated = [...fields];
    updated[index].nom = nom;
    setFields(updated);
  };

  // Ajouter un nouvel attribut depuis le dropdown du bas
  const addNewFieldFromDropdown = (value: string) => {
    if (value === '') return;

    if (value === '__custom__') {
      setFields([...fields, { demandeClientAttributId: '', nom: '', valeur: '', isCustom: true }]);
    } else {
      // Vérifier si déjà présent pour éviter les doublons inutiles
      if (fields.some(f => f.demandeClientAttributId === value)) return;
      
      const found = attributs.find((a) => a.id === value);
      if (found) {
        setFields([...fields, {
          demandeClientAttributId: found.id,
          nom: found.nom,
          valeur: '',
          isCustom: false,
        }]);
      }
    }
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // On ne garde que les champs où une valeur a été saisie
    const filled = fields.filter((f) => f.valeur.trim() !== '' && f.nom.trim() !== '');

    if (filled.length === 0) {
      setSubmitError('Veuillez remplir au moins une valeur.');
      return;
    }

    const payload = {
      prestationId,
      numero,
      fields: filled.map((f) => ({
        demandeClientAttributId: f.demandeClientAttributId || undefined,
        nom: f.nom,
        valeur: f.valeur,
      })),
    };

    try {
      await dispatch(createDemandeClientBatch(payload)).unwrap();
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err || 'Erreur lors de l’enregistrement');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Configuration Demande #{numero}
          </h3>
          <p className="text-[11px] text-slate-400">Saisissez les valeurs pour les attributs souhaités</p>
        </div>
        <Save className="w-4 h-4 text-slate-400" />
      </div>

      {/* Corps du formulaire */}
      <div className="p-0 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-neutral-100">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Attribut</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Valeur à saisir</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fields.map((field, index) => (
              <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3">
                  {field.isCustom ? (
                    <input
                      type="text"
                      value={field.nom}
                      onChange={(e) => handleNomCustomChange(index, e.target.value)}
                      placeholder="Nom de l'attribut..."
                      className="w-full text-sm font-semibold text-blue-600 bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{field.nom}</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={field.valeur}
                    onChange={(e) => handleValeurChange(index, e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Dropdown d'ajout en bas de liste */}
        <div className="p-4 bg-slate-50/50 border-t border-neutral-100">
          <div className="relative max-w-xs">
            <select
              onChange={(e) => {
                addNewFieldFromDropdown(e.target.value);
                e.target.value = ""; // Reset le select après choix
              }}
              className="w-full appearance-none pl-9 pr-8 py-2 text-xs font-semibold text-slate-600 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors focus:outline-none"
            >
              <option value="">+ Ajouter un autre champ...</option>
              <option value="__custom__" className="font-bold text-blue-600">✚ NOUVEL ATTRIBUT PERSONNALISÉ</option>
              <hr />
              {attributs
                .filter(attr => !fields.some(f => f.demandeClientAttributId === attr.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
              ))}
            </select>
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Footer fixe */}
      <div className="px-6 py-4 bg-white border-t border-neutral-200 flex items-center justify-between">
        <div className="flex flex-col">
            {submitError && <span className="text-[11px] text-red-500 font-medium">{submitError}</span>}
            {submitSuccess && <span className="text-[11px] text-emerald-500 font-bold">Enregistré avec succès !</span>}
            {!submitError && !submitSuccess && (
                <span className="text-[11px] text-slate-400">
                    {fields.filter(f => f.valeur).length} attribut(s) rempli(s)
                </span>
            )}
        </div>
        
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:bg-slate-300 transition-all shadow-md active:scale-95"
        >
          {creating ? "Enregistrement..." : `Valider la demande #${numero}`}
        </button>
      </div>
    </form>
  );
};

export default FormulaireDemandeClientFormulaire;