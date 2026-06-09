import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  fetchStatParDossier,
  type StatLigne,
} from '../../../../app/front_office/parametre_dashboard/dashboardSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ─── Constantes ───────────────────────────────────────────────

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ticketing:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  hotel:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  visa:        { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  assurance:   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  attestation: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
};

const getModuleStyle = (nom: string) =>
  MODULE_COLORS[nom.toLowerCase()] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

const formatMoney = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' Ar';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR');

// ─── Composant ────────────────────────────────────────────────

const PageResultatStats: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();

  // Récupère le numéro de dossier depuis les params de route
  // ex: /dashboard/stats/:numDosCommun
  const { numDosCommun } = useParams<{ numDosCommun: string }>();

  const { statResultat, loadingStat, errorStat } =
    useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    if (numDosCommun) {
      dispatch(fetchStatParDossier({ numDosCommun }));
    }
  }, [dispatch, numDosCommun]);

  const lignes: StatLigne[] = statResultat?.data ?? [];

  // ── Groupement par module ──
  const groupesParModule = lignes.reduce<Record<string, StatLigne[]>>((acc, ligne) => {
    const nom = ligne.module.nom;
    if (!acc[nom]) acc[nom] = [];
    acc[nom].push(ligne);
    return acc;
  }, {});

  // ── Totaux généraux ──
  const totalGeneral = {
    cmMAriary:  lignes.reduce((s, l) => s + l.cmMAriary,  0),
    cmCAriary:  lignes.reduce((s, l) => s + l.cmCAriary,  0),
    fcMAriary:  lignes.reduce((s, l) => s + l.fcMAriary,  0),
    fcCAriary:  lignes.reduce((s, l) => s + l.fcCAriary,  0),
    commission: lignes.reduce((s, l) => s + l.commission, 0),
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 pt-8 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
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
              Résultat Statistiques
            </h1>
            {numDosCommun && (
              <p className="text-xs text-gray-400 mt-0.5">
                Dossier commun n° <span className="font-semibold text-indigo-600">{numDosCommun}</span>
                {statResultat && (
                  <span className="ml-2 text-gray-400">— {statResultat.total} ligne{statResultat.total > 1 ? 's' : ''}</span>
                )}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => numDosCommun && dispatch(fetchStatParDossier({ numDosCommun }))}
          disabled={loadingStat}
          title="Actualiser"
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw className={loadingStat ? 'animate-spin' : ''} size={15} />
        </button>
      </div>

      {/* ── États ── */}
      {loadingStat && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 animate-pulse">Chargement des données...</p>
        </div>
      )}

      {!loadingStat && errorStat && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{errorStat}</p>
        </div>
      )}

      {/* ── Tableau ── */}
      {!loadingStat && !errorStat && (
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            <table className="min-w-full border-collapse">

              {/* En-tête */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#2563EB]">
                  {[
                    'Catégorie Prestation',
                    'Numéro Dossier',
                    'Date Prestation',
                    'Prestation',
                    'Montant Prestataire En Ariary',
                    'Montant Commission en Ariary',
                    '% Commission',
                    'Montant Client en Ariary',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide whitespace-nowrap border border-blue-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-sm text-gray-400">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  <>
                    {Object.entries(groupesParModule).map(([moduleNom, items]) => {
                      const style = getModuleStyle(moduleNom);

                      // Totaux du groupe
                      const totalGroupe = {
                        cmMAriary:  items.reduce((s, l) => s + l.cmMAriary,  0),
                        cmCAriary:  items.reduce((s, l) => s + l.cmCAriary,  0),
                        commission: items.reduce((s, l) => s + l.commission, 0),
                        cmClient:   items.reduce((s, l) => s + l.cmMAriary,  0),
                      };

                      return (
                        <React.Fragment key={moduleNom}>
                          {/* Lignes du groupe */}
                          {items.map((ligne, idx) => (
                            <tr
                              key={ligne.id}
                              className={`${idx % 2 === 0 ? 'bg-blue-50/40' : 'bg-blue-50/20'} hover:bg-indigo-50/40 transition-colors`}
                            >
                              {/* Catégorie — affichée uniquement sur la 1ère ligne du groupe */}
                              <td className="px-4 py-3 text-xs text-center border border-blue-100">
                                {idx === 0 ? (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                    {moduleNom}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-gray-700 text-center border border-blue-100 whitespace-nowrap">
                                {ligne.numDosPrestation}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 text-center border border-blue-100 whitespace-nowrap">
                                {formatDate(ligne.dateTransaction)}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 border border-blue-100">
                                {ligne.prestation}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-mono text-gray-700 border border-blue-100 whitespace-nowrap">
                                {formatMoney(ligne.fcMAriary || ligne.cmMAriary)}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-mono text-gray-700 border border-blue-100 whitespace-nowrap">
                                {formatMoney(ligne.commission)}
                              </td>
                              <td className="px-4 py-3 text-xs text-center text-gray-500 border border-blue-100">
                                {ligne.commissionAppliquer}%
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-mono text-gray-700 border border-blue-100 whitespace-nowrap">
                                {formatMoney(ligne.cmMAriary)}
                              </td>
                            </tr>
                          ))}

                          {/* Ligne total du groupe */}
                          <tr className="bg-[#9CA3AF]/30">
                            <td
                              colSpan={4}
                              className="px-4 py-2.5 text-xs font-black text-gray-700 text-center border border-gray-300"
                            >
                              Total {moduleNom}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                              {formatMoney(totalGroupe.cmMAriary)}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                              {formatMoney(totalGroupe.commission)}
                            </td>
                            <td className="px-4 py-2.5 border border-gray-300" />
                            <td className="px-4 py-2.5 text-xs text-right font-black font-mono text-gray-800 border border-gray-300 whitespace-nowrap">
                              {formatMoney(totalGroupe.cmClient)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Ligne Total Général */}
                    <tr className="bg-[#2563EB]">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-xs font-black text-white border border-blue-400"
                      >
                        Total Général
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                        {formatMoney(totalGeneral.cmMAriary)}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                        {formatMoney(totalGeneral.commission)}
                      </td>
                      <td className="px-4 py-3 border border-blue-400" />
                      <td className="px-4 py-3 text-xs text-right font-black font-mono text-white border border-blue-400 whitespace-nowrap">
                        {formatMoney(totalGeneral.cmMAriary)}
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

export default PageResultatStats;