// src/components/modals/ReprogrammationModal.tsx
import React, { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle, FiCheckCircle, FiFileText, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice'; // adapte le chemin
import type { BilletLigne, ServiceSpecifique } from '../../app/front_office/billetSlice';
import { fetchRaisonsAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

type ModifType = 'SIMPLE' | 'COM' | 'PEN' | 'COM_PEN';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  ligne: BilletLigne | null | undefined; // ← accepte null/undefined
  loading?: boolean;
  serviceById: Map<string, ServiceSpecifique>;
}

export default function ReprogrammationModal({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  loading = false,
  serviceById,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  // Sélection bénéficiaire (comme ReservationModal)
  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );
  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );

  const [selectedBeneficiaireId, setSelectedBeneficiaireId] = useState<string>('');
  const [clientbeneficiaireInfoId, setClientbeneficiaireInfoId] = useState<string>('');

  // Champs du formulaire
  const [typeModif, setTypeModif] = useState<ModifType>('SIMPLE');
  const [conditionModif, setConditionModif] = useState('');
  const [tauxChange, setTauxChange] = useState<number | ''>(
    ligne?.prospectionLigne?.tauxEchange || 4500
  );
  const [numeroVol, setNumeroVol] = useState(ligne?.prospectionLigne?.numeroVol || '');
  const [dateHeureDepartRaw, setDateHeureDepartRaw] = useState(
    ligne?.prospectionLigne?.dateHeureDepart 
        ? new Date(ligne.prospectionLigne.dateHeureDepart).toISOString().slice(0, 16) 
        : ''
  );
  const [dateHeureArriveRaw, setDateHeureArriveRaw] = useState(
  ligne?.prospectionLigne?.dateHeureArrive 
      ? new Date(ligne.prospectionLigne.dateHeureArrive).toISOString().slice(0, 16) 
      : ''
  );
  const [resaCommDevise, setResaCommDevise] = useState(0);
  const [resaCommAriary, setResaCommAriary] = useState(0);
  const [penalitePu, setPenalitePu] = useState(0);
  const [penaliteMontant, setPenaliteMontant] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const [classe, setClasse] = useState(
    ligne?.prospectionLigne?.classe || 'ECONOMIE' // valeur par défaut ou existante
  );

  // Raison d'annulation (comme dans AnnulationBilletModal)
  const { items: raisons, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );
  const [rasionAnnulationId, setRasionAnnulationId] = useState<string>('');

  // Services (on garde les existants par défaut, et on permet modification simple)
  const [services, setServices] = useState<
    { serviceSpecifiqueId: string; valeur: string }[]
  >(
    ligne?.prospectionLigne?.serviceProspectionLigne?.map((s) => ({
      serviceSpecifiqueId: s.serviceSpecifiqueId,
      valeur: s.valeur,
    })) || []
  );

  useEffect(() => {
    if (isOpen && raisons.length === 0 && !raisonsLoading) {
      dispatch(fetchRaisonsAnnulation());
    }
  }, [isOpen, raisons.length, raisonsLoading, dispatch]);

  // Fetch infos bénéficiaire quand sélectionné
  useEffect(() => {
    if (selectedBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(selectedBeneficiaireId));
      setClientbeneficiaireInfoId(''); // reset document
    }
  }, [selectedBeneficiaireId, dispatch]);

  // Garde très tôt si ligne manquante
  if (!isOpen) return null;

  if (!ligne) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-center max-w-md">
          <FiAlertTriangle className="text-red-600 text-5xl mx-auto mb-4" />
          <p className="text-red-600 font-medium text-lg mb-6">
            Erreur : ligne à reprogrammer non disponible
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const buildPayload = () => {
    if (!ligne?.id) {
      throw new Error("ID de la ligne manquant");
    }
    if (!clientbeneficiaireInfoId) {
      throw new Error("Document bénéficiaire obligatoire");
    }
    if (tauxChange === '' || isNaN(Number(tauxChange))) {
      throw new Error("Taux de change obligatoire et valide");
    }
    if (!numeroVol.trim()) {
      throw new Error("Numéro de vol obligatoire");
    }
    if (!classe) {
      throw new Error("Classe obligatoire");
    }

    // Dates
    let finalDepart = '';
    let finalArrive = '';

    if (dateHeureDepartRaw) {
      const dateObj = new Date(dateHeureDepartRaw);
      if (!isNaN(dateObj.getTime())) {
        finalDepart = dateObj.toISOString();
      } else {
        throw new Error("Date de départ invalide");
      }
    }

    if (dateHeureArriveRaw) {
      const dateObj = new Date(dateHeureArriveRaw);
      if (!isNaN(dateObj.getTime())) {
        finalArrive = dateObj.toISOString();
      } else {
        throw new Error("Date d'arrivée invalide");
      }
    }

    const payload = {
      id: ligne.id,
      type: typeModif,
      classe,                           // ← nouveau
      rasionAnnulationId: rasionAnnulationId || null,  // ← nouveau (peut être null)
      conditionAnnul: typeModif !== 'PEN' ? conditionModif.trim() || null : null,
      conditionModif: typeModif !== 'PEN' ? conditionModif.trim() || null : null,
      resaTauxEchange: Number(tauxChange),
      clientbeneficiaireInfoId,
      dateHeureDepart: finalDepart,
      dateHeureArrive: finalArrive,

      // Prix (on garde les valeurs existantes ou 0 si pas remplies)
      puResaBilletCompagnieDevise: ligne.puResaBilletCompagnieDevise || 0,
      puResaServiceCompagnieDevise: ligne.puResaServiceCompagnieDevise || 0,
      puResaPenaliteCompagnieDevise: penalitePu || 0,
      puResaMontantPenaliteCompagnieDevise: penaliteMontant || 0,
      puResaMontantBilletCompagnieDevise: ligne.puResaMontantBilletCompagnieDevise || 0,
      puResaMontantServiceCompagnieDevise: ligne.puResaMontantServiceCompagnieDevise || 0,

      // Commissions
      resaCommissionEnDevise: resaCommDevise || 0,
      resaCommissionEnAriary: resaCommAriary || 0,

      devise: ligne.devise || 'EUR',

      // Services modifiés ou conservés
      services: services.map((s) => ({
        serviceSpecifiqueId: s.serviceSpecifiqueId,
        valeur: s.valeur,  // string pour l'instant (true/false/"23kg"/etc.)
      })),
    };

    return payload;
  };

  const handleSubmit = () => {
    try {
      const payload = buildPayload();
      onSubmit(payload);
      setShowPreview(false);
    } catch (err: any) {
      alert(err.message || 'Erreur de validation');
    }
  };

  const selectedBeneficiaire = beneficiaires.find(
    (b) => b.clientBeneficiaireId === selectedBeneficiaireId
  );
  const selectedInfo = infosList.find(
    (info) => info.id === clientbeneficiaireInfoId
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600 text-2xl" />
            <div>
              <h2 className="text-xl font-bold">Reprogrammation de la ligne</h2>
              <p className="text-sm text-gray-600">
                Ligne {ligne.id?.slice(-8) || '—'} •{' '}
                {ligne.prospectionLigne?.itineraire || 'Itinéraire inconnu'}
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <FiX size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type de modification */}
          <div>
            <label className="block font-medium mb-1">Type de modification</label>
            <select
              value={typeModif}
              onChange={(e) => setTypeModif(e.target.value as ModifType)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
            >
              <option value="SIMPLE">SIMPLE (sans frais)</option>
              <option value="COM">COMMISSION</option>
              <option value="PEN">PÉNALITÉ</option>
              <option value="COM_PEN">COMMISSION + PÉNALITÉ</option>
            </select>
          </div>

          {/* Étape 1 : Bénéficiaire */}
          <div>
            <label className="block font-medium mb-1">
              Bénéficiaire <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedBeneficiaireId}
              onChange={(e) => setSelectedBeneficiaireId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">-- Choisir un bénéficiaire --</option>
              {beneficiaires.map((b) => (
                <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                  {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code} •{' '}
                  {b.clientBeneficiaire.statut}
                </option>
              ))}
            </select>

            {selectedBeneficiaire && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 bg-green-100 rounded-lg flex-shrink-0">
                    <FiCheck className="text-green-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-2">Bénéficiaire sélectionné</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Nom</p>
                        <p className="font-medium">{selectedBeneficiaire.clientBeneficiaire.libelle}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Code</p>
                        <p className="font-medium">{selectedBeneficiaire.clientBeneficiaire.code}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Statut</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            selectedBeneficiaire.clientBeneficiaire.statut === 'ACTIF'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedBeneficiaire.clientBeneficiaire.statut}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Étape 2 : Document */}
          <div>
            <label className="block font-medium mb-1">
              Document d'identité <span className="text-red-600">*</span>
            </label>

            {!selectedBeneficiaireId ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <FiAlertCircle className="text-amber-600" size={18} />
                <p className="text-sm text-amber-800">Sélectionnez d'abord un bénéficiaire</p>
              </div>
            ) : infosLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                <span className="ml-3 text-gray-600">Chargement...</span>
              </div>
            ) : (
              <select
                value={clientbeneficiaireInfoId}
                onChange={(e) => setClientbeneficiaireInfoId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">-- Choisir un document --</option>
                {infosList.map((info) => (
                  <option key={info.id} value={info.id}>
                    {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc} • Type: {info.clientType}
                  </option>
                ))}
              </select>
            )}

            {clientbeneficiaireInfoId && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-lg flex-shrink-0">
                    <FiFileText className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-2">Document sélectionné</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Affichage similaire à ReservationModal */}
                      {infosList
                        .find((i) => i.id === clientbeneficiaireInfoId)
                        ?.prenom && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Nom complet</p>
                          <p className="font-medium">
                            {infosList.find((i) => i.id === clientbeneficiaireInfoId)?.prenom}{' '}
                            {infosList.find((i) => i.id === clientbeneficiaireInfoId)?.nom}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Taux de change */}
          <div>
            <label className="block font-medium mb-1">
              Taux de change <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tauxChange}
              onChange={(e) => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Classe */}
          <div>
            <label className="block font-medium mb-1">
              Classe <span className="text-red-600">*</span>
            </label>
            <select
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">-- Choisir la classe --</option>
              <option value="ECONOMIE">Économie</option>
              <option value="PREMIUM">Premium</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>

          {/* Raison d'annulation (comme dans annulation) */}
          <div>
            <label className="block font-medium mb-1">
              Raison d'annulation (optionnel)
            </label>

            {raisonsLoading ? (
              <div className="text-sm text-gray-500">Chargement...</div>
            ) : raisons.length === 0 ? (
              <div className="text-sm text-amber-600">Aucune raison disponible</div>
            ) : (
              <select
                value={rasionAnnulationId}
                onChange={(e) => setRasionAnnulationId(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Aucune raison --</option>
                {raisons
                  .filter((r) => r.statut === 'ACTIF')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.libelle}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Vol & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">N° Vol <span className="text-red-600">*</span></label>
              <input
                type="text"
                value={numeroVol}
                onChange={(e) => setNumeroVol(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
            <label className="block font-medium mb-1">Départ <span className="text-red-600">*</span></label>
            <input
                type="datetime-local"
                value={dateHeureDepartRaw}
                onChange={(e) => setDateHeureDepartRaw(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                required
            />
            </div>

            <div>
            <label className="block font-medium mb-1">Arrivée <span className="text-red-600">*</span></label>
            <input
                type="datetime-local"
                value={dateHeureArriveRaw}
                onChange={(e) => setDateHeureArriveRaw(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                required
            />
            </div>
          </div>

          {/* Condition (sauf PEN) */}
          {typeModif !== 'PEN' && (
            <div>
              <label className="block font-medium mb-1">Condition de modification</label>
              <textarea
                value={conditionModif}
                onChange={(e) => setConditionModif(e.target.value)}
                className="w-full border rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Changement horaire à la demande du client"
              />
            </div>
          )}

          {/* Commission */}
          {(typeModif === 'COM' || typeModif === 'COM_PEN') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-semibold text-amber-800 mb-3">Commission</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Devise</label>
                  <input
                    type="number"
                    step="0.01"
                    value={resaCommDevise}
                    onChange={(e) => setResaCommDevise(Number(e.target.value))}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Ariary</label>
                  <input
                    type="number"
                    value={resaCommAriary}
                    onChange={(e) => setResaCommAriary(Number(e.target.value))}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pénalité */}
          {(typeModif === 'PEN' || typeModif === 'COM_PEN') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="font-semibold text-red-800 mb-3">Pénalité</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">PU Pénalité (Devise)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={penalitePu}
                    onChange={(e) => setPenalitePu(Number(e.target.value))}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">PU Pénalité (Ariary)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={penaliteMontant}
                    onChange={(e) => setPenaliteMontant(Number(e.target.value))}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Services - édition simple */}
          <div className="mt-6 border-t pt-4">
            <label className="block font-medium mb-2">Services spécifiques</label>
            {services.length > 0 ? (
              <div className="space-y-3">
                {services.map((svc, index) => {
                  const lib = serviceById.get(svc.serviceSpecifiqueId)?.libelle || 'Service inconnu';
                  return (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 font-medium">{lib}</div>
                      <input
                        type="text"
                        value={svc.valeur}
                        onChange={(e) => {
                          const newServices = [...services];
                          newServices[index].valeur = e.target.value;
                          setServices(newServices);
                        }}
                        className="w-32 border rounded p-2 text-sm"
                        placeholder="Valeur (Oui/Non/23kg...)"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">Aucun service associé</div>
            )}
          </div>

          {/* Bouton preview */}
            <button
            onClick={() => setShowPreview(true)}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={
                !clientbeneficiaireInfoId ||
                tauxChange === '' ||
                isNaN(Number(tauxChange)) ||
                !numeroVol.trim() ||
                !dateHeureDepartRaw.trim() ||    // ← utilise la valeur brute
                !dateHeureArriveRaw.trim()       // ← utilise la valeur brute
            }
            >
            <FiCheckCircle /> Vérifier avant envoi
            </button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold">Prévisualisation</h3>
                <p className="text-sm text-gray-500">Données envoyées :</p>
              </div>
              <div className="p-6 bg-gray-50 font-mono text-sm max-h-[60vh] overflow-auto">
                <pre>{JSON.stringify(buildPayload(), null, 2)}</pre>
              </div>
              <div className="p-6 flex gap-4 border-t">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-100"
                >
                  Modifier
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {loading ? 'En cours...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}