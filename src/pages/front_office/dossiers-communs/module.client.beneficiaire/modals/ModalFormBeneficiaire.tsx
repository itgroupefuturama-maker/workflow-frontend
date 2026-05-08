import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';
import { FiX, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { createClientBeneficiaire, fetchClientBeneficiaires, updateClientBeneficiaire, type ClientBeneficiaire } from '../../../../../app/back_office/clientBeneficiairesSlice';

interface Props {
  editingClient: ClientBeneficiaire | null;
  onClose: () => void;
}

const ModalFormBeneficiaire = ({ editingClient, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [libelle, setLibelle]       = useState(editingClient?.libelle ?? '');
  const [statut, setStatut]         = useState<'ACTIF' | 'INACTIF'>(
    (editingClient?.statut as 'ACTIF' | 'INACTIF') ?? 'ACTIF'
  );
  const [typeClient, setTypeClient] = useState<'SIMPLE' | 'GOLD' | 'SILVER' | 'BRONZE' | 'VIP'>(
    (editingClient?.typeClient as any) ?? 'SIMPLE'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingClient) {
      const result = await dispatch(updateClientBeneficiaire({ id: editingClient.id, libelle, statut, typeClient }));
      if (updateClientBeneficiaire.fulfilled.match(result)) {
        setMessage({ text: 'Client bénéficiaire mis à jour !', isError: false });
        dispatch(fetchClientBeneficiaires());
        setTimeout(onClose, 1500);
      } else {
        setMessage({ text: 'Une erreur est survenue.', isError: true });
      }
    } else {
      const result = await dispatch(createClientBeneficiaire({
        libelle, statut, typeClient,
        dateApplication: new Date().toISOString(),
      }));
      if (createClientBeneficiaire.fulfilled.match(result)) {
        setMessage({ text: 'Client bénéficiaire créé !', isError: false });
        setTimeout(onClose, 1500);
      } else {
        setMessage({ text: 'Une erreur est survenue.', isError: true });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">
            {editingClient ? 'Éditer le bénéficiaire' : 'Nouveau bénéficiaire'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Libellé du bénéficiaire
            </label>
            <input
              type="text"
              placeholder="Nom complet ou raison sociale"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Statut initial
            </label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
            >
              <option value="ACTIF">ACTIF</option>
              <option value="INACTIF">INACTIF</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Type de client
            </label>
            <select
              value={typeClient}
              onChange={(e) => setTypeClient(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
            >
              <option value="SIMPLE">SIMPLE</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="BRONZE">BRONZE</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 font-bold text-xs ${
              message.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-500 text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalFormBeneficiaire;