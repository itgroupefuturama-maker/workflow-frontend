// src/pages/front_office/hotel/components/ModalBenchmarkingToHotel.tsx

import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import type { HotelProspectionEntete } from '../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    totalGeneral: number;
    prospectionHotelId: string;
    benchmarkingEnteteIds: string[];
  }) => void;
  entete: HotelProspectionEntete;
  loading: boolean;
}

const ModalBenchmarkingToHotel: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  entete,
  loading,
}) => {
  const [selectedLigneIds, setSelectedLigneIds] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // const [totalGeneral, setTotalGeneral] = useState<number>(0);

  if (!isOpen) return null;

  // Récupérer toutes les lignes de type "client" de tous les benchmarkings
  const lignesClient = entete.benchmarkingEntete.filter((bench) =>
    bench.benchmarkingLigne.some(
      (l) => l.plateforme?.nom?.toLowerCase() === 'client'
    )
  );

  // Calcul automatique du total général = somme des montantAriary des lignes "client"
  // pour les benchmarkings sélectionnés uniquement
  const totalGeneralAuto = entete.benchmarkingEntete
    .filter((bench) => selectedLigneIds.includes(bench.id))
    .reduce((total, bench) => {
      const ligneClient = bench.benchmarkingLigne.find(
        (l) => l.plateforme?.nom?.toLowerCase() === 'client'
      );
      return total + (ligneClient?.montantAriary ?? 0);
    }, 0);

  const toggleLigne = (ligneId: string) => {
    setSelectedLigneIds((prev) =>
      prev.includes(ligneId)
        ? prev.filter((id) => id !== ligneId)
        : [...prev, ligneId]
    );
  };

  const toggleAll = () => {
    if (selectedLigneIds.length === lignesClient.length) {
      setSelectedLigneIds([]);
    } else {
      setSelectedLigneIds(lignesClient.map((l) => l.id));
    }
  };

  const isFormValid = selectedLigneIds.length > 0;

  const handleShowConfirmation = () => {
    if (!isFormValid) {
      alert('Veuillez sélectionner au moins une ligne client.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmAndSubmit = () => {
    onSubmit({
      totalGeneral: totalGeneralAuto,
      prospectionHotelId: entete.id,
      benchmarkingEnteteIds: selectedLigneIds,
    });
    setShowConfirmation(false);
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gray-950 px-6 py-5 flex justify-between items-center shrink-0">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Transformation</p>
            <h2 className="text-white font-bold text-base">Benchmarking → Devis</h2>
            <p className="text-gray-400 text-xs mt-1">
              {entete.numeroEntete}
              <span className="mx-2 text-gray-600">·</span>
              {entete.fournisseur?.libelle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {lignesClient.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">Aucune ligne client dans les benchmarkings</p>
              <p className="text-xs text-gray-400 mt-1">Validez d'abord la commission sur chaque benchmarking</p>
            </div>
          ) : (
            <div className="p-5 space-y-3">

              {/* Sélectionner tout + total */}
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLigneIds.length === lignesClient.length && lignesClient.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-gray-900 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Tout sélectionner</span>
                  <span className="text-xs text-gray-400">
                    ({selectedLigneIds.length}/{lignesClient.length})
                  </span>
                </label>

                {/* Total auto */}
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total général</p>
                  <p className="text-sm font-mono font-semibold text-gray-800">
                    {totalGeneralAuto > 0
                      ? `${totalGeneralAuto.toLocaleString('fr-FR')} Ar`
                      : <span className="text-gray-400 font-normal text-xs">— sélectionnez des lignes</span>
                    }
                  </p>
                </div>
              </div>

              {/* Liste benchmarkings */}
              {entete.benchmarkingEntete
                .filter((bench) =>
                  bench.benchmarkingLigne.some(
                    (l) => l.plateforme?.nom?.toLowerCase() === 'client'
                  )
                )
                .map((bench) => {
                const isSelected = selectedLigneIds.includes(bench.id);
                const ligneClient = bench.benchmarkingLigne.find(
                  (l) => l.plateforme?.nom?.toLowerCase() === 'client'
                );

                return (
                  <div
                    key={bench.id}
                    onClick={() => toggleLigne(bench.id)}
                    className={`bg-white border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-gray-800 shadow-sm'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {/* Header bench */}
                    <div className="px-4 py-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleLigne(bench.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-gray-900 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 font-mono">
                            {bench.numero}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(bench.du).toLocaleDateString('fr-FR')}
                            <span className="mx-1">→</span>
                            {new Date(bench.au).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {bench.nuite} nuit{bench.nuite > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{bench.ville}, {bench.pays}</p>
                      </div>

                      {/* Montant ligne client */}
                      {ligneClient ? (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">Ligne client</p>
                          <p className="text-sm font-mono font-semibold text-gray-800">
                            {ligneClient.montantAriary.toLocaleString('fr-FR')} Ar
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic shrink-0">Pas de ligne client</span>
                      )}
                    </div>

                    {/* Détails ligne client — visible si sélectionné */}
                    {isSelected && ligneClient && (
                      <div className="px-4 pb-3 border-t border-gray-100 pt-3 grid grid-cols-4 gap-3">
                        {[
                          { label: 'Type chambre', value: ligneClient.typeChambre?.type ?? '—' },
                          { label: 'Nb chambres', value: ligneClient.nombreChambre },
                          { label: 'Nuit/devise', value: `${ligneClient.nuiteDevise.toLocaleString('fr-FR')} ${ligneClient.devise}` },
                          { label: 'Taux', value: ligneClient.tauxChange.toLocaleString('fr-FR') },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                            <p className="text-xs font-medium text-gray-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">
            {selectedLigneIds.length === 0
              ? 'Sélectionnez au moins un benchmarking'
              : `${selectedLigneIds.length} benchmarking${selectedLigneIds.length > 1 ? 's' : ''} · ${totalGeneralAuto.toLocaleString('fr-FR')} Ar`
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={handleShowConfirmation}
              disabled={!isFormValid}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheck size={14} />
              Confirmer
            </button>
          </div>
        </div>

        {/* ── Confirmation overlay ── */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">

              {/* Header confirmation */}
              <div className="bg-gray-950 px-6 py-5">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Confirmation</p>
                <h3 className="text-white font-bold text-base">Vérifier avant de soumettre</h3>
              </div>

              <div className="p-6 space-y-4">

                {/* Récap */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Entête</p>
                    <p className="text-sm font-semibold text-gray-900">{entete.numeroEntete}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Benchmarkings</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedLigneIds.length}</p>
                  </div>
                  <div className="col-span-2 bg-gray-950 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total général</p>
                    <p className="text-lg font-mono font-bold text-white">
                      {totalGeneralAuto.toLocaleString('fr-FR')} Ar
                    </p>
                  </div>
                </div>

                {/* Avertissement */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    Cette action créera un devis à partir des benchmarkings sélectionnés. L'opération est irréversible.
                  </p>
                </div>
              </div>

              {/* Footer confirmation */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
                >
                  ← Modifier
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FiCheck size={14} />
                      Créer le devis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalBenchmarkingToHotel;