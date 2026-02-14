import React, { useState } from 'react';

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
    nuiteAriary: '',
    montantDevise: '',
    montantAriary: '',
    devise: 'EUR',
    tauxChange: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation minimale
    if (!form.hotel || !form.plateformeId || !form.typeChambreId || !form.nuiteDevise) {
      alert('Veuillez remplir les champs obligatoires (hôtel, plateforme, type chambre, nuite devise)');
      return;
    }

    onSubmit({
      benchmarkingEnteteId,
      hotel: form.hotel.trim(),
      plateformeId: form.plateformeId,
      typeChambreId: form.typeChambreId,
      nuiteDevise: Number(form.nuiteDevise),
      nuiteAriary: Number(form.nuiteAriary) || 0,
      montantDevise: Number(form.montantDevise) || 0,
      montantAriary: Number(form.montantAriary) || 0,
      devise: form.devise,
      tauxChange: Number(form.tauxChange) || 1,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-5">Nouvelle ligne de benchmarking</h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Hôtel *</label>
              <input
                type="text"
                name="hotel"
                value={form.hotel}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Plateforme *</label>
              <select
                name="plateformeId"
                value={form.plateformeId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">— Choisir —</option>
                {plateformes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type de chambre *</label>
              <select
                name="typeChambreId"
                value={form.typeChambreId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">— Choisir —</option>
                {typesChambre.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.type} ({t.capacite} pers.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Devise</label>
              <select
                name="devise"
                value={form.devise}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="MGA">MGA</option>
                {/* Ajoute d'autres devises si besoin */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nuite Devise *</label>
              <input
                type="number"
                name="nuiteDevise"
                value={form.nuiteDevise}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Taux de change</label>
              <input
                type="number"
                name="tauxChange"
                value={form.tauxChange}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nuite Ariary</label>
              <input
                type="number"
                name="nuiteAriary"
                value={form.nuiteAriary}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Montant Devise</label>
              <input
                type="number"
                name="montantDevise"
                value={form.montantDevise}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Montant Ariary</label>
              <input
                type="number"
                name="montantAriary"
                value={form.montantAriary}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Enregistrer la ligne
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBenchmarkingLigneForm;