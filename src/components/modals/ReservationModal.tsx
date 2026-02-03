import React, { useEffect, useState } from 'react';
import { FiX, FiFileText, FiAlertCircle, FiCheck } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );
  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );

  const defaultDevise = ligne?.prospectionLigne?.devise || 'EUR';
  const defaultTaux = ligne?.prospectionLigne?.tauxEchange || 4900;

  const [formData, setFormData] = useState({
    nombre: 1,
    clientbeneficiaireInfoId: '',
    reservation: '',
    puResaBilletCompagnieDevise: 0,
    puResaServiceCompagnieDevise: 0,
    puResaPenaliteCompagnieDevise: 0,
    devise: defaultDevise,
    resaTauxEchange: defaultTaux,
    puResaMontantBilletCompagnieDevise: 0,
    puResaMontantServiceCompagnieDevise: 0,
    puResaMontantPenaliteCompagnieDevise: 0,
  });

  const [selectedBeneficiaireId, setSelectedBeneficiaireId] = useState<string>('');

  useEffect(() => {
    if (selectedBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(selectedBeneficiaireId));
    }
  }, [selectedBeneficiaireId, dispatch]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['nombre', 'puResaBilletCompagnieDevise', 'puResaServiceCompagnieDevise', 
        'puResaPenaliteCompagnieDevise', 'resaTauxEchange', 'puResaMontantBilletCompagnieDevise',
        'puResaMontantServiceCompagnieDevise', 'puResaMontantPenaliteCompagnieDevise'].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  const handleBeneficiaireChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const benefId = e.target.value;
    setSelectedBeneficiaireId(benefId);
    setFormData((prev) => ({ ...prev, clientbeneficiaireInfoId: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reservation.trim()) {
      alert('Numéro de réservation obligatoire');
      return;
    }
    if (!formData.clientbeneficiaireInfoId) {
      alert('Veuillez choisir une information passager (document)');
      return;
    }
    if (formData.nombre < 1) {
      alert('Nombre de places minimum 1');
      return;
    }
    onSubmit(formData);
  };

  const selectedBeneficiaire = beneficiaires.find(
    (b) => b.clientBeneficiaireId === selectedBeneficiaireId
  );

  const selectedInfo = infosList.find(
    (info) => info.id === formData.clientbeneficiaireInfoId
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle Réservation</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vol {ligne.prospectionLigne?.numeroVol || '---'} • {ligne.prospectionLigne?.itineraire || 'Itinéraire non spécifié'}
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
            
            {/* Étape 1: Bénéficiaire */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  1
                </div>
                <h3 className="text-base font-semibold text-gray-900">Bénéficiaire</h3>
                <span className="text-xs text-red-600 font-medium">*Obligatoire</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner le bénéficiaire <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={selectedBeneficiaireId}
                    onChange={handleBeneficiaireChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">-- Choisir un bénéficiaire --</option>
                    {beneficiaires.map((b) => (
                      <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                        {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code} • {b.clientBeneficiaire.statut}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedBeneficiaire && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-9 h-9 bg-green-100 rounded-lg flex-shrink-0">
                        <FiCheck className="text-green-600" size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-2">Bénéficiaire sélectionné</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Nom</p>
                            <p className="font-medium text-gray-900">{selectedBeneficiaire.clientBeneficiaire.libelle}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Code</p>
                            <p className="font-medium text-gray-900">{selectedBeneficiaire.clientBeneficiaire.code}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Statut</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              selectedBeneficiaire.clientBeneficiaire.statut === 'ACTIF' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedBeneficiaire.clientBeneficiaire.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Étape 2: Document */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  2
                </div>
                <h3 className="text-base font-semibold text-gray-900">Document d'identité</h3>
                <span className="text-xs text-red-600 font-medium">*Obligatoire</span>
              </div>
              
              <div className="space-y-4">
                {!selectedBeneficiaireId ? (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <FiAlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                    <p className="text-sm text-amber-800">
                      Sélectionnez d'abord un bénéficiaire
                    </p>
                  </div>
                ) : infosLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Chargement...</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document du passager <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="clientbeneficiaireInfoId"
                        value={formData.clientbeneficiaireInfoId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">-- Choisir un document --</option>
                        {infosList.map((info) => (
                          <option key={info.id} value={info.id}>
                            {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc} • Type: {info.clientType}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedInfo && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-lg flex-shrink-0">
                            <FiFileText className="text-blue-600" size={18} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 mb-2">Document sélectionné</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs mb-1">Nom complet</p>
                                <p className="font-medium text-gray-900">{selectedInfo.prenom} {selectedInfo.nom}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs mb-1">Type de document</p>
                                <p className="font-medium text-gray-900">{selectedInfo.typeDoc}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs mb-1">N° Document</p>
                                <p className="font-medium text-gray-900">{selectedInfo.referenceDoc}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs mb-1">N° CIN</p>
                                <p className="font-medium text-gray-900">{selectedInfo.referenceCin}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs mb-1">Type de client</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {selectedInfo.clientType}
                                </span>
                              </div>
                              {selectedInfo.dateDelivranceDoc && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Date de dilivrance Doc</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(selectedInfo.dateDelivranceDoc).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                              {selectedInfo.dateValiditeDoc && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Date de validation Doc</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(selectedInfo.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                              {selectedInfo.dateDelivranceCin && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Date de delivrance CIN</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(selectedInfo.dateDelivranceCin).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                              {selectedInfo.dateValiditeCin && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Date de validation CIN</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(selectedInfo.dateValiditeCin).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                              {selectedInfo.nationalite && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Nationalité</p>
                                  <p className="font-medium text-gray-900">{selectedInfo.nationalite}</p>
                                </div>
                              )}
                              {selectedInfo.document && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">Document</p>
                                  <p className="font-medium text-gray-900">{selectedInfo.document}</p>
                                </div>
                              )}
                              {selectedInfo.cin && (
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">CIN</p>
                                  <p className="font-medium text-gray-900">{selectedInfo.cin}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Étape 3: Informations de réservation */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  3
                </div>
                <h3 className="text-base font-semibold text-gray-900">Informations de réservation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de places <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Réservation <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="reservation"
                    value={formData.reservation}
                    onChange={handleChange}
                    placeholder="RES-2026-001"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise
                  </label>
                  <input
                    type="text"
                    name="devise"
                    value={formData.devise}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de change
                  </label>
                  <input
                    type="number"
                    name="resaTauxEchange"
                    value={formData.resaTauxEchange}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Étape 4: Tarifs */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-semibold">
                  4
                </div>
                <h3 className="text-base font-semibold text-gray-900">Tarifs compagnie (en {formData.devise})</h3>
              </div>
              
              <div className="space-y-6">
                {/* Prix unitaires */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Prix unitaires</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Billet</label>
                      <input
                        type="number"
                        name="puResaBilletCompagnieDevise"
                        value={formData.puResaBilletCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Service</label>
                      <input
                        type="number"
                        name="puResaServiceCompagnieDevise"
                        value={formData.puResaServiceCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Pénalité</label>
                      <input
                        type="number"
                        name="puResaPenaliteCompagnieDevise"
                        value={formData.puResaPenaliteCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Montants totaux */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Montants totaux</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Total Billet</label>
                      <input
                        type="number"
                        name="puResaMontantBilletCompagnieDevise"
                        value={formData.puResaMontantBilletCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Total Service</label>
                      <input
                        type="number"
                        name="puResaMontantServiceCompagnieDevise"
                        value={formData.puResaMontantServiceCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Total Pénalité</label>
                      <input
                        type="number"
                        name="puResaMontantPenaliteCompagnieDevise"
                        value={formData.puResaMontantPenaliteCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Les champs avec <span className="text-red-600">*</span> sont obligatoires
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
                Confirmer
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReservationModal;