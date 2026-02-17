// src/pages/front_office/hotel/components/ModalBenchmarkingToHotel.tsx

import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import type { HotelProspectionEntete } from '../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    hotelProspectionEnteteId: string;
    benchmarkingLigneIds: string[];
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

  if (!isOpen) return null;

  // Récupérer toutes les lignes de type "client" de tous les benchmarkings
  const lignesClient = entete.benchmarkingEntete.flatMap((bench) =>
    bench.benchmarkingLigne
      .filter((ligne) => ligne.plateforme?.nom?.toLowerCase() === 'client')
      .map((ligne) => ({
        ...ligne,
        benchNumero: bench.numero, // pour afficher d'où vient la ligne
        benchId: bench.id,
      }))
  );

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
      hotelProspectionEnteteId: entete.id,
      benchmarkingLigneIds: selectedLigneIds,
    });
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-orange-900">
              Transformer en Réservation Hôtel
            </h2>
            <p className="text-sm text-orange-700 mt-0.5">
              Entête : <span className="font-medium">{entete.numeroEntete}</span>
              {' · '}
              Fournisseur : <span className="font-medium">{entete.fournisseur?.libelle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-orange-400 hover:text-orange-600 p-1 hover:bg-orange-100 rounded transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p>
              Sélectionnez les lignes <strong>client</strong> des benchmarkings à inclure dans la réservation hôtel.
              Seules les lignes avec la plateforme <strong>"client"</strong> sont affichées.
            </p>
          </div>

          {lignesClient.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 text-sm">
                Aucune ligne client trouvée dans les benchmarkings de cette entête.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header tableau */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedLigneIds.length === lignesClient.length && lignesClient.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-700 uppercase">
                    Tout sélectionner
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {selectedLigneIds.length} / {lignesClient.length} sélectionné(s)
                </span>
              </div>

              {/* Lignes groupées par benchmarking */}
              {entete.benchmarkingEntete.map((bench) => {
                const lignesDuBench = bench.benchmarkingLigne.filter(
                  (l) => l.plateforme?.nom?.toLowerCase() === 'client'
                );
                if (lignesDuBench.length === 0) return null;

                return (
                  <div key={bench.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Sous-header benchmarking */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Benchmarking : {bench.numero}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({new Date(bench.du).toLocaleDateString('fr-FR')} → {new Date(bench.au).toLocaleDateString('fr-FR')})
                      </span>
                    </div>

                    {/* Lignes */}
                    {lignesDuBench.map((ligne) => {
                      const isSelected = selectedLigneIds.includes(ligne.id);
                      return (
                        <div
                          key={ligne.id}
                          onClick={() => toggleLigne(ligne.id)}
                          className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-orange-50 ${
                            isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 'border-l-4 border-transparent'
                          }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLigne(ligne.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
                          />

                          {/* Infos ligne */}
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Hôtel</p>
                              <p className="font-semibold text-gray-900">{ligne.hotel}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Type Chambre</p>
                              <p className="font-medium text-gray-700">{ligne.typeChambre?.type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Nuitée Devise</p>
                              <p className="font-mono text-gray-900">
                                {ligne.nuiteDevise} {ligne.devise}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Montant Ar</p>
                              <p className="font-mono font-semibold text-gray-900">
                                {ligne.montantAriary?.toLocaleString('fr-FR')} Ar
                              </p>
                            </div>
                          </div>

                          {/* Badge client */}
                          <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                            {ligne.plateforme?.nom}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Récapitulatif sélection */}
          {selectedLigneIds.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-orange-800 uppercase mb-2">
                Récapitulatif de la sélection
              </p>
              <div className="space-y-1">
                {selectedLigneIds.map((id) => {
                  const ligne = lignesClient.find((l) => l.id === id);
                  if (!ligne) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500">✓</span>
                        <span className="font-medium">{ligne.hotel}</span>
                        <span className="text-gray-500">— {ligne.typeChambre?.type}</span>
                        <span className="text-xs text-gray-400">({ligne.benchNumero})</span>
                      </div>
                      <span className="font-mono text-xs text-gray-600">
                        {ligne.montantAriary?.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-600">
            <span className="text-red-600 font-semibold">*</span> Sélection obligatoire
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleShowConfirmation}
              disabled={!isFormValid}
              className={`px-5 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                isFormValid
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiCheck size={16} />
              Vérifier & Confirmer
            </button>
          </div>
        </div>

        {/* Confirmation overlay */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiCheck size={20} />
                  Confirmation finale
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vérifiez avant de créer la réservation hôtel
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">Entête</p>
                    <p className="font-semibold text-gray-900">{entete.numeroEntete}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">Lignes sélectionnées</p>
                    <p className="font-semibold text-gray-900">{selectedLigneIds.length}</p>
                  </div>
                </div>

                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      hotelProspectionEnteteId: entete.id,
                      benchmarkingLigneIds: selectedLigneIds,
                    },
                    null,
                    2
                  )}
                </pre>

                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                  <span>⚠️</span>
                  <p className="text-sm text-amber-800">
                    Cette action créera une réservation hôtel à partir des lignes sélectionnées.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Modifier
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  disabled={loading}
                  className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <FiCheck size={16} />
                      Confirmer →
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