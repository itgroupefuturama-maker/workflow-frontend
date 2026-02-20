import React from 'react';
import TabContainer from '../../../../../layouts/TabContainer';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiTrendingUp,
  FiFileText,
  FiMapPin,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiPercent,
  FiBarChart2,
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFournisseurs } from '../../../../../app/back_office/fournisseursSlice';
import { fetchEtatVente } from '../../../../../app/front_office/etatVenteSlice';
import { fetchEtatAnnulation } from '../../../../../app/front_office/etatAnnulationSlice';
import { fetchEtatMensuelDestination } from '../../../../../app/front_office/etatMensuelDestinationSlice';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ── Composant placeholder pour données manquantes ──────────────────────────────
const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <FiBarChart2 size={32} className="text-gray-200" />
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon size={16} className="text-gray-500" />
      </div>
      {sub && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sub}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">
      {loading ? (
        <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
      ) : (
        value
      )}
    </p>
    <p className="text-xs text-gray-400 font-medium">{label}</p>
  </div>
);

const AccueilViewHotel = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'dashboard');
  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2026-12-31');
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  const { data: fournisseurs, loading: fournisseursLoading } = useSelector((state: RootState) => state.fournisseurs);
  const { data: etatVenteData, loading: etatVenteLoading, error: etatVenteError } = useSelector((state: RootState) => state.etatVente);
  const { data: etatAnnulationData, loading: etatAnnulationLoading, error: etatAnnulationError } = useSelector((state: RootState) => state.etatAnnulation);
  const { data: etatMensuelDestData, loading: etatMensuelDestLoading, error: etatMensuelDestError } = useSelector((state: RootState) => state.etatMensuelDestination);
  const { items: pays, loading: paysLoading } = useSelector((state: RootState) => state.pays);

  const allDestinations = pays.flatMap((p) =>
    p.DestinationVoyage.map((dest) => ({ id: dest.id, code: dest.code, nom: dest.ville, pays: p.pays }))
  );

  const isLoading = etatVenteLoading || etatAnnulationLoading || etatMensuelDestLoading;
  const hasError = etatVenteError || etatAnnulationError || etatMensuelDestError;

  const dossiers2026 = Array.isArray(etatVenteData?.jours)
    ? etatVenteData.jours.reduce((acc, jour) => acc + (Array.isArray(jour?.lignes) ? jour.lignes.length : 0), 0)
    : 0;
  const annulationsTotal = etatAnnulationData?.totalGeneral || 0;
  const tauxAnnulation = dossiers2026 > 0 ? ((annulationsTotal / dossiers2026) * 100).toFixed(1) : 'N/A';

  useEffect(() => {
    if (location.state?.targetTab) setActiveTab(location.state.targetTab);
  }, [location.state?.targetTab]);

  useEffect(() => { dispatch(fetchFournisseurs()); }, [dispatch]);

  useEffect(() => {
    if (pays.length === 0) dispatch(fetchPays());
  }, [dispatch, pays.length]);

  const handleFiltrer = () => {
    if (!selectedFournisseurId) { alert('Veuillez sélectionner un fournisseur'); return; }
    const params = { dateDebut, dateFin, fournisseurId: selectedFournisseurId };
    dispatch(fetchEtatVente(params));
    dispatch(fetchEtatAnnulation(params));
    dispatch(fetchEtatMensuelDestination(selectedDestinationId));
  };

  const tabs = [
    { id: 'dashboard', label: <span className="flex items-center gap-2"><FiTrendingUp size={14} /> Tableau de bord</span> },
    { id: 'etat',      label: <span className="flex items-center gap-2"><FiFileText size={14} /> État des ventes</span> },
  ];

  const dataCurrent = [
    { name: 'Paris', dossiers: 45, annulations: 5 },
    { name: 'Dakar',  dossiers: 30, annulations: 2 },
    { name: 'Tunis',  dossiers: 25, annulations: 8 },
  ];
  const dataPrev = [
    { name: 'Paris', dossiers: 38, annulations: 4 },
    { name: 'Dakar',  dossiers: 32, annulations: 5 },
    { name: 'Tunis',  dossiers: 18, annulations: 2 },
  ];

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* ══════════════════════════════════════════════════════════
          ONGLET DASHBOARD
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tableau de bord</h2>
              <p className="text-sm text-gray-400 mt-0.5">Analyse comparative des performances par destination</p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
              Période : 2025 — 2026
            </span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Dossiers actifs"    value={dossiers2026}     sub="2026"  icon={FiFileText}    loading={etatVenteLoading} />
            <KpiCard label="Croissance annuelle" value="N/A"             sub="vs 2025" icon={FiTrendingUp} />
            <KpiCard label="Annulations"         value={annulationsTotal} sub="2026"  icon={FiAlertCircle} loading={etatAnnulationLoading} />
            <KpiCard label="Taux d'annulation"   value={tauxAnnulation === 'N/A' ? 'N/A' : `${tauxAnnulation}%`} sub="Taux" icon={FiPercent} />
          </div>

          {/* Charts — placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Année en cours</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Janvier — Décembre 2026</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                  En cours
                </span>
              </div>
              <EmptyChart label="Les données s'afficheront ici après filtrage" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Année précédente</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Janvier — Décembre 2025</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">2025</span>
              </div>
              <EmptyChart label="Données historiques non disponibles" />
            </div>
          </div>

          {/* Tableau comparatif */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FiMapPin size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Comparaison par destination</h3>
              <span className="ml-auto text-xs text-gray-400 italic">Données indicatives</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Destination', '2025', '2026', 'Évolution', 'Annulations 2026'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-center'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dataCurrent.map((current, idx) => {
                    const prev = dataPrev[idx];
                    const evolution = ((current.dossiers - prev.dossiers) / prev.dossiers * 100).toFixed(1);
                    const isPositive = parseFloat(evolution) >= 0;
                    return (
                      <tr key={current.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-800">{current.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-gray-500">{prev.dossiers}</td>
                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-gray-900">{current.dossiers}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {isPositive ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
                            {evolution}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
                            {current.annulations}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET ÉTAT DES VENTES
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'etat' && (
        <div className="space-y-6">

          {/* ── Filtres ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Filtres de recherche</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Fournisseur</label>
                <select
                  value={selectedFournisseurId}
                  onChange={(e) => setSelectedFournisseurId(e.target.value)}
                  disabled={fournisseursLoading}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Destination</label>
                <select
                  value={selectedDestinationId || ''}
                  onChange={(e) => setSelectedDestinationId(e.target.value || null)}
                  disabled={paysLoading || allDestinations.length === 0}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                >
                  <option value="">Toutes les destinations</option>
                  {allDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>{dest.code} - {dest.nom} ({dest.pays})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleFiltrer}
                disabled={isLoading || !selectedFournisseurId}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Chargement...' : 'Filtrer les données'}
              </button>
            </div>
          </div>

          {/* Erreur */}
          {hasError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              {etatVenteError || etatAnnulationError}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Chargement des données...</p>
              </div>
            </div>
          )}

          {/* Placeholder initial */}
          {!isLoading && !etatVenteData && !hasError && (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
              <FiBarChart2 size={36} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">Aucune donnée à afficher</p>
              <p className="text-xs text-gray-300 mt-1">Sélectionnez un fournisseur et cliquez sur Filtrer</p>
            </div>
          )}

          {/* Résultats */}
          {!isLoading && etatVenteData && (
            <div className="space-y-8">

              {/* ── Stats rapides ventes ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Chiffre d'affaires total", value: `${(etatVenteData.totalGeneral.tarifsTTC / 100).toLocaleString('fr-FR')} Ar` },
                  { label: 'Commissions totales',      value: `${(etatVenteData.totalGeneral.commissions / 100).toLocaleString('fr-FR')} Ar` },
                  { label: 'Nombre de lignes',         value: etatVenteData?.jours?.reduce?.((sum, j) => sum + (j?.lignes?.length ?? 0), 0) ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* ── Tableau État des ventes ── */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">État des ventes</p>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Date', 'Itinéraire', 'Compagnie', 'Tarifs Machine', 'Commissions', 'Tarifs TTC'].map((h, i) => (
                            <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 3 ? 'text-right' : 'text-left'}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {etatVenteData?.jours && Array.isArray(etatVenteData.jours) ? (
                          etatVenteData.jours.map((jour) => (
                            <React.Fragment key={jour?.date || Math.random()}>
                              {jour?.lignes?.map((ligne, idx) => (
                                <tr key={ligne?.id || idx} className="hover:bg-gray-50 transition-colors">
                                  {idx === 0 && (
                                    <td rowSpan={jour.lignes.length + 1} className="px-5 py-3 text-sm font-medium text-gray-700 border-r border-gray-100 whitespace-nowrap">
                                      {jour.date ? new Date(jour.date).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                  )}
                                  <td className="px-5 py-3 text-sm text-gray-600">{ligne?.itineraire || '—'}</td>
                                  <td className="px-5 py-3 text-sm text-gray-600">{ligne?.compagnie || '—'}</td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-900">{(ligne?.tarifsMachine / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-900">{(ligne?.commissions / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                  <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{(ligne?.tarifsTTC / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                </tr>
                              ))}
                              {/* Total journée */}
                              <tr className="bg-gray-50">
                                <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total journée</td>
                                <td className="px-5 py-2.5 text-right text-xs font-semibold text-gray-700">{(jour?.total?.tarifsMachine / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                <td className="px-5 py-2.5 text-right text-xs font-semibold text-gray-700">{(jour?.total?.commissions / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                <td className="px-5 py-2.5 text-right text-xs font-semibold text-gray-700">{(jour?.total?.tarifsTTC / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                              </tr>
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400 italic">
                              Aucune donnée disponible
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Tableau Annulations ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">État des annulations</p>
                  <span className="text-sm font-bold text-gray-900">
                    Total : {etatAnnulationData?.totalGeneral || 0} annulation{(etatAnnulationData?.totalGeneral || 0) > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Mois', 'Date', 'Compagnie', 'Itinéraire', 'N° Dossier', 'N° Billet'].map((h) => (
                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {etatAnnulationData?.mois.map((mois) => (
                          <React.Fragment key={mois.mois}>
                            {mois.jours.map((jour) => (
                              <React.Fragment key={jour.date}>
                                {jour.lignes.map((ligne, idx) => (
                                  <tr key={ligne.id} className="hover:bg-gray-50 transition-colors">
                                    {idx === 0 && jour.lignes.length > 0 && (
                                      <td
                                        rowSpan={mois.jours.reduce((sum, j) => sum + j.lignes.length, 0)}
                                        className="px-5 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 bg-gray-50/50 whitespace-nowrap"
                                      >
                                        {mois.mois}
                                        <span className="block text-xs text-gray-400 font-normal mt-0.5">
                                          {mois.totalMois} annulation{mois.totalMois > 1 ? 's' : ''}
                                        </span>
                                      </td>
                                    )}
                                    {idx === 0 && (
                                      <td rowSpan={jour.lignes.length} className="px-5 py-3 text-sm text-gray-600 border-r border-gray-100 whitespace-nowrap">
                                        {new Date(jour.date).toLocaleDateString('fr-FR')}
                                      </td>
                                    )}
                                    <td className="px-5 py-3 text-sm text-gray-600">{ligne.compagnie}</td>
                                    <td className="px-5 py-3 text-sm text-gray-600">{ligne.itineraire}</td>
                                    <td className="px-5 py-3 text-sm font-mono text-gray-600">{ligne.numeroDossierCommun}</td>
                                    <td className="px-5 py-3 text-sm font-mono text-gray-600">{ligne.numeroDossierBillet}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}
                        {/* Total général */}
                        <tr className="bg-gray-900">
                          <td colSpan={5} className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wide">
                            Total annulations
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-white">
                            {etatAnnulationData?.totalGeneral || 0}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── État mensuel par destination ── */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  État mensuel par destination
                  {selectedDestinationId && allDestinations.find((d) => d.id === selectedDestinationId) && (
                    <span className="normal-case ml-2 text-gray-600 font-medium">
                      — {allDestinations.find((d) => d.id === selectedDestinationId)?.nom}
                    </span>
                  )}
                </p>

                {etatMensuelDestData?.destinations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-white border border-gray-200 rounded-xl">
                    <FiBarChart2 size={28} className="text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Aucune donnée pour cette sélection</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Code', 'Destination', 'Année', 'Total', '% Total'].map((h, i) => (
                              <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 3 ? 'text-right' : 'text-left'}`}>
                                {h}
                              </th>
                            ))}
                            {etatMensuelDestData?.companies?.map((comp) => (
                              <React.Fragment key={comp}>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-100">{comp}</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">%</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {etatMensuelDestData?.destinations.map((dest) => (
                            <React.Fragment key={dest.code}>
                              {dest.annees.map((annee, idx) => (
                                <tr key={`${dest.code}-${annee.annee}`} className="hover:bg-gray-50 transition-colors">
                                  {idx === 0 && (
                                    <>
                                      <td rowSpan={dest.annees.length} className="px-5 py-3 text-sm font-mono font-semibold text-gray-700 border-r border-gray-100">{dest.code}</td>
                                      <td rowSpan={dest.annees.length} className="px-5 py-3 text-sm font-medium text-gray-700 border-r border-gray-100">{dest.nom}</td>
                                    </>
                                  )}
                                  <td className="px-5 py-3 text-center text-sm text-gray-500">{annee.annee}</td>
                                  <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{(annee.total / 100).toLocaleString('fr-FR')} Ar</td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-500">{annee.pourcentageTotal.toFixed(1)}%</td>
                                  {etatMensuelDestData?.companies?.map((comp) => (
                                    <React.Fragment key={comp}>
                                      <td className="px-5 py-3 text-right text-sm text-gray-700 border-l border-gray-100">{(annee.companies[comp] / 100 || 0).toLocaleString('fr-FR')} Ar</td>
                                      <td className="px-5 py-3 text-right text-sm text-gray-400">{annee.pourcentages[comp]?.toFixed(1) || 0}%</td>
                                    </React.Fragment>
                                  ))}
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </TabContainer>
  );
};

export default AccueilViewHotel;