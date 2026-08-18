import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiX, FiDownload, FiInfo } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchEtatVente, type EtatVenteLigne } from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import { fetchModules } from '../../../../app/back_office/modulesSlice';
import { fetchFournisseurs } from '../../../../app/back_office/fournisseursSlice';
import { useNavigate } from 'react-router-dom';
import EtatVenteParPlateformeTab from './EtatVenteParPlateformeTab';
import { exportAirAustralExcel } from '../../../../utils/exportAirAustralExcel';
import { exportCompagnieAerienneExcel } from '../../../../utils/exportCompagnieAerienneExcel';
import { exportBalanceCompagnieExcel } from '../../../../utils/exportBalanceCompagnieExcel';
import { exportAgentIataExcel } from '../../../../utils/exportAgentIataExcel';
import { exportEmiratesExcel } from '../../../../utils/exportEmiratesExcel';
import { exportEthiopianExcel } from '../../../../utils/exportEthiopianExcel';
import { exportAirMauritiusExcel } from '../../../../utils/exportAirMauritiusExcel';
import { exportTurkishExcel } from '../../../../utils/exportTurkishExcel';
import { toast } from '../../../../components/Toast/toast';

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

const TABS = [
  { key: 'global', label: 'Par module' },
  { key: 'plateforme', label: 'Par plateforme' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Composant ────────────────────────────────────────────────

const PageEtatVente: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('global');

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

  const handleReset = () => {
    setYear('');
    setMonth('');
    setQuinzaine('');
    setModuleId('');
    setFournisseurId('');
    setClientFacture('');
  };

  const lignes: EtatVenteLigne[] = etatVenteResultat?.data ?? [];

  // ── Période et module sélectionné pour l'en-tête ──
  const moduleSelectionne = modules.find((m) => m.id === moduleId);
  const fournisseurSelectionne = fournisseurs.find((f) => f.id === fournisseurId);
  const moisSelectionne = MOIS.find((m) => m.value === Number(month));

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

  // ── Export Excel : un seul bouton, déterminé par le fournisseur du filtre ──
  const [isExporting, setIsExporting] = useState(false);

  const runExport = async (fn: () => Promise<void>) => {
    setIsExporting(true);
    try {
      await fn();
    } catch (err) {
      console.error('Erreur export Excel :', err);
      toast.error('Une erreur est survenue lors de la génération du fichier Excel. Vérifie la console pour plus de détails.');
    } finally {
      setIsExporting(false);
    }
  };

  // Chaque entrée décrit : comment reconnaître le fournisseur (regex sur le libellé)
  // et comment générer son export. Ajouter un nouveau fournisseur = ajouter une entrée ici.
  const exportConfigs = useMemo(() => [
    {
      test: (libelle: string) => /air\s*austral/i.test(libelle),
      label: 'Air Austral',
      action: () => runExport(async () => {
        const periodeLabel = [moisSelectionne?.label?.toUpperCase(), year || null]
          .filter(Boolean).join(' ') || 'PÉRIODE NON FILTRÉE';
        await exportAirAustralExcel({
          lignes,
          periodeLabel,
          salesStation: 'AL BOURAQ TRAVEL',
          iataCode: '48210540',
          currency: 'MGA',
          fournisseurNom: 'Air Austral',
        });
      }),
    },
    {
      test: (libelle: string) => /kenya\s*airways|^\s*kq\s*$/i.test(libelle),
      label: 'Kenya Airways',
      action: () => runExport(async () => {
        const periodeLabel = [moisSelectionne?.label, year || null]
          .filter(Boolean).join(' ') || 'PÉRIODE NON FILTRÉE';
        await exportCompagnieAerienneExcel({
          lignes,
          fournisseurNom: 'Kenya Airways',
          agenceDenomination: 'ARIO MADAGASCAR',
          periodeLabel,
          codeAirlineNumeric: '706',
          codeAirlineAlpha: 'KQ',
          commissionLabel: 'MK',
        });
      }),
    },
    {
      test: (libelle: string) => /air\s*mad/i.test(libelle),
      label: 'Air Madagascar',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `DU 01 AU 15 ${moisSelectionne?.label} ${year}`
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
      }),
    },
    {
      test: (libelle: string) => /air\s*france/i.test(libelle),
      label: 'Air France',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `01 ${moisSelectionne?.label?.toUpperCase()} ${year} AU FIN`
          : 'PÉRIODE NON FILTRÉE';
        await exportAgentIataExcel({
          lignes,
          fournisseurNom: 'Air France',
          codeCourt: 'AF',
          agence: {
            nom: 'AL BOURAQ TRAVEL',
            adresse: 'Appt. A5 - Bat F5 Village Des Jeux - Ankorondrano Antananarivo - 101',
            codeAgent: '48210540',
          },
          periodeLabel,
          currency: 'MGA',
          statutAnnule: 'annuler',
        });
      }),
    },
    {
      test: (libelle: string) => /emirates/i.test(libelle),
      label: 'Emirates',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `01.${String(Number(month)).padStart(2, '0')}.${year} AU 31.${String(Number(month)).padStart(2, '0')}.${year}`
          : 'PÉRIODE NON FILTRÉE';
        await exportEmiratesExcel({
          lignes,
          fournisseurNom: 'Emirates',
          periodeLabel,
          agenceNom: 'AL BOURAQ TRAVEL',
          currency: 'MGA',
          statutAnnule: 'annuler',
        });
      }),
    },
    {
      test: (libelle: string) => /ethiopian/i.test(libelle),
      label: 'Ethiopian Airlines',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `DU 01 AU FIN ${moisSelectionne?.label?.toUpperCase()} ${year}`
          : 'PÉRIODE NON FILTRÉE';
        await exportEthiopianExcel({
          lignes,
          fournisseurNom: 'Ethiopian',
          periodeLabel,
          agencyName: 'AL BOURAQ',
          currency: 'MGA',
        });
      }),
    },
    {
      test: (libelle: string) => /air\s*mauritius/i.test(libelle),
      label: 'Air Mauritius',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `01 AU 15 ${moisSelectionne?.label?.toUpperCase()} ${year}`
          : 'PÉRIODE NON FILTRÉE';
        await exportAirMauritiusExcel({
          lignes,
          fournisseurNom: 'Air Mauritius',
          gsaOffice: 'AL BOURAQ TRAVEL',
          periodeLabelVente: periodeLabel,
          periodeLabelRefund: periodeLabel,
          currency: 'MGA',
          statutAnnule: 'annuler',
        });
      }),
    },
    {
      test: (libelle: string) => /turkish/i.test(libelle),
      label: 'Turkish Airlines',
      action: () => runExport(async () => {
        const periodeLabel = year && month
          ? `01/${String(Number(month)).padStart(2, '0')}/${year} AU FIN`
          : 'PÉRIODE NON FILTRÉE';
        await exportTurkishExcel({
          lignes,
          fournisseurNom: 'Turkish Airlines',
          periodeLabel,
          agenceNom: 'AL BOURAQ TRAVEL',
          agenceContact: 'albouraqtravel@gmail.com +261 20 22 637 17 Appt A5 bat F5 village des Jeux Ankorondrano Antananarivo',
          iataCode: '48210540',
          statutAnnule: 'annuler',
        });
      }),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [lignes, year, month, moisSelectionne]);

  // Le bouton d'export affiché dépend uniquement du fournisseur sélectionné dans le filtre.
  const activeExport = fournisseurSelectionne
    ? exportConfigs.find((c) => c.test(fournisseurSelectionne.libelle))
    : undefined;

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8 space-y-6 bg-slate-50 h-full">

      {/* ── En-tête : retour, titre et onglets intégrés ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-1.5 -ml-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all group"
            >
              <FiArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              État de vente
            </h1>
          </div>
        </div>

        {/* Onglets sous forme d'underline, intégrés au bandeau du header */}
        <nav className="flex gap-6 mt-4 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              <span
                className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-colors ${
                  activeTab === tab.key ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              />
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
        {activeTab === 'global' && (
          <>
            {/* ── Barre de filtres ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Année
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex : 2026"
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Mois
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les mois</option>
                    {MOIS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Quinzaine
                  </label>
                  <select
                    value={quinzaine}
                    onChange={(e) => setQuinzaine(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Toute la période</option>
                    <option value="1">Du 1 au 15</option>
                    <option value="2">Du 16 à la fin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Module
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les modules</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Fournisseur
                  </label>
                  <select
                    value={fournisseurId}
                    onChange={(e) => setFournisseurId(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition bg-white"
                  >
                    <option value="">Tous les fournisseurs</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.libelle}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Client facturé
                  </label>
                  <input
                    type="text"
                    value={clientFacture}
                    onChange={(e) => setClientFacture(e.target.value)}
                    placeholder="Ex : Client Air France"
                    className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                  />
                </div>
              </div>

              {/* ── Actions : recherche / reset / export unique ── */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
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
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
                  >
                    <FiX size={13} />
                    Réinitialiser
                  </button>
                </div>

                {/* Un seul bouton d'export, déterminé par le fournisseur choisi ci-dessus */}
                {activeExport ? (
                  <button
                    onClick={activeExport.action}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                  >
                    {isExporting
                      ? <FiRefreshCw size={13} className="animate-spin" />
                      : <FiDownload size={13} />
                    }
                    Extraire {activeExport.label}
                  </button>
                ) : fournisseurId ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <FiInfo size={13} />
                    Aucun modèle d'export dédié pour ce fournisseur
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <FiInfo size={13} />
                    Choisissez un fournisseur pour activer l'export Excel
                  </span>
                )}
              </div>
            </div>

            {/* ── États ── */}
            {!loadingEtatVente && errorEtatVente && (
              <p className="text-sm text-red-500">{errorEtatVente}</p>
            )}

            {/* ── Indicateurs synthétiques ── */}
            {!loadingEtatVente && etatVenteResultat && lignes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total prix client</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 font-mono">{formatMoney(totalGeneral.fcCAriary)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total commission</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 font-mono">{formatMoney(totalGeneral.commission)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total taxe</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 font-mono">{formatMoney(totalGeneral.montantTaxeAriary)}</p>
                </div>
              </div>
            )}

            {/* ── Tableau ── */}
            {!loadingEtatVente && etatVenteResultat && (
              <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 min-h-0">
                <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <table className="min-w-full border-collapse">

                    {/* ── En-tête titre ── */}
                    <thead>
                      <tr className="bg-indigo-600">
                        <th colSpan={11} className="px-4 py-3 text-center text-sm font-bold text-white border border-indigo-500">
                          État de Vente
                        </th>
                      </tr>

                      {/* ── En-tête période / prestation ── */}
                      <tr className="bg-indigo-100">
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-indigo-200">
                          Période
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-indigo-200">
                          Filtres
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-indigo-200">
                          Taxe
                        </th>
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-indigo-200"></th>
                      </tr>
                      <tr className="bg-indigo-50">
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100 w-36">Année</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100 w-36">Mois / Quinzaine</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100">Module</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100">Fournisseur</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100">Client facturé</th>
                        <th colSpan={4} className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100"></th>
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-indigo-100"></th>
                      </tr>

                      {/* ── Valeurs des filtres ── */}
                      <tr className="bg-indigo-50/60">
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100">
                          {year || 'Toutes'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100">
                          {[moisSelectionne?.label, quinzaine === '1' ? 'Du 1 au 15' : quinzaine === '2' ? 'Du 16 à la fin' : null]
                            .filter(Boolean).join(' — ') || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100">
                          {moduleSelectionne?.nom || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100">
                          {fournisseurSelectionne?.libelle || 'Tous'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100">
                          {clientFacture || 'Tous'}
                        </td>
                        <td colSpan={3} className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100"></td>
                        <td colSpan={3} className="px-4 py-2 text-center text-xs text-gray-500 border border-indigo-100"></td>
                      </tr>

                      {/* ── En-tête colonnes données ── */}
                      <tr className="bg-indigo-600">
                        {['Date', 'Fournisseur','Status', 'Bénéficiaire', 'N° Billet', 'Prix Prestataire', 'Commission', 'Prix Client', 'Taux Taxe', 'Taxe (Devise)', 'Taxe (Ar)'].map((h) => (
                          <th key={h} className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide border border-indigo-500 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {lignes.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-20 text-center text-sm text-gray-400">
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
                                <tr className="bg-indigo-50/60">
                                  <td colSpan={11} className="px-4 py-2 text-xs font-bold text-gray-700 border border-indigo-100">
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
                                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-indigo-50/40 transition-colors`}
                                        >
                                          <td className="px-4 py-2.5 text-xs text-gray-500 border border-gray-100 whitespace-nowrap">
                                            {/* Prestation affichée à la première ligne seulement */}
                                            {idx === 0 ? (
                                              <span className="font-semibold text-gray-700">{ligne.prestation}</span>
                                            ) : null}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {ligne.fournisseur?.libelle || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {ligne.statutTransaction || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {ligne.clientBeneficiaire
                                              ?.flatMap((cb) => cb.clientbeneficiaireInfo?.map((info) => `${info.prenom} ${info.nom}`) ?? [])
                                              .join(', ') || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {ligne.clientBeneficiaire
                                              ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((info) => info.billet.map((b) => b.numeroBillet)) ?? [])
                                              .filter(Boolean)
                                              .join(', ') || '—'}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {formatMoney(ligne.cmCAriary)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {(ligne.commissionAppliquer)} %
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {formatMoney(ligne.fcCAriary)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {ligne.tauxTaxe} %
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {formatDevise(ligne.montantTaxeDevise)}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-gray-100 whitespace-nowrap">
                                            {formatMoney(ligne.montantTaxeAriary)}
                                          </td>
                                        </tr>
                                      ))}

                                      {/* Total prestation */}
                                      <tr className="bg-gray-100">
                                        <td colSpan={5} className="px-4 py-2 text-xs font-black text-gray-700 text-right border border-gray-200">
                                          Total {prestationNom}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          {formatMoney(totalPrestation.cmCAriary)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          {formatMoney(totalPrestation.commission)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          {formatMoney(totalPrestation.fcCAriary)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          —
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          {formatDevise(totalPrestation.montantTaxeDevise)}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-200 whitespace-nowrap">
                                          {formatMoney(totalPrestation.montantTaxeAriary)}
                                        </td>
                                      </tr>

                                    </React.Fragment>
                                  );
                                })}

                                {/* Total de la date */}
                                <tr className="bg-indigo-100/70">
                                  <td colSpan={5} className="px-4 py-2 text-xs font-black text-gray-800 text-right border border-indigo-200">
                                    Total
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    {formatMoney(totalDate.cmCAriary)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    {formatMoney(totalDate.commission)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    {formatMoney(totalDate.fcCAriary)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    —
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    {formatDevise(totalDate.montantTaxeDevise)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-indigo-200 whitespace-nowrap">
                                    {formatMoney(totalDate.montantTaxeAriary)}
                                  </td>
                                </tr>

                              </React.Fragment>
                            );
                          })}

                          {/* ── Total Général ── */}
                          <tr className="bg-indigo-600">
                            <td colSpan={5} className="px-4 py-3 text-xs font-black text-white border border-indigo-500">
                              Total Mois
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
                              {formatMoney(totalGeneral.fcCAriary)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
                              {formatMoney(totalGeneral.commission)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
                              {formatMoney(totalGeneral.cmCAriary)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
                              —
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
                              {formatDevise(totalGeneral.montantTaxeDevise)}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-indigo-500 whitespace-nowrap">
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