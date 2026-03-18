import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { createProspectionEntete, fetchProspectionEntetes, type VisaProspectionLigne } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import StatusBadge from './StatusBadge';
import CreateProspectionLigneModal from './CreateProspectionLigneModal';
import CreateDevisModal from './CreateDevisModal';
import { VisaHeader } from './VisaHeader';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import { fetchVisaConsultats } from '../../../../../app/front_office/parametre_visa/visaConsultatSlice';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';

interface Props {
  prestationId: string;
}

const ProspectionTab = ({ prestationId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const visaProspectionEnteteState = useSelector(
    (s: RootState) => s.visaProspectionEntete
  );

  const prospections = visaProspectionEnteteState?.data ?? [];
  const loading     = visaProspectionEnteteState?.loading ?? false;
  const creating    = visaProspectionEnteteState?.creating ?? false;
  const error       = visaProspectionEnteteState?.error ?? null;

  const [ligneModalEnteteId, setLigneModalEnteteId] = useState<string | null>(null);
  const [devisModalEntete, setDevisModalEntete] = useState<{
    id: string;
    lignes: VisaProspectionLigne[];
  } | null>(null);

  const { data: consultats } = useSelector((s: RootState) => s.visaConsultat);
  const [selectedConsulatId, setSelectedConsulatId] = useState<string>('');

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  useEffect(() => {
    dispatch(fetchVisaConsultats());
  }, [dispatch]);


  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!prestationId || !selectedConsulatId) return;
    
    const result = await dispatch(
      createProspectionEntete({ prestationId, consulatId: selectedConsulatId })
    );
    if (createProspectionEntete.fulfilled.match(result)) {
      dispatch(fetchProspectionEntetes(prestationId));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-5">

      <VisaHeader
        numerovisa={prestationId}
        nomPassager= {''}
        navigate={navigate}
        isDetail={false}
        isProspection={true}
        isDevis={false}
      />

      <DossierActifCard gradient="from-blue-400 via-indigo-400 to-blue-500" />

      {/* Header */}

      <div className='flex items-center justify-between'> 
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
              Liste des Prospections ({prospections.length})
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
        
        {activeTabSousSection === 'lignes' && (
          <div className="flex items-center gap-3">
            <select
              value={selectedConsulatId}
              onChange={(e) => setSelectedConsulatId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">— Choisir un consulat —</option>
              {consultats.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !prestationId || !selectedConsulatId}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            >
              {creating ? '...' : '+ Nouvelle prospection'}
            </button>

            <div className="w-px h-6 bg-gray-200" />

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
        )}
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

      {/* Cards */}
      {activeTabSousSection === 'lignes' && (
        <div className="space-y-4">
          {!loading && [...prospections]
            .sort((a, b) => sortOrder === 'desc'
              ? b.id.localeCompare(a.id)
              : a.id.localeCompare(b.id)
            )
            .map((entete) => {
              const dossier = entete.prestation.dossierCommunColab.dossierCommun;
              return (
                <div
                  key={entete.id}
                  className="bg-white rounded-br-xl rounded-bl-xl rounded-tr-xl border border-gray-200 overflow-hidden shadow-lg"
                >
                {/* ── Header card ── */}
                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {/* Icône initiales */}
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {entete.prestation.numeroDos?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-sm">
                          {entete.prestation.numeroDos}
                        </p>
                        <span className="font-mono text-[11px] bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded-md">
                          {dossier.referenceTravelPlaner}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{dossier.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLigneModalEnteteId(entete.id); }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      + Ligne
                    </button>
                    <button
                      onClick={() => setDevisModalEntete({ id: entete.id, lignes: entete.visaProspectionLigne ?? [] })}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      📄 Devis
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dossiers-communs/visa/details/${entete.id}`); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      Voir détail →
                    </button>
                  </div>
                </div>

                {/* ── Lignes ── */}
                {(entete.visaProspectionLigne ?? []).length === 0 ? (
                  <div className="flex items-center gap-2 px-5 py-4 text-xs text-gray-400 italic">
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    Aucune ligne de prospection
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {[
                            'Nb', 'Départ', 'Retour', 'État visa', 'PU consulat (Ar)', 'PU client (Ar)', 'Devise', 'Taux'
                          ].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(entete.visaProspectionLigne ?? []).map((ligne) => (
                          <tr key={ligne.id} className="hover:bg-indigo-50/40 transition-colors">

                            {/* Nb */}
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                {ligne.nombre}
                              </span>
                            </td>

                            {/* Départ */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {new Date(ligne.dateDepart).toLocaleDateString('fr-FR')}
                            </td>

                            {/* Retour */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {new Date(ligne.dateRetour).toLocaleDateString('fr-FR')}
                            </td>

                            {/* État visa */}
                            <td className="px-4 py-3">
                              <StatusBadge status={ligne.etatVisa == 'CREER' ? 'créé' : ligne.etatVisa == 'ENVOYE' ? 'envoyé' : ligne.etatVisa == 'APPROUVE' ? 'approuvé' : ligne.etatVisa == 'INACTIF' ? 'inactif' : ligne.etatVisa} />
                            </td>

                            {/* PU consulat */}
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                              {ligne.puConsulatAriary.toLocaleString('fr-FR')}
                              <span className="text-gray-400 text-xs ml-1">Ar</span>
                            </td>

                            {/* PU client */}
                            <td className="px-4 py-3 text-sm font-bold text-indigo-700">
                              {ligne.puClientAriary.toLocaleString('fr-FR')}
                              <span className="text-indigo-400 text-xs ml-1">Ar</span>
                            </td>

                            {/* Devise */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md">
                                {ligne.devise}
                              </span>
                            </td>

                            {/* Taux */}
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {ligne.tauxEchange.toLocaleString('fr-FR')}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* ── Onglet Suivi ── */}
      {activeTabSousSection === 'suivi' && (
        <SuiviTabSection
          prestationId={prestationId}
        />
      )}

      {/* Modals */}
      {ligneModalEnteteId && (
        <CreateProspectionLigneModal
          enteteId={ligneModalEnteteId}
          prestationId={prestationId}
          onClose={() => setLigneModalEnteteId(null)}
        />
      )}
      {devisModalEntete && (
        <CreateDevisModal
          enteteId={devisModalEntete.id}
          prestationId={prestationId}
          lignes={devisModalEntete.lignes}
          onClose={() => setDevisModalEntete(null)}
        />
      )}
    </div>
  );
};

export default ProspectionTab;