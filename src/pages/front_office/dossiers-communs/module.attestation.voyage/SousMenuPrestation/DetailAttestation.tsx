import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';

import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchClientFactureById } from '../../../../../app/back_office/clientFacturesSlice';
import { fetchAttestationEnteteDetail, fetchAttestationSuivi, fetchDevisForPassenger} from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import AddLigneModal from './AddLigneModal';
import {   fetchCommentairesByPrestation } from '../../../../../app/front_office/commentaireSlice';
import { fetchTodosByPrestation} from '../../../../../app/front_office/todosSlice';
import SuiviTabContent from './SuiviTabContent';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import ViewDevisModal from '../../../../../components/modals/Attestation/ViewDevisModal';
import PassagerDropdown from './components.attestation/PassagerDropdown';
import { API_URL } from '../../../../../service/env';
import TabContainer from '../../../../../layouts/TabContainer';


const useAppDispatch = () => useDispatch<AppDispatch>();

const DetailAttestation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const {
    items: entetes,           // ← renommé pour éviter confusion
    selectedId,
    selectedDetail,
    selectedSuivi,
    loading: loadingEntete,
  } = useSelector((state: RootState) => state.attestationEntete);

  // Pour les todos / rappels
  const {
    items: todos,             // ← c'est CELA qu'il faut utiliser dans la liste
    loading: loadingTodos,
  } = useSelector((state: RootState) => state.todos);

  const { items: destinations, loading: loadingDestinations } = useSelector((state: RootState) => state.destination);
  const { current: clientFactureDetail, loading: loadingClientFactureDetail } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const tabs = [
    { id: 'attestation', label: 'Listes des entête attestation' }
  ];
  
  const [activeTabEntete, setActiveTabEntete] = useState(location.state?.targetTab || 'attestation');
  

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

  const selectedEntete = entetes.find(item => item.id === selectedId);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lignes' | 'suivi'>('lignes'); // ← onglets

  // Récupère les commentaires depuis le store
  const { list: commentaires, loading: loadingCommentaires } = useSelector(
    (state: RootState) => state.commentaire
  );

  const [devisModalOpen, setDevisModalOpen] = useState(false);
// Dans ViewDevisModal.tsx
  const { selectedDevisDetail } = useSelector((state: RootState) => state.attestationEntete);

// Puis utiliser selectedDevisDetail au lieu de props.devisData


  useEffect(() => {
    if (destinations.length === 0) dispatch(fetchDestinations());
  }, [dispatch, destinations.length]);

  useEffect(() => {
    if (clientFactureId && !clientFactureDetail?.id) {
      dispatch(fetchClientFactureById(clientFactureId));
    }
  }, [dispatch, clientFactureId, clientFactureDetail?.id]);

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchAttestationEnteteDetail(selectedId));
      dispatch(fetchAttestationSuivi(selectedId)); // ← charge le suivi
    }
  }, [dispatch, selectedId]);

  // Charge les commentaires quand on passe sur l'onglet suivi
  useEffect(() => {
    if (activeTab === 'suivi' && prestationId) {
      dispatch(fetchCommentairesByPrestation(prestationId));
    }
  }, [dispatch, activeTab, prestationId]);

  useEffect(() => {
    if (activeTab === 'suivi' && prestationId) {
      // Charger les rappels spécifiques à cette prestation
      dispatch(fetchTodosByPrestation(prestationId));
    }
  }, [dispatch, activeTab, prestationId]);


  const handleBack = () => navigate(-1);

  const handleOpenPdfItineraire = (ligneId: string) => {
      const pdfUrl = `${API_URL}/attestation/pdf-itineraire/${selectedEntete?.id}/${ligneId}`;
      // Option 1 : Ouvrir dans un nouvel onglet (recommandé pour PDF)
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

  if (!selectedId || !selectedEntete) {
    return (
      <div className="p-6 ">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
          <p className="text-lg font-medium">Aucune attestation sélectionnée</p>
          <button onClick={handleBack} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <TabContainer tabs={tabs} activeTab={activeTabEntete} setActiveTab={setActiveTabEntete}>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <AttestationHeader
            numeroAttestation={selectedEntete?.numeroEntete}
            navigate={navigate}
            isDetail={true}
          />
        </div>

        {/* Infos principales (tu peux extraire dans un composant) */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Informations principales</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">N° En-tête</dt>
                  <dd className="mt-1 text-gray-900 font-medium text-lg">
                    {selectedEntete.numeroEntete}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">N° Dossier</dt>
                  <dd className="mt-1 text-gray-900">
                    {selectedEntete.prestation?.numeroDos || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fournisseur</dt>
                  <dd className="mt-1 text-gray-900">
                    {selectedEntete.fournisseur?.libelle || '—'}
                    {selectedEntete.fournisseur?.code && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({selectedEntete.fournisseur.code})
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Montants & Dates</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Commission</dt>
                  <dd className="mt-1 text-xl font-bold text-green-700">
                    {selectedEntete.totalCommission.toLocaleString('fr-FR')} Ar
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(selectedEntete.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mis à jour le</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(selectedEntete.updatedAt).toLocaleString('fr-FR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Bouton Ajouter ligne */}
        <div className="flex justify-end">
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Ajouter une ligne
          </button>
        </div>

        {/* Onglets */}
        {selectedDetail && (
          <div className=" overflow-hidden">
            {/* Tabs header */}
            <div className="">
              <nav className="flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('lignes')}
                  className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                    activeTab === 'lignes'
                      ? 'bg-[#4A77BE] text-white shadow-sm'
                      : 'bg-[#ffffff] text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'}`}
                >
                  Lignes d'attestation
                </button>
                <button
                  onClick={() => setActiveTab('suivi')}
                  className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                    activeTab === 'suivi'
                      ? 'bg-[#4A77BE] text-white shadow-sm'
                      : 'bg-[#ffffff] text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'}`}
                >
                  Suivi
                </button>
              </nav>
            </div>

            {/* Contenu onglets */}
            <div className="bg-white border border-slate-100">
              {activeTab === 'lignes' && (
                <>
                  {/* <h2 className="text-xl font-bold text-gray-800 pl-5 pt-3 mb-6">
                    <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
                    Lignes d'attestation
                  </h2> */}
                  {selectedDetail.attestationLigne.length === 0 ? (
                    <p className="p-8 text-gray-600 italic">Aucune ligne pour le moment</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        {/* ton thead et tbody existants */}
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin Line</th>  
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itinéraire</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Départ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Arrivée</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">PU Ar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Prix Ariary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro Reservation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Devis</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence Devis</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {selectedDetail.attestationLigne.map((ligne) => (
                            <tr key={ligne.id} className="hover:bg-gray-50 transition-colors">
                              {/* 1. Statut */}
                              <td className="px-6 py-4 whitespace-nowrap uppercase">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  ligne.status === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {ligne.status == 'CREER' ? 'crée' : ligne.status}
                                </span>
                              </td>

                              {/* 2. Origin Line */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {selectedSuivi?.origineLigne || '—'}
                              </td>

                              {/* 3. Vol */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {ligne.numeroVol} <span className="text-gray-400">({ligne.avion})</span>
                              </td>

                              {/* 4. Compagnie */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {selectedDetail.fournisseur?.libelle || '—'}
                              </td>

                              {/* 5. Itinéraire */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {ligne.itineraire}
                              </td>

                              {/* 6. Classe */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                {ligne.classe}
                              </td>

                              {/* 7. Type */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {ligne.typePassager}
                              </td>

                              {/* 8. Date Départ */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>

                              {/* 9. Date Arrivée */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>

                              {/* 10. PU Ar (Aligné à droite) */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {ligne.puAriary.toLocaleString('fr-FR')} Ar
                              </td>

                              {/* 11. Nombre (Passagers) */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                {ligne.attestationPassager?.length || 0}
                              </td>

                              {/* 12. Total Prix Ariary */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                                {(ligne.puAriary * (ligne.attestationPassager?.length || 1)).toLocaleString('fr-FR')} Ar
                              </td>

                              {/* 13. Numéro Reservation */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 bg-blue-50">
                                {ligne.numeroReservation}
                              </td>

                              {/* 14. Date Devis */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {selectedDetail.devisModules?.createdAt 
                                  ? new Date(selectedDetail.devisModules.createdAt).toLocaleDateString('fr-FR')
                                  : '—'}
                              </td>

                              {/* 15. Référence Devis */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase">
                                {selectedDetail.devisModules?.reference || 'SANS DEVIS'}
                              </td>

                              <td className="flex space-x-2 px-6 py-4 text-center text-sm relative h-16">
                                <PassagerDropdown
                                  passagers={ligne.attestationPassager || []}
                                  selectedEnteteId={selectedId!}
                                  dispatch={dispatch}
                                  setDevisModalOpen={setDevisModalOpen}
                                />
                                <button
                                onClick={() => handleOpenPdfItineraire(ligne.id)}
                                className={`
                                  px-4 py-2 rounded-lg text-white font-medium transition
                                  ${!selectedEntete?.id || !selectedEntete?.id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                  }
                                `}
                              >
                                PDF
                              </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'suivi' && (
                <SuiviTabContent
                  selectedId={selectedId!}
                  selectedDetail={selectedDetail}
                  selectedSuivi={selectedSuivi}
                  prestationId={prestationId}
                  loading={loadingDestinations || loadingClientFactureDetail || loadingCommentaires || loadingTodos}
                />
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <AddLigneModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            destinations={destinations}
            beneficiaires={clientFactureDetail?.beneficiaires || []}
            attestationEnteteId={selectedId!}
            onLigneCreated={() => {
              dispatch(fetchAttestationEnteteDetail(selectedId!));
              setModalOpen(false);
            }}
          />
        )}
        <ViewDevisModal
          isOpen={devisModalOpen}
          onClose={() => {
            setDevisModalOpen(false);
          }}
          // On passe directement les données du store
          devisData={selectedDevisDetail}
          attestationEnteteId={selectedId!}
          loading={loadingEntete}
        />
      </div>
    </TabContainer>
  );
};

export default DetailAttestation;