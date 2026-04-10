import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TableParametre from '../components/TableParametre';
import { createPlateforme, fetchPlateformes } from '../../../../../app/front_office/parametre_hotel/plateformeSlice';
import TabContainer from '../../../../../layouts/TabContainer';
import type { AppDispatch } from '../../../../../app/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTypeChambre, fetchTypesChambre } from '../../../../../app/front_office/parametre_hotel/typeChambreSlice';
// import { createServiceHotel, fetchServicesHotel } from '../../../../../app/front_office/parametre_hotel/serviceHotelSlice';
import ModalFormParametre from '../components/ModalFormParametre';
import RaisonAnnulationListe from '../../module.parametre/RaisonAnnulation/RaisonAnnulationListe';
import ServiceSpecifiqueListe from '../../module.parametre/ServiceSpecifique/ServiceSpecifiqueListe';
import DeviseListe from '../../module.parametre/devise/DeviseListe';
const useAppDispatch = () => useDispatch<AppDispatch>();

const ParametreViewHotel = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Pour l'instant on n'a que les plateformes
  const {
    items: plateformes,
    loading: loadingPlateforme,
    error: errorPlateforme,
  } = useSelector((state: any) => state.plateforme);

  const {
    items: typesChambre,
    loading: loadingTypes,
    error: errorTypes,
  } = useSelector((state: any) => state.typeChambre);

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'plateformes');

  const tabs = [
    { id: 'plateformes', label: 'Plateformes' },
    { id: 'typeChambre', label: 'Types de chambre' },
    { id: 'service', label: 'Services' },
    { id: 'devise', label: 'Devise' },
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
  ];

  const [showAddPlateforme, setShowAddPlateforme] = useState(false);
  const [showAddTypeChambre, setShowAddTypeChambre] = useState(false);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => {
        setActiveTab(location.state.targetTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  // Handlers de création
  const handleCreatePlateforme = (data: any) => {
    dispatch(createPlateforme(data)).then((result) => {
      if (!result.payload?.error) {  // ou vérifie !result.error selon ta config
        setShowAddPlateforme(false);
        // Le slice peut déjà ajouter l'élément ou alors re-fetch
        dispatch(fetchPlateformes()); // option safe
      }
    });
  };

  const handleCreateTypeChambre = (data: any) => {
    dispatch(createTypeChambre(data)).then(() => {
      setShowAddTypeChambre(false);
      dispatch(fetchTypesChambre());
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // ← Réécrit location.state sans changer l'URL
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="py-2 px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 mt-5">Paramètres Hôtel</h1>

          <div className="space-y-8">
            {activeTab === 'plateformes' && (
              <>
                <div className="flex justify-between mb-4">
                  <p className="text-xl font-bold text-gray-800">Gestion des plateformes</p>
                  <button
                    onClick={() => setShowAddPlateforme(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    + Ajouter une plateforme
                  </button>
                </div>
                <TableParametre
                  title="Plateformes"
                  items={plateformes}
                  loading={loadingPlateforme}
                  error={errorPlateforme}
                  columns={[
                    { key: 'code', label: 'Code' },
                    { key: 'nom', label: 'Nom' },
                    {
                      key: 'status',
                      label: 'Statut',
                      render: (status: string) => (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            status === 'CREER' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {status}
                        </span>
                      ),
                    },
                  ]}
                />
              </>
            )}

            {activeTab === 'typeChambre' && (
              <>
                <div className="flex justify-between mb-4">
                  <p className="text-xl font-bold text-gray-800">Gestion des types de chambre</p>
                  
                  <button
                    onClick={() => setShowAddTypeChambre(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    + Ajouter un type de chambre
                  </button>
                </div>
                <TableParametre
                  title="Types de chambre"
                  items={typesChambre}
                  loading={loadingTypes}
                  error={errorTypes}
                  columns={[
                    { key: 'type', label: 'Type' },
                    { key: 'capacite', label: 'Capacité (personnes)' },
                  ]}
                />
              </>
            )}

            {activeTab === 'devise' && (
              <DeviseListe />
            )}

            {activeTab === 'listeRaisonAnnulation' && (
              <>
                <RaisonAnnulationListe />
              </>
            )}

            {activeTab === 'service' && (
              <ServiceSpecifiqueListe typeService="HOTEL" />
            )}
          </div>
        </div>
      </TabContainer>

      {/* Modals */}
      <ModalFormParametre
        isOpen={showAddPlateforme}
        onClose={() => setShowAddPlateforme(false)}
        onSubmit={handleCreatePlateforme}
        title="Nouvelle plateforme"
        fields={[
          { name: 'code', label: 'Code', type: 'text', required: true },
          { name: 'nom', label: 'Nom', type: 'text', required: true },
        ]}
        loading={loadingPlateforme}
      />

      <ModalFormParametre
        isOpen={showAddTypeChambre}
        onClose={() => setShowAddTypeChambre(false)}
        onSubmit={handleCreateTypeChambre}
        title="Nouveau type de chambre"
        fields={[
          { name: 'type', label: 'Type de chambre', type: 'text', required: true },
          { name: 'capacite', label: 'Capacité (personnes)', type: 'number', required: true },
        ]}
        loading={loadingTypes}
      />
    </div>
  );
};

export default ParametreViewHotel;