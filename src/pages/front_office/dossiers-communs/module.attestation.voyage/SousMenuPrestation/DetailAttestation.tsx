import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchClientFactureById } from '../../../../../app/back_office/clientFacturesSlice';
import { fetchAttestationEnteteDetail, fetchAttestationSuivi} from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import AddLigneModal from './AddLigneModal';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import ViewDevisModal from '../../../../../components/modals/Attestation/ViewDevisModal';
import { API_URL } from '../../../../../service/env';
import TabContainer from '../../../../../layouts/TabContainer';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
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

  return (
    <div className="h-full flex flex-col min-h-0 ">
      <TabContainer tabs={tabs} activeTab={activeTabEntete} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 px-4 pt-2 bg-white">
              <div className='flex items-center justify-between'>
                {/* Header */}
                <AttestationHeader
                  numeroAttestation={selectedEntete?.numeroEntete}
                  navigate={navigate}
                  isDetail={true}
                />

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
            </div>
              
            <div className='px-4 border-b border-neutral-50'>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-2">
                {/* Barre de titre simplifiée */}
                <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Détail En-tête</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                      #{selectedEntete.numeroEntete}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Màj : {new Date(selectedEntete.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Contenu compact en une seule rangée (Flex) ou grille serrée */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                  {/* Groupe 1 : Dossier & Fournisseur */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Dossier & Fournisseur</p>
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {selectedEntete.prestation?.numeroDos || '—'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {selectedEntete.fournisseur?.libelle} <span className="text-gray-400">({selectedEntete.fournisseur?.code})</span>
                    </p>
                  </div>

                  {/* Groupe 2 : Prix Actif (Style épuré) */}
                  <div className="space-y-1 border-l border-gray-100 pl-6">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Prix Actif</p>
                    <p className="text-lg font-bold text-slate-800">
                      {selectedEntete.puAriary?.toLocaleString('fr-FR')} 
                      <span className="text-[10px] text-gray-400 ml-1">AR</span>
                    </p>
                  </div>

                  {/* Groupe 3 : Commission (Badge discret) */}
                  <div className="space-y-1 border-l border-gray-100 pl-6">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Commission</p>
                    <div className="inline-flex items-baseline gap-1 text-emerald-600">
                      <span className="text-lg font-bold">{selectedEntete.totalCommission.toLocaleString('fr-FR')}</span>
                      <span className="text-[10px] font-semibold tracking-tighter">AR</span>
                    </div>
                  </div>

                  {/* Groupe 4 : Date de création */}
                  <div className="space-y-1 border-l border-gray-100 pl-6 text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Création</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(selectedEntete.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs header */}
              <div className="flex justify-between">
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
            </div>
      
            <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
              {/* Onglets */}
              {selectedDetail && (
                <div className=" overflow-hidden">
                  

                  {/* Contenu onglets */}
                  <div className="bg-white border border-slate-100">
                    {activeTab === 'lignes' && (
                      <>
                        {selectedDetail.attestationLigne.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">Aucune ligne pour le moment</p>
                            <p className="text-xs mt-1">Cliquez sur « Ajouter une ligne » pour commencer</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {selectedDetail.attestationLigne.map((ligne, index) => {
                              const passagers = ligne.attestationPassager ?? [];

                              return (
                                <div key={ligne.id} className="p-5 hover:bg-slate-50 transition-colors">

                                  {/* ── En-tête ligne ── */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      {/* Numéro */}
                                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-slate-800">{ligne.numeroDosRef || '—'}</span>
                                          <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                                            {ligne.referenceLine || '—'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          Créé le {new Date(ligne.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Status ligne */}
                                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                        ligne.status === 'ACTIF'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : ligne.status === 'CREER'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {ligne.status}
                                      </span>
                                      {(ligne as any).statusLigne && (
                                        <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                                          {(ligne as any).statusLigne}
                                        </span>
                                      )}
                                      {/* Bouton PDF */}
                                      <button
                                        onClick={() => handleOpenPdfItineraire(ligne.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                      >
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                        </svg>
                                        PDF
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Corps : 3 colonnes ── */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* Colonne 1 : Informations vol */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Informations vol</p>
                                      </div>
                                      <div className="px-4 py-3 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">N° Vol</span>
                                          <span className="text-sm font-bold text-slate-800 font-mono">{ligne.numeroVol || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Avion</span>
                                          <span className="text-sm text-slate-700">{ligne.avion || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Classe</span>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            ligne.classe === 'BUSINESS' ? 'bg-purple-100 text-purple-700' :
                                            ligne.classe === 'PREMIERE' ? 'bg-amber-100 text-amber-700' :
                                            ligne.classe === 'PREMIUM' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                          }`}>
                                            {ligne.classe}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Type passager</span>
                                          <span className="text-xs text-slate-600">{ligne.typePassager}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">N° Réservation</span>
                                          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{ligne.numeroReservation || '—'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Colonne 2 : Itinéraire & Horaires */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Itinéraire & Horaires</p>
                                      </div>
                                      <div className="px-4 py-3 space-y-3">
                                        {/* Itinéraire visuel */}
                                        <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/>
                                          </svg>
                                          <span className="text-xs font-medium text-indigo-700 truncate" title={ligne.itineraire}>
                                            {ligne.itineraire || '—'}
                                          </span>
                                        </div>

                                        {/* Départ / Arrivée */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                                            <p className="text-[9px] uppercase tracking-wide text-green-500 font-bold mb-1">Départ</p>
                                            <p className="text-xs font-semibold text-slate-700">
                                              {new Date(ligne.dateHeureDepart).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                              {new Date(ligne.dateHeureDepart).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                                            </p>
                                          </div>
                                          <div className="bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
                                            <p className="text-[9px] uppercase tracking-wide text-rose-500 font-bold mb-1">Arrivée</p>
                                            <p className="text-xs font-semibold text-slate-700">
                                              {new Date(ligne.dateHeureArrive).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                              {new Date(ligne.dateHeureArrive).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Durées */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                            <span className="text-[9px] uppercase tracking-wide text-slate-400 font-medium">Durée vol</span>
                                            <span className="font-mono text-xs font-bold text-slate-700">{ligne.dureeVol || '—'}</span>
                                          </div>
                                          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                            <span className="text-[9px] uppercase tracking-wide text-slate-400 font-medium">Escale</span>
                                            <span className="font-mono text-xs font-bold text-slate-700">{ligne.dureeEscale || '—'}</span>
                                          </div>
                                        </div>

                                        {/* Destination Voyage */}
                                        {ligne.destinationVoyage && (
                                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Destination</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                {ligne.destinationVoyage.code}
                                              </span>
                                              <span className="text-xs font-semibold text-slate-700">{ligne.destinationVoyage.ville}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Colonne 3 : Passagers */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passagers</p>
                                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                          {passagers.length} passager{passagers.length > 1 ? 's' : ''}
                                        </span>
                                      </div>

                                      <div className="divide-y divide-slate-50">
                                        {passagers.length === 0 ? (
                                          <p className="px-4 py-4 text-xs text-slate-400 italic">Aucun passager enregistré</p>
                                        ) : (
                                          passagers.map((ap) => {
                                            const info = ap.clientbeneficiaireInfo;
                                            const initials = `${info.prenom?.[0] ?? ''}${info.nom?.[0] ?? ''}`.toUpperCase();
                                            const docExpired = new Date(info.dateValiditeDoc ?? '') < new Date();

                                            return (
                                              <div key={ap.id} className="px-4 py-3 flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                  {initials}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                  {/* Nom */}
                                                  <p className="text-sm font-semibold text-slate-800">
                                                    {info.prenom} {info.nom}
                                                  </p>
                                                  {/* Nationalité */}
                                                  <p className="text-[10px] text-slate-500">{info.nationalite || '—'}</p>

                                                  {/* Doc */}
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                                      {info.typeDoc}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-slate-500">{info.referenceDoc}</span>
                                                  </div>

                                                  {/* Validité doc */}
                                                  {info.dateValiditeDoc && (
                                                    <div className={`flex items-center gap-1 text-[10px] font-medium ${
                                                      docExpired ? 'text-red-500' : 'text-emerald-600'
                                                    }`}>
                                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d={docExpired
                                                            ? "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                          }
                                                        />
                                                      </svg>
                                                      {docExpired ? 'Expiré' : 'Valide'} — {new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                                    </div>
                                                  )}

                                                  {/* Tel / WhatsApp */}
                                                  {((info as any).tel || (info as any).whatsapp) && (
                                                    <p className="font-mono text-[10px] text-slate-400">
                                                      {(info as any).tel || (info as any).whatsapp}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>

                                  </div>{/* fin grid 3 colonnes */}
                                </div>
                              );
                            })}
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
            </div>

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
        </div>
      </TabContainer>
    </div>
  );
};

export default DetailAttestation;