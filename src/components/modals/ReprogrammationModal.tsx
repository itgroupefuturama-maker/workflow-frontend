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

  // ─── Autres états du formulaire ───────────────────────────
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600 text-2xl" />
            <div>
              <h2 className="text-xl font-bold">Reprogrammation de la ligne</h2>
              <p className="text-sm text-gray-600">
                Ligne {ligne.id?.slice(-8) || '—'} • {ligne.prospectionLigne?.itineraire || '—'}
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

          {/* Passagers – multi-sélection avec pré-remplissage */}
          <div>
            <label className="block font-medium mb-2">
              Passagers associés <span className="text-red-600">*</span> ({nombrePassagers})
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne ajout */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bénéficiaire</label>
                  <select
                    value={currentBeneficiaireId}
                    onChange={(e) => {
                      setCurrentBeneficiaireId(e.target.value);
                      setCurrentInfoId('');
                    }}
                    className="w-full border rounded-lg p-2.5 focus:ring-amber-500"
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
                    <label className="block text-sm font-medium mb-1">Document</label>
                    {infosLoading ? (
                      <div className="text-gray-500 italic">Chargement...</div>
                    ) : infosList.length === 0 ? (
                      <div className="text-amber-700 bg-amber-50 p-3 rounded">
                        Aucun document trouvé
                      </div>
                    ) : (
                      <select
                        value={currentInfoId}
                        onChange={(e) => setCurrentInfoId(e.target.value)}
                        className="w-full border rounded-lg p-2.5 focus:ring-amber-500"
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

                <button
                  type="button"
                  onClick={addPassager}
                  disabled={!currentBeneficiaireId || !currentInfoId}
                  className="mt-2 px-5 py-2 bg-green-600 text-white rounded disabled:opacity-50 hover:bg-green-700 transition"
                >
                  + Ajouter ce passager
                </button>
              </div>

              {/* Colonne liste */}
              <div>
                {selectedPassagers.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded p-6 text-center text-gray-500 text-sm">
                    Aucun passager sélectionné
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
                            <p className="text-xs text-gray-600">
                              {p.typeDoc} {p.referenceDoc ? `(${p.referenceDoc})` : ''}
                            </p>
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
          </div>

          {/* Taux de change */}
          <div>
            <label className="block font-medium mb-1">
              Taux de change <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
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

          {/* Raison d'annulation */}
          <div>
            <label className="block font-medium mb-1">Raison d'annulation (optionnel)</label>
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

          {/* Condition */}
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

          {/* Services */}
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
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
            disabled={
              selectedPassagers.length === 0 ||
              tauxChange === '' ||
              isNaN(Number(tauxChange)) ||
              !numeroVol.trim() ||
              !dateHeureDepartRaw.trim() ||
              !dateHeureArriveRaw.trim()
            }
          >
            <FiCheckCircle /> Vérifier avant envoi
          </button>
        </div>

        {/* Preview JSON */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Prévisualisation du payload</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ce JSON sera envoyé à l'API PATCH /billet/{ligne.id}/reprogrammer
                </p>
              </div>
              <div className="flex-1 p-6 bg-gray-900 text-green-300 font-mono text-sm overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(buildPayload(), null, 2)}
                </pre>
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
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-green-700"
                >
                  {loading ? 'En cours...' : 'Confirmer et reprogrammer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}