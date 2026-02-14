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
    pays: 'Madagascar', // valeur par défaut
    ville: 'Antananarivo', // valeur par défaut
    serviceHotelIds: [] as string[],
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      if (checked) {
        return { ...prev, serviceHotelIds: [...prev.serviceHotelIds, value] };
      } else {
        return { ...prev, serviceHotelIds: prev.serviceHotelIds.filter((id) => id !== value) };
      }
    });
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Nouveau Benchmarking</h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro *</label>
              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nuits *</label>
              <input
                type="number"
                name="nuite"
                value={form.nuite}
                onChange={handleChange}
                min="1"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date début (du) *</label>
              <input
                type="date"
                name="du"
                value={form.du}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date fin (au) *</label>
              <input
                type="date"
                name="au"
                value={form.au}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pays</label>
              <input
                type="text"
                name="pays"
                value={form.pays}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input
                type="text"
                name="ville"
                value={form.ville}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Services inclus</label>
            <div className="max-h-40 overflow-y-auto border rounded p-3 grid grid-cols-2 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={s.id}
                    checked={form.serviceHotelIds.includes(s.id)}
                    onChange={handleServicesChange}
                  />
                  {s.service}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBenchmarkingForm;