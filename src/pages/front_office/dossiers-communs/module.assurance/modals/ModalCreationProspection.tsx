import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createAssuranceProspection,
  fetchAssuranceProspections,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';

const Spinner = ({ size = 5 }: { size?: number }) => (
  <svg className={`animate-spin h-${size} w-${size} text-gray-400`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition text-lg leading-none">×</button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  </div>
);

const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <select {...props} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition">
      {children}
    </select>
  </div>
);

interface Props {
  prestationId: string;
  onClose: () => void;
}

const ModalCreationProspection = ({ prestationId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: fournisseurs } = useSelector((s: RootState) => s.fournisseurs);
  const { creating, createError } = useSelector((s: RootState) => s.assuranceProspection);
  const [fournisseurId, setFournisseurId] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestationId) return;
    const res = await dispatch(createAssuranceProspection({ prestationId, fournisseurId }));
    if (createAssuranceProspection.fulfilled.match(res)) {
      onClose();
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  return (
    <Modal title="Nouvelle prospection assurance" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Fournisseur" value={fournisseurId} onChange={e => setFournisseurId(e.target.value)} required>
          <option value="">— Sélectionner un fournisseur —</option>
          {fournisseurs?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
          ))}
        </Select>
        {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={creating || !fournisseurId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
          >
            {creating ? <Spinner size={3} /> : null}
            {creating ? 'Création…' : 'Créer la prospection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCreationProspection;