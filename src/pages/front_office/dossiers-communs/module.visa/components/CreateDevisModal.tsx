import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import axios from '../../../../../service/Axios';
import { fetchProspectionEntetes, type VisaProspectionLigne } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import VisaModal from './VisaModal';

interface Props {
  enteteId: string;
  prestationId: string;
  lignes: VisaProspectionLigne[];
  onClose: () => void;
}

const CreateDevisModal = ({ enteteId, prestationId, lignes, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // ── Sélection des lignes ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const toggleLigne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === lignes.length
        ? new Set()
        : new Set(lignes.map(l => l.id))
    );
  };

  // ── Total calculé automatiquement ─────────────────────────────────────────
  const totalGeneral = useMemo(
    () => lignes
      .filter(l => selectedIds.has(l.id))
      .reduce((sum, l) => sum + l.puClientAriary * l.nombre, 0),
    [selectedIds, lignes]
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (selectedIds.size === 0) return setError('Veuillez sélectionner au moins une ligne.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa/devis', {
        visaProspectionEnteteId : enteteId,
        visaProspectionLigneIds : Array.from(selectedIds),
        totalGeneral,
      });
      await dispatch(fetchProspectionEntetes(prestationId));
      onClose();
    } catch {
      setError('Erreur lors de la création du devis.');
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedIds.size === lignes.length && lignes.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <VisaModal
      title="Créer un devis"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >

      {/* Aucune ligne disponible */}
      {lignes.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          Aucune ligne de prospection disponible.<br />
          Veuillez d'abord créer des lignes.
        </div>
      ) : (
        <>
          {/* Header sélection */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-700">
              Sélectionner les lignes à inclure <span className="text-red-500">*</span>
            </p>
            <button
              onClick={toggleAll}
              className="text-xs text-indigo-600 hover:underline"
            >
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          {/* Liste des lignes */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {lignes.map((ligne) => {
              const checked   = selectedIds.has(ligne.id);
              const sousTotal = ligne.puClientAriary * ligne.nombre;

              return (
                <label
                  key={ligne.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLigne(ligne.id)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600 cursor-pointer"
                  />

                  {/* Infos ligne */}
                  <div className="flex-1 space-y-0.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {new Date(ligne.dateDepart).toLocaleDateString('fr-FR')}
                        {' → '}
                        {new Date(ligne.dateRetour).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        ligne.etatVisa === 'CREER'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {ligne.etatVisa}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 text-xs">
                      <span>👥 {ligne.nombre} pers.</span>
                      <span>💱 {ligne.devise} — taux {ligne.tauxEchange.toLocaleString('fr-FR')}</span>
                      <span>PU client : {ligne.puClientAriary.toLocaleString('fr-FR')} Ar</span>
                    </div>
                  </div>

                  {/* Sous-total */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-indigo-700">
                      {sousTotal.toLocaleString('fr-FR')} Ar
                    </p>
                    <p className="text-xs text-gray-400">sous-total</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Total général */}
          <div className={`flex items-center justify-between rounded-xl px-4 py-3 mt-1 transition-all ${
            selectedIds.size > 0 ? 'bg-indigo-600' : 'bg-gray-100'
          }`}>
            <span className={`text-sm font-semibold ${selectedIds.size > 0 ? 'text-indigo-100' : 'text-gray-400'}`}>
              Total général ({selectedIds.size} ligne{selectedIds.size > 1 ? 's' : ''})
            </span>
            <span className={`text-lg font-bold ${selectedIds.size > 0 ? 'text-white' : 'text-gray-400'}`}>
              {totalGeneral.toLocaleString('fr-FR')} Ar
            </span>
          </div>
        </>
      )}

      {/* Erreur */}
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}

    </VisaModal>
  );
};

export default CreateDevisModal;