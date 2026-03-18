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

  // On récupère le dossier actif de Redux au lieu de l'URL
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

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

  // ─── États pour le commentaire fournisseur ────────────────────────────────
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = !!prestationId && fournisseurs.length > 0;

  const tabs = [
    { id: 'prospection', label: 'Listes des entête attestation' }
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

    setFormError(null);

    try {
      await dispatch(
        createAttestationEntete({
          prestationId,
          fournisseurId: selectedFournisseurId,
        })
      ).unwrap();  // unwrap pour catcher l'erreur redux

      setSelectedFournisseurId(''); // reset
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

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex justify-between items-center mt-4">
        <AttestationHeader
          numeroAttestation={dossierActif?.numero}
          navigate={navigate}
        />
        
      </div>

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
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
        
        {canCreate && activeTabSousSection === 'lignes' && (
          <div className="flex gap-3">
            <div>
              <select
                value={selectedFournisseurId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedFournisseurId(id);
                  if (id) {
                    dispatch(fetchLastCommentaireFournisseur(id));
                  } else {
                    dispatch(clearCommentaireFournisseur());
                  }
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Choisir —</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.libelle}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !selectedFournisseurId || isBlocked}
              className={`
                px-5 py-1 rounded-lg font-medium text-white
                ${loading || !selectedFournisseurId || isBlocked
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }
              `}
            >
              {loading ? 'Création...' : 'Créer entête'}
            </button>
            <FournisseurAlerteBadge />
          </div>
        )}
      </div>

      {activeTabSousSection === 'lignes' && (
        <div className="bg-white space-y-4 overflow-hidden">
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
    </TabContainer>
  );
};

export default PageViewAttestation;