import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchClientBeneficiaireInfos } from '../../../../../app/portail_client/clientBeneficiaireInfosSlice';
import { createAttestationLigne } from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import { fetchAttestationParams } from '../../../../../app/front_office/parametre_attestation/attestationParamsSlice';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  destinations: any[];
  beneficiaires: any[];
  attestationEnteteId: string;
  onLigneCreated: () => void;
};

const calculerDuree = (depart: string, arrivee: string): string => {
  if (!depart || !arrivee) return '';
  const diff = new Date(arrivee).getTime() - new Date(depart).getTime();
  if (diff <= 0) return '';
  const totalMinutes = Math.floor(diff / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
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

  const { items: prixItems } = useSelector((state: RootState) => state.attestationParams);
  const prixActif = prixItems.find((p) => p.status === 'ACTIF') ?? null;

  useEffect(() => {
    if (prixItems.length === 0) dispatch(fetchAttestationParams());
  }, [dispatch]);

  const [selectedBeneficiaireIds, setSelectedBeneficiaireIds] = useState<string[]>([]);
  const [selectedPassagerIds, setSelectedPassagerIds] = useState<string[]>([]);
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
    puAriary: prixActif ? String(prixActif.prix) : '',
    numeroReservation: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prixActif) {
      setFormData((prev) => ({ ...prev, puAriary: String(prixActif.prix) }));
    }
  }, [prixActif?.id]);

  // ─── Calcul automatique durée vol ────────────────────────────────────────
  useEffect(() => {
    const duree = calculerDuree(formData.dateHeureDepart, formData.dateHeureArrive);
    if (duree) setFormData((prev) => ({ ...prev, dureeVol: duree }));
  }, [formData.dateHeureDepart, formData.dateHeureArrive]);

  // ─── Calcul automatique itinéraire ───────────────────────────────────────
  useEffect(() => {
    const depart = destinations.find((d) => d.id === formData.departId);
    const dest = destinations.find((d) => d.id === formData.destinationId);
    if (depart && dest) {
      setFormData((prev) => ({
        ...prev,
        itineraire: `${depart.ville} (${depart.paysVoyage?.pays || depart.code || '?'}) → ${dest.ville} (${dest.paysVoyage?.pays || dest.code || '?'})`,
      }));
    } else if (depart) {
      setFormData((prev) => ({ ...prev, itineraire: `${depart.ville} → ?` }));
    } else if (dest) {
      setFormData((prev) => ({ ...prev, itineraire: `? → ${dest.ville}` }));
    }
  }, [formData.departId, formData.destinationId, destinations]);

  useEffect(() => {
    selectedBeneficiaireIds.forEach((id) => {
      dispatch(fetchClientBeneficiaireInfos(id)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          setBeneficiairePassagers((prev) => ({ ...prev, [id]: action.payload || [] }));
        }
      });
    });
  }, [selectedBeneficiaireIds, dispatch]);

  const toggleBeneficiaire = (id: string) => {
    setSelectedBeneficiaireIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
    if (selectedBeneficiaireIds.includes(id)) {
      setSelectedPassagerIds((ids) =>
        ids.filter((pid) => !beneficiairePassagers[id]?.some((p) => p.id === pid))
      );
    }
  };

  const togglePassager = (passagerId: string) => {
    setSelectedPassagerIds((prev) =>
      prev.includes(passagerId) ? prev.filter((id) => id !== passagerId) : [...prev, passagerId]
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
      await dispatch(createAttestationLigne({
        attestationEnteteId,
        ...formData,
        dateHeureDepart: formData.dateHeureDepart ? new Date(formData.dateHeureDepart).toISOString() : '',
        dateHeureArrive: formData.dateHeureArrive ? new Date(formData.dateHeureArrive).toISOString() : '',
        puAriary: Number(formData.puAriary) || 0,
        passagerIds: selectedPassagerIds,
      })).unwrap();
      onLigneCreated();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la ligne');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[94vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gray-950 px-6 py-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-bold text-base tracking-wide">
              Nouvelle ligne d'attestation
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Renseignez les informations du vol et sélectionnez les passagers
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body scrollable ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50">

          {error && (
            <div className="flex items-start gap-3 p-4 bg-white border border-red-200 text-red-700 text-sm rounded-xl shadow-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Section 1 : Bénéficiaires ── */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-950 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
              <h3 className="text-sm font-semibold text-gray-800">Clients bénéficiaires</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
              {beneficiaires.map((b) => {
                const ben = b.clientBeneficiaire;
                const isSelected = selectedBeneficiaireIds.includes(ben.id);
                return (
                  <label
                    key={ben.id}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-gray-200 hover:border-blue-300 text-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBeneficiaire(ben.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {ben.code && <span className="text-gray-400 mr-1">{ben.code} ·</span>}
                        {ben.libelle || 'Sans nom'}
                      </div>
                      <div className="text-xs mt-0.5 text-gray-400">{ben.statut || '—'}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── Section 2 : Passagers ── */}
          {selectedBeneficiaireIds.length > 0 && (
            <section className="bg-white rounded-xl border border-blue-400 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-blue-100 bg-blue-50 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                <h3 className="text-sm font-semibold text-blue-800">Sélection des passagers</h3>
                {selectedPassagerIds.length > 0 && (
                  <span className="ml-auto text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    {selectedPassagerIds.length} sélectionné{selectedPassagerIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3">
                {selectedBeneficiaireIds.map((benId) => {
                  const ben = beneficiaires.find((b) => b.clientBeneficiaire.id === benId)?.clientBeneficiaire;
                  const passagers = beneficiairePassagers[benId] || [];
                  const isLoading = !beneficiairePassagers[benId];

                  return (
                    <div key={benId} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700">{ben?.libelle || '—'}</h4>
                      </div>
                      <div className="p-3">
                        {isLoading ? (
                          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                            Chargement...
                          </div>
                        ) : passagers.length === 0 ? (
                          <p className="text-sm text-gray-400 italic py-2">Aucun passager enregistré</p>
                        ) : (
                          <div className="space-y-2">
                            {passagers.map((info: any) => {
                              const isChecked = selectedPassagerIds.includes(info.id);
                              const docExpired = new Date(info.dateValiditeDoc) < new Date();
                              return (
                                <label
                                  key={info.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                                      : 'bg-white border-gray-200 hover:border-blue-300 text-gray-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePassager(info.id)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600"
                                  />
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2.5">

                                    {/* Nom */}
                                    <div className="col-span-2">
                                      <div className="text-xs uppercase tracking-wide mb-0.5 text-gray-400">Passager</div>
                                      <div className="text-sm font-semibold">{info.prenom} {info.nom}</div>
                                    </div>

                                    {[
                                      { label: 'Type', value: info.clientType },
                                      { label: 'Nationalité', value: info.nationalite },
                                      {
                                        label: 'Document',
                                        value: (
                                          <div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${isChecked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{info.typeDoc}</span>
                                            <div className="text-xs font-mono mt-0.5 text-gray-500">{info.referenceDoc}</div>
                                          </div>
                                        )
                                      },
                                      {
                                        label: 'Validité doc',
                                        value: (
                                          <span className={`text-xs font-medium ${docExpired ? 'text-red-500' : ''}`}>
                                            {new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                          </span>
                                        )
                                      },
                                      { label: 'CIN', value: <span className="text-xs font-mono text-gray-600">{info.cin} — {info.referenceCin}</span> },
                                      { label: 'WhatsApp', value: <span className="text-xs font-mono">{info.whatsapp}</span> },
                                    ].map(({ label, value }) => (
                                      <div key={label}>
                                        <div className="text-xs uppercase tracking-wide mb-0.5 text-gray-400">{label}</div>
                                        <div className="text-sm">{value}</div>
                                      </div>
                                    ))}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Section 3 : Informations vol ── */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-950 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
              <h3 className="text-sm font-semibold text-gray-800">Informations du vol</h3>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {[
                { label: 'N° Vol', name: 'numeroVol', placeholder: 'MD123' },
                { label: 'Avion', name: 'avion', placeholder: 'ATR 72' },
                { label: 'N° Réservation', name: 'numeroReservation', placeholder: 'ABC123XYZ' },
                { label: 'Durée escale', name: 'dureeEscale', placeholder: '0h00' },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>
              ))}

              {/* Départ */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Départ</label>
                <select name="departId" value={formData.departId} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Sélectionner</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.ville} ({d.paysVoyage?.pays || '—'})</option>)}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Destination</label>
                <select name="destinationId" value={formData.destinationId} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Sélectionner</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.ville} ({d.paysVoyage?.pays || '—'})</option>)}
                </select>
              </div>

              {/* Itinéraire — calculé automatiquement, lecture seule */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Itinéraire
                  <span className="ml-2 text-gray-400 normal-case tracking-normal font-normal">(calculé auto)</span>
                </label>
                <input
                  type="text"
                  name="itineraire"
                  value={formData.itineraire}
                  readOnly
                  placeholder="Sélectionnez un départ et une destination"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Classe */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Classe</label>
                <select name="classe" value={formData.classe} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="ECONOMIE">Économie</option>
                  <option value="BUSINESS">Business</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PREMIERE">Première</option>
                </select>
              </div>

              {/* Type passager */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Type passager</label>
                <select name="typePassager" value={formData.typePassager} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="ADULTE">Adulte</option>
                  <option value="ENFANT">Enfant</option>
                  <option value="BEBE">Bébé</option>
                </select>
              </div>

              {/* Date départ */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure départ</label>
                <input type="datetime-local" name="dateHeureDepart" value={formData.dateHeureDepart} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>

              {/* Date arrivée */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure arrivée</label>
                <input type="datetime-local" name="dateHeureArrive" value={formData.dateHeureArrive} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>

              {/* Durée vol — calculée auto, lecture seule */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Durée vol
                  {formData.dateHeureDepart && formData.dateHeureArrive && (
                    <span className="ml-2 text-gray-400 normal-case tracking-normal font-normal">(calculée auto)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="dureeVol"
                  value={formData.dureeVol}
                  readOnly
                  placeholder="Calculé automatiquement"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* PU Ariary */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  PU Ariary
                  {prixActif && (
                    <span className="ml-2 text-gray-400 normal-case tracking-normal font-normal">
                      (prix actif : {prixActif.prix.toLocaleString('fr-FR')} Ar)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="puAriary"
                    value={formData.puAriary}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="450000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                    Ar
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="text-sm text-gray-500">
            {selectedPassagerIds.length > 0 ? (
              <span className="font-medium text-gray-800">
                {selectedPassagerIds.length} passager{selectedPassagerIds.length > 1 ? 's' : ''} sélectionné{selectedPassagerIds.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-400 italic">Aucun passager sélectionné</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedPassagerIds.length === 0}
              className="px-5 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Création...
                </>
              ) : 'Créer la ligne'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLigneModal;