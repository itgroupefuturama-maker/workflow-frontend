import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { createBenchmarkingLigne, fetchBenchmarkingDetail, sendBenchmarkingDevis, setBenchmarkOfficial, type CreateBenchmarkingLignePayload } from '../../../../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';
import ModalBenchmarkingLigneForm from '../../components/ModalBenchmarkingLigneForm';
import { HotelHeader } from '../../components/HotelHeader';
import ModalConfirmDevis from '../../components/ModalConfirmDevis';
// import { API_URL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import LoadingButton from '../../components/LoadingButton';
import ConfirmBenchmarkModal from '../../../../../../components/modals/Hotel/ConfirmBenchmarkModal';
import PanneauPreferencesClient from '../../components/PanneauPreferencesClient';
import { ChevronDown, Heart } from 'lucide-react';
import { setShowPreferences, togglePreferences } from '../../../../../../app/uiSlice';

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

  const showPreferences = useSelector((state: RootState) => state.ui.showPreferences);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête benchmarking' },
    { id: 'hotel', label: 'Listes des reservation hotel' }
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = useMemo(() => 
    dossierActif?.dossierCommunColab
      ?.find((colab) => colab.module?.nom?.toLowerCase() === 'hotel')
      ?.prestation?.[0]?.id || '',
    [dossierActif]
  );

  const [clientDataMap, setClientDataMap] = useState<Record<string, {
    nuiteDevise: number;
    tauxChange: number;
    nuiteAriary: number;
    montantDevise: number;
    montantAriary: number;
  }>>({});

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

    const nbChambre = benchmarkLine.nombreChambre || 0;

    // Initialiser une entrée par devise
    const initialMap: typeof clientDataMap = {};

    if (benchmarkLine.deviseHotel?.length > 0) {
      benchmarkLine.deviseHotel.forEach((dv) => {
        const nuiteDevise = Number(dv.nuiteDevise) || 0;
        const tauxChange  = dv.tauxChange || 0;
        const nuiteAriary  = nuiteDevise * tauxChange;
        const montantDevise = nuiteDevise * nbChambre;       // sans nuite
        const montantAriary = montantDevise * tauxChange;

        initialMap[dv.id] = {
          nuiteDevise,
          tauxChange,
          nuiteAriary,
          montantDevise,
          montantAriary,
        };
      });
    }

    setClientDataMap(initialMap);
    setNbChambreClient(nbChambre);

    setCommissionData({
      tauxPrixUnitaire:    detail.tauxPrixUnitaire    || 0,
      forfaitaireUnitaire: detail.forfaitaireUnitaire || 0,
      forfaitaireGlobal:   detail.forfaitaireGlobal   || 0,
      montantCommission:   detail.montantCommission   || 0,
    });

  }, [benchmarkLineId, detail?.id]);

  // Handler pour les changements de commission
  const handleCommissionChange = (field: string, value: number) => {
    const updated = { ...commissionData };

    setClientDataMap(prev => {
      const updatedMap = { ...prev };

      if (field === 'tauxPrixUnitaire') {
        updated.tauxPrixUnitaire = value;

        benchmarkLine?.deviseHotel?.forEach((dv) => {
          const current = prev[dv.id];
          if (!current) return;

          const prixBenchmark  = Number(dv.nuiteDevise) || 0;  // prix ligne 1 (référence fixe)
          const nbChambre      = benchmarkLine.nombreChambre || 1;

          // commission = prixBenchmark * taux / 100
          const commissionDevise  = prixBenchmark * (value / 100);

          // nouveau prix client = prix ligne 1 + commission
          const newNuiteDevise    = prixBenchmark + commissionDevise;
          const newNuiteAriary    = newNuiteDevise * current.tauxChange;
          const newMontantDevise  = newNuiteDevise * nbChambre;
          const newMontantAriary  = newNuiteAriary * nbChambre;

          // forfaitaire unitaire = différence devise client - devise ligne 1
          const forfaitaireUnitaire = newNuiteDevise - prixBenchmark; // = commissionDevise

          updated.forfaitaireUnitaire = forfaitaireUnitaire;
          updated.forfaitaireGlobal   = forfaitaireUnitaire * (detail?.nuite || 1);
          updated.montantCommission   = updated.forfaitaireGlobal;

          updatedMap[dv.id] = {
            ...current,
            nuiteDevise:   newNuiteDevise,
            nuiteAriary:   newNuiteAriary,
            montantDevise: newMontantDevise,
            montantAriary: newMontantAriary,
          };
        });

      } else if (field === 'forfaitaireUnitaire') {
        updated.forfaitaireUnitaire = value;

        benchmarkLine?.deviseHotel?.forEach((dv) => {
          const current = prev[dv.id];
          if (!current) return;

          const prixBenchmark    = Number(dv.nuiteDevise) || 0;
          const nbChambre        = benchmarkLine.nombreChambre || 1;

          // nouveau prix client = prix ligne 1 + forfaitaire unitaire
          const newNuiteDevise   = prixBenchmark + value;
          const newNuiteAriary   = newNuiteDevise * current.tauxChange;
          const newMontantDevise = newNuiteDevise * nbChambre;
          const newMontantAriary = newNuiteAriary * nbChambre;

          // recalculer le % depuis prixBenchmark
          updated.tauxPrixUnitaire  = prixBenchmark > 0 ? (value / prixBenchmark) * 100 : 0;
          updated.forfaitaireGlobal = value * (detail?.nuite || 1);
          updated.montantCommission = updated.forfaitaireGlobal;

          updatedMap[dv.id] = {
            ...current,
            nuiteDevise:   newNuiteDevise,
            nuiteAriary:   newNuiteAriary,
            montantDevise: newMontantDevise,
            montantAriary: newMontantAriary,
          };
        });

      } else if (field === 'forfaitaireGlobal') {
        updated.forfaitaireGlobal = value;

        // forfaitaireUnitaire = forfaitaireGlobal / nuite
        const forfaitaireUnitaire   = (detail?.nuite || 1) > 0 ? value / (detail?.nuite || 1) : 0;
        updated.forfaitaireUnitaire = forfaitaireUnitaire;
        updated.montantCommission   = value;

        benchmarkLine?.deviseHotel?.forEach((dv) => {
          const current = prev[dv.id];
          if (!current) return;

          const prixBenchmark    = Number(dv.nuiteDevise) || 0;
          const nbChambre        = benchmarkLine.nombreChambre || 1;

          const newNuiteDevise   = prixBenchmark + forfaitaireUnitaire;
          const newNuiteAriary   = newNuiteDevise * current.tauxChange;
          const newMontantDevise = newNuiteDevise * nbChambre;
          const newMontantAriary = newNuiteAriary * nbChambre;

          updated.tauxPrixUnitaire = prixBenchmark > 0
            ? (forfaitaireUnitaire / prixBenchmark) * 100
            : 0;

          updatedMap[dv.id] = {
            ...current,
            nuiteDevise:   newNuiteDevise,
            nuiteAriary:   newNuiteAriary,
            montantDevise: newMontantDevise,
            montantAriary: newMontantAriary,
          };
        });
      }

      setCommissionData(updated);
      return updatedMap;
    });
  };

  const handleClientChange = (deviseId: string, field: string, value: number) => {
    if (field === 'tauxChange') {
      const nbChambre = nbChambreClient || 1;
      const current = clientDataMap[deviseId];
      if (!current) return;

      const nuiteDevise   = current.nuiteDevise;
      const nuiteAriary   = nuiteDevise * value;
      const montantDevise = nuiteDevise * nbChambre;        // sans nuite
      const montantAriary = montantDevise * value;

      setClientDataMap(prev => ({
        ...prev,
        [deviseId]: {
          ...prev[deviseId],
          tauxChange: value,
          nuiteAriary,
          montantDevise,
          montantAriary,
        },
      }));
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
    if (!detail || !benchmarkLine || !clientPlateforme) return;

    setSendingDevis(true);

    try {
      // Construire le tableau devises depuis clientDataMap
      const devises = benchmarkLine.deviseHotel?.map((dv) => {
        const cd = clientDataMap[dv.id];
        return {
          deviseId:      dv.devise?.id,
          nuiteDevise:   cd?.nuiteDevise   ?? 0,
          tauxChange:    cd?.tauxChange    ?? 0,
          nuiteAriary:   cd?.nuiteAriary   ?? 0,
          montantDevise: cd?.montantDevise ?? 0,
          montantAriary: cd?.montantAriary ?? 0,
        };
      }) ?? [];

      // Commission basée sur la première devise
      const firstDv = benchmarkLine.deviseHotel?.[0];
      const firstCd = firstDv ? clientDataMap[firstDv.id] : null;
      const prixLigne1     = Number(firstDv?.nuiteDevise) || 0;
      const forfaitUnit    = (firstCd?.nuiteDevise ?? 0) - prixLigne1;
      const forfaitGlobal  = forfaitUnit * (detail.nuite || 1);
      const montantCommission = forfaitGlobal * (firstCd?.tauxChange ?? 1);

      const payload = {
        benchmarkingId: detail.id,
        dataClient: {
          benchmarkingEnteteId: detail.id,
          hotel:         benchmarkLine.hotel,
          plateformeId:  clientPlateforme.id,
          typeChambreId: benchmarkLine.typeChambre?.id || '',
          devises,
        },
        dataCommission: {
          tauxPrixUnitaire:    commissionData.tauxPrixUnitaire,
          forfaitaireUnitaire: forfaitUnit,
          forfaitaireGlobal:   forfaitGlobal,
          montantCommission:   montantCommission,
        },
      };

      await dispatch(sendBenchmarkingDevis(payload)).unwrap();
      dispatch(fetchBenchmarkingDetail(selectedId!));
      setShowConfirmDevisModal(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi du devis');
    } finally {
      setSendingDevis(false);
    }
  };

  // Handler création
  const handleCreateLigne = (data: CreateBenchmarkingLignePayload) => {
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

  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);


  const handleSetBenchmark = () => {
    if (!detail?.id) return;
    setShowBenchmarkModal(true);
  };

  // Mettre à jour la signature pour recevoir benchmarkingLigneId
  const handleConfirmBenchmark = async (isRefundable: boolean, benchmarkingLigneId: string) => {
    if (!detail?.id) return;
    setSettingBenchmark(true);

    try {
      await dispatch(setBenchmarkOfficial({ 
        benchmarkingId: detail.id, 
        isRefundable,
        benchmarkingLigneId, // ← nouveau
      })).unwrap();
      setShowBenchmarkModal(false);
      dispatch(fetchBenchmarkingDetail(detail.id));
    } catch (err: any) {
      alert(err.message || "Erreur lors de la définition du benchmark");
    } finally {
      setSettingBenchmark(false);
    }
  };

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('dossierActifCard_isOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem('dossierActifCard_isOpen', String(next));
      return next;
    });
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
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 ">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 pt-2 border-b border-neutral-200 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1 ">
                <HotelHeader
                  numerohotel={detail?.numero}
                  navigate={navigate}
                  isDetail={true}
                  isBenchmarking={true}
                />
                <div className='flex gap-2'>
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
                  <button
                    onClick={() => dispatch(togglePreferences())}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      showPreferences
                        ? 'bg-slate-700 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {showPreferences ? 'Masquer les préférences' : 'Préférences client'}
                  </button>
                </div>
              </div>

              {/* Informations générales du benchmarking */}
              <div className="bg-white border border-neutral-200 rounded-lg mb-2 shadow-sm ">
                <div className='flex items-center justify-between p-4'  onClick={handleToggle}>
                  <h1 className="text-2xl md:text-xl font-bold text-neutral-900">
                    Benchmarking{' '}
                    <span className="font-mono text-neutral-600">#{detail?.numero}</span>
                  </h1>
                  {/* ── Bouton collapse ── */}
                  <button
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                    title={isOpen ? 'Réduire' : 'Agrandir'}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-250 ${isOpen ? '' : '-rotate-90'}`}
                    />
                  </button>
                </div>
                <div
                  className={`border-t border-neutral-200 transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4 pl-6 pr-6 pt-3">
                    <div>
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                        Période
                      </div>
                      <div className="text-sm text-neutral-900">
                        {formatDate(detail?.du)} → {formatDate(detail?.au)}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6 pr-6 pb-2">
                    <div className="">
                      <div className="text-xs text-neutral-500 mb-1">Taux unitaire</div>
                      <div className="font-mono text-lg font-semibold text-neutral-900">
                        {detail.tauxPrixUnitaire.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="">
                      <div className="text-xs text-neutral-500 mb-1">Forfait unitaire</div>
                      <div className="font-mono text-lg font-semibold text-neutral-900">
                        {detail.forfaitaireUnitaire.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="">
                      <div className="text-xs text-neutral-500 mb-1">Forfait global</div>
                      <div className="font-mono text-lg font-semibold text-neutral-900">
                        {detail.forfaitaireGlobal.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="">
                      <div className="text-xs text-neutral-500 mb-1">Commission</div>
                      <div className="font-mono text-lg font-semibold text-neutral-900">
                        {detail.montantCommission.toLocaleString('fr-FR')} Ar
                      </div>
                    </div>
                  </div>
                  {/* Services inclus */}
                  {detail.benchService?.length > 0 && (
                    <div className="bg-white rounded-b-lg border-t border-neutral-200 pl-6 pr-6 pt-2 pb-4">
                      <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
                        Services inclus ({detail.benchService.length})
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {detail.benchService.map((bs) => (
                          <span
                            key={bs.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                          >
                            {bs.serviceSpecifique?.libelle || 'Service inconnu'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-4 px-4">
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
                      disabled={settingBenchmark || loadingDetail || hasLigneClient || hasBenchmarkLine}
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
                          <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Devise
                          </th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Taux
                          </th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Prix/nuit devise
                          </th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Prix/nuit Ariary
                          </th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Montant devise
                          </th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Montant Ariary
                          </th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Nb chambre
                          </th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Rembourssable
                          </th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                            Benchmark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.benchmarkingLigne.map((ligne, index) => {
                          const devises = ligne.deviseHotel ?? [];
                          const rowSpan = devises.length || 1;

                          return devises.length === 0 ? (
                            // Ligne sans devise
                            <tr key={ligne.id} className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors`}>
                              <td className="px-6 py-4 text-sm text-neutral-700">
                                <div>{ligne.plateforme?.nom}</div>
                                <div className="text-xs text-neutral-500">{ligne.plateforme?.code}</div>
                              </td>
                              <td className="px-6 py-4 font-medium text-sm text-neutral-900">{ligne.hotel}</td>
                              <td className="px-6 py-4 text-sm text-neutral-700">
                                <div>{ligne.typeChambre?.type}</div>
                                <div className="text-xs text-neutral-500">{ligne.typeChambre?.capacite} pers.</div>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-mono text-neutral-400" colSpan={4}>—</td>
                              <td className="px-6 py-4 text-center text-xs font-medium text-neutral-600">{ligne.nombreChambre || 1}</td>
                              <td className="px-6 py-4 text-center">
                                {ligne.isRefundable ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900 text-white">Oui</span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">Non</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {ligne.isBenchMark ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white">Oui</span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">Non</span>
                                )}
                              </td>
                            </tr>
                          ) : (
                            devises.map((dv, dvIndex) => (
                              <tr
                                key={`${ligne.id}-${dv.id}`}
                                className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors`}
                              >
                                {/* Colonnes partagées — affichées uniquement sur la première ligne de devise */}
                                {dvIndex === 0 && (
                                  <>
                                    <td className="px-6 py-4 text-sm text-neutral-700" rowSpan={rowSpan}>
                                      <div>{ligne.plateforme?.nom}</div>
                                      <div className="text-xs text-neutral-500">{ligne.plateforme?.code}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-sm text-neutral-900" rowSpan={rowSpan}>
                                      {ligne.hotel}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-700" rowSpan={rowSpan}>
                                      <div>{ligne.typeChambre?.type}</div>
                                      <div className="text-xs text-neutral-500">{ligne.typeChambre?.capacite} pers.</div>
                                    </td>
                                  </>
                                )}

                                {/* Colonnes devise — une ligne par devise */}
                                <td className="px-6 py-4 text-center text-xs font-medium text-neutral-600">
                                  {dv.devise?.devise}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono text-neutral-600">
                                  {dv.tauxChange?.toLocaleString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono text-neutral-900">
                                  {Number(dv.nuiteDevise)?.toLocaleString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono text-neutral-900">
                                  {Number(dv.nuiteAriary)?.toLocaleString('fr-FR')} Ar
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono font-medium text-neutral-900">
                                  {Number(dv.montantDevise)?.toLocaleString('fr-FR')} <span className="text-neutral-500"></span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono font-medium text-neutral-900">
                                  {Number(dv.montantAriary)?.toLocaleString('fr-FR')} <span className="text-neutral-500">Ar</span>
                                </td>
                                {dvIndex === 0 && (
                                  <>
                                    <td className="px-6 py-4 text-center text-xs font-medium text-neutral-600" rowSpan={rowSpan}>
                                      {ligne.nombreChambre || 1}
                                    </td>
                                    <td className="px-6 py-4 text-center" rowSpan={rowSpan}>
                                      {ligne.isRefundable ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900 text-white">Oui</span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">Non</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-center" rowSpan={rowSpan}>
                                      {ligne.isBenchMark ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white">Oui</span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">Non</span>
                                      )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          );
                        })}
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
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Devise</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Taux Change</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nuitée (Devise)</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nuitée (Ariary)</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Montant (Devise)</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Montant (Ariary)</th>
                                <th className="px-3 py-2 text-[10px] uppercase border border-neutral-700">Nb chambre</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm text-neutral-800">
                              {/* Ligne 1 : Benchmark — une ligne par devise */}
                              {benchmarkLine &&
                                (benchmarkLine.deviseHotel?.length > 0
                                  ? benchmarkLine.deviseHotel.map((dv, dvIndex) => (
                                      <tr key={`bench-${dv.id}`}>
                                        {dvIndex === 0 && (
                                          <>
                                            <td
                                              className="px-3 py-2 border border-neutral-200 bg-blue-50 font-bold"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {benchmarkLine.plateforme?.nom || 'Plateforme'}
                                            </td>
                                            <td
                                              className="px-3 py-2 border border-neutral-200 text-center"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {detail?.pays}
                                            </td>
                                            <td
                                              className="px-3 py-2 border border-neutral-200 text-center"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {detail?.ville}
                                            </td>
                                            <td
                                              className="px-3 py-2 border border-neutral-200"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {benchmarkLine.hotel}
                                            </td>
                                            <td
                                              className="px-3 py-2 border border-neutral-200"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {benchmarkLine.typeChambre?.type || 'Standard'}
                                            </td>
                                          </>
                                        )}

                                        {/* Colonnes devise */}
                                        <td className="px-3 py-2 border border-neutral-200 text-center">
                                          {dv.devise?.devise}
                                        </td>
                                        <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                          {dv.tauxChange?.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                          {Number(dv.nuiteDevise)?.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                          {Number(dv.nuiteAriary)?.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                          {Number(dv.montantDevise)?.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                          {Number(dv.montantAriary)?.toLocaleString('fr-FR')}
                                        </td>

                                        {dvIndex === 0 && (
                                          <>
                                            <td
                                              className="px-3 py-2 border border-neutral-200 text-right font-mono"
                                              rowSpan={benchmarkLine.deviseHotel.length}
                                            >
                                              {benchmarkLine.nombreChambre}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    ))
                                  :
                                    <tr>
                                      <td className="px-3 py-2 border border-neutral-200 bg-blue-50 font-bold">
                                        {benchmarkLine.plateforme?.nom || 'Plateforme'}
                                      </td>
                                      <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                                      <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                                      <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type || 'Standard'}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono text-neutral-400" colSpan={4}>—</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono">{benchmarkLine.nombreChambre}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold">—</td>
                                    </tr>
                                )
                              }

                              {/* Ligne 2 : Client — une ligne par devise du benchmark */}
                              {clientPlateforme && benchmarkLine &&
                                (benchmarkLine.deviseHotel?.length > 0
                                  ? benchmarkLine.deviseHotel.map((dv, dvIndex) => {
                                      const cd = clientDataMap[dv.id]; // ← données spécifiques à cette devise
                                      if (!cd) return null;

                                      return (
                                        <tr key={`client-${dv.id}`}>
                                          {dvIndex === 0 && (
                                            <>
                                              <td className="px-3 py-2 border border-neutral-200 bg-neutral-100 font-bold italic"
                                                rowSpan={benchmarkLine.deviseHotel.length}>
                                                {clientPlateforme.nom}
                                              </td>
                                              <td className="px-3 py-2 border border-neutral-200 text-center"
                                                rowSpan={benchmarkLine.deviseHotel.length}>
                                                {detail?.pays}
                                              </td>
                                              <td className="px-3 py-2 border border-neutral-200 text-center"
                                                rowSpan={benchmarkLine.deviseHotel.length}>
                                                {detail?.ville}
                                              </td>
                                              <td className="px-3 py-2 border border-neutral-200"
                                                rowSpan={benchmarkLine.deviseHotel.length}>
                                                {benchmarkLine.hotel}
                                              </td>
                                              <td className="px-3 py-2 border border-neutral-200"
                                                rowSpan={benchmarkLine.deviseHotel.length}>
                                                {benchmarkLine.typeChambre?.type}
                                              </td>
                                            </>
                                          )}

                                          {/* Devise */}
                                          <td className="px-3 py-2 border border-neutral-200 text-center">
                                            {dv.devise?.devise}
                                          </td>

                                          {/* Taux change — éditable par devise */}
                                          <td className="px-3 py-2 border border-neutral-200">
                                            <input
                                              type="number"
                                              value={cd.tauxChange}
                                              onChange={(e) =>
                                                handleClientChange(dv.id, 'tauxChange', parseFloat(e.target.value) || 0)
                                              }
                                              className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                          </td>

                                          {/* Nuitée devise */}
                                          <td className="px-3 py-2 border border-neutral-200 text-right font-mono bg-blue-50">
                                            {cd.nuiteDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <div className="text-[8px] text-neutral-500 mt-0.5">
                                              ({Number(dv.nuiteDevise)?.toLocaleString('fr-FR')} + {commissionData.forfaitaireUnitaire?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                            </div>
                                          </td>

                                          {/* Nuitée Ariary */}
                                          <td className="px-3 py-2 border border-neutral-200 text-right font-mono bg-neutral-100">
                                            {cd.nuiteAriary?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>

                                          {/* Montant Devise */}
                                          <td className="px-3 py-2 border border-neutral-200 text-right font-mono">
                                            {cd.montantDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>

                                          {/* Montant Ariary */}
                                          <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">
                                            {cd.montantAriary?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>

                                          {dvIndex === 0 && (
                                            <td className="px-3 py-2 border border-neutral-200 text-right font-mono"
                                              rowSpan={benchmarkLine.deviseHotel.length}>
                                              {benchmarkLine.nombreChambre}
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })
                                  : // Fallback si pas de deviseHotel
                                    <tr>
                                      <td className="px-3 py-2 border border-neutral-200 bg-neutral-100 font-bold italic">
                                        {clientPlateforme.nom}
                                      </td>
                                      <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                                      <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                                      <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono text-neutral-400" colSpan={4}>—</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono">{benchmarkLine.nombreChambre}</td>
                                      <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">—</td>
                                    </tr>
                                )
                              }
                            </tbody>
                          </table>
                        </div>

                        
                      </div>
                      {/* Section Commission (Éditable) */}
                      <div className="flex flex-row w-full space-x-4 mt-4">

                        {/* Calcul Commission — inputs */}
                        <div className="border w-1/3 border-neutral-200 rounded-lg overflow-hidden bg-white">
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

                        {/* Résultats par devise */}
                        <div className="border w-1/3 border-neutral-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-neutral-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider">
                            Détail par Devise
                          </div>

                          {benchmarkLine?.deviseHotel?.map((dv, index) => {
                            const cd = clientDataMap[dv.id];
                            const prixLigne1 = Number(dv.nuiteDevise) || 0;
                            const forfaitUnitDevise = cd ? cd.nuiteDevise - prixLigne1 : 0;
                            const forfaitUnitAriary = cd ? forfaitUnitDevise * cd.tauxChange : 0;
                            const forfaitGlobalDevise = forfaitUnitDevise * (detail?.nuite || 1);
                            const forfaitGlobalAriary = forfaitUnitAriary * (detail?.nuite || 1);

                            return (
                              <div
                                key={dv.id}
                                className={`${index < (benchmarkLine.deviseHotel?.length ?? 0) - 1 ? 'border-b border-neutral-200' : ''}`}
                              >
                                {/* Badge devise */}
                                <div className="px-4 py-2 bg-neutral-100 flex items-center justify-between">
                                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                    {dv.devise?.devise}
                                  </span>
                                  <span className="text-[10px] text-neutral-500">
                                    Taux : {cd?.tauxChange?.toLocaleString('fr-FR') ?? '—'}
                                  </span>
                                </div>

                                {/* Grille des valeurs */}
                                <div className="px-4 py-3 space-y-2">

                                  {/* Forfait Unitaire */}
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Forfait Unit.</span>
                                    <div className="text-right">
                                      <div className="text-sm font-mono font-semibold text-neutral-800">
                                        {forfaitUnitDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {' '}<span className="text-[10px] text-neutral-400">{dv.devise?.devise}</span>
                                      </div>
                                      <div className="text-xs font-mono text-neutral-500">
                                        {forfaitUnitAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar
                                      </div>
                                    </div>
                                  </div>

                                  {/* Forfait Global */}
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Forfait Global</span>
                                    <div className="text-right">
                                      <div className="text-sm font-mono font-semibold text-neutral-800">
                                        {forfaitGlobalDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {' '}<span className="text-[10px] text-neutral-400">{dv.devise?.devise}</span>
                                      </div>
                                      <div className="text-xs font-mono text-neutral-500">
                                        {forfaitGlobalAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar
                                      </div>
                                    </div>
                                  </div>

                                  {/* Montant Commission */}
                                  <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Commission</span>
                                    <div className="text-right">
                                      <div className="text-base font-mono font-bold text-blue-700">
                                        {forfaitGlobalDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {' '}<span className="text-[10px] font-sans text-neutral-400">{dv.devise?.devise}</span>
                                      </div>
                                      <div className="text-sm font-mono font-semibold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded mt-0.5">
                                        {forfaitGlobalAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
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
                  clientDataMap,   // ← remplace clientData
                  commissionData,
                  clientPlateforme,
                  nbChambreClient,
                }}
                loading={sendingDevis}
              />

              <ConfirmBenchmarkModal
                isOpen={showBenchmarkModal}
                onClose={() => !settingBenchmark && setShowBenchmarkModal(false)}
                onConfirm={handleConfirmBenchmark}
                isLoading={settingBenchmark}
                lignes={detail.benchmarkingLigne} // ← nouveau
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
          </div>
          {/* ── Panneau latéral — FRÈRE du div principal, pas enfant ── */}
          <PanneauPreferencesClient
            isOpen={showPreferences}
            onClose={() => dispatch(setShowPreferences(false))}
            prestationId={prestationId}
          />
        </div>
      </TabContainer>
    </div>
  );
};

export default BenchmarkingDetailPage;