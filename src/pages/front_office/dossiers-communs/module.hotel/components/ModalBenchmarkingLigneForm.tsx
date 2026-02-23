import React, { useState, useEffect } from 'react';
import { FiX, FiInfo, FiSave } from 'react-icons/fi';

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
    isRefundable: false,       // ← boolean dès le départ
    dateLimiteAnnulation: '',
  });

  // ── Calculs automatiques ──────────────────────────────────────
  useEffect(() => {
    const nuiteDevise   = parseFloat(form.nuiteDevise)   || 0;
    const tauxChange    = parseFloat(form.tauxChange)    || 0;
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

  // ── Handlers séparés pour text/select et checkbox ────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── FIX isRefundable : on gère le boolean directement ─────────
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, isRefundable: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hotel || !form.plateformeId || !form.typeChambreId || !form.nuiteDevise) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    onSubmit({
      benchmarkingEnteteId,
      hotel:               form.hotel.trim(),
      plateformeId:        form.plateformeId,
      typeChambreId:       form.typeChambreId,
      nuiteDevise:         Number(form.nuiteDevise),
      nombreChambre:       Number(form.nombreChambre)  || 1,
      nuiteAriary:         Number(form.nuiteAriary)    || 0,
      montantDevise:       Number(form.montantDevise)  || 0,
      montantAriary:       Number(form.montantAriary)  || 0,
      devise:              form.devise,
      tauxChange:          Number(form.tauxChange)     || 1,
      isRefundable:        form.isRefundable,           // ← boolean true/false
      dateLimiteAnnulation: form.dateLimiteAnnulation || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest">Benchmarking Hôtel</p>
              <h3 className="text-white font-bold text-lg mt-0.5">Nouvelle ligne</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-orange-200 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 bg-gray-50">

          {/* Section 1 — Identification */}
          <Section
            label="Identification"
            number="1"
            color="orange"
          >
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
                  {plateformes
                    .filter((p) => p.nom.toLowerCase().startsWith('platforme'))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.code} – {p.nom}</option>
                    ))
                  }
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
                    <option key={t.id} value={t.id}>{t.type} ({t.capacite} pers.)</option>
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

          {/* Section 2 — Tarif */}
          <Section label="Tarif en devise" number="2" color="blue">
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

            {/* Remboursable + Date limite */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── FIX : toggle switch au lieu du checkbox natif ── */}
              <Field label="Remboursable">
                <label className="inline-flex items-center gap-3 cursor-pointer mt-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isRefundable"
                      checked={form.isRefundable}
                      onChange={handleCheckbox}   // ← handleCheckbox, pas handleChange
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className={`text-sm font-semibold ${form.isRefundable ? 'text-green-600' : 'text-gray-400'}`}>
                    {form.isRefundable ? 'Oui' : 'Non'}
                  </span>
                </label>
              </Field>

              <Field label="Date limite d'annulation">
                <input
                  type="date"
                  name="dateLimiteAnnulation"
                  value={form.dateLimiteAnnulation}
                  onChange={handleChange}
                  disabled={!form.isRefundable}
                  className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed`}
                />
              </Field>
            </div>
          </Section>

          {/* Section 3 — Totaux */}
          <Section label="Totaux calculés automatiquement" number="3" color="emerald">
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
        </form>

        {/* ── Footer ── */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-orange-100"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Enregistrement...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Enregistrer la ligne
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Helpers ────────────────────────────────────────────────── */

const inputClass =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition';

const sectionColors = {
  orange:  { badge: 'bg-orange-500',  border: 'border-orange-200',  title: 'text-orange-600'  },
  blue:    { badge: 'bg-blue-500',    border: 'border-blue-200',    title: 'text-blue-600'    },
  emerald: { badge: 'bg-emerald-500', border: 'border-emerald-200', title: 'text-emerald-600' },
};

const Section = ({
  label,
  number,
  color = 'orange',
  children,
}: {
  label: string;
  number: string;
  color?: keyof typeof sectionColors;
  children: React.ReactNode;
}) => {
  const c = sectionColors[color];
  return (
    <div className={`bg-white rounded-xl border ${c.border} shadow-sm overflow-hidden`}>
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full ${c.badge} text-white text-xs flex items-center justify-center font-bold shrink-0`}>
          {number}
        </span>
        <h4 className={`text-xs font-bold uppercase tracking-wider ${c.title}`}>{label}</h4>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

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
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <span title={formula} className="text-gray-300 hover:text-gray-500 cursor-help transition-colors">
        <FiInfo size={12} />
      </span>
    </div>
    <div className="flex items-center gap-2 w-full border border-dashed border-emerald-200 rounded-xl px-3 py-2.5 bg-emerald-50">
      <span className="text-sm font-bold text-emerald-700 flex-1">
        {value
          ? Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : <span className="text-gray-300 font-normal">—</span>
        }
      </span>
      {suffix && (
        <span className="text-xs font-bold text-emerald-500 shrink-0">{suffix}</span>
      )}
    </div>
  </div>
);

export default ModalBenchmarkingLigneForm;