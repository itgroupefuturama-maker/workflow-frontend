import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  services: Array<{ id: string; service: string }>;
  enteteId: string;
  loading?: boolean;
};

// ─── Helper : calcul nuitées entre deux datetime ──────────────────────────────
// ─── Helper : calcul nuitées selon règle hôtelière ───────────────────────────
// Règle : une nuitée = bloc de 12h01 → 11h00 le lendemain
// - Arrivée avant 12h01 → compte dans la nuitée du jour précédent
// - Départ après 11h00  → déclenche une nuitée supplémentaire
const calculerNuites = (du: string, au: string): number => {
  if (!du || !au) return 0;

  const debut = new Date(du);
  const fin = new Date(au);

  if (fin <= debut) return 0;

  // ── Normaliser la date d'arrivée ──────────────────────────────────────────
  // Si l'heure d'arrivée est AVANT 12h01 → on recule au jour précédent à 12h01
  // (ex: arrivée le 16 juin à 10h → la nuitée a commencé le 15 juin à 12h01)
  const debutNormalise = new Date(debut);
  const heureDebut = debut.getHours() * 60 + debut.getMinutes(); // en minutes
  const MIDI = 12 * 60 + 1; // 12h01 en minutes

  if (heureDebut < MIDI) {
    // Arrivée avant 12h01 → nuitée du jour précédent
    debutNormalise.setDate(debutNormalise.getDate() - 1);
  }
  // On fixe à 12h01 pour comparer proprement
  debutNormalise.setHours(12, 1, 0, 0);

  // ── Normaliser la date de départ ──────────────────────────────────────────
  // Checkpoint de départ : 11h00 de chaque jour
  // Si l'heure de départ est APRES 11h00 → on avance au lendemain à 11h00
  // (ex: départ le 17 juin à 14h → checkout deadline était 11h → nuitée supp)
  const finNormalisee = new Date(fin);
  const heureFin = fin.getHours() * 60 + fin.getMinutes(); // en minutes
  const CHECKOUT = 11 * 60; // 11h00 en minutes

  if (heureFin > CHECKOUT) {
    // Départ après 11h → déclenche une nuitée supplémentaire
    finNormalisee.setDate(finNormalisee.getDate() + 1);
  }
  // On fixe à 11h00 pour comparer proprement
  finNormalisee.setHours(11, 0, 0, 0);

  // ── Calcul du nombre de nuitées ───────────────────────────────────────────
  // Chaque nuitée = 1 bloc de 12h01 → 11h00 = 22h59 = ~23h
  // On compte en jours calendaires entre les deux bornes normalisées
  const diffMs = finNormalisee.getTime() - debutNormalise.getTime();
  if (diffMs <= 0) return 0;

  // Un bloc nuitée = 23h * 60 * 60 * 1000 ms (de 12h01 à 11h00 = 22h59 ≈ 23h)
  const BLOC_MS = 23 * 60 * 60 * 1000;
  return Math.round(diffMs / BLOC_MS);
};

const ModalBenchmarkingForm: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  services,
  enteteId,
  loading = false,
}) => {
  const [form, setForm] = useState({
    numero: '',
    du: '',
    au: '',
    nuite: '',
    pays: 'Madagascar',
    ville: 'Antananarivo',
    serviceHotelIds: [] as string[],
  });

  // ─── Calcul automatique nuitées ───────────────────────────────────────────
  useEffect(() => {
    const n = calculerNuites(form.du, form.au);
    if (n > 0) setForm((prev) => ({ ...prev, nuite: String(n) }));
  }, [form.du, form.au]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      serviceHotelIds: checked
        ? [...prev.serviceHotelIds, value]
        : prev.serviceHotelIds.filter((id) => id !== value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero || !form.du || !form.au || !form.nuite) {
      return;
    }
    onSubmit({
      ...form,
      hotelProspectionEnteteId: enteteId,
      nuite: Number(form.nuite),
      du: new Date(form.du).toISOString(),
      au: new Date(form.au).toISOString(),
    });
  };

  const nuiteesCalculees = calculerNuites(form.du, form.au);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gray-950 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-0.5">Création</p>
            <h3 className="text-white font-bold text-base tracking-wide">Nouveau Benchmarking</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-gray-50">
          <div className="p-6 space-y-5">

            {/* Erreur champs vides */}
            {/* Section : Identification */}
            <Section label="Identification">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Numéro" required>
                  <input
                    type="text"
                    name="numero"
                    value={form.numero}
                    onChange={handleChange}
                    placeholder="BM-001"
                    className={inputClass}
                    required
                  />
                </Field>

                
              </div>
            </Section>

            <Divider />

            {/* Section : Période */}
            <Section label="Période">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Date et heure de début" required>
                  <input
                    type="datetime-local"
                    name="du"
                    value={form.du}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </Field>

                <Field label="Date et heure de fin" required>
                  <input
                    type="datetime-local"
                    name="au"
                    value={form.au}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </Field>
              </div>

              <Field
                  label="Nuitées"
                  required
                  hint={nuiteesCalculees > 0 ? `calculées auto : ${nuiteesCalculees} nuit${nuiteesCalculees > 1 ? 's' : ''}` : undefined}
                >
                  <input
                    type="number"
                    name="nuite"
                    value={form.nuite}
                    onChange={handleChange}
                    min="1"
                    placeholder="0"
                    className={inputClass}
                    required
                  />
                </Field>

              {/* Récapitulatif période */}
              {form.du && form.au && nuiteesCalculees > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Du <strong className="text-gray-700">{new Date(form.du).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                    {' '}au <strong className="text-gray-700">{new Date(form.au).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                    {' '}— <strong className="text-gray-700">{nuiteesCalculees} nuit{nuiteesCalculees > 1 ? 's' : ''}</strong>
                  </span>
                </div>
              )}

              {/* Alerte date invalide */}
              {form.du && form.au && nuiteesCalculees <= 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  La date de fin doit être postérieure à la date de début
                </div>
              )}
            </Section>

            <Divider />

            {/* Section : Localisation */}
            <Section label="Localisation">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Pays">
                  <input
                    type="text"
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
                <Field label="Ville">
                  <input
                    type="text"
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            <Divider />

            {/* Section : Services */}
            <Section label="Services inclus">
              {services.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aucun service disponible.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 grid grid-cols-2 gap-1.5">
                  {services.map((s) => {
                    const checked = form.serviceHotelIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                          checked
                            ? 'bg-gray-950 text-white'
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={s.id}
                          checked={checked}
                          onChange={handleServicesChange}
                          className="w-4 h-4 accent-white rounded shrink-0"
                        />
                        <span className="truncate">{s.service}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {form.serviceHotelIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {form.serviceHotelIds.length} service{form.serviceHotelIds.length > 1 ? 's' : ''} sélectionné{form.serviceHotelIds.length > 1 ? 's' : ''}
                </p>
              )}
            </Section>
          </div>

          {/* ── Footer ── */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || nuiteesCalculees <= 0}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gray-950 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
    {children}
  </div>
);

const Divider = () => <div className="border-t border-gray-100" />;

const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-gray-300 ml-0.5">*</span>}
      {hint && <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">({hint})</span>}
    </label>
    {children}
  </div>
);

export default ModalBenchmarkingForm;