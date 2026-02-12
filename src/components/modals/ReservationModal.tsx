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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Nouvelle Réservation</h2>
            <p className="text-blue-100 mt-1 flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                Vol {ligne.prospectionLigne?.numeroVol || '—'}
              </span>
              <span>•</span>
              <span>{ligne.prospectionLigne?.itineraire || '—'}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* 1. Passagers */}
            <section className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">Passagers</h3>
                  <p className="text-sm text-red-600 font-medium mt-0.5">
                    * Obligatoire – plusieurs possibles
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sélection */}
                <div className="space-y-5 lg:border-r lg:pr-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bénéficiaire <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={currentBeneficiaireId}
                      onChange={(e) => {
                        setCurrentBeneficiaireId(e.target.value);
                        setCurrentInfoId('');
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">— Choisir un bénéficiaire —</option>
                      {beneficiaires.map((b) => (
                        <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                          {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentBeneficiaireId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Document / Info passager <span className="text-red-600">*</span>
                      </label>
                      {infosLoading ? (
                        <div className="text-gray-500 italic flex items-center gap-2 py-3">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Chargement...
                        </div>
                      ) : infosList.length === 0 ? (
                        <div className="text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          Aucun document trouvé pour ce bénéficiaire
                        </div>
                      ) : (
                        <select
                          value={currentInfoId}
                          onChange={(e) => setCurrentInfoId(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="">— Choisir un document —</option>
                          {infosList.map((info) => (
                            <option key={info.id} value={info.id}>
                              {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Affichage des détails du document sélectionné */}
                  {selectedInfoDetails && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <FiCheck size={16} className="text-blue-600" /> 
                        Détails du document sélectionné
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Passager</p>
                          <p className="text-base font-bold text-gray-900">
                            {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Type Client</p>
                          <span className="inline-block px-2.5 py-1 bg-white border-2 border-blue-200 rounded-lg text-xs font-bold text-gray-700">
                            {selectedInfoDetails.clientType}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Nationalité</p>
                          <p className="text-sm font-semibold text-gray-800">{selectedInfoDetails.nationalite}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Type Document</p>
                          <span className="inline-block px-2.5 py-1 bg-white border-2 border-blue-200 rounded-lg text-xs font-bold text-gray-700">
                            {selectedInfoDetails.typeDoc}
                          </span>
                          <p className="text-xs text-gray-600 mt-1 font-mono">{selectedInfoDetails.referenceDoc}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Dates Document</p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Del:</span> {selectedInfoDetails.dateDelivranceDoc}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Val:</span> {selectedInfoDetails.dateValiditeDoc}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">CIN</p>
                          <span className="inline-block px-2.5 py-1 bg-white border-2 border-blue-200 rounded-lg text-xs font-bold text-gray-700">
                            {selectedInfoDetails.cin}
                          </span>
                          <p className="text-xs text-gray-600 mt-1 font-mono">{selectedInfoDetails.referenceCin}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Dates CIN</p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Del:</span> {selectedInfoDetails.dateDelivranceCin}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Val:</span> {selectedInfoDetails.dateValiditeCin}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">WhatsApp</p>
                          <p className="text-sm font-mono font-bold text-green-600">
                            {selectedInfoDetails.whatsapp}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Téléphone</p>
                          <p className="text-sm font-mono font-bold text-blue-700">
                            {selectedInfoDetails.tel}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Validité Document</p>
                          <p className={`text-sm font-bold ${new Date(selectedInfoDetails.dateValiditeDoc) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                            {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addPassager}
                    disabled={!currentBeneficiaireId || !currentInfoId}
                    className="w-full mt-4 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    Ajouter ce passager
                  </button>
                </div>

                {/* Liste sélectionnés */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    Passagers sélectionnés 
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      {selectedPassagers.length}
                    </span>
                  </label>

                  {selectedPassagers.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiCheck className="text-gray-400" size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">Aucun passager ajouté</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedPassagers.map((p, idx) => (
                        <div
                          key={p.infoId}
                          className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{p.nomComplet}</p>
                              <p className="text-xs text-gray-500 font-mono">
                                ID: {p.infoId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removePassager(p.infoId)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Réservation + Taux */}
            <section className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-800">Réservation & Taux</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    N° Réservation <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="reservation"
                    value={formData.reservation}
                    onChange={handleChange}
                    placeholder="RES-2026-002"
                    className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Devise</label>
                  <input
                    type="text"
                    value={formData.devise}
                    readOnly
                    className="w-full bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg py-3 px-4 text-gray-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Taux de change <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="resaTauxEchange"
                      value={formData.resaTauxEchange}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="4500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      Ar
                    </span>
                  </div>
                </div>

                <div className="flex items-end">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-3 w-full">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Passagers</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {nombrePassagers}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Tarifs Compagnie */}
            <section className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Tarifs compagnie <span className="text-blue-600">({formData.devise})</span>
                </h3>
              </div>

              {/* Prix unitaires */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  Prix unitaires
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PU Billet <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="puResaBilletCompagnieDevise"
                      value={formData.puResaBilletCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="0.00"
                    />
                    {nombrePassagers > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                        <span>→ Total:</span>
                        <span className="font-bold">{totalBillet.toLocaleString('fr-FR')} {formData.devise}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PU Service</label>
                    <input
                      type="number"
                      name="puResaServiceCompagnieDevise"
                      value={formData.puResaServiceCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="0.00"
                    />
                    {nombrePassagers > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                        <span>→ Total:</span>
                        <span className="font-bold">{totalService.toLocaleString('fr-FR')} {formData.devise}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PU Pénalité</label>
                    <input
                      type="number"
                      name="puResaPenaliteCompagnieDevise"
                      value={formData.puResaPenaliteCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="0.00"
                    />
                    {nombrePassagers > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                        <span>→ Total:</span>
                        <span className="font-bold">{totalPenalite.toLocaleString('fr-FR')} {formData.devise}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Montants totaux */}
              <div className="pt-6 border-t-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-green-600 rounded-full"></div>
                  Montants totaux
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Billet</label>
                    <input
                      type="number"
                      name="puResaMontantBilletCompagnieDevise"
                      value={formData.puResaMontantBilletCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-green-200 bg-green-50 rounded-lg py-3 px-4 font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Service</label>
                    <input
                      type="number"
                      name="puResaMontantServiceCompagnieDevise"
                      value={formData.puResaMontantServiceCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-green-200 bg-green-50 rounded-lg py-3 px-4 font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Pénalité</label>
                    <input
                      type="number"
                      name="puResaMontantPenaliteCompagnieDevise"
                      value={formData.puResaMontantPenaliteCompagnieDevise}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full border-2 border-green-200 bg-green-50 rounded-lg py-3 px-4 font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Tarifs Client */}
            <section className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Tarifs Client <span className="text-purple-600">(Devise & Ariary)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarifs en Devise */}
                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                  <h4 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Montants en Devise
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-sm text-gray-600 font-medium">Billet Client</span>
                      <span className="font-bold text-gray-900">
                        {ligne?.prospectionLigne?.montantBilletClientDevise || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-sm text-gray-600 font-medium">Service Client</span>
                      <span className="font-bold text-gray-900">
                        {ligne?.prospectionLigne?.montantServiceClientDevise || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 font-medium">Pénalité Client</span>
                      <span className="font-bold text-red-600">
                        {ligne?.prospectionLigne?.montantPenaliteClientDevise || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarifs en Ariary */}
                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                  <h4 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Montants en Ariary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-sm text-gray-600 font-medium">Billet Client</span>
                      <span className="font-bold text-gray-900">
                        {ligne?.prospectionLigne?.montantBilletClientAriary || '—'} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-sm text-gray-600 font-medium">Service Client</span>
                      <span className="font-bold text-gray-900">
                        {ligne?.prospectionLigne?.montantServiceClientAriary || '—'} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 font-medium">Pénalité Client</span>
                      <span className="font-bold text-red-600">
                        {ligne?.prospectionLigne?.montantPenaliteClientAriary || '—'} Ar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commissions */}
                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                  <h4 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Commission en Devise
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">
                      {ligne?.prospectionLigne?.commissionEnDevise || '—'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                  <h4 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Commission en Ariary
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">
                      {ligne?.prospectionLigne?.commissionEnAriary || '—'} Ar
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Récapitulatif */}
            {selectedPassagers.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <FiCheck className="text-white" size={18} />
                  </div>
                  Récapitulatif avant envoi
                </h3>

                <div className="bg-white rounded-lg p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Numéro réservation</p>
                      <p className="font-bold text-gray-900">{formData.reservation || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Passagers</p>
                      <p className="font-bold text-blue-600 text-xl">{nombrePassagers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Devise</p>
                      <p className="font-bold text-gray-900">{formData.devise}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Taux</p>
                      <p className="font-bold text-gray-900">{formData.resaTauxEchange.toLocaleString('fr-FR')} Ar</p>
                    </div>
                  </div>

                  <div className="border-t-2 pt-4">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-3">Liste des passagers</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPassagers.map((p) => (
                        <div key={p.infoId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
                          <span className="text-blue-600">✓</span>
                          <span className="text-sm font-medium">{p.nomComplet}</span>
                          <span className="text-xs text-gray-400 font-mono">({p.infoId.slice(0, 8)})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t-2">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-3">Montants totaux compagnie</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-bold mb-1">BILLET</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-bold mb-1">SERVICE</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalService.toLocaleString('fr-FR')} {formData.devise}
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-red-600 font-bold mb-1">PÉNALITÉ</p>
                        <p className="text-lg font-bold text-gray-900">
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

        {/* Footer */}
        <div className="border-t-2 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 flex justify-between items-center">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg">*</span>
            <span className="font-medium">Champs obligatoires</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 font-medium transition-all"
            >
              Annuler
            </button>

            <button
              onClick={handleShowConfirmation}
              disabled={!isFormValid}
              className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiCheck size={20} />
              Vérifier & Confirmer
            </button>
          </div>
        </div>

        {/* Confirmation overlay */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header modal confirmation */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FiCheck size={24} />
                  </div>
                  Confirmation de réservation
                </h3>
                <p className="text-green-100 mt-1 text-sm">Vérifiez attentivement avant d'envoyer</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Infos rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Réservation</p>
                    <p className="font-bold text-lg text-gray-900">{formData.reservation || '—'}</p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-xs text-purple-600 font-bold uppercase mb-1">Passagers</p>
                    <p className="font-bold text-lg text-gray-900">{nombrePassagers}</p>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-bold uppercase mb-1">Total Billet</p>
                    <p className="font-bold text-lg text-gray-900">
                      {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                    </p>
                  </div>
                </div>

                {/* JSON payload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Payload JSON à envoyer
                    </p>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-5 rounded-xl text-xs overflow-x-auto font-mono border-2 border-gray-700 shadow-inner whitespace-pre-wrap">
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

                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-sm text-amber-800 font-medium">
                    Vérifiez attentivement toutes les valeurs ci-dessus. Cette action sera <strong>irréversible</strong> une fois confirmée.
                  </p>
                </div>
              </div>

              {/* Footer modal */}
              <div className="border-t-2 bg-gray-50 px-6 py-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 font-semibold transition-all"
                >
                  ← Modifier / Retour
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <FiCheck size={20} />
                  Confirmer et envoyer →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ReservationModal;