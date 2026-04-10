import { useEffect, useState } from 'react';
import { FiPlus, FiClock, FiActivity, FiTag, FiFileText, FiArrowRight, FiHash } from 'react-icons/fi';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import TabContainer from '../../../../../../layouts/TabContainer';
import type { RootState } from '../../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBilletsByDossierCommun, type BilletEntete } from '../../../../../../app/front_office/billetSlice';
import DossierActifCard from '../../../../../../components/CarteDossierActif/DossierActifCard';
import { TicketingHeader } from '../components.billet/TicketingHeader';
import { billetListeItems, prospectionListeItems } from '../components.billet/utils/ticketingHeaderItems';
import SuiviTabSection from '../../../module.suivi/SuiviTabSection';
import BeneficiaireListPage from '../../../module.client.beneficiaire/BeneficiaireListPage';

interface PrestationContext {
  prestationId: string;
  entetes: any[];
  loadingEntetes: boolean;
  errorEntetes: string | null;
  openCreateModal: () => void;
  openEditModal: (entete: any) => void;
}

export default function PageView() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const dossierId = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId?.id);
  const clientFactureId = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture.id);
  
  const { prestationId, entetes, loadingEntetes, errorEntetes, openCreateModal, openEditModal } =
    useOutletContext<PrestationContext>();

  const { list: billets, loadingList: loadingBillets, errorList: errorBillets } =
    useSelector((state: RootState) => state.billet);

  const [activeTab, setActiveTab] = useState('prospection');

  const [sortEntetes, setSortEntetes] = useState<'desc' | 'asc'>('desc');
  const [sortBillets, setSortBillets] = useState<'desc' | 'asc'>('desc');


  useEffect(() => {
    if (dossierId && activeTab === 'billet') {
      dispatch(fetchBilletsByDossierCommun(dossierId) as any);
    }
  }, [dossierId, activeTab, dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet',      label: 'Listes des billets'            },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' },
  ];

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  // ── Statut badge ──────────────────────────────────────────────────
  const statutBadge = (statut: string) => {
    const map: Record<string, string> = {
      CREER:                 'bg-amber-100 text-amber-700 border-amber-200',
      BC_CLIENT_A_APPROUVER: 'bg-violet-100 text-violet-700 border-violet-200',
    };
    return map[statut] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const statutLabel = (statut: string) => {
    if (statut === 'CREER') return 'Créé';
    return statut.replace(/_/g, ' ');
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} >

        {/* ══════════════════════════════════════════
            ONGLET PROSPECTION
        ══════════════════════════════════════════ */}
        {activeTab === 'prospection' ? (
          <div className="flex h-full min-h-0 overflow-hidden">
            {/* ── Colonne principale ── */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="shrink-0 px-4 bg-white">
                <div className='flex items-center justify-between'>
                  <TicketingHeader items={prospectionListeItems()} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSortEntetes(o => o === 'desc' ? 'asc' : 'desc')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        className={`transition-transform duration-200 ${sortEntetes === 'asc' ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
                      </svg>
                      {sortEntetes === 'desc' ? 'Plus récent' : 'Plus ancien'}
                    </button>
                    <button
                      onClick={openCreateModal}
                      className="shrink-0 inline-flex items-center gap-2 bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all"
                    >
                      <FiPlus size={15} /> Ajouter un en-tête
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Carte dossier actif ── */}
              <div className='px-4 border-b border-neutral-50'>
                <DossierActifCard gradient="from-orange-400 via-red-400 to-orange-500 " />

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
                        Liste des Benchmarking ({entetes.length})
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
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
                {/* ── États de chargement ── */}
                {activeTabSousSection === 'lignes' && (
                  <div className="bg-white space-y-4 overflow-hidden">
                    {loadingEntetes ? (
                      <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                          <FiTag className="text-white" size={18} />
                        </div>
                        <p className="text-sm text-slate-400 animate-pulse">Chargement des en-têtes...</p>
                      </div>
                    ) : errorEntetes ? (
                      <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
                        {errorEntetes}
                      </div>
                    ) : entetes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                          <FiClock className="text-slate-300" size={28} />
                        </div>
                        <p className="text-base font-semibold text-slate-500 mb-1">Aucun en-tête de prospection</p>
                        <p className="text-sm text-slate-400 mb-4">Cliquez sur le bouton ci-dessus pour commencer.</p>
                        <button
                          onClick={openCreateModal}
                          className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                        >
                          <FiPlus size={15} /> Ajouter un en-tête
                        </button>
                      </div>
                    ) : (
                      /* ── Tableau entêtes ── */
                      <div className="bg-white rounded-br-xl rounded-bl-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead>
                              <tr className="bg-slate-50">
                                {['N° En-tête', 'Type Vol', 'Fournisseur', 'Crédit', 'Comm. proposée', 'Comm. appliquée', 'Créé le', 'Actions'].map(h => (
                                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {[...entetes]
                                .sort((a, b) => {
                                  const dateA = new Date(a.createdAt).getTime();
                                  const dateB = new Date(b.createdAt).getTime();
                                  return sortEntetes === 'desc' ? dateB - dateA : dateA - dateB;
                                })
                                .map((entete) => (
                                <tr key={entete.id} className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                                  onClick={() => navigate(`/dossiers-communs/ticketing/pages/prospection/${entete.id}`)}
                                  >
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                      <FiHash size={12} className="text-slate-400" />
                                      {entete.numeroEntete}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                      {entete.typeVol}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                                    {entete.fournisseur?.libelle || entete.fournisseurId}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                                    {entete.credit}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-slate-700">{entete.commissionPropose}
                                      <span className="text-xs text-slate-400 font-normal"> %</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="text-sm font-bold text-indigo-600">{entete.commissionAppliquer}
                                      <span className="text-xs text-indigo-400 font-normal"> %</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-medium">
                                    {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openEditModal(entete)}
                                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                      >
                                        Modifier
                                      </button>
                                      <button
                                        
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                      >
                                        Détail <FiArrowRight size={11} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* ── Onglet Suivi ── */}
                {activeTabSousSection === 'suivi' && (
                  <SuiviTabSection
                    prestationId={prestationId}
                  />
                )}
              </div>
            </div>
          </div>

        ) : activeTab === 'billet' ? (
          <div className="flex h-full min-h-0 overflow-hidden">
            {/* ── Colonne principale ── */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* ── Header fixe — ne scrolle PAS ── */}
              <div className="shrink-0 px-4 bg-white">
                <div className='flex items-center justify-between'>
                  <TicketingHeader items={billetListeItems()} />
                  <button
                    onClick={() => setSortBillets(o => o === 'desc' ? 'asc' : 'desc')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      className={`transition-transform duration-200 ${sortBillets === 'asc' ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                    {sortBillets === 'desc' ? 'Plus récent' : 'Plus ancien'}
                  </button>
                </div>
              </div>
              <div className='px-4 border-b border-neutral-50'>
                <DossierActifCard gradient="from-amber-400 via-orange-400 to-amber-500" />
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
                        Liste des billets
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
                </div>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
                {activeTabSousSection === 'lignes' && (
                  <div className="bg-white space-y-4 overflow-hidden">
                    {loadingBillets ? (
                      <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                          <FiFileText className="text-white" size={18} />
                        </div>
                        <p className="text-sm text-slate-400 animate-pulse">Chargement des billets...</p>
                      </div>
                    ) : errorBillets ? (
                      <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
                        {errorBillets}
                      </div>
                    ) : billets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                          <FiActivity className="text-slate-300" size={28} />
                        </div>
                        <p className="text-base font-semibold text-slate-500 mb-1">Aucun billet pour ce dossier</p>
                        <p className="text-sm text-slate-400">Les billets apparaîtront ici une fois générés.</p>
                      </div>
                    ) : (
                      /* ── Tableau billets ── */
                      <div className="bg-white rounded-br-xl rounded-bl-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead>
                              <tr className="bg-slate-50">
                                {['N° Billet', 'N° Devis', 'N° En-tête', 'Statut', 'Comm. appl.', 'Nb lignes', 'Créé le', 'Actions'].map(h => (
                                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {[...billets]
                                .sort((a, b) => {
                                  const dateA = new Date(a.createdAt).getTime();
                                  const dateB = new Date(b.createdAt).getTime();
                                  return sortBillets === 'desc' ? dateB - dateA : dateA - dateB;
                                })
                                .map((billet: BilletEntete) => (
                                <tr
                                  key={billet.id}
                                  className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                  onClick={() => navigate(`/dossiers-communs/ticketing/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`)}
                                >
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                      <FiHash size={12} className="text-slate-400" />
                                      {billet.numeroBillet}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">
                                    {billet.devis?.reference || '—'}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">
                                    {billet.prospectionEntete?.numeroEntete || '—'}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap uppercase">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statutBadge(billet.statut)}`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 " />
                                      {statutLabel(billet.statut)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="text-sm font-bold text-indigo-600">{billet.commissionAppliquer}
                                      <span className="text-xs text-indigo-400 font-normal"> %</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                      {billet.billetLigne?.length || 0}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-medium">
                                    {new Date(billet.createdAt).toLocaleDateString('fr-FR')}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/dossiers-communs/ticketing/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                      Voir <FiArrowRight size={11} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* ── Onglet Suivi ── */}
                {activeTabSousSection === 'suivi' && (
                  <SuiviTabSection
                    prestationId={prestationId}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {clientFactureId ? (
              <>
                <BeneficiaireListPage clientFactureId={clientFactureId} />
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Aucun client facturé sélectionné.
              </div>
            )}
          </div>
      )}
      </TabContainer>
    </div>
  );
}