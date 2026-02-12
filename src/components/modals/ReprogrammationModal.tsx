// src/components/modals/ReprogrammationModal.tsx
import React, { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle, FiCheckCircle, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice';
import type { BilletLigne, ServiceSpecifique } from '../../app/front_office/billetSlice';
import { fetchRaisonsAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

type ModifType = 'SIMPLE' | 'COM' | 'PEN' | 'COM_PEN';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  ligne: BilletLigne | null | undefined;
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

  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );

  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );

  const { items: raisons, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );

  // ─── État multi-passagers ─────────────────────────────────
  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{
      beneficiaireId: string;
      infoId: string;
      nomComplet: string;
      typeDoc?: string;
      referenceDoc?: string;
    }>
  >([]);

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');

  // Ajouter ces états (juste après les autres useState)
  const [puBilletDevise, setPuBilletDevise] = useState<number>(
    ligne?.puResaBilletCompagnieDevise || 0
  );
  const [puServiceDevise, setPuServiceDevise] = useState<number>(
    ligne?.puResaServiceCompagnieDevise || 0
  );
  const [puPenaliteDevise, setPuPenaliteDevise] = useState<number>(
    ligne?.puResaPenaliteCompagnieDevise || 0   // ou garder penalitePu si tu préfères
  );
  const [puMontantPenalite, setPuMontantPenalite] = useState<number>(
    ligne?.puResaMontantPenaliteCompagnieDevise || 0   // ou garder penaliteMontant
  );
  const [puMontantBilletAriary, setPuMontantBilletAriary] = useState<number>(
    ligne?.puResaMontantBilletCompagnieDevise || 0
  );
  const [puMontantServiceAriary, setPuMontantServiceAriary] = useState<number>(
    ligne?.puResaMontantServiceCompagnieDevise || 0
  );

  // ─── Autres états du formulaire ───────────────────────────
  const [typeModif, setTypeModif] = useState<ModifType>('COM_PEN');
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
  const [classe, setClasse] = useState(ligne?.prospectionLigne?.classe || 'ECONOMIE');
  const [rasionAnnulationId, setRasionAnnulationId] = useState<string>('');

  const [services, setServices] = useState<
    { serviceSpecifiqueId: string; valeur: string }[]
  >(
    ligne?.prospectionLigne?.serviceProspectionLigne?.map((s) => ({
      serviceSpecifiqueId: s.serviceSpecifiqueId,
      valeur: s.valeur,
    })) || []
  );

  const [sectionActive, setSectionActive] = useState<'date' | 'passager' | 'type'>('date');

  // ─── Pré-sélection des passagers déjà liés à la ligne ─────
  useEffect(() => {
    if (isOpen && ligne && ligne.billet && ligne.billet.length > 0) {
      const preselected = ligne.billet.map((b) => {
        const info = b.clientbeneficiaireInfo;
        const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim() || 'Passager inconnu';
        return {
          beneficiaireId: info.clientbeneficiaireId,
          infoId: info.id,
          nomComplet,
          typeDoc: info.typeDoc,
          referenceDoc: info.referenceDoc,
        };
      });

      setSelectedPassagers(preselected);
    }
  }, [isOpen, ligne]);

  // Chargement raisons annulation
  useEffect(() => {
    if (isOpen && raisons.length === 0 && !raisonsLoading) {
      dispatch(fetchRaisonsAnnulation());
    }
  }, [isOpen, raisons.length, raisonsLoading, dispatch]);

  // Chargement infos bénéficiaire quand on change le courant
  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
      setCurrentInfoId('');
    }
  }, [currentBeneficiaireId, dispatch]);

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

  // ─── Gestion ajout/suppression passagers ──────────────────
  const addPassager = () => {
    if (!currentBeneficiaireId || !currentInfoId) {
      alert('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }

    const beneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find((i) => i.id === currentInfoId);

    if (!beneficiaire || !info) return;

    const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim() || beneficiaire.clientBeneficiaire.libelle;

    if (selectedPassagers.some((p) => p.infoId === currentInfoId)) {
      alert('Ce document est déjà sélectionné');
      return;
    }

    setSelectedPassagers((prev) => [
      ...prev,
      {
        beneficiaireId: currentBeneficiaireId,
        infoId: currentInfoId,
        nomComplet,
        typeDoc: info.typeDoc,
        referenceDoc: info.referenceDoc,
      },
    ]);

    setCurrentBeneficiaireId('');
    setCurrentInfoId('');
  };

  const removePassager = (infoId: string) => {
    setSelectedPassagers((prev) => prev.filter((p) => p.infoId !== infoId));
  };

  // ─── Construction payload (format exact demandé) ──────────
  const buildPayload = () => {
    if (!ligne?.id) throw new Error('ID de la ligne manquant');

    if (selectedPassagers.length === 0) {
      throw new Error('Au moins un passager est requis');
    }

    if (tauxChange === '' || isNaN(Number(tauxChange))) {
      throw new Error('Taux de change obligatoire et valide');
    }

    if (!numeroVol.trim()) throw new Error('Numéro de vol obligatoire');
    if (!classe) throw new Error('Classe obligatoire');

    let finalDepart = '';
    if (dateHeureDepartRaw) {
      const d = new Date(dateHeureDepartRaw);
      if (!isNaN(d.getTime())) finalDepart = d.toISOString();
      else throw new Error('Date de départ invalide');
    }

    let finalArrive = '';
    if (dateHeureArriveRaw) {
      const d = new Date(dateHeureArriveRaw);
      if (!isNaN(d.getTime())) finalArrive = d.toISOString();
      else throw new Error('Date d’arrivée invalide');
    }

    return {
      id: ligne.id,
      type: typeModif,
      classe,
      rasionAnnulationId: rasionAnnulationId || null,
      conditionAnnul: typeModif !== 'PEN' ? conditionModif.trim() || null : null,
      conditionModif: typeModif !== 'PEN' ? conditionModif.trim() || null : null,
      resaTauxEchange: Number(tauxChange),
      passagerIds: selectedPassagers.map((p) => p.infoId),
      dateHeureDepart: finalDepart,
      dateHeureArrive: finalArrive,
      puResaBilletCompagnieDevise: ligne.puResaBilletCompagnieDevise || 0,
      puResaServiceCompagnieDevise: ligne.puResaServiceCompagnieDevise || 0,
      puResaPenaliteCompagnieDevise: penalitePu || 0,
      puResaMontantPenaliteCompagnieDevise: penaliteMontant || 0,
      puResaMontantBilletCompagnieDevise: ligne.puResaMontantBilletCompagnieDevise || 0,
      puResaMontantServiceCompagnieDevise: ligne.puResaMontantServiceCompagnieDevise || 0,
      resaCommissionEnDevise: resaCommDevise || 0,
      resaCommissionEnAriary: resaCommAriary || 0,
      devise: ligne.devise || 'EUR',
      services: services.map((s) => ({
        serviceSpecifiqueId: s.serviceSpecifiqueId,
        valeur: s.valeur,
      })),
    };
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

  const nombrePassagers = selectedPassagers.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-gray-100 border-b-2 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="text-gray-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modification de la ligne</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {ligne.prospectionLigne?.itineraire || '—'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Informations de base */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Raison */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Raison de modification <span className="text-red-600">*</span>
                  </label>
                  {raisonsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Chargement...
                    </div>
                  ) : raisons.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">Aucune raison disponible</div>
                  ) : (
                    <select
                      value={rasionAnnulationId}
                      onChange={(e) => setRasionAnnulationId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                      <option value="">-- Sélectionner --</option>
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

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de modification <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={typeModif}
                    onChange={(e) => setTypeModif(e.target.value as ModifType)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  >
                    <option value="COM_PEN">Commission + Pénalité</option>
                    <option value="SIMPLE">Simple (sans frais)</option>
                    <option value="COM">Commission</option>
                    <option value="PEN">Pénalité</option>
                  </select>
                </div>

                {/* Taux */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Taux de change (Ar) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tauxChange}
                    onChange={(e) => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="4500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Type de reprogrammation */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Type de reprogrammation
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSectionActive('date')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    sectionActive === 'date'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Date / Vol
                </button>
                
                <button
                  type="button"
                  onClick={() => setSectionActive('passager')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    sectionActive === 'passager'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Passager
                </button>
                
                <button
                  type="button"
                  onClick={() => setSectionActive('type')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    sectionActive === 'type'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Type / Classe
                </button>
              </div>
            </div>

            {/* Section Passagers */}
            {sectionActive === 'passager' && (
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold text-gray-900">
                    Passagers associés <span className="text-red-600">*</span>
                  </label>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {nombrePassagers} sélectionné{nombrePassagers > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Ajout */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Bénéficiaire
                      </label>
                      <select
                        value={currentBeneficiaireId}
                        onChange={(e) => {
                          setCurrentBeneficiaireId(e.target.value);
                          setCurrentInfoId('');
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      >
                        <option value="">— Choisir —</option>
                        {beneficiaires.map((b) => (
                          <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                            {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentBeneficiaireId && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Document
                        </label>
                        {infosLoading ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Chargement...
                          </div>
                        ) : infosList.length === 0 ? (
                          <div className="text-sm text-gray-500 py-2">Aucun document trouvé</div>
                        ) : (
                          <select
                            value={currentInfoId}
                            onChange={(e) => setCurrentInfoId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          >
                            <option value="">— Choisir —</option>
                            {infosList.map((info) => (
                              <option key={info.id} value={info.id}>
                                {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addPassager}
                      disabled={!currentBeneficiaireId || !currentInfoId}
                      className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                    >
                      + Ajouter
                    </button>
                  </div>

                  {/* Liste */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Sélectionnés
                    </label>
                    {selectedPassagers.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400">
                        Aucun passager
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedPassagers.map((p, idx) => (
                          <div
                            key={p.infoId}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white text-xs rounded flex items-center justify-center font-semibold">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{p.nomComplet}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {p.typeDoc} {p.referenceDoc ? `(${p.referenceDoc})` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removePassager(p.infoId)}
                              className="flex-shrink-0 text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section Type/Classe */}
            {sectionActive === 'type' && (
              <div className="bg-white border border-gray-100 rounded-lg p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Classe <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={classe}
                    onChange={(e) => setClasse(e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    required
                  >
                    <option value="">-- Choisir --</option>
                    <option value="ECONOMIE">Économie</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="BUSINESS">Business</option>
                    <option value="FIRST">First</option>
                  </select>
                </div>

                {/* Services */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Services spécifiques
                  </label>
                  {services.length > 0 ? (
                    <div className="space-y-2">
                      {services.map((svc, index) => {
                        const lib = serviceById.get(svc.serviceSpecifiqueId)?.libelle || 'Service inconnu';
                        return (
                          <div key={index} className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                            <div className="flex-1 text-sm font-medium text-gray-700">{lib}</div>
                            <input
                              type="text"
                              value={svc.valeur}
                              onChange={(e) => {
                                const newServices = [...services];
                                newServices[index].valeur = e.target.value;
                                setServices(newServices);
                              }}
                              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                              placeholder="Valeur"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">Aucun service</div>
                  )}
                </div>
              </div>
            )}

            {/* Section Date */}
            {sectionActive === 'date' && (
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Vol & Dates <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Date et heure de départ
                    </label>
                    <input
                      type="datetime-local"
                      value={dateHeureDepartRaw}
                      onChange={(e) => setDateHeureDepartRaw(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Date et heure d'arrivée
                    </label>
                    <input
                      type="datetime-local"
                      value={dateHeureArriveRaw}
                      onChange={(e) => setDateHeureArriveRaw(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prix unitaires */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Prix unitaires (Compagnie)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Billet (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={puBilletDevise}
                    onChange={(e) => setPuBilletDevise(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Billet (Ariary)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={puMontantBilletAriary}
                    onChange={(e) => setPuMontantBilletAriary(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Service (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={puServiceDevise}
                    onChange={(e) => setPuServiceDevise(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Service (Ariary)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={puMontantServiceAriary}
                    onChange={(e) => setPuMontantServiceAriary(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Pénalité (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={puPenaliteDevise}
                    onChange={(e) => setPuPenaliteDevise(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    PU Pénalité (Ariary)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={puMontantPenalite}
                    onChange={(e) => setPuMontantPenalite(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Commission */}
            {(typeModif === 'COM' || typeModif === 'COM_PEN') && (
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Commission</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Devise</label>
                    <input
                      type="number"
                      step="0.01"
                      value={resaCommDevise}
                      onChange={(e) => setResaCommDevise(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ariary</label>
                    <input
                      type="number"
                      value={resaCommAriary}
                      onChange={(e) => setResaCommAriary(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pénalité */}
            {(typeModif === 'PEN' || typeModif === 'COM_PEN') && (
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Pénalité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">PU Pénalité (Devise)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={penalitePu}
                      onChange={(e) => setPenalitePu(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">PU Pénalité (Ariary)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={penaliteMontant}
                      onChange={(e) => setPenaliteMontant(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white border-gray-100 px-6 py-4">
          <button
            onClick={() => setShowPreview(true)}
            className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            disabled={
              selectedPassagers.length === 0 ||
              tauxChange === '' ||
              isNaN(Number(tauxChange)) ||
              !numeroVol.trim() ||
              !dateHeureDepartRaw.trim() ||
              !dateHeureArriveRaw.trim()
            }
          >
            <FiCheckCircle size={18} />
            Vérifier avant envoi
          </button>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="bg-white border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Prévisualisation du payload</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ce JSON sera envoyé à l'API <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">PATCH /billet/{ligne.id}/reprogrammer</code>
                </p>
              </div>

              {/* JSON */}
              <div className="flex-1 p-6 bg-gray-900 overflow-auto">
                <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(buildPayload(), null, 2)}
                </pre>
              </div>

              {/* Footer */}
              <div className="border-t bg-white px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      En cours...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={16} />
                      Confirmer
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
}