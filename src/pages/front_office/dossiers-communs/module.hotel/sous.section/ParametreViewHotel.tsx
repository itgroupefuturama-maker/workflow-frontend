import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TableParametre from '../components/TableParametre';
import { createPlateforme, fetchPlateformes } from '../../../../../app/front_office/parametre_hotel/plateformeSlice';
import TabContainer from '../../../../../layouts/TabContainer';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { useLocation } from 'react-router-dom';
import { createTypeChambre, fetchTypesChambre } from '../../../../../app/front_office/parametre_hotel/typeChambreSlice';
import { createServiceHotel, fetchServicesHotel } from '../../../../../app/front_office/parametre_hotel/serviceHotelSlice';
import ModalFormParametre from '../components/ModalFormParametre';
import RaisonAnnulationListe from '../../module.ticketing/ticketing.sous.module/SousMenuPrestation/RaisonAnnulationListe';
import { fetchRaisonsAnnulation } from '../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ParametreViewHotel = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

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

  const {
    items: services,
    loading: loadingServices,
    error: errorServices,
  } = useSelector((state: any) => state.serviceHotel);

  const raisonState = useSelector((state: RootState) => state.raisonAnnulation);

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'plateformes');

  const tabs = [
    { id: 'plateformes', label: 'Plateformes' },
    { id: 'typeChambre', label: 'Types de chambre' },
    { id: 'service', label: 'Services' },
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
  ];

  const [showAddPlateforme, setShowAddPlateforme] = useState(false);
  const [showAddTypeChambre, setShowAddTypeChambre] = useState(false);
  const [showAddService, setShowAddService] = useState(false);

  useEffect(() => {
    dispatch(fetchPlateformes());
    dispatch(fetchTypesChambre());
    dispatch(fetchServicesHotel());
    if (activeTab === 'listeRaisonAnnulation' && raisonState.items.length === 0) {
        dispatch(fetchRaisonsAnnulation());
        }
  }, [dispatch]);

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

  const handleCreateService = (data: any) => {
    dispatch(createServiceHotel(data)).then(() => {
      setShowAddService(false);
      dispatch(fetchServicesHotel());
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-6">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres Hôtel</h1>

        <div className="space-y-8">
          {activeTab === 'plateformes' && (
            <>
              <div className="flex justify-end mb-4">
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
              <div className="flex justify-end mb-4">
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

          {activeTab === 'listeRaisonAnnulation' && (
            <>
              <RaisonAnnulationListe />
            </>
          )}

          {activeTab === 'service' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAddService(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  + Ajouter un service
                </button>
              </div>
              <TableParametre
                title="Services hôtel"
                items={services}
                loading={loadingServices}
                error={errorServices}
                columns={[{ key: 'service', label: 'Service' }]}
              />
            </>
          )}
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

      <ModalFormParametre
        isOpen={showAddService}
        onClose={() => setShowAddService(false)}
        onSubmit={handleCreateService}
        title="Nouveau service"
        fields={[{ name: 'service', label: 'Nom du service', type: 'text', required: true }]}
        loading={loadingServices}
      />
    </div>
  );
};

export default ParametreViewHotel;