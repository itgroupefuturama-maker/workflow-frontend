import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchEtatVente, type EtatVenteLigne } from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import { fetchModules } from '../../../../app/back_office/modulesSlice';
import { fetchFournisseurs } from '../../../../app/back_office/fournisseursSlice';
import { useNavigate } from 'react-router-dom';
import EtatVenteParPlateformeTab from './EtatVenteParPlateformeTab';
import { FiDownload } from 'react-icons/fi';
import { exportAirAustralExcel } from '../../../../utils/exportAirAustralExcel';
import { exportCompagnieAerienneExcel } from '../../../../utils/exportCompagnieAerienneExcel';
import { exportBalanceCompagnieExcel } from '../../../../utils/exportBalanceCompagnieExcel';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ─── Constantes ───────────────────────────────────────────────

const formatMoney = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' Ar';

const formatDevise = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR');

const MOIS = [
  { value: 1,  label: 'Janvier' },
  { value: 2,  label: 'Février' },
  { value: 3,  label: 'Mars' },
  { value: 4,  label: 'Avril' },
  { value: 5,  label: 'Mai' },
  { value: 6,  label: 'Juin' },
  { value: 7,  label: 'Juillet' },
  { value: 8,  label: 'Août' },
  { value: 9,  label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

// ─── Composant ────────────────────────────────────────────────

const PageEtatVente: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'global' | 'plateforme' | 'fournisseur'>('global');

  const { etatVenteResultat, loadingEtatVente, errorEtatVente } =
    useSelector((state: RootState) => state.dashboard);
  const { data: modules } =
    useSelector((state: RootState) => state.modules);
  const { data: fournisseurs } =
    useSelector((state: RootState) => state.fournisseurs);

  // ── Filtres ──
  const [year,          setYear]          = useState('');
  const [month,         setMonth]         = useState('');
  const [quinzaine,     setQuinzaine]     = useState('');
  const [moduleId,      setModuleId]      = useState('');
  const [fournisseurId, setFournisseurId] = useState('');
  const [clientFacture, setClientFacture] = useState('');

  useEffect(() => {
    dispatch(fetchModules());
    dispatch(fetchFournisseurs());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchEtatVente({
      year:      year      ? Number(year)      : undefined,
      month:     month     ? Number(month)     : undefined,
      quinzaine: quinzaine ? (Number(quinzaine) as 1 | 2) : undefined,
      moduleId,
      fournisseurId,
      clientFacture,
    }));
  };

  const [exporting, setExporting] = useState(false);

  const handleExportAirAustral = async () => {
    setExporting(true);
    try {
      const periodeLabel = [
        moisSelectionne?.label?.toUpperCase(),
        year || null,
      ].filter(Boolean).join(' ') || 'PÉRIODE NON FILTRÉE';

      await exportAirAustralExcel({
        lignes,
        periodeLabel,
        salesStation: 'AL BOURAQ TRAVEL', // à adapter ou rendre configurable
        iataCode: '48210540',
        currency: 'MGA',
        fournisseurNom: 'Air Austral',
      });
    } finally {
      setExporting(false);
    }
  };

  const [exportingKQ, setExportingKQ] = useState(false);

  const handleExportKenyaAirways = async () => {
    setExportingKQ(true);
    try {
      const periodeLabel = [
        moisSelectionne?.label,
        year || null,
      ].filter(Boolean).join(' ') || 'PÉRIODE NON FILTRÉE';

      await exportCompagnieAerienneExcel({
        lignes,
        fournisseurNom: 'Kenya Airways',
        agenceDenomination: 'ARIO MADAGASCAR', // à adapter si besoin
        periodeLabel,
        codeAirlineNumeric: '706',
        codeAirlineAlpha: 'KQ',
        commissionLabel: 'MK',
      });
    } finally {
      setExportingKQ(false);
    }
  };

  const [exportingAirMad, setExportingAirMad] = useState(false);

  const handleExportAirMadagascar = async () => {
    setExportingAirMad(true);
    try {
      const periodeLabel = year && month
        ? `DU 01 AU 15 ${moisSelectionne?.label} ${year}` // adapte si tu gères aussi la 2e quinzaine
        : 'PÉRIODE NON FILTRÉE';

      await exportBalanceCompagnieExcel({
        lignes,
        fournisseurNom: 'Air Madagascar',
        agence: {
          nom: 'AL BOURAQ TRAVEL',
          codeMdEtIata: 'MD 0614 - IATA 48210540',
          adresse: 'IMMEUBLE MATURE VILLAGE DES JEUX ANKORONDRANO',
          tel: '020 22 637 17',
          mail: 'albouraqtravel@gmail.com',
        },
        periodeLabel,
      });
    } finally {
      setExportingAirMad(false);
    }
  };

  const handleReset = () => {
    setYear('');
    setMonth('');
    setQuinzaine('');
    setModuleId('');
    setFournisseurId('');
    setClientFacture('');
  };

  const lignes: EtatVenteLigne[] = etatVenteResultat?.data ?? [];

  // ── Groupement par date (jour) ──
  const groupesParDate = lignes.reduce<Record<string, EtatVenteLigne[]>>((acc, ligne) => {
    const dateKey = formatDate(ligne.dateTransaction);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ligne);
    return acc;
  }, {});

  // ── Totaux généraux ──
  const totalGeneral = {
    fcCAriary:         lignes.reduce((s, l) => s + l.fcCAriary,         0),
    commission:        lignes.reduce((s, l) => s + l.commission,        0),
    cmCAriary:         lignes.reduce((s, l) => s + l.cmCAriary,         0),
    montantTaxeDevise: lignes.reduce((s, l) => s + l.montantTaxeDevise, 0),
    montantTaxeAriary: lignes.reduce((s, l) => s + l.montantTaxeAriary, 0),
  };

  // ── Période et module sélectionné pour l'en-tête ──
  const moduleSelectionne = modules.find((m) => m.id === moduleId);
  const fournisseurSelectionne = fournisseurs.find((f) => f.id === fournisseurId);
  const moisSelectionne = MOIS.find((m) => m.value === Number(month));

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8 space-y-6 bg-slate-100 h-full">

      {/* ── Titre ── */}
      <div className="flex items-center gap-4">
          <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all group"
          >
              <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Retour</span>
          </button>

          <div>
              <h1 className="text-xl font-bold text-gray-900">
              Etat de vente
              </h1>
          </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'global' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          État de vente par module
        </button>
        <button
          onClick={() => setActiveTab('plateforme')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'plateforme' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          État de vente par plateforme
        </button>

        <button
          onClick={() => setActiveTab('fournisseur')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'fournisseur' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          État de vente par compagnie(fournisseur)
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
        {activeTab === 'global' && (
          <>
            {/* ── Barre de filtres ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <div className="flex flex-wrap items-end gap-3">

                {/* Année */}
                <div className="flex flex-col gap-0.5 min-w-[100px]">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Année
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex : 2026"
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                  />
                </div>

                {/* Mois */}
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Mois
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les mois</option>
                    {MOIS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Quinzaine */}
                <div className="flex flex-col gap-0.5 min-w-[150px]">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Quinzaine
                  </label>
                  <select
                    value={quinzaine}
                    onChange={(e) => setQuinzaine(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Toute la période</option>
                    <option value="1">Du 1 au 15</option>
                    <option value="2">Du 16 à la fin</option>
                  </select>
                </div>

                {/* Module */}
                <div className="flex flex-col gap-0.5 min-w-[150px]">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Module
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les modules</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Fournisseur */}
                <div className="flex flex-col gap-0.5 min-w-[150px]">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Fournisseur
                  </label>
                  <select
                    value={fournisseurId}
                    onChange={(e) => setFournisseurId(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les fournisseurs</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.libelle}</option>
                    ))}
                  </select>
                </div>

                {/* Client facturé */}
                <div className="flex flex-col gap-0.5 min-w-[160px] flex-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Client facturé
                  </label>
                  <input
                    type="text"
                    value={clientFacture}
                    onChange={(e) => setClientFacture(e.target.value)}
                    placeholder="Ex : Client Air France"
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                  />
                </div>

                {/* Boutons — alignés en bas avec les inputs */}
                <div className="flex items-end gap-2 pb-0.5">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
                  >
                    <FiX size={13} />
                    Réinitialiser
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={loadingEtatVente}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                  >
                    {loadingEtatVente
                      ? <FiRefreshCw size={13} className="animate-spin" />
                      : <FiSearch size={13} />
                    }
                    Rechercher
                  </button>
                  <button
                    onClick={handleExportAirAustral}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                  >
                    {exporting
                      ? <FiRefreshCw size={13} className="animate-spin" />
                      : <FiDownload size={13} />
                    }
                    Extraire Air Austral
                  </button>

                  <button
                    onClick={handleExportKenyaAirways}
                    disabled={exportingKQ}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                  >
                    {exportingKQ
                      ? <FiRefreshCw size={13} className="animate-spin" />
                      : <FiDownload size={13} />
                    }
                    Extraire Kenya Airways
                  </button>

                  <button
                    onClick={handleExportAirMadagascar}
                    disabled={exportingAirMad}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                  >
                    {exportingAirMad
                      ? <FiRefreshCw size={13} className="animate-spin" />
                      : <FiDownload size={13} />
                    }
                    Extraire Air Madagascar
                  </button>
                </div>

              </div>
            </div>

            {/* ── États ── */}
            {!loadingEtatVente && errorEtatVente && (
              <p className="text-sm text-red-500">{errorEtatVente}</p>
            )}

            {/* ── Tableau ── */}
            {!loadingEtatVente && etatVenteResultat && (
              <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 min-h-0">
                <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <table className="min-w-full border-collapse">

                    {/* ── En-tête titre ── */}
                    <thead>
                      <tr className="bg-[#2563EB]">
                        <th colSpan={10} className="px-4 py-3 text-center text-sm font-bold text-white border border-blue-400">
                          État de Vente
                        </th>
                      </tr>

                      {/* ── En-tête période / prestation ── */}
                      <tr className="bg-[#BFDBFE]">
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                          Période
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                          Filtres
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                          Taxe
                        </th>
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200"></th>
                      </tr>
                      <tr className="bg-[#DBEAFE]">
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Année</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Mois / Quinzaine</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">Module</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">Fournisseur</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">Client facturé</th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100"></th>
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100"></th>
                      </tr>

                      {/* ── Valeurs des filtres ── */}
                      <tr className="bg-[#EFF6FF]">
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                          {year || 'Toutes'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                          {[moisSelectionne?.label, quinzaine === '1' ? 'Du 1 au 15' : quinzaine === '2' ? 'Du 16 à la fin' : null]
                            .filter(Boolean).join(' — ') || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                          {moduleSelectionne?.nom || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                          {fournisseurSelectionne?.libelle || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                          {clientFacture || 'Tous'}
                        </td>
                        <td colSpan={3} className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100"></td>
                        <td colSpan={2} className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100"></td>
                      </tr>

                      {/* ── En-tête colonnes données ── */}
                      <tr className="bg-[#2563EB]">
                        {['Date', 'Fournisseur', 'Bénéficiaire', 'N° Billet', 'Prix Prestataire', 'Commission', 'Prix Client', 'Taux Taxe', 'Taxe (Devise)', 'Taxe (Ar)'].map((h) => (
                          <th key={h} className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide border border-blue-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {lignes.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-20 text-center text-sm text-gray-400">
                            Aucune donnée — veuillez lancer une recherche
                          </td>
                        </tr>
                      ) : (
                        <>
                          {Object.entries(groupesParDate).map(([dateKey, itemsDate]) => {

                            // Groupement par prestation dans la date
                            const groupesParPrestation = itemsDate.reduce<Record<string, EtatVenteLigne[]>>((acc, l) => {
                              if (!acc[l.prestation]) acc[l.prestation] = [];
                              acc[l.prestation].push(l);
                              return acc;
                            }, {});

                            // Total de la date
                            const totalDate = {
                              fcCAriary:         itemsDate.reduce((s, l) => s + l.fcCAriary,         0),
                              commission:        itemsDate.reduce((s, l) => s + l.commission,        0),
                              cmCAriary:         itemsDate.reduce((s, l) => s + l.cmCAriary,         0),
                              montantTaxeDevise: itemsDate.reduce((s, l) => s + l.montantTaxeDevise, 0),
                              montantTaxeAriary: itemsDate.reduce((s, l) => s + l.montantTaxeAriary, 0),
                            };

                            return (
                              <React.Fragment key={dateKey}>

                                {/* ── Ligne date ── */}
                                <tr className="bg-[#EFF6FF]">
                                  <td colSpan={10} className="px-4 py-2 text-xs font-bold text-gray-700 border border-blue-100">
                                    {dateKey}
                                  </td>
                                </tr>

                                {Object.entries(groupesParPrestation).map(([prestationNom, itemsPrestation]) => {

                                  // Total de la prestation
                                  const totalPrestation = {
                                    fcCAriary:         itemsPrestation.reduce((s, l) => s + l.fcCAriary,         0),
                                    commission:        itemsPrestation.reduce((s, l) => s + l.commission,        0),
                                    cmCAriary:         itemsPrestation.reduce((s, l) => s + l.cmCAriary,         0),
                                    montantTaxeDevise: itemsPrestation.reduce((s, l) => s + l.montantTaxeDevise, 0),
                                    montantTaxeAriary: itemsPrestation.reduce((s, l) => s + l.montantTaxeAriary, 0),
                                  };

                                  return (
                                    <React.Fragment key={prestationNom}>

                                      {/* Lignes de la prestation */}
                                      {itemsPrestation.map((ligne, idx) => (
                                        <tr
                                          key={ligne.id}
                                          className={idx % 2 === 0 ? 'bg-[#DBEAFE]/40' : 'bg-[#EFF6FF]/60'}
                                        >
                                          <td className="px-4 py-2.5 text-xs text-gray-500 border border-blue-100 whitespace-nowrap">
                                            {/* Prestation affichée à la première ligne seulement */}
                                            {idx === 0 ? (
                                              <span className="font-semibold text-gray-700">{ligne.prestation}</span>
                                            ) : null}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {ligne.fournisseur?.libelle || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {ligne.clientBeneficiaire
                                              ?.flatMap((cb) => cb.clientbeneficiaireInfo?.map((info) => `${info.prenom} ${info.nom}`) ?? [])
                                              .join(', ') || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {ligne.clientBeneficiaire
                                              ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((info) => info.billet.map((b) => b.numeroBillet)) ?? [])
                                              .filter(Boolean)
                                              .join(', ') || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {formatMoney(ligne.cmCAriary)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {(ligne.commissionAppliquer)} %
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {formatMoney(ligne.fcCAriary)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {ligne.tauxTaxe} %
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {formatDevise(ligne.montantTaxeDevise)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                            {formatMoney(ligne.montantTaxeAriary)}
                                          </td>
                                        </tr>
                                      ))}

                                      {/* Total prestation */}
                                      <tr className="bg-[#9CA3AF]/25">
                                        <td colSpan={4} className="px-4 py-2 text-xs font-black text-gray-700 text-right border border-gray-300">
                                          Total {prestationNom}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          {formatMoney(totalPrestation.cmCAriary)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          {formatMoney(totalPrestation.commission)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          {formatMoney(totalPrestation.fcCAriary)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          —
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          {formatDevise(totalPrestation.montantTaxeDevise)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                          {formatMoney(totalPrestation.montantTaxeAriary)}
                                        </td>
                                      </tr>

                                    </React.Fragment>
                                  );
                                })}

                                {/* Total de la date */}
                                <tr className="bg-[#BFDBFE]/60">
                                  <td colSpan={4} className="px-4 py-2 text-xs font-black text-gray-800 text-right border border-blue-200">
                                    Total
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    {formatMoney(totalDate.cmCAriary)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    {formatMoney(totalDate.commission)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    {formatMoney(totalDate.fcCAriary)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    —
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    {formatDevise(totalDate.montantTaxeDevise)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                                    {formatMoney(totalDate.montantTaxeAriary)}
                                  </td>
                                </tr>

                              </React.Fragment>
                            );
                          })}

                          {/* ── Total Général ── */}
                          <tr className="bg-[#2563EB]">
                            <td colSpan={4} className="px-4 py-3 text-xs font-black text-white border border-blue-400">
                              Total Mois
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              {formatMoney(totalGeneral.fcCAriary)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              {formatMoney(totalGeneral.commission)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              {formatMoney(totalGeneral.cmCAriary)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              —
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              {formatDevise(totalGeneral.montantTaxeDevise)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                              {formatMoney(totalGeneral.montantTaxeAriary)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'plateforme' && <EtatVenteParPlateformeTab />}
      </div>
    </div>
  );
};

export default PageEtatVente;