import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchVisaDocs } from '../../../../../app/front_office/parametre_visa/visaDocSlice';
import VisaModal from './VisaModal';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaDocModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // On récupère les listes déjà chargées dans le store
  const visaDocParams = useSelector((s: RootState) => s.visaDocParams.data);
  const visaParams    = useSelector((s: RootState) => s.visaParam.data);

  const [visaDocParamsId, setVisaDocParamsId] = useState('');
  const [visaParamsId, setVisaParamsId]       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const handleSubmit = async () => {
    if (!visaDocParamsId || !visaParamsId) return setError('Veuillez sélectionner les deux champs.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-doc', { visaDocParamsId, visaParamsId });
      await dispatch(fetchVisaDocs());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <VisaModal title="Ajouter un Document Visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>

      {/* Sélection du Paramètre Document */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Paramètre Document <span className="text-red-500">*</span>
        </label>
        <select value={visaDocParamsId} onChange={e => setVisaDocParamsId(e.target.value)} className={selectClass}>
          <option value="">— Sélectionner —</option>
          {visaDocParams.map(d => (
            <option key={d.id} value={d.id}>{d.document} ({d.code})</option>
          ))}
        </select>
      </div>

      {/* Sélection du Paramètre Visa */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Paramètre Visa <span className="text-red-500">*</span>
        </label>
        <select value={visaParamsId} onChange={e => setVisaParamsId(e.target.value)} className={selectClass}>
          <option value="">— Sélectionner —</option>
          {visaParams.map(v => (
            <option key={v.id} value={v.id}>{v.description} ({v.code})</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaDocModal;