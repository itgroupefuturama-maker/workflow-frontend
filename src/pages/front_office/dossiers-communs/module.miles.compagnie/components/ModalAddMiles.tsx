import React from 'react';
import { FiX, FiAward, FiLoader, FiUserCheck } from 'react-icons/fi';
import type { CompagnieClient } from '../../../../../app/front_office/parametre_miles_compagnie/compagnieClientsSlice';

interface Props {
  selectedCC: CompagnieClient;
  milesForm: { miles: number; dateExpiration: string };
  milesError: string | null;
  loading: boolean;
  onChange: (field: 'miles' | 'dateExpiration', value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ModalAddMiles = ({ selectedCC, milesForm, milesError, loading, onChange, onSubmit, onClose }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-black text-gray-900">Ajouter des Miles</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {selectedCC.identifiant} — <span className="text-indigo-500">{selectedCC.fournisseur.libelle}</span>
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <FiX size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="px-8 py-6 space-y-5">
        {milesError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            {milesError}
          </div>
        )}

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl border border-indigo-100 text-indigo-600">
            <FiUserCheck size={16} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-800">{selectedCC.clientBeneficiaire.libelle}</p>
            <p className="text-[10px] text-gray-400 font-mono">{selectedCC.clientBeneficiaire.code}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Solde actuel</p>
            <p className="text-sm font-black text-gray-400 italic">Aucun miles</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Miles</label>
          <input type="number" min={1} required value={milesForm.miles}
            onChange={(e) => onChange('miles', Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Date d'expiration</label>
          <input type="date" required value={milesForm.dateExpiration}
            onChange={(e) => onChange('dateExpiration', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-60">
            {loading ? <FiLoader className="animate-spin" size={16} /> : <FiAward size={16} />}
            Ajouter
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default ModalAddMiles;