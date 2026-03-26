import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store';
import type { VisaEntete } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';
import { VisaHeader } from './VisaHeader';
import { FiArrowRight } from 'react-icons/fi';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import { useState } from 'react';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';

const VisaTab = () => {

  const visaEnteteState = useSelector((s: RootState) => s.visaEntete);
  const visaEntetes = visaEnteteState?.data ?? [];
  const loading     = visaEnteteState?.loading ?? false;
  const error       = visaEnteteState?.error ?? null;
  const navigate = useNavigate();

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
    const prestationId = dossierActif?.dossierCommunColab
      ?.find((colab) => colab.module?.nom?.toLowerCase() === 'visa')
      ?.prestation?.[0]?.id ?? '';

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="py-2 px-4 space-y-4">

      <VisaHeader
        numerovisa=''
        nomPassager={''}
        navigate={navigate}
        isDetail={false}
        isProspection={false}
        isDevis={false}
      />

      <DossierActifCard gradient="from-blue-400 via-indigo-400 to-blue-500" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTabSousSection('lignes')}
              className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                activeTabSousSection === 'lignes'
                  ? 'bg-[#4A77BE] text-white shadow-sm'
                  : 'bg-white text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'
              }`}
            >
              Liste des Visas ({visaEntetes.length})
            </button>
            <button
              onClick={() => setActiveTabSousSection('suivi')}
              className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                activeTabSousSection === 'suivi'
                  ? 'bg-[#4A77BE] text-white shadow-sm'
                  : 'bg-white text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'
              }`}
            >
              Suivi
            </button>
          </nav>
        </div>

        <button
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
        >
          <svg
            width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={`transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Chargement...
        </div>
      )}

      {/* Liste vide */}
      {!loading && visaEntetes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
          <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Aucun visa pour ce dossier</p>
        </div>
      )}

      {/* Cards */}
      {!loading && activeTabSousSection === 'lignes' && [...visaEntetes]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        })
        .map((entete: VisaEntete) => {
        const prestation = entete.visaProspectionEntete.prestation;
        const consulat   = entete.visaProspectionEntete.consulat;
        const totalPersonnes = entete.visaLigne.reduce((s, l) => s + l.visaProspectionLigne.nombre, 0);
        const totalAriary    = entete.visaLigne.reduce((s, l) => s + l.visaProspectionLigne.puClientAriary * l.visaProspectionLigne.nombre, 0);

        return (
          <div
            key={entete.id}
            onClick={() => navigate(`/dossiers-communs/visa/visa-detail/${entete.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
          >
            {/* ── Header card ── */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {/* Avatar initiales */}
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {prestation?.numeroDos?.slice(0, 2).toUpperCase() ?? 'VI'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 text-sm">
                      {prestation?.numeroDos ?? '—'}
                    </p>
                    {consulat && (
                      <span className="text-[11px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md capitalize">
                        {consulat.nom}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Créé le {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* <StatusBadge status={entete.statut} /> */}
                <StatusBadge status={entete.statutEntete == "CREER" ? "créé" : entete.statutEntete == "VALIDER" ? "validé" : entete.statutEntete == "ANNULER" ? "annulé" : entete.statutEntete} />
                {/* Total rapide */}
                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  {totalAriary.toLocaleString('fr-FR')} Ar
                </span>
                <div className="w-px h-6 bg-gray-200 shrink-0" />
                <FiArrowRight className="text-gray-400" />
              </div>
            </div>

            {/* ── Lignes ── */}
            {entete.visaLigne.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-4 text-xs text-gray-400 italic">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                Aucune ligne visa
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Réf.', 'Pays', 'Type', 'Nb', 'Départ', 'Retour', 'Consulat', 'PU client (Ar)', 'Devise', 'Statut ligne', 'Statut visa'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entete.visaLigne.map((ligne) => {
                      const vp = ligne.visaProspectionLigne;
                      return (
                        <tr key={ligne.id} className="hover:bg-indigo-50/40 transition-colors">

                          {/* Réf. */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              {ligne.referenceLine}
                            </span>
                          </td>

                          {/* Pays */}
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {vp.visaParams.pays.pays}
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 capitalize">{vp.visaParams.visaType.nom}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {vp.visaParams.visaEntree.entree} · {vp.visaParams.visaDuree.duree}j
                            </p>
                          </td>

                          {/* Nb */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                              {vp.nombre}
                            </span>
                          </td>

                          {/* Départ */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(vp.dateDepart).toLocaleDateString('fr-FR')}
                          </td>

                          {/* Retour */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(vp.dateRetour).toLocaleDateString('fr-FR')}
                          </td>

                          {/* Consulat */}
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                            {consulat?.nom ?? '—'}
                          </td>

                          {/* PU client */}
                          <td className="px-4 py-3 font-bold text-indigo-700">
                            {(vp.puClientAriary * vp.nombre).toLocaleString('fr-FR')}
                            <span className="text-indigo-400 text-xs ml-1">Ar</span>
                          </td>

                          {/* Devise */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md">
                              {vp.devise}
                            </span>
                          </td>

                          {/* Statut ligne */}
                          <td className="px-4 py-3">
                            <StatusBadge status={ligne.statusLigne} />
                          </td>

                          {/* Statut visa */}
                          <td className="px-4 py-3">
                            <StatusBadge status={ligne.statusVisa} />
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                  {/* ── Totaux ── */}
                  <tfoot>
                    <tr className="bg-indigo-50 border-t border-indigo-100">
                      <td colSpan={3} className="px-4 py-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                          Total
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-200 text-indigo-800 text-xs font-bold">
                          {totalPersonnes}
                        </span>
                      </td>
                      <td colSpan={3} />
                      <td className="px-4 py-2.5 font-bold text-indigo-700">
                        {totalAriary.toLocaleString('fr-FR')}
                        <span className="text-indigo-400 text-xs ml-1">Ar</span>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}
      {/* ── Onglet Suivi ── */}
      {activeTabSousSection === 'suivi' && (
        <SuiviTabSection
          prestationId={prestationId}
        />
      )}
    </div>
  );
};

export default VisaTab;