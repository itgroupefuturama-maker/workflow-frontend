// src/components/modals/HotelReservationModal.tsx

import React, { useEffect, useState } from 'react';
import { FiX, FiTrash2, FiCheck } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientBeneficiaireInfos } from '../../../app/portail_client/clientBeneficiaireInfosSlice';

interface HotelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any; // La ligne d'hôtel sélectionnée
}

const HotelReservationModal: React.FC<HotelReservationModalProps> = ({
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

  // ─── États ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    numeroResa: '',
    puResaNuiteHotelDevise: 0,
    resaTauxChange: 4800,
    puResaNuiteHotelAriary: 0,
    puResaMontantDevise: 0,
    puResaMontantAriary: 0,
    pourcentageCommission: 5,
    commissionUnitaire: 0,
  });

  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{ beneficiaireId: string; infoId: string; nomComplet: string }>
  >([]);

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);

  // ─── Calculs dérivés ─────────────────────────────────────
  // Calculer automatiquement les montants en Ariary
  useEffect(() => {
    const nuiteAriary = formData.puResaNuiteHotelDevise * formData.resaTauxChange;
    const montantAriary = formData.puResaMontantDevise * formData.resaTauxChange;
    
    setFormData(prev => ({
      ...prev,
      puResaNuiteHotelAriary: nuiteAriary,
      puResaMontantAriary: montantAriary,
    }));
  }, [formData.puResaNuiteHotelDevise, formData.puResaMontantDevise, formData.resaTauxChange]);

  // Calculer la commission unitaire
  useEffect(() => {
    const commission = (formData.puResaMontantAriary * formData.pourcentageCommission) / 100;
    setFormData(prev => ({
      ...prev,
      commissionUnitaire: Math.round(commission),
    }));
  }, [formData.puResaMontantAriary, formData.pourcentageCommission]);

  const isFormValid =
    formData.numeroResa.trim() !== '' &&
    selectedPassagers.length > 0 &&
    formData.puResaNuiteHotelDevise > 0 &&
    formData.resaTauxChange > 0;

  // On cherche l'objet complet correspondant à l'ID sélectionné
  const selectedInfoDetails = infosList.find(info => info.id === currentInfoId);

  // ─── Effets ──────────────────────────────────────────────
  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
    }
  }, [currentBeneficiaireId, dispatch]);

  // ─── Handlers ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        'puResaNuiteHotelDevise',
        'resaTauxChange',
        'puResaNuiteHotelAriary',
        'puResaMontantDevise',
        'puResaMontantAriary',
        'pourcentageCommission',
        'commissionUnitaire',
      ].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  const addPassager = () => {
    if (!currentBeneficiaireId || !currentInfoId) {
      alert('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }

    const beneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find((i) => i.id === currentInfoId);

    if (!beneficiaire || !info) return;

    const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim() || beneficiaire.clientBeneficiaire.libelle;

    setSelectedPassagers((prev) => [
      ...prev,
      {
        beneficiaireId: currentBeneficiaireId,
        infoId: currentInfoId,
        nomComplet,
      },
    ]);

    // Reset
    setCurrentBeneficiaireId('');
    setCurrentInfoId('');
  };

  const removePassager = (infoId: string) => {
    setSelectedPassagers((prev) => prev.filter((p) => p.infoId !== infoId));
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
      numeroResa: formData.numeroResa,
      puResaNuiteHotelDevise: formData.puResaNuiteHotelDevise,
      resaTauxChange: formData.resaTauxChange,
      puResaNuiteHotelAriary: formData.puResaNuiteHotelAriary,
      puResaMontantDevise: formData.puResaMontantDevise,
      puResaMontantAriary: formData.puResaMontantAriary,
      pourcentageCommission: formData.pourcentageCommission,
      commissionUnitaire: formData.commissionUnitaire,
      passagerIds: selectedPassagers.map((p) => p.infoId),
    };

    console.log(`les donnée envoyer ${ligne.id} ${formData.numeroResa} ${formData.puResaNuiteHotelDevise} ${formData.resaTauxChange} ${formData.puResaNuiteHotelAriary} ${formData.puResaMontantDevise} ${formData.puResaMontantAriary} ${formData.pourcentageCommission} ${formData.commissionUnitaire} ${selectedPassagers.map((p) => p.infoId)}`);
    

    onSubmit(payload);
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle Réservation Hôtel</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                {ligne?.BenchmarkingLigne?.hotel || 'Hôtel'}
              </span>
              <span>•</span>
              <span>{ligne?.BenchmarkingLigne?.typeChambre?.type || 'Chambre'}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* 1. Passagers */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Passagers</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Sélection obligatoire • Plusieurs passagers possibles
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Sélection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Bénéficiaire <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={currentBeneficiaireId}
                        onChange={(e) => {
                          setCurrentBeneficiaireId(e.target.value);
                          setCurrentInfoId('');
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                      >
                        <option value="">Sélectionner un bénéficiaire</option>
                        {beneficiaires.map((b) => (
                          <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                            {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentBeneficiaireId && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Document / Info passager <span className="text-red-600">*</span>
                        </label>
                        {infosLoading ? (
                          <div className="text-sm text-gray-500 italic flex items-center gap-2 py-2">
                            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                            Chargement...
                          </div>
                        ) : infosList.length === 0 ? (
                          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
                            Aucun document trouvé pour ce bénéficiaire
                          </div>
                        ) : (
                          <select
                            value={currentInfoId}
                            onChange={(e) => setCurrentInfoId(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          >
                            <option value="">Sélectionner un document</option>
                            {infosList.map((info) => (
                              <option key={info.id} value={info.id}>
                                {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc} ({info.clientType})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Détails du document sélectionné */}
                    {selectedInfoDetails && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          Document sélectionné
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Passager</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type</div>
                            <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                              {selectedInfoDetails.clientType}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Nationalité</div>
                            <div className="text-sm text-gray-900">{selectedInfoDetails.nationalite}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Document</div>
                            <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                              {selectedInfoDetails.typeDoc}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedInfoDetails.referenceDoc}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité</div>
                            <div className={`text-xs font-medium ${
                              new Date(selectedInfoDetails.dateValiditeDoc) < new Date() 
                                ? 'text-red-600' 
                                : 'text-gray-900'
                            }`}>
                              {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addPassager}
                      disabled={!currentBeneficiaireId || !currentInfoId}
                      className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        currentBeneficiaireId && currentInfoId
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-lg">+</span>
                      Ajouter ce passager
                    </button>
                  </div>

                  {/* Liste sélectionnés */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Passagers sélectionnés 
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {selectedPassagers.length}
                      </span>
                    </label>

                    {selectedPassagers.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FiCheck className="text-gray-400" size={24} />
                        </div>
                        <p className="text-sm text-gray-500">Aucun passager ajouté</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {selectedPassagers.map((p, idx) => (
                          <div
                            key={p.infoId}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-3 hover:border-gray-300 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{p.nomComplet}</p>
                                <p className="text-xs text-gray-500 font-mono">
                                  ID: {p.infoId.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removePassager(p.infoId)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Informations de réservation */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Informations de réservation</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      N° Réservation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="numeroResa"
                      value={formData.numeroResa}
                      onChange={handleChange}
                      placeholder="RESA-2024-001"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Taux de change (Ar) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="resaTauxChange"
                      value={formData.resaTauxChange}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="4800"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Tarifs */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Tarifs</h3>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Prix en devise */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Prix en devise
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Prix Nuitée Hôtel (Devise) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="puResaNuiteHotelDevise"
                        value={formData.puResaNuiteHotelDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="150.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Montant Total (Devise) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="puResaMontantDevise"
                        value={formData.puResaMontantDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="450.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Prix en Ariary (calculés automatiquement) */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Prix en Ariary (calculés automatiquement)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Prix Nuitée Hôtel (Ariary)
                      </label>
                      <input
                        type="number"
                        value={formData.puResaNuiteHotelAriary}
                        readOnly
                        className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Montant Total (Ariary)
                      </label>
                      <input
                        type="number"
                        value={formData.puResaMontantAriary}
                        readOnly
                        className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Commission
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Pourcentage Commission (%)
                      </label>
                      <input
                        type="number"
                        name="pourcentageCommission"
                        value={formData.pourcentageCommission}
                        onChange={handleChange}
                        step="0.1"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Commission Unitaire (Ariary)
                      </label>
                      <input
                        type="number"
                        value={formData.commissionUnitaire}
                        readOnly
                        className="w-full bg-emerald-50 border border-emerald-300 rounded px-3 py-2 text-sm font-semibold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Récapitulatif */}
            {selectedPassagers.length > 0 && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <FiCheck className="text-gray-900" size={18} />
                  Récapitulatif avant envoi
                </h3>

                <div className="bg-white rounded border border-gray-200 p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Numéro réservation</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.numeroResa || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedPassagers.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Montant Total</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formData.puResaMontantAriary.toLocaleString('fr-FR')} Ar
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Commission</p>
                      <p className="text-sm font-semibold text-emerald-700">
                        {formData.commissionUnitaire.toLocaleString('fr-FR')} Ar
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 uppercase mb-2">Liste des passagers</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPassagers.map((p) => (
                        <div key={p.infoId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
                          <span className="text-gray-900">✓</span>
                          <span className="text-xs font-medium">{p.nomComplet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
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
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiCheck size={20} />
                  Confirmation de réservation hôtel
                </h3>
                <p className="text-sm text-gray-600 mt-1">Vérifiez attentivement avant d'envoyer</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Réservation</p>
                    <p className="text-base font-semibold text-gray-900">{formData.numeroResa || '—'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                    <p className="text-base font-semibold text-gray-900">{selectedPassagers.length}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formData.puResaMontantAriary.toLocaleString('fr-FR')} Ar
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Payload JSON à envoyer
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        hotelLigneId: ligne.id,
                        numeroResa: formData.numeroResa,
                        puResaNuiteHotelDevise: formData.puResaNuiteHotelDevise,
                        resaTauxChange: formData.resaTauxChange,
                        puResaNuiteHotelAriary: formData.puResaNuiteHotelAriary,
                        puResaMontantDevise: formData.puResaMontantDevise,
                        puResaMontantAriary: formData.puResaMontantAriary,
                        pourcentageCommission: formData.pourcentageCommission,
                        commissionUnitaire: formData.commissionUnitaire,
                        passagerIds: selectedPassagers.map((p) => p.infoId),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm text-amber-800">
                    Vérifiez attentivement toutes les valeurs. Cette action sera <strong>irréversible</strong> une fois confirmée.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Modifier / Retour
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  className="px-5 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <FiCheck size={16} />
                  Confirmer et envoyer →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelReservationModal;