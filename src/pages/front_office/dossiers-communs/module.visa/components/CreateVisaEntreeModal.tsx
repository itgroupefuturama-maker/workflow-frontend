import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaEntrees } from '../../../../../app/front_office/parametre_visa/visaEntreeSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaEntreeModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [entree, setEntree] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!entree.trim()) return setError("Le type d'entrée est requis.");
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-entree', { entree });
      await dispatch(fetchVisaEntrees());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Ajouter un Visa Entrée" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Type d'entrée" value={entree} onChange={setEntree} placeholder="ex: Simple, Multiple..." required />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaEntreeModal;