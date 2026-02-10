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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle ligne d'attestation</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-3xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Sélection multiple bénéficiaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Clients bénéficiaires (sélection multiple)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {beneficiaires.map((b) => {
                const ben = b.clientBeneficiaire;
                const isSelected = selectedBeneficiaireIds.includes(ben.id);
                return (
                  <label
                    key={ben.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBeneficiaire(ben.id)}
                      className="mr-3 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium">
                        {ben.code ? `${ben.code} — ` : ''}{ben.libelle || 'Sans nom'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Statut : {ben.statut || '?'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Blocs par bénéficiaire sélectionné */}
          {selectedBeneficiaireIds.length > 0 && (
            <div className="space-y-6">
              {selectedBeneficiaireIds.map((benId) => {
                const ben = beneficiaires.find((b) => b.clientBeneficiaire.id === benId)?.clientBeneficiaire;
                const passagers = beneficiairePassagers[benId] || [];
                const isLoading = !beneficiairePassagers[benId];

                return (
                  <div key={benId} className="mb-8 p-5 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h3 className="font-semibold text-indigo-800 mb-4">
                      Bénéficiaire sélectionné : {ben?.libelle || '—'}
                    </h3>

                    {isLoading ? (
                      <p className="text-gray-500 italic">Chargement des informations passagers...</p>
                    ) : passagers.length === 0 ? (
                      <p className="text-amber-700">Aucun passager enregistré pour ce bénéficiaire</p>
                    ) : (
                      <div className="space-y-2.5">
                        {passagers.map((info: any) => (
                          <label key={info.id} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPassagerIds.includes(info.id)}
                              onChange={() => togglePassager(info.id)}
                              className="mr-3 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-gray-800">
                              {info.prenom} {info.nom} • {info.clientType || '?'} • ID: {info.id}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulaire vol */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Vol</label>
              <input
                type="text"
                name="numeroVol"
                value={formData.numeroVol}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="MD123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avion</label>
              <input
                type="text"
                name="avion"
                value={formData.avion}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="ATR 72 / Boeing 737"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Itinéraire</label>
              <input
                type="text"
                name="itineraire"
                value={formData.itineraire}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="TNR - NOS / ANTANANARIVO - NOSY BE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
              <select
                name="departId"
                value={formData.departId}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">— Choisir —</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.ville} ({dest.paysVoyage?.pays || '—'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select
                name="destinationId"
                value={formData.destinationId}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">— Choisir —</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.ville} ({dest.paysVoyage?.pays || '—'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select
                name="classe"
                value={formData.classe}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ECONOMIE">Économie</option>
                <option value="BUSINESS">Business</option>
                <option value="PREMIUM">Premium</option>
                <option value="PREMIERE">Première</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type passager</label>
              <select
                name="typePassager"
                value={formData.typePassager}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ADULTE">Adulte</option>
                <option value="ENFANT">Enfant</option>
                <option value="BEBE">Bébé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure Départ</label>
              <input
                type="datetime-local"
                name="dateHeureDepart"
                value={formData.dateHeureDepart}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure Arrivée</label>
              <input
                type="datetime-local"
                name="dateHeureArrive"
                value={formData.dateHeureArrive}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée vol</label>
              <input
                type="text"
                name="dureeVol"
                value={formData.dureeVol}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1h30 / 2h45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée escale</label>
              <input
                type="text"
                name="dureeEscale"
                value={formData.dureeEscale}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0h00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PU Ariary</label>
              <input
                type="number"
                name="puAriary"
                value={formData.puAriary}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="450000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Réservation</label>
              <input
                type="text"
                name="numeroReservation"
                value={formData.numeroReservation}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="ABC123XYZ"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedPassagerIds.length === 0}
              className={`px-6 py-2.5 rounded-lg text-white font-medium ${
                submitting || selectedPassagerIds.length === 0
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {submitting ? 'Création en cours...' : 'Créer la ligne'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLigneModal;