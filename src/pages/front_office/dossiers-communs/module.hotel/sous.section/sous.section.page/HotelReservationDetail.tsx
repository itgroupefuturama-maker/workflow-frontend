// src/pages/parametres/hotel/HotelReservationDetail.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { annulerHotelEntete, approuverHotelReservation, confirmerHotelLigne, createHotelReservation, emissionBilletHotel, emissionFactureHotel, fetchHotelReservationDetail, reglerFactureHotel } from '../../../../../../app/front_office/parametre_hotel/hotelReservationEnteteSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import HotelReservationModal from '../../../../../../components/modals/Hotel/HotelReservationModal';
import HotelConfirmationModal from '../../components/HotelConfirmationModal';
import { fetchRaisonsAnnulation } from '../../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import { HotelHeader } from '../../components/HotelHeader';
import TabContainer from '../../../../../../layouts/TabContainer';
import SuiviTabContent from '../../../module.attestation.voyage/SousMenuPrestation/SuiviTabContent';
import ActionButton from '../../components/ActionButton';

const HotelReservationDetail = () => {
  const { enteteId } = useParams<{ enteteId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedDetail, detailLoading, detailError } = useSelector(
    (state: RootState) => state.hotelReservationEntete
  );

  const clientFactureId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  // Récupérer les données du client facture avec ses bénéficiaires
  const { current: clientFactureData } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
    

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLigne, setSelectedLigne] = useState(null);

  // ─── État pour le modal d'approbation ─────────────────────
  const [showApprouverModal, setShowApprouverModal] = useState(false);
  const [approuverForm, setApprouverForm] = useState({
    totalHotel: 0,
    totalCommission: 0,
  });
  const [approuverLoading, setApprouverLoading] = useState(false);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedLigneConfirmation, setSelectedLigneConfirmation] = useState<any>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  // Emission Billet
  const [showEmissionBilletModal, setShowEmissionBilletModal] = useState(false);
  const [emissionBilletForm, setEmissionBilletForm] = useState({
    referenceBcClient: '',
    totalHotel: 0,
    totalCommission: 0,
  });
  const [emissionBilletLoading, setEmissionBilletLoading] = useState(false);

  // Emission Facture
  const [showEmissionFactureModal, setShowEmissionFactureModal] = useState(false);
  const [emissionFactureForm, setEmissionFactureForm] = useState({
    referenceFacClient: '',
  });
  const [emissionFactureLoading, setEmissionFactureLoading] = useState(false);

  // Régler Facture
  const [showReglerModal, setShowReglerModal] = useState(false);
  const [reglerLoading, setReglerLoading] = useState(false);

  // ─── États modal annulation ───────────────────────────────
  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [annulationForm, setAnnulationForm] = useState({
    rasionAnnulationId: '',
    conditionAnnul: '',
  });
  const [annulationLoading, setAnnulationLoading] = useState(false);

  // ─── Selector raisons annulation ─────────────────────────
  const { items: raisonsAnnulation, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );

  const tabs = [
    { id: 'benchmarking', label: 'Listes des entête benchmarking' },
    { id: 'hotel', label: 'Listes des reservation hotel' }
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'hotel');

  const [activeTabSousSection, setActiveTabSousSection] = useState(location.state?.targetTab || 'lignes');

  console.log('Client Facture ID:', clientFactureId);
  console.log('Client Facture Data:', clientFactureData);

  // Charger les détails de la réservation
  useEffect(() => {
    if (enteteId) {
      dispatch(fetchHotelReservationDetail(enteteId));
    }
  }, [dispatch, enteteId]);

  // Charger les données du client facture avec ses bénéficiaires
  useEffect(() => {
    if (clientFactureId) {
      dispatch(fetchClientFactureById(clientFactureId));
    }
  }, [dispatch, clientFactureId]);

  // Charger les raisons d'annulation à l'ouverture du modal
  useEffect(() => {
    if (showAnnulationModal && raisonsAnnulation.length === 0) {
      dispatch(fetchRaisonsAnnulation());
    }
  }, [showAnnulationModal, dispatch, raisonsAnnulation.length]);

  const handleOpenModal = (ligne: any) => {
    setSelectedLigne(ligne);
    setIsModalOpen(true);
  };

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
    if (id === 'benchmarking') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/hotel/pages`, { 
        state: { targetTab: 'benchmarking' }
      });
    } else {
      setActiveTab(id);
    }
  };

  const handleSubmitReservation = async (payload: any) => {
    try {
        await dispatch(createHotelReservation({ 
        ligneId: entete?.id,
        payload 
        })).unwrap();
        
        alert('Réservation créée avec succès !');
        setIsModalOpen(false);
        
        // Recharger les détails
        dispatch(fetchHotelReservationDetail(enteteId!));
    } catch (error) {
        alert('Erreur lors de la création de la réservation');
    }
  };

  const handleApprouver = async () => {
    try {
      setApprouverLoading(true);
      await dispatch(approuverHotelReservation({
        id: entete.id,
        totalHotel: approuverForm.totalHotel,
        totalCommission: approuverForm.totalCommission,
      })).unwrap();

      alert('Réservation approuvée avec succès !');
      setShowApprouverModal(false);
      dispatch(fetchHotelReservationDetail(enteteId!));
    } catch (error) {
      alert('Erreur lors de l\'approbation');
    } finally {
      setApprouverLoading(false);
    }
  };

  const handleOpenConfirmationModal = (ligne: any) => {
    setSelectedLigneConfirmation(ligne);
    setIsConfirmationModalOpen(true);
  };

  const handleSubmitConfirmation = async (payload: any) => {
    try {
      setConfirmationLoading(true);
      await dispatch(confirmerHotelLigne({
        ligneId: entete?.id,
        payload,
      })).unwrap();

      alert('Ligne confirmée avec succès !');
      setIsConfirmationModalOpen(false);
      dispatch(fetchHotelReservationDetail(enteteId!));
    } catch (error) {
      alert('Erreur lors de la confirmation de la ligne');
    } finally {
      setConfirmationLoading(false);
    }
  };

  // ─── Handler Emission Billet ──────────────────────────────
  const handleEmissionBillet = async () => {
    try {
      setEmissionBilletLoading(true);
      await dispatch(emissionBilletHotel({
        id: entete.id,
        payload: {
          referenceBcClient: emissionBilletForm.referenceBcClient,
          totalHotel: emissionBilletForm.totalHotel,
          totalCommission: emissionBilletForm.totalCommission,
        },
      })).unwrap();

      alert('Émission billet effectuée avec succès !');
      setShowEmissionBilletModal(false);
      dispatch(fetchHotelReservationDetail(enteteId!));
    } catch {
      alert('Erreur lors de l\'émission du billet');
    } finally {
      setEmissionBilletLoading(false);
    }
  };

  // ─── Handler Emission Facture ─────────────────────────────
  const handleEmissionFacture = async () => {
    try {
      setEmissionFactureLoading(true);
      await dispatch(emissionFactureHotel({
        id: entete.id,
        payload: {
          referenceFacClient: emissionFactureForm.referenceFacClient,
        },
      })).unwrap();

      alert('Émission facture effectuée avec succès !');
      setShowEmissionFactureModal(false);
      dispatch(fetchHotelReservationDetail(enteteId!));
    } catch {
      alert('Erreur lors de l\'émission de la facture');
    } finally {
      setEmissionFactureLoading(false);
    }
  };

  // ─── Handler Régler Facture ───────────────────────────────
  const handleReglerFacture = async () => {
    try {
      setReglerLoading(true);
      await dispatch(reglerFactureHotel(entete.id)).unwrap();

      alert('Facture réglée avec succès !');
      setShowReglerModal(false);
      dispatch(fetchHotelReservationDetail(enteteId!));
    } catch {
      alert('Erreur lors du règlement de la facture');
    } finally {
      setReglerLoading(false);
    }
  };

  // ─── Handler Annulation ───────────────────────────────────
  const handleAnnuler = async () => {
    try {
      setAnnulationLoading(true);
      await dispatch(annulerHotelEntete({
        id: entete.id,
        payload: {
          rasionAnnulationId: annulationForm.rasionAnnulationId,
          conditionAnnul: annulationForm.conditionAnnul,
        },
      })).unwrap();

      alert('Réservation annulée avec succès !');
      setShowAnnulationModal(false);
      navigate(-1); // Retour à la liste après annulation
    } catch {
      alert('Erreur lors de l\'annulation');
    } finally {
      setAnnulationLoading(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  if (detailError || !selectedDetail) {
    return (
      <div className="min-h-screen p-8 bg-neutral-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-4xl mx-auto">
          <p className="text-red-700">{detailError || 'Réservation non trouvée'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const entete = selectedDetail;
  // const beneficiaires = clientFactureData?.beneficiaires || [];

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="mb-5">
          <HotelHeader numerohotel={entete.HotelProspectionEntete.numeroEntete} navigate={navigate} isDetail={true}/>
        </div>
        {/* Header + boutons statut */}
        <div className="flex items-center justify-between mb-8 uppercase">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">
              N° Rés. Hôtel : {entete.HotelProspectionEntete.numeroEntete}
            </h1>
            <p className="text-sm text-neutral-500 mt-1 ">
              Statut : <span className="font-medium ">{entete.statut == 'CREER' ? 'Crée' : entete.statut}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">

          {/* BC à approuver */}
          <ActionButton
            label="BC Approuver"
            enabled={entete.statut === 'CREER'}
            variant="success"
            onClick={() => {
              const totalHotel = entete.hotelLigne.reduce((sum, l) => sum + (l.puResaMontantAriary || 0), 0);
              const totalCommission = entete.hotelLigne.reduce((sum, l) => sum + (l.commissionUnitaire || 0), 0);
              setApprouverForm({ totalHotel, totalCommission });
              setShowApprouverModal(true);
            }}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            }
          />

          {/* Émission Billet */}
          <ActionButton
            label="Émission Billet"
            enabled={entete.statut === 'BC_CLIENT_A_APPROUVER'}
            variant="primary"
            onClick={() => {
              setEmissionBilletForm({
                referenceBcClient: '',
                totalHotel: entete.hotelLigne.reduce((sum, l) => sum + (l.puResaMontantAriary || 0), 0),
                totalCommission: entete.hotelLigne.reduce((sum, l) => sum + (l.commissionUnitaire || 0), 0),
              });
              setShowEmissionBilletModal(true);
            }}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />

          {/* Émission Facture */}
          <ActionButton
            label="Émission Facture"
            enabled={entete.statut === 'BILLET_EMIS'}
            variant="purple"
            onClick={() => {
              setEmissionFactureForm({ referenceFacClient: '' });
              setShowEmissionFactureModal(true);
            }}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          {/* Régler Facture */}
          <ActionButton
            label="Régler Facture"
            enabled={entete.statut === 'FACTURE_EMISE'}
            variant="warning"
            onClick={() => setShowReglerModal(true)}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          {/* Annulation */}
          <ActionButton
            label="Annuler"
            enabled={entete.statut !== 'ANNULER'}
            variant="danger"
            onClick={() => {
              setAnnulationForm({ rasionAnnulationId: '', conditionAnnul: '' });
              setShowAnnulationModal(true);
            }}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />

        </div>
        </div>

        {/* Infos générales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-600 mb-2">Fournisseur</h3>
            <p className="text-lg font-medium">
              {entete.HotelProspectionEntete.fournisseur.libelle}
              <span className="text-neutral-500 ml-2 text-sm">
                ({entete.HotelProspectionEntete.fournisseur.code})
              </span>
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-600 mb-2">Dossier / Prestation</h3>
            <p className="text-lg font-medium">
              {entete.HotelProspectionEntete.prestation.numeroDos || '—'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-600 mb-2">Créé le</h3>
            <p className="text-lg font-medium">
              {new Date(entete.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* ── Onglets internes Lignes / Suivi ── */}
        {selectedDetail && (
          <div className="overflow-hidden">
            {/* Tab headers */}
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
                  Lignes de réservation
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

            {/* Tab content */}
            <div className="bg-white border border-slate-100">
              {/* ── Onglet Lignes ── */}
              {activeTabSousSection === 'lignes' && (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-800">
                      Lignes de réservation ({entete.hotelLigne.length})
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Référence</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">N° Résa</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Hôtel</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Chambre</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Statut</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">PU Nuit Hôtel Devise</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">PU Nuit Hôtel Ariary</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">PU Montant Devise</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">PU Montant Ariary</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Résa Nuit Devise</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Résa Nuit Ariary</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Résa Montant Devise</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Résa Montant Ariary</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">% Commission</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Commission Unitaire</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Conf. Prix Nuit Hôtel Ar</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Conf. Montant Nuit Hôtel Ar</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Conf. Prix Nuit Client Ar</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">Conf. Montant Nuit Client Ar</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase">Conf. Commission Ar</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase">Commission (Ar)</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {entete.hotelLigne.map((ligne) => (
                          <tr key={ligne.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 font-medium">{ligne.referenceLine}</td>
                            <td className="px-6 py-4">{ligne.numeroResa}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.hotel}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.typeChambre.type}</td>
                            <td className="px-6 py-4">{ligne.statut}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.nuiteDevise}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.nuiteAriary}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.montantDevise}</td>
                            <td className="px-6 py-4">{ligne.BenchmarkingLigne.montantAriary}</td>
                            <td className="px-6 py-4">{ligne.puResaNuiteHotelDevise}</td>
                            <td className="px-6 py-4">{ligne.puResaNuiteHotelAriary}</td>
                            <td className="px-6 py-4">{ligne.puResaMontantDevise}</td>
                            <td className="px-6 py-4">{ligne.puResaMontantAriary}</td>
                            <td className="px-6 py-4">{ligne.pourcentageCommission}</td>
                            <td className="px-6 py-4">{ligne.commissionUnitaire}</td>
                            <td className="px-6 py-4">{ligne.puConfPrixNuitHotelAriary}</td>
                            <td className="px-6 py-4">{ligne.puConfMontantNuitHotelAriary}</td>
                            <td className="px-6 py-4">{ligne.puConfPrixNuitClientArary}</td>
                            <td className="px-6 py-4">{ligne.puConfMontantNuitClientAriary}</td>
                            <td className="px-6 py-4 text-right font-medium">
                              {ligne.puResaMontantAriary?.toLocaleString('fr-FR')} Ar
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-700">
                              {ligne.commissionUnitaire?.toLocaleString('fr-FR')} Ar
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={ligne.statut !== 'CREER'}
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(ligne); }}
                                  className={`px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition ${ligne.statut !== 'CREER' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Réserver
                                </button>
                                <button
                                  disabled={ligne.statut !== 'FAIT' || entete.statut !== 'BC_CLIENT_A_APPROUVER'}
                                  onClick={(e) => { e.stopPropagation(); handleOpenConfirmationModal(ligne); }}
                                  className={`px-3 py-1.5 bg-violet-600 text-white rounded text-xs font-medium hover:bg-violet-700 transition ${ligne.statut !== 'FAIT' || entete.statut !== 'BC_CLIENT_A_APPROUVER' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Confirmer
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

              {/* ── Onglet Suivi ── */}
              {activeTabSousSection === 'suivi' && (
                <SuiviTabContent
                  selectedId={''}
                  selectedDetail={selectedDetail}
                  selectedSuivi={''}
                  prestationId={prestationId}
                  loading={detailLoading}
                />
              )}
            </div>{/* fin tab content */}
          </div>
        )}{/* fin selectedDetail */}

        {/* ── Modals ── */}
        <HotelConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onSubmit={handleSubmitConfirmation}
          ligne={selectedLigneConfirmation}
          loading={confirmationLoading}
        />
        <HotelReservationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitReservation}
          ligne={selectedLigne}
        />

        {/* Modal Approbation */}
        {showApprouverModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">BC à approuver</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Entête : {entete.HotelProspectionEntete.numeroEntete}</p>
                </div>
                <button onClick={() => setShowApprouverModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Hôtel (Ar) <span className="text-red-600">*</span></label>
                  <input type="number" value={approuverForm.totalHotel}
                    onChange={(e) => setApprouverForm((prev) => ({ ...prev, totalHotel: Number(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500" placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculé depuis les lignes : {entete.hotelLigne.reduce((sum, l) => sum + (l.puResaMontantAriary || 0), 0).toLocaleString('fr-FR')} Ar
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Commission (Ar) <span className="text-red-600">*</span></label>
                  <input type="number" value={approuverForm.totalCommission}
                    onChange={(e) => setApprouverForm((prev) => ({ ...prev, totalCommission: Number(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500" placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculé depuis les lignes : {entete.hotelLigne.reduce((sum, l) => sum + (l.commissionUnitaire || 0), 0).toLocaleString('fr-FR')} Ar
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4 space-y-2">
                  <p className="text-xs font-semibold text-green-800 uppercase">Récapitulatif</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Hôtel</span>
                    <span className="font-semibold text-gray-900">{approuverForm.totalHotel.toLocaleString('fr-FR')} Ar</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Commission</span>
                    <span className="font-semibold text-emerald-700">{approuverForm.totalCommission.toLocaleString('fr-FR')} Ar</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowApprouverModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={handleApprouver} disabled={approuverLoading}
                  className={`px-5 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${approuverLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {approuverLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Envoi...</> : <>✓ Confirmer</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Émission Billet */}
        {showEmissionBilletModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🎫 Émission Billet Hôtel</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{entete.HotelProspectionEntete.numeroEntete}</p>
                </div>
                <button onClick={() => setShowEmissionBilletModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Référence BC Client <span className="text-red-600">*</span></label>
                  <input type="text" value={emissionBilletForm.referenceBcClient}
                    onChange={(e) => setEmissionBilletForm((prev) => ({ ...prev, referenceBcClient: e.target.value }))}
                    placeholder="BC-2024-001" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Hôtel (Ar) <span className="text-red-600">*</span></label>
                  <input type="number" value={emissionBilletForm.totalHotel}
                    onChange={(e) => setEmissionBilletForm((prev) => ({ ...prev, totalHotel: Number(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Commission (Ar) <span className="text-red-600">*</span></label>
                  <input type="number" value={emissionBilletForm.totalCommission}
                    onChange={(e) => setEmissionBilletForm((prev) => ({ ...prev, totalCommission: Number(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="0"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-800 uppercase">Récapitulatif</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Référence BC</span>
                    <span className="font-semibold text-gray-900">{emissionBilletForm.referenceBcClient || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Hôtel</span>
                    <span className="font-semibold text-gray-900">{emissionBilletForm.totalHotel.toLocaleString('fr-FR')} Ar</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Commission</span>
                    <span className="font-semibold text-emerald-700">{emissionBilletForm.totalCommission.toLocaleString('fr-FR')} Ar</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowEmissionBilletModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button onClick={handleEmissionBillet} disabled={emissionBilletLoading || !emissionBilletForm.referenceBcClient}
                  className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${emissionBilletLoading || !emissionBilletForm.referenceBcClient ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {emissionBilletLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Envoi...</> : '🎫 Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Émission Facture */}
        {showEmissionFactureModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🧾 Émission Facture Hôtel</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{entete.HotelProspectionEntete.numeroEntete}</p>
                </div>
                <button onClick={() => setShowEmissionFactureModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Référence Facture Client <span className="text-red-600">*</span></label>
                  <input type="text" value={emissionFactureForm.referenceFacClient}
                    onChange={(e) => setEmissionFactureForm({ referenceFacClient: e.target.value })}
                    placeholder="FAC-2024-001" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded p-4">
                  <p className="text-xs font-semibold text-violet-800 uppercase mb-2">Récapitulatif</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Référence Facture</span>
                    <span className="font-semibold text-gray-900">{emissionFactureForm.referenceFacClient || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowEmissionFactureModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button onClick={handleEmissionFacture} disabled={emissionFactureLoading || !emissionFactureForm.referenceFacClient}
                  className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${emissionFactureLoading || !emissionFactureForm.referenceFacClient ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  {emissionFactureLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Envoi...</> : '🧾 Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Régler Facture */}
        {showReglerModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">💳 Régler la Facture</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{entete.HotelProspectionEntete.numeroEntete}</p>
                </div>
                <button onClick={() => setShowReglerModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                  <p className="text-4xl mb-2">💳</p>
                  <p className="text-sm font-semibold text-orange-800">Confirmez-vous le règlement de cette facture ?</p>
                  <p className="text-xs text-orange-600 mt-1">Cette action marquera la facture comme réglée.</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Entête</span>
                    <span className="font-semibold">{entete.HotelProspectionEntete.numeroEntete}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Statut actuel</span>
                    <span className="font-semibold">{entete.statut}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fournisseur</span>
                    <span className="font-semibold">{entete.HotelProspectionEntete.fournisseur.libelle}</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                  <span>⚠️</span>
                  <p className="text-xs text-amber-800">Cette action est <strong>irréversible</strong>. Aucune donnée supplémentaire n'est requise.</p>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowReglerModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button onClick={handleReglerFacture} disabled={reglerLoading}
                  className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${reglerLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                  {reglerLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Envoi...</> : '💳 Confirmer le règlement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Annulation */}
        {showAnnulationModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">✕ Annulation de réservation</h3>
                  <p className="text-sm text-red-600 mt-0.5">
                    {entete.HotelProspectionEntete.numeroEntete} — {entete.HotelProspectionEntete.fournisseur.libelle}
                  </p>
                </div>
                <button onClick={() => setShowAnnulationModal(false)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Raison d'annulation <span className="text-red-600">*</span></label>
                  {raisonsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Chargement des raisons...
                    </div>
                  ) : (
                    <select value={annulationForm.rasionAnnulationId}
                      onChange={(e) => setAnnulationForm((prev) => ({ ...prev, rasionAnnulationId: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Sélectionner une raison</option>
                      {raisonsAnnulation.map((raison) => (
                        <option key={raison.id} value={raison.id}>{raison.libelle}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Condition d'annulation <span className="text-red-600">*</span></label>
                  <input type="text" value={annulationForm.conditionAnnul}
                    onChange={(e) => setAnnulationForm((prev) => ({ ...prev, conditionAnnul: e.target.value }))}
                    placeholder="Ex: Annulation client, force majeure..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {(annulationForm.rasionAnnulationId || annulationForm.conditionAnnul) && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-800 uppercase">Récapitulatif</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Raison</span>
                      <span className="font-semibold text-gray-900">
                        {raisonsAnnulation.find((r) => r.id === annulationForm.rasionAnnulationId)?.libelle || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Condition</span>
                      <span className="font-semibold text-gray-900">{annulationForm.conditionAnnul || '—'}</span>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                  <span>⚠️</span>
                  <p className="text-xs text-amber-800">Cette action est <strong>irréversible</strong>. La réservation sera définitivement annulée.</p>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowAnnulationModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Fermer</button>
                <button onClick={handleAnnuler}
                  disabled={annulationLoading || !annulationForm.rasionAnnulationId || !annulationForm.conditionAnnul.trim()}
                  className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                    annulationLoading || !annulationForm.rasionAnnulationId || !annulationForm.conditionAnnul.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {annulationLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Annulation...</> : "✕ Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>{/* fin min-h-screen */}
    </TabContainer>
  );
};

export default HotelReservationDetail;