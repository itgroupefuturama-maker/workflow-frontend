import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import type { BilletLigne } from '../../app/front_office/billetSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchRaisonsAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

type AnnulType = 'SIMPLE' | 'COM' | 'PEN' | 'COM_PEN';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  lignes: BilletLigne[];
  type: 'reservation' | 'emission';
  loading?: boolean;
  enteteId: string;
}

export default function AnnulationBilletModal({
  isOpen,
  onClose,
  onSubmit,
  lignes,
  type,
  loading = false,
  enteteId,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const { items: raisons, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );

  
  const [typeAnnul, setTypeAnnul] = useState<AnnulType>('SIMPLE');
  
  const [raison, setRaison] = useState('');
  const [tauxChange, setTauxChange] = useState<number | ''>(4500); // valeur par défaut réaliste
  const [resaCommDevise, setResaCommDevise] = useState(0);
  const [resaCommAriary, setResaCommAriary] = useState(0);
  const [penalitePu, setPenalitePu] = useState(0);
  const [penaliteMontant, setPenaliteMontant] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Charger les raisons au montage si pas encore chargées
  useEffect(() => {
    if (isOpen && raisons.length === 0 && !raisonsLoading) {
      dispatch(fetchRaisonsAnnulation());
    }
  }, [isOpen, raisons.length, raisonsLoading, dispatch]);
  
  const [selectedLigneId, setSelectedLigneId] = useState<string>('');
  const [rasionAnnulationId, setRaisonAnnulationId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return; // on ne fait rien quand on ferme

    setRaisonAnnulationId('');
    setSelectedLigneId(lignes?.[0]?.id || '');
  }, [isOpen, lignes]);

  // Garde très tôt
  if (!isOpen) return null;

  if (!lignes || !Array.isArray(lignes)) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-center max-w-md">
          <FiAlertTriangle className="text-red-600 text-5xl mx-auto mb-4" />
          <p className="text-red-600 font-medium text-lg mb-6">
            Erreur : aucune ligne disponible pour l'annulation
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
    const payload: any = {
      id: selectedLigneId,
      rasionAnnulationId: rasionAnnulationId,     // essaie ça
      // rasionAnnulationId: raisonAnnulationId,  // ou ça
      type: typeAnnul,
      tauxChange: Number(tauxChange),
      conditionAnnul: raisons.find(r => r.id === rasionAnnulationId)?.libelle || '',
    };

    if (typeAnnul === 'COM' || typeAnnul === 'COM_PEN') {
      payload.resaCommissionEnDevise = Number(resaCommDevise);
      payload.resaCommissionEnAriary = Number(resaCommAriary);
    }

    if (typeAnnul === 'PEN' || typeAnnul === 'COM_PEN') {
      payload.puResaPenaliteCompagnieDevise = Number(penalitePu);
      payload.puResaMontantPenaliteCompagnieDevise = Number(penaliteMontant);
    }

    console.log('[DEBUG] Payload:', payload);
    return payload;
  };

  const handleSubmit = () => {
    if (!selectedLigneId) {
      alert('Veuillez sélectionner une ligne à annuler');
      return;
    }

    if (tauxChange === '' || isNaN(Number(tauxChange))) {
      alert('Le taux de change est obligatoire et doit être un nombre valide');
      return;
    }

    if (typeAnnul !== 'PEN' && !raison.trim()) {
      alert('La raison est obligatoire sauf pour le type PÉNALITÉ');
      return;
    }

    try {
      const payload = buildPayload();
      onSubmit(payload);
      setShowPreview(false);
    } catch (err: any) {
      alert(err.message || 'Erreur validation');
    }
  };

  const isConfirmDisabled =
    loading ||
    !selectedLigneId ||
    tauxChange === '' ||
    isNaN(Number(tauxChange)) ||
    !rasionAnnulationId;


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paramétrage & Annulation
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Billet {enteteId}</p>
              </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">

          {/* Raison d'annulation → NOUVELLE VERSION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison d'annulation <span className="text-red-600">*</span>
            </label>

            {raisonsLoading ? (
              <div className="text-sm text-gray-500">Chargement des raisons...</div>
            ) : raisons.length === 0 ? (
              <div className="text-sm text-red-600">Aucune raison disponible</div>
            ) : (
              <select
                value={rasionAnnulationId}
                onChange={(e) => setRaisonAnnulationId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                required
              >
                <option value="">-- Choisir une raison --</option>
                {raisons
                  .filter(r => r.statut === 'ACTIF') // filtre optionnel
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.libelle}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Sélection de la ligne */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ligne à annuler <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedLigneId}
              onChange={(e) => setSelectedLigneId(e.target.value)}
              disabled={lignes.length === 0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {lignes.length === 0 ? (
                <option value="">Aucune ligne disponible</option>
              ) : (
                <>
                  <option value="">-- Choisir une ligne --</option>
                  {lignes
                    .filter((l) => l.statut === 'FAIT')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.reservation ? l.reservation : 'N°'} - {l.statut}
                      </option>
                    ))}
                </>
              )}
            </select>
          </div>

          {/* Type d'annulation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'annulation <span className="text-red-600">*</span>
            </label>
            <select
              value={typeAnnul}
              onChange={(e) => setTypeAnnul(e.target.value as AnnulType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="SIMPLE">Simple (condition seulement)</option>
              <option value="COM">Commission uniquement</option>
              <option value="PEN">Pénalité uniquement</option>
              <option value="COM_PEN">Commission + Pénalité</option>
            </select>
          </div>

          {/* Taux de change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de change <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tauxChange}
              onChange={(e) => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Ex: 4500"
              required
            />
          </div>
          
          {/* Raison Annulation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition d'annulation <span className="text-red-600">*</span>
            </label>
            
            <select
              value={raison}
              onChange={(e) => {
                const val = e.target.value;
                setRaison(val);
                if (val === "Autre") {
                  setRaison("");
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white mb-3"
            >
              <option value="">-- Choisir une raison --</option>
              <option value="Annulation client">Annulation à la demande du client</option>
              <option value="Erreur saisie">Erreur de saisie / double réservation</option>
              <option value="Changement itinéraire">Changement d'itinéraire</option>
              <option value="Problème médical">Problème médical / décès</option>
              <option value="Annulation compagnie">Vol annulé par la compagnie</option>
              <option value="Surbooking">Surbooking / overbooking</option>
              <option value="Autre">Autre (préciser)</option>
            </select>

            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] resize-none"
              placeholder="Précisez la raison de l'annulation..."
              required
            />
          </div>

          {/* Commission */}
          {(typeAnnul === 'COM' || typeAnnul === 'COM_PEN') && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                Commission de réservation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Commission (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={resaCommDevise}
                    onChange={(e) => setResaCommDevise(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Commission (Ariary)
                  </label>
                  <input
                    type="number"
                    value={resaCommAriary}
                    onChange={(e) => setResaCommAriary(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pénalité */}
          {(typeAnnul === 'PEN' || typeAnnul === 'COM_PEN') && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                Pénalité d'annulation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Prix unitaire (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={penalitePu}
                    onChange={(e) => setPenalitePu(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Montant total (Devise)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={penaliteMontant}
                    onChange={(e) => setPenaliteMontant(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Les champs avec <span className="text-red-600">*</span> sont obligatoires
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={!selectedLigneId || tauxChange === '' || isNaN(Number(tauxChange))}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FiCheckCircle size={16} />
                Vérifier et confirmer
              </button>
            </div>
          </div>
        </div>

        {/* Modal Preview */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Prévisualisation</h3>
                <p className="text-sm text-gray-500 mt-1">Vérifiez les données avant confirmation</p>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(buildPayload(), null, 2)}
                  </pre>
                </div>
              </div>

              {/* Preview Footer */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isConfirmDisabled}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}