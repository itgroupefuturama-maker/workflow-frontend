import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaEnteteDetail, submitVisaLigne } from '../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';

interface Props {
  ligneId:          string;
  visaEnteteId:     string;
  onClose:          () => void;
  puConsulatDevise: number;   // prix d'achat en devise
  puClientAriary:   number;   // prix de vente Ar — fixe, ne change jamais
  tauxEchange:      number;   // taux par défaut, modifiable
  devise:           string;
}

const SubmitVisaLigneModal = ({
  ligneId, visaEnteteId, onClose,
  puConsulatDevise, puClientAriary, tauxEchange: defaultTaux, devise,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // Taux pré-rempli mais modifiable
  const [soummissionTauxChange,       setSoummissionTauxChange]       = useState(String(defaultTaux));
  const [soummissionPuConsilatAriary, setSoummissionPuConsilatAriary] = useState('');
  const [soummissionCommissionAriary, setSoummissionCommissionAriary] = useState('');
  const [limiteSoummision,            setLimiteSoummision]            = useState('');
  const [referenceSoummision,         setReferenceSoummision]         = useState('');
  const [limitePaiement,              setLimitePaiement]              = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Recalcul : seul le taux change, puClientAriary est fixe ───────────────
  useEffect(() => {
    const taux = Number(soummissionTauxChange);
    if (!taux) {
      setSoummissionPuConsilatAriary('');
      setSoummissionCommissionAriary('');
      return;
    }
    const puCA       = puConsulatDevise * taux;           // achat en Ar
    const commission = puClientAriary   - puCA;           // marge
    setSoummissionPuConsilatAriary(String(puCA));
    setSoummissionCommissionAriary(String(commission));
  }, [soummissionTauxChange]);


  const validate = (): string | null => {
    if (!soummissionTauxChange       || isNaN(Number(soummissionTauxChange)))       return 'Taux de change requis.';
    if (!soummissionPuConsilatAriary || isNaN(Number(soummissionPuConsilatAriary))) return 'PU consulat requis.';
    // if (!soummissionPuClientAriary   || isNaN(Number(soummissionPuClientAriary)))   return 'PU client requis.';
    if (!soummissionCommissionAriary || isNaN(Number(soummissionCommissionAriary))) return 'Commission requise.';
    if (!limiteSoummision)                                                           return 'Limite soumission requise.';
    if (!referenceSoummision)                                                        return 'Référence soumission requise.';
    if (!limitePaiement)                                                             return 'Limite paiement requise.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await dispatch(submitVisaLigne({
        id:                          ligneId,
        soummissionTauxChange:       Number(soummissionTauxChange),
        soummissionPuConsilatAriary: Number(soummissionPuConsilatAriary),
        soummissionPuClientAriary:   puClientAriary,
        soummissionCommissionAriary: Number(soummissionCommissionAriary),
        limiteSoummision:            new Date(limiteSoummision).toISOString(),
        referenceSoummision,
        limitePaiement:              new Date(limitePaiement).toISOString(),
      })).unwrap();
      await dispatch(fetchVisaEnteteDetail(visaEnteteId));
      onClose();
    } catch (e: any) {
      setError(e ?? 'Erreur lors de la soumission.');
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ label }: { label: string }) => (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-1">{label}</p>
  );

   return (
    <VisaModal title="Soumettre la ligne visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>

      {/* ── Taux de change ── */}
      <SectionTitle label="Taux de change" />
      <VisaField
        label={`Taux de change (1 ${devise} = ? Ar)`}
        type="number"
        value={soummissionTauxChange}
        onChange={setSoummissionTauxChange}
        placeholder="ex: 4500"
        required
      />

      {/* ── Récapitulatif des prix ── */}
      <SectionTitle label="Tarifs soumission" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* PU Consulat devise — base, fixe */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">PU Consulat ({devise})</label>
          <div className="rounded-xl px-3 py-2.5 text-sm font-mono bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-between">
            <span>{puConsulatDevise.toLocaleString('fr-FR')}</span>
            <span className="text-[10px] text-gray-300">base</span>
          </div>
        </div>

        {/* PU Consulat Ar — recalculé */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">PU Consulat (Ar)</label>
          <div className="rounded-xl px-3 py-2.5 text-sm font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-between">
            <span>{soummissionPuConsilatAriary ? Number(soummissionPuConsilatAriary).toLocaleString('fr-FR') : '—'}</span>
            <span className="text-[10px] text-gray-300 shrink-0">auto</span>
          </div>
        </div>

        {/* PU Client Ar — fixe, prix de vente */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">PU Client (Ar)</label>
          <div className="rounded-xl px-3 py-2.5 text-sm font-mono bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-between">
            <span>{puClientAriary.toLocaleString('fr-FR')}</span>
            <span className="text-[10px] text-gray-300">fixe</span>
          </div>
        </div>

        {/* Commission — recalculée, colorée selon signe */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Commission (Ar)</label>
          <div className={`rounded-xl px-3 py-2.5 text-sm font-mono border flex items-center justify-between gap-2 font-semibold ${
            Number(soummissionCommissionAriary) >= 0
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span>{soummissionCommissionAriary ? Number(soummissionCommissionAriary).toLocaleString('fr-FR') : '—'}</span>
            <span className="text-[10px] text-gray-300 shrink-0">auto</span>
          </div>
        </div>
      </div>

      {/* Alerte commission négative */}
      {Number(soummissionCommissionAriary) < 0 && (
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          ⚠️ Commission négative — le taux de change est trop élevé par rapport au prix de vente client.
        </div>
      )}

      {/* ── Références & Dates ── */}
      <SectionTitle label="Références & Dates" />
      <VisaField label="Référence soumission" type="text" value={referenceSoummision}
        onChange={setReferenceSoummision} placeholder="ex: REF-2026-001" required />
      <div className="grid grid-cols-2 gap-3">
        <VisaField label="Limite soumission" type="date" value={limiteSoummision}
          onChange={setLimiteSoummision} required />
        <VisaField label="Limite paiement" type="date" value={limitePaiement}
          onChange={setLimitePaiement} required />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default SubmitVisaLigneModal;