import { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';

interface AddProspectionLigneModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: any[];
  servicesDisponibles: any[];
  onSave: (payload: any) => Promise<void>;
}

export default function AddProspectionLigneModal({
  isOpen,
  onClose,
  destinations,
  servicesDisponibles,
  onSave,
}: AddProspectionLigneModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [serviceValues, setServiceValues] = useState<{ serviceSpecifiqueId: string; valeur: string }[]>([]);

  const [showJson, setShowJson] = useState(false);

  const [form, setForm] = useState({
    nombre: 1,
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
    dureeEscale: '',
    puBilletCompagnieDevise: 0,
    puServiceCompagnieDevise: 0,
    puPenaliteCompagnieDevise: 0,
    devise: 'EUR',
    tauxEchange: 4900,
    montantBilletCompagnieDevise: 0,
    montantServiceCompagnieDevise: 0,
    montantPenaliteCompagnieDevise: 0,
    montantBilletClientDevise: 0,
    montantServiceClientDevise: 0,
    montantPenaliteClientDevise: 0,
    modePaiement: 'COMPTANT' as 'COMPTANT' | 'CREDIT' | 'CHEQUE' | 'VIREMENT', 
  });

  // Init services
  useEffect(() => {
    setServiceValues(servicesDisponibles.map((s) => ({ serviceSpecifiqueId: s.id, valeur: '' })));
  }, [servicesDisponibles]);

  // Reset form à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setForm({
        nombre: 1,
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
        dureeEscale: '',
        puBilletCompagnieDevise: 0,
        puServiceCompagnieDevise: 0,
        puPenaliteCompagnieDevise: 0,
        devise: 'EUR',
        tauxEchange: 4900,
        montantBilletCompagnieDevise: 0,
        montantServiceCompagnieDevise: 0,
        montantPenaliteCompagnieDevise: 0,
        montantBilletClientDevise: 0,
        montantServiceClientDevise: 0,
        montantPenaliteClientDevise: 0,
        modePaiement: 'COMPTANT',
      });
      setServiceValues(servicesDisponibles.map((s) => ({ serviceSpecifiqueId: s.id, valeur: '' })));
      setIsSaving(false);
    }
  }, [isOpen]);

  // Calcul itinéraire auto
  useEffect(() => {
    const depart = destinations.find((d) => d.id === form.departId);
    const dest = destinations.find((d) => d.id === form.destinationId);
    let itineraire = '';
    if (depart && dest) itineraire = `${depart.ville || depart.code} → ${dest.ville || dest.code}`;
    else if (depart) itineraire = `${depart.ville} → ?`;
    else if (dest) itineraire = `? → ${dest.ville}`;
    setForm((prev) => ({ ...prev, itineraire }));
  }, [form.departId, form.destinationId, destinations]);

  // Calcul durée vol auto
  // useEffect(() => {
  //   const duree = calculerDureeVol(form.dateHeureDepart, form.dateHeureArrive);
  //   if (duree) setForm((prev) => ({ ...prev, dureeVol: duree }));
  // }, [form.dateHeureDepart, form.dateHeureArrive]);

  // Après les useEffect existants, ajouter :

  // Calculs Ariary & commissions (dérivés, pas dans le form)
  // Après les useEffect, remplacer les calculs dérivés par :
  const taux         = form.tauxEchange || 0;
  const nombre       = form.nombre || 1;
  const commissionPct = Number(/* passez la prop commissionAppliquer si disponible */ 0);
  const facteur      = 1 + commissionPct / 100;

  // PU Cie Devise (saisis)
  const puBilletCieDevise   = form.puBilletCompagnieDevise;
  const puServiceCieDevise  = form.puServiceCompagnieDevise;

  // Mt Cie Devise = PU * nombre
  const mtBilletCieDevise   = puBilletCieDevise  * nombre;
  const mtServiceCieDevise  = puServiceCieDevise * nombre;

  // PU Cie Ariary = PU Devise * taux
  const puBilletAriary   = puBilletCieDevise  * taux;
  const puServiceAriary  = puServiceCieDevise * taux;
  const puPenaliteAriary = form.puPenaliteCompagnieDevise * taux;

  // Mt Cie Ariary = PU Ariary * nombre
  const mtBilletCieAriary   = puBilletAriary  * nombre;
  const mtServiceCieAriary  = puServiceAriary * nombre;
  const mtPenaliteCieAriary = puPenaliteAriary * nombre;

  // Mt Client Devise = Mt Cie Devise * facteur
  const mtBilletClientDevise   = mtBilletCieDevise  * facteur;
  const mtServiceClientDevise  = mtServiceCieDevise * facteur;
  const mtPenaliteClientDevise = form.montantPenaliteCompagnieDevise * facteur;

  // Mt Client Ariary = Mt Client Devise * taux
  const mtBilletClientAriary   = mtBilletClientDevise   * taux;
  const mtServiceClientAriary  = mtServiceClientDevise  * taux;
  const mtPenaliteClientAriary = mtPenaliteClientDevise * taux;

  // Commission
  const commissionEnDevise = (mtBilletClientDevise   - mtBilletCieDevise)
                          + (mtServiceClientDevise  - mtServiceCieDevise)
                          + (mtPenaliteClientDevise - form.montantPenaliteCompagnieDevise);
  const commissionEnAriary = commissionEnDevise * taux;

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.departId || !form.destinationId) {
      alert('Veuillez sélectionner un aéroport de départ et une destination');
      return;
    }
    if (!form.numeroVol.trim() || !form.dateHeureDepart) {
      alert('Veuillez remplir : numéro vol et date de départ');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        dateHeureDepart: new Date(form.dateHeureDepart).toISOString(),
        dateHeureArrive: form.dateHeureArrive ? new Date(form.dateHeureArrive).toISOString() : null,
        dureeVol:    form.dureeVol || null,
        dureeEscale: form.dureeEscale || null,
        avion:       form.avion || null,
        services:    serviceValues,   // ← on passe directement, buildPayload s'occupe du mapping
      });
      onClose();
    } catch (err: any) {
      alert('Erreur : ' + (err?.message || 'voir console'));
    } finally {
      setIsSaving(false);
    }
  };


  // Juste avant le return, après les calculs dérivés
  const previewPayload = {
    prospectionEnteteId: '(sera ajouté automatiquement)',
    departId:      form.departId      || '—',
    destinationId: form.destinationId || '—',
    numeroVol:     form.numeroVol     || '—',
    avion:         form.avion         || null,
    itineraire:    form.itineraire    || null,
    classe:        form.classe,
    typePassager:  form.typePassager,
    dateHeureDepart: form.dateHeureDepart ? new Date(form.dateHeureDepart).toISOString() : '—',
    dateHeureArrive: form.dateHeureArrive ? new Date(form.dateHeureArrive).toISOString() : null,
    dureeVol:    form.dureeVol    || null,
    dureeEscale: form.dureeEscale || null,
    devise:      form.devise,
    tauxEchange: taux,
    nombre:      form.nombre,

    puBilletCompagnieDevise:   form.puBilletCompagnieDevise,
    puServiceCompagnieDevise:  form.puServiceCompagnieDevise,
    puPenaliteCompagnieDevise: form.puPenaliteCompagnieDevise,

    montantBilletCompagnieDevise:   form.montantBilletCompagnieDevise,
    montantServiceCompagnieDevise:  form.montantServiceCompagnieDevise,
    montantPenaliteCompagnieDevise: form.montantPenaliteCompagnieDevise,

    montantBilletClientDevise:   form.montantBilletClientDevise,
    montantServiceClientDevise:  form.montantServiceClientDevise,
    montantPenaliteClientDevise: form.montantPenaliteClientDevise,

    puBilletCompagnieAriary:   puBilletAriary,
    puServiceCompagnieAriary:  puServiceAriary,
    puPenaliteCompagnieAriary: puPenaliteAriary,

    montantBilletCompagnieAriary:   mtBilletCieAriary,
    montantServiceCompagnieAriary:  mtServiceCieAriary,
    montantPenaliteCompagnieAriary: mtPenaliteCieAriary,

    montantBilletClientAriary:   mtBilletClientAriary,
    montantServiceClientAriary:  mtServiceClientAriary,
    montantPenaliteClientAriary: mtPenaliteClientAriary,

    commissionEnDevise,
    commissionEnAriary,

    modePaiement: form.modePaiement,

    services: serviceValues.map((s) => ({
      serviceSpecifiqueId: s.serviceSpecifiqueId,
      valeur: s.valeur.trim() || 'false',
    })),
  };

  if (!isOpen) return null;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const readonlyCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed";
  const numberCls = inputCls + " text-right font-medium";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[94vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-blue-600 px-6 py-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-bold text-base tracking-wide">Nouvelle ligne de prospection</h2>
            <p className="text-blue-100 text-xs mt-0.5">Renseignez les informations du vol</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
            <FiX size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50">

          {/* Section 1 — Infos vol */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
              <h3 className="text-sm font-semibold text-gray-800">Informations du vol</h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Nb passagers</label>
                <input type="number" min="1" value={form.nombre} onChange={(e) => set('nombre', Number(e.target.value))} className={numberCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">N° Vol <span className="text-red-500">*</span></label>
                <input type="text" value={form.numeroVol} onChange={(e) => set('numeroVol', e.target.value)} placeholder="MD-003" className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Avion</label>
                <input type="text" value={form.avion} onChange={(e) => set('avion', e.target.value)} placeholder="Boeing 737" className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Classe</label>
                <select value={form.classe} onChange={(e) => set('classe', e.target.value)} className={inputCls}>
                  <option value="ECONOMIE">Économie</option>
                  <option value="BUSINESS">Business</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PREMIERE">Première</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Type passager</label>
                <select value={form.typePassager} onChange={(e) => set('typePassager', e.target.value)} className={inputCls}>
                  <option value="ADULTE">Adulte</option>
                  <option value="ENFANT">Enfant</option>
                  <option value="BEBE">Bébé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Mode de paiement
                </label>
                <select
                  value={form.modePaiement}
                  onChange={(e) => set('modePaiement', e.target.value)}
                  className={inputCls}
                >
                  <option value="COMPTANT">Comptant</option>
                  <option value="CREDIT">Crédit</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Départ <span className="text-red-500">*</span></label>
                <select value={form.departId} onChange={(e) => set('departId', e.target.value)} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.code} – {d.ville}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Destination <span className="text-red-500">*</span></label>
                <select value={form.destinationId} onChange={(e) => set('destinationId', e.target.value)} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.code} – {d.ville}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Itinéraire <span className="ml-1 text-gray-400 normal-case font-normal">(calculé auto)</span>
                </label>
                <input type="text" value={form.itineraire} readOnly placeholder="Sélectionnez départ et destination" className={readonlyCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure départ de {destinations.find((d) => d.id === form.departId)?.ville} <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={form.dateHeureDepart} onChange={(e) => set('dateHeureDepart', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure arrivée à {destinations.find((d) => d.id === form.destinationId)?.ville} <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={form.dateHeureArrive} onChange={(e) => set('dateHeureArrive', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Durée vol <span className="ml-1 text-gray-400 normal-case font-normal"></span>
                </label>
                <input type="text" value={form.dureeVol} onChange={(e) => set('dureeVol', e.target.value)} placeholder="2h00" className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Durée escale</label>
                <input type="text" value={form.dureeEscale} onChange={(e) => set('dureeEscale', e.target.value)} placeholder="2h00" className={inputCls} />
              </div>
            </div>
          </section>

          {/* Section 2 — Tarifs */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
              <h3 className="text-sm font-semibold text-gray-800">Tarifs & Montants</h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Devise</label>
                <select value={form.devise} onChange={(e) => set('devise', e.target.value)} className={inputCls}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="MGA">MGA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Taux de change</label>
                <input type="number" value={form.tauxEchange} onChange={(e) => set('tauxEchange', Number(e.target.value))} className={numberCls} />
              </div>

              {/* PU Compagnie */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">PU Billet Cie</label>
                <input type="number" step="0.01" value={form.puBilletCompagnieDevise} onChange={(e) => set('puBilletCompagnieDevise', Number(e.target.value))} className={numberCls} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">PU Service Cie</label>
                <input type="number" step="0.01" value={form.puServiceCompagnieDevise} onChange={(e) => set('puServiceCompagnieDevise', Number(e.target.value))} className={numberCls} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  PU Pénalité Cie
                  <span className="ml-1 text-gray-400 normal-case font-normal">(auto)</span>
                </label>
                <input type="number" step="0.01" value={form.puPenaliteCompagnieDevise} readOnly className={readonlyCls + " text-right"} placeholder="—" />
              </div>

              {/* Montants Compagnie */}
              <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">
                  Mt Billet Cie
                  <span className="ml-1 text-gray-400 normal-case font-normal">(PU × {form.nombre} pax)</span>
                </label>
                <input
                  readOnly
                  value={mtBilletCieDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  className={readonlyCls + " text-right text-emerald-700 font-semibold"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">
                  Mt Service Cie
                  <span className="ml-1 text-gray-400 normal-case font-normal">(PU × {form.nombre} pax)</span>
                </label>
                <input
                  readOnly
                  value={mtServiceCieDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  className={readonlyCls + " text-right text-emerald-700 font-semibold"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Mt Pénalité Cie
                  <span className="ml-1 text-gray-400 normal-case font-normal">(auto)</span>
                </label>
                <input type="number" step="0.01" value={form.montantPenaliteCompagnieDevise} readOnly className={readonlyCls + " text-right"} placeholder="—" />
              </div>

              {/* Montants Client */}
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">
                  Mt Billet Client
                  <span className="ml-1 text-gray-400 normal-case font-normal">(Cie × {facteur.toFixed(4)})</span>
                </label>
                <input
                  readOnly
                  value={mtBilletClientDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  className={readonlyCls + " text-right text-blue-700 font-semibold"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">
                  Mt Service Client
                  <span className="ml-1 text-gray-400 normal-case font-normal">(Cie × {facteur.toFixed(4)})</span>
                </label>
                <input
                  readOnly
                  value={mtServiceClientDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  className={readonlyCls + " text-right text-blue-700 font-semibold"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Mt Pénalité Client
                  <span className="ml-1 text-gray-400 normal-case font-normal">(auto)</span>
                </label>
                <input type="number" step="0.01" value={form.montantPenaliteClientDevise} readOnly className={readonlyCls + " text-right"} placeholder="—" />
              </div>
            </div>
          </section>

          {/* Section 3 — Récapitulatif Ariary & Commissions */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
              <h3 className="text-sm font-semibold text-gray-800">
                Récapitulatif en Ariary
                <span className="ml-2 text-xs font-normal text-gray-500">(calculé automatiquement · taux: {taux.toLocaleString('fr-FR')} Ar)</span>
              </h3>
            </div>

            <div className="p-5 space-y-5">

              {/* PU Ariary */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Prix unitaires en Ariary</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">PU Billet Cie</p>
                    <p className="text-sm font-semibold text-gray-900 text-right">
                      {puBilletAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-500">Ar</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">PU Service Cie</p>
                    <p className="text-sm font-semibold text-gray-900 text-right">
                      {puServiceAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-500">Ar</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">PU Pénalité Cie</p>
                    <p className="text-sm font-semibold text-gray-900 text-right">
                      {puPenaliteAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-500">Ar</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Montants Compagnie Ariary */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Montants Compagnie en Ariary</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 mb-1">Mt Billet Cie</p>
                    <p className="text-sm font-semibold text-emerald-800 text-right">
                      {mtBilletCieAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 mb-1">Mt Service Cie</p>
                    <p className="text-sm font-semibold text-emerald-800 text-right">
                      {mtServiceCieAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 mb-1">Mt Pénalité Cie</p>
                    <p className="text-sm font-semibold text-emerald-800 text-right">
                      {mtPenaliteCieAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Montants Client Ariary */}
              <div>
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Montants Client en Ariary</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">Mt Billet Client</p>
                    <p className="text-sm font-semibold text-blue-800 text-right">
                      {mtBilletClientAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">Mt Service Client</p>
                    <p className="text-sm font-semibold text-blue-800 text-right">
                      {mtServiceClientAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">Mt Pénalité Client</p>
                    <p className="text-sm font-semibold text-blue-800 text-right">
                      {mtPenaliteClientAriary.toLocaleString('fr-FR')} <span className="text-xs font-normal">Ar</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Commissions */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">Commissions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 border-2 ${commissionEnDevise >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <p className="text-xs font-medium text-gray-600 uppercase mb-1">Commission en Devise</p>
                    <p className={`text-xl font-bold text-right ${commissionEnDevise >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {commissionEnDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      <span className="text-sm font-normal ml-1">{form.devise}</span>
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 border-2 ${commissionEnAriary >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <p className="text-xs font-medium text-gray-600 uppercase mb-1">Commission en Ariary</p>
                    <p className={`text-xl font-bold text-right ${commissionEnAriary >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {commissionEnAriary.toLocaleString('fr-FR')}
                      <span className="text-sm font-normal ml-1">Ar</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 — Services  */}
          {servicesDisponibles.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">4</span>
                <h3 className="text-sm font-semibold text-gray-800">Services spécifiques</h3>
              </div>
              <div className="p-5 flex flex-wrap gap-4">
                {servicesDisponibles.map((svc, idx) => {
                  const current = serviceValues[idx];
                  if (!current) return null;
                  const isBoolean =
                    svc.type === 'SPECIFIQUE' ||
                    (svc.type === 'SERVICE' &&
                      !svc.libelle.toLowerCase().includes('bagage') &&
                      !svc.libelle.toLowerCase().includes('supplément'));
                  return (
                    <div key={svc.id} className="flex flex-col gap-1.5 p-4 bg-white rounded-xl border border-slate-200 shadow-sm min-w-[160px]">
                      <label className="text-xs font-semibold text-slate-700">{svc.libelle}</label>
                      {isBoolean ? (
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current?.valeur === 'true'}
                          onChange={(e) => {
                            const newVals = [...serviceValues];
                            newVals[idx] = { ...newVals[idx], valeur: e.target.checked ? 'true' : 'false' };
                            setServiceValues(newVals);
                          }}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Activé</span>
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={current?.valeur ?? ''}
                        onChange={(e) => {
                          const newVals = [...serviceValues];
                          newVals[idx] = { ...newVals[idx], valeur: e.target.value };
                          setServiceValues(newVals);
                        }}
                        placeholder={svc.libelle.includes('Bagage') ? 'ex: 23Kg' : 'valeur'}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section JSON Preview */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowJson((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {'{'}
                </span>
                <h3 className="text-sm font-semibold text-gray-800">
                  Prévisualisation du payload JSON
                </h3>
                <span className="text-xs text-gray-500 font-normal">
                  — données qui seront envoyées au serveur
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                {showJson ? '▲ Masquer' : '▼ Afficher'}
              </span>
            </button>

            {showJson && (
              <div className="p-5">
                <div className="relative">
                  {/* Bouton copier */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
                    }}
                    className="absolute top-3 right-3 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier
                  </button>

                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {JSON.stringify(previewPayload, null, 2)}
                  </pre>
                </div>

                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <span>⚠️</span>
                  Ce JSON est une prévisualisation en temps réel. Il se met à jour automatiquement à chaque modification du formulaire.
                </p>
              </div>
            )}
          </section>
        </div>

        

        {/* ── Footer ── */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Enregistrement...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Enregistrer la ligne
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}