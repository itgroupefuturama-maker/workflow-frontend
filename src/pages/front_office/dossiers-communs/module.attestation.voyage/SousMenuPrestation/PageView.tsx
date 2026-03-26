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

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5 font-medium">{value}</p>
    </div>
  );
};

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
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        {activeTab === 'prospection' ? (
          <div className='py-2 px-4'>
            <AttestationHeader
              numeroAttestation={dossierActif?.numero}
              navigate={navigate}
            />

            {formError && (
              <div className="m-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {formError}
              </div>
            )}

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
              
              {/* Dans le canCreate*/}
              {canCreate && activeTabSousSection === 'lignes' && (
                <div className="flex gap-3 items-center">

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
                          {items.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item.id)}           // ← AJOUT PRINCIPAL
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {item.numeroEntete} 
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
                                {item.puAriary.toLocaleString('fr-FR')} Ar
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
                          ))}
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