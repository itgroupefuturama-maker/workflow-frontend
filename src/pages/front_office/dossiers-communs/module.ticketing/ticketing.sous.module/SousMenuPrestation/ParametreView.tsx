import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { fetchServiceSpecifiques } from '../../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import { fetchExigences } from '../../../../../../app/front_office/parametre_ticketing/exigenceSlice';
import { fetchDestinations } from '../../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays, fetchPaysDetails, clearSelectedPays } from '../../../../../../app/front_office/parametre_ticketing/paysSlice';
import ServiceSpecifiqueModal from '../../../../../../components/modals/ServiceSpecifiqueModal';
import ExigenceModal from '../../../../../../components/modals/ExigenceModal';
import PaysModal from '../../../../../../components/modals/PaysModal';
import DestinationModal from '../../../../../../components/modals/DestinationModal';
import AssociationModal from '../../../../../../components/modals/AssociationModal';
import TabContainer from '../../../../../../layouts/TabContainer';
import { useLocation, useParams } from 'react-router-dom';
import { fetchRaisonsAnnulation } from '../../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import RaisonAnnulationListe from './RaisonAnnulationListe';
// import RaisonAnnulationModal from '../../../../../../components/modals/RaisonAnnulationModal';
import GestionPrixListe from '../../../module.attestation.voyage/SousMenuPrestation/GestionPrixListe';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ParametreView() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { module } = useParams<{ module: string}>();

  // console.log(module);
  

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'listeRaisonAnnulation');
  const raisonState = useSelector((state: RootState) => state.raisonAnnulation);

  const tabsTicketing = [
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
    { id: 'listeService', label: 'Services & Spécifiques' },
    { id: 'listeExigence', label: 'Exigences de Voyage' },
  ];

  const tabsAttestation = [
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
    { id: 'listeExigence', label: 'Exigences de Voyage' },
    { id: 'gestionPrix', label: 'Gestion de prix' },
  ];

  useEffect(() => {
    if (activeTab === 'listeService' && serviceState.items.length === 0) {
      dispatch(fetchServiceSpecifiques());
    }
    if (activeTab === 'listeExigence') {
      if (activeSubTab === 'exigence' && exigenceState.items.length === 0) dispatch(fetchExigences());
      if (activeSubTab === 'pays' && paysState.items.length === 0) dispatch(fetchPays());
      if (activeSubTab === 'destination' && destinationState.items.length === 0) dispatch(fetchDestinations());
    }
   if (activeTab === 'listeRaisonAnnulation' && raisonState.items.length === 0) {
    dispatch(fetchRaisonsAnnulation());
    }
  }, [dispatch, activeTab]);   // ← activeSubTab reste pour l'onglet Exigence

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => {
        setActiveTab(location.state.targetTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const [activeSubTab, setActiveSubTab] = useState<'exigence' | 'pays' | 'destination'>('exigence');
  const [selectedPaysId, setSelectedPaysId] = useState<string | null>(null);
  const [activePaysTab, setActivePaysTab] = useState('destinations');

  // Modals
  const [modalServiceOpen, setModalServiceOpen] = useState(false);
  const [modalExigenceOpen, setModalExigenceOpen] = useState(false);
  const [modalPaysOpen, setModalPaysOpen] = useState(false);
  const [modalDestinationOpen, setModalDestinationOpen] = useState(false);
  const [modalAssociationOpen, setModalAssociationOpen] = useState(false);

  // Selectors
  const serviceState = useSelector((state: RootState) => state.serviceSpecifique);
  const exigenceState = useSelector((state: RootState) => state.exigence);
  const destinationState = useSelector((state: RootState) => state.destination);
  const paysState = useSelector((state: RootState) => state.pays);
  const assocState = useSelector((state: RootState) => state.associationsPaysVoyage);
  
  const paysDetails = useSelector((state: RootState) => state.pays.selectedPaysDetails);
  const detailsLoading = useSelector((state: RootState) => state.pays.detailsLoading);
  const detailsError = useSelector((state: RootState) => state.pays.error);

  useEffect(() => {
    if (activeSubTab === 'pays' && selectedPaysId) {
      dispatch(fetchPaysDetails(selectedPaysId));
    } else {
      dispatch(clearSelectedPays());
    }
  }, [selectedPaysId, activeSubTab, dispatch]);

  const getTableConfig = () => {
    if (activeTab === 'listeService') {
      return {
        headers: ['Code', 'Libellé', 'Type', 'Créé le'],
        renderRow: (item: any) => (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.code}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.libelle}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs ${item.type === 'SPECIFIQUE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{item.type}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
          </>
        )
      };
    }
    
    if (activeSubTab === 'exigence') {
      return {
        headers: ['Type', 'Description', 'Périmètre', 'Créé le'],
        renderRow: (item: any) => (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.type}</td>
            <td className="px-6 py-4 text-sm">{item.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.perimetre}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
          </>
        )
      };
    }

    if (activeSubTab === 'pays') {
      return {
        headers: ['Pays', 'Photo', 'Destinations', 'Créé le'],
        renderRow: (item: any) => (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => setSelectedPaysId(item.id)}>{item.pays}</td>
            <td className="px-6 py-4">
              {item.photo ? <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060/'}${item.photo}`} className="h-10 w-14 object-cover rounded shadow-sm" /> : <span className="text-slate-400">N/A</span>}
            </td>
            <td className="px-6 py-4 text-sm">{item.DestinationVoyage?.length || 0} destination(s)</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
          </>
        )
      };
    }

    return {
      headers: ['Code', 'Pays', 'Ville', 'Créé le'],
      renderRow: (item: any) => (
        <>
          <td className="px-6 py-4 text-sm font-medium">{item.code}</td>
          <td className="px-6 py-4 text-sm">{item.pays?.pays}</td>
          <td className="px-6 py-4 text-sm">{item.ville}</td>
          <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
        </>
      )
    };
  };

  const getCurrentData = () => {
    if (activeTab === 'listeService') return serviceState;
    if (activeSubTab === 'exigence') return exigenceState;
    if (activeSubTab === 'pays') return paysState;
    return destinationState;
  };

  const { items: currentItems, loading } = getCurrentData();
  const tableConfig = getTableConfig();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <TabContainer
        tabs={module === 'ticketing' ? tabsTicketing : tabsAttestation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        {/* ══ PAGE HEADER ══ */}
        <div className="mt-5 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              Paramétrage — {module}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gérez les paramètres du module {module}
            </p>
          </div>
        </div>

        <div className="mt-2">

          {/* ══════════════════════════════════════
              TAB : SERVICES
          ══════════════════════════════════════ */}
          {activeTab === 'listeService' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Services & Spécifiques</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{currentItems.length} service{currentItems.length > 1 ? 's' : ''} enregistré{currentItems.length > 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setModalServiceOpen(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span className="text-lg leading-none">+</span>
                  Nouveau service
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">Chargement des services...</span>
                  </div>
                ) : currentItems.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Aucun service enregistré</p>
                  </div>
                ) : (
                  <>
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          {tableConfig.headers.map(h => (
                            <th key={h} className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentItems.map((item, index) => (
                          <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors duration-150">
                            {tableConfig.renderRow(item, index)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">{currentItems.length} résultat{currentItems.length > 1 ? 's' : ''}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB : RAISON ANNULATION
          ══════════════════════════════════════ */}
          {activeTab === 'listeRaisonAnnulation' && (
            <RaisonAnnulationListe />
          )}

          {/* ══════════════════════════════════════
              TAB : GESTION PRIX
          ══════════════════════════════════════ */}
          {activeTab === 'gestionPrix' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Gestion de prix</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configurez les grilles tarifaires</p>
              </div>
              <GestionPrixListe />
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB : EXIGENCES
          ══════════════════════════════════════ */}
          {activeTab === 'listeExigence' && (
            <div className="space-y-5">

              {/* Header + bouton */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Exigences de voyage</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Gérez les exigences, pays et destinations</p>
                </div>
                <button
                  onClick={() => {
                    if (activeSubTab === 'exigence') setModalExigenceOpen(true);
                    else if (activeSubTab === 'destination') setModalDestinationOpen(true);
                    else if (activeSubTab === 'pays') setModalPaysOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span className="text-lg leading-none">+</span>
                  {activeSubTab === 'exigence' ? 'Nouvelle exigence' : activeSubTab === 'pays' ? 'Nouveau pays' : 'Nouvelle destination'}
                </button>
              </div>

              {/* Synthèse associations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Synthèse des associations</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{assocState.items.length} association{assocState.items.length > 1 ? 's' : ''} configurée{assocState.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => setModalAssociationOpen(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200"
                  >
                    <span className="text-sm leading-none">+</span>
                    Nouvelle association
                  </button>
                </div>

                {assocState.items.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400">Aucune association configurée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {assocState.items.slice(0, 3).map(assoc => (
                      <div key={assoc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-indigo-600 text-xs font-bold">✈</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{assoc.exigenceVoyage.type}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">→ {assoc.pays.pays}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sous-navigation */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(['exigence', 'pays', 'destination'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => { setActiveSubTab(sub); setSelectedPaysId(null); }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
                      activeSubTab === sub
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {sub === 'exigence' ? 'Exigences' : sub === 'pays' ? 'Pays' : 'Destinations'}
                  </button>
                ))}
              </div>

              {/* Table ou détail pays */}
              {!selectedPaysId ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">Chargement...</span>
                    </div>
                  ) : currentItems.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">Aucun élément trouvé</p>
                    </div>
                  ) : (
                    <>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70">
                            {tableConfig.headers.map(h => (
                              <th key={h} className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentItems.map((item, index) => (
                            <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors duration-150">
                              {tableConfig.renderRow(item, index)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">{currentItems.length} résultat{currentItems.length > 1 ? 's' : ''}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Détail Pays ── */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {detailsLoading ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">Chargement des détails...</span>
                    </div>
                  ) : detailsError ? (
                    <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      Erreur : {detailsError}
                    </div>
                  ) : paysDetails ? (
                    <>
                      {/* Header pays */}
                      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
                        {paysDetails.photo && (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060/'}${paysDetails.photo}`}
                            alt={paysDetails.pays}
                            className="h-12 w-16 object-cover rounded-xl shadow-sm"
                          />
                        )}
                        <div>
                          <h3 className="text-base font-bold text-slate-800">{paysDetails.pays}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {paysDetails.DestinationVoyage?.length || 0} destination{(paysDetails.DestinationVoyage?.length || 0) > 1 ? 's' : ''} · {paysDetails.paysVoyage?.length || 0} exigence{(paysDetails.paysVoyage?.length || 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedPaysId(null)}
                          className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                        >
                          ← Retour
                        </button>
                      </div>

                      {/* Sous-tabs pays */}
                      <div className="px-6 pt-4">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                          {['destinations', 'exigences'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActivePaysTab(tab)}
                              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
                                activePaysTab === tab
                                  ? 'bg-white text-slate-800 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {tab} ({tab === 'destinations' ? paysDetails.DestinationVoyage?.length : paysDetails.paysVoyage?.length || 0})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Contenu sous-tab */}
                      <div className="p-6">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70">
                              {activePaysTab === 'destinations'
                                ? ['Code', 'Ville'].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>)
                                : ['Type', 'Description'].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>)
                              }
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activePaysTab === 'destinations'
                              ? paysDetails.DestinationVoyage?.map((dest: { id: string; code: string; ville: string }) => (
                                  <tr key={dest.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono font-bold text-indigo-600">{dest.code}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{dest.ville}</td>
                                  </tr>
                                ))
                              : paysDetails.paysVoyage?.map((assoc: any) => (
                                  <tr key={assoc.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{assoc.exigenceVoyage.type}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{assoc.exigenceVoyage.description}</td>
                                  </tr>
                                ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

        </div>
      </TabContainer>

      {/* ══ MODALS ══ */}
      <ServiceSpecifiqueModal isOpen={modalServiceOpen} onClose={() => setModalServiceOpen(false)} />
      <ExigenceModal isOpen={modalExigenceOpen} onClose={() => setModalExigenceOpen(false)} />
      <PaysModal isOpen={modalPaysOpen} onClose={() => setModalPaysOpen(false)} />
      <DestinationModal isOpen={modalDestinationOpen} onClose={() => setModalDestinationOpen(false)} />
      <AssociationModal isOpen={modalAssociationOpen} onClose={() => setModalAssociationOpen(false)} />
    </div>
  );
}