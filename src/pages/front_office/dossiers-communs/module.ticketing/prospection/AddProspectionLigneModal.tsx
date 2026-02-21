import { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';

interface AddProspectionLigneModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: any[];
  servicesDisponibles: any[];
  onSave: (payload: any) => Promise<void>;
}

function calculerDureeVol(dateDepart: string, dateArrive: string): string {
  if (!dateDepart || !dateArrive) return '';
  const depart = new Date(dateDepart);
  const arrive = new Date(dateArrive);
  const diffMs = arrive.getTime() - depart.getTime();
  if (diffMs <= 0) return '';
  const totalMinutes = Math.floor(diffMs / 60000);
  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${heures}h${String(minutes).padStart(2, '0')}`;
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
  useEffect(() => {
    const duree = calculerDureeVol(form.dateHeureDepart, form.dateHeureArrive);
    if (duree) setForm((prev) => ({ ...prev, dureeVol: duree }));
  }, [form.dateHeureDepart, form.dateHeureArrive]);

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
        dureeVol: form.dureeVol || null,
        dureeEscale: form.dureeEscale || null,
        avion: form.avion || null,
        services: serviceValues.map((s) => ({ ...s, valeur: s.valeur.trim() || 'false' })),
      });
      onClose();
    } catch (err: any) {
      alert('Erreur : ' + (err?.message || 'voir console'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const readonlyCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed";
  const numberCls = inputCls + " text-right font-medium";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure départ <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={form.dateHeureDepart} onChange={(e) => set('dateHeureDepart', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date / Heure arrivée</label>
                <input type="datetime-local" value={form.dateHeureArrive} onChange={(e) => set('dateHeureArrive', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Durée vol <span className="ml-1 text-gray-400 normal-case font-normal">(calculée auto)</span>
                </label>
                <input type="text" value={form.dureeVol} readOnly placeholder="Calculé automatiquement" className={readonlyCls} />
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
                <label className="block text-xs font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">Mt Billet Cie</label>
                <input type="number" step="0.01" value={form.montantBilletCompagnieDevise} onChange={(e) => set('montantBilletCompagnieDevise', Number(e.target.value))} className={numberCls + " text-emerald-700"} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">Mt Service Cie</label>
                <input type="number" step="0.01" value={form.montantServiceCompagnieDevise} onChange={(e) => set('montantServiceCompagnieDevise', Number(e.target.value))} className={numberCls + " text-emerald-700"} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">Mt Pénalité Cie</label>
                <input type="number" step="0.01" value={form.montantPenaliteCompagnieDevise} onChange={(e) => set('montantPenaliteCompagnieDevise', Number(e.target.value))} className={numberCls + " text-emerald-700"} placeholder="0.00" />
              </div>

              {/* Montants Client */}
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">Mt Billet Client</label>
                <input type="number" step="0.01" value={form.montantBilletClientDevise} onChange={(e) => set('montantBilletClientDevise', Number(e.target.value))} className={numberCls + " text-blue-700"} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">Mt Service Client</label>
                <input type="number" step="0.01" value={form.montantServiceClientDevise} onChange={(e) => set('montantServiceClientDevise', Number(e.target.value))} className={numberCls + " text-blue-700"} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">Mt Pénalité Client</label>
                <input type="number" step="0.01" value={form.montantPenaliteClientDevise} onChange={(e) => set('montantPenaliteClientDevise', Number(e.target.value))} className={numberCls + " text-blue-700"} placeholder="0.00" />
              </div>
            </div>
          </section>

          {/* Section 3 — Services */}
          {servicesDisponibles.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
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
                            checked={current.valeur === 'true'}
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
                          value={current.valeur}
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