import { useEffect, useState } from 'react';
import { FiCheck, FiCheckCircle, FiEye, FiList, FiRefreshCw, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { approuverDirectionDevis, fetchDevisByEntete, updateApprouverDevisStatut, updateValidateDevisStatut, type Ligne } from '../../../../../app/front_office/devisSlice';
import { annulerDevis } from '../../../../../app/front_office/devisSlice';
import axios from '../../../../../service/Axios';
import TabContainer from '../../../../../layouts/TabContainer';
import { TicketingHeader } from '../../../../../components/TicketingBreadcrumb';
import AnnulationDevisModal from '../../../../../components/modals/AnnulationDevisModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function Devis () {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { enteteId } = useParams<{ enteteId: string }>();

  const { items: devisList, loading, error } = useSelector((state: RootState) => state.devis);
  const [openDevisId, setOpenDevisId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<{ [key: string]: boolean }>({});
  const { current: billet } = useSelector((state: RootState) => state.billet);

  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [selectedDevisForCancel, setSelectedDevisForCancel] = useState<Devis | null>(null);
  const [annulationLoading, setAnnulationLoading] = useState(false);

  const [directionLoading, setDirectionLoading] = useState<{ [key: string]: boolean }>({});

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet', label: 'Listes des billets' }
  ];

  const [activeTab, setActiveTab] = useState('prospection');

  const [openRow, setOpenRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setOpenRow(openRow === id ? null : id);
  };


  // FONCTION DE NAVIGATION INTERCEPTÉE
    const handleTabChange = (id: string) => {
      if (id === 'billet') {
        // On remonte au parent (PageView) en passant le state pour l'onglet
        navigate(`/dossiers-communs/${billet?.prospectionEntete.prestationId}/pages`, { 
          state: { targetTab: 'billet' }
        });
      } else {
        setActiveTab(id);
      }
    };

  useEffect(() => {
    if (enteteId) {
      dispatch(fetchDevisByEntete(enteteId));
    }
  }, [enteteId, dispatch]);

  const toggleDevis = (devisId: string) => {
    setOpenDevisId(openDevisId === devisId ? null : devisId);
  };

  const handleDownloadPdf = async (devisId: string, reference: string) => {
    setPdfLoading((prev) => ({ ...prev, [devisId]: true }));

    try {
      // const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6060';
      const apiBaseUrl = 'http://192.168.1.125:5001';
      // Appel POST avec axios – exactement comme le style de ton slice
      const response = await axios.post(`/devis/${devisId}/pdf/save`, {
        // Body → souvent vide suffit, mais tu peux passer des options si besoin
        // format: 'A4',
        // orientation: 'portrait',
        // etc.
      }, {
        // options axios supplémentaires si nécessaire
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,   // décommente si besoin
        },
        // timeout: 45000,   // optionnel – utile si la génération PDF est longue
      });

      const result = response.data;

      // Vérification plus robuste (structure que tu attends)
      if (result?.success && result?.data?.filepath) {
        const pdfUrl = `${apiBaseUrl}/${result.data.filepath}`;
        window.open(pdfUrl, '_blank');
      } else {
        console.warn('Réponse inattendue :', result);
        throw new Error(
          result?.message ||
          'Structure invalide : success ou data.filepath manquant'
        );
      }
    } catch (err: any) {
      console.error('Erreur génération PDF :', err);

      // Meilleur message d'erreur pour l'utilisateur
      let errorMsg = 'Erreur inconnue lors de la génération du PDF';

      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(`Erreur pour le devis ${reference} :\n${errorMsg}`);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [devisId]: false }));
    }
  };

  const handleAsAapprouved = async (billetId: string) => {
    if (!enteteId) return;
    try {
      await dispatch(updateApprouverDevisStatut({ enteteId: billetId })).unwrap();
      dispatch(fetchDevisByEntete(enteteId));
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    }
  };
  
  const handleAsValidate = async (billetId: string) => {
    if (!enteteId) return;
    try {
      await dispatch(updateValidateDevisStatut({ enteteId: billetId })).unwrap();
      dispatch(fetchDevisByEntete(enteteId));
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleApprouverDirection = async (devisId: string, reference: string) => {
  if (!enteteId) return;

  // Optionnel : demander confirmation
  if (!window.confirm(`Envoyer le devis ${reference} à la direction ?\nCela générera le PDF commission.`)) {
    return;
  }

  setDirectionLoading((prev) => ({ ...prev, [devisId]: true }));

  try {
    // Valeurs à envoyer – adapte selon tes besoins réels
    // Ici on utilise des valeurs fictives / placeholders
    // → À toi de les récupérer du devis ou de demander à l'utilisateur via un modal si besoin
    const payload = {
      client: "CLIENT EXAMPLE SAS",          // ← À remplacer dynamiquement
      facture: `FACT-${new Date().getFullYear()}-${reference.split('-')[2] || 'XXXX'}`,
    };

    const result = await dispatch(
      approuverDirectionDevis({
        devisId,
        client: payload.client,
        facture: payload.facture,
      })
    ).unwrap();

    // La réponse ressemble à : { success: true, data: { success: true, message: "...", filepath: "..." } }
    const filepath = result?.data?.filepath;

    if (filepath) {
      // Construction de l'URL complète
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.125:5001';
      const pdfUrl = `${apiBaseUrl}/${filepath}`;

      // Ouvrir dans un nouvel onglet
      window.open(pdfUrl, '_blank');
      
      // Optionnel : recharger la liste pour refléter un éventuel changement de statut
      dispatch(fetchDevisByEntete(enteteId));
      
      alert('PDF Commission généré et envoyé à la direction avec succès !');
    } else {
      throw new Error('Chemin du PDF non reçu');
    }
  } catch (err: any) {
    console.error('Erreur approuver direction :', err);
    alert('Erreur : ' + (err.message || 'Impossible de générer le PDF commission'));
  } finally {
    setDirectionLoading((prev) => ({ ...prev, [devisId]: false }));
  }
};

  if (!enteteId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-red-600">
        ID de l'entête manquant dans l'URL
      </div>
    );
  }

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">

        <TicketingHeader 
          items={[
            { 
              label: "Liste Entete Prospection", 
              path: `/dossiers-communs/${billet?.prospectionEntete.prestationId}/pages`, 
              state: { targetTab: 'prospection' } 
            },
            { 
              label: "Prospection detail",
              path: `/dossiers-communs/${billet?.prospectionEntete.prestationId}/pages/prospection/${enteteId}` 
            },
            { label: "Liste Devis", isCurrent: true }
          ]}
        />
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Devis liés à l'entête
          </h1>
        </header>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            <span className="ml-4 text-slate-600 font-medium">Chargement des devis...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {devisList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-600 text-lg font-medium">
                  Aucun devis généré pour cet entête.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {devisList.map((devis) => {
                  const entete = devis.data?.entete || {};
                  const lignes = devis.data?.lignes || [];
                  const lignesCount = lignes.length;
                  const isLoadingPdf = pdfLoading[devis.id] || false;

                  const handleCreateBillet = async () => {
                    try {
                      const payload = {
                        devisId: devis.id,
                        prospectionEnteteId: entete.id,   // ou devis.data?.entete?.id selon ta structure exacte
                      };

                      const response = await axios.post('/billet/entete', payload);

                      if (response.data?.success && response.data?.data?.id) {
                        alert('Creation billet avec succée')

                        navigate(`/dossiers-communs/${devis.data.entete.prestation.id}/pages/billet/${devis.id}?prospectionEnteteId=${devis.data?.entete?.id}`);
                        // Option 2 (alternative) : juste l'ID et re-fetch dans la page billet
                        // navigate(`/dossiers-communs/ticketing/billet/${nouveauBilletId}`);
                      } else {
                        alert('Erreur lors de la création du billet');
                      }
                    } catch (err: any) {
                      console.error('Erreur création billet:', err);
                      const msg = err.response?.data?.message || 'Erreur serveur';
                      alert(`Échec création billet : ${msg}`);
                    }
                  };

                  return (
                    <div
                      key={devis.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                      {/* En-tête du devis (toujours visible) */}
                      <div
                        className="p-5 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleDevis(devis.id)}
                      >
                        <div>
                          <h3 className="text-lg font-bold text-indigo-700">
                            {devis.reference}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Créé le {new Date(devis.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xl font-bold text-emerald-700">
                              {devis.totalGeneral.toLocaleString('fr-FR')} Ar
                            </div>
                            <div className="text-xs text-slate-500">
                              {lignesCount} ligne{lignesCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenu détaillé (visible quand ouvert) */}
                      <div className="px-5 pb-6 border-t border-slate-200">
                        {/* Infos entête */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Statut 
                            </label>
                            <div className="font-medium">{devis.statut || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Fournisseur 
                            </label>
                            <div className="font-medium">{entete.fournisseur?.libelle || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Type de vol
                            </label>
                            <div className="font-medium">{entete.typeVol || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Crédit
                            </label>
                            <div className="font-medium">{entete.credit || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Commission proposée
                            </label>
                            <div className="font-medium">
                              {entete.commissionPropose != null ? `${entete.commissionPropose} %` : '—'}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Commission appliquée
                            </label>
                            <div className="font-medium">
                              {entete.commissionAppliquer != null ? `${entete.commissionAppliquer} %` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Tableau des lignes */}
                        {lignes.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50/80 backdrop-blur-md sticky top-0">
                                <tr>
                                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vol & Itinéraire</th>
                                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Passager / Classe</th>
                                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Horaires & Durée</th>
                                  <th className="px-4 py-4 text-right text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/30">Tarification Cie</th>
                                  <th className="px-4 py-4 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/30">Tarification Client</th>
                                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Services & Conditions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {lignes.map((ligne: Ligne) => (
                                  <tr key={ligne.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    {/* 1. VOL & ITINERAIRE */}
                                    <td className="px-4 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-indigo-600 mb-1">{ligne.numeroVol || 'N/A'}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-slate-700">{ligne.itineraire}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-medium">Réf: {ligne.numeroDosRef || '—'}</span>
                                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-medium">Nb ligne: {ligne.nombre || '—'}</span>
                                      </div>
                                    </td>

                                    {/* 2. PASSAGER & CLASSE */}
                                    <td className="px-4 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm text-slate-700 font-medium">{ligne.typePassager}</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 w-fit mt-1">
                                          Classe {ligne.classe}
                                        </span>
                                      </div>
                                    </td>

                                    {/* 3. HORAIRES & INFOS TECHNIQUES */}
                                    <td className="px-4 py-4">
                                      <div className="text-xs space-y-1 text-slate-600">
                                        <div className="flex items-center gap-2">
                                          <span className="w-12 font-semibold text-slate-400">Départ:</span> 
                                          <span>{new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="w-12 font-semibold text-slate-400">Arrivée:</span>
                                          <span>{ligne.dateHeureArrive ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', { timeStyle: 'short' }) : '—'}</span>
                                        </div>
                                        <div className="flex gap-3 mt-2 text-[10px] font-bold text-indigo-500 uppercase">
                                          <span>✈️ {ligne.avion || 'N/A'}</span>
                                          <span>⏳ {ligne.dureeVol || '—'}</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* 4. TARIFICATION COMPAGNIE (SÉPARÉ) */}
                                    <td className="px-4 py-4 bg-emerald-50/10">
                                      <div className="flex flex-col items-end gap-1">
                                        <div className="text-xs text-slate-500">
                                          Billet: <span className="font-semibold text-slate-700">{ligne.montantBilletCompagnieDevise?.toLocaleString()} {ligne.devise}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          Service: <span className="text-slate-700">{ligne.montantServiceCompagnieDevise?.toLocaleString()} {ligne.devise}</span>
                                        </div>
                                        <div className="text-xs font-bold text-emerald-700 mt-1 pt-1 border-t border-emerald-100">
                                          Total: { (ligne.montantBilletCompagnieDevise + ligne.montantServiceCompagnieDevise).toLocaleString() } {ligne.devise}
                                        </div>
                                      </div>
                                    </td>

                                    {/* 5. TARIFICATION CLIENT (SÉPARÉ) */}
                                    <td className="px-4 py-4 bg-indigo-50/10">
                                      <div className="flex flex-col items-end gap-1">
                                        <div className="text-xs text-slate-500">
                                          Billet: <span className="font-semibold text-slate-700">{ligne.montantBilletClientDevise?.toLocaleString()} {ligne.devise}</span>
                                        </div>
                                        <div className="text-xs text-indigo-600 font-medium">
                                          Com: +{ligne.commissionEnDevise?.toLocaleString()} {ligne.devise}
                                        </div>
                                        <div className="text-sm font-black text-indigo-700 mt-1 pt-1 border-t border-indigo-100">
                                          Total: { (ligne.montantBilletClientDevise + ligne.montantServiceClientDevise).toLocaleString() } {ligne.devise}
                                        </div>
                                      </div>
                                    </td>

                                    {/* 6. SERVICES & CONDITIONS */}
                                    <td className="px-4 py-4">
                                      <div className="space-y-3">
                                        {/* Tags de services */}
                                        <div className="flex flex-wrap gap-1">
                                          {ligne.serviceProspectionLigne?.length > 0 ? (
                                            ligne.serviceProspectionLigne.map((svc) => (
                                              <span key={svc.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">
                                                {svc.serviceSpecifique?.libelle || 'Svc'}: {svc.valeur === 'true' ? 'Oui' : svc.valeur === 'false' ? 'Non' : svc.valeur}
                                              </span>
                                            ))
                                          ) : <span className="text-[10px] text-slate-300 italic">Aucun service</span>}
                                        </div>
                                        
                                        {/* Conditions Modif/Annul */}
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          <div className="p-1.5 bg-orange-50 rounded border border-orange-100 text-center">
                                            <p className="text-[9px] uppercase font-bold text-orange-600">Modif</p>
                                            <p className="text-[10px] text-orange-800 font-medium truncate" title={ligne.conditionModif}>{ligne.conditionModif || 'N/A'}</p>
                                          </div>
                                          <div className="p-1.5 bg-red-50 rounded border border-red-100 text-center">
                                            <p className="text-[9px] uppercase font-bold text-red-600">Annul</p>
                                            <p className="text-[10px] text-red-800 font-medium truncate" title={ligne.conditionAnnul}>{ligne.conditionAnnul || 'N/A'}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic mt-4">Aucune ligne dans ce devis</p>
                        )}
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                          {/* Bouton Voir liste Billet - Toujours actif */}
                          <button
                          disabled= { devis.statut == 'ANNULER' || devis.statut == 'DEVIS_A_APPROUVER'}
                            onClick={() => navigate(`/dossiers-communs/${devis.data.entete.prestation.id}/pages/billet/${devis.id}?prospectionEnteteId=${devis.data?.entete?.id}`)}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                              devis.statut === 'DEVIS_APPROUVE'
                                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <FiList size={16} />
                          </button>

                          {/* Bouton Devis à approuver */}
                          <button
                            onClick={() => {
                              if (devis.statut === 'CREER') {
                                handleAsAapprouved(devis.id);
                              }
                            }}
                            disabled={devis.statut !== 'CREER'}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                              devis.statut === 'CREER'
                                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={devis.statut !== 'CREER' ? 'Disponible uniquement pour les devis créés' : ''}
                          >
                            <FiCheckCircle size={16} />
                            Envoyer Client
                          </button>

                          {/* Bouton Devis à valider */}
                          <button
                            onClick={() => {
                              if (devis.statut === 'DEVIS_A_APPROUVER') {
                                handleAsValidate(devis.id);
                              }
                            }}
                            disabled={devis.statut !== 'DEVIS_A_APPROUVER'}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                              devis.statut === 'DEVIS_A_APPROUVER'
                                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={devis.statut !== 'DEVIS_A_APPROUVER' ? 'Disponible uniquement pour les devis à approuver' : ''}
                          >
                            <FiCheck size={16} />
                            Approuver / Client
                          </button>

                          <button
                            onClick={() => {
                              if (devis.statut === 'DEVIS_APPROUVE') {   // adapte selon le statut où le bouton doit être actif
                                handleApprouverDirection(devis.id, devis.reference);
                              }
                            }}
                            disabled={devis.statut !== 'DEVIS_APPROUVE' || directionLoading[devis.id]}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium min-w-[180px] justify-center ${
                              devis.statut === 'DEVIS_APPROUVE' && !directionLoading[devis.id]
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={devis.statut !== 'DEVIS_APPROUVE' ? 'Disponible uniquement pour les devis approuvés' : ''}
                          >
                            {directionLoading[devis.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                En cours...
                              </>
                            ) : (
                              <>
                                <FiCheck size={16} />
                                Envoyer Direction
                              </>
                            )}
                          </button>

                          {/* Bouton Devis à transformer */}
                          <button
                            onClick={() => {
                              if (devis.statut === 'DEVIS_APPROUVE') {
                                handleCreateBillet();
                              }
                            }}
                            disabled={devis.statut !== 'DEVIS_APPROUVE'}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                              devis.statut === 'DEVIS_APPROUVE'
                                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={devis.statut !== 'DEVIS_APPROUVE' ? 'Disponible uniquement pour les devis approuvés' : ''}
                          >
                            <FiRefreshCw size={16} />
                            Transformer / Billet
                          </button>

                          {/* Bouton Voir/Télécharger PDF - Toujours actif */}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(devis.id, devis.reference);
                            }}
                            disabled={isLoadingPdf || devis.statut == 'ANNULER'}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingPdf ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                Génération...
                              </>
                            ) : (
                              <>
                                <FiEye size={16} />
                                Voir PDF
                              </>
                            )}
                          </button>

                          {/* Nouveau bouton Annuler */}
                          {/* Bouton Annuler - Visible selon le statut */}
                          {/* {['CREER', 'DEVIS_A_APPROUVER'].includes(devis.statut) && ( */}
                            <button
                            disabled= { devis.statut == 'ANNULER' || devis.statut == 'DEVIS_APPROUVE'}
                              onClick={() => {
                                setSelectedDevisForCancel(devis);
                                setShowAnnulationModal(true);
                              }}
                              className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                                devis.statut === 'CREER' || devis.statut === 'DEVIS_A_APPROUVER'
                                  ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <FiX size={16} />
                              Annuler
                            </button>
                          {/* )} */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {selectedDevisForCancel && (
        // Dans Devis.tsx, cherchez le composant AnnulationDevisModal
        <AnnulationDevisModal
          isOpen={showAnnulationModal}
          onClose={() => {
            setShowAnnulationModal(false);
            setSelectedDevisForCancel(null);
          }}
          onSubmit={async (data) => {
            if (!selectedDevisForCancel) return;
            
            setAnnulationLoading(true);
            try {
              // 1. On lance l'annulation
              await dispatch(
                annulerDevis({
                  devisId: selectedDevisForCancel.id,
                  payload: data,
                })
              ).unwrap();
              
              // 2. ICI : On réactualise la liste immédiatement
              if (enteteId) {
                dispatch(fetchDevisByEntete(enteteId));
              }

              alert('Devis annulé avec succès');
              setShowAnnulationModal(false);
              setSelectedDevisForCancel(null);
            } catch (err: any) {
              alert(err || 'Erreur lors de l\'annulation');
            } finally {
              setAnnulationLoading(false);
            }
          }}
          lignes={selectedDevisForCancel?.data?.lignes || []} // Ajout du ? au cas où
          loading={annulationLoading}
        />
      )}
      </div>
    </TabContainer>
  );
}
