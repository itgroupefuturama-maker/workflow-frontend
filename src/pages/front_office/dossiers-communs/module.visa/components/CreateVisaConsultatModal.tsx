import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaConsultats } from '../../../../../app/front_office/parametre_visa/visaConsultatSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';
import axios from '../../../../../service/Axios';

interface Props { onClose: () => void; }

const CreateVisaConsultatModal = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!nom.trim()) return setError('Le nom est requis.');
    setError('');
    setLoading(true);
    try {
      await axios.post('/visa-params/consultat', { nom });
      await dispatch(fetchVisaConsultats());
      onClose();
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Ajouter un Consulat" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Nom du consulat" value={nom} onChange={setNom} placeholder="ex: Ambassade de France" required />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </VisaModal>
  );
};

export default CreateVisaConsultatModal;