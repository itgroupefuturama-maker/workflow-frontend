import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  plateformes: Array<{ id: string; code: string; nom: string }>;
  typesChambre: Array<{ id: string; type: string; capacite: number }>;
  benchmarkingEnteteId: string;
  loading?: boolean;
};

const ModalBenchmarkingLigneForm: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  plateformes,
  typesChambre,
  benchmarkingEnteteId,
  loading = false,
}) => {
  const [form, setForm] = useState({
    hotel: '',
    plateformeId: '',
    typeChambreId: '',
    nuiteDevise: '',
    nombreChambre: '',
    nuiteAriary: '',
    montantDevise: '',
    montantAriary: '',
    devise: 'EUR',
    tauxChange: '',
  });

  // ── Calculs automatiques ──────────────────────────────────────
  useEffect(() => {
    const nuiteDevise  = parseFloat(form.nuiteDevise)  || 0;
    const tauxChange   = parseFloat(form.tauxChange)   || 0;
    const nombreChambre = parseFloat(form.nombreChambre) || 0;

    const nuiteAriary   = nuiteDevise * tauxChange;
    const montantDevise = nuiteDevise * nombreChambre;
    const montantAriary = nuiteAriary * nombreChambre;

    setForm((prev) => ({
      ...prev,
      nuiteAriary:   nuiteAriary   > 0 ? String(nuiteAriary)   : '',
      montantDevise: montantDevise > 0 ? String(montantDevise) : '',
      montantAriary: montantAriary > 0 ? String(montantAriary) : '',
    }));
  }, [form.nuiteDevise, form.tauxChange, form.nombreChambre]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hotel || !form.plateformeId || !form.typeChambreId || !form.nuiteDevise) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    onSubmit({
      benchmarkingEnteteId,
      hotel:          form.hotel.trim(),
      plateformeId:   form.plateformeId,
      typeChambreId:  form.typeChambreId,
      nuiteDevise:    Number(form.nuiteDevise),
      nombreChambre:  Number(form.nombreChambre)  || 1,
      nuiteAriary:    Number(form.nuiteAriary)    || 0,
      montantDevise:  Number(form.montantDevise)  || 0,
      montantAriary:  Number(form.montantAriary)  || 0,
      devise:         form.devise,
      tauxChange:     Number(form.tauxChange)     || 1,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Benchmarking</p>
            <h3 className="text-base font-semibold text-gray-800 mt-0.5">Nouvelle ligne</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="px-6 py-5">

          {/* Section : Identification */}
          <Section label="Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Hôtel" required>
                <input
                  type="text"
                  name="hotel"
                  value={form.hotel}
                  onChange={handleChange}
                  placeholder="Nom de l'hôtel"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Plateforme" required>
                <select
                  name="plateformeId"
                  value={form.plateformeId}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">— Choisir —</option>
                  {plateformes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} – {p.nom}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type de chambre" required>
                <select
                  name="typeChambreId"
                  value={form.typeChambreId}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">— Choisir —</option>
                  {typesChambre.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type} ({t.capacite} pers.)
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nombre de chambres">
                <input
                  type="number"
                  name="nombreChambre"
                  value={form.nombreChambre}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Divider />

          {/* Section : Tarif devise */}
          <Section label="Tarif en devise">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Devise">
                <select
                  name="devise"
                  value={form.devise}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="MGA">MGA</option>
                </select>
              </Field>

              <Field label="Nuit / Devise" required>
                <input
                  type="number"
                  name="nuiteDevise"
                  value={form.nuiteDevise}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Taux de change">
                <input
                  type="number"
                  name="tauxChange"
                  value={form.tauxChange}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Divider />

          {/* Section : Totaux calculés (lecture seule) */}
          <Section label="Totaux calculés automatiquement">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CalcField
                label="Nuit / Ariary"
                value={form.nuiteAriary}
                formula="Nuit Devise × Taux"
              />
              <CalcField
                label="Montant Devise"
                value={form.montantDevise}
                suffix={form.devise}
                formula="Nuit Devise × Nbre chambres"
              />
              <CalcField
                label="Montant Ariary"
                value={form.montantAriary}
                suffix="MGA"
                formula="Nuit Ariary × Nbre chambres"
              />
            </div>
          </Section>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              )}
              {loading ? 'Enregistrement...' : 'Enregistrer la ligne'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

/* ── Helpers ────────────────────────────────────────────────── */

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{label}</p>
    {children}
  </div>
);

const Divider = () => <div className="border-t border-gray-100 my-5" />;

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-gray-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/* Champ calculé : lecture seule avec formule en tooltip */
const CalcField = ({
  label,
  value,
  suffix,
  formula,
}: {
  label: string;
  value: string;
  suffix?: string;
  formula: string;
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <span
        title={formula}
        className="text-gray-300 hover:text-gray-500 cursor-help transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L8.2 8.4A1 1 0 009 10h.01A1 1 0 0010 9V7a1 1 0 00-1-1zm1 6a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      </span>
    </div>
    <div className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
      <span className="text-sm font-medium text-gray-700 flex-1">
        {value
          ? Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : <span className="text-gray-300">—</span>
        }
      </span>
      {suffix && (
        <span className="text-xs font-medium text-gray-400 shrink-0">{suffix}</span>
      )}
    </div>
  </div>
);

export default ModalBenchmarkingLigneForm;