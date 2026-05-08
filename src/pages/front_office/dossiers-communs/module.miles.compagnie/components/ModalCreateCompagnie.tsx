import React from 'react';
import { FiX, FiPlus, FiLoader } from 'react-icons/fi';
import type { Fournisseur } from '../../../../../app/back_office/fournisseursSlice';
import type { ClientBeneficiaire } from '../../../../../app/back_office/clientBeneficiairesSlice';

export interface FormState {
  identifiant: string;
  motDePasse: string;
  numeroCarte: string;
  clientBeneficiaireId: string;
  fournisseurId: string;
  miles: number;
  dateExpiration: string;
}

interface Props {
  form: FormState;
  formError: string | null;
  loading: boolean;
  fournisseurs: Fournisseur[];
  beneficiaires: ClientBeneficiaire[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ModalCreateCompagnie = ({
  form, formError, loading, fournisseurs, beneficiaires,
  onChange, onSubmit, onClose,
}: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-black text-gray-900">Nouveau Miles Compagnie</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Remplissez les informations ci-dessous</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <FiX size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="px-8 py-6 space-y-5 max-h-[75vh] overflow-y-auto">
        {formError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Identifiant</label>
          <input name="identifiant" value={form.identifiant} onChange={onChange} required placeholder="Ex: COMP-001"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Mot de passe</label>
          <input name="motDePasse" type="password" value={form.motDePasse} onChange={onChange} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Numéro de carte</label>
          <input name="numeroCarte" value={form.numeroCarte} onChange={onChange} required placeholder="Ex: 1234-5678-9012"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Client Bénéficiaire</label>
          <select name="clientBeneficiaireId" value={form.clientBeneficiaireId} onChange={onChange} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">-- Sélectionner --</option>
            {beneficiaires.map((b) => (
              <option key={b.id} value={b.id}>{b.code} — {b.libelle}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Fournisseur</label>
          <select name="fournisseurId" value={form.fournisseurId} onChange={onChange} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">-- Sélectionner --</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.code} — {f.libelle}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Miles <span className="text-gray-300 font-normal normal-case">(optionnel)</span>
            </label>
            <input name="miles" type="number" min={0} value={form.miles} onChange={onChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Date expiration</label>
            <input name="dateExpiration" type="date" value={form.dateExpiration} onChange={onChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-60">
            {loading ? <FiLoader className="animate-spin" size={16} /> : <FiPlus size={16} />}
            Créer
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default ModalCreateCompagnie;