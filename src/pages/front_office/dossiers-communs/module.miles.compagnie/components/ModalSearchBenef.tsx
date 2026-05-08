import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { searchCompagnieClientsByBenef } from '../../../../../app/front_office/parametre_miles_compagnie/compagnieClientsSlice';
import type { ClientBeneficiaire } from '../../../../../app/back_office/clientBeneficiairesSlice';
import {
  FiX, FiSearch, FiLoader, FiAward,
  FiCreditCard, FiTruck, FiUserCheck,
} from 'react-icons/fi';

interface Props {
  beneficiaires: ClientBeneficiaire[];
  onClose: () => void;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

const ModalSearchBenef = ({ beneficiaires, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const { searchResults = [], loadingSearch } = useSelector((s: RootState) => s.compagnieClients);

  const [selectedId, setSelectedId] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await dispatch(searchCompagnieClientsByBenef(selectedId));
    setSearched(true);
  };

  const totalMiles = (searchResults ?? []).reduce(
    (sum, cc) => sum + (cc.milesCompagnie ?? []).reduce((s, m) => s + m.miles, 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <FiSearch size={18} className="text-indigo-500" />
              Consulter Miles d'un Client
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Sélectionnez un client bénéficiaire pour voir ses comptes miles.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Formulaire recherche */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setSearched(false); }}
              required
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">-- Sélectionner un client bénéficiaire --</option>
              {beneficiaires.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.libelle}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedId || loadingSearch}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {loadingSearch
                ? <FiLoader className="animate-spin" size={16} />
                : <FiSearch size={16} />}
              Rechercher
            </button>
          </form>

          {/* Résultats */}
          {loadingSearch && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="animate-spin text-indigo-600" size={28} />
            </div>
          )}

          {searched && !loadingSearch && searchResults.length === 0 && (
            <div className="text-center py-12 text-gray-400 italic text-sm">
              Aucun compte miles trouvé pour ce client.
            </div>
          )}

          {searched && !loadingSearch && searchResults.length > 0 && (
            <>
              {/* Résumé client + total miles */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border border-indigo-100 text-indigo-600">
                  <FiUserCheck size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">
                    {searchResults[0].clientBeneficiaire.libelle}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {searchResults[0].clientBeneficiaire.code} ·{' '}
                    <span className={`font-black uppercase ${
                      searchResults[0].clientBeneficiaire.typeClient === 'PLATINIUM'
                        ? 'text-indigo-500' : 'text-emerald-500'
                    }`}>
                      {searchResults[0].clientBeneficiaire.typeClient}
                    </span>
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total Miles</p>
                  <p className="text-xl font-black text-emerald-600">
                    {totalMiles.toLocaleString()}
                    <span className="text-xs ml-1 font-bold text-emerald-500">miles</span>
                  </p>
                </div>
              </div>

              {/* Cards par fournisseur */}
              <div className="space-y-4">
                {searchResults.map((cc) => {
                  const ccTotal = (cc.milesCompagnie ?? []).reduce((s, m) => s + m.miles, 0);
                  return (
                    <div key={cc.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                      {/* Fournisseur header */}
                      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                        <div className="p-2 bg-white rounded-xl border border-gray-100 text-indigo-600">
                          <FiTruck size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800 uppercase">{cc.fournisseur.libelle}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{cc.fournisseur.code}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                          <span className="inline-flex items-center gap-2 text-[10px] font-mono font-black bg-white text-indigo-500 px-3 py-1.5 rounded-lg border border-gray-100">
                            <FiCreditCard size={11} /> {cc.numeroCarte}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
                            <FiAward size={12} />
                            {ccTotal.toLocaleString()} miles
                          </span>
                        </div>
                      </div>

                      {/* Détail des miles entries */}
                      {cc.milesCompagnie.length === 0 ? (
                        <p className="px-5 py-4 text-xs text-gray-400 italic">Aucun miles enregistré.</p>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-50">
                          <thead className="bg-white uppercase text-[9px] font-black text-gray-400 tracking-widest">
                            <tr>
                              <th className="px-5 py-3 text-left">Miles</th>
                              <th className="px-5 py-3 text-left">Date expiration</th>
                              <th className="px-5 py-3 text-left">Créé le</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {cc.milesCompagnie.map((m) => (
                              <tr key={m.id} className="hover:bg-indigo-50/10 transition-colors">
                                <td className="px-5 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
                                    <FiAward size={11} />
                                    {m.miles.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-600 font-medium">
                                  {new Date(m.dateExpiration).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                                  {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-50 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSearchBenef;