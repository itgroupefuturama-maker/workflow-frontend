import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFournisseurs } from '../../app/back_office/fournisseursSlice';
import { fetchVisaConsultats } from '../../app/front_office/parametre_visa/visaConsultatSlice';
import type { RootState, AppDispatch } from '../../app/store';
import {
  FiArrowLeft, FiSearch, FiTag, FiTruck, FiMapPin, FiLoader, FiInbox,
} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

/* ---------------------------------------------------------------------- */
/*  Présentation — page de consultation seule, sans action côté frontend  */
/* ---------------------------------------------------------------------- */

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { dot: string; text: string; bg: string; label: string }> = {
    ACTIF: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Actif' },
    CREER: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Créé' },
  };
  const style = map[status] ?? { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="py-14 flex flex-col items-center justify-center gap-2 text-center">
    <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
      <FiInbox size={16} />
    </div>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
);

const LoadingState = () => (
  <div className="py-14 flex flex-col items-center justify-center gap-2.5">
    <FiLoader className="animate-spin text-slate-300" size={20} />
    <p className="text-xs text-slate-400">Chargement…</p>
  </div>
);

type TabId = 'fournisseurs' | 'consulats';

/* ---------------------------------------------------------------------- */

const FournisseurPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: fournisseurs, loading } = useSelector((s: RootState) => s.fournisseurs);
  const visaConsultats = useSelector((s: RootState) => s.visaConsultat);

  const [activeTab, setActiveTab] = useState<TabId>('fournisseurs');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchFournisseurs());
    dispatch(fetchVisaConsultats());
  }, [dispatch]);

  // Recherche remise à zéro au changement d'onglet — chaque liste a son propre filtre.
  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearch('');
  };

  const filteredFournisseurs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter(
      (f) => f.libelle.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    );
  }, [fournisseurs, search]);

  const filteredConsultats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visaConsultats.data;
    return visaConsultats.data.filter(
      (c) => c.nom.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [visaConsultats.data, search]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'fournisseurs', label: 'Fournisseurs', count: fournisseurs.length },
    { id: 'consulats', label: 'Consulats visa', count: visaConsultats.data.length },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-slate-400 text-xs mt-0.5">Consultation du répertoire des prestataires et des consulats visa</p>
        </div>
      </div>

      {/* CARTE À ONGLETS */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Barre d'onglets */}
        <div className="flex items-center gap-1 px-4 bg-white border-b border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-semibold transition-colors ${
                  isActive ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-blue-600" />}
              </button>
            );
          })}
        </div>

        {/* Recherche contextuelle à l'onglet actif */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'fournisseurs' ? 'Rechercher un fournisseur...' : 'Rechercher un consulat...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all text-[12px]"
            />
          </div>
        </div>

        {/* ── Onglet Fournisseurs ── */}
        {activeTab === 'fournisseurs' && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Code</th>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Fournisseur</th>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Prestations</th>
                    <th className="px-6 py-3 text-center whitespace-nowrap">Date d'application</th>
                    <th className="px-6 py-3 text-center whitespace-nowrap">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFournisseurs.map((fourn) => (
                    <tr key={fourn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                          <FiTag size={12} /> {fourn.code}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FiTruck size={16} />
                          </div>
                          <span className="text-slate-800 font-medium text-sm">{fourn.libelle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {fourn.transactions && fourn.transactions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {fourn.transactions.map((t) => (
                              <span key={t.id} className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                {t.module?.nom || 'Module inconnu'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-slate-300 text-xs">Aucune prestation associée</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-center text-xs text-slate-500">
                        {new Date(fourn.dateApplication).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge status={fourn.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading && <LoadingState />}
            {!loading && filteredFournisseurs.length === 0 && (
              <EmptyState label={search ? 'Aucun fournisseur ne correspond à cette recherche.' : 'Aucun fournisseur enregistré.'} />
            )}
          </>
        )}

        {/* ── Onglet Consulats visa ── */}
        {activeTab === 'consulats' && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Code</th>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Consulat</th>
                    <th className="px-6 py-3 text-left whitespace-nowrap">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsultats.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                          <FiTag size={12} /> {item.code}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FiMapPin size={16} />
                          </div>
                          <span className="text-slate-800 font-medium text-sm capitalize">{item.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visaConsultats.loading && <LoadingState />}
            {!visaConsultats.loading && filteredConsultats.length === 0 && (
              <EmptyState label={search ? 'Aucun consulat ne correspond à cette recherche.' : 'Aucun consulat enregistré.'} />
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default FournisseurPage;