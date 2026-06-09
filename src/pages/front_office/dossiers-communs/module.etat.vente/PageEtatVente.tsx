import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchEtatVente, type EtatVenteLigne } from '../../../../app/front_office/parametre_dashboard/dashboardSlice';
import { fetchModules } from '../../../../app/back_office/modulesSlice';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ─── Constantes ───────────────────────────────────────────────

const formatMoney = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' Ar';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR');

// ─── Composant ────────────────────────────────────────────────

const PageEtatVente: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { etatVenteResultat, loadingEtatVente, errorEtatVente } =
    useSelector((state: RootState) => state.dashboard);
  const { data: modules } =
    useSelector((state: RootState) => state.modules);

  // ── Filtres ──
  const [dateDebut,     setDateDebut]     = useState('');
  const [dateFin,       setDateFin]       = useState('');
  const [moduleId,      setModuleId]      = useState('');
  const [clientFacture, setClientFacture] = useState('');

  useEffect(() => {
    dispatch(fetchModules());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchEtatVente({ dateDebut, dateFin, moduleId, clientFacture }));
  };

  const handleReset = () => {
    setDateDebut('');
    setDateFin('');
    setModuleId('');
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
    fcCAriary:  lignes.reduce((s, l) => s + l.fcCAriary,  0),
    commission: lignes.reduce((s, l) => s + l.commission, 0),
    cmCAriary:  lignes.reduce((s, l) => s + l.cmCAriary,  0),
  };

  // ── Période et module sélectionné pour l'en-tête ──
  const moduleSelectionne = modules.find((m) => m.id === moduleId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8 space-y-6">

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

      {/* ── Barre de filtres ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Date début */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Date début
            </label>
            <input
              type="month"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          {/* Date fin */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Date fin
            </label>
            <input
              type="month"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          {/* Module */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Module
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
            >
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>

          {/* Client facturé */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Client facturé
            </label>
            <input
              type="text"
              value={clientFacture}
              onChange={(e) => setClientFacture(e.target.value)}
              placeholder="Ex : Client Air France"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex items-center gap-3 mt-4 justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
          >
            <FiX size={14} />
            Réinitialiser
          </button>
          <button
            onClick={handleSearch}
            disabled={loadingEtatVente}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
          >
            {loadingEtatVente
              ? <FiRefreshCw size={14} className="animate-spin" />
              : <FiSearch size={14} />
            }
            Rechercher
          </button>
        </div>
      </div>

      {/* ── États ── */}
      {!loadingEtatVente && errorEtatVente && (
        <p className="text-sm text-red-500">{errorEtatVente}</p>
      )}

      {/* ── Tableau ── */}
      {!loadingEtatVente && etatVenteResultat && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="min-w-full border-collapse">

              {/* ── En-tête titre ── */}
              <thead>
                <tr className="bg-[#2563EB]">
                  <th colSpan={4} className="px-4 py-3 text-center text-sm font-bold text-white border border-blue-400">
                    État de Vente
                  </th>
                </tr>

                {/* ── En-tête période / prestation ── */}
                <tr className="bg-[#BFDBFE]">
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                    Période
                  </th>
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border border-blue-200">
                    Prestation
                  </th>
                </tr>
                <tr className="bg-[#DBEAFE]">
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Du</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100 w-36">Au</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">De</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 border border-blue-100">À</th>
                </tr>

                {/* ── Valeurs des filtres ── */}
                <tr className="bg-[#EFF6FF]">
                  <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                    {dateDebut || '—'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                    {dateFin || '—'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                    {moduleSelectionne?.nom || 'Tous'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500 border border-blue-100">
                    {clientFacture || 'Tous'}
                  </td>
                </tr>

                {/* ── En-tête colonnes données ── */}
                <tr className="bg-[#2563EB]">
                  {['Date', 'Prix Prestataire', 'Commission', 'Prix Client'].map((h) => (
                    <th key={h} className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide border border-blue-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-sm text-gray-400">
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
                        fcCAriary:  itemsDate.reduce((s, l) => s + l.fcCAriary,  0),
                        commission: itemsDate.reduce((s, l) => s + l.commission, 0),
                        cmCAriary:  itemsDate.reduce((s, l) => s + l.cmCAriary,  0),
                      };

                      return (
                        <React.Fragment key={dateKey}>

                          {/* ── Ligne date ── */}
                          <tr className="bg-[#EFF6FF]">
                            <td colSpan={4} className="px-4 py-2 text-xs font-bold text-gray-700 border border-blue-100">
                              {dateKey}
                            </td>
                          </tr>

                          {Object.entries(groupesParPrestation).map(([prestationNom, itemsPrestation]) => {

                            // Total de la prestation
                            const totalPrestation = {
                              fcCAriary:  itemsPrestation.reduce((s, l) => s + l.fcCAriary,  0),
                              commission: itemsPrestation.reduce((s, l) => s + l.commission, 0),
                              cmCAriary:  itemsPrestation.reduce((s, l) => s + l.cmCAriary,  0),
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
                                    <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                      {formatMoney(ligne.fcCAriary)}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                      {formatMoney(ligne.commission)}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-right font-mono text-gray-600 border border-blue-100 whitespace-nowrap">
                                      {formatMoney(ligne.cmCAriary)}
                                    </td>
                                  </tr>
                                ))}

                                {/* Total prestation */}
                                <tr className="bg-[#9CA3AF]/25">
                                  <td className="px-4 py-2 text-xs font-black text-gray-700 text-right border border-gray-300">
                                    Total {prestationNom}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                    {formatMoney(totalPrestation.fcCAriary)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                    {formatMoney(totalPrestation.commission)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                                    {formatMoney(totalPrestation.cmCAriary)}
                                  </td>
                                </tr>

                              </React.Fragment>
                            );
                          })}

                          {/* Total de la date */}
                          <tr className="bg-[#BFDBFE]/60">
                            <td className="px-4 py-2 text-xs font-black text-gray-800 text-right border border-blue-200">
                              Total
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                              {formatMoney(totalDate.fcCAriary)}
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                              {formatMoney(totalDate.commission)}
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-black font-mono text-gray-900 border border-blue-200 whitespace-nowrap">
                              {formatMoney(totalDate.cmCAriary)}
                            </td>
                          </tr>

                        </React.Fragment>
                      );
                    })}

                    {/* ── Total Général ── */}
                    <tr className="bg-[#2563EB]">
                      <td className="px-4 py-3 text-xs font-black text-white border border-blue-400">
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
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageEtatVente;