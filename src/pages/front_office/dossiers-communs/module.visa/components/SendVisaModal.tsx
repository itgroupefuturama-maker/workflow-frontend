import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { fetchVisaEnteteDetail, sendVisa } from '../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import VisaModal from './VisaModal';
import VisaField from './VisaField';

interface Props {
  visaId: string; 
  visaEnteteId: string;
  onClose: () => void;
}

const SendVisaModal = ({ visaId, visaEnteteId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [referenceDossier, setReferenceDossier] = useState('');
  const [dateSoummission,  setdateSoummission]  = useState('');
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');

  const validate = (): string | null => {
    if (!referenceDossier) return 'Référence dossier requise.';
    if (!dateSoummission)   return 'Date de soumission requise.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await dispatch(sendVisa({
        id: visaId,
        referenceDossier,
        dateSoummission: new Date(dateSoummission).toISOString(),
      })).unwrap();
      
      await dispatch(fetchVisaEnteteDetail(visaEnteteId));
      onClose();
    } catch (e: any) {
      setError("Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisaModal title="Envoyer le visa" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <VisaField label="Référence dossier" type="text" value={referenceDossier}
        onChange={setReferenceDossier} placeholder="ex: REF-2024-001" required />
      <VisaField label="Date de soumission" type="date" value={dateSoummission}
        onChange={setdateSoummission} required />
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default SendVisaModal;