import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';           // ← AJOUT
import type { AppDispatch, RootState } from '../../../../../app/store';
import { createAttestationEntete, fetchAttestationEntetes, setSelectedEntete } from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import TabContainer from '../../../../../layouts/TabContainer';
import { clearCommentaireFournisseur, fetchLastCommentaireFournisseur } from '../../../../../app/front_office/fournisseurCommentaire/fournisseurCommentaireSlice';
import FournisseurAlerteBadge from '../../../../../components/fournisseurAlerteBadget/FournisseurAlerteBadge';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import BeneficiaireListPage from '../../module.client.beneficiaire/BeneficiaireListPage';
import { useAttestationPdf } from '../../module.parametre/sections/pdf.generation/hooks/usePdfGenerator';
import type { AttestationPdfMode, AttestationPdfSelection } from '../../module.parametre/sections/pdf.generation/types/attestation.types';
import type { PdfDesignId } from '../../module.parametre/sections/pdf.generation/types/pdf-design.types';
import { ModalAttestationPdfSelector } from './components.attestation/ModalAttestationPdfSelector';

const PageViewAttestation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

   const { data: fournisseurs } = useSelector((state: RootState) => state.fournisseurs);

  const { items, loading, error } = useSelector(
    (state: RootState) => state.attestationEntete
  );

  const { items: attestationParams, loading: loadingAttestationParams, error: errorAttestationParams } = useSelector(
      (state: RootState) => state.attestationParams
    );

  // On récupère le dossier actif de Redux au lieu de l'URL
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  console.log("dossierActif", dossierActif);

  const { lastComment, confirmed } = useSelector(
      (state: RootState) => state.fournisseurCommentaire
    );

    // Calculer si le bouton doit être bloqué
    const upper = lastComment?.alerte?.toUpperCase() ?? '';
    const isBlocked =
      upper === 'TRES_ELEVE' ||           // toujours bloqué
      (upper === 'ELEVE' && !confirmed);  // bloqué tant que pas confirmé

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

    console.log("prestationId", prestationId);
    

  // ─── États pour le commentaire fournisseur ────────────────────────────────
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('');

  const prixActif = attestationParams.find(item => item.status === 'ACTIF')?.prix;
  const [puAriary, setPuAriary] = useState<number | ''>('');

  useEffect(() => {
    // Ne s'exécute que si puAriary est encore vide ET qu'un prix actif existe
    if (puAriary === '' && prixActif !== undefined) {
      setPuAriary(prixActif);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixActif]); // ← on observe seulement prixActif, pas puAriary

  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = !!prestationId && fournisseurs.length > 0;

  const tabs = [
    { id: 'prospection', label: 'Listes des entête attestation' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' }
  ];
  
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');
  
  const { generate: generateAttestation, preview: previewAttestation, loading: attestationPdfLoading } = useAttestationPdf();
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // évite de déclencher handleRowClick
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const handleAttestationGenerate = (
    selection: AttestationPdfSelection[],
    designId: PdfDesignId,
    mode: AttestationPdfMode          // ← nouveau
  ) => {
    generateAttestation(items, selection, mode, designId, `attestation-${dossierActif?.numero}.pdf`);
    setShowPdfModal(false);
  };

  const handleAttestationPreview = (
    selection: AttestationPdfSelection[],
    designId: PdfDesignId,
    mode: AttestationPdfMode          // ← nouveau
  ) => {
    previewAttestation(items, selection, mode, designId);
  };

  useEffect(() => {
    // On attend que prestationId soit disponible avant de fetcher
    if (!prestationId) return;

    dispatch(fetchAttestationEntetes(prestationId));

  }, [dispatch, prestationId]); // ← prestationId en dépendance

  useEffect(() => {
    if (!selectedFournisseurId) {
      return;
    }
  }, [selectedFournisseurId]); // ← Déclenche à chaque changement de fournisseur


  const handleCreate = async () => {
    if (!prestationId) {
      setFormError("Aucune prestation 'attestation' trouvée pour ce dossier");
      return;
    }
    if (!selectedFournisseurId) {
      setFormError("Veuillez sélectionner un fournisseur");
      return;
    }
    if (!puAriary || puAriary <= 0) { // ← AJOUT
      setFormError("Veuillez saisir un prix valide");
      return;
    }

    setFormError(null);

    try {
      await dispatch(
        createAttestationEntete({
          prestationId,
          fournisseurId: selectedFournisseurId,
          puAriary: Number(puAriary), // ← AJOUT
        })
      ).unwrap();

      setSelectedFournisseurId('');
      setPuAriary(prixActif ?? '');
    } catch (err: any) {
      setFormError(err.message || "Échec de la création");
    }
  };

  const handleRowClick = (id: string) => {
    // 1. Marquer comme sélectionné dans Redux
    dispatch(setSelectedEntete(id));
    
    // 2. Naviguer vers le détail
    navigate(`/dossiers-communs/attestation/details`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // ← Réécrit location.state sans changer l'URL
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  useEffect(() => {
    if (!location.state?.targetTab) return;
    const timer = setTimeout(() => {
      setActiveTab(location.state.targetTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.state?.targetTab]);

  return (
    <div className="h-full flex flex-col min-h-0 z-20">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        {activeTab === 'prospection' ? (
          <div className="flex h-full min-h-0 overflow-hidden">
            {/* ── Colonne principale ── */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* ── Header fixe — ne scrolle PAS ── */}
              <div className="shrink-0 px-4 pt-2 bg-white">
                <div className='flex items-center justify-between'>
                  <AttestationHeader
                    numeroAttestation={dossierActif?.numero}
                    navigate={navigate}
                  />

                  {/* Dans le canCreate*/}
                  {canCreate && activeTabSousSection === 'lignes' && (
                    <div className="flex gap-3 items-center">
                      {items.length > 0 && activeTabSousSection === 'lignes' && (
                        <button
                          onClick={() => setShowPdfModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                            bg-white border border-indigo-200 text-indigo-700 rounded-xl
                            hover:bg-indigo-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Générer PDF
                        </button>
                      )}
                      <select
                        value={selectedFournisseurId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedFournisseurId(id);
                          if (id) dispatch(fetchLastCommentaireFournisseur(id));
                          else dispatch(clearCommentaireFournisseur());
                        }}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">— Choisir un fournisseur —</option>
                        {fournisseurs.map((f) => (
                          <option key={f.id} value={f.id}>{f.code} - {f.libelle}</option>
                        ))}
                      </select>

                      {/* Input prix — pré-rempli depuis attestationParams, modifiable */}
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          readOnly
                          placeholder="Prix unitaire"
                          value={puAriary}
                          onChange={(e) => setPuAriary(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-44 border rounded-lg px-3 py-2 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
                            puAriary !== prixActif && puAriary !== ''
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 bg-white text-slate-700'
                          }`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                          Ar
                        </span>
                      </div>

                      <button
                        onClick={handleCreate}
                        disabled={loading || !selectedFournisseurId || !puAriary || isBlocked}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-sm transition-all ${
                          loading || !selectedFournisseurId || !puAriary || isBlocked
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                        }`}
                      >
                        <span className="flex items-center justify-center w-4 h-4 rounded-md bg-white/20 font-bold leading-none">+</span>
                        {loading ? 'Création...' : 'Créer entête'}
                      </button>

                      <FournisseurAlerteBadge />
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="m-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  {formError}
                </div>
              )}

              <div className='px-4 border-b border-neutral-50'>
                <DossierActifCard gradient="from-rose-400 via-pink-400 to-rose-500" />
                <div className="flex items-center justify-between">
                  {/* Bouton + formulaire création */}
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
                        Listes des attestations({items.length})
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
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">

                {activeTabSousSection === 'lignes' && (
                  <div className="">
                    {loading ? (
                      <div className="bg-white rounded-lg p-10 text-center shadow">
                        <div className="animate-pulse text-gray-500">Chargement des entêtes...</div>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <FiClock size={48} className="mb-4 opacity-30" />
                        <p className="text-lg font-medium">Aucun élément trouvé</p>
                        <p className="text-sm mt-2">{error}</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-br-xl rounded-bl-xl rounded-tr-xl shadow overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  N° En-tête
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  N° Dossier
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Fournisseur
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Commission
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Prix unitaire
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Créé le
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {items.map((item) => {
                                const isExpanded = expandedIds.includes(item.id);
                                const lignes = item.attestationLigne ?? [];

                                return (
                                  <>
                                    <tr
                                      key={item.id}
                                      onClick={() => handleRowClick(item.id)}
                                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                      {/* ── Bouton expand ── */}
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => toggleExpand(item.id, e)}
                                            className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                                              isExpanded
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-gray-300 text-gray-400 hover:border-indigo-400'
                                            }`}
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path
                                                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d={isExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                                              />
                                            </svg>
                                          </button>
                                          <span className="font-medium text-gray-900">{item.numeroEntete}</span>
                                          {lignes.length > 0 && (
                                            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                                              {lignes.length}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {item.prestation?.numeroDos || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {item.fournisseur?.libelle || '—'} ({item.fournisseur?.code})
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                                        {item.totalCommission.toLocaleString('fr-FR')} Ar
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                                        {item.puAriary?.toLocaleString('fr-FR') ?? 0} Ar
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(item.createdAt).toLocaleString('fr-FR', {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                        })}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleRowClick(item.id)}
                                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                          >
                                            Details
                                          </button>
                                          <FiArrowRight className="text-blue-600 hover:text-blue-800" size={16} />
                                        </div>
                                      </td>
                                    </tr>

                                    {/* ── Ligne expandée : sous-table des AttestationLigne ── */}
                                    {isExpanded && (
                                      <tr key={`${item.id}-lignes`}>
                                        <td colSpan={7} className="bg-slate-50 px-6 py-0">
                                          <div className="border-l-2 border-indigo-300 ml-2 pl-4 py-3">

                                            {lignes.length === 0 ? (
                                              <p className="text-sm text-slate-400 italic py-2">
                                                Aucune ligne pour cette attestation
                                              </p>
                                            ) : (
                                              <table className="w-full text-xs">
                                                <thead>
                                                  <tr className="text-slate-400 uppercase tracking-wide">
                                                    <th className="text-left py-1.5 pr-4 font-medium">N° Vol</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Avion</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Itinéraire</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Classe</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Type</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Départ</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Arrivée</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Durée</th>
                                                    <th className="text-left py-1.5 pr-4 font-medium">Passagers</th>
                                                    <th className="text-left py-1.5 font-medium">Statut</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                  {lignes.map((ligne) => (
                                                    <tr key={ligne.id} className="text-slate-700 hover:bg-white transition-colors">
                                                      <td className="py-2 pr-4 font-mono font-semibold">{ligne.numeroVol || '—'}</td>
                                                      <td className="py-2 pr-4">{ligne.avion || '—'}</td>
                                                      <td className="py-2 pr-4 max-w-[200px] truncate" title={ligne.itineraire}>
                                                        {ligne.itineraire || '—'}
                                                      </td>
                                                      <td className="py-2 pr-4">
                                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                                          {ligne.classe}
                                                        </span>
                                                      </td>
                                                      <td className="py-2 pr-4 text-slate-500">{ligne.typePassager}</td>
                                                      <td className="py-2 pr-4 text-slate-500">
                                                        {ligne.dateHeureDepart
                                                          ? new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', {
                                                              dateStyle: 'short', timeStyle: 'short',
                                                            })
                                                          : '—'}
                                                      </td>
                                                      <td className="py-2 pr-4 text-slate-500">
                                                        {ligne.dateHeureArrive
                                                          ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', {
                                                              dateStyle: 'short', timeStyle: 'short',
                                                            })
                                                          : '—'}
                                                      </td>
                                                      <td className="py-2 pr-4 font-mono">{ligne.dureeVol || '—'}</td>
                                                      <td className="py-2 pr-4">
                                                        {(ligne.attestationPassager?.length ?? 0) > 0 ? (
                                                          <div className="flex flex-wrap gap-1">
                                                            {ligne.attestationPassager!.map((ap) => (
                                                              <span
                                                                key={ap.id}
                                                                className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]"
                                                              >
                                                                {ap.clientbeneficiaireInfo?.prenom} {ap.clientbeneficiaireInfo?.nom}
                                                              </span>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <span className="text-slate-400 italic">Aucun</span>
                                                        )}
                                                      </td>
                                                      <td className="py-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                          ligne.status === 'ACTIF'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                          {ligne.status}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ── Onglet Suivi ── */}
                {activeTabSousSection === 'suivi' && (
                  <SuiviTabSection
                    prestationId={prestationId}
                  />
                )}

                {/* Modal sélecteur PDF attestation */}
                {showPdfModal && (
                  <ModalAttestationPdfSelector
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    entetes={items}
                    onGenerate={handleAttestationGenerate}
                    onPreview={handleAttestationPreview}
                    loading={attestationPdfLoading}
                  />
                )}
              </div>
            </div>
          </div>
        ): (
          <div>
            {activeTab === 'beneficiaire' && clientFactureId && (
              <BeneficiaireListPage clientFactureId={clientFactureId} />
            )}
          </div>
        )}
      </TabContainer>
    </div>
  );
};

export default PageViewAttestation;