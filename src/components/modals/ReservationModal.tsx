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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nouvelle Réservation</h2>
            <p className="text-sm text-gray-500 mt-1">
              Vol {ligne.prospectionLigne?.numeroVol || '—'} • {ligne.prospectionLigne?.itineraire || '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* 1. Passagers */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Passagers</h3>
              <span className="text-red-600 text-sm font-medium">* Obligatoire – plusieurs possibles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sélection */}
              <div className="space-y-5 border-r pr-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bénéficiaire</label>
                  <select
                    value={currentBeneficiaireId}
                    onChange={(e) => {
                      setCurrentBeneficiaireId(e.target.value);
                      setCurrentInfoId('');
                    }}
                    className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Document / Info passager
                    </label>
                    {infosLoading ? (
                      <div className="text-gray-500 italic">Chargement...</div>
                    ) : infosList.length === 0 ? (
                      <div className="text-amber-700 bg-amber-50 p-3 rounded">
                        Aucun document trouvé pour ce bénéficiaire
                      </div>
                    ) : (
                      <select
                        value={currentInfoId}
                        onChange={(e) => setCurrentInfoId(e.target.value)}
                        className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-3 flex items-center gap-2">
                      <FiCheck size={14} /> Détails du document sélectionné
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Passager</p>
                        <p className="text-sm font-bold text-gray-800">
                          {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Type / Nationalité</p>
                        <p className="text-sm font-medium">
                          <span className="px-1.5 py-0.5 bg-white border rounded text-xs mr-1">
                            {selectedInfoDetails.clientType}
                          </span>
                          {selectedInfoDetails.nationalite}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Type Doc</p>
                        <p className="text-sm font-medium">
                          <span className="px-1.5 py-0.5 bg-white border rounded text-xs mr-1">
                            {selectedInfoDetails.typeDoc}
                          </span>
                          {selectedInfoDetails.referenceDoc}
                        </p>
                        <p className="text-sm font-medium">
                          <span className="px-1.5 py-0.5 bg-white border rounded text-xs mr-1">
                            Del : {selectedInfoDetails.dateDelivranceDoc}
                          </span>
                          Val : {selectedInfoDetails.dateDelivranceDoc}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Type Cin</p>
                        <p className="text-sm font-medium">
                          <span className="px-1.5 py-0.5 bg-white border rounded text-xs mr-1">
                            {selectedInfoDetails.cin}
                          </span>
                          {selectedInfoDetails.referenceCin}
                        </p>
                        <p className="text-sm font-medium">
                          <span className="px-1.5 py-0.5 bg-white border rounded text-xs mr-1">
                            Del : {selectedInfoDetails.dateDelivranceCin}
                          </span>
                          Val : {selectedInfoDetails.dateValiditeCin}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Whatsapp</p>
                        <p className="text-sm font-mono font-bold text-blue-700">
                          {selectedInfoDetails.whatsapp}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Tel</p>
                        <p className="text-sm font-mono font-bold text-blue-700">
                          {selectedInfoDetails.tel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Validité</p>
                        <p className={`text-sm font-bold ${new Date(selectedInfoDetails.dateValiditeDoc) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                          jusqu'au {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={addPassager}
                  disabled={!currentBeneficiaireId || !currentInfoId}
                  className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  + Ajouter ce passager
                </button>
              </div>

              {/* Liste sélectionnés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passagers sélectionnés ({selectedPassagers.length})
                </label>

                {selectedPassagers.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                    Aucun passager ajouté pour l'instant
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {selectedPassagers.map((p, idx) => (
                      <div
                        key={p.infoId}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{p.nomComplet}</p>
                            <p className="text-xs text-gray-600">Info ID: {p.infoId.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removePassager(p.infoId)}
                          className="text-red-600 hover:text-red-800 opacity-70 hover:opacity-100 transition"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 2. Réservation + Taux */}
          <section className="border-t pt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Réservation & Taux</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">N° Réservation *</label>
                <input
                  type="text"
                  name="reservation"
                  value={formData.reservation}
                  onChange={handleChange}
                  placeholder="RES-2026-002"
                  className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Devise</label>
                <input
                  type="text"
                  value={formData.devise}
                  readOnly
                  className="w-full bg-gray-100 border-gray-300 rounded-lg py-2.5 px-4 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Taux de change</label>
                <input
                  type="number"
                  name="resaTauxEchange"
                  value={formData.resaTauxEchange}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>{nombrePassagers}</strong> passager{nombrePassagers !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Tarifs */}
          <section className="border-t pt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Tarifs compagnie (devise {formData.devise})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">PU Billet</label>
                <input
                  type="number"
                  name="puResaBilletCompagnieDevise"
                  value={formData.puResaBilletCompagnieDevise}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500"
                />
                {nombrePassagers > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total → {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">PU Service</label>
                <input
                  type="number"
                  name="puResaServiceCompagnieDevise"
                  value={formData.puResaServiceCompagnieDevise}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">PU Pénalité</label>
                <input
                  type="number"
                  name="puResaPenaliteCompagnieDevise"
                  value={formData.puResaPenaliteCompagnieDevise}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Montants totaux */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-4">
                Montants totaux
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Total Billet</label>
                  <input
                    type="number"
                    name="puResaMontantBilletCompagnieDevise"
                    value={formData.puResaMontantBilletCompagnieDevise}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border-gray-300 rounded-lg py-2.5 px-4 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Total Service</label>
                  <input
                    type="number"
                    name="puResaMontantServiceCompagnieDevise"
                    value={formData.puResaMontantServiceCompagnieDevise}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border-gray-300 rounded-lg py-2.5 px-4 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Total Pénalité</label>
                  <input
                    type="number"
                    name="puResaMontantPenaliteCompagnieDevise"
                    value={formData.puResaMontantPenaliteCompagnieDevise}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border-gray-300 rounded-lg py-2.5 px-4 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className='border-t pt-8'>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold">Tarifs Client (devise Ariary)</h3>
            </div>
            <div>
              <p>Montant Billet Client: {ligne?.prospectionLigne?.montantBilletClientDevise }</p>
            </div>
            <div>
              <p>Montant Service Client: {ligne?.prospectionLigne?.montantServiceClientDevise }</p>
            </div>
            <div>
              <p>Montant Pénalité Client: {ligne?.prospectionLigne?.montantPenaliteClientDevise }</p>
            </div>
            <div>
              <p>Montant Billet Client (Ariary): {ligne?.prospectionLigne?.montantBilletClientAriary }</p>
            </div>
            <div>
              <p>Montant Service Client (Ariary): {ligne?.prospectionLigne?.montantServiceClientAriary }</p>
            </div>
            <div>
              <p>Montant Penalite Client (Ariary): {ligne?.prospectionLigne?.montantPenaliteClientAriary }</p>
            </div>
            <div>
              <p>Commission en Devise: {ligne?.prospectionLigne?.commissionEnDevise }</p>
            </div>
            <div>
              <p>Commission en Ariary: {ligne?.prospectionLigne?.commissionEnAriary }</p>
            </div>
          </section>

          {/* Récapitulatif visible */}
          {selectedPassagers.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiCheck className="text-green-600" size={20} />
                Récapitulatif avant envoi
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de réservation</p>
                    <p className="font-medium">{formData.reservation || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nombre de passagers</p>
                    <p className="font-medium">{nombrePassagers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Devise / Taux</p>
                    <p className="font-medium">
                      {formData.devise} – {formData.resaTauxEchange.toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Passagers</p>
                    <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                      {selectedPassagers.map((p) => (
                        <li key={p.infoId}>
                          {p.nomComplet} <span className="text-gray-500 text-xs">(ID: {p.infoId.slice(0, 8)}...)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Montants totaux compagnie :</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      Billet : <strong>{totalBillet.toLocaleString('fr-FR')} {formData.devise}</strong>
                    </div>
                    <div>
                      Service : <strong>{totalService.toLocaleString('fr-FR')} {formData.devise}</strong>
                    </div>
                    <div>
                      Pénalité : <strong>{totalPenalite.toLocaleString('fr-FR')} {formData.devise}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <span className="text-red-600">*</span> champs obligatoires
          </p>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Annuler
            </button>

            <button
              onClick={handleShowConfirmation}
              disabled={!isFormValid}
              className={`px-6 py-2.5 rounded-lg font-medium transition ${
                isFormValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Vérifier & Confirmer
            </button>
          </div>
        </div>

        {/* Confirmation overlay */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Confirmez-vous l'envoi de cette réservation ?
              </h3>

              <div className="flex-1 overflow-y-auto mb-6 space-y-6">
                
                {/* Infos rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Réservation</p>
                    <p className="font-medium">{formData.reservation || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Passagers</p>
                    <p className="font-medium">{nombrePassagers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total billet compagnie</p>
                    <p className="font-medium">
                      {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                    </p>
                  </div>
                </div>

                {/* JSON complet – c'est la partie la plus importante pour toi */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">Payload JSON qui sera envoyé :</span>
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap">
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

                <p className="text-sm text-gray-600 italic">
                  Vérifiez attentivement les valeurs ci-dessus avant de confirmer.
                  Cette action sera irréversible une fois envoyée.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Modifier / Retour
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                >
                  Oui, tout est correct → Envoyer maintenant
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