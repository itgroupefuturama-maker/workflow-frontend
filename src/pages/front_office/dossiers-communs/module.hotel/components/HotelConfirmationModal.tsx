// src/components/modals/Hotel/HotelConfirmationModal.tsx

import React, { useEffect, useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

interface HotelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
  loading?: boolean;
}

const HotelConfirmationModal: React.FC<HotelConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    tauxConfirmation: 0,
    puConfPrixNuitHotelAriary: 0,
    puConfMontantNuitHotelAriary: 0,
    puConfPrixNuitClientArary: 0,
    puConfMontantNuitClientAriary: 0,
    confirmationCommissionAriary: 0,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Pré-remplir avec les données de la ligne
  useEffect(() => {
    if (ligne) {
      setFormData({
        tauxConfirmation: ligne.resaTauxChange || 0,
        puConfPrixNuitHotelAriary: ligne.puResaNuiteHotelAriary || 0,
        puConfMontantNuitHotelAriary: ligne.puResaMontantAriary || 0,
        puConfPrixNuitClientArary: 0,
        puConfMontantNuitClientAriary: 0,
        confirmationCommissionAriary: ligne.commissionUnitaire || 0,
      });
    }
  }, [ligne]);

  // Calcul automatique des montants hôtel en Ariary
  useEffect(() => {
    const montantHotel = formData.puConfPrixNuitHotelAriary * (ligne?.BenchmarkingLigne?.benchmarkingEntete?.nuite || 1);
    const montantClient = formData.puConfPrixNuitClientArary * (ligne?.BenchmarkingLigne?.benchmarkingEntete?.nuite || 1);
    setFormData((prev) => ({
      ...prev,
      puConfMontantNuitHotelAriary: montantHotel,
      puConfMontantNuitClientAriary: montantClient,
    }));
  }, [formData.puConfPrixNuitHotelAriary, formData.puConfPrixNuitClientArary]);

  const isFormValid =
    formData.tauxConfirmation > 0 &&
    formData.puConfPrixNuitHotelAriary > 0 &&
    formData.puConfPrixNuitClientArary > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value) || 0,
    }));
  };

  const handleShowConfirmation = () => {
    if (!isFormValid) {
      alert('Veuillez compléter tous les champs obligatoires.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmAndSubmit = () => {
    const payload = {
      hotelLigneId: ligne.id,
      tauxConfirmation: formData.tauxConfirmation,
      puConfPrixNuitHotelAriary: formData.puConfPrixNuitHotelAriary,
      puConfMontantNuitHotelAriary: formData.puConfMontantNuitHotelAriary,
      puConfPrixNuitClientArary: formData.puConfPrixNuitClientArary,
      puConfMontantNuitClientAriary: formData.puConfMontantNuitClientAriary,
      confirmationCommissionAriary: formData.confirmationCommissionAriary,
    };
    onSubmit(payload);
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirmation de ligne</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                {ligne?.BenchmarkingLigne?.hotel || 'Hôtel'}
              </span>
              <span>•</span>
              <span>{ligne?.BenchmarkingLigne?.typeChambre?.type || 'Chambre'}</span>
              <span>•</span>
              <span className="font-mono text-xs">{ligne?.referenceLine}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Rappel des données de réservation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-800 uppercase mb-2">Données de réservation</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-blue-600">N° Résa</p>
                <p className="font-semibold text-blue-900">{ligne?.numeroResa || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Prix Nuit/Devise</p>
                <p className="font-semibold text-blue-900">{ligne?.puResaNuiteHotelDevise || 0}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Montant Devise</p>
                <p className="font-semibold text-blue-900">{ligne?.puResaMontantDevise || 0}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Commission Résa</p>
                <p className="font-semibold text-blue-900">
                  {ligne?.commissionUnitaire?.toLocaleString('fr-FR')} Ar
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 : Taux */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Taux de confirmation</h3>
            </div>
            <div className="p-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Taux Confirmation <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="tauxConfirmation"
                value={formData.tauxConfirmation}
                onChange={handleChange}
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                placeholder="4800"
              />
            </div>
          </section>

          {/* Section 2 : Prix Hôtel */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Prix Hôtel (Ariary)</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Prix Nuit Hôtel (Ar) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="puConfPrixNuitHotelAriary"
                  value={formData.puConfPrixNuitHotelAriary}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="720000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Montant Total Hôtel (Ar)
                </label>
                <input
                  type="number"
                  value={formData.puConfMontantNuitHotelAriary}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prix nuit × {ligne?.BenchmarkingLigne?.benchmarkingEntete?.nuite || 1} nuit(s)
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 : Prix Client */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Prix Client (Ariary)</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Prix Nuit Client (Ar) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="puConfPrixNuitClientArary"
                  value={formData.puConfPrixNuitClientArary}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="450"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Montant Total Client (Ar)
                </label>
                <input
                  type="number"
                  value={formData.puConfMontantNuitClientAriary}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prix nuit × {ligne?.BenchmarkingLigne?.benchmarkingEntete?.nuite || 1} nuit(s)
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 : Commission */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Commission de confirmation</h3>
            </div>
            <div className="p-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Commission Confirmation (Ar)
              </label>
              <input
                type="number"
                name="confirmationCommissionAriary"
                value={formData.confirmationCommissionAriary}
                onChange={handleChange}
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="5000"
              />
            </div>
          </section>

          {/* Récapitulatif */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Récapitulatif</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Taux</span>
                <span className="font-semibold">{formData.tauxConfirmation.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commission</span>
                <span className="font-semibold text-emerald-700">{formData.confirmationCommissionAriary.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant Hôtel</span>
                <span className="font-semibold">{formData.puConfMontantNuitHotelAriary.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant Client</span>
                <span className="font-semibold">{formData.puConfMontantNuitClientAriary.toLocaleString('fr-FR')} Ar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-600">
            <span className="text-red-600 font-semibold">*</span> Champs obligatoires
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleShowConfirmation}
              disabled={!isFormValid}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                isFormValid
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
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
                <p className="text-sm text-gray-600 mt-1">Vérifiez attentivement avant d'envoyer</p>
              </div>

              <div className="p-6 space-y-4">
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      hotelLigneId: ligne.id,
                      tauxConfirmation: formData.tauxConfirmation,
                      puConfPrixNuitHotelAriary: formData.puConfPrixNuitHotelAriary,
                      puConfMontantNuitHotelAriary: formData.puConfMontantNuitHotelAriary,
                      puConfPrixNuitClientArary: formData.puConfPrixNuitClientArary,
                      puConfMontantNuitClientAriary: formData.puConfMontantNuitClientAriary,
                      confirmationCommissionAriary: formData.confirmationCommissionAriary,
                    },
                    null,
                    2
                  )}
                </pre>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                  <span>⚠️</span>
                  <p className="text-sm text-amber-800">
                    Cette action sera <strong>irréversible</strong> une fois confirmée.
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
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <FiCheck size={16} />
                      Confirmer et envoyer →
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

export default HotelConfirmationModal;