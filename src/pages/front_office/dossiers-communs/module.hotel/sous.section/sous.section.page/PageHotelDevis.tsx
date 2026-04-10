// src/pages/.../PageHotelDevis.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { approuverDevis, envoyerDevis, fetchHotelWithDevis, resetDevis, transformerEnHotel, type BenchmarkingEntete, type LigneClient } from '../../../../../../app/front_office/parametre_hotel/hotelDevisSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { HotelHeader } from '../../components/HotelHeader';
import { setShowPreferences, togglePreferences } from '../../../../../../app/uiSlice';
import PanneauPreferencesClient from '../../components/PanneauPreferencesClient';
import { ChevronDown } from 'lucide-react';
import { normalizeDevisToEntete, type HotelPdfSelection} from '../../../module.parametre/sections/pdf.generation/types/hotel.types';
import type { PdfAudience, PdfDesignId } from '../../../module.parametre/sections/pdf.generation/types/pdf-design.types';
import { ModalHotelPdfSelector } from '../../components/ModalHotelPdfSelector';
import { useHotelPdf } from '../../../module.parametre/sections/pdf.generation/hooks/usePdfGenerator';
// ─── Badge statut devis ───────────────────────────────────────────────────────
const StatutBadge = ({ statut }: { statut: string }) => {
  const map: Record<string, string> = {
    DEVIS_APPROUVE: 'bg-green-50 text-green-700 border-green-200',
    DEVIS_EN_ATTENTE: 'bg-orange-50 text-orange-700 border-orange-200',
    DEVIS_REFUSE: 'bg-red-50 text-red-700 border-red-200',
  };
  const label: Record<string, string> = {
    DEVIS_APPROUVE: 'Approuvé',
    DEVIS_EN_ATTENTE: 'En attente',
    DEVIS_REFUSE: 'Refusé',
  };
  return (
    <span className={`uppercase inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[statut] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statut === 'DEVIS_APPROUVE' ? 'bg-green-500' : statut === 'DEVIS_EN_ATTENTE' ? 'bg-orange-400' : 'bg-red-500'}`} />
      {label[statut] ?? statut}
    </span>
  );
};

// ─── Carte benchmarking ───────────────────────────────────────────────────────
const BenchmarkingCard = ({ bench }: { bench: BenchmarkingEntete }) => {
  // Première devise pour l'affichage des forfaits
  const firstDevise = bench.ligneClient?.deviseHotel?.[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Header carte */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800">{bench.numero}</span>
          <span className="text-xs text-gray-400">
            {new Date(bench.du).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
            {' → '}
            {new Date(bench.au).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {bench.nuite} nuit{bench.nuite > 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-xs text-gray-400">{bench.ville}, {bench.pays}</div>
      </div>

      {/* Totaux commission */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-4">
        {[
          { label: 'Taux PU', value: `${bench.tauxPrixUnitaire.toLocaleString('fr-FR')} %` },
          { 
            label: 'Forfait unitaire', 
            value: `${bench.forfaitaireUnitaire.toLocaleString('fr-FR')} ${firstDevise?.devise?.devise ?? ''}` 
          },
          { 
            label: 'Forfait global', 
            value: `${bench.forfaitaireGlobal.toLocaleString('fr-FR')} ${firstDevise?.devise?.devise ?? ''}` 
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Services — utilise serviceSpecifique.libelle */}
      {bench.benchService.length > 0 && (
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 uppercase tracking-wide mr-1">Services :</span>
          {bench.benchService.map((s) => (
            <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {s.serviceSpecifique.libelle}  {/* ← corrigé */}
            </span>
          ))}
        </div>
      )}

      {/* Ligne client */}
      <div>
        {bench.ligneClient ? (
          <LigneRow ligne={bench.ligneClient} />
        ) : (
          <p className="text-sm text-gray-400 italic text-center py-6">
            Aucune ligne client
          </p>
        )}
      </div>
    </div>
  );
};

// ─── LigneRow — multi-devise ──────────────────────────────────────────────────
const LigneRow = ({ ligne }: { ligne: LigneClient }) => (
  <div className="px-5 py-3.5">

    {/* Infos fixes */}
    <div className="flex items-center gap-4 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{ligne.hotel}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {ligne.plateforme.nom} · {ligne.typeChambre.type} · {ligne.nombreChambre} chambre{ligne.nombreChambre > 1 ? 's' : ''}
        </p>
      </div>
    </div>

    {/* Une ligne par devise */}
    {ligne.deviseHotel?.length > 0 ? (
      <div className="space-y-2">
        {ligne.deviseHotel.map((dv) => (
          <div
            key={dv.id}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
          >
            {/* Badge devise + taux */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                {dv.devise?.devise}
              </span>
              <span className="text-[10px] text-gray-400">
                Taux : {dv.tauxChange?.toLocaleString('fr-FR')} Ar
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-right">
              {[
                { 
                  label: 'Nuit/Devise', 
                  value: `${Number(dv.nuiteDevise)?.toLocaleString('fr-FR')} ${dv.devise?.devise}` 
                },
                { 
                  label: 'Nuit/Ariary', 
                  value: `${Number(dv.nuiteAriary)?.toLocaleString('fr-FR')} Ar` 
                },
                { 
                  label: 'Montant Devise', 
                  value: `${Number(dv.montantDevise)?.toLocaleString('fr-FR')} ${dv.devise?.devise}` 
                },
                { 
                  label: 'Montant Ariary', 
                  value: `${Number(dv.montantAriary)?.toLocaleString('fr-FR')} Ar`,
                  bold: true 
                },
              ].map(({ label, value, bold }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className={`text-sm mt-0.5 ${bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-gray-400 italic ml-24">Aucune devise disponible</p>
    )}
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PageHotelDevis() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { enteteId } = useParams<{ enteteId: string }>();
  const location = useLocation();

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = useMemo(() => 
    dossierActif?.dossierCommunColab
      ?.find((colab) => colab.module?.nom?.toLowerCase() === 'hotel')
      ?.prestation?.[0]?.id || '',
    [dossierActif]
  );

  console.log(`le id tonga eto ${enteteId}`);

  const { data, actionLoading, actionError, transformed, 
    // pdfClientUrl, pdfDirectionUrl 
  } = useSelector(
    (state: RootState) => state.hotelDevis
  );

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  const tabs = [
    { id: 'prospection', label: 'Listes des entête benchmarking' },
    { id: 'hotel', label: 'Listes des reservation hotel' }
  ];

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

  const devis = data?.devis;
  const prospection = data?.devis?.data?.prospectionHotel;
  const benchmarkings = data?.devis?.data?.benchmarkingEntetes ?? [];

  const montantTotalClient = benchmarkings.reduce((acc, b) => {
    const montantDevises = b.ligneClient?.deviseHotel?.reduce(
      (sum, dv) => sum + (Number(dv.montantAriary) || 0), 0
    ) ?? 0;
    return acc + montantDevises;
  }, 0);
  const tauxCommission = 10;
  const montantTotalCommission = Math.round(montantTotalClient * tauxCommission / 100);

  useEffect(() => {
    if (enteteId) dispatch(fetchHotelWithDevis(enteteId));
  }, [enteteId, dispatch]);

  const handleEnvoyer = async () => {
    if (!data?.devis?.id) return;
    await dispatch(envoyerDevis(data.devis.id)).unwrap();
  };
  const handleApprouver = async () => {
    if (!data?.devis?.id) return;
    await dispatch(approuverDevis(data.devis.id)).unwrap();
  };
  const handleTransformer = async () => {
    if (!prospection?.id || !devis?.id) return;
    await dispatch(transformerEnHotel({ hotelProspectionEnteteId: prospection.id, devisModuleId: devis.id })).unwrap();
  };

  // Génération automatique au chargement
  // useEffect(() => {
    // Attendre que data soit chargé ET corresponde au bon enteteId
    // if (!data || !enteteId) return;

    // const genererPdfs = async () => {
    //   if (!devis?.url1 && !pdfClientUrl) {
    //     try {
    //       await dispatch(genererPdfClient(enteteId)).unwrap();
    //     } catch { /* silencieux */ }
    //   }

      // if (prospection?.id && !devis?.url2 && !pdfDirectionUrl) {
      //   try {
      //     await dispatch(genererPdfDirection({
      //       id: prospection.id,
      //       montantTotalClient,
      //       tauxCommission,
      //       montantTotalCommission,
      //     })).unwrap();
      //   } catch { /* silencieux */ }
      // }
    // };

    // genererPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [data?.devis?.id, enteteId]); // ← ajoute enteteId ici

  useEffect(() => {
    return () => {
      dispatch(resetDevis()); // nettoyage au démontage
    };
  }, [dispatch]);

  const showPreferences = useSelector((state: RootState) => state.ui.showPreferences);

  // const urlPdfClient = pdfClientUrl || devis?.url1;
  // const urlPdfDirection = pdfDirectionUrl || devis?.url2;

  const { generate: generateHotelPdf, preview: previewHotelPdf, loading: hotelPdfLoading } = useHotelPdf();
  
  // const [pdfModalEntete, setPdfModalEntete] = useState<HotelProspectionEnteteItem | null>(null);

  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleHotelGenerate = (
    selection: HotelPdfSelection[],
    audience: PdfAudience,
    designId: PdfDesignId
  ) => {
    if (!data) return;
    const entete = normalizeDevisToEntete(data);
    generateHotelPdf(
      entete,
      selection,
      audience,
      designId,
      `benchmarking-${entete.numeroEntete}.pdf`
    );
    setShowPdfModal(false);
  };

  const handleHotelPreview = (
    selection: HotelPdfSelection[],
    audience: PdfAudience,
    designId: PdfDesignId
  ) => {
    if (!data) return;
    const entete = normalizeDevisToEntete(data);
    previewHotelPdf(entete, selection, audience, designId);
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

  if (!data) return null;

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 py-2 border-b border-neutral-200">
              <div className='flex items-center justify-between'>
                <HotelHeader numerohotel={prospection?.numeroEntete} navigate={navigate} isBenchmarking={true} isDetail={true} isDevis={true}/>
                
                {/* ── Barre de boutons horizontale ── */}
                {devis && (
                  <div className="flex items-center gap-2 flex-wrap">

                    {/* PDF Direction — voir */}
                    {/* <button
                      onClick={() => urlPdfDirection && window.open(`${API_URL}/${urlPdfDirection}`, '_blank')}
                      disabled={!urlPdfDirection || actionLoading === 'pdfDirection'}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'pdfDirection' ? (
                        <>
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          PDF Direction
                        </>
                      )}
                    </button> */}

                    <button
                      className="flex items-center gap-1.5 text-xs font-medium bg-white
                        text-neutral-900 px-4 py-2 rounded-md hover:bg-orange-100 transition-colors border border-neutral-200"
                      onClick={() => setShowPdfModal(true)}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </button>

                    {/* Séparateur */}
                    {/* <div className="w-px h-6 bg-gray-300 mx-1" /> */}

                    {/* PDF Client — voir */}
                    {/* <button
                      onClick={() => urlPdfClient && window.open(`${API_URL}/${urlPdfClient}`, '_blank')}
                      disabled={!urlPdfClient || actionLoading === 'pdfClient'}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'pdfClient' ? (
                        <>
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          PDF Client
                        </>
                      )}
                    </button> */}

                    {/* ── Section PDF — boutons Voir uniquement ── */}

                    {/* Séparateur */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Envoyer — disabled si statut avancé */}
                    <button
                      onClick={handleEnvoyer}
                      disabled={actionLoading !== null || devis.statut !== 'CREER'}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'envoi'
                        ? <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      }
                      {actionLoading === 'envoi' ? 'Envoi...' : 'Envoyer'}
                    </button>

                    {/* Approuver — disabled si pas en attente */}
                    <button
                      onClick={handleApprouver}
                      disabled={actionLoading !== null || devis.statut !== 'DEVIS_A_APPROUVER'}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'approbation'
                        ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      }
                      {actionLoading === 'approbation' ? 'Approbation...' : 'Approuver'}
                    </button>

                    {/* Transformer — disabled si pas approuvé ou déjà transformé */}
                    <button
                      onClick={handleTransformer}
                      // disabled={actionLoading !== null || devis.statut !== 'DEVIS_APPROUVE' || transformed}
                      disabled={devis.statut !== 'DEVIS_APPROUVE'}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'transformation'
                        ? <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                        : transformed
                          ? <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      }
                      {actionLoading === 'transformation' ? 'Transformation...' : transformed ? 'Transformer' : 'Transformer en hôtel'}
                    </button>

                    <button
                      onClick={() => dispatch(togglePreferences())}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        showPreferences
                          ? 'bg-slate-700 text-white'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      Préférences
                    </button>
                  </div>
                )}
              </div>
              {/* ── Header ── */}
              <div className="bg-slate-100 px-4 py-2 ">
                {/* ── Bloc info principal ── */}
                <div className="flex items-end justify-between gap-8  border-b border-white/10">
                  {/* Colonne gauche : identité */}
                  <div className="flex-1 min-w-0" onClick={handleToggle}>
                    <div className='flex items-center justify-between'>
                      <p className="text-gray-500 text-xs uppercase tracking-widest">Devis Hôtel</p>
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
                    <div className="flex items-center gap-4">
                      <div>
                        <h1 className="text-slate-600 font-bold text-3xl tracking-tight mb-3">
                          {prospection?.numeroEntete}
                        </h1>
                      </div>

                      {/* Récap commission */}
                      <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 border-l border-gray-300 pl-4">
                        <span>Total : <strong className="text-gray-700">{montantTotalClient.toLocaleString('fr-FR')} Ar</strong></span>
                        <span>Commission {tauxCommission}% : <strong className="text-gray-700">{montantTotalCommission.toLocaleString('fr-FR')} Ar</strong></span>
                      </div>
                    </div>

                    <div
                      className={`border-t border-white transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {/* Méta-infos en ligne */}
                      <div className="flex items-center gap-6 flex-wrap mt-2">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Fournisseur</p>
                          <p className="text-slate-600 text-sm font-medium">
                            {prospection?.fournisseur.code} — {prospection?.fournisseur.libelle}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Dossier</p>
                          <p className="text-slate-600 text-sm font-medium">{prospection?.prestation.numeroDos}</p>
                        </div>
                        {devis && (
                          <>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Référence</p>
                              <p className="text-slate-600 text-sm font-medium">{devis.reference}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Total</p>
                              <p className="text-slate-600 text-sm font-bold">{devis.totalGeneral.toLocaleString('fr-FR')} Ar</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Statut</p>
                              <StatutBadge statut={devis.statut == "CREER" ? "Créé" : devis.statut} />
                              {/* {devis.statut} */}
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Mis à jour</p>
                              <p className="text-gray-400 text-sm">
                                {new Date(devis.updatedAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Erreur action ── */}
                {actionError && (
                  <div className="mt-4 flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 text-xs px-4 py-2.5 rounded-lg">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {actionError}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest pl-2 pt-2 ">
                  Liste des benchmarkings
                </h2>

                <div className="grid grid-cols-7 gap-4 mt-2">
                  {[
                    { label: 'Benchmarkings', value: benchmarkings.length },
                    { label: 'Nuits totales', value: benchmarkings.reduce((acc, b) => acc + b.nuite, 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{label} : <span className="text-slate-600 text-sm font-medium">{value}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto py-2 px-4">
              {/* ── Body ── */}
              <div className="space-y-4">
                {benchmarkings.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm italic">
                    Aucun benchmarking trouvé
                  </div>
                ) : (
                  benchmarkings.map((bench) => (
                    <BenchmarkingCard key={bench.id} bench={bench} />
                  ))
                )}
              </div>
            </div>
          </div>
          {/* ── Panneau latéral persistant ── */}
          <PanneauPreferencesClient
            isOpen={showPreferences}
            onClose={() => dispatch(setShowPreferences(false))}
            prestationId={prestationId}
          />
          
        </div>
        {showPdfModal && data && (
          <ModalHotelPdfSelector
            isOpen={true}
            onClose={() => setShowPdfModal(false)}
            input={{ mode: 'prospection', entete: normalizeDevisToEntete(data) }}
            onGenerate={handleHotelGenerate}
            onPreview={handleHotelPreview}
            loading={hotelPdfLoading}
          />
        )}
      </TabContainer>
    </div>
  );
}