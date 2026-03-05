import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchVisaParams } from '../../../../../app/front_office/parametre_visa/visaParamSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaParamModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // ── Store ──────────────────────────────────────────────────────────────────
  const paysList = useSelector((s: RootState) => s.pays.items);
  const visaTypes   = useSelector((s: RootState) => s.visaType.data);
  const visaDurees  = useSelector((s: RootState) => s.visaDuree.data);
  const visaEntrees = useSelector((s: RootState) => s.visaEntree.data);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [description,    setDescription]    = useState('');
  const [paysId,         setPaysId]         = useState('');
  const [visaTypeId,     setVisaTypeId]     = useState('');
  const [visaDureeId,    setVisaDureeId]    = useState('');
  const [visaEntreeId,   setVisaEntreeId]   = useState('');
  const [dureeTraitement, setDureeTraitement] = useState('');
  const [pVenteAriary,   setPVenteAriary]   = useState('');
  const [puAchatDevise,  setPuAchatDevise]  = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!description.trim())              return 'La description est requise.';
    if (!paysId)                          return 'Veuillez sélectionner un pays.';
    if (!visaTypeId)                      return 'Veuillez sélectionner un type de visa.';
    if (!visaDureeId)                     return 'Veuillez sélectionner une durée.';
    if (!visaEntreeId)                    return "Veuillez sélectionner un type d'entrée.";
    if (!dureeTraitement || isNaN(Number(dureeTraitement)))
                                          return 'La durée de traitement doit être un nombre.';
    if (!pVenteAriary || isNaN(Number(pVenteAriary)))
                                          return 'Le prix de vente doit être un nombre.';
    if (!puAchatDevise || isNaN(Number(puAchatDevise)))
                                          return "Le prix d'achat devise doit être un nombre.";
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-param', {
        description,
        paysId,
        visaTypeId,
        visaDureeId,
        visaEntreeId,
        dureeTraitement : Number(dureeTraitement),
        pVenteAriary    : Number(pVenteAriary),
        puAchatDevise   : Number(puAchatDevise),
      });
      await dispatch(fetchVisaParams());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared select style ────────────────────────────────────────────────────
  const selectClass =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400 bg-white';

  const SelectField = ({
    label,
    value,
    onChange,
    children,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectClass}>
        <option value="">— Sélectionner —</option>
        {children}
      </select>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <VisaModal
      title="Ajouter un Paramètre Visa"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      {/* Description */}
      <VisaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="ex: Visa France Tourisme"
        required
      />

      {/* Pays */}
      <SelectField label="Pays" value={paysId} onChange={setPaysId}>
        {paysList.map(p => (
          <option key={p.id} value={p.id}>{p.pays}</option>
        ))}
      </SelectField>

      {/* Ligne : Type + Entrée */}
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Type de Visa" value={visaTypeId} onChange={setVisaTypeId}>
          {visaTypes.map(t => (
            <option key={t.id} value={t.id} className="capitalize">{t.nom}</option>
          ))}
        </SelectField>

        <SelectField label="Type d'entrée" value={visaEntreeId} onChange={setVisaEntreeId}>
          {visaEntrees.map(e => (
            <option key={e.id} value={e.id}>{e.entree}</option>
          ))}
        </SelectField>
      </div>

      {/* Durée de Visa */}
      <SelectField label="Durée de Visa" value={visaDureeId} onChange={setVisaDureeId}>
        {visaDurees.map(d => (
          <option key={d.id} value={d.id}>{d.duree} jours</option>
        ))}
      </SelectField>

      {/* Ligne : Durée traitement + Prix vente + Achat devise */}
      <div className="grid grid-cols-3 gap-3">
        <VisaField
          label="Traitement (j)"
          type="number"
          value={dureeTraitement}
          onChange={setDureeTraitement}
          placeholder="ex: 15"
          required
        />
        <VisaField
          label="Prix vente (Ar)"
          type="number"
          value={pVenteAriary}
          onChange={setPVenteAriary}
          placeholder="ex: 500000"
          required
        />
        <VisaField
          label="Achat devise"
          type="number"
          value={puAchatDevise}
          onChange={setPuAchatDevise}
          placeholder="ex: 100"
          required
        />
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default CreateVisaParamModal;