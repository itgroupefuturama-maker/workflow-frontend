import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';

import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchClientFactureById } from '../../../../../app/back_office/clientFacturesSlice';
import { fetchAttestationEnteteDetail, fetchAttestationSuivi} from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import AddLigneModal from './AddLigneModal';
// import {   fetchCommentairesByPrestation } from '../../../../../app/front_office/commentaireSlice';
// import { fetchTodosByPrestation} from '../../../../../app/front_office/todosSlice';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import ViewDevisModal from '../../../../../components/modals/Attestation/ViewDevisModal';
// import PassagerDropdown from './components.attestation/PassagerDropdown';
import { API_URL } from '../../../../../service/env';
import TabContainer from '../../../../../layouts/TabContainer';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
// import { fetchSuivis } from '../../../../../app/front_office/suiviSlice';
import axios from '../../../../../service/Axios';


const useAppDispatch = () => useDispatch<AppDispatch>();

const DetailAttestation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const {
    items: entetes,
    selectedId,
    selectedDetail,
    // selectedSuivi,
    loading: loadingEntete,
  } = useSelector((state: RootState) => state.attestationEntete);

  const { items: destinations, loading: loadingDestinations } = useSelector((state: RootState) => state.destination);
  const { current: clientFactureDetail, loading: loadingClientFactureDetail } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête attestation' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' }
  ];

  // const { items, loading, error } = useSelector(
  //   (state: RootState) => state.attestationParams
  // );
  
  const [activeTabEntete, setActiveTabEntete] = useState(location.state?.targetTab || 'prospection');
  

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

  const selectedEntete = entetes.find(item => item.id === selectedId);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lignes' | 'suivi'>('lignes'); // ← onglets

  const [devisModalOpen, setDevisModalOpen] = useState(false);
// Dans ViewDevisModal.tsx
  const { selectedDevisDetail } = useSelector((state: RootState) => state.attestationEntete);

  useEffect(() => {
    if (destinations.length === 0) dispatch(fetchDestinations());
  }, [dispatch, destinations.length]);

  console.log(clientFactureId);

  useEffect(() => {
    if (clientFactureId) {
      dispatch(fetchClientFactureById(clientFactureId));
    }
  }, [dispatch, clientFactureId]);

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchAttestationEnteteDetail(selectedId));
      dispatch(fetchAttestationSuivi(selectedId)); // ← charge le suivi
    }
  }, [dispatch, selectedId]);

  const handleBack = () => navigate(-1);

  const handleOpenPdfItineraire = (ligneId: string) => {
    const pdfUrl = `${API_URL}/attestation/pdf-itineraire/${selectedEntete?.id}/${ligneId}`;
    // Option 1 : Ouvrir dans un nouvel onglet (recommandé pour PDF)
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateAndOpenPdf = async () => {
    if (!selectedEntete?.id) return;
    
    setGeneratingPdf(true);
    try {
      const pdfUrl = `${API_URL}/attestation/pdf/${selectedEntete.id}`;
      
      // 1. Génère le PDF via GET
      await axios.get(pdfUrl);
      
      // 2. Une fois généré, ouvre dans un nouvel onglet
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleTabChange = (id: string) => {
    if (id === 'beneficiaire') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/attestation/pages`, { 
        state: { targetTab: 'beneficiaire' }
      });
    } else {
      setActiveTab(id);
    }
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

  // Juste avant le return
  console.log('=== DEBUG beneficiaires ===');
  console.log('clientFactureId:', clientFactureId);
  console.log('clientFactureDetail:', clientFactureDetail);
  console.log('clientFactureDetail?.beneficiaires:', clientFactureDetail?.beneficiaires);
  console.log('beneficiaires passés au modal:', clientFactureDetail?.beneficiaires || []);
  console.log('loadingClientFactureDetail:', loadingClientFactureDetail);

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTabEntete} setActiveTab={handleTabChange}>
        <div className="py-2 px-4">
          {/* Header */}
          <AttestationHeader
            numeroAttestation={selectedEntete?.numeroEntete}
            navigate={navigate}
            isDetail={true}
          />

          {/* Infos principales (tu peux extraire dans un composant) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-2">

            {/* Header de la card */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Détail de l'en-tête</p>
              
              <div className="flex items-center gap-2"> {/* ← wrapper pour aligner badge + bouton */}
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {selectedEntete.numeroEntete}
                </span>

                {/* ── Bouton PDF ── */}
                <button
                  onClick={handleGenerateAndOpenPdf}
                  disabled={generatingPdf}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    generatingPdf
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {generatingPdf ? (
                    <>
                      <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      Générer PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

              {/* Colonne gauche — Informations principales */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Informations principales
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">N° Dossier</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedEntete.prestation?.numeroDos || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Fournisseur</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {selectedEntete.fournisseur?.libelle || '—'}
                      </span>
                      {selectedEntete.fournisseur?.code && (
                        <span className="font-mono text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md border border-gray-200">
                          {selectedEntete.fournisseur.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    {/* Icône */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>

                    {/* Prix */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                        Prix actif
                      </p>
                      <p className="text-xl font-black text-slate-800 leading-none">
                        {selectedEntete.puAriary.toLocaleString('fr-FR')}
                        <span className="text-xs font-medium text-slate-400 ml-1">Ar</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — Montants & Dates */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Montants & Dates
                </p>

                <div className="space-y-3">

                  {/* Total commission — mis en avant */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                      Total Commission
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {selectedEntete.totalCommission.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Créé le</span>
                    <span className="text-sm font-medium text-gray-800">
                      {new Date(selectedEntete.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Mis à jour le</span>
                    <span className="text-sm font-medium text-gray-800">
                      {new Date(selectedEntete.updatedAt).toLocaleString('fr-FR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets */}
          {selectedDetail && (
            <div className=" overflow-hidden">
              {/* Tabs header */}
              <div className="flex justify-between">
                <div>
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

                {/* Bouton Ajouter ligne */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <span className="flex items-center justify-center w-4 h-4 rounded-md bg-white/20 text-white font-bold leading-none">
                      +
                    </span>
                    Ajouter une ligne
                  </button>
                </div>
              </div>

              {/* Contenu onglets */}
              <div className="bg-white border border-slate-100">
                {activeTab === 'lignes' && (
                  <>
                    {selectedDetail.attestationLigne.length === 0 ? (
                      <p className="p-8 text-gray-600 italic">Aucune ligne pour le moment</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          {/* ton thead et tbody existants */}
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vol</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itinéraire</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Départ</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Arrivée</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
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

                                {/* 10. Nombre (Passagers) */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                  {ligne.attestationPassager?.length || 0}
                                </td>

                                {/* 11. Numéro Reservation */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 bg-blue-50">
                                  {ligne.numeroReservation}
                                </td>

                                {/* 12. Date Devis */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {selectedDetail.devisModules?.createdAt 
                                    ? new Date(selectedDetail.devisModules.createdAt).toLocaleDateString('fr-FR')
                                    : '—'}
                                </td>

                                {/* 13. Référence Devis */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase">
                                  {selectedDetail.devisModules?.reference || 'SANS DEVIS'}
                                </td>

                                <td className="flex space-x-2 px-6 py-4 text-center text-sm relative h-16">
                                  {/* <PassagerDropdown
                                    passagers={ligne.attestationPassager || []}
                                    selectedEnteteId={selectedId!}
                                    dispatch={dispatch}
                                    setDevisModalOpen={setDevisModalOpen}
                                  /> */}
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
                  <SuiviTabSection
                    prestationId={prestationId}
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
    </div>
  );
};

export default DetailAttestation;