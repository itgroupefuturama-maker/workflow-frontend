import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodos } from '../../../../app/front_office/todosSlice';
import { Outlet, useNavigate } from 'react-router-dom';
import type {AppDispatch, RootState } from '../../../../app/store';
import { fetchProspectionEntetes, updateProspectionEntete, createProspectionEntete } from '../../../../app/front_office/prospectionsEntetesSlice';
import type { ProspectionEntete } from '../../../../app/front_office/prospectionsEntetesSlice';
import { fetchFournisseurs } from '../../../../app/back_office/fournisseursSlice';
import ProspectionModals from '../../../../components/modals/ProspectionModals';
import Sidebar from '../../../../layouts/Sidebar';
import { FiArrowLeft } from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

const HomePageTicketing = () => {

  const navigate = useNavigate();
  const { data: fournisseurs, loading: fournisseursLoading } = useSelector(
    (state: RootState) => state.fournisseurs
  );

  const dispatch = useAppDispatch();
  
  const [selectedEntete, setSelectedEntete] = useState<ProspectionEntete | null>(null);
  const [modalCommission, setModalCommission] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEntete, setNewEntete] = useState({
    fournisseurId: '',
    credit: 'CREDIT_15',     // valeur par défaut
    typeVol: 'LONG_COURRIER', // valeur par défaut
  });

  const [isCreating, setIsCreating] = useState(false);

  const {
    items: entetes,
    loading: loadingEntetes,
    error: errorEntetes,
  } = useSelector((state: RootState) => state.prospectionsEntetes);

  // On récupère le dossier actif de Redux au lieu de l'URL
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  // On extrait l'id de la prestation ticketing
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "ticketing")
    ?.prestation?.[0]?.id || '';

  // Ajoute dans le useEffect existant :
  useEffect(() => {
    if (!prestationId) return; // ← on attend que prestationId soit défini
    dispatch(fetchFournisseurs());
    dispatch(fetchTodos());
    dispatch(fetchProspectionEntetes(prestationId));
  }, [prestationId, dispatch]);

  const openEditModal = (entete: ProspectionEntete) => {
    setSelectedEntete(entete);
    setModalCommission(entete.commissionAppliquer);
  };

  const closeModal = () => {
    setSelectedEntete(null);
    setModalCommission(0);
    setIsSaving(false);
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

  const openCreateModal = () => {
    setShowCreateModal(true);
    console.log("click 1");
    
    // reset formulaire
    setNewEntete({
      fournisseurId: '',
      credit: 'CREDIT_15',
      typeVol: 'LONG_COURRIER',
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setIsCreating(false);
  };

  const handleCreateEntete = async () => {
    console.log("click 2");
    console.log("prestationId", prestationId);
    console.log("newEntete", newEntete);
    
    if (!prestationId) return;
    if (!newEntete.fournisseurId) {
      alert("Veuillez sélectionner un fournisseur");
      return;
    }

    setIsCreating(true);

    try {
      await dispatch(
        createProspectionEntete({
          prestationId,
          fournisseurId: newEntete.fournisseurId,
          credit: newEntete.credit,
          typeVol: newEntete.typeVol,
        })
      ).unwrap();

      alert("Entête créé avec succès !");
      closeCreateModal();
      // La liste est déjà mise à jour via le slice (push optimiste)
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la création : " + (err?.message || "Vérifiez la console"));
    } finally {
      setIsCreating(false);
    }
  };

  const contextValue = {
    prestationId,
    entetes,
    loadingEntetes,
    errorEntetes,
    openCreateModal, // Votre fonction pour ouvrir la modale
    openEditModal,   // Votre fonction pour éditer
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="ticketing"/>

      {/* Le contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header fixe en haut du contenu */}
        {/* <div className="p-5 border-b border-slate-100 bg-white shrink-0">
          <header className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Retour à la page d'accueil</span>
            </button>
          </header>
        </div> */}

        {/* Zone de contenu scrollable indépendamment de la sidebar */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className=" mx-auto w-full">

            {/* Système de routage interne */}
            <Outlet context={contextValue} />

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
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageTicketing;