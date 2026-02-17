import React, { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  services: Array<{ id: string; service: string }>;
  enteteId: string;
  loading?: boolean;
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
      alert('Veuillez remplir les champs obligatoires');
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Création</p>
            <h3 className="text-base font-semibold text-gray-800 mt-0.5">Nouveau Benchmarking</h3>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">

          {/* Section : Identification */}
          <Section label="Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Numéro" required>
                <input
                  type="text"
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  placeholder="Ex : BM-001"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Nombre de nuits" required>
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
            </div>
          </Section>

          <Divider />

          {/* Section : Période */}
          <Section label="Période">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date de début" required>
                <input
                  type="date"
                  name="du"
                  value={form.du}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Date de fin" required>
                <input
                  type="date"
                  name="au"
                  value={form.au}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </Field>
            </div>
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
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 grid grid-cols-2 gap-2">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900 group"
                  >
                    <input
                      type="checkbox"
                      value={s.id}
                      checked={form.serviceHotelIds.includes(s.id)}
                      onChange={handleServicesChange}
                      className="w-4 h-4 accent-gray-700 rounded"
                    />
                    <span>{s.service}</span>
                  </label>
                ))}
              </div>
            )}
          </Section>

          {/* Footer */}
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
              {loading ? 'Création...' : 'Créer'}
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

export default ModalBenchmarkingForm;