import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaDurees } from '../../../../../app/front_office/parametre_visa/visaDureeSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaDureeModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [duree, setDuree] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!duree || isNaN(Number(duree))) return setError('La durée doit être un nombre valide.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-duree', { duree: Number(duree) });
      await dispatch(fetchVisaDurees());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Ajouter une Durée de Visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Durée (en jours)" type="number" value={duree} onChange={setDuree} placeholder="ex: 30" required />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaDureeModal;