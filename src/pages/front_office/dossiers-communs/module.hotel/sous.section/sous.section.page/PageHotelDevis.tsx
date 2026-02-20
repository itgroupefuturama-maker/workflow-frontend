// src/pages/.../PageHotelDevis.tsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { approuverDevis, envoyerDevis, fetchHotelWithDevis, genererPdfClient, genererPdfDirection, transformerEnHotel, type BenchmarkingEntete, type LigneClient } from '../../../../../../app/front_office/parametre_hotel/hotelDevisSlice';
import { API_URL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import { HotelHeader } from '../../components/HotelHeader';
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[statut] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statut === 'DEVIS_APPROUVE' ? 'bg-green-500' : statut === 'DEVIS_EN_ATTENTE' ? 'bg-orange-400' : 'bg-red-500'}`} />
      {label[statut] ?? statut}
    </span>
  );
};

// ─── Carte benchmarking ───────────────────────────────────────────────────────
const BenchmarkingCard = ({ bench }: { bench: BenchmarkingEntete }) => {
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

      {/* Totaux */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-4">
        {[
          { label: 'Taux PU', value: `${bench.tauxPrixUnitaire.toLocaleString('fr-FR')} Ar` },
          { label: 'Forfait unitaire', value: `${bench.forfaitaireUnitaire.toLocaleString('fr-FR')} Ar` },
          { label: 'Forfait global', value: `${bench.forfaitaireGlobal.toLocaleString('fr-FR')} Ar` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      {bench.benchService.length > 0 && (
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 uppercase tracking-wide mr-1">Services :</span>
          {bench.benchService.map((s) => (
            <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {s.serviceHotel.service}
            </span>
          ))}
        </div>
      )}

      {/* Ligne client (remplace benchmarkingLigne[]) */}
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

// LigneRow — adapté à LigneClient (plus de isBenchMark ici, toujours "Client")
const LigneRow = ({ ligne }: { ligne: LigneClient }) => (
  <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50">
    <div className="w-20 shrink-0">
      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        Client
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{ligne.hotel}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {ligne.plateforme.nom} · {ligne.typeChambre.type}
      </p>
    </div>
    <div className="grid grid-cols-4 gap-6 text-right shrink-0">
      {[
        { label: 'Chambres', value: ligne.nombreChambre },
        { label: 'Nuit/chambre', value: `${ligne.nuiteDevise.toLocaleString('fr-FR')} ${ligne.devise}` },
        { label: 'Taux', value: `${ligne.tauxChange.toLocaleString('fr-FR')} Ar` },
        { label: 'Total', value: `${ligne.montantAriary.toLocaleString('fr-FR')} Ar` },
      ].map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PageHotelDevis() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { enteteId } = useParams<{ enteteId: string }>();
  const location = useLocation();

  const { data, actionLoading, actionError, transformed, pdfClientUrl, pdfDirectionUrl } = useSelector(
    (state: RootState) => state.hotelDevis
  );

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'benchmarking');

  const tabs = [
    { id: 'benchmarking', label: 'Listes des entête benchmarking' },
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

  const montantTotalClient = benchmarkings.reduce((acc, b) => acc + b.forfaitaireGlobal, 0);
  const tauxCommission = 10;
  const montantTotalCommission = Math.round(montantTotalClient * tauxCommission / 100);

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
  // const handlePdfClient = async () => {
  //   if (!enteteId) return;
  //   const result = await dispatch(genererPdfClient(enteteId)).unwrap();
  //   window.open(`${API_URL}/${result}`, '_blank');
  // };
  // const handlePdfDirection = async () => {
  //   if (!prospection?.id) return;
  //   const result = await dispatch(genererPdfDirection({ id: prospection.id, montantTotalClient, tauxCommission, montantTotalCommission })).unwrap();
  //   window.open(`${API_URL}/${result}`, '_blank');
  // };

  // Génération automatique au chargement
  useEffect(() => {
    if (!data) return;

    const genererPdfs = async () => {
      // PDF Client
      if (enteteId && !devis?.url1 && !pdfClientUrl) {
        try {
          await dispatch(genererPdfClient(enteteId)).unwrap();
        } catch {
          // silencieux — l'erreur sera dans actionError si besoin
        }
      }

      // PDF Direction
      if (prospection?.id && !devis?.url2 && !pdfDirectionUrl) {
        try {
          await dispatch(genererPdfDirection({
            id: prospection.id,
            montantTotalClient,
            tauxCommission,
            montantTotalCommission,
          })).unwrap();
        } catch {
          // silencieux
        }
      }
    };

    genererPdfs();
    // On ne déclenche qu'une seule fois quand data est chargé
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.devis?.id]);

  const urlPdfClient = pdfClientUrl || devis?.url1;
  const urlPdfDirection = pdfDirectionUrl || devis?.url2;

  useEffect(() => {
    if (enteteId) dispatch(fetchHotelWithDevis(enteteId));
  }, [enteteId, dispatch]);

  if (!data) return null;

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="mb-5">
          <HotelHeader numerohotel={prospection?.numeroEntete} navigate={navigate} isBenchmarking={true} isDetail={true} isDevis={true}/>
        </div>
        {/* ── Header ── */}
        <div className="bg-slate-100 px-8 pt-6 pb-0">
          {/* ── Bloc info principal ── */}
          <div className="flex items-end justify-between gap-8 pb-6 border-b border-white/10">

            {/* Colonne gauche : identité */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Devis Hôtel</p>
              <h1 className="text-slate-600 font-bold text-3xl tracking-tight mb-3">
                {prospection?.numeroEntete}
              </h1>

              {/* Méta-infos en ligne */}
              <div className="flex items-center gap-6 flex-wrap">
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
                      <StatutBadge statut={devis.statut} />
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

          {/* ── Erreur action ── */}
          {actionError && (
            <div className="mt-4 flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 text-xs px-4 py-2.5 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {actionError}
            </div>
          )}

          {/* ── Barre de boutons horizontale ── */}
          {devis && (
            <div className="flex items-center gap-2 py-4 flex-wrap">

              {/* PDF Direction — voir */}
              <button
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
              </button>

              {/* Séparateur */}
              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* PDF Client — voir */}
              <button
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
              </button>

              {/* ── Section PDF — boutons Voir uniquement ── */}

              {/* Séparateur */}
              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Envoyer — disabled si statut avancé */}
              <button
                onClick={handleEnvoyer}
                disabled={actionLoading !== null || devis.statut === 'DEVIS_EN_ATTENTE' || devis.statut === 'DEVIS_APPROUVE'}
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
                disabled={actionLoading !== null || devis.statut !== 'DEVIS_EN_ATTENTE'}
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
                disabled={actionLoading !== null || devis.statut !== 'DEVIS_APPROUVE' || transformed}
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

              {/* Récap commission */}
              <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 border-l border-gray-300 pl-4">
                <span>Total : <strong className="text-gray-700">{montantTotalClient.toLocaleString('fr-FR')} Ar</strong></span>
                <span>Commission {tauxCommission}% : <strong className="text-gray-700">{montantTotalCommission.toLocaleString('fr-FR')} Ar</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="py-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[
              { label: 'Benchmarkings', value: benchmarkings.length },
              { label: 'Lignes totales', value: benchmarkings.reduce((acc, b) => acc + (b.ligneClient ? 1 : 0), 0) },
              { label: 'Nuits totales', value: benchmarkings.reduce((acc, b) => acc + b.nuite, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest pt-2">
            Détail par benchmarking
          </h2>

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
    </TabContainer>
  );
}