import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { decisionVisa, fetchVisaEnteteDetail } from '../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import VisaModal from './VisaModal';

interface Props {
  visaId: string;
  visaEnteteId: string;
  onClose: () => void;
}

const TYPES_DECISION = ['ACCEPTER', 'REFUSER'];

const DecisionVisaModal = ({ visaId, visaEnteteId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [type,    setType]    = useState('ACCEPTER');
  const [motif,   setMotif]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const validate = (): string | null => {
    if (!type)  return 'Type de décision requis.';
    if (!motif) return 'Motif requis.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await dispatch(decisionVisa({ id: visaId, type, motif })).unwrap();
      await dispatch(fetchVisaEnteteDetail(visaEnteteId));
      onClose();
    } catch (e: any) {
      setError(typeof e === 'string' ? e : e?.message ?? 'Erreur lors de la décision.');
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400 bg-white';

  return (
    <VisaModal title="Décision visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      {/* Type */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Type de décision <span className="text-red-500">*</span>
        </label>
        <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
          {TYPES_DECISION.map(t => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Motif */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Motif <span className="text-red-500">*</span>
        </label>
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          rows={3}
          placeholder="ex: Dossier conforme"
          className={selectClass}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default DecisionVisaModal;