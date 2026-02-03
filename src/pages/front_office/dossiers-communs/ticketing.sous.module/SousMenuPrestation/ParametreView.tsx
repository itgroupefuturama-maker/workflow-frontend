import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';

import { fetchServiceSpecifiques } from '../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import { fetchExigences } from '../../../../../app/front_office/parametre_ticketing/exigenceSlice';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays, fetchPaysDetails, clearSelectedPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';
import { fetchAssociationsPaysVoyage } from '../../../../../app/front_office/parametre_ticketing/associationsPaysVoyageSlice';
import ServiceSpecifiqueModal from '../../../../../components/modals/ServiceSpecifiqueModal';
import ExigenceModal from '../../../../../components/modals/ExigenceModal';
import PaysModal from '../../../../../components/modals/PaysModal';
import DestinationModal from '../../../../../components/modals/DestinationModal';
import AssociationModal from '../../../../../components/modals/AssociationModal';
import TabContainer from '../../../../../layouts/TabContainer';
import { useLocation } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ParametreView() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'defaultTab');

  useEffect(() => {
  if (location.state?.targetTab) {
    // Use requestAnimationFrame to defer the state update
    const timer = setTimeout(() => {
      setActiveTab(location.state.targetTab);
    }, 0);
    return () => clearTimeout(timer);
  }
}, [location.state?.targetTab]);

  const tabs = [
    { id: 'listeService', label: 'Services & Spécifiques' },
    { id: 'listeExigence', label: 'Exigences de Voyage' }
  ];

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
    if (activeTab === 'listeService' && serviceState.items.length === 0) {
      dispatch(fetchServiceSpecifiques());
    }
    if (activeTab === 'listeExigence') {
      if (assocState.items.length === 0) dispatch(fetchAssociationsPaysVoyage());
      if (activeSubTab === 'exigence' && exigenceState.items.length === 0) dispatch(fetchExigences());
      if (activeSubTab === 'pays' && paysState.items.length === 0) dispatch(fetchPays());
      if (activeSubTab === 'destination' && destinationState.items.length === 0) dispatch(fetchDestinations());
    }
  }, [dispatch, activeTab, activeSubTab]);

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
    <div className="min-h-screen bg-[#F8FAFC]  font-sans text-slate-900">
      

      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        <header className="flex justify-between items-center mb-8">
        <button
          onClick={() => {
            if (activeTab === 'listeService') setModalServiceOpen(true);
            else if (activeSubTab === 'exigence') setModalExigenceOpen(true);
            else if (activeSubTab === 'destination') setModalDestinationOpen(true);
            else if (activeSubTab === 'pays') setModalPaysOpen(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm text-sm font-medium"
        >
          {activeTab === 'listeService' ? 'Nouveau Service' : `Nouvelle ${activeSubTab}`}
        </button>
      </header>

      <h1 className="text-3xl font-bold mb-6">Paramétrage Ticketing</h1>
        <div className="mt-6">
          {activeTab === 'listeService' ? (
            /* --- SECTION SERVICES --- */
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              {loading ? <div className="p-10 text-center animate-pulse">Chargement des services...</div> : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>{tableConfig.headers.map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {currentItems.map(item => <tr key={item.id} className="hover:bg-slate-50 transition-colors">{tableConfig.renderRow(item)}</tr>)}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* --- SECTION EXIGENCES --- */
            <div className="space-y-6">
              {/* Synthèse */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Synthèse des exigences</h2>
                  <button onClick={() => setModalAssociationOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 shadow-sm">+ Nouvelle association</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assocState.items.slice(0, 3).map(assoc => (
                    <div key={assoc.id} className="border border-slate-200 rounded p-3 bg-slate-50">
                      <div className="font-medium text-slate-800">{assoc.exigenceVoyage.type}</div>
                      <div className="text-xs text-slate-600 mt-1">→ {assoc.pays.pays}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sous-navigation internes */}
              <nav className="flex space-x-8 border-b border-slate-200">
                {(['exigence', 'pays', 'destination'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => { setActiveSubTab(sub); setSelectedPaysId(null); }}
                    className={`pb-4 text-sm font-medium transition-colors ${activeSubTab === sub ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {sub === 'exigence' ? 'Exigences' : sub === 'pays' ? 'Pays' : 'Destinations'}
                  </button>
                ))}
              </nav>

              {/* Liste ou Détails Pays */}
              {!selectedPaysId ? (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                   <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>{tableConfig.headers.map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">{h}</th>)}</tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.map(item => <tr key={item.id} className="hover:bg-slate-50 transition-colors">{tableConfig.renderRow(item)}</tr>)}
                      </tbody>
                    </table>
                </div>
              ) : (
                /* RÉINTÉGRATION DE LA VUE DÉTAILLÉE DU PAYS */
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                  {detailsLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div></div>
                  ) : detailsError ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded">Erreur : {detailsError}</div>
                  ) : paysDetails ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-xl font-bold">{paysDetails.pays}</h3>
                        {paysDetails.photo && <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060/'}${paysDetails.photo}`} alt={paysDetails.pays} className="h-10 w-14 object-cover rounded shadow" />}
                      </div>

                      <div className="flex border-b border-slate-200">
                        {['destinations', 'exigences'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActivePaysTab(tab)}
                            className={`px-6 py-3 text-sm font-medium capitalize ${activePaysTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {tab} ({tab === 'destinations' ? paysDetails.DestinationVoyage?.length : paysDetails.paysVoyage?.length || 0})
                          </button>
                        ))}
                      </div>

                      <div className="py-6">
                        {activePaysTab === 'destinations' ? (
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase">Code</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ville</th></tr>
                            </thead>
                            <tbody className="divide-y">
                              {paysDetails.DestinationVoyage?.map((dest: any) => (
                                <tr key={dest.id}><td className="px-4 py-3 text-sm font-mono text-indigo-600">{dest.code}</td><td className="px-4 py-3 text-sm">{dest.ville}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <table className="min-w-full divide-y divide-slate-200">
                             <thead className="bg-slate-50">
                              <tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase">Description</th></tr>
                            </thead>
                            <tbody className="divide-y">
                              {paysDetails.paysVoyage?.map((assoc: any) => (
                                <tr key={assoc.id}><td className="px-4 py-3 text-sm font-bold">{assoc.exigenceVoyage.type}</td><td className="px-4 py-3 text-sm">{assoc.exigenceVoyage.description}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <button onClick={() => setSelectedPaysId(null)} className="text-blue-600 text-sm font-medium hover:underline">← Retour à la liste des pays</button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </TabContainer>

      {/* Modals inchangées */}
      <ServiceSpecifiqueModal isOpen={modalServiceOpen} onClose={() => setModalServiceOpen(false)} />
      <ExigenceModal isOpen={modalExigenceOpen} onClose={() => setModalExigenceOpen(false)} />
      <PaysModal isOpen={modalPaysOpen} onClose={() => setModalPaysOpen(false)} />
      <DestinationModal isOpen={modalDestinationOpen} onClose={() => setModalDestinationOpen(false)} />
      <AssociationModal isOpen={modalAssociationOpen} onClose={() => setModalAssociationOpen(false)} />
    </div>
  );
}