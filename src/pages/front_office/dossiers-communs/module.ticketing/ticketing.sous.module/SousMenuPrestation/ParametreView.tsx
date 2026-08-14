import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { fetchPaysDetails, clearSelectedPays } from '../../../../../../app/front_office/parametre_ticketing/paysSlice';
import ServiceSpecifiqueModal from '../../../../../../components/modals/ServiceSpecifiqueModal';
import ExigenceModal from '../../../../../../components/modals/ExigenceModal';
import PaysModal from '../../../../../../components/modals/PaysModal';
import DestinationModal from '../../../../../../components/modals/DestinationModal';
import AssociationModal from '../../../../../../components/modals/AssociationModal';
import TabContainer from '../../../../../../layouts/TabContainer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RaisonAnnulationListe from '../../../module.parametre/RaisonAnnulation/RaisonAnnulationListe';
import GestionPrixListe from '../../../module.attestation.voyage/SousMenuPrestation/GestionPrixListe';
import ServiceSpecifiqueListe from '../../../module.parametre/ServiceSpecifique/ServiceSpecifiqueListe';
import { API_URL } from '../../../../../../service/env';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ParametreView() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { module } = useParams<{ module: string }>();

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'listeRaisonAnnulation');

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
    if (location.state?.targetTab) {
      const timer = setTimeout(() => {
        setActiveTab(location.state.targetTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  // ── Nouvel état pour la section "Exigences de voyage" ──
  const [viewMode, setViewMode] = useState<'parPays' | 'catalogue'>('parPays');
  const [paysSearch, setPaysSearch] = useState('');
  const [selectedPaysId, setSelectedPaysId] = useState<string | null>(null);
  const [activePaysTab, setActivePaysTab] = useState<'destinations' | 'exigences'>('destinations');

  // Modals
  const [modalServiceOpen, setModalServiceOpen] = useState(false);
  const [modalExigenceOpen, setModalExigenceOpen] = useState(false);
  const [modalPaysOpen, setModalPaysOpen] = useState(false);
  const [modalDestinationOpen, setModalDestinationOpen] = useState(false);
  const [modalAssociationOpen, setModalAssociationOpen] = useState(false);

  // Selectors
  const exigenceState = useSelector((state: RootState) => state.exigence);
  const destinationState = useSelector((state: RootState) => state.destination);
  const paysState = useSelector((state: RootState) => state.pays);

  const paysDetails = useSelector((state: RootState) => state.pays.selectedPaysDetails);
  const detailsLoading = useSelector((state: RootState) => state.pays.detailsLoading);
  const detailsError = useSelector((state: RootState) => state.pays.error);

  // Sélectionne automatiquement le 1er pays de la liste au premier chargement
  useEffect(() => {
    if (viewMode === 'parPays' && !selectedPaysId && paysState.items.length > 0) {
      setSelectedPaysId(paysState.items[0].id);
    }
  }, [viewMode, paysState.items, selectedPaysId]);

  useEffect(() => {
    if (viewMode === 'parPays' && selectedPaysId) {
      dispatch(fetchPaysDetails(selectedPaysId));
    } else {
      dispatch(clearSelectedPays());
    }
  }, [selectedPaysId, viewMode, dispatch]);

  const filteredPays = paysState.items.filter((p: any) =>
    p.pays?.toLowerCase().includes(paysSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer
        tabs={module === 'ticketing' ? tabsTicketing : tabsAttestation}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      >
        <div className="py-2 px-4">
          <div className="mt-2">
            {/* ══════════════════════════════════════
                TAB : SERVICES
            ══════════════════════════════════════ */}
            {activeTab === 'listeService' && (
              <ServiceSpecifiqueListe typeService="TICKET" />
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
                TAB : EXIGENCES DE VOYAGE (restructuré)
            ══════════════════════════════════════ */}
            {activeTab === 'listeExigence' && (
              <div className="space-y-4">

                {/* Header + toggle de vue */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Exigences de voyage</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Gérez les exigences, pays et destinations</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setViewMode('parPays')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        viewMode === 'parPays'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Vue par pays
                    </button>
                    <button
                      onClick={() => setViewMode('catalogue')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        viewMode === 'catalogue'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Catalogue
                    </button>
                  </div>
                </div>

                {viewMode === 'parPays' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

                    {/* ── Colonne gauche : liste des pays ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-slate-100 space-y-2">
                        <input
                          type="text"
                          value={paysSearch}
                          onChange={(e) => setPaysSearch(e.target.value)}
                          placeholder="Rechercher un pays"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        />
                        <button
                          onClick={() => setModalPaysOpen(true)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-sm transition-all duration-200"
                        >
                          <span className="text-sm leading-none">+</span>
                          Nouveau pays
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-[560px]">
                        {paysState.loading ? (
                          <div className="py-10 flex justify-center">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                          </div>
                        ) : filteredPays.length === 0 ? (
                          <div className="py-10 text-center text-xs text-slate-400">Aucun pays trouvé</div>
                        ) : (
                          filteredPays.map((p: any) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedPaysId(p.id)}
                              className={`w-full text-left px-4 py-2.5 border-t border-slate-100 first:border-t-0 transition-colors ${
                                selectedPaysId === p.id
                                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <p className={`text-sm font-medium ${selectedPaysId === p.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                {p.pays}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {p.DestinationVoyage?.length || 0} destination{(p.DestinationVoyage?.length || 0) > 1 ? 's' : ''} · {p.paysVoyage?.length || 0} exigence{(p.paysVoyage?.length || 0) > 1 ? 's' : ''}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* ── Colonne droite : détail du pays sélectionné ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      {!selectedPaysId ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <span className="text-2xl">🌍</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-500">Sélectionnez un pays</p>
                          <p className="text-xs text-slate-400">pour voir ses destinations et exigences</p>
                        </div>
                      ) : detailsLoading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                          <span className="text-xs text-slate-400">Chargement des détails...</span>
                        </div>
                      ) : detailsError ? (
                        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                          Erreur : {detailsError}
                        </div>
                      ) : paysDetails ? (
                        <>
                          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                            {paysDetails.photo && (
                              <img
                                src={`${API_URL}/${paysDetails.photo}`}
                                alt={paysDetails.pays}
                                className="h-12 w-16 object-cover rounded-xl shadow-sm"
                              />
                            )}
                            <div>
                              <h3 className="text-base font-bold text-slate-800">{paysDetails.pays}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {paysDetails.DestinationVoyage?.length || 0} destination{(paysDetails.DestinationVoyage?.length || 0) > 1 ? 's' : ''} · {paysDetails.paysVoyage?.length || 0} exigence{(paysDetails.paysVoyage?.length || 0) > 1 ? 's' : ''} associée{(paysDetails.paysVoyage?.length || 0) > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="px-6 pt-4 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                              {(['destinations', 'exigences'] as const).map((tab) => (
                                <button
                                  key={tab}
                                  onClick={() => setActivePaysTab(tab)}
                                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                    activePaysTab === tab
                                      ? 'bg-white text-slate-800 shadow-sm'
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  {tab === 'destinations' ? 'Destinations' : 'Exigences'} (
                                  {tab === 'destinations'
                                    ? paysDetails.DestinationVoyage?.length || 0
                                    : paysDetails.paysVoyage?.length || 0}
                                  )
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                // "Associer une exigence" réutilise la modal Association existante,
                                // "Ajouter une destination" réutilise la modal Destination existante.
                                if (activePaysTab === 'destinations') setModalDestinationOpen(true);
                                else setModalAssociationOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200"
                            >
                              <span className="text-sm leading-none">+</span>
                              {activePaysTab === 'destinations' ? 'Ajouter une destination' : 'Associer une exigence'}
                            </button>
                          </div>

                          <div className="p-6">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                  {activePaysTab === 'destinations'
                                    ? ['Code', 'Ville', ''].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                      ))
                                    : ['Type', 'Description', ''].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                      ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {activePaysTab === 'destinations'
                                  ? paysDetails.DestinationVoyage?.map((dest: { id: string; code: string; ville: string }) => (
                                      <tr key={dest.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono font-bold text-indigo-600">{dest.code}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{dest.ville}</td>
                                        <td className="px-4 py-3 text-right">
                                          {/* TODO: dispatch(deleteDestination(dest.id)) puis refetch */}
                                          <button className="text-slate-300 hover:text-red-500 transition-colors" title="Retirer">✕</button>
                                        </td>
                                      </tr>
                                    ))
                                  : paysDetails.paysVoyage?.map((assoc: any) => (
                                      <tr key={assoc.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{assoc.exigenceVoyage.type}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{assoc.exigenceVoyage.description}</td>
                                        <td className="px-4 py-3 text-right">
                                          {/* TODO: dispatch(deleteAssociation(assoc.id)) puis refetch */}
                                          <button className="text-slate-300 hover:text-red-500 transition-colors" title="Dissocier">✕</button>
                                        </td>
                                      </tr>
                                    ))}
                                {((activePaysTab === 'destinations' && (paysDetails.DestinationVoyage?.length || 0) === 0) ||
                                  (activePaysTab === 'exigences' && (paysDetails.paysVoyage?.length || 0) === 0)) && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                                      Aucun élément pour ce pays
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  /* ── Vue Catalogue ── */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Catalogue des exigences</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {exigenceState.items.length} type{exigenceState.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setModalExigenceOpen(true)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200"
                        >
                          <span className="text-sm leading-none">+</span>
                          Nouvelle exigence
                        </button>
                      </div>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70">
                            {['Type', 'Description', 'Périmètre'].map((h) => (
                              <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {exigenceState.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3 text-sm font-medium">{item.type}</td>
                              <td className="px-5 py-3 text-sm text-slate-500">{item.description}</td>
                              <td className="px-5 py-3 text-sm">{item.perimetre}</td>
                            </tr>
                          ))}
                          {exigenceState.items.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400">Aucune exigence</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Catalogue des destinations</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {destinationState.items.length} destination{destinationState.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setModalDestinationOpen(true)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200"
                        >
                          <span className="text-sm leading-none">+</span>
                          Nouvelle destination
                        </button>
                      </div>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70">
                            {['Code', 'Pays', 'Ville'].map((h) => (
                              <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {destinationState.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3 text-sm font-mono font-medium">{item.code}</td>
                              <td className="px-5 py-3 text-sm">{item.pays?.pays}</td>
                              <td className="px-5 py-3 text-sm">{item.ville}</td>
                            </tr>
                          ))}
                          {destinationState.items.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400">Aucune destination</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </TabContainer>

      {/* ══ MODALS ══ */}
      <ServiceSpecifiqueModal isOpen={modalServiceOpen} onClose={() => setModalServiceOpen(false)} typeService="TICKET" />
      <ExigenceModal isOpen={modalExigenceOpen} onClose={() => setModalExigenceOpen(false)} />
      <PaysModal isOpen={modalPaysOpen} onClose={() => setModalPaysOpen(false)} />
      <DestinationModal isOpen={modalDestinationOpen} onClose={() => setModalDestinationOpen(false)} />
      <AssociationModal
        isOpen={modalAssociationOpen}
        onClose={() => setModalAssociationOpen(false)}
        defaultPaysId={selectedPaysId}
      />
    </div>
  );
}