import React, { useEffect, useMemo, useState } from 'react';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFournisseurs } from '../../../../app/back_office/fournisseursSlice';
import { fetchClientBeneficiaires } from '../../../../app/back_office/clientBeneficiairesSlice';
import {
  addMilesCompagnie, createCompagnieClient,
  fetchCompagnieClients, updateMilesCompagnie,
  type CompagnieClient,
} from '../../../../app/front_office/parametre_miles_compagnie/compagnieClientsSlice';
import {
  FiArrowLeft, FiLoader, FiPlus, FiTruck,
  FiUserCheck, FiCreditCard, FiAward, FiEdit2,
  FiSearch, FiX,
  FiClock,
  FiArrowDown,
  FiArrowDownCircle,
} from 'react-icons/fi';
import type { FormState } from './components/ModalCreateCompagnie';
import ModalCreateCompagnie from './components/ModalCreateCompagnie';
import ModalAddMiles from './components/ModalAddMiles';
import ModalUpdateMiles from './components/ModalUpdateMiles';
import ModalSearchBenef from './components/ModalSearchBenef';

const useAppDispatch = () => useDispatch<AppDispatch>();

const emptyForm: FormState = {
  identifiant: '', motDePasse: '', numeroCarte: '',
  clientBeneficiaireId: '', fournisseurId: '', miles: 0, dateExpiration: '',
};

interface CCFilters {
  client: string;
  fournisseur: string;
  milesMin: string;
  milesMax: string;
  expirationFrom: string;
  expirationTo: string;
  hasExpired: '' | 'expired' | 'active';
}

const emptyCCFilters: CCFilters = {
  client: '', fournisseur: '',
  milesMin: '', milesMax: '',
  expirationFrom: '', expirationTo: '',
  hasExpired: '',
};

// ─── FilterCell ───────────────────────────────────────────────────────────────
const FilterCell: React.FC<{ label: string; last?: boolean; children: React.ReactNode }> = ({
  label, last, children,
}) => (
  <div className={`flex flex-col gap-0.5 px-4 py-2.5 ${!last ? 'border-r border-gray-100' : ''} min-w-[130px]`}>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

// ─── ActiveFilterBadge ────────────────────────────────────────────────────────
const ActiveFilterBadge: React.FC<{ label: string; onRemove: () => void; color?: string }> = ({
  label, onRemove, color = 'indigo',
}) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${colors[color]}`}>
      {label}
      <button onClick={onRemove} className="flex items-center hover:opacity-70"><FiX size={10} /></button>
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const PageMilesCompagnie = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: fournisseurs, loading: loadingFourn } = useSelector((s: RootState) => s.fournisseurs);
  const { data: beneficiaires, loading: loadingBenef } = useSelector((s: RootState) => s.clientBeneficiaires);
  const { items: compagnieClients, loading: loadingCC } = useSelector((s: RootState) => s.compagnieClients);

  const [showHistorique, setShowHistorique] = useState<CompagnieClient | null>(null);

  const [showCreate, setShowCreate]           = useState(false);
  const [form, setForm]                       = useState<FormState>(emptyForm);
  const [formError, setFormError]             = useState<string | null>(null);
  const [showAddMiles, setShowAddMiles]       = useState(false);
  const [showUpdateMiles, setShowUpdateMiles] = useState(false);
  const [selectedCC, setSelectedCC]           = useState<CompagnieClient | null>(null);
  const [milesForm, setMilesForm]             = useState({ miles: 0, dateExpiration: '' });
  const [updateMilesValue, setUpdateMilesValue] = useState(0);
  const [milesError, setMilesError]           = useState<string | null>(null);
  const [showSearch, setShowSearch]           = useState(false);
  const [ccFilters, setCCFilters]             = useState<CCFilters>(emptyCCFilters);
  const [search, setSearch]                   = useState('');

  const setFilter = (key: keyof CCFilters, value: string) =>
    setCCFilters((prev) => ({ ...prev, [key]: value }));

  const clearAllFilters = () => { setCCFilters(emptyCCFilters); setSearch(''); };

  const activeCount = Object.values(ccFilters).filter(Boolean).length + (search ? 1 : 0);

  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    return compagnieClients
      .map((cc) => ({ id: cc.clientBeneficiaire.id, label: cc.clientBeneficiaire.libelle }))
      .filter((o) => seen.has(o.id) ? false : (seen.add(o.id), true));
  }, [compagnieClients]);

  const fournisseurOptions = useMemo(() => {
    const seen = new Set<string>();
    return compagnieClients
      .map((cc) => ({ id: cc.fournisseur.id, label: cc.fournisseur.libelle }))
      .filter((o) => seen.has(o.id) ? false : (seen.add(o.id), true));
  }, [compagnieClients]);

  const filteredCC = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = search.toLowerCase();
    return compagnieClients.filter((cc) => {
      const totalMiles = cc.milesCompagnie.reduce((s, m) => s + m.miles, 0);
      const expDate = cc.milesCompagnie[0] ? new Date(cc.milesCompagnie[0].dateExpiration) : null;

      if (q && ![cc.identifiant, cc.numeroCarte, cc.clientBeneficiaire.libelle, cc.fournisseur.libelle]
        .some((v) => v?.toLowerCase().includes(q))) return false;
      if (ccFilters.client      && cc.clientBeneficiaire.id !== ccFilters.client) return false;
      if (ccFilters.fournisseur && cc.fournisseur.id !== ccFilters.fournisseur)   return false;
      if (ccFilters.milesMin    && totalMiles < Number(ccFilters.milesMin))        return false;
      if (ccFilters.milesMax    && totalMiles > Number(ccFilters.milesMax))        return false;
      if (ccFilters.expirationFrom && expDate && expDate < new Date(ccFilters.expirationFrom)) return false;
      if (ccFilters.expirationTo   && expDate && expDate > new Date(ccFilters.expirationTo))   return false;
      if (ccFilters.hasExpired === 'expired' && (!expDate || expDate >= today)) return false;
      if (ccFilters.hasExpired === 'active'  && (!expDate || expDate < today))  return false;
      return true;
    });
  }, [compagnieClients, ccFilters, search]);

  useEffect(() => {
    dispatch(fetchFournisseurs());
    dispatch(fetchClientBeneficiaires());
    dispatch(fetchCompagnieClients());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!form.clientBeneficiaireId || !form.fournisseurId) {
      setFormError('Veuillez sélectionner un client bénéficiaire et un fournisseur.'); return;
    }
    const result = await dispatch(createCompagnieClient({
      identifiant: form.identifiant, motDePasse: form.motDePasse, numeroCarte: form.numeroCarte,
      clientBeneficiaireId: form.clientBeneficiaireId, fournisseurId: form.fournisseurId,
      miles: form.miles > 0 ? [{ miles: Number(form.miles), dateExpiration: new Date(form.dateExpiration).toISOString() }] : [],
    }));
    if (createCompagnieClient.fulfilled.match(result)) { setForm(emptyForm); setShowCreate(false); }
    else setFormError(result.payload as string);
  };

  const handleOpenAddMiles = (cc: CompagnieClient) => {
    setSelectedCC(cc); setMilesForm({ miles: 0, dateExpiration: '' });
    setMilesError(null); setShowAddMiles(true);
  };

  const handleSubmitAddMiles = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCC) return;
    const result = await dispatch(addMilesCompagnie({
      miles: Number(milesForm.miles),
      dateExpiration: new Date(milesForm.dateExpiration).toISOString(),
      compagnieClientId: selectedCC.id,
    }));
    if (addMilesCompagnie.fulfilled.match(result)) { setShowAddMiles(false); setSelectedCC(null); }
    else setMilesError(result.payload as string);
  };

  const handleOpenUpdateMiles = (cc: CompagnieClient) => {
    setSelectedCC(cc);
    setUpdateMilesValue(cc.milesCompagnie.reduce((s, m) => s + m.miles, 0));
    setMilesError(null); setShowUpdateMiles(true);
  };

  const handleSubmitUpdateMiles = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCC || selectedCC.milesCompagnie.length === 0) return;
    const milesId = selectedCC.milesCompagnie[0].id;
    const result = await dispatch(updateMilesCompagnie({ id: milesId, miles: updateMilesValue }));
    if (updateMilesCompagnie.fulfilled.match(result)) { setShowUpdateMiles(false); setSelectedCC(null); }
    else setMilesError(result.payload as string);
  };

  if (loadingBenef || loadingFourn || loadingCC) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiLoader className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans text-slate-900 h-full overflow-hidden">

      {/* ── Zone fixe : header ── */}
      <div className="bg-white p-5 shrink-0 px-8 pt-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Miles Compagnie</h2>
              <p className="text-gray-500 font-medium italic text-sm">Gestion des comptes miles par fournisseur.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSearch(true)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-6 py-4 rounded-2xl font-black transition-all shadow-sm flex items-center gap-3 text-sm">
              <FiSearch size={18} className="text-indigo-500" /> Consulter Miles Client
            </button>
            <button onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 text-sm">
              <FiPlus size={20} /> Nouveau Miles Compagnie
            </button>
          </div>
        </div>
      </div>

      {/* ── Zone scrollable : filtres + tableau unifiés ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

          {/* ── Ligne 1 : barre de filtres dropdown ── */}
          <div className="flex items-stretch flex-wrap border-b border-gray-100">

            <FilterCell label="Client bénéficiaire">
              <select value={ccFilters.client} onChange={(e) => setFilter('client', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer">
                <option value="">Tous</option>
                {clientOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </FilterCell>

            <FilterCell label="Fournisseur">
              <select value={ccFilters.fournisseur} onChange={(e) => setFilter('fournisseur', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer">
                <option value="">Tous</option>
                {fournisseurOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </FilterCell>

            <FilterCell label="Validité miles">
              <select value={ccFilters.hasExpired} onChange={(e) => setFilter('hasExpired', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer">
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="expired">Expirés</option>
              </select>
            </FilterCell>

            <FilterCell label="Miles min">
              <input type="number" min={0} placeholder="ex. 1000"
                value={ccFilters.milesMin} onChange={(e) => setFilter('milesMin', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent w-24 placeholder-gray-300" />
            </FilterCell>

            <FilterCell label="Miles max">
              <input type="number" min={0} placeholder="ex. 50000"
                value={ccFilters.milesMax} onChange={(e) => setFilter('milesMax', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent w-24 placeholder-gray-300" />
            </FilterCell>

            <FilterCell label="Expiration du">
              <input type="date" value={ccFilters.expirationFrom}
                onChange={(e) => setFilter('expirationFrom', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer" />
            </FilterCell>

            <FilterCell label="Expiration au" last>
              <input type="date" value={ccFilters.expirationTo}
                onChange={(e) => setFilter('expirationTo', e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer" />
            </FilterCell>

            {/* Search + compteur — poussés à droite */}
            <div className="ml-auto flex items-center gap-2 px-4 py-2 border-l border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <FiSearch size={14} className="text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="text-sm bg-transparent outline-none text-gray-700 w-36 placeholder-gray-400" />
                {search && (
                  <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Ligne 2 : badges actifs + compteur + reset ── */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/60 border-b border-gray-100 flex-wrap min-h-[40px]">

            {ccFilters.client && (
              <ActiveFilterBadge
                label={clientOptions.find((o) => o.id === ccFilters.client)?.label ?? ''}
                onRemove={() => setFilter('client', '')} />
            )}
            {ccFilters.fournisseur && (
              <ActiveFilterBadge
                label={fournisseurOptions.find((o) => o.id === ccFilters.fournisseur)?.label ?? ''}
                onRemove={() => setFilter('fournisseur', '')} />
            )}
            {ccFilters.hasExpired && (
              <ActiveFilterBadge color="red"
                label={ccFilters.hasExpired === 'expired' ? 'Expirés uniquement' : 'Actifs uniquement'}
                onRemove={() => setFilter('hasExpired', '')} />
            )}
            {ccFilters.milesMin && (
              <ActiveFilterBadge color="emerald"
                label={`Miles ≥ ${Number(ccFilters.milesMin).toLocaleString()}`}
                onRemove={() => setFilter('milesMin', '')} />
            )}
            {ccFilters.milesMax && (
              <ActiveFilterBadge color="emerald"
                label={`Miles ≤ ${Number(ccFilters.milesMax).toLocaleString()}`}
                onRemove={() => setFilter('milesMax', '')} />
            )}
            {ccFilters.expirationFrom && (
              <ActiveFilterBadge color="amber"
                label={`Exp. après ${new Date(ccFilters.expirationFrom).toLocaleDateString('fr-FR')}`}
                onRemove={() => setFilter('expirationFrom', '')} />
            )}
            {ccFilters.expirationTo && (
              <ActiveFilterBadge color="amber"
                label={`Exp. avant ${new Date(ccFilters.expirationTo).toLocaleDateString('fr-FR')}`}
                onRemove={() => setFilter('expirationTo', '')} />
            )}
            {search && (
              <ActiveFilterBadge label={`Recherche: ${search}`} onRemove={() => setSearch('')} />
            )}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-400 font-medium">
                {filteredCC.length} / {compagnieClients.length} résultat(s)
              </span>
              {activeCount > 0 && (
                <button onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-black text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl transition-all">
                  <FiX size={11} /> Réinitialiser ({activeCount})
                </button>
              )}
            </div>
          </div>

          {/* ── Tableau ── */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-blue-800 uppercase text-[10px] font-black text-white tracking-widest">
                <tr>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Identifiant</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">N° Carte</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Mot de passe</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Client Bénéficiaire</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Compagnie</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Miles</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Expiration</th>
                  <th className="px-6 py-5 text-left whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredCC.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 italic text-sm">
                      {compagnieClients.length === 0 ? 'Aucun miles compagnie enregistré.' : 'Aucun résultat pour ces filtres.'}
                    </td>
                  </tr>
                ) : (
                  filteredCC.map((cc) => (
                    <tr key={cc.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-800">{cc.identifiant}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-[10px] font-mono font-black bg-gray-50 text-indigo-500 px-3 py-1.5 rounded-lg border border-gray-100">
                          <FiCreditCard size={12} /> {cc.numeroCarte}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-[10px] font-mono font-black bg-gray-50 text-indigo-500 px-3 py-1.5 rounded-lg border border-gray-100">
                          <FiCreditCard size={12} /> {cc.motDePasse}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <FiUserCheck size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{cc.clientBeneficiaire.libelle}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{cc.clientBeneficiaire.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <FiTruck size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 uppercase">{cc.fournisseur.libelle}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{cc.fournisseur.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cc.milesCompagnie.length > 0 ? (
                          <div className="group flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-md text-[11px] font-bold">
                              <FiAward size={12} className="text-emerald-500" />
                              <span>{cc.milesCompagnie[0].miles.toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => handleOpenUpdateMiles(cc)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all duration-200"
                              title="Modifier"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {cc.milesCompagnie.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-gray-600 font-medium">
                              {new Date(cc.milesCompagnie[0].dateExpiration).toLocaleDateString('fr-FR')}
                            </span>
                            {cc.milesCompagnie.length > 1 && (
                              <button
                                onClick={() => setShowHistorique(cc)}
                                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-500 hover:text-indigo-700 hover:underline w-fit"
                              >
                                <FiArrowDownCircle size={10} />
                                Historique
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleOpenAddMiles(cc)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-black transition-all border border-blue-100 w-fit">
                          <FiPlus size={12} /> Ajouter
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCreate && (
        <ModalCreateCompagnie
          form={form} formError={formError} loading={loadingCC}
          fournisseurs={fournisseurs} beneficiaires={beneficiaires}
          onChange={handleChange} onSubmit={handleSubmitCreate}
          onClose={() => { setShowCreate(false); setForm(emptyForm); setFormError(null); }}
        />
      )}
      {showAddMiles && selectedCC && (
        <ModalAddMiles
          selectedCC={selectedCC} milesForm={milesForm}
          milesError={milesError} loading={loadingCC}
          onChange={(field, value) => setMilesForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmitAddMiles}
          onClose={() => { setShowAddMiles(false); setSelectedCC(null); setMilesError(null); }}
        />
      )}
      {showUpdateMiles && selectedCC && (
        <ModalUpdateMiles
          selectedCC={selectedCC} miles={updateMilesValue}
          error={milesError} loading={loadingCC}
          onChange={setUpdateMilesValue}
          onSubmit={handleSubmitUpdateMiles}
          onClose={() => { setShowUpdateMiles(false); setSelectedCC(null); setMilesError(null); }}
        />
      )}
      {showSearch && (
        <ModalSearchBenef
          beneficiaires={beneficiaires}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showHistorique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Historique des Miles</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {showHistorique.clientBeneficiaire.libelle} — {showHistorique.fournisseur.libelle}
                </p>
              </div>
              <button
                onClick={() => setShowHistorique(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto flex flex-col gap-3">
              {showHistorique.milesCompagnie.map((m, index) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                      <FiAward size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {m.miles.toLocaleString()} miles
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Exp. {new Date(m.dateExpiration).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      Dernier
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 text-right">
              <button
                onClick={() => setShowHistorique(null)}
                className="text-sm font-black text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageMilesCompagnie;