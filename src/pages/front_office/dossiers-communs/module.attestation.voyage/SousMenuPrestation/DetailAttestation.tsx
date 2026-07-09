import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchClientFactureById } from '../../../../../app/back_office/clientFacturesSlice';
import { fetchAttestationEnteteDetail, fetchAttestationSuivi } from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import AddLigneModal from './AddLigneModal';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import ViewDevisModal from '../../../../../components/modals/Attestation/ViewDevisModal';
import { API_URL } from '../../../../../service/env';
import TabContainer from '../../../../../layouts/TabContainer';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import axios from '../../../../../service/Axios';
import { FileText, PlaneTakeoff, Users, Info } from 'lucide-react';

const useAppDispatch = () => useDispatch<AppDispatch>();

const DetailAttestation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const {
    items: entetes,
    selectedId,
    selectedDetail,
    loading: loadingEntete,
  } = useSelector((state: RootState) => state.attestationEntete);

  const { items: destinations } = useSelector((state: RootState) => state.destination);
  const { current: clientFactureDetail } = useSelector((state: RootState) => state.clientFactures);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête attestation' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' },
  ];

  const [activeTabEntete, setActiveTabEntete] = useState(location.state?.targetTab || 'prospection');

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === 'attestation')
    ?.prestation?.[0]?.id || '';

  const selectedEntete = entetes.find(item => item.id === selectedId);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lignes' | 'suivi'>('lignes');
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [expandedLignes, setExpandedLignes] = useState<Set<string>>(new Set());

  const { selectedDevisDetail } = useSelector((state: RootState) => state.attestationEntete);

  const toggleLigne = (id: string) =>
    setExpandedLignes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (destinations.length === 0) dispatch(fetchDestinations());
  }, [dispatch, destinations.length]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchAttestationEnteteDetail(selectedId));
      dispatch(fetchAttestationSuivi(selectedId));
    }
  }, [dispatch, selectedId]);

  const handleOpenPdfItineraire = (ligneId: string) => {
    const pdfUrl = `${API_URL}/attestation/pdf-itineraire/${selectedEntete?.id}/${ligneId}`;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateAndOpenPdf = async () => {
    if (!selectedEntete?.id) return;
    setGeneratingPdf(true);
    try {
      const pdfUrl = `${API_URL}/attestation/pdf/${selectedEntete.id}`;
      await axios.get(pdfUrl);
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleTabChange = (id: string) => {
    if (id === 'beneficiaire') {
      navigate(`/dossiers-communs/attestation/pages`, { state: { targetTab: 'beneficiaire' } });
    } else {
      setActiveTabEntete(id);
    }
  };

  if (!selectedId || !selectedEntete) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
          <p className="text-lg font-medium">Aucune attestation sélectionnée</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTabEntete} setActiveTab={handleTabChange}>
        <div className="flex flex-col h-full min-h-0">

          {/* ── Header fixe ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
            <div className="flex items-center justify-between">
              <AttestationHeader
                numeroAttestation={selectedEntete?.numeroEntete}
                navigate={navigate}
                isDetail={true}
              />
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-md bg-white/20 font-bold">+</span>
                Ajouter une ligne
              </button>
            </div>
          </div>

          {/* ── Résumé entête + onglets ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-b-xl pb-2">

            {/* Tableau résumé entête */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-2">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Info size={12} /> Résumé de l'attestation
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Dossier &amp; Fournisseur</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Prix actif</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Total commission</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Création</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{selectedEntete.prestation?.numeroDos || '—'}</p>
                      <p className="text-[10px] text-gray-500">
                        {selectedEntete.fournisseur?.libelle}
                        <span className="text-gray-400 ml-1">({selectedEntete.fournisseur?.code})</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-base font-black text-slate-800 font-mono">
                        {selectedEntete.puAriary?.toLocaleString('fr-FR')}
                        <span className="text-[10px] text-gray-400 ml-1 font-normal">Ar</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-base font-black text-emerald-700 font-mono">
                        {selectedEntete.totalCommission.toLocaleString('fr-FR')}
                        <span className="text-[10px] text-emerald-500 ml-1 font-semibold">Ar</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(selectedEntete.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Onglets */}
            <nav className="flex gap-1" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('lignes')}
                className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                  activeTab === 'lignes'
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-300'
                }`}
              >
                Liste des attestations
              </button>
              <button
                onClick={() => setActiveTab('suivi')}
                className={`px-10 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                  activeTab === 'suivi'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-300'
                }`}
              >
                Suivi
              </button>
            </nav>
          </div>

          {/* ── Contenu scrollable ── */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4">

            {activeTab === 'suivi' && (
              <SuiviTabSection prestationId={prestationId} moduleName="attestation" />
            )}

            {activeTab === 'lignes' && selectedDetail && (
              <>
                {selectedDetail.attestationLigne.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-slate-400">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">Aucune ligne pour le moment</p>
                    <p className="text-xs mt-1">Cliquez sur « Ajouter une ligne » pour commencer</p>
                  </div>
                ) : (
                  /* ══════════════════════════════════
                      TABLEAU — Lignes attestation
                  ══════════════════════════════════ */
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-700 text-white">
                          <th colSpan={8} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FileText size={12} />
                              Lignes d'attestation
                              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {selectedDetail.attestationLigne.length}
                              </span>
                            </div>
                          </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">#</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Réf. ligne</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">N° Vol</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Itinéraire</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Départ</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Arrivée</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Passagers</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedDetail.attestationLigne.map((ligne, index) => {
                          const passagers = ligne.attestationPassager ?? [];
                          const expanded  = expandedLignes.has(ligne.id);

                          return (
                            <React.Fragment key={ligne.id}>

                              {/* ── Ligne principale ── */}
                              <tr
                                className={`border border-slate-300 hover:bg-slate-50 transition cursor-pointer ${
                                  expanded ? 'bg-indigo-50/40' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                }`}
                                onClick={() => toggleLigne(ligne.id)}
                              >
                                {/* # */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                  </div>
                                </td>

                                {/* Réf ligne */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-xs font-semibold text-slate-700">{ligne.numeroDosRef || '—'}</p>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                    {ligne.referenceLine || '—'}
                                  </span>
                                </td>

                                {/* N° Vol + avion */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-xs font-bold text-slate-800 font-mono">{ligne.numeroVol || '—'}</p>
                                  <p className="text-[10px] text-slate-400">{ligne.avion || '—'}</p>
                                </td>

                                {/* Itinéraire */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2 py-1 max-w-[160px]">
                                    <PlaneTakeoff size={10} className="text-indigo-400 shrink-0" />
                                    <span className="text-[10px] font-medium text-indigo-700 truncate">
                                      {ligne.itineraire || '—'}
                                    </span>
                                  </div>
                                </td>

                                {/* Départ */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-xs font-semibold text-slate-700">
                                    {new Date(ligne.dateHeureDepart).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(ligne.dateHeureDepart).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                                  </p>
                                </td>

                                {/* Arrivée */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-xs font-semibold text-slate-700">
                                    {new Date(ligne.dateHeureArrive).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(ligne.dateHeureArrive).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                                  </p>
                                </td>

                                {/* Passagers */}
                                <td className="px-4 py-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    <Users size={9} />
                                    {passagers.length}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* <button
                                      onClick={() => handleOpenPdfItineraire(ligne.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition"
                                    >
                                      <FileText size={10} /> PDF
                                    </button> */}
                                    <button
                                      onClick={() => toggleLigne(ligne.id)}
                                      className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition"
                                    >
                                      {expanded ? '▲' : '▼'}
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* ── Ligne expandée ── */}
                              {expanded && (
                                <>
                                  {/* ─── Vol & Classe ─── */}
                                  <tr className="bg-slate-100 border-t border-slate-200">
                                    <td colSpan={8} className="px-4 py-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <PlaneTakeoff size={10} className="text-slate-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Informations vol</span>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr className="bg-slate-50/60 border-b border-slate-100">
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Classe</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Type passager</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Durée vol</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Escale</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>N° Réservation</th>
                                  </tr>
                                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="px-4 py-2.5" colSpan={2}>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        ligne.classe === 'BUSINESS' ? 'bg-purple-100 text-purple-700' :
                                        ligne.classe === 'PREMIERE' ? 'bg-amber-100 text-amber-700' :
                                        ligne.classe === 'PREMIUM'  ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {ligne.classe}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{ligne.typePassager || '—'}</td>
                                    <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-700">{ligne.dureeVol || '—'}</td>
                                    <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-700">{ligne.dureeEscale || '—'}</td>
                                    <td className="px-4 py-2.5" colSpan={2}>
                                      <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        {ligne.numeroReservation || '—'}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Destination voyage */}
                                  {ligne.destinationVoyage && (
                                    <>
                                      <tr className="bg-slate-50/60 border-b border-slate-100">
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={4}>Code destination</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={4}>Ville</th>
                                      </tr>
                                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-2.5" colSpan={4}>
                                          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                            {ligne.destinationVoyage.code}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-700" colSpan={4}>
                                          {ligne.destinationVoyage.ville}
                                        </td>
                                      </tr>
                                    </>
                                  )}

                                  {/* ─── Statuts ─── */}
                                  <tr className="bg-slate-100 border-t border-slate-200">
                                    <td colSpan={8} className="px-4 py-1.5">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statuts &amp; Dates</span>
                                    </td>
                                  </tr>
                                  <tr className="bg-slate-50/60 border-b border-slate-100">
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Statut ligne</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Statut</th>
                                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Créé le</th>
                                  </tr>
                                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="px-4 py-2.5" colSpan={2}>
                                      {(ligne as any).statusLigne && (
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                          {(ligne as any).statusLigne}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5" colSpan={3}>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        ligne.status === 'ACTIF'  ? 'bg-emerald-100 text-emerald-700' :
                                        ligne.status === 'CREER'  ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-500'
                                      }`}>
                                        {ligne.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-600" colSpan={3}>
                                      {new Date(ligne.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                  </tr>

                                  {/* ─── Passagers ─── */}
                                  <tr className="bg-slate-100 border-t border-slate-200">
                                    <td colSpan={8} className="px-4 py-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Users size={10} className="text-slate-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Passagers</span>
                                        <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                          {passagers.length}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>

                                  {passagers.length === 0 ? (
                                    <tr className="border-b border-gray-100">
                                      <td colSpan={8} className="px-4 py-3 text-xs text-slate-400 italic">Aucun passager enregistré</td>
                                    </tr>
                                  ) : (
                                    <>
                                      <tr className="bg-slate-50/60 border-b border-slate-100">
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Nom complet</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Nationalité</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Type doc</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Réf. doc</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Validité doc</th>
                                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Contact</th>
                                      </tr>
                                      {passagers.map((ap, pIdx) => {
                                        const info = ap.clientbeneficiaireInfo;
                                        const initials = `${info.prenom?.[0] ?? ''}${info.nom?.[0] ?? ''}`.toUpperCase();
                                        const docExpired = new Date(info.dateValiditeDoc ?? '') < new Date();

                                        return (
                                          <tr
                                            key={ap.id}
                                            className={`border-b border-gray-100 hover:bg-gray-50 transition ${pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                          >
                                            {/* Nom */}
                                            <td className="px-4 py-2.5 whitespace-nowrap" colSpan={2}>
                                              <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                  {initials}
                                                </div>
                                                <div>
                                                  <p className="text-xs font-semibold text-slate-800">{info.prenom} {info.nom}</p>
                                                </div>
                                              </div>
                                            </td>

                                            {/* Nationalité */}
                                            <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap" colSpan={2}>
                                              {info.nationalite || '—'}
                                            </td>

                                            {/* Type doc */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                                {info.typeDoc || '—'}
                                              </span>
                                            </td>

                                            {/* Réf doc */}
                                            <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                              {info.referenceDoc || '—'}
                                            </td>

                                            {/* Validité doc */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                              {info.dateValiditeDoc ? (
                                                <span className={`flex items-center gap-1 text-[10px] font-medium ${docExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                                                  {docExpired ? '⚠ Expiré' : '✓ Valide'} — {new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                                </span>
                                              ) : '—'}
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                              {(info as any).tel || (info as any).whatsapp || '—'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </>
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
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
          onClose={() => setDevisModalOpen(false)}
          devisData={selectedDevisDetail}
          attestationEnteteId={selectedId!}
          loading={loadingEntete}
        />
      </TabContainer>
    </div>
  );
};

export default DetailAttestation;