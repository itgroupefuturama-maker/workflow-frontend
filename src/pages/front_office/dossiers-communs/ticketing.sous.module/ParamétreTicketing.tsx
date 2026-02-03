// ────────────────────────────────────────────────────────────────
// Imports (ajouts en évidence)
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';

import { fetchServiceSpecifiques } from '../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import { fetchExigences } from '../../../../app/front_office/parametre_ticketing/exigenceSlice';
import { fetchDestinations } from '../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays, fetchPaysDetails, clearSelectedPays } from '../../../../app/front_office/parametre_ticketing/paysSlice';
import { fetchAssociationsPaysVoyage } from '../../../../app/front_office/parametre_ticketing/associationsPaysVoyageSlice';
import ServiceSpecifiqueModal from '../../../../components/modals/ServiceSpecifiqueModal';
import ExigenceModal from '../../../../components/modals/ExigenceModal';
import PaysModal from '../../../../components/modals/PaysModal';
import DestinationModal from '../../../../components/modals/DestinationModal';
import AssociationModal from '../../../../components/modals/AssociationModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ParametreTicketing() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [selectedPaysId, setSelectedPaysId] = useState<string | null>(null);

  // Onglet principal
  const [activeTab, setActiveTab] = useState<'services' | 'exigences'>('services');

  // Sous-onglets (ajout 'pays')
  const [activeSubTab, setActiveSubTab] = useState<'exigence' | 'pays' | 'destination'>('exigence');

  const [activePaysTab, setActivePaysTab] = useState('destinations');

  // Charger les détails quand un pays est sélectionné
  useEffect(() => {
    if (activeSubTab === 'pays' && selectedPaysId) {
      dispatch(fetchPaysDetails(selectedPaysId));
    } else {
      dispatch(clearSelectedPays());
    }
  }, [selectedPaysId, activeSubTab, dispatch]);

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

  // Chargement des données
  useEffect(() => {
    if (activeTab === 'services' && serviceState.items.length === 0) {
      dispatch(fetchServiceSpecifiques());
    }

    if (activeTab === 'exigences') {
      // Chargement forcé de la synthèse
      if (assocState.items.length === 0 && !assocState.loading) {
        dispatch(fetchAssociationsPaysVoyage());
      }

      if (activeSubTab === 'exigence' && exigenceState?.items?.length === 0) {
        dispatch(fetchExigences());
      }
      if (activeSubTab === 'pays' && paysState?.items?.length === 0) {
        dispatch(fetchPays());
      }
      if (activeSubTab === 'destination' && destinationState?.items?.length === 0) {
        dispatch(fetchDestinations());
      }
    }
  }, [dispatch, activeTab, activeSubTab]);

  // Sélection des items + loading + error selon onglet actif
  const getCurrentData = () => {
    if (activeTab === 'services') return serviceState;
    if (activeSubTab === 'exigence') return exigenceState;
    if (activeSubTab === 'pays') return paysState;
    if (activeSubTab === 'destination') return destinationState;
    return { items: [], loading: false, error: null };
  };

  const { items: currentItems, loading, error } = getCurrentData();
  const associations = assocState.items || [];
  const assocLoading = assocState.loading;
  const assocError = assocState.error;

  // ═══════════════════════════════════════════════════════════════
  // FONCTION DE CONFIGURATION DU TABLEAU (AJOUT)
  // ═══════════════════════════════════════════════════════════════
  const getTableConfig = () => {
    if (activeTab === 'services') {
      return {
        headers: ['Code', 'Libellé', 'Type', 'Créé le'],
        renderRow: (item: any) => (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.code}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.libelle}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                item.type === 'SPECIFIQUE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {item.type}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </td>
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
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </td>
          </>
        )
      };
    }
    
    if (activeSubTab === 'pays') {
      return {
        headers: ['Pays', 'Photo', 'Destinations', 'Créé le'],
        renderRow: (item: any) => (
          <>
            <td 
              className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setSelectedPaysId(item.id)}
            >
              {item.pays}
            </td>
            <td className="px-6 py-4">
              {item.photo ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060/'}${item.photo}`}
                  alt={item.pays}
                  className="h-12 w-16 object-cover rounded shadow-sm"
                />
              ) : (
                <span className="text-slate-400 text-sm">Aucune photo</span>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-slate-700">
              {item.DestinationVoyage?.length || 0} destination(s)
              {item.DestinationVoyage?.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  {item.DestinationVoyage.map((d: any) => d.ville).slice(0, 3).join(', ')}
                  {item.DestinationVoyage.length > 3 && ' ...'}
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </td>
          </>
        )
      };
    }
    
    // Destinations par défaut
    return {
      headers: ['Code', 'Pays', 'Ville', 'Créé le'],
      renderRow: (item: any) => (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.code}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.pays.pays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.ville}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </td>
        </>
      )
    };
  };

  const tableConfig = getTableConfig();
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 mx-auto font-sans text-slate-900">
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
        </button>

        <button
          onClick={() => {
            if (activeTab === 'services') setModalServiceOpen(true);
            else if (activeSubTab === 'exigence') setModalExigenceOpen(true);
            else if (activeSubTab === 'destination') setModalDestinationOpen(true);
            else if (activeSubTab === 'pays') setModalPaysOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium">{activeTab === 'services' ? 'Nouveau Service' : `Nouvelle ${activeSubTab}`}</span>
        </button>
      </header>

      <h1 className="text-3xl font-bold mb-6">Paramétrage Ticketing</h1>

      {/* Onglets principaux */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-4 text-sm font-medium ${
              activeTab === 'services' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Services & Spécifiques
          </button>
          <button
            onClick={() => setActiveTab('exigences')}
            className={`pb-4 text-sm font-medium ${
              activeTab === 'exigences' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Exigences de Voyage
          </button>
        </nav>
      </div>

      {/* Section Synthèse */}
      {activeTab === 'exigences' && (
        <div className="mb-6 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              Synthèse des exigences par destination
            </h2>
            <button
              onClick={() => setModalAssociationOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              disabled={assocLoading}
            >
              + Nouvelle association
            </button>
          </div>

          {assocLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
            </div>
          ) : assocError ? (
            <div className="text-red-600 text-sm">{assocError}</div>
          ) : associations.length === 0 ? (
            <div className="text-slate-500 text-sm py-4">
              Aucune association exigence ↔ destination enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <strong>Total associations :</strong> {associations.length}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {associations.slice(0, 6).map((assoc) => (
                  <div
                    key={assoc.id}
                    className="border border-slate-200 rounded p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="font-medium text-slate-800">
                      {assoc.exigenceVoyage.type} – {assoc.exigenceVoyage.description.slice(0, 60)}
                      {assoc.exigenceVoyage.description.length > 60 ? '...' : ''}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      → {assoc.pays.pays}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      {new Date(assoc.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>

              {associations.length > 6 && (
                <div className="text-sm text-slate-500 mt-2">
                  + {associations.length - 6} autres associations...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sous-onglets Exigences */}
      {activeTab === 'exigences' && (
        <div className="mb-8 border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSubTab('exigence')}
              className={`pb-4 text-sm font-medium ${
                activeSubTab === 'exigence' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Exigences
            </button>
            <button
              onClick={() => setActiveSubTab('pays')}
              className={`pb-4 text-sm font-medium ${
                activeSubTab === 'pays' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pays
            </button>
            <button
              onClick={() => setActiveSubTab('destination')}
              className={`pb-4 text-sm font-medium ${
                activeSubTab === 'destination' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Destinations
            </button>
          </nav>
        </div>
      )}

      {/* Contenu */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {currentItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucun élément trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* TABLEAU AMÉLIORÉ AVEC getTableConfig() */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    {tableConfig.headers.map((header) => (
                      <th 
                        key={header} 
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {tableConfig.renderRow(item)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && !error && activeSubTab === 'pays' && selectedPaysId && (
        <div className="mt-10 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          {detailsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
            </div>
          ) : detailsError ? (
            <div className="text-red-600 bg-red-50 p-4 rounded">
              Erreur : {detailsError}
            </div>
          ) : paysDetails ? (
            <>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span>{paysDetails.pays}</span>
                {paysDetails.photo && (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060/'}${paysDetails.photo}`}
                    alt={paysDetails.pays}
                    className="h-10 w-14 object-cover rounded shadow"
                  />
                )}
              </h3>

              {/* Navigation des Onglets */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActivePaysTab('destinations')}
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                    activePaysTab === 'destinations'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Destinations ({paysDetails.DestinationVoyage?.length || 0})
                </button>
                <button
                  onClick={() => setActivePaysTab('exigences')}
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                    activePaysTab === 'exigences'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Exigences ({paysDetails.paysVoyage?.length || 0})
                </button>
              </div>

              {/* Contenu des Onglets */}
              <div className="p-6">
                {activePaysTab === 'destinations' && (
                  <div className="overflow-x-auto">
                    {paysDetails.DestinationVoyage?.length > 0 ? (
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ville</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {paysDetails.DestinationVoyage.map((dest) => (
                            <tr key={dest.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-mono text-indigo-600">{dest.code}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{dest.ville}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500 italic py-4">Aucune destination pour ce pays.</p>
                    )}
                  </div>
                )}

                {activePaysTab === 'exigences' && (
                  <div className="overflow-x-auto">
                    {paysDetails.paysVoyage?.length > 0 ? (
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Périmètre</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {paysDetails.paysVoyage.map((assoc) => (
                            <tr key={assoc.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                  {assoc.exigenceVoyage.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{assoc.exigenceVoyage.description}</td>
                              <td className="px-4 py-3 text-sm text-slate-500 italic">{assoc.exigenceVoyage.perimetre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500 italic py-4">Aucune exigence associée à ce pays.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setSelectedPaysId(null)}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  ← Retour à la liste des pays
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Modals */}
      <ServiceSpecifiqueModal isOpen={modalServiceOpen} onClose={() => setModalServiceOpen(false)} />
      <ExigenceModal
        isOpen={modalExigenceOpen}
        onClose={() => setModalExigenceOpen(false)}
      />
      <PaysModal
        isOpen={modalPaysOpen}
        onClose={() => setModalPaysOpen(false)}
      />
      <DestinationModal
        isOpen={modalDestinationOpen}
        onClose={() => setModalDestinationOpen(false)}
      />
      <AssociationModal
        isOpen={modalAssociationOpen}
        onClose={() => setModalAssociationOpen(false)}
      />
    </div>
  );
}
