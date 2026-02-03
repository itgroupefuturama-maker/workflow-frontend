import React, { useState } from 'react';
import { FiX, FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface EmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
  numeroBillet?: string;
}

const EmissionModal: React.FC<EmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  numeroBillet = '',
}) => {
  const [formData, setFormData] = useState({
    emissionTauxChange: ligne?.resaTauxEchange || 4850,
    numeroBillet: numeroBillet || '',
    pjBillet: null as File | null,
    puEmissionBilletCompagnieAriary: 0,
    puEmissionServiceCompagnieAriary: 0,
    puEmissionPenaliteCompagnieAriary: 0,
    puEmissionBilletClientAriary: 0,
    puEmissionServiceClientAriary: 0,
    puEmissionPenaliteClientAriary: 0,
    emissionMontantBilletCompagnieAriary: 0,
    emissionMontantServiceCompagnieAriary: 0,
    emissionMontantPenaliteCompagnieAriary: 0,
    emissionMontantBilletClientAriary: 0,
    emissionMontantServiceClientAriary: 0,
    emissionMontantPenaliteClientAriary: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    if (name === 'pjBillet' && files && files[0]) {
      setFormData((prev) => ({ ...prev, pjBillet: files[0] }));
      return;
    }

    if (name === 'numeroBillet') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numeroBillet.trim()) {
      alert('Le numéro de billet est obligatoire');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Émission de Billet</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vol {ligne?.prospectionLigne?.numeroVol || '---'} • Réservation: {ligne?.reservation || 'N/A'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-8">
            
            {/* Étape 1: Informations du vol */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  1
                </div>
                <h3 className="text-base font-semibold text-gray-900">Informations du vol</h3>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Numéro de vol</p>
                    <p className="font-medium text-gray-900">
                      {ligne?.prospectionLigne?.numeroVol || '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Itinéraire</p>
                    <p className="font-medium text-gray-900">
                      {ligne?.prospectionLigne?.itineraire || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Date de vol</p>
                    <p className="font-medium text-gray-900">
                      {ligne?.prospectionLigne?.dateVol 
                        ? new Date(ligne.prospectionLigne.dateVol).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Informations passager */}
                {ligne?.clientBeneficiaireInfo && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Passager</p>
                        <p className="font-medium text-gray-900">
                          {ligne.clientBeneficiaireInfo.prenom} {ligne.clientBeneficiaireInfo.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Document</p>
                        <p className="font-medium text-gray-900">
                          {ligne.clientBeneficiaireInfo.typeDoc} {ligne.clientBeneficiaireInfo.referenceDoc}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Type de client</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {ligne.clientBeneficiaireInfo.clientType}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Étape 2: Informations d'émission */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  2
                </div>
                <h3 className="text-base font-semibold text-gray-900">Informations d'émission</h3>
                <span className="text-xs text-red-600 font-medium">*Obligatoire</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taux de change (Ariary) <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="emissionTauxChange"
                        value={formData.emissionTauxChange}
                        onChange={handleChange}
                        step="1"
                        className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        Ar
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Taux de conversion appliqué
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de billet <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="numeroBillet"
                      value={formData.numeroBillet}
                      onChange={handleChange}
                      placeholder="ex: TK-2026-001234"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Numéro unique du billet émis
                    </p>
                  </div>
                </div>

                {/* Info devise de réservation */}
                {ligne?.devise && ligne.devise !== 'MGA' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Devise de réservation:</span> {ligne.devise}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Taux de réservation: {ligne.resaTauxEchange} Ar • 
                          La conversion sera effectuée avec le taux d'émission ci-dessus
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Étape 3: Document du billet */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  3
                </div>
                <h3 className="text-base font-semibold text-gray-900">Document du billet</h3>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    name="pjBillet"
                    accept="application/pdf"
                    onChange={handleChange}
                    className="hidden"
                    id="pjBillet"
                  />
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('pjBillet')?.click()}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <FiUpload className="text-blue-600" size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Cliquez pour télécharger un fichier
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF uniquement (max 10 MB)
                      </p>
                    </div>
                  </div>
                </label>

                {formData.pjBillet && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 bg-green-100 rounded-lg flex-shrink-0">
                        <FiCheck className="text-green-600" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {formData.pjBillet.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(formData.pjBillet.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, pjBillet: null }))}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Vérifiez toutes les informations avant de confirmer
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Confirmer l'émission
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmissionModal;