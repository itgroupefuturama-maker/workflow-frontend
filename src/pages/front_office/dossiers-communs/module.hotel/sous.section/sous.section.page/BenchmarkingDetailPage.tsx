import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { createBenchmarkingLigne, fetchBenchmarkingDetail, sendBenchmarkingDevis, setBenchmarkOfficial } from '../../../../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';
import ModalBenchmarkingLigneForm from '../../components/ModalBenchmarkingLigneForm';
import { HotelHeader } from '../../components/HotelHeader';
import ModalConfirmDevis from '../../components/ModalConfirmDevis';
// import { API_URL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import LoadingButton from '../../components/LoadingButton';

const BenchmarkingDetailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedId = useSelector((state: RootState) => state.hotelProspectionEntete.selectedId);
  const { detail, loadingDetail, errorDetail } = useSelector(
    (state: RootState) => state.hotelProspectionEntete
  );

  const [showLigneModal, setShowLigneModal] = useState(false);
  const [settingBenchmark, setSettingBenchmark] = useState(false);
  const [sendingDevis, setSendingDevis] = useState(false);

  // Récupère les listes depuis Redux
  const { items: plateformes } = useSelector((state: RootState) => state.plateforme);
  const { items: typesChambre } = useSelector((state: RootState) => state.typeChambre);

  const tabs = [
    { id: 'benchmarking', label: 'Listes des entête benchmarking' },
    { id: 'hotel', label: 'Listes des reservation hotel' }
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'benchmarking');

  // États pour les données éditables de Booking et Client
  const [bookingData, setBookingData] = useState({
    nuiteDevise: 0,
    tauxChange: 0,
    nuiteAriary: 0,
    montantDevise: 0,
    montantAriary: 0,
  });

  const [clientData, setClientData] = useState({
    nuiteDevise: 0,
    tauxChange: 0,
    nuiteAriary: 0,
    montantDevise: 0,
    montantAriary: 0,
  });

  // État pour la commission
  const [commissionData, setCommissionData] = useState({
    tauxPrixUnitaire: 0,       // % sur Prix Unit. (en pourcentage)
    forfaitaireUnitaire: 0,    // Forfaitaire Unit.
    forfaitaireGlobal: 0,      // Forfaitaire Global
    montantCommission: 0,       // Montant Commission
  });

  const [showConfirmDevisModal, setShowConfirmDevisModal] = useState(false);

  // const [generatingPdfDirection, setGeneratingPdfDirection] = useState(false);

  // Trouver la ligne de benchmark et les plateformes
  const benchmarkLine = useMemo(
    () => detail?.benchmarkingLigne.find(ligne => ligne.isBenchMark),
    [detail?.benchmarkingLigne]  // ne recalcule que si la liste change
  );

  const hasLigneClient = detail?.benchmarkingLigne.some(
    (ligne) => ligne.plateforme?.nom?.toLowerCase() === 'client'
  );

  const [nbChambreClient, setNbChambreClient] = useState(benchmarkLine?.nombreChambre);

  const bookingPlateforme = useMemo(
    () => plateformes.find(p => p.nom?.toLowerCase() === 'booking'),
    [plateformes]
  );

  const clientPlateforme = useMemo(
    () => plateformes.find(p => p.nom?.toLowerCase() === 'client'),
    [plateformes]
  );

  const hasBenchmarkLine = detail?.benchmarkingLigne.some(
    (ligne) => ligne.isBenchMark === true
  );

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchBenchmarkingDetail(selectedId));
    }
  }, [dispatch, selectedId]);

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
    if (id === 'hotel') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/hotel/pages`, { 
        state: { targetTab: 'hotel' }
      });
    } else {
      setActiveTab(id);
    }
  };

  // ✅ APRÈS — on dépend de l'ID stable au lieu de l'objet entier
  const benchmarkLineId = benchmarkLine?.id;

  useEffect(() => {
    if (!benchmarkLine || !detail) return;

    const nuiteDevise = benchmarkLine.nuiteDevise || 0;
    const tauxChange  = benchmarkLine.tauxChange  || 0;
    const nuiteAriary = benchmarkLine.nuiteAriary  || 0;
    const nbChambre   = benchmarkLine.nombreChambre || 0;

    setBookingData({
      nuiteDevise,
      tauxChange,
      nuiteAriary,
      montantDevise: nuiteDevise * nbChambre,
      montantAriary: nuiteAriary * nbChambre,
    });

    setClientData({
      nuiteDevise,
      tauxChange,
      nuiteAriary,
      montantDevise: nuiteDevise * nbChambre,
      montantAriary: nuiteAriary * nbChambre,
    });

    setNbChambreClient(benchmarkLine?.nombreChambre);

    // ── Initialisation avec les valeurs de "Informations générales" ──
    setCommissionData({
      tauxPrixUnitaire:    detail.tauxPrixUnitaire    || 0,  // Taux unitaire
      forfaitaireUnitaire: detail.forfaitaireUnitaire || 0,  // Forfait unitaire
      forfaitaireGlobal:   detail.forfaitaireGlobal   || 0,  // Forfait global
      montantCommission:   detail.montantCommission   || 0,  // Commission
    });

  }, [benchmarkLineId, detail?.id]);

  // Handler pour les changements de commission
  const handleCommissionChange = (field: string, value: number) => {
    const updated = { ...commissionData };
    const prixBenchmark = benchmarkLine?.nuiteDevise || 0;

    if (field === 'tauxPrixUnitaire') {
      // % sur Prix Unit. changé (value est en pourcentage, ex: 5 pour 5%)
      updated.tauxPrixUnitaire = value;
      updated.forfaitaireUnitaire = prixBenchmark * (value / 100); // Convertir % en décimal
      updated.forfaitaireGlobal = updated.forfaitaireUnitaire * (nbChambreClient || 1);
      updated.montantCommission = updated.forfaitaireGlobal;
    } else if (field === 'forfaitaireUnitaire') {
      // Forfaitaire Unit. changé
      updated.forfaitaireUnitaire = value;
      updated.forfaitaireGlobal = value * (nbChambreClient || 1);
      updated.tauxPrixUnitaire = prixBenchmark > 0 ? (value / prixBenchmark) * 100 : 0; // Convertir en %
      updated.montantCommission = updated.forfaitaireGlobal;
    } else if (field === 'forfaitaireGlobal') {
      // Forfaitaire Global changé
      updated.forfaitaireGlobal = value;
      updated.forfaitaireUnitaire = (nbChambreClient || 1) > 0 ? value / (nbChambreClient || 1) : 0;
      updated.tauxPrixUnitaire = prixBenchmark > 0 ? (updated.forfaitaireUnitaire / prixBenchmark) * 100 : 0; // Convertir en %
      updated.montantCommission = value;
    }

    setCommissionData(updated);

    // Mettre à jour automatiquement le prix Client
    updateClientPriceFromCommission(updated.forfaitaireUnitaire);
  };

  // Mettre à jour le prix Client basé sur la commission
  const updateClientPriceFromCommission = (forfaitaireUnitaire: number) => {
    if (!benchmarkLine || !detail) return;

    const prixBenchmark = benchmarkLine.nuiteDevise || 0;
    const newNuiteDevise = prixBenchmark + forfaitaireUnitaire;
    const newNuiteAriary = newNuiteDevise * clientData.tauxChange;
    const newMontantAriary = newNuiteAriary * (nbChambreClient || 1);

    setClientData(prev => ({
      ...prev,
      nuiteDevise: newNuiteDevise,
      nuiteAriary: newNuiteAriary,
      montantDevise: newNuiteDevise * (detail?.nuite || 1),
      montantAriary: newMontantAriary,
    }));
  };

  // Handlers pour les changements de valeurs
  const handleBookingChange = (field: string, value: number) => {
    const updated = { ...bookingData, [field]: value };

    // Recalculer automatiquement les montants
    if (field === 'nuiteDevise' || field === 'tauxChange') {
      if (field === 'nuiteDevise') {
        updated.nuiteAriary = value * bookingData.tauxChange;
        updated.montantDevise = value * (detail?.nuite || 1);
        updated.montantAriary = updated.nuiteAriary * (detail?.nuite || 1);
      } else if (field === 'tauxChange') {
        updated.nuiteAriary = bookingData.nuiteDevise * value;
        updated.montantAriary = updated.nuiteAriary * (detail?.nuite || 1);
      }
    }

    setBookingData(updated);
  };

  const handleClientChange = (field: string, value: number) => {
    if (field === 'tauxChange') {
      const updated = { ...clientData };
      const prixBenchmark = benchmarkLine?.nuiteDevise || 0;
      const nuiteDevise = prixBenchmark + commissionData.forfaitaireUnitaire;
      
      updated.tauxChange = value;
      updated.nuiteDevise = nuiteDevise;
      updated.nuiteAriary = nuiteDevise * value;
      updated.montantDevise = nuiteDevise * (detail?.nuite || 1);
      updated.montantAriary = updated.nuiteAriary * (nbChambreClient || 1);

      setClientData(updated);
    }
  };

  // Handler pour envoyer le devis
  const handleSendDevis = () => {
    if (!detail || !benchmarkLine || !bookingPlateforme || !clientPlateforme) {
      alert('Données manquantes pour envoyer le devis');
      return;
    }

    // Ouvrir la modal de confirmation
    setShowConfirmDevisModal(true);
  };

  // Ajoutez la nouvelle fonction pour l'envoi réel
  const handleConfirmSendDevis = async () => {
    if (!detail || !benchmarkLine || !bookingPlateforme || !clientPlateforme) {
      return;
    }

    setSendingDevis(true);

    try {
      const payload = {
        benchmarkingId: detail.id,
        dataBooking: {
          benchmarkingEnteteId: detail.id,
          hotel: benchmarkLine.hotel,
          plateformeId: bookingPlateforme.id,
          typeChambreId: benchmarkLine.typeChambre?.id || '',
          nuiteDevise: bookingData.nuiteDevise,
          devise: benchmarkLine.devise,
          tauxChange: bookingData.tauxChange,
          nuiteAriary: bookingData.nuiteAriary,
          montantDevise: bookingData.montantDevise,
          montantAriary: bookingData.montantAriary,
        },
        dataClient: {
          benchmarkingEnteteId: detail.id,
          hotel: benchmarkLine.hotel,
          plateformeId: clientPlateforme.id,
          typeChambreId: benchmarkLine.typeChambre?.id || '',
          nuiteDevise: clientData.nuiteDevise,
          devise: benchmarkLine.devise,
          tauxChange: clientData.tauxChange,
          nuiteAriary: clientData.nuiteAriary,
          montantDevise: clientData.montantDevise,
          montantAriary: clientData.montantAriary,
        },
        dataCommission: {
          tauxPrixUnitaire: commissionData.tauxPrixUnitaire,
          forfaitaireUnitaire: commissionData.forfaitaireUnitaire,
          forfaitaireGlobal: commissionData.forfaitaireGlobal,
          montantCommission: commissionData.montantCommission * clientData.tauxChange,
        },
      };

      await dispatch(sendBenchmarkingDevis(payload)).unwrap();
      dispatch(fetchBenchmarkingDetail(selectedId!));
      setShowConfirmDevisModal(false);
      alert('Devis envoyé avec succès !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi du devis');
    } finally {
      setSendingDevis(false);
    }
  };

  // Handler création
  const handleCreateLigne = (data: any) => {
    dispatch(createBenchmarkingLigne(data)).then((result) => {
      if (createBenchmarkingLigne.fulfilled.match(result)) {
        setShowLigneModal(false);
        if (selectedId) {
          dispatch(fetchBenchmarkingDetail(selectedId));
        }
      } else {
        alert(result.payload || 'Erreur lors de la création de la ligne');
      }
    });
  };

  const handleSetBenchmark = async () => {
    if (!detail?.id) return;

    if (!window.confirm("Confirmez-vous de définir ce benchmarking comme référence officielle ?")) {
      return;
    }
    setSettingBenchmark(true);

    console.log(`detail sssss : ${detail.id}`);
    

    try {
      await dispatch(setBenchmarkOfficial(detail.id)).unwrap();
      alert("Benchmark défini avec succès !");
      dispatch(fetchBenchmarkingDetail(detail.id));
      
      console.log("tonga eto");
    } catch (err: any) {
      console.log("tsy tonga");
      alert(err.message || "Erreur lors de la définition du benchmark");
    } finally {
      setSettingBenchmark(false);
    }
  };

  if (!selectedId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-neutral-600 mb-4">Aucun benchmarking sélectionné</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-sm text-neutral-900 hover:underline"
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (loadingDetail) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-neutral-500">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (errorDetail || !detail) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border-l-4 border-red-600 p-6 rounded-lg">
          <p className="text-red-800">{errorDetail || 'Impossible de charger les détails du benchmarking'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-red-900 hover:underline"
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-neutral-50">
        <div className="mb-8">
          <HotelHeader numerohotel={detail.numero} navigate={navigate} isDetail={true} isBenchmarking={true}/>
        </div>
        {/* En-tête avec navigation + boutons d'actions */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Benchmarking <span className="font-mono text-neutral-600">#{detail?.numero}</span>
              </h1>
            </div>
            {/* Nouveaux boutons d'actions */}
          </div>
        </div>

          {/* Informations générales du benchmarking */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-5 pb-3 border-b border-neutral-200">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                  Période
                </div>
                <div className="text-sm text-neutral-900">
                  {formatDate(detail.du)} → {formatDate(detail.au)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                  Nuits
                </div>
                <div className="text-sm font-medium text-neutral-900">{detail.nuite}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                  Lieu
                </div>
                <div className="text-sm text-neutral-900">
                  {detail.ville}, {detail.pays}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                  En-tête associée
                </div>
                <div className="text-sm font-mono text-neutral-900">
                  {detail.hotelProspectionEntete?.numeroEntete || '—'}
                </div>
              </div>
            </div>

            {/* Tarifs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-50 rounded-md p-4">
                <div className="text-xs text-neutral-500 mb-1">Taux unitaire</div>
                <div className="font-mono text-lg font-semibold text-neutral-900">
                  {detail.tauxPrixUnitaire.toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="bg-neutral-50 rounded-md p-4">
                <div className="text-xs text-neutral-500 mb-1">Forfait unitaire</div>
                <div className="font-mono text-lg font-semibold text-neutral-900">
                  {detail.forfaitaireUnitaire.toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="bg-neutral-50 rounded-md p-4">
                <div className="text-xs text-neutral-500 mb-1">Forfait global</div>
                <div className="font-mono text-lg font-semibold text-neutral-900">
                  {detail.forfaitaireGlobal.toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="bg-neutral-900 rounded-md p-4">
                <div className="text-xs text-neutral-300 mb-1">Commission</div>
                <div className="font-mono text-lg font-semibold text-white">
                  {detail.montantCommission.toLocaleString('fr-FR')} Ar
                </div>
              </div>
            </div>
          </div>

          {/* Services inclus */}
          {detail.benchService?.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
                Services inclus ({detail.benchService.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {detail.benchService.map((bs) => (
                  <span
                    key={bs.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                  >
                    {bs.serviceHotel?.service || 'Service inconnu'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Liste des lignes de benchmarking */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Titre + compteur */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Benchmarking</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-base font-semibold text-gray-800">Lignes de benchmarking</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    {detail.benchmarkingLigne.length}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">

                {/* Définir comme benchmark officiel */}
                <LoadingButton
                  label="Définir le minimum"
                  loadingLabel="En cours..."
                  isLoading={settingBenchmark}
                  disabled={settingBenchmark || loadingDetail || hasLigneClient || hasBenchmarkLine || false }
                  onClick={handleSetBenchmark}
                  variant="success"
                  icon={
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                />

                {/* Ajouter une ligne */}
                <button
                  onClick={() => setShowLigneModal(true)}
                  disabled={hasBenchmarkLine}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    hasBenchmarkLine
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-800 text-gray-800 bg-white hover:bg-gray-50'
                  }`}
                  title={hasBenchmarkLine ? 'Un benchmark officiel est déjà défini' : undefined}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  {hasBenchmarkLine ? 'Ligne verrouillée' : 'Ajouter une ligne'}
                </button>
              </div>
            </div>

            {detail.benchmarkingLigne.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-neutral-500">Aucune ligne de benchmarking</p>
                <p className="text-xs text-neutral-400 mt-1">Commencez par ajouter une première ligne</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* table lignes de benchmarking */}
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Plateforme
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Hôtel
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Type chambre
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Prix/nuit
                      </th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Nb chambre
                      </th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Devise
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Taux
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Prix Ariary
                      </th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Benchmark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.benchmarkingLigne.map((ligne, index) => (
                      <tr 
                        key={ligne.id} 
                        className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                          index === detail.benchmarkingLigne.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          <div>{ligne.plateforme?.nom}</div>
                          <div className="text-xs text-neutral-500">{ligne.plateforme?.code}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-sm text-neutral-900">
                          {ligne.hotel}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          <div>{ligne.typeChambre?.type}</div>
                          <div className="text-xs text-neutral-500">
                            {ligne.typeChambre?.capacite} pers.
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-mono text-neutral-900">
                          {ligne.nuiteDevise?.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-medium text-neutral-600">
                          {ligne.nombreChambre || 1}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-medium text-neutral-600">
                          {ligne.devise}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-mono text-neutral-600">
                          {ligne.tauxChange?.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-mono font-medium text-neutral-900">
                          {ligne.nuiteAriary?.toLocaleString('fr-FR')} <span className="text-neutral-500">Ar</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ligne.isBenchMark ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white">
                              Oui
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                              Non
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tableau de Synthèse Financière */}
                <div className="pt-6 bg-neutral-50 border-t border-neutral-200">
                  <div className="px-6 mb-4 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-neutral-700 uppercase">Synthèse Financière</h3>
                    <button
                      onClick={handleSendDevis}
                      disabled={sendingDevis || !benchmarkLine || !bookingPlateforme || !clientPlateforme || hasLigneClient}
                      className={`
                        px-5 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 transition-colors
                        ${sendingDevis || !benchmarkLine || !bookingPlateforme || !clientPlateforme || hasLigneClient
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                        }
                      `}
                    >
                      {sendingDevis ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {hasLigneClient ? 'Commission déjà validée' : 'Valider Commission'}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Tableau principal */}
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full border-collapse bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-neutral-800 text-white">
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Plateforme</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Pays</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Ville</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Hôtel</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Type Chambre</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nuitée (Devise)</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Devise</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Taux Change</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nuitée (Ar)</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nb chambre</th>
                            <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Montant (Ar)</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-neutral-800">
                          {/* Ligne 1 : Plateforme (Benchmark - non éditable) */}
                          {benchmarkLine && (
                            <tr>
                              <td className="px-3 py-2 border border-neutral-200 bg-blue-50 font-bold">
                                {benchmarkLine.plateforme?.nom || 'Plateforme'}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type || 'Standard'}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.nuiteDevise?.toLocaleString('fr-FR')}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{benchmarkLine.devise}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.tauxChange?.toLocaleString('fr-FR')}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.nuiteAriary?.toLocaleString('fr-FR')}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.nombreChambre }
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold">
                                {((benchmarkLine.nuiteAriary || 0) * (detail?.nuite || 0))?.toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          )}
                          
                          {/* Ligne 2 : Booking (Éditable) */}
                          {bookingPlateforme && benchmarkLine && (
                            <tr>
                              <td className="px-3 py-2 border border-neutral-200 bg-neutral-50 font-bold">
                                {bookingPlateforme.nom}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type}</td>
                              <td className="px-3 py-2 border border-neutral-200">
                                <input
                                  type="number"
                                  value={bookingData.nuiteDevise}
                                  onChange={(e) => handleBookingChange('nuiteDevise', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{benchmarkLine.devise}</td>
                              <td className="px-3 py-2 border border-neutral-200">
                                <input
                                  type="number"
                                  value={bookingData.tauxChange}
                                  onChange={(e) => handleBookingChange('tauxChange', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono bg-neutral-100">
                                {bookingData.nuiteAriary?.toLocaleString('fr-FR')}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.nombreChambre}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">
                                {bookingData.montantAriary?.toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          )}

                          {/* Ligne 3 : Client (Éditable - taux de change et nb chambres) */}
                          {clientPlateforme && benchmarkLine && (
                            <tr>
                              <td className="px-3 py-2 border border-neutral-200 bg-neutral-100 font-bold italic">
                                {clientPlateforme.nom}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                              <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type}</td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono bg-blue-50">
                                {clientData.nuiteDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <div className="text-[8px] text-neutral-500 mt-0.5">
                                  ({benchmarkLine.nuiteDevise?.toLocaleString('fr-FR')} + {commissionData.forfaitaireUnitaire?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </div>
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-center">{benchmarkLine.devise}</td>
                              <td className="px-3 py-2 border border-neutral-200">
                                <input
                                  type="number"
                                  value={clientData.tauxChange}
                                  onChange={(e) => handleClientChange('tauxChange', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono bg-neutral-100">
                                {clientData.nuiteAriary?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                {benchmarkLine.nombreChambre }
                              </td>
                              {/* <td className="px-3 py-2 border border-neutral-200">
                                <input
                                  type="number"
                                  min={benchmarkLine.nombreChambre}
                                  value={nbChambreClient}
                                  onChange={(e) => handleNbChambreClientChange(parseInt(e.target.value) || benchmarkLine.nombreChambre)}
                                  className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td> */}
                              <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">
                                {clientData.montantAriary?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Section Commission (Éditable) */}
                    <div className="w-full lg:w-80 space-y-4">
                      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-neutral-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider">
                          Calcul Commission
                        </div>
                        {/* % sur Prix Unit. */}
                        <div className="border-b border-neutral-200 bg-neutral-50">
                          <div className="px-3 py-2 text-[10px] font-bold text-neutral-600 uppercase text-center">
                            % sur Prix Unit.
                          </div>
                          <div className="px-3 pb-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={commissionData.tauxPrixUnitaire}
                                onChange={(e) => handleCommissionChange('tauxPrixUnitaire', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 pr-8 text-center font-mono text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">%</span>
                            </div>
                          </div>
                        </div>

                        {/* Forfaitaire Unit. */}
                        <div className="border-b border-neutral-200 bg-white">
                          <div className="px-3 py-2 text-[10px] font-bold text-neutral-600 uppercase text-center">
                            Forfaitaire Unit.
                          </div>
                          <div className="px-3 pb-3">
                            <input
                              type="number"
                              step="0.01"
                              value={commissionData.forfaitaireUnitaire}
                              onChange={(e) => handleCommissionChange('forfaitaireUnitaire', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-center font-mono text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Forfaitaire Global */}
                        <div className="bg-neutral-50">
                          <div className="px-3 py-2 text-[10px] font-bold text-neutral-600 uppercase text-center">
                            Forfaitaire Global
                          </div>
                          <div className="px-3 pb-3">
                            <input
                              type="number"
                              step="0.01"
                              value={commissionData.forfaitaireGlobal}
                              onChange={(e) => handleCommissionChange('forfaitaireGlobal', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-center font-mono text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Montant Commission (calculé automatiquement) */}
                      <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm bg-white">
                        <div className="bg-neutral-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider">
                          Montant Commission
                        </div>
                        <div className="px-4 py-4 text-center text-xl font-bold font-mono text-blue-700">
                          {commissionData.montantCommission?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-sans text-neutral-500 uppercase">{benchmarkLine?.devise}</span>
                        </div>
                        <div className="px-4 py-2 text-center text-sm font-mono text-neutral-600 bg-neutral-50">
                          {(commissionData.montantCommission * clientData.tauxChange).toFixed(2)} Ar
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ModalConfirmDevis
            isOpen={showConfirmDevisModal}
            onClose={() => setShowConfirmDevisModal(false)}
            onConfirm={handleConfirmSendDevis}
            data={{
              detail,
              benchmarkLine,
              bookingData,
              clientData,
              commissionData,
              bookingPlateforme,
              clientPlateforme,
              nbChambreClient,
            }}
            loading={sendingDevis}
          />
          {/* Modal création ligne */}
          <ModalBenchmarkingLigneForm
            isOpen={showLigneModal}
            onClose={() => setShowLigneModal(false)}
            onSubmit={handleCreateLigne}
            plateformes={plateformes}
            typesChambre={typesChambre}
            benchmarkingEnteteId={detail.id}
            loading={false}
          />
      </div>
    </TabContainer>
  );
};

export default BenchmarkingDetailPage;