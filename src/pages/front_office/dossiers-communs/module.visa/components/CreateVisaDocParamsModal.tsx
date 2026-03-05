import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaDocParams } from '../../../../../app/front_office/parametre_visa/visaDocParamsSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaDocParamsModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [code, setCode] = useState('');
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code.trim() || !document.trim()) return setError('Le code et le document sont requis.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-doc-params', { code, document });
      await dispatch(fetchVisaDocParams());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Ajouter un Paramètre Document" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Code" value={code} onChange={setCode} placeholder="ex: PASS" required />
      <VisaField label="Document" value={document} onChange={setDocument} placeholder="ex: Passeport" required />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaDocParamsModal;