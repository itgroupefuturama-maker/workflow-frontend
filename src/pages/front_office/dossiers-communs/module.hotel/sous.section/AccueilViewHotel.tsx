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
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFournisseurs } from '../../../../../app/back_office/fournisseursSlice';
import { fetchEtatVente } from '../../../../../app/front_office/etatVenteSlice';
import { fetchEtatAnnulation } from '../../../../../app/front_office/etatAnnulationSlice';
import { fetchEtatMensuelDestination } from '../../../../../app/front_office/etatMensuelDestinationSlice';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const AccueilViewHotel = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'dashboard');
  const { data: fournisseurs, loading: fournisseursLoading } = useSelector((state: RootState) => state.fournisseurs);
  const {
    data: etatVenteData,
    loading: etatVenteLoading,
    error: etatVenteError,
  } = useSelector((state: RootState) => state.etatVente);

  const {
    data: etatAnnulationData,
    loading: etatAnnulationLoading,
    error: etatAnnulationError,
  } = useSelector((state: RootState) => state.etatAnnulation);

  const {
    data: etatMensuelDestData,
    loading: etatMensuelDestLoading,
    error: etatMensuelDestError,
  } = useSelector((state: RootState) => state.etatMensuelDestination);

  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null); // null = toutes

  const { items: pays, loading: paysLoading } = useSelector((state: RootState) => state.pays);

  const allDestinations = pays.flatMap(pays =>
    pays.DestinationVoyage.map(dest => ({
      id: dest.id,
      code: dest.code,
      nom: dest.ville,           // ou dest.nom si tu as ce champ
      pays: pays.pays,
    }))
  );

  useEffect(() => {
    if (location.state?.targetTab) {
      setActiveTab(location.state.targetTab);
    }
  }, [location.state?.targetTab]);

  useEffect(() => {
    dispatch(fetchFournisseurs());
  }, [dispatch]);

  useEffect(() => {
    if (pays.length === 0) {
      dispatch(fetchPays());
    }
  }, [dispatch, pays.length]);


  const handleFiltrer = () => {
    if (!selectedFournisseurId) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }

    const venteParams = { dateDebut, dateFin, fournisseurId: selectedFournisseurId };
    dispatch(fetchEtatVente(venteParams));
    dispatch(fetchEtatAnnulation(venteParams));

    // Pour les destinations : on n'envoie ni date ni fournisseur
    dispatch(fetchEtatMensuelDestination(selectedDestinationId));
  };

  // Mise à jour isLoading et hasError
  const isLoading = etatVenteLoading || etatAnnulationLoading || etatMensuelDestLoading;
  const hasError = etatVenteError || etatAnnulationError || etatMensuelDestError;

  const tabs = [
    { id: 'dashboard', label: <span className="flex items-center gap-2"><FiTrendingUp /> Tableau de bord</span> },
    { id: 'etat', label: <span className="flex items-center gap-2"><FiFileText /> État des ventes</span> }
  ];

  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2026-12-31');
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');

  // Données Statiques
  const dataCurrent = [
    { name: 'Paris', dossiers: 45, annulations: 5 },
    { name: 'Dakar', dossiers: 30, annulations: 2 },
    { name: 'Tunis', dossiers: 25, annulations: 8 },
  ];

  const dataPrev = [
    { name: 'Paris', dossiers: 38, annulations: 4 },
    { name: 'Dakar', dossiers: 32, annulations: 5 },
    { name: 'Tunis', dossiers: 18, annulations: 2 },
  ];

  // Calculs dynamiques pour le dashboard
  const dossiers2026 = Array.isArray(etatVenteData?.jours)
  ? etatVenteData.jours.reduce((acc, jour) => acc + (Array.isArray(jour?.lignes) ? jour.lignes.length : 0), 0)
  : 0;

  const annulationsTotal = etatAnnulationData?.totalGeneral || 0;

  const tauxAnnulation = dossiers2026 > 0 
    ? ((annulationsTotal / dossiers2026) * 100).toFixed(1) 
    : "0.0";

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Tableau de bord
              </h2> */}
              <p className="text-slate-600">Analyse comparative des performances par destination</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Période :</span>
              <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold">
                2025 - 2026
              </span>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dossiers année en cours */}
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiFileText size={24} />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">2026</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {etatVenteLoading ? '...' : dossiers2026}
              </div>
              <div className="text-blue-100 text-sm">Dossiers actifs</div>
            </div>

            {/* Croissance - temporairement désactivée ou N/A */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiArrowUp size={24} />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">vs 2025</span>
              </div>
              <div className="text-3xl font-bold mb-1">N/A</div> {/* À activer quand on aura 2025 */}
              <div className="text-emerald-100 text-sm">Croissance annuelle</div>
            </div>

            {/* Annulations */}
            <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiAlertCircle size={24} />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">2026</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {etatAnnulationLoading ? '...' : annulationsTotal}
              </div>
              <div className="text-red-100 text-sm">Annulations</div>
            </div>

            {/* Taux d'annulation */}
            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiPercent size={24} />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Taux</span>
              </div>
              <div className="text-3xl font-bold mb-1">{tauxAnnulation}%</div>
              <div className="text-amber-100 text-sm">Taux d'annulation</div>
            </div>
          </div>


          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Année en cours */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Année en cours
                    </h3>
                    <p className="text-sm text-slate-600">Janvier - Décembre 2026</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    En cours
                  </span>
                </div>
              </div>
              <div className="p-6">
                {/* <div className="h-80 w-full"style={{ minHeight: '320px'}}>
                  {isMounted && dataCurrent && dataCurrent.length > 0 ? (
                    <ResponsiveContainer width="100%" aspect={2}>
                      <BarChart data={dataCurrent}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}} 
                          contentStyle={{
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                          }} 
                        />
                        <Legend 
                          iconType="circle"
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="dossiers" 
                          fill="#3b82f6" 
                          name="Dossiers" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                        <Bar 
                          dataKey="annulations" 
                          fill="#ef4444" 
                          name="Annulations" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Chargement des données...
                    </div>
                  )}
                </div> */}
              </div>
            </div>

            {/* Année N-1 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Année précédente
                    </h3>
                    <p className="text-sm text-slate-600">Janvier - Décembre 2025</p>
                  </div>
                  <FiAlertCircle className="text-slate-400" size={20} />
                </div>
              </div>
              <div className="p-6">
                {/* <div className="h-80 w-full" style={{ minHeight: '320px' }}>
                  {isMounted && dataPrev && dataPrev.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataPrev}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}} 
                          contentStyle={{
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                          }} 
                        />
                        <Legend 
                          iconType="circle"
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="dossiers" 
                          fill="#94a3b8" 
                          name="Dossiers" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                        <Bar 
                          dataKey="annulations" 
                          fill="#fca5a5" 
                          name="Annulations" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Chargement des données...
                    </div>
                  )}
                </div> */}
              </div>
            </div>
          </div>

          {/* TABLEAU COMPARATIF */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FiMapPin className="text-indigo-600" />
                Comparaison par destination
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      2025
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      2026
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Évolution
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Annulations 2026
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataCurrent.map((current, idx) => {
                    const prev = dataPrev[idx];
                    const evolution = ((current.dossiers - prev.dossiers) / prev.dossiers * 100).toFixed(1);
                    const isPositive = parseFloat(evolution) >= 0;

                    return (
                      <tr key={current.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-slate-900">{current.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-slate-600">{prev.dossiers}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-slate-900">{current.dossiers}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isPositive 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isPositive ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                            {evolution}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
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
      ) : (
        /* --- ONGLET ÉTAT DES VENTES --- */
        <div className="space-y-8">
          {/* Filtres */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres de recherche</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                <input 
                  type="date" 
                  value={dateDebut} 
                  onChange={(e) => setDateDebut(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                <input 
                  type="date" 
                  value={dateFin} 
                  onChange={(e) => setDateFin(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
                <select
                  value={selectedFournisseurId}
                  onChange={(e) => setSelectedFournisseurId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={fournisseursLoading}
                >
                  <option value="">Sélectionner...</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.libelle} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFiltrer}
                  disabled={isLoading || !selectedFournisseurId}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Chargement...' : 'Filtrer'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Destination</label>
            <select
              value={selectedDestinationId || ''}
              onChange={(e) => setSelectedDestinationId(e.target.value || null)}
              className="w-full border rounded px-3 py-2"
              disabled={paysLoading || allDestinations.length === 0}
            >
              <option value="">Toutes les destinations</option>
              {allDestinations.map(dest => (
                <option key={dest.id} value={dest.id}>
                  {dest.code} - {dest.nom} ({dest.pays})
                </option>
              ))}
            </select>
          </div>

          {hasError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
              {etatVenteError || etatAnnulationError}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-16 text-gray-500">Chargement des données...</div>
          )}

          {!isLoading && etatVenteData && (
            <div className="space-y-8">

              {/* ------------------ ÉTAT DES VENTES ------------------ */}
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-900">État des ventes</h3>

                {/* Stats rapides ventes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 p-5 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Chiffre d'affaires total</div>
                    <div className="text-2xl font-semibold text-gray-900">{(etatVenteData.totalGeneral.tarifsTTC / 100).toLocaleString('fr-FR')} Ar</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Commissions totales</div>
                    <div className="text-2xl font-semibold text-gray-900">{(etatVenteData.totalGeneral.commissions / 100).toLocaleString('fr-FR')} Ar</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nombre de lignes</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {etatVenteData?.jours?.reduce?.((sum, j) => sum + (j?.lignes?.length ?? 0), 0) ?? 0}
                    </div>
                  </div>
                </div>

                {/* Tableau ventes */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Itinéraire</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Compagnie</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tarifs Machine</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Commissions</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tarifs TTC</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                       {etatVenteData?.jours && Array.isArray(etatVenteData.jours) ? (
                        etatVenteData.jours.map((jour) => (
                          <React.Fragment key={jour?.date || Math.random()}>
                            {jour?.lignes && Array.isArray(jour.lignes) ? (
                              jour.lignes.map((ligne, idx) => (
                                <tr key={ligne?.id || `${jour.date}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                  {idx === 0 && (
                                    <td
                                      rowSpan={jour.lignes.length + 1}
                                      className="px-5 py-3 font-medium text-gray-900 text-sm border-r border-gray-100"
                                    >
                                      {jour.date
                                        ? new Date(jour.date).toLocaleDateString('fr-FR')
                                        : '—'}
                                    </td>
                                  )}
                                  <td className="px-5 py-3 text-sm text-gray-700">
                                    {ligne?.itineraire || '—'}
                                  </td>
                                  <td className="px-5 py-3 text-sm text-gray-700">
                                    {ligne?.compagnie || '—'}
                                  </td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-900">
                                    {(ligne?.tarifsMachine / 100 || 0).toLocaleString('fr-FR')} Ar
                                  </td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-900">
                                    {(ligne?.commissions / 100 || 0).toLocaleString('fr-FR')} Ar
                                  </td>
                                  <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">
                                    {(ligne?.tarifsTTC / 100 || 0).toLocaleString('fr-FR')} Ar
                                  </td>
                                </tr>
                              ))
                            ) : null}

                            <tr className="bg-gray-50">
                              <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-900">
                                Total journée
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                                {(jour?.total?.tarifsMachine / 100 || 0).toLocaleString('fr-FR')} Ar
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                                {(jour?.total?.commissions / 100 || 0).toLocaleString('fr-FR')} Ar
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                                {(jour?.total?.tarifsTTC / 100 || 0).toLocaleString('fr-FR')} Ar
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-gray-500 italic">
                            {etatVenteLoading ? 'Chargement des données...' : 'Aucune donnée disponible pour cette période'}
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ------------------ ÉTAT DES ANNULATIONS ------------------ */}
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-900">État des annulations</h3>

                {/* Stat rapide annulations */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg mb-6 inline-block min-w-[300px]">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nombre total d'annulations</div>
                  <div className="text-3xl font-semibold text-gray-900">{etatAnnulationData?.totalGeneral || 0}</div>
                </div>

                {/* Tableau annulations */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mois</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Compagnie</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Itinéraire</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N° Dossier Commun</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N° Billet</th>
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
                                        rowSpan={mois.jours.reduce((sum, j) => sum + j.lignes.length, 0) + mois.jours.length - 1}
                                        className="px-5 py-3 font-medium text-gray-900 bg-gray-50 border-r border-gray-200 text-sm"
                                      >
                                        {mois.mois}
                                        <br />
                                        <span className="text-xs text-gray-500 font-normal">({mois.totalMois} annulations)</span>
                                      </td>
                                    )}
                                    {idx === 0 && (
                                      <td rowSpan={jour.lignes.length} className="px-5 py-3 font-medium text-gray-900 text-sm border-r border-gray-100">
                                        {new Date(jour.date).toLocaleDateString('fr-FR')}
                                      </td>
                                    )}
                                    <td className="px-5 py-3 text-sm text-gray-700">{ligne.compagnie}</td>
                                    <td className="px-5 py-3 text-sm text-gray-700">{ligne.itineraire}</td>
                                    <td className="px-5 py-3 text-sm text-gray-700">{ligne.numeroDossierCommun}</td>
                                    <td className="px-5 py-3 text-sm text-gray-700">{ligne.numeroDossierBillet}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}

                        <tr className="bg-gray-900 text-white">
                          <td colSpan={5} className="px-5 py-4 text-sm font-bold uppercase">Total annulations</td>
                          <td className="px-5 py-4 text-base font-bold">{etatAnnulationData?.totalGeneral || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── NOUVEAU : ÉTAT MENSUEL PAR DESTINATION ──────────────────────── */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              État mensuel des ventes par destination
              {selectedDestinationId && allDestinations.find(d => d.id === selectedDestinationId) && (
                <span className="text-slate-500 text-lg ml-2">
                  — {allDestinations.find(d => d.id === selectedDestinationId)?.nom}
                </span>
              )}
            </h3>

            {etatMensuelDestData?.destinations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border">
                Aucune donnée pour cette période et ce fournisseur
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Destination</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Année</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">% Total</th>
                        {/* Colonnes dynamiques par compagnie */}
                        {etatMensuelDestData?.companies?.map((comp) => (
                          <React.Fragment key={comp}>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-l border-gray-200">{comp}</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">% {comp}</th>
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
                                  <td rowSpan={dest.annees.length} className="px-5 py-3 font-medium text-gray-900 text-sm border-r border-gray-100">
                                    {dest.code}
                                  </td>
                                  <td rowSpan={dest.annees.length} className="px-5 py-3 font-medium text-gray-900 text-sm border-r border-gray-100">
                                    {dest.nom}
                                  </td>
                                </>
                              )}
                              <td className="px-5 py-3 text-center text-sm text-gray-700">{annee.annee}</td>
                              <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">
                                {(annee.total / 100).toLocaleString('fr-FR')} Ar
                              </td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">
                                {annee.pourcentageTotal.toFixed(1)}%
                              </td>
                              {/* Valeurs par compagnie */}
                              {etatMensuelDestData?.companies?.map((comp) => (
                                <React.Fragment key={comp}>
                                  <td className="px-5 py-3 text-right text-sm text-gray-900 border-l border-gray-100">
                                    {(annee.companies[comp] / 100 || 0).toLocaleString('fr-FR')} Ar
                                  </td>
                                  <td className="px-5 py-3 text-right text-sm text-gray-600">
                                    {annee.pourcentages[comp]?.toFixed(1) || 0}%
                                  </td>
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

          {!isLoading && !etatVenteData && (
            <div className="text-center py-16 text-gray-500">
              Sélectionnez un fournisseur et cliquez sur Filtrer pour voir les états
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* ton contenu dashboard */}
        </div>
      )}
    </TabContainer>
  );
};

export default AccueilViewHotel;
