import React, { useEffect, useState } from 'react';
import { FiX, FiTrash2, FiCheck } from 'react-icons/fi';
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

  // ─── États ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    reservation: '',
    devise: defaultDevise,
    resaTauxEchange: defaultTaux,
    puResaBilletCompagnieDevise: 0,
    puResaServiceCompagnieDevise: 0,
    puResaPenaliteCompagnieDevise: 0,
    puResaMontantBilletCompagnieDevise: 0,
    puResaMontantServiceCompagnieDevise: 0,
    puResaMontantPenaliteCompagnieDevise: 0,
  });

  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{ beneficiaireId: string; infoId: string; nomComplet: string }>
  >([]);

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);

  // ─── Calculs dérivés ─────────────────────────────────────
  const nombrePassagers = selectedPassagers.length;

  const totalBillet = formData.puResaBilletCompagnieDevise * nombrePassagers;
  const totalService = formData.puResaServiceCompagnieDevise * nombrePassagers;
  const totalPenalite = formData.puResaPenaliteCompagnieDevise * nombrePassagers;

  const isFormValid =
    formData.reservation.trim() !== '' &&
    selectedPassagers.length > 0 &&
    formData.puResaBilletCompagnieDevise > 0 &&
    formData.resaTauxEchange > 0;

  // On cherche l'objet complet correspondant à l'ID sélectionné
  const selectedInfoDetails = infosList.find(info => info.id === currentInfoId);

  // ─── Effets ──────────────────────────────────────────────
  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
    }
  }, [currentBeneficiaireId, dispatch]);

  // Mise à jour automatique des montants totaux
  useEffect(() => {
    if (nombrePassagers > 0) {
      setFormData((prev) => ({
        ...prev,
        puResaMontantBilletCompagnieDevise: totalBillet,
        puResaMontantServiceCompagnieDevise: totalService,
        puResaMontantPenaliteCompagnieDevise: totalPenalite,
      }));
    }
  }, [
    nombrePassagers,
    formData.puResaBilletCompagnieDevise,
    formData.puResaServiceCompagnieDevise,
    formData.puResaPenaliteCompagnieDevise,
  ]);

  // ─── Handlers ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        'puResaBilletCompagnieDevise',
        'puResaServiceCompagnieDevise',
        'puResaPenaliteCompagnieDevise',
        'resaTauxEchange',
        'puResaMontantBilletCompagnieDevise',
        'puResaMontantServiceCompagnieDevise',
        'puResaMontantPenaliteCompagnieDevise',
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
      passagerIds: selectedPassagers.map((p) => p.infoId),
      reservation: formData.reservation,
      puResaBilletCompagnieDevise: formData.puResaBilletCompagnieDevise,
      puResaServiceCompagnieDevise: formData.puResaServiceCompagnieDevise,
      puResaPenaliteCompagnieDevise: formData.puResaPenaliteCompagnieDevise,
      devise: formData.devise,
      resaTauxEchange: formData.resaTauxEchange,
      puResaMontantBilletCompagnieDevise: formData.puResaMontantBilletCompagnieDevise,
      puResaMontantServiceCompagnieDevise: formData.puResaMontantServiceCompagnieDevise,
      puResaMontantPenaliteCompagnieDevise: formData.puResaMontantPenaliteCompagnieDevise,
    };

    onSubmit(payload);
    setShowConfirmation(false);
    // Option : onClose() si tu veux fermer directement après confirmation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle Réservation</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              {ligne.prospectionLigne?.numeroVol && (
                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                  Vol {ligne.prospectionLigne.numeroVol}
                </span>
              )}
              {ligne.prospectionLigne?.itineraire && (
                <>
                  <span>•</span>
                  <span>{ligne.prospectionLigne.itineraire}</span>
                </>
              )}
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
                            {infosList
                              .filter((info) => info.clientType === ligne.prospectionLigne?.typePassager)
                              .map((info) => (
                                <option key={info.id} value={info.id}>
                                  {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc} ({info.clientType})
                                </option>
                              ))
                            }
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
                            <div className="text-xs text-gray-500">Del: {selectedInfoDetails.dateDelivranceDoc}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">CIN</div>
                            <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                              {selectedInfoDetails.cin}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedInfoDetails.referenceCin}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité CIN</div>
                            <div className="text-xs text-gray-900">{selectedInfoDetails.dateValiditeCin}</div>
                            <div className="text-xs text-gray-500">Del: {selectedInfoDetails.dateDelivranceCin}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">WhatsApp</div>
                            <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.whatsapp}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Téléphone</div>
                            <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.tel}</div>
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

            {/* 2. Réservation + Taux */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Réservation & Taux</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      N° Réservation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="reservation"
                      value={formData.reservation}
                      onChange={handleChange}
                      placeholder="RES-2026-002"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Devise</label>
                    <input
                      type="text"
                      value={formData.devise}
                      readOnly
                      className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Taux de change <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="resaTauxEchange"
                        value={formData.resaTauxEchange}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="4500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Ar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="bg-gray-50 border border-gray-200 rounded px-4 py-2 w-full">
                      <p className="text-xs text-gray-500 font-medium uppercase mb-0.5">Passagers</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {nombrePassagers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Tarifs Compagnie */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Tarifs compagnie <span className="text-gray-600">({formData.devise})</span>
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Prix unitaires */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Prix unitaires
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        PU Billet <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="puResaBilletCompagnieDevise"
                        value={formData.puResaBilletCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="0.00"
                      />
                      {nombrePassagers > 0 && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          → Total: <span className="font-semibold">{totalBillet.toLocaleString('fr-FR')} {formData.devise}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">PU Service</label>
                      <input
                        type="number"
                        name="puResaServiceCompagnieDevise"
                        value={formData.puResaServiceCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="0.00"
                      />
                      {nombrePassagers > 0 && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          → Total: <span className="font-semibold">{totalService.toLocaleString('fr-FR')} {formData.devise}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">PU Pénalité</label>
                      <input
                        type="number"
                        name="puResaPenaliteCompagnieDevise"
                        value={formData.puResaPenaliteCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="0.00"
                      />
                      {nombrePassagers > 0 && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          → Total: <span className="font-semibold">{totalPenalite.toLocaleString('fr-FR')} {formData.devise}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Montants totaux */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Montants totaux
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Billet</label>
                      <input
                        type="number"
                        name="puResaMontantBilletCompagnieDevise"
                        value={formData.puResaMontantBilletCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Service</label>
                      <input
                        type="number"
                        name="puResaMontantServiceCompagnieDevise"
                        value={formData.puResaMontantServiceCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Pénalité</label>
                      <input
                        type="number"
                        name="puResaMontantPenaliteCompagnieDevise"
                        value={formData.puResaMontantPenaliteCompagnieDevise}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Tarifs Client */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Tarifs Client <span className="text-gray-600">(Devise & Ariary)</span>
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Tarifs en Devise */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Montants en Devise
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-600">Billet Client</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {ligne?.prospectionLigne?.montantBilletClientDevise || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-600">Service Client</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {ligne?.prospectionLigne?.montantServiceClientDevise || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-gray-600">Pénalité Client</span>
                        <span className="text-sm font-semibold text-red-600">
                          {ligne?.prospectionLigne?.montantPenaliteClientDevise || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tarifs en Ariary */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Montants en Ariary
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-600">Billet Client</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {ligne?.prospectionLigne?.montantBilletClientAriary || '—'} Ar
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-600">Service Client</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {ligne?.prospectionLigne?.montantServiceClientAriary || '—'} Ar
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-gray-600">Pénalité Client</span>
                        <span className="text-sm font-semibold text-red-600">
                          {ligne?.prospectionLigne?.montantPenaliteClientAriary || '—'} Ar
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commissions */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Commission en Devise
                    </h4>
                    <div className="bg-white border border-gray-300 rounded px-4 py-3">
                      <p className="text-xl font-semibold text-gray-900">
                        {ligne?.prospectionLigne?.commissionEnDevise || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded border border-gray-200 p-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Commission en Ariary
                    </h4>
                    <div className="bg-white border border-gray-300 rounded px-4 py-3">
                      <p className="text-xl font-semibold text-gray-900">
                        {ligne?.prospectionLigne?.commissionEnAriary || '—'} Ar
                      </p>
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
                      <p className="text-sm font-semibold text-gray-900">{formData.reservation || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                      <p className="text-lg font-semibold text-gray-900">{nombrePassagers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Devise</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.devise}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Taux</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.resaTauxEchange.toLocaleString('fr-FR')} Ar</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 uppercase mb-2">Liste des passagers</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPassagers.map((p) => (
                        <div key={p.infoId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
                          <span className="text-gray-900">✓</span>
                          <span className="text-xs font-medium">{p.nomComplet}</span>
                          <span className="text-xs text-gray-400 font-mono">({p.infoId.slice(0, 8)})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Montants totaux compagnie</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                        <p className="text-xs text-gray-600 font-medium mb-1">BILLET</p>
                        <p className="text-base font-semibold text-gray-900">
                          {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                        <p className="text-xs text-gray-600 font-medium mb-1">SERVICE</p>
                        <p className="text-base font-semibold text-gray-900">
                          {totalService.toLocaleString('fr-FR')} {formData.devise}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                        <p className="text-xs text-gray-600 font-medium mb-1">PÉNALITÉ</p>
                        <p className="text-base font-semibold text-gray-900">
                          {totalPenalite.toLocaleString('fr-FR')} {formData.devise}
                        </p>
                      </div>
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
              {/* Header modal confirmation */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiCheck size={20} />
                  Confirmation de réservation
                </h3>
                <p className="text-sm text-gray-600 mt-1">Vérifiez attentivement avant d'envoyer</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Infos rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Réservation</p>
                    <p className="text-base font-semibold text-gray-900">{formData.reservation || '—'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                    <p className="text-base font-semibold text-gray-900">{nombrePassagers}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Total Billet</p>
                    <p className="text-base font-semibold text-gray-900">
                      {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                    </p>
                  </div>
                </div>

                {/* JSON payload */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Payload JSON à envoyer
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        passagerIds: selectedPassagers.map((p) => p.infoId),
                        reservation: formData.reservation,
                        puResaBilletCompagnieDevise: formData.puResaBilletCompagnieDevise,
                        puResaServiceCompagnieDevise: formData.puResaServiceCompagnieDevise,
                        puResaPenaliteCompagnieDevise: formData.puResaPenaliteCompagnieDevise,
                        devise: formData.devise,
                        resaTauxEchange: formData.resaTauxEchange,
                        puResaMontantBilletCompagnieDevise: formData.puResaMontantBilletCompagnieDevise,
                        puResaMontantServiceCompagnieDevise: formData.puResaMontantServiceCompagnieDevise,
                        puResaMontantPenaliteCompagnieDevise: formData.puResaMontantPenaliteCompagnieDevise,
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

              {/* Footer modal */}
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

export default ReservationModal;