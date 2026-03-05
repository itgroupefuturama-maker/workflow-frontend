import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaTypes } from '../../../../../app/front_office/parametre_visa/visaTypeSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaTypeModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!nom.trim()) return setError('Le nom est requis.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/visa-type', { nom, description });
      await dispatch(fetchVisaTypes());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Ajouter un Type de Visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Nom" value={nom} onChange={setNom} placeholder="ex: Tourisme" required />
      <VisaField label="Description" value={description} onChange={setDescription} placeholder="ex: Visa de tourisme" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaTypeModal;