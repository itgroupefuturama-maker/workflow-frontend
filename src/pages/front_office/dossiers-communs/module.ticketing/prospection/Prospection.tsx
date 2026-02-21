import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiCheckSquare, FiX, FiSave, FiFileText, FiLayout } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchProspectionLignes, createProspectionLigne } from '../../../../../app/front_office/prospectionsLignesSlice';
import axios from '../../../../../service/Axios';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';
import TabContainer from '../../../../../layouts/TabContainer';
import { TicketingHeader } from '../../../../../components/TicketingBreadcrumb';
import NewLineRow from './NewLigneProspection';
import AddProspectionLigneModal from './AddProspectionLigneModal';

export default function ProspectionDetail() {
    const { enteteId } = useParams<{ enteteId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const entete = useSelector((state: RootState) =>
        state.prospectionsEntetes.items.find(e => e.id === enteteId)
    );

    const { current: billet } = useSelector((state: RootState) => state.billet);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const tabs = [
      { id: 'prospection', label: 'Listes des entête prospection' },
      { id: 'billet', label: 'Listes des billets' }
    ];

    const [activeTab, setActiveTab] = useState('prospection');

    const { items: destinations, loading: loadingDest } = useSelector((state: RootState) => state.destination);
    const { items: pays, loading: loadingPays } = useSelector((state: RootState) => state.pays);

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedLigneIds, setSelectedLigneIds] = useState<string[]>([]);

    const {
        items: lignes,
        loading: loadingLignes,
        error: errorLignes,
    } = useSelector((state: RootState) => state.prospectionsLignes);

    const {
      items: servicesDisponibles,
      loading: loadingServices,
      error: errorServices,
    } = useSelector((state: RootState) => state.serviceSpecifique);

    const loading = loadingLignes || loadingServices || loadingDest || loadingPays;

    const [newLine, setNewLine] = useState<any>(null);

    useEffect(() => {
      if (enteteId) {
        dispatch(fetchProspectionLignes(enteteId));
      }
      if (destinations.length === 0) {
        dispatch(fetchDestinations());
      }
      if (pays.length === 0) {
        dispatch(fetchPays());
      }
    }, [enteteId, dispatch]);

    // FONCTION DE NAVIGATION INTERCEPTÉE
    const handleTabChange = (id: string) => {
      if (id === 'billet') {
        // On remonte au parent (PageView) en passant le state pour l'onglet
        navigate(`/dossiers-communs/ticketing/pages`, { 
          state: { targetTab: 'billet' }
        });
      } else {
        setActiveTab(id);
      }
    };

    const handleAddNewLine = () => {
      if (newLine) return;

      const initialServiceValues = servicesDisponibles.map((s) => ({
        serviceSpecifiqueId: s.id,
        valeur: '',
      }));

      setNewLine({
        tempId: Date.now(),
        departId: '',
        destinationId: '',
        numeroVol: '',
        avion: '',
        itineraire: '',
        classe: 'ECONOMIE',
        typePassager: 'ADULTE',
        dateHeureDepart: '',
        dateHeureArrive: '',
        dureeVol: '',
        dureeEscale: '',
        puBilletCompagnieDevise: 0,
        puServiceCompagnieDevise: 0,
        puPenaliteCompagnieDevise: 0,
        devise: 'EUR',
        tauxEchange: 4900,
        montantBilletCompagnieDevise: 0,
        montantServiceCompagnieDevise: 0,
        montantPenaliteCompagnieDevise: 0,
        montantBilletClientDevise: 0,
        montantServiceClientDevise: 0,
        montantPenaliteClientDevise: 0,
        serviceValues: initialServiceValues,
        isSaving: false,
      });
    };

    // Nouvelle fonction pour sauvegarder depuis le modal :
    const handleSaveFromModal = async (formData: any) => {
      if (!enteteId) return;
      const payload = {
        prospectionEnteteId: enteteId,
        ...formData,
        nombre: Number(formData.nombre) || 1,
        tauxEchange: Number(formData.tauxEchange) || 4900,
        puBilletCompagnieDevise: Number(formData.puBilletCompagnieDevise) || 0,
        puServiceCompagnieDevise: Number(formData.puServiceCompagnieDevise) || 0,
        puPenaliteCompagnieDevise: Number(formData.puPenaliteCompagnieDevise) || 0,
        montantBilletCompagnieDevise: Number(formData.montantBilletCompagnieDevise) || 0,
        montantServiceCompagnieDevise: Number(formData.montantServiceCompagnieDevise) || 0,
        montantPenaliteCompagnieDevise: Number(formData.montantPenaliteCompagnieDevise) || 0,
        montantBilletClientDevise: Number(formData.montantBilletClientDevise) || 0,
        montantServiceClientDevise: Number(formData.montantServiceClientDevise) || 0,
        montantPenaliteClientDevise: Number(formData.montantPenaliteClientDevise) || 0,
      };
      await dispatch(createProspectionLigne(payload)).unwrap();
      dispatch(fetchProspectionLignes(enteteId));
    };

    const updateItineraireAuto = (updatedLine: any) => {
      const depart = destinations.find(d => d.id === updatedLine.departId);
      const dest = destinations.find(d => d.id === updatedLine.destinationId);

      let newItineraire = '';
      if (depart && dest) {
        newItineraire = `${depart?.ville || depart?.code || '?'} → ${dest?.ville || dest?.code || '?'}`;
      } else if (depart) {
        newItineraire = `${depart.ville} - ?`;
      } else if (dest) {
        newItineraire = `? - ${dest.ville}`;
      }

      return {
        ...updatedLine,
        itineraire: newItineraire,
      };
    };

    const updateNewLineField = (field: string, value: any) => {
      setNewLine(prev => {
        let updated = { ...prev, [field]: value };

        if (field === 'departId' || field === 'destinationId') {
          updated = updateItineraireAuto(updated);
        }

        return updated;
      });
    };

    const updateServiceValue = (index: number, newValeur: string) => {
      setNewLine((prev: any) => {
        const newValues = [...prev.serviceValues];
        newValues[index] = { ...newValues[index], valeur: newValeur.trim() };
        return { ...prev, serviceValues: newValues };
      });
    };

    const handleSaveNewLine = async () => {
      if (!newLine || !enteteId) return;

      if (!newLine.departId || !newLine.destinationId) {
        alert("Veuillez sélectionner un aéroport de départ et une destination");
        return;
      }

      if (!newLine.numeroVol.trim() || !newLine.itineraire.trim() || !newLine.dateHeureDepart) {
        alert("Veuillez remplir : numéro vol, itinéraire et date de départ");
        return;
      }

      setNewLine((prev: any) => ({ ...prev, isSaving: true }));

      try {
        const payload = {
          prospectionEnteteId: enteteId,
          departId: newLine.departId,
          destinationId: newLine.destinationId,
          numeroVol: newLine.numeroVol.trim(),
          avion: newLine.avion.trim() || null,
          itineraire: newLine.itineraire.trim() || null,
          classe: newLine.classe,
          typePassager: newLine.typePassager,
          dateHeureDepart: new Date(newLine.dateHeureDepart).toISOString(),
          dateHeureArrive: newLine.dateHeureArrive ? new Date(newLine.dateHeureArrive).toISOString() : null,
          dureeVol: newLine.dureeVol.trim() || null,
          dureeEscale: newLine.dureeEscale.trim() || null,
          devise: newLine.devise,
          tauxEchange: Number(newLine.tauxEchange) || 4900,

          puBilletCompagnieDevise: Number(newLine.puBilletCompagnieDevise) || 0,
          puServiceCompagnieDevise: Number(newLine.puServiceCompagnieDevise) || 0,
          puPenaliteCompagnieDevise: Number(newLine.puPenaliteCompagnieDevise) || 0,

          montantBilletCompagnieDevise: Number(newLine.montantBilletCompagnieDevise) || 0,
          montantServiceCompagnieDevise: Number(newLine.montantServiceCompagnieDevise) || 0,
          montantPenaliteCompagnieDevise: Number(newLine.montantPenaliteCompagnieDevise) || 0,

          montantBilletClientDevise: Number(newLine.montantBilletClientDevise) || 0,
          montantServiceClientDevise: Number(newLine.montantServiceClientDevise) || 0,
          montantPenaliteClientDevise: Number(newLine.montantPenaliteClientDevise) || 0,

          nombre: Number(newLine.nombre) || 1,

          services: newLine.serviceValues.map((s: any) => ({
            serviceSpecifiqueId: s.serviceSpecifiqueId,
            valeur: s.valeur.trim() || 'false',
          })),
        };

        await dispatch(createProspectionLigne(payload)).unwrap();
        dispatch(fetchProspectionLignes(enteteId));
        setNewLine(null);
      } catch (err: any) {
        alert("Erreur création : " + (err?.message || "voir console"));
        console.error(err);
        setNewLine((prev: any) => ({ ...prev, isSaving: false }));
      }
    };

    const toggleSelectionMode = () => {
      setSelectionMode(!selectionMode);
      if (selectionMode) {
        setSelectedLigneIds([]);
      }
    };

    const toggleLigneSelection = (ligneId: string) => {
      setSelectedLigneIds(prev =>
        prev.includes(ligneId)
          ? prev.filter(id => id !== ligneId)
          : [...prev, ligneId]
      );
    };

    const isAllSelected = lignes.length > 0 && selectedLigneIds.length === lignes.length;

    const toggleSelectAll = () => {
      if (isAllSelected) {
        setSelectedLigneIds([]);
      } else {
        setSelectedLigneIds(lignes.map(l => l.id));
      }
    };

    const handleCreateDevis = async () => {
      if (selectedLigneIds.length === 0) return;

      if (!window.confirm(`Créer un devis avec ${selectedLigneIds.length} ligne(s) ?`)) {
        return;
      }

      try {
        const payload = {
          prospectionEnteteId: enteteId,
          prospectionLigneIds: selectedLigneIds,
        };

        const response = await axios.post('/devis', payload);

        if (response.data?.success) {
          alert('Devis créé avec succès !');
          setSelectedLigneIds([]);
          setSelectionMode(false);
          navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)
        } else {
          alert('Réponse invalide du serveur');
        }
      } catch (err: any) {
        console.error(err);
        alert('Erreur lors de la création du devis : ' + (err.response?.data?.message || err.message));
      }
    };

    const handleCancelNewLine = () => {
      setNewLine(null);
    };

    if (!enteteId) {
      return <div className="p-8 text-center text-red-600">ID en-tête manquant</div>;
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (errorLignes || errorServices) {
      return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
          {errorLignes}
        </div>
      );
    }

    if (!entete) {
      return (
        <div className="p-8 text-center text-amber-700 bg-amber-50 rounded-xl">
          En-tête non trouvé dans le store. Veuillez recharger la liste des en-têtes.
        </div>
      );
    }

   

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-[#F8FAFC]">

          <TicketingHeader 
            items={[
              { 
                label: "Liste Entete Prospection", 
                path: `/dossiers-communs/ticketing/pages`, 
                state: { targetTab: 'prospection' }
              },
              { label: "Prospection detail", isCurrent: true }
            ]} 
          />
        <header className="mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h1 className="font-bold text-slate-800 mb-1 uppercase">
              N° prospection : {entete?.numeroEntete}
            </h1>
            <p className="text-slate-600 mb-6 uppercase">
              Prestation : {entete.prestation?.numeroDos || entete.prestationId || '—'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Fournisseur</label>
                <p className="font-medium mt-1">
                  {entete.fournisseur?.libelle || entete.fournisseurId || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Type de vol</label>
                <p className="font-medium mt-1">{entete?.typeVol}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Crédit</label>
                <p className="font-medium mt-1">{entete?.credit}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Commission proposée</label>
                <p className="font-medium mt-1">{entete?.commissionPropose} %</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Commission appliquée</label>
                <p className="font-medium mt-1">{entete?.commissionAppliquer} %</p>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-gray-200">
            {/* Mode indicator bar */}
            {selectionMode && (
              <div className="bg-green-50 border-b border-green-200 px-6 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center justify-center w-5 h-5 bg-green-600 rounded-full">
                    <FiCheckSquare className="text-white" size={12} />
                  </div>
                  <span className="font-medium text-green-900">
                    Mode sélection activé
                  </span>
                  <span className="text-green-700">
                    • Sélectionnez les lignes à inclure dans le devis
                  </span>
                </div>
              </div>
            )}

            {/* Main action bar */}
            <div className="px-6 py-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                {/* Titre */}
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Lignes de prospection
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {lignes.length} {lignes.length !== 1 ? 'lignes' : 'ligne'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectionMode 
                      ? `${selectedLigneIds.length} ligne${selectedLigneIds.length !== 1 ? 's' : ''} sélectionnée${selectedLigneIds.length !== 1 ? 's' : ''}`
                      : 'Gérez vos lignes de prospection et créez des devis'
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {selectionMode ? (
                    <>
                      <button
                        onClick={toggleSelectionMode}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        <FiX size={16} />
                        Annuler
                      </button>

                      <button
                        onClick={handleCreateDevis}
                        disabled={selectedLigneIds.length === 0}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
                          selectedLigneIds.length === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                        }`}
                      >
                        <FiCheckSquare size={16} />
                        Créer le devis
                        {selectedLigneIds.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white/20 rounded-full text-xs font-semibold">
                            {selectedLigneIds.length}
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* <button
                        onClick={() => navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all font-medium"
                      >
                        <FiFileText size={16} />
                        Voir les devis
                      </button>

                      <button
                        onClick={toggleSelectionMode}
                        disabled={lignes.length === 0 || !!newLine || loadingLignes}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                          lignes.length === 0 || !!newLine || loadingLignes
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300'
                        }`}
                      >
                        <FiCheckSquare size={16} />
                        Sélectionner pour devis
                      </button> */}

                      <button
                        onClick={() => navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all font-medium"
                      >
                        <FiFileText size={16} />
                        Voir les devis
                      </button>

                      <button
                        onClick={toggleSelectionMode}
                        disabled={lignes.length === 0 || !!newLine || loadingLignes}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                          lignes.length === 0 || !!newLine || loadingLignes
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300'
                        }`}
                      >
                        <FiCheckSquare size={16} />
                        Sélectionner pour devis
                      </button>

                      {/* Bouton ajout inline dans le tableau */}
                      <button
                        onClick={handleAddNewLine}
                        disabled={!!newLine || loadingLignes || selectionMode || isModalOpen}
                        title="Ajouter directement dans le tableau"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                          !!newLine || loadingLignes || selectionMode || isModalOpen
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        <FiLayout size={16} />
                        Ajout (Ligne)
                      </button>

                      {/* Bouton ajout via modal */}
                      <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!!newLine || loadingLignes || selectionMode}
                        title="Ajouter via une fenêtre modale"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                          !!newLine || loadingLignes || selectionMode
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                      >
                        <FiPlus size={16} />
                        Ajouter (Modal)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loadingLignes ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 animate-pulse">
              Chargement des lignes...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {selectionMode && (
                      <th className="px-4 py-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">N° Dos Ref</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Statut</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Nb passager</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Numéro de vol</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Avion</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Départ</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Destination</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">Itinéraire</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Classe</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Type passager</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Date Départ</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Date Arrivée</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Durée vol</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[110px]">Durée escale</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[130px]">PU Billet Cie</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[140px]">PU Service Cie</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">PU Pénalité Cie</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[80px]">Devise</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Taux change</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[140px]">Mt Billet Cie</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Mt Service Cie</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Mt Pénalité Cie</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Mt Billet Cie Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[170px]">Mt Service Cie Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">Mt Pénalité Cie Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Mt Billet Client</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Mt Service Client</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[170px]">Mt Pénalité Client</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[170px]">Mt Billet Client Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">Mt Service Client Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[190px]">Mt Pénalité Client Ar</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">Commission Devise</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[170px]">Commission Ariary</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[250px]">Services & Spécifique</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Array.isArray(lignes) && lignes.length > 0 ? (
                    lignes.map((ligne) => (
                      <tr key={ligne.id} className="hover:bg-blue-50/30 transition-colors">
                        {selectionMode && (
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLigneIds.includes(ligne.id)}
                              onChange={() => toggleLigneSelection(ligne.id)}
                              className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ligne.numeroDosRef || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-medium uppercase">{ligne.status =='CREER' ? 'crée' : ligne.status == 'MODIFIER' ? 'modifiée' : ligne.status }</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{ligne.nombre || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{ligne.numeroVol || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.avion || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">—</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">—</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.itineraire || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{ligne.classe || '—'}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.typePassager || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {ligne.dateHeureDepart
                            ? new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {ligne.dateHeureArrive
                            ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeVol || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeEscale || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-700">
                          {ligne.puBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-700">
                          {ligne.puServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-700">
                          {ligne.puPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          <span className="font-mono font-semibold">{ligne.devise || '—'}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {ligne.tauxEchange?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-700 text-right">
                          {ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-700 text-right">
                          {ligne.montantServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-700 text-right">
                          {ligne.montantPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                          {ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                          {ligne.montantServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                          {ligne.montantPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700 text-right">
                          {ligne.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700 text-right">
                          {ligne.montantServiceClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700 text-right">
                          {ligne.montantPenaliteClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                          {ligne.montantBilletClientAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                          {ligne.montantServiceClientAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                          {ligne.montantPenaliteClientAriary?.toLocaleString('fr-FR') || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">
                          {ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                          {ligne.commissionEnAriary?.toLocaleString('fr-FR') || '—'}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-row gap-1">
                            {ligne.serviceProspectionLigne?.length > 0 ? (
                              ligne.serviceProspectionLigne.map((service) => {
                                const label = service.serviceSpecifique?.libelle || service.serviceSpecifiqueId.slice(0, 8);
                                const value = service.valeur;
                                return (
                                  <span
                                    key={service.id}
                                    className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium"
                                    title={`${label} = ${value}`}
                                  >
                                    {label}: {value}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 italic text-xs">Aucun service</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-400">
                          —
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={33} className="px-6 py-10 text-center text-slate-500">
                        {loadingLignes ? 'Chargement des lignes...' : 'Aucune ligne trouvée'}
                      </td>
                    </tr>
                  )}

                  {newLine && (
                    <NewLineRow
                      newLine={newLine}
                      destinations={destinations}
                      servicesDisponibles={servicesDisponibles}
                      updateNewLineField={updateNewLineField}
                      updateServiceValue={updateServiceValue}
                      handleSaveNewLine={handleSaveNewLine}
                      handleCancelNewLine={handleCancelNewLine}
                    />
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <AddProspectionLigneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        destinations={destinations}
        servicesDisponibles={servicesDisponibles}
        onSave={handleSaveFromModal}
      />
    </TabContainer>
  );
}

