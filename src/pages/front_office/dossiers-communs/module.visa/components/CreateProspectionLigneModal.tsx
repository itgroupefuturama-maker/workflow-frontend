import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import type { VisaParam } from '../../../../../app/front_office/parametre_visa/visaParamSlice';
import axios from '../../../../../service/Axios';
import { fetchProspectionEntetes } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';

interface Props {
  enteteId: string;
  prestationId: string;
  onClose: () => void;
}

const DEVISES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'MGA'];

const CreateProspectionLigneModal = ({ enteteId, prestationId, onClose }: Props) => {
  const dispatch   = useDispatch<AppDispatch>();
  const visaParams = useSelector((s: RootState) => s.visaParam.data);

  const [visaParamsId,  setVisaParamsId]  = useState('');
  const [selectedParam, setSelectedParam] = useState<VisaParam | null>(null);
  const [nombre,        setNombre]        = useState('');
  const [dateDepart,    setDateDepart]    = useState('');
  const [dateRetour,    setDateRetour]    = useState('');
  const [devise,        setDevise]        = useState('EUR');
  const [tauxEchange,   setTauxEchange]   = useState('');

  // ── Seuls états "input" restants ──────────────────────────────────────────
  const [puConsulatDevise, setPuConsulatDevise] = useState(''); // saisi
  const [puClientAriary,   setPuClientAriary]   = useState(''); // fixe depuis param

  // ── Tout le reste est dérivé (calculé au render, pas de state) ─────────────
  const taux = Number(tauxEchange) || 0;
  const nb   = Number(nombre)      || 0;
  const puCD = Number(puConsulatDevise) || 0;
  const puKA = Number(puClientAriary)   || 0;

  const puConsulatAriary           = puCD * taux;
  const puClientDevise             = taux ? puKA / taux : 0;

  const montantTotalConsulatDevise = puCD * nb;
  const montantTotalConsulatAriary = puConsulatAriary * nb;
  const montantTotalClientAriary   = puKA * nb;
  const montantTotalClientDevise   = puClientDevise * nb;
  const commissionAriary           = montantTotalClientAriary - montantTotalConsulatAriary;

  // ── Quand on sélectionne un param : pré-remplir PU Achat & PV Ariary ──────
  const handleSelectParam = (id: string) => {
    setVisaParamsId(id);
    const param = visaParams.find(v => v.id === id) ?? null;
    setSelectedParam(param);
    if (param) {
      setPuConsulatDevise(String(param.puAchatDevise));
      setPuClientAriary(String(param.pVenteAriary));
    }
  };

  // ── Helpers affichage ─────────────────────────────────────────────────────
  const fmt = (n: number) => n ? n.toLocaleString('fr-FR') : '—';

  const AutoField = ({ label, value, accent = false, warning = false }: {
    label: string; value: number; accent?: boolean; warning?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className={`rounded-xl px-3 py-2.5 text-sm font-mono border flex items-center justify-between gap-2 ${
        warning ? 'bg-red-50 border-red-200 text-red-600 font-semibold'
        : accent ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
        : 'bg-gray-50 border-gray-100 text-gray-500'
      }`}>
        <span>{fmt(value)}</span>
        <span className="text-[10px] text-gray-300 shrink-0">auto</span>
      </div>
    </div>
  );

  const FixedField = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="rounded-xl px-3 py-2.5 text-sm font-mono border bg-green-50 border-green-200 text-green-700 font-semibold flex items-center justify-between gap-2">
        <span>{fmt(value)}</span>
        <span className="text-[10px] text-gray-300 shrink-0">fixe</span>
      </div>
    </div>
  );

  const EditField = ({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition w-full"
      />
    </div>
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!visaParamsId)                                           return 'Veuillez sélectionner un paramètre visa.';
    if (!nombre || isNaN(Number(nombre)) || Number(nombre) < 1) return 'Le nombre doit être un entier valide.';
    if (!dateDepart)                                             return 'La date de départ est requise.';
    if (!dateRetour)                                             return 'La date de retour est requise.';
    if (new Date(dateRetour) <= new Date(dateDepart))            return 'La date de retour doit être après le départ.';
    if (!tauxEchange || isNaN(Number(tauxEchange)))              return 'Le taux de change est requis.';
    if (!puConsulatDevise)                                       return 'PU Consulat devise requis.';
    if (!puClientAriary)                                         return 'PU Client ariary requis.';
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa/prospection-ligne', {
        visaProspectionEnteteId:    enteteId,
        visaParamsId,
        nombre:                     nb,
        dateDepart:                 new Date(dateDepart).toISOString(),
        dateRetour:                 new Date(dateRetour).toISOString(),
        devise,
        tauxEchange:                taux,
        puConsulatDevise:           puCD,
        puConsulatAriary:           puConsulatAriary,
        puClientDevise:             puClientDevise,
        puClientAriary:             puKA,
        montantTotalConsulatDevise: montantTotalConsulatDevise,
        montantTotalConsulatAriary: montantTotalConsulatAriary,
        montantTotalClientDevise:   montantTotalClientDevise,
        montantTotalClientAriary:   montantTotalClientAriary,
        commissionAriary:           commissionAriary,
      });
      await dispatch(fetchProspectionEntetes(prestationId));
      onClose();
    } catch {
      setError('Erreur lors de la création de la ligne.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const selectClass = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition';

  const SectionTitle = ({ label, icon }: { label: string; icon?: string }) => (
    <div className="flex items-center gap-2 pt-2">
      {icon && <span className="text-base">{icon}</span>}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <VisaModal title="Nouvelle ligne de prospection" onClose={onClose} onSubmit={handleSubmit} loading={loading}>

      {/* ── 1. Paramètre Visa ── */}
      <SectionTitle label="Paramètre visa" icon="🛂" />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Paramètre Visa <span className="text-red-400">*</span>
        </label>
        <select value={visaParamsId} onChange={e => handleSelectParam(e.target.value)} className={selectClass}>
          <option value="">— Sélectionner un paramètre —</option>
          {visaParams.map(v => (
            <option key={v.id} value={v.id}>
              {v.description} ({v.code}){v.pays ? ` · ${v.pays.pays}` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedParam && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
          {[
            { label: 'Pays',      value: selectedParam.pays?.pays },
            { label: 'Type',      value: selectedParam.visaType?.nom },
            { label: 'Durée',     value: selectedParam.visaDuree?.duree ? `${selectedParam.visaDuree.duree} j` : undefined },
            { label: 'Entrée',    value: selectedParam.visaEntree?.entree },
            { label: 'PU Achat',  value: `${selectedParam.puAchatDevise.toLocaleString('fr-FR')} ${devise}` },
            { label: 'PV Ariary', value: `${selectedParam.pVenteAriary.toLocaleString('fr-FR')} Ar` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-indigo-400 uppercase tracking-wide">{label}</p>
              <p className="text-xs font-semibold text-indigo-800">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. Séjour ── */}
      <SectionTitle label="Séjour" icon="✈️" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <VisaField label="Nombre de personnes" type="number" value={nombre}
          onChange={setNombre} placeholder="ex: 2" required />
        <VisaField label="Date de départ" type="date" value={dateDepart}
          onChange={setDateDepart} required />
        <VisaField label="Date de retour" type="date" value={dateRetour}
          onChange={setDateRetour} required />
      </div>

      {/* ── 3. Devise & Taux ── */}
      <SectionTitle label="Devise & Taux" icon="💱" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Devise <span className="text-red-400">*</span></label>
          <select value={devise} onChange={e => setDevise(e.target.value)} className={selectClass}>
            {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <VisaField label={`Taux de change (1 ${devise} = ? Ar)`} type="number"
          value={tauxEchange} onChange={setTauxEchange} placeholder="ex: 4500" required />
      </div>

      {/* ── 4. Tarifs ── */}
      <SectionTitle label="Tarifs" icon="💰" />

      {/* Consulat — prix d'achat */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Consulat</p>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">prix d'achat</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-4">
          <EditField
            label={`PU (${devise})`}
            value={puConsulatDevise}
            onChange={setPuConsulatDevise}
            placeholder="ex: 100"
          />
          <AutoField label="PU (Ar)"             value={puConsulatAriary} />
          <AutoField label={`Total (${devise})`} value={montantTotalConsulatDevise} />
          <AutoField label="Total (Ar)"          value={montantTotalConsulatAriary} />
        </div>
      </div>

      {/* Client — prix de vente */}
      <div className="rounded-2xl border border-indigo-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Client</p>
          <span className="text-[10px] text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">prix de vente</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-4">
          {/* PU Client Ar — fixe depuis param, ne change jamais */}
          <FixedField label="PU (Ar)"             value={puKA} />
          <AutoField  label={`PU (${devise})`}    value={puClientDevise} accent />
          <AutoField  label="Total (Ar)"          value={montantTotalClientAriary} accent />
          <AutoField  label={`Total (${devise})`} value={montantTotalClientDevise} />
        </div>
      </div>

      {/* Commission */}
      <div className={`flex items-center justify-between border rounded-2xl px-4 py-3 ${
        commissionAriary < 0
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-100'
      }`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${commissionAriary < 0 ? 'text-red-600' : 'text-green-600'}`}>
            Commission
          </p>
          <p className="text-[10px] text-gray-400">Total Client (Ar) − Total Consulat (Ar)</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold font-mono ${commissionAriary < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {commissionAriary ? commissionAriary.toLocaleString('fr-FR') : '—'}
            <span className="text-sm font-normal ml-1">Ar</span>
          </p>
          {commissionAriary < 0 && (
            <p className="text-[10px] text-red-400 mt-0.5">⚠️ Taux trop élevé</p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}
    </VisaModal>
  );
};

export default CreateProspectionLigneModal;