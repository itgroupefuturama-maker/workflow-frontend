import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiCheckSquare, FiX, FiFileText, FiLayout } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchProspectionLignes, createProspectionLigne, type CreateProspectionLignePayload } from '../../../../../app/front_office/prospectionsLignesSlice';
import axios from '../../../../../service/Axios';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';
import TabContainer from '../../../../../layouts/TabContainer';
// import { TicketingHeader } from '../../../../../components/TicketingBreadcrumb';
import NewLineRow from './NewLigneProspection';
import AddProspectionLigneModal from './AddProspectionLigneModal';
import ProspectionModals from '../../../../../components/modals/ProspectionModals';
import { createProspectionEntete, updateProspectionEntete, type ProspectionEntete } from '../../../../../app/front_office/prospectionsEntetesSlice';
import { TicketingHeader } from '../ticketing.sous.module/components.billet/TicketingHeader';
import { prospectionDetailItems, prospectionListeItems } from '../ticketing.sous.module/components.billet/utils/ticketingHeaderItems';

export default function ProspectionDetail() {
    const { enteteId } = useParams<{ enteteId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const entete = useSelector((state: RootState) =>
        state.prospectionsEntetes.items.find(e => e.id === enteteId)
    );

    const [isModalOpen, setIsModalOpen] = useState(false);

    const tabs = [
      { id: 'prospection', label: 'Listes des entête prospection' },
      { id: 'billet', label: 'Listes des billets' }
    ];

    const [activeTab, setActiveTab] = useState('prospection');

    const [showPenalite, setShowPenalite] = useState(false);

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

    const { data: fournisseurs, loading: fournisseursLoading } = useSelector(
      (state: RootState) => state.fournisseurs
    );

    const loading = loadingLignes || loadingServices || loadingDest || loadingPays;

    const [newLine, setNewLine] = useState<any>(null);

    const [collapsedGroups, setCollapsedGroups] = useState({
      infosVol: false,
      tarifsCieDevise: false,
      tarifsCieAriary: false,   // replié par défaut
      tarifsClientDevise: false,
      tarifsClientAriary: false, // replié par défaut
      commissions: false,
      services: true,
    });

    const toggleGroup = (group: keyof typeof collapsedGroups) => {
      setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

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

    const [showCreateModal, setShowCreateModal] = useState(false);
      const [newEntete, setNewEntete] = useState({
      fournisseurId: '',
      credit: 'CREDIT_15',     // valeur par défaut
      typeVol: 'LONG_COURRIER', // valeur par défaut
    });

    const [isCreating, setIsCreating] = useState(false);
    const [modalCommission, setModalCommission] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedEntete, setSelectedEntete] = useState<ProspectionEntete | null>(null);

    const openEditModal = (entete: ProspectionEntete) => {
      setSelectedEntete(entete);
      setModalCommission(entete.commissionAppliquer);
    };

    const closeModal = () => {
      setSelectedEntete(null);
      setModalCommission(0);
      setIsSaving(false);
    };

    const closeCreateModal = () => {
      setShowCreateModal(false);
      setIsCreating(false);
    };

    const buildPayload = (formData: any): Omit<CreateProspectionLignePayload, 'prospectionEnteteId'> => {
      const taux   = Number(formData.tauxEchange) || 4900;
      const nombre = Number(formData.nombre) || 1;
      const commissionPct = Number(entete?.commissionAppliquer) || 0;

      // ── PU Compagnie Devise (saisis par l'utilisateur) ──────────────
      const puBilletCieDevise   = Number(formData.puBilletCompagnieDevise)   || 0;
      const puServiceCieDevise  = Number(formData.puServiceCompagnieDevise)  || 0;
      const puPenaliteCieDevise = Number(formData.puPenaliteCompagnieDevise) || 0;

      // ── Montant Compagnie Devise = PU * nombre ───────────────────────
      const mtBilletCieDevise   = puBilletCieDevise   * nombre;
      const mtServiceCieDevise  = puServiceCieDevise  * nombre;
      const mtPenaliteCieDevise = puPenaliteCieDevise * nombre;

      // ── PU Compagnie Ariary = PU Devise * Taux ───────────────────────
      const puBilletCieAriary   = puBilletCieDevise   * taux;
      const puServiceCieAriary  = puServiceCieDevise  * taux;
      const puPenaliteCieAriary = puPenaliteCieDevise * taux;

      // ── Montant Compagnie Ariary = PU Ariary * nombre ────────────────
      const mtBilletCieAriary   = puBilletCieAriary   * nombre;
      const mtServiceCieAriary  = puServiceCieAriary  * nombre;
      const mtPenaliteCieAriary = puPenaliteCieAriary * nombre;

      // ── Montant Client Devise = Mt Cie Devise * (1 + commission%) ────
      const facteur = 1 + commissionPct / 100;
      const mtBilletClientDevise   = mtBilletCieDevise   * facteur;
      const mtServiceClientDevise  = mtServiceCieDevise  * facteur;
      const mtPenaliteClientDevise = mtPenaliteCieDevise * facteur;

      // ── Montant Client Ariary = Mt Client Devise * Taux ──────────────
      const mtBilletClientAriary   = mtBilletClientDevise   * taux;
      const mtServiceClientAriary  = mtServiceClientDevise  * taux;
      const mtPenaliteClientAriary = mtPenaliteClientDevise * taux;

      // ── Commission = Mt Client Devise - Mt Cie Devise ────────────────
      const commissionEnDevise = (mtBilletClientDevise   - mtBilletCieDevise)
                              + (mtServiceClientDevise  - mtServiceCieDevise)
                              + (mtPenaliteClientDevise - mtPenaliteCieDevise);
      const commissionEnAriary = commissionEnDevise * taux;

      return {
        departId:      formData.departId,
        destinationId: formData.destinationId,
        numeroVol:     formData.numeroVol,
        avion:         formData.avion   || null,
        itineraire:    formData.itineraire || null,
        classe:        formData.classe,
        typePassager:  formData.typePassager,
        dateHeureDepart: formData.dateHeureDepart,
        dateHeureArrive: formData.dateHeureArrive || null,
        dureeVol:    formData.dureeVol    || null,
        dureeEscale: formData.dureeEscale || null,
        devise:      formData.devise,
        tauxEchange: taux,
        nombre,

        puBilletCompagnieDevise:   puBilletCieDevise,
        puServiceCompagnieDevise:  puServiceCieDevise,
        puPenaliteCompagnieDevise: puPenaliteCieDevise,

        montantBilletCompagnieDevise:   mtBilletCieDevise,
        montantServiceCompagnieDevise:  mtServiceCieDevise,
        montantPenaliteCompagnieDevise: mtPenaliteCieDevise,

        puBilletCompagnieAriary:   puBilletCieAriary,
        puServiceCompagnieAriary:  puServiceCieAriary,
        puPenaliteCompagnieAriary: puPenaliteCieAriary,

        montantBilletCompagnieAriary:   mtBilletCieAriary,
        montantServiceCompagnieAriary:  mtServiceCieAriary,
        montantPenaliteCompagnieAriary: mtPenaliteCieAriary,

        montantBilletClientDevise:   mtBilletClientDevise,
        montantServiceClientDevise:  mtServiceClientDevise,
        montantPenaliteClientDevise: mtPenaliteClientDevise,

        montantBilletClientAriary:   mtBilletClientAriary,
        montantServiceClientAriary:  mtServiceClientAriary,
        montantPenaliteClientAriary: mtPenaliteClientAriary,

        commissionEnDevise,
        commissionEnAriary,

        services: (formData.services || []).map((s: any) => ({
          serviceSpecifiqueId: s.serviceSpecifiqueId,
          valeur: s.valeur?.trim() || 'false',
        })),
      };
    };

    // Remplacer handleSaveFromModal
    const handleSaveFromModal = async (formData: any) => {
      if (!enteteId) return;
      const payload = {
        prospectionEnteteId: enteteId,
        ...buildPayload(formData),
      };
      await dispatch(createProspectionLigne(payload)).unwrap();
      dispatch(fetchProspectionLignes(enteteId));
    };

    // Remplacer handleSaveNewLine
    const handleSaveNewLine = async () => {
      if (!newLine || !enteteId) return;

      if (!newLine.departId || !newLine.destinationId) {
        alert('Veuillez sélectionner un aéroport de départ et une destination');
        return;
      }
      if (!newLine.numeroVol.trim() || !newLine.dateHeureDepart) {
        alert('Veuillez remplir : numéro vol et date de départ');
        return;
      }

      setNewLine((prev: any) => ({ ...prev, isSaving: true }));

      try {
        const payload = {
          prospectionEnteteId: enteteId,
          ...buildPayload({
            ...newLine,
            dateHeureDepart: new Date(newLine.dateHeureDepart).toISOString(),
            dateHeureArrive: newLine.dateHeureArrive ? new Date(newLine.dateHeureArrive).toISOString() : null,
            services: newLine.serviceValues,
          }),
        };

        await dispatch(createProspectionLigne(payload)).unwrap();
        dispatch(fetchProspectionLignes(enteteId));
        setNewLine(null);
      } catch (err: any) {
        alert('Erreur création : ' + (err?.message || 'voir console'));
        setNewLine((prev: any) => ({ ...prev, isSaving: false }));
      }
    };

    const handleSaveModal = async () => {
      if (!selectedEntete) return;
  
      if (modalCommission === selectedEntete.commissionAppliquer) {
        closeModal();
        return;
      }
  
      setIsSaving(true);
  
      try {
        await dispatch(
          updateProspectionEntete({
            id: selectedEntete.id,
            prestationId: selectedEntete.prestationId,
            fournisseurId: selectedEntete.fournisseurId,
            credit: selectedEntete.credit,
            typeVol: selectedEntete.typeVol,
            commissionPropose: selectedEntete.commissionPropose,
            commissionAppliquer: modalCommission,
          })
        ).unwrap();
  
        // Optionnel : toast de succès
        alert("Commission appliquée mise à jour avec succès");
        closeModal();
      } catch (err: any) {
        console.error(err);
        alert("Erreur lors de la sauvegarde : " + (err?.message || "Erreur inconnue"));
      } finally {
        setIsSaving(false);
      }
    };

    const handleCreateEntete = async () => {
      
      if (!entete?.prestationId) return;
      if (!newEntete.fournisseurId) {
        alert("Veuillez sélectionner un fournisseur");
        return;
      }
  
      setIsCreating(true);
  
      try {
        await dispatch(
          createProspectionEntete({
            prestationId: entete.prestationId,
            fournisseurId: newEntete.fournisseurId,
            credit: newEntete.credit,
            typeVol: newEntete.typeVol,
          })
        ).unwrap();
  
        alert("En-tête créé avec succès !");
        closeCreateModal();
        // La liste est déjà mise à jour via le slice (push optimiste)
      } catch (err: any) {
        console.error(err);
        alert("Erreur lors de la création : " + (err?.message || "Vérifiez la console"));
      } finally {
        setIsCreating(false);
      }
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

    const handleAddNewLine = () => {
      if (newLine) return;

      // Tout déplier quand NewLineRow s'affiche
      setCollapsedGroups({
        infosVol: false,
        tarifsCieDevise: false,
        tarifsCieAriary: false,
        tarifsClientDevise: false,
        tarifsClientAriary: false,
        commissions: false,
        services: false,
      });
      setShowPenalite(true);

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

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-[#F8FAFC]">

        <TicketingHeader items={prospectionDetailItems(enteteId)} />
        <header className="mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-row justify-between items-start mb-2">
              <div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
                    Prospection
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 leading-none">
                    {entete?.numeroEntete}
                  </h1>
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium uppercase">Prestation :</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {entete?.prestation?.numeroDos || entete?.prestationId || '—'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => openEditModal(entete)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 shadow-sm"
                title="Modifier cet en-tête"
              >
                {/* Optionnel : tu pourrais ajouter une icône SVG ici */}
                Modifier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div>
                <label className="text-xs uppercase text-slate-500 font-semibold">Fournisseur</label>
                <p className="font-medium mt-1">
                  {entete?.fournisseur?.libelle || entete?.fournisseurId || '—'}
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
                      <button
                        onClick={() => navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all font-medium"
                      >
                        <FiFileText size={16} />
                        Voir les devis
                      </button>

                      {/* Séparateur */}
                      <div className="w-px h-6 bg-gray-300 mx-1" />

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

                      {/* Séparateur */}
                      <div className="w-px h-6 bg-gray-300 mx-1" />

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

          {/* Barre de contrôle des groupes */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Groupes :</span>
            {[
              { key: 'infosVol', label: '✈️ Infos Vol', color: 'slate' },
              { key: 'tarifsCieDevise', label: '🏢 Cie Devise', color: 'emerald' },
              { key: 'tarifsCieAriary', label: '🏢 Cie Ariary', color: 'emerald' },
              { key: 'tarifsClientDevise', label: '👤 Client Devise', color: 'blue' },
              { key: 'tarifsClientAriary', label: '👤 Client Ariary', color: 'blue' },
              { key: 'commissions', label: '💰 Commissions', color: 'green' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleGroup(key as keyof typeof collapsedGroups)}
                disabled={!!newLine}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  newLine
                    ? 'opacity-40 cursor-not-allowed'
                    : collapsedGroups[key as keyof typeof collapsedGroups]
                      ? 'bg-white text-slate-400 border-slate-200 line-through'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
            {/* Bouton pénalités — s'applique à tous les groupes */}
            <div className="w-px h-4 bg-slate-300 mx-1" />
              <button
                onClick={() => setShowPenalite(p => !p)}
                disabled={!!newLine}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  newLine
                    ? 'opacity-40 cursor-not-allowed'
                    : showPenalite
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-white text-slate-400 border-slate-200 line-through'
                }`}
              >
                🚫 Pénalités
              </button>
              {/* Tout replier — désactivé si tout est déjà replié */}
              <button
                disabled={!!newLine || Object.values(collapsedGroups).every(v => v === true)}
                onClick={() => setCollapsedGroups({ infosVol: true, tarifsCieDevise: true, tarifsCieAriary: true, tarifsClientDevise: true, tarifsClientAriary: true, commissions: true, services: true })}
                className={`ml-auto text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  !!newLine || Object.values(collapsedGroups).every(v => v === true)
                    ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                Tout replier
              </button>

              {/* Tout déplier — désactivé si tout est déjà déplié */}
              <button
                disabled={!!newLine || Object.values(collapsedGroups).every(v => v === false)}
                onClick={() => setCollapsedGroups({ infosVol: false, tarifsCieDevise: false, tarifsCieAriary: false, tarifsClientDevise: false, tarifsClientAriary: false, commissions: false, services: false })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  !!newLine || Object.values(collapsedGroups).every(v => v === false)
                    ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                Tout déplier
              </button>
            </div>

          {loadingLignes ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 animate-pulse">
              Chargement des lignes...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  {/* Ligne 1 : en-têtes de groupes */}
                  <tr className="border-b-2 border-slate-300">
                    {selectionMode && <th rowSpan={2} className="px-4 py-2 w-12 bg-slate-100" />}

                    {/* Colonnes fixes */}
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[120px]">N° Dos Ref</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[100px]">Statut</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[80px]">Nb pax</th>

                    {/* Groupe : Infos Vol */}
                    <th
                      colSpan={collapsedGroups.infosVol ? 1 : 11}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-slate-700 border-x border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                      onClick={() => toggleGroup('infosVol')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        ✈️ Infos Vol
                        <span className="text-slate-300 text-xs">{collapsedGroups.infosVol ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Groupe : Devise + Taux (toujours visible) */}
                    <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-gray-600 border-x border-gray-400">
                      💱 Devise
                    </th>

                    {/* Groupe : Tarifs Cie Devise */}
                    <th
                      colSpan={collapsedGroups.tarifsCieDevise ? 1 : (showPenalite ? 6 : 4)}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                      onClick={() => toggleGroup('tarifsCieDevise')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        🏢 Tarifs Cie Devise
                        <span className="text-emerald-300 text-xs">{collapsedGroups.tarifsCieDevise ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Groupe : Tarifs Cie Ariary */}
                    <th
                      colSpan={collapsedGroups.tarifsCieAriary ? 1 : (showPenalite ? 6 : 4)}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-emerald-800 border-x border-emerald-600 cursor-pointer hover:bg-emerald-700 transition-colors select-none"
                      onClick={() => toggleGroup('tarifsCieAriary')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        🏢 Tarifs Cie Ariary
                        <span className="text-emerald-300 text-xs">{collapsedGroups.tarifsCieAriary ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Groupe : Tarifs Client Devise */}
                    <th
                      colSpan={collapsedGroups.tarifsClientDevise ? 1 : (showPenalite ? 3 : 2)}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-blue-700 border-x border-blue-500 cursor-pointer hover:bg-blue-600 transition-colors select-none"
                      onClick={() => toggleGroup('tarifsClientDevise')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        👤 Tarifs Client Devise
                        <span className="text-blue-300 text-xs">{collapsedGroups.tarifsClientDevise ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Groupe : Tarifs Client Ariary */}
                    <th
                      colSpan={collapsedGroups.tarifsClientAriary ? 1 : (showPenalite ? 3 : 2)}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-blue-800 border-x border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors select-none"
                      onClick={() => toggleGroup('tarifsClientAriary')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        👤 Tarifs Client Ariary
                        <span className="text-blue-300 text-xs">{collapsedGroups.tarifsClientAriary ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Groupe : Commissions */}
                    <th
                      colSpan={collapsedGroups.commissions ? 1 : 2}
                      className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-green-700 border-x border-green-500 cursor-pointer hover:bg-green-600 transition-colors select-none"
                      onClick={() => toggleGroup('commissions')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        💰 Commissions
                        <span className="text-green-300 text-xs">{collapsedGroups.commissions ? '▶' : '▼'}</span>
                      </div>
                    </th>

                    {/* Services + Actions */}
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[600px]">Services</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[100px]">Actions</th>
                  </tr>

                  {/* Ligne 2 : sous-en-têtes */}
                  <tr>
                    {/* Infos Vol */}
                    {!collapsedGroups.infosVol ? (
                      <>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">N° Vol</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">Avion</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[140px]">Départ</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[140px]">Destination</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[180px]">Itinéraire</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[100px]">Classe</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">Type pax</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[150px]">Date Départ Pays</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[150px]">Date Arrivée Pays</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[100px]">Durée vol</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[110px]">Durée escale</th>
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-slate-400 italic bg-slate-800/10">— replié —</th>
                    )}

                    {/* Devise + Taux */}
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-gray-100 min-w-[80px]">Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 bg-gray-100 min-w-[120px]">Taux</th>

                    {/* Tarifs Cie Devise */}
                    {!collapsedGroups.tarifsCieDevise ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Billet</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Service</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Pénalité</th>}
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Billet</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Service</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Pénalité</th>}
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-emerald-400 italic bg-emerald-50">— replié —</th>
                    )}

                    {/* Tarifs Cie Ariary */}
                    {!collapsedGroups.tarifsCieAriary ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Billet Ar</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Service Ar</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Pénalité Ar</th>}
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Billet Ar</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Service Ar</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Pénalité Ar</th>}
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-emerald-500 italic bg-emerald-100">— replié —</th>
                    )}

                    {/* Tarifs Client Devise */}
                    {!collapsedGroups.tarifsClientDevise ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Billet</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Service</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Pénalité</th>}
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-blue-400 italic bg-blue-50">— replié —</th>
                    )}

                    {/* Tarifs Client Ariary */}
                    {!collapsedGroups.tarifsClientAriary ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Billet Ar</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Service Ar</th>
                        {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Pénalité Ar</th>}
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-blue-500 italic bg-blue-100">— replié —</th>
                    )}

                    {/* Commissions */}
                    {!collapsedGroups.commissions ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50 min-w-[150px]">Devise</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50 min-w-[150px]">Ariary</th>
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-xs text-green-400 italic bg-green-50">— replié —</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Array.isArray(lignes) && lignes.length > 0 ? (
                    lignes.map((ligne) => (
                      <tr key={ligne.id} className="hover:bg-blue-50/30 transition-colors">
                        {selectionMode && (
                          <td className="px-4 py-4 text-center">
                            <input type="checkbox" checked={selectedLigneIds.includes(ligne.id)}
                              onChange={() => toggleLigneSelection(ligne.id)}
                              className="h-4 w-4 text-blue-600 border-slate-300 rounded" />
                          </td>
                        )}

                        {/* Colonnes fixes */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ligne.numeroDosRef || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 uppercase">
                          {ligne.status === 'CREER' ? 'créé' : ligne.status === 'MODIFIER' ? 'modifié' : ligne.status}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{ligne.nombre || '—'}</td>

                        {/* Infos Vol */}
                        {!collapsedGroups.infosVol ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{ligne.numeroVol || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.avion || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">-</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">-</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.itineraire || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                              <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{ligne.classe || '—'}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.typePassager || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                              {ligne.dateHeureDepart ? new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                              {ligne.dateHeureArrive ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeVol || '—'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeEscale || '—'}</td>
                        </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-slate-400 bg-slate-50 italic">
                            {ligne.numeroVol} · {ligne.itineraire}
                          </td>
                        )}

                        {/* Devise + Taux */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-600">{ligne.devise || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{ligne.tauxEchange?.toLocaleString('fr-FR') || '—'}</td>

                        {/* Tarifs Cie Devise */}
                        {!collapsedGroups.tarifsCieDevise ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                          </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-emerald-600 bg-emerald-50 font-semibold">
                            {ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                          </td>
                        )}

                        {/* Tarifs Cie Ariary */}
                        {!collapsedGroups.tarifsCieAriary ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>}
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>}
                          </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-emerald-700 bg-emerald-100 font-semibold">
                            {ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                          </td>
                        )}

                        {/* Tarifs Client Devise */}
                        {!collapsedGroups.tarifsClientDevise ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantServiceClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantPenaliteClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                          </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-blue-600 bg-blue-50 font-semibold">
                            {ligne.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                          </td>
                        )}

                        {/* Tarifs Client Ariary */}
                        {!collapsedGroups.tarifsClientAriary ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantBilletClientAriary?.toLocaleString('fr-FR') || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantServiceClientAriary?.toLocaleString('fr-FR') || '—'}</td>
                            {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantPenaliteClientAriary?.toLocaleString('fr-FR') || '—'}</td>}
                          </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-blue-700 bg-blue-100 font-semibold">
                            {ligne.montantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                          </td>
                        )}

                        {/* Commissions */}
                        {!collapsedGroups.commissions ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">{ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">{ligne.commissionEnAriary?.toLocaleString('fr-FR') || '—'}</td>
                          </>
                        ) : (
                          <td className="px-4 py-4 text-center text-xs text-green-700 bg-green-50 font-bold">
                            {ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                          </td>
                        )}

                        {/* Services */}
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-row gap-1 flex-wrap">
                            {ligne.serviceProspectionLigne?.length > 0 ? (
                              ligne.serviceProspectionLigne.map((service) => (
                                <span key={service.id}
                                  className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                                  title={`${service.serviceSpecifique?.libelle} = ${service.valeur}`}
                                >
                                  {service.serviceSpecifique?.libelle?.slice(0, 6) || '?'}: {service.valeur}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-xs">Aucun</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-400">—</td>
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
                      commissionPct={entete?.commissionAppliquer || 0}
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
      <ProspectionModals
        selectedEntete={selectedEntete}
        modalCommission={modalCommission}
        setModalCommission={setModalCommission}
        isSaving={isSaving}
        onCloseEdit={closeModal}
        onSaveEdit={handleSaveModal}
        showCreateModal={showCreateModal}
        newEntete={newEntete}
        setNewEntete={setNewEntete}
        isCreating={isCreating}
        fournisseurs={fournisseurs}
        fournisseursLoading={fournisseursLoading}
        onCloseCreate={closeCreateModal}
        onConfirmCreate={handleCreateEntete}
      />
    </TabContainer>
  );
}

