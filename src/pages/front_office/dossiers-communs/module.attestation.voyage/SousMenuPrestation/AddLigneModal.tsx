import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchClientBeneficiaireInfos } from '../../../../../app/portail_client/clientBeneficiaireInfosSlice';
import { createAttestationLigne } from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  destinations: any[];
  beneficiaires: any[]; // { clientBeneficiaire: { id: string; code: string; libelle: string; statut: string } }[]
  attestationEnteteId: string;
  onLigneCreated: () => void;
};

const AddLigneModal = ({
  isOpen,
  onClose,
  destinations,
  beneficiaires,
  attestationEnteteId,
  onLigneCreated,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // Sélection multiple des bénéficiaires
  const [selectedBeneficiaireIds, setSelectedBeneficiaireIds] = useState<string[]>([]);

  // Passagers sélectionnés (tous bénéficiaires confondus)
  const [selectedPassagerIds, setSelectedPassagerIds] = useState<string[]>([]);

  // Stockage local des listes de passagers par bénéficiaire
  const [beneficiairePassagers, setBeneficiairePassagers] = useState<Record<string, any[]>>({});

  const [formData, setFormData] = useState({
    numeroVol: '',
    avion: '',
    itineraire: '',
    departId: '',
    destinationId: '',
    classe: 'ECONOMIE',
    typePassager: 'ADULTE',
    dateHeureDepart: '',
    dateHeureArrive: '',
    dureeVol: '',
    dureeEscale: '0h00',
    puAriary: '',
    numeroReservation: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Chargement des infos passagers pour chaque bénéficiaire sélectionné
  useEffect(() => {
    selectedBeneficiaireIds.forEach((id) => {
      // On ne recharge pas si déjà chargé
      if (!beneficiairePassagers[id]) {
        dispatch(fetchClientBeneficiaireInfos(id)).then((action) => {
          if (action.meta.requestStatus === 'fulfilled') {
            setBeneficiairePassagers((prev) => ({
              ...prev,
              [id]: action.payload || [],
            }));
          }
        });
      }
    });
  }, [selectedBeneficiaireIds, dispatch]);

  const toggleBeneficiaire = (id: string) => {
    setSelectedBeneficiaireIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

    // Si on décoche → on enlève aussi ses passagers sélectionnés
    if (selectedBeneficiaireIds.includes(id)) {
      setSelectedPassagerIds((ids) =>
        ids.filter((pid) => !beneficiairePassagers[id]?.some((p) => p.id === pid))
      );
    }
  };

  const togglePassager = (passagerId: string) => {
    setSelectedPassagerIds((prev) =>
      prev.includes(passagerId)
        ? prev.filter((id) => id !== passagerId)
        : [...prev, passagerId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (selectedPassagerIds.length === 0) {
      setError('Veuillez sélectionner au moins un passager.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        attestationEnteteId,
        numeroVol: formData.numeroVol,
        avion: formData.avion,
        itineraire: formData.itineraire,
        departId: formData.departId,
        destinationId: formData.destinationId,
        classe: formData.classe,
        typePassager: formData.typePassager,
        dateHeureDepart: formData.dateHeureDepart
          ? new Date(formData.dateHeureDepart).toISOString()
          : '',
        dateHeureArrive: formData.dateHeureArrive
          ? new Date(formData.dateHeureArrive).toISOString()
          : '',
        dureeVol: formData.dureeVol,
        dureeEscale: formData.dureeEscale,
        puAriary: Number(formData.puAriary) || 0,
        numeroReservation: formData.numeroReservation,
        passagerIds: selectedPassagerIds,
      };

      await dispatch(createAttestationLigne(payload)).unwrap();
      onLigneCreated();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la ligne');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[94vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle ligne d'attestation</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-800 text-sm rounded">
              {error}
            </div>
          )}

          {/* Sélection bénéficiaires - Compact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clients bénéficiaires
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded border border-gray-200">
              {beneficiaires.map((b) => {
                const ben = b.clientBeneficiaire;
                const isSelected = selectedBeneficiaireIds.includes(ben.id);
                return (
                  <label
                    key={ben.id}
                    className={`flex items-start gap-2 p-2.5 rounded border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-white border-blue-300 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBeneficiaire(ben.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {ben.code && <span className="text-gray-500">{ben.code} · </span>}
                        {ben.libelle || 'Sans nom'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ben.statut || 'Statut non défini'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Passagers par bénéficiaire */}
          {selectedBeneficiaireIds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Sélection des passagers</h3>
              
              {selectedBeneficiaireIds.map((benId) => {
                const ben = beneficiaires.find((b) => b.clientBeneficiaire.id === benId)?.clientBeneficiaire;
                const passagers = beneficiairePassagers[benId] || [];
                const isLoading = !beneficiairePassagers[benId];

                return (
                  <div key={benId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Bénéficiaire header */}
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">
                        {ben?.libelle || '—'}
                      </h4>
                    </div>

                    {/* Passagers list */}
                    <div className="p-3">
                      {isLoading ? (
                        <p className="text-sm text-gray-500 italic py-2">Chargement...</p>
                      ) : passagers.length === 0 ? (
                        <p className="text-sm text-amber-700 py-2">Aucun passager enregistré</p>
                      ) : (
                        <div className="space-y-2">
                          {passagers.map((info: any) => (
                            <label 
                              key={info.id} 
                              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                                selectedPassagerIds.includes(info.id)
                                  ? 'bg-gray-50 border-gray-900'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPassagerIds.includes(info.id)}
                                onChange={() => togglePassager(info.id)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0"
                              />

                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2.5">
                                {/* Nom complet - Plus visible */}
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Passager</div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {info.prenom} {info.nom}
                                  </div>
                                </div>

                                {/* Type Client */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-0.5 inline-block">
                                    {info.clientType}
                                  </div>
                                </div>

                                {/* Nationalité */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Nationalité</div>
                                  <div className="text-sm text-gray-900">{info.nationalite}</div>
                                </div>

                                {/* Document */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Document</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-0.5 inline-block">
                                    {info.typeDoc}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono mt-0.5">{info.referenceDoc}</div>
                                </div>

                                {/* Validité Document */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité</div>
                                  <div className={`text-xs font-medium ${
                                    new Date(info.dateValiditeDoc) < new Date() 
                                      ? 'text-red-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="text-xs text-gray-500">Del: {info.dateDelivranceDoc}</div>
                                </div>

                                {/* CIN */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">CIN</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-0.5 inline-block">
                                    {info.cin}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono mt-0.5">{info.referenceCin}</div>
                                </div>

                                {/* Dates CIN */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité CIN</div>
                                  <div className="text-xs text-gray-900">{info.dateValiditeCin}</div>
                                  <div className="text-xs text-gray-500">Del: {info.dateDelivranceCin}</div>
                                </div>

                                {/* WhatsApp */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">WhatsApp</div>
                                  <div className="text-xs font-mono text-gray-900">{info.whatsapp}</div>
                                </div>

                                {/* Téléphone */}
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Téléphone</div>
                                  <div className="text-xs font-mono text-gray-900">{info.tel}</div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulaire vol - Section séparée */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Informations du vol</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* N° Vol */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">N° Vol</label>
                <input
                  type="text"
                  name="numeroVol"
                  value={formData.numeroVol}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="MD123"
                />
              </div>

              {/* Avion */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Avion</label>
                <input
                  type="text"
                  name="avion"
                  value={formData.avion}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="ATR 72"
                />
              </div>

              {/* Itinéraire */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Itinéraire</label>
                <input
                  type="text"
                  name="itineraire"
                  value={formData.itineraire}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="TNR - NOS"
                />
              </div>

              {/* Départ */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Départ</label>
                <select
                  name="departId"
                  value={formData.departId}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="">Sélectionner</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.ville} ({dest.paysVoyage?.pays || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Destination</label>
                <select
                  name="destinationId"
                  value={formData.destinationId}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="">Sélectionner</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.ville} ({dest.paysVoyage?.pays || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Classe */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Classe</label>
                <select
                  name="classe"
                  value={formData.classe}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="ECONOMIE">Économie</option>
                  <option value="BUSINESS">Business</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PREMIERE">Première</option>
                </select>
              </div>

              {/* Type passager */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Type passager</label>
                <select
                  name="typePassager"
                  value={formData.typePassager}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="ADULTE">Adulte</option>
                  <option value="ENFANT">Enfant</option>
                  <option value="BEBE">Bébé</option>
                </select>
              </div>

              {/* Date/Heure Départ */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date/Heure Départ</label>
                <input
                  type="datetime-local"
                  name="dateHeureDepart"
                  value={formData.dateHeureDepart}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              {/* Date/Heure Arrivée */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date/Heure Arrivée</label>
                <input
                  type="datetime-local"
                  name="dateHeureArrive"
                  value={formData.dateHeureArrive}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              {/* Durée vol */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Durée vol</label>
                <input
                  type="text"
                  name="dureeVol"
                  value={formData.dureeVol}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="1h30"
                />
              </div>

              {/* Durée escale */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Durée escale</label>
                <input
                  type="text"
                  name="dureeEscale"
                  value={formData.dureeEscale}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="0h00"
                />
              </div>

              {/* PU Ariary */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">PU Ariary</label>
                <input
                  type="number"
                  name="puAriary"
                  value={formData.puAriary}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="450000"
                  min="0"
                />
              </div>

              {/* N° Réservation */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">N° Réservation</label>
                <input
                  type="text"
                  name="numeroReservation"
                  value={formData.numeroReservation}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="ABC123XYZ"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedPassagerIds.length > 0 && (
              <span>{selectedPassagerIds.length} passager{selectedPassagerIds.length > 1 ? 's' : ''} sélectionné{selectedPassagerIds.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedPassagerIds.length === 0}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
                submitting || selectedPassagerIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {submitting ? 'Création...' : 'Créer la ligne'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLigneModal;