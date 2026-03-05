import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
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
  const dispatch = useDispatch<AppDispatch>();

  // ── Store ──────────────────────────────────────────────────────────────────
  const visaParams   = useSelector((s: RootState) => s.visaParam.data);
  const consultats   = useSelector((s: RootState) => s.visaConsultat.data);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [visaParamsId,     setVisaParamsId]     = useState('');
  const [consulatId,       setConsulatId]       = useState('');
  const [nombre,           setNombre]           = useState('');
  const [dateDepart,       setDateDepart]       = useState('');
  const [dateRetour,       setDateRetour]       = useState('');
  const [devise,           setDevise]           = useState('EUR');
  const [tauxEchange,      setTauxEchange]      = useState('');
  const [puConsulatDevise, setPuConsulatDevise] = useState('');
  const [puConsulatAriary, setPuConsulatAriary] = useState('');
  const [puClientDevise,   setPuClientDevise]   = useState('');
  const [puClientAriary,   setPuClientAriary]   = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Calcul automatique Ariary depuis Devise ────────────────────────────────
  const handleTauxOrDevise = (
    newTaux: string,
    consulatDev = puConsulatDevise,
    clientDev   = puClientDevise,
  ) => {
    setTauxEchange(newTaux);
    const taux = Number(newTaux);
    if (taux && Number(consulatDev)) setPuConsulatAriary(String(Number(consulatDev) * taux));
    if (taux && Number(clientDev))   setPuClientAriary(String(Number(clientDev) * taux));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!visaParamsId)                             return 'Veuillez sélectionner un paramètre visa.';
    if (!consulatId)                               return 'Veuillez sélectionner un consulat.';
    if (!nombre || isNaN(Number(nombre)))          return 'Le nombre doit être un entier valide.';
    if (!dateDepart)                               return 'La date de départ est requise.';
    if (!dateRetour)                               return 'La date de retour est requise.';
    if (new Date(dateRetour) <= new Date(dateDepart))
                                                   return 'La date de retour doit être après le départ.';
    if (!tauxEchange || isNaN(Number(tauxEchange))) return 'Le taux de change est requis.';
    if (!puConsulatDevise || isNaN(Number(puConsulatDevise))) return 'PU Consulat devise requis.';
    if (!puConsulatAriary || isNaN(Number(puConsulatAriary))) return 'PU Consulat ariary requis.';
    if (!puClientDevise   || isNaN(Number(puClientDevise)))   return 'PU Client devise requis.';
    if (!puClientAriary   || isNaN(Number(puClientAriary)))   return 'PU Client ariary requis.';
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa/prospection-ligne', {
        visaProspectionEnteteId : enteteId,
        visaParamsId,
        consulatId,
        nombre          : Number(nombre),
        dateDepart      : new Date(dateDepart).toISOString(),
        dateRetour      : new Date(dateRetour).toISOString(),
        devise,
        tauxEchange     : Number(tauxEchange),
        puConsulatDevise: Number(puConsulatDevise),
        puConsulatAriary: Number(puConsulatAriary),
        puClientDevise  : Number(puClientDevise),
        puClientAriary  : Number(puClientAriary),
      });
      await dispatch(fetchProspectionEntetes(prestationId));
      onClose();
    } catch {
      setError('Erreur lors de la création de la ligne.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const selectClass =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400 bg-white';

  const SelectField = ({
    label,
    value,
    onChange,
    children,
    required = true,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectClass}>
        <option value="">— Sélectionner —</option>
        {children}
      </select>
    </div>
  );

  const SectionTitle = ({ label }: { label: string }) => (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-1">{label}</p>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <VisaModal
      title="Ajouter une ligne de prospection"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      {/* ── Visa & Consulat ── */}
      <SectionTitle label="Paramètres" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Paramètre Visa" value={visaParamsId} onChange={setVisaParamsId}>
          {visaParams.map(v => (
            <option key={v.id} value={v.id}>{v.description} ({v.code})</option>
          ))}
        </SelectField>

        <SelectField label="Consulat" value={consulatId} onChange={setConsulatId}>
          {consultats.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </SelectField>
      </div>

      {/* ── Dates & Nombre ── */}
      <SectionTitle label="Séjour" />
      <div className="grid grid-cols-3 gap-3">
        <VisaField
          label="Nombre"
          type="number"
          value={nombre}
          onChange={setNombre}
          placeholder="ex: 2"
          required
        />
        <VisaField
          label="Date départ"
          type="date"
          value={dateDepart}
          onChange={setDateDepart}
          required
        />
        <VisaField
          label="Date retour"
          type="date"
          value={dateRetour}
          onChange={setDateRetour}
          required
        />
      </div>

      {/* ── Devise & Taux ── */}
      <SectionTitle label="Devise" />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Devise <span className="text-red-500">*</span>
          </label>
          <select value={devise} onChange={e => setDevise(e.target.value)} className={selectClass}>
            {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <VisaField
          label="Taux de change"
          type="number"
          value={tauxEchange}
          onChange={v => handleTauxOrDevise(v)}
          placeholder="ex: 4500"
          required
        />
      </div>

      {/* ── Tarifs Consulat ── */}
      <SectionTitle label="Tarif Consulat" />
      <div className="grid grid-cols-2 gap-3">
        <VisaField
          label={`PU Consulat (${devise})`}
          type="number"
          value={puConsulatDevise}
          onChange={v => {
            setPuConsulatDevise(v);
            if (tauxEchange) setPuConsulatAriary(String(Number(v) * Number(tauxEchange)));
          }}
          placeholder="ex: 100"
          required
        />
        <VisaField
          label="PU Consulat (Ar)"
          type="number"
          value={puConsulatAriary}
          onChange={setPuConsulatAriary}
          placeholder="Calculé auto"
          required
        />
      </div>

      {/* ── Tarifs Client ── */}
      <SectionTitle label="Tarif Client" />
      <div className="grid grid-cols-2 gap-3">
        <VisaField
          label={`PU Client (${devise})`}
          type="number"
          value={puClientDevise}
          onChange={v => {
            setPuClientDevise(v);
            if (tauxEchange) setPuClientAriary(String(Number(v) * Number(tauxEchange)));
          }}
          placeholder="ex: 120"
          required
        />
        <VisaField
          label="PU Client (Ar)"
          type="number"
          value={puClientAriary}
          onChange={setPuClientAriary}
          placeholder="Calculé auto"
          required
        />
      </div>

      {/* ── Erreur ── */}
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default CreateProspectionLigneModal;