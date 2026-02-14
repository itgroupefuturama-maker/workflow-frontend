import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { createBenchmarkingLigne, fetchBenchmarkingDetail, sendBenchmarkingDevis, setBenchmarkOfficial } from '../../../../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';
import ModalBenchmarkingLigneForm from '../../components/ModalBenchmarkingLigneForm';
import { HotelHeader } from '../../components/HotelHeader';

const BenchmarkingDetailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

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

  // Trouver la ligne de benchmark et les plateformes
  const benchmarkLine = detail?.benchmarkingLigne.find(ligne => ligne.isBenchMark);
  const bookingPlateforme = plateformes.find(p => p.nom?.toLowerCase() === 'booking');
  const clientPlateforme = plateformes.find(p => p.nom?.toLowerCase() === 'client');

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchBenchmarkingDetail(selectedId));
    }
  }, [dispatch, selectedId]);

  // Initialiser les données Booking et Client avec les valeurs du benchmark
  useEffect(() => {
    if (benchmarkLine && detail) {
      const initialBookingData = {
        nuiteDevise: benchmarkLine.nuiteDevise || 0,
        tauxChange: benchmarkLine.tauxChange || 0,
        nuiteAriary: benchmarkLine.nuiteAriary || 0,
        montantDevise: (benchmarkLine.nuiteDevise || 0) * detail.nuite,
        montantAriary: (benchmarkLine.nuiteAriary || 0) * detail.nuite,
      };

      const initialClientData = {
        nuiteDevise: benchmarkLine.nuiteDevise || 0,
        tauxChange: benchmarkLine.tauxChange || 0,
        nuiteAriary: benchmarkLine.nuiteAriary || 0,
        montantDevise: (benchmarkLine.nuiteDevise || 0) * detail.nuite,
        montantAriary: (benchmarkLine.nuiteAriary || 0) * detail.nuite,
      };

      setBookingData(initialBookingData);
      setClientData(initialClientData);
    }
  }, [benchmarkLine, detail]);

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
    const updated = { ...clientData, [field]: value };

    // Recalculer automatiquement les montants
    if (field === 'nuiteDevise' || field === 'tauxChange') {
      if (field === 'nuiteDevise') {
        updated.nuiteAriary = value * clientData.tauxChange;
        updated.montantDevise = value * (detail?.nuite || 1);
        updated.montantAriary = updated.nuiteAriary * (detail?.nuite || 1);
      } else if (field === 'tauxChange') {
        updated.nuiteAriary = clientData.nuiteDevise * value;
        updated.montantAriary = updated.nuiteAriary * (detail?.nuite || 1);
      }
    }

    setClientData(updated);
  };

  // Handler pour envoyer le devis
  const handleSendDevis = async () => {
    if (!detail || !benchmarkLine || !bookingPlateforme || !clientPlateforme) {
      alert('Données manquantes pour envoyer le devis');
      return;
    }

    if (!window.confirm('Confirmez-vous l\'envoi du devis ?')) {
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
          tauxPrixUnitaire: bookingData.tauxChange,
          forfaitaireUnitaire: clientData.nuiteAriary,
          forfaitaireGlobal: clientData.montantAriary,
          montantAriary: clientData.montantAriary,
        },
      };

      await dispatch(sendBenchmarkingDevis(payload)).unwrap();
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

    try {
      const resultAction = await dispatch(setBenchmarkOfficial(detail.id)).unwrap();
      // Si succès → on peut recharger ou mettre à jour localement
      // (unwrap() lance une erreur si rejected)
      alert("Benchmark défini avec succès !");
      // Optionnel : re-fetch complet
      dispatch(fetchBenchmarkingDetail(detail.id));
    } catch (err: any) {
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
    <div className="min-h-screen bg-neutral-50">
      <div className="mb-8">
        <HotelHeader numerohotel={detail.numero} navigate={navigate} isDetail={true}/>
      </div>
        {/* En-tête avec navigation + bouton SET BENCHMARK */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Benchmarking <span className="font-mono text-neutral-600">#{detail?.numero}</span>
            </h1>
          </div>

          {/* ← LE BOUTON ICI */}
          <button
            onClick={handleSetBenchmark}
            disabled={settingBenchmark || loadingDetail}
            className={`
              px-5 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 transition-colors
              ${settingBenchmark || loadingDetail
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
              }
            `}
          >
            {settingBenchmark ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Définir comme benchmark officiel
              </>
            )}
          </button>
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
                Entête associée
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

        {/* Services inclus (maintenant en haut car communs) */}
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

        {/* Liste des lignes de benchmarking (maintenant en bas) */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                Lignes de benchmarking
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {detail.benchmarkingLigne.length} ligne{detail.benchmarkingLigne.length > 1 ? 's' : ''} enregistrée{detail.benchmarkingLigne.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowLigneModal(true)}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une ligne
            </button>
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
                    disabled={sendingDevis || !benchmarkLine || !bookingPlateforme || !clientPlateforme}
                    className={`
                      px-5 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 transition-colors
                      ${sendingDevis || !benchmarkLine || !bookingPlateforme || !clientPlateforme
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
                        Envoyer le devis
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Tableau principal */}
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full border-collapse bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
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
                            <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">
                              {bookingData.montantAriary?.toLocaleString('fr-FR')}
                            </td>
                          </tr>
                        )}

                        {/* Ligne 3 : Client (Éditable) */}
                        {clientPlateforme && benchmarkLine && (
                          <tr>
                            <td className="px-3 py-2 border border-neutral-200 bg-neutral-100 font-bold italic">
                              {clientPlateforme.nom}
                            </td>
                            <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.pays}</td>
                            <td className="px-3 py-2 border border-neutral-200 text-center">{detail?.ville}</td>
                            <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.hotel}</td>
                            <td className="px-3 py-2 border border-neutral-200">{benchmarkLine.typeChambre?.type}</td>
                            <td className="px-3 py-2 border border-neutral-200">
                              <input
                                type="number"
                                value={clientData.nuiteDevise}
                                onChange={(e) => handleClientChange('nuiteDevise', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-right font-mono border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
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
                              {clientData.nuiteAriary?.toLocaleString('fr-FR')}
                            </td>
                            <td className="px-3 py-2 border border-neutral-200 text-right font-mono font-bold bg-neutral-100">
                              {clientData.montantAriary?.toLocaleString('fr-FR')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section Commission */}
                  <div className="w-full lg:w-80 space-y-4">
                    <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm bg-white">
                      <div className="bg-neutral-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider">
                        Calcul Commission
                      </div>
                      <div className="grid grid-cols-3 text-[10px] font-bold text-neutral-600 uppercase bg-neutral-100 border-b border-neutral-200">
                        <div className="px-2 py-2 text-center border-r border-neutral-200">% sur Prix Unit.</div>
                        <div className="px-2 py-2 text-center border-r border-neutral-200">Forfaitaire Unit.</div>
                        <div className="px-2 py-2 text-center">Forfaitaire Global</div>
                      </div>
                      <div className="grid grid-cols-3 text-sm font-mono text-neutral-900">
                        <div className="px-2 py-3 text-center border-r border-neutral-200">
                          {bookingData.tauxChange?.toLocaleString('fr-FR')}
                        </div>
                        <div className="px-2 py-3 text-center border-r border-neutral-200">
                          {clientData.nuiteAriary?.toLocaleString('fr-FR')}
                        </div>
                        <div className="px-2 py-3 text-center">
                          {clientData.montantAriary?.toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm bg-white">
                      <div className="bg-neutral-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider">
                        Montant Commission
                      </div>
                      <div className="px-4 py-4 text-center text-xl font-bold font-mono text-blue-700 bg-blue-50">
                        {clientData.montantAriary?.toLocaleString('fr-FR')} <span className="text-sm font-sans text-neutral-500 uppercase">Ar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
  );
};

export default BenchmarkingDetailPage;