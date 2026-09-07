import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createAssuranceProspection,
  fetchAssuranceProspections,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import CreateEnteteModal from '../../../../../components/modals/CreateEnteteModal';

interface Props {
  prestationId: string;
  onClose: () => void;
}

const ModalCreationProspection = ({ prestationId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: fournisseurs } = useSelector((s: RootState) => s.fournisseurs);
  const { creating, createError } = useSelector((s: RootState) => s.assuranceProspection);
  const [fournisseurId, setFournisseurId] = React.useState('');

  const handleSubmit = async () => {
    if (!prestationId) return;
    const res = await dispatch(createAssuranceProspection({ prestationId, fournisseurId }));
    if (createAssuranceProspection.fulfilled.match(res)) {
      onClose();
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  return (
    <CreateEnteteModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={creating}
      submitDisabled={!fournisseurId}
      submitLabel="Créer la prospection"
    >
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-2">
          Fournisseur <span className="text-red-500">*</span>
        </label>
        <select
          value={fournisseurId}
          onChange={(e) => setFournisseurId(e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          required
        >
          <option value="">— Sélectionner un fournisseur —</option>
          {fournisseurs?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
          ))}
        </select>
      </div>
      {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
    </CreateEnteteModal>
  );
};

export default ModalCreationProspection;