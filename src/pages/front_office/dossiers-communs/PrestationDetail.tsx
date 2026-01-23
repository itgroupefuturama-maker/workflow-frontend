import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCheckCircle, FiPlus, FiX, FiClock, FiCalendar, FiEdit3, FiTrash2, FiChevronDown, FiArrowLeft,FiLayout, FiMaximize2,
  FiActivity,
  FiSettings,
  FiBarChart2
} from 'react-icons/fi';
import { fetchTodos, createTodo, markAsDone, updateTodo, deactivateTodo,deleteTodo } from '../../../app/front_office/todosSlice';
import { useNavigate, useParams } from 'react-router-dom';
import type {AppDispatch, RootState } from '../../../app/store';
import { fetchProspectionEntetes, updateProspectionEntete, createProspectionEntete } from '../../../app/front_office/prospectionsEntetesSlice';
import type { ProspectionEntete } from '../../../app/front_office/prospectionsEntetesSlice';
import { fetchFournisseurs } from '../../../app/back_office/fournisseursSlice';

interface PrestationDetailProps {
  prestationId?: string;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function PrestationDetail({ prestationId: propPrestationId }: PrestationDetailProps) {
  const { prestationId: paramPrestationId } = useParams<{
    id: string;           // ID du dossier-commun
    prestationId: string; // ID de la prestation
  }>();
  
  const { data: fournisseurs, loading: fournisseursLoading } = useSelector(
    (state: RootState) => state.fournisseurs
  );

  // Utilise soit la prop, soit le paramètre d'URL (selon comment tu appelles le composant)
  const prestationId = propPrestationId || paramPrestationId || '';

  const navigate = useNavigate();
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

  const [isCollapsed, setIsCollapsed] = useState(true);

  const [isFloating, setIsFloating] = useState(false); // false = ancré, true = flottant (dessus)

  const {
    items: entetes,
    loading: loadingEntetes,
    error: errorEntetes,
  } = useSelector((state: RootState) => state.prospectionsEntetes);

  // Ajoute dans le useEffect existant :
  useEffect(() => {
    dispatch(fetchFournisseurs());
    if (!prestationId) return;
    dispatch(fetchTodos());
    dispatch(fetchProspectionEntetes(prestationId));   // ← nouveau
  }, [prestationId, dispatch]);

  const {
    loading: loadingDevis,
  } = useSelector((state: RootState) => state.devisPrestation);

  const {
    items: todos,
    loading: loadingTodos,
    // error: errorTodos,
  } = useSelector((state: RootState) => state.todos);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({ objet: '', moment: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ objet: '', moment: '' });

  useEffect(() => {
    if (!prestationId) return;
    dispatch(fetchTodos());
  }, [prestationId, dispatch]);

  // Filtrer les todos pour cette prestation uniquement
  const filteredTodos = todos.filter((t: any) => t.prestationId === prestationId);

  const activeTodos = filteredTodos.filter(todo => todo.rappel?.status !== 'SUPPRIMER');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.objet || !newTodo.moment) return;

    dispatch(
      createTodo({
        prestationId: prestationId,
        objet: newTodo.objet,
        moment: new Date(newTodo.moment).toISOString(),
      })
    );

    setNewTodo({ objet: '', moment: '' });
    setShowAddTodo(false);
  };

  // Fonctions placeholder pour update/delete/toggle (à compléter avec thunks)
  const handleToggleDone = (rappelId: string) => {
    dispatch(markAsDone(rappelId));
  };

  // 2. Modifier (sauvegarder)
  const handleSaveEdit = (rappelId: string) => {
    if (!editForm.objet || !editForm.moment) return;

    dispatch(
      updateTodo({
        rappelId,
        objet: editForm.objet,
        moment: new Date(editForm.moment).toISOString(),
      })
    ).then(() => {
      setEditingId(null);
      setEditForm({ objet: '', moment: '' });
    });
  };

  // 3. Désactiver
  const handleDeactivate = (rappelId: string) => {
    if (!window.confirm('Désactiver ce rappel ?')) return;
    dispatch(deactivateTodo(rappelId));
  };

  // 4. Supprimer (déjà presque ok)
  const handleDelete = (rappelId: string) => {
    if (!window.confirm('Supprimer définitivement ce rappel ?')) return;
    dispatch(deleteTodo(rappelId));
  };

  const startEdit = (todo: any) => {
    setEditingId(todo.rappel?.id || null);
    setEditForm({
      objet: todo.rappel?.objet || '',
      moment: todo.rappel?.moment ? new Date(todo.rappel.moment).toISOString().slice(0, 16) : '',
    });
  };

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

  const isLoading = loadingDevis || loadingTodos;

  if (isLoading) {
    return <div className="p-20 text-center animate-pulse text-slate-400">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 mx-auto">
      {/* HEADER : Épuré */}
        <header className="flex justify-between items-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <FiArrowLeft size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
          </button>
        </header>

        {/* --- POST-IT FLOTTANT (RAPPELS) --- */}
        <aside
          className={`fixed top-20 right-6 z-40 flex flex-col bg-yellow-50 border-l-4 border-yellow-400 shadow-2xl rounded-r-xl transition-all duration-300 ${
            isCollapsed ? "w-14 h-14" : "w-80 max-h-[80vh]"
          } ${isFloating ? "z-50" : "z-40"}`}
        >
          <div className={`p-3 bg-yellow-100/50 border-b border-yellow-200 flex items-center ${isCollapsed ? "justify-center h-full" : "justify-between"}`}>
            
            {!isCollapsed && (
              <h2 className="text-[10px] font-black uppercase tracking-tighter text-yellow-800">
                Rappels ({activeTodos.length})
              </h2>
            )}

            <div className={`flex gap-1 ${isCollapsed ? "flex-col" : "flex-row"}`}>
              
              {!isCollapsed && (
                <>
                  {/* BOUTON ANCRAGE / FLOTTANT (Le nouveau bouton) */}
                  <button
                    onClick={() => setIsFloating(!isFloating)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFloating ? "bg-indigo-100 text-indigo-600" : "bg-yellow-200 text-yellow-700 hover:bg-yellow-300"
                    }`}
                    title={isFloating ? "Ancrer au contenu" : "Rendre flottant (plein écran)"}
                  >
                    {isFloating ? <FiLayout size={14} /> : <FiMaximize2 size={14} />}
                  </button>

                  {/* Bouton Ajouter */}
                  <button
                    onClick={() => setShowAddTodo(!showAddTodo)}
                    className="p-1.5 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 shadow-sm"
                  >
                    {showAddTodo ? <FiX size={14} /> : <FiPlus size={14} />}
                  </button>
                </>
              )}

              {/* BOUTON RÉDUIRE */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 bg-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-300"
              >
                {isCollapsed ? <FiChevronDown className="rotate-90" size={18} /> : <FiChevronDown className="-rotate-90" size={18} />}
              </button>
            </div>
          </div>

          {/* --- CONTENU (Masqué si réduit) --- */}
          {!isCollapsed && (
            <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Zone de création rapide */}
              {showAddTodo && (
                <form
                  onSubmit={handleCreate}
                  className="p-4 bg-white border-b border-yellow-100 space-y-3 animate-in zoom-in-95 duration-200"
                >
                  <input
                    type="text"
                    placeholder="Objet..."
                    value={newTodo.objet}
                    onChange={(e) => setNewTodo({ ...newTodo, objet: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    required
                  />
                  <input
                    type="datetime-local"
                    value={newTodo.moment}
                    onChange={(e) => setNewTodo({ ...newTodo, moment: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg hover:bg-yellow-500 uppercase shadow-sm"
                  >
                    Ajouter
                  </button>
                </form>
              )}

              {/* Liste Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-yellow-50/30 custom-scrollbar max-h-[60vh]">
                {activeTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-yellow-600/50">
                    <FiClock size={24} className="mb-2 opacity-20" />
                    <p className="text-[10px] italic">Aucun rappel en attente</p>
                  </div>
                ) : (
                  activeTodos.map((todo) => {
                    const isEditing = editingId === todo.rappel?.id;
                    const isFinished = todo.rappel?.status === "FAIT";
                    const isActive = todo.status === "ACTIF";

                    return (
                      <div
                        key={todo.id}
                        className="p-3 bg-white rounded-lg shadow-sm border border-yellow-100 transition-all hover:border-yellow-300"
                      >
                        {isEditing ? (
                          /* MODE ÉDITION */
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                Objet
                              </label>
                              <input
                                value={editForm.objet}
                                onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                Échéance
                              </label>
                              <input
                                type="datetime-local"
                                value={editForm.moment}
                                onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSaveEdit(todo.rappel.id)}
                                className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-200"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MODE AFFICHAGE */
                          <>
                            <div className="flex justify-between items-start mb-1">
                              <h4
                                className={`text-xs font-bold leading-tight ${
                                  isFinished ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {todo.rappel?.objet}
                              </h4>
                              <button
                                onClick={() => handleDelete(todo.rappel.id)}
                                className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isFinished ? "bg-slate-100 text-slate-500" : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {new Date(todo.rappel?.moment).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {!isActive && (
                                <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase tracking-tighter">
                                  Désactivé
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                              <div className="flex gap-1.5">
                                {!isFinished && (
                                  <button
                                    onClick={() => handleToggleDone(todo.rappel.id)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors shadow-sm"
                                    title="Terminer"
                                  >
                                    <FiCheckCircle size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(todo)}
                                  className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors shadow-sm"
                                  title="Modifier"
                                >
                                  <FiEdit3 size={13} />
                                </button>
                              </div>

                              {isActive && (
                                <button
                                  onClick={() => handleDeactivate(todo.rappel.id)}
                                  className="text-[9px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-tighter transition-colors"
                                >
                                  Désactiver
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </aside>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto p-4">
          {/* Carte Tableau de Bord */}
          <div
            onClick={() => navigate(`/dossiers-communs/ticketing/parametres`)}
            className="group cursor-pointer bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <FiBarChart2 size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Tableau de Bord</h3>
              <p className="text-sm text-slate-500 mt-2">Visualisez vos statistiques et performances en temps réel.</p>
            </div>
          </div>

          {/* Carte Etat */}
          <div 
            className="group cursor-pointer bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <FiActivity size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Etat</h3>
              <p className="text-sm text-slate-500 mt-2">Consultez le statut actuel de vos tickets et interventions.</p>
            </div>
          </div>

          {/* Carte Paramètres */}
          <div 
            onClick={() => navigate(`/dossiers-communs/ticketing/parametres`)}
            className="group cursor-pointer bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <FiSettings size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Paramètres</h3>
              <p className="text-sm text-slate-500 mt-2">Configurez vos préférences et les options du système.</p>
            </div>
          </div>
        </div>

        {/* Liste des en tete prospection*/}
        <main className={`transition-all duration-300 ${
            isFloating || isCollapsed ? "mr-10" : "lg:mr-80"
          }`}>
          <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FiCalendar className="text-indigo-600" />
                Entêtes de prospection
              </h2>

              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]"
                disabled={!prestationId || fournisseursLoading}
              >
                <FiPlus size={18} />
                Ajouter un entête
              </button>
            </div>

            {loadingEntetes ? (
              <div className="text-center py-12 text-slate-400 animate-pulse">
                Chargement des entêtes...
              </div>
            ) : errorEntetes ? (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl">
                {errorEntetes}
              </div>
            ) : entetes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FiClock size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun entête de prospection pour cette prestation</p>
                <p className="text-sm mt-2">Créez-en un pour commencer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        N° Entête
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Type Vol
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Fournisseur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Crédit
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Comm. Proposée
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Comm. Appliquée
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {entetes.map((entete) => {
                      // const isEditing = editingEnteteId === entete.id;

                      return (
                        <tr
                          key={entete.id}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {entete.numeroEntete}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {entete.typeVol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {entete.fournisseur?.libelle || entete.fournisseurId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {entete.credit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {entete.commissionPropose} %
                          </td>

                          {/* Colonne éditable */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span>{entete.commissionAppliquer} %</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              onClick={() => openEditModal(entete)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Modifier cet entête"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() => navigate(`/prestations/${prestationId}/prospection/${entete.id}`)}
                              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Voir les lignes de prospection"
                            >
                              Naviguer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {selectedEntete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header modal */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">
                  Modifier l'entête de prospection
                </h3>
                <button
                  onClick={closeModal}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      N° Entête
                    </label>
                    <p className="text-slate-900 font-medium">{selectedEntete.numeroEntete}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type de vol
                    </label>
                    <p className="text-slate-900">{selectedEntete.typeVol}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fournisseur
                    </label>
                    <p className="text-slate-900">{selectedEntete.fournisseur?.libelle || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Crédit
                    </label>
                    <p className="text-slate-900">{selectedEntete.credit}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Commission proposée
                    </label>
                    <p className="text-slate-900">{selectedEntete.commissionPropose} %</p>
                  </div>

                  {/* Champ modifiable */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Commission appliquée *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={modalCommission}
                      onChange={(e) => setModalCommission(Number(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Pied modal */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    onClick={closeModal}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveModal}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Sauvegarde...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                Nouvel entête de prospection
              </h3>
              <button
                onClick={closeCreateModal}
                className="text-slate-500 hover:text-slate-800"
                disabled={isCreating}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* Prestation (info seulement) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ajouter une nouvelle entête pour un autre prospection
                </label>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 required">
                  Fournisseur *
                </label>
                {fournisseursLoading ? (
                  <p className="text-slate-500">Chargement des fournisseurs...</p>
                ) : (
                  <select
                    value={newEntete.fournisseurId}
                    onChange={(e) =>
                      setNewEntete({ ...newEntete, fournisseurId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={isCreating}
                  >
                    <option value="">— Choisir un fournisseur —</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} — {f.libelle}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Crédit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Crédit
                </label>
                <select
                  value={newEntete.credit}
                  onChange={(e) =>
                    setNewEntete({ ...newEntete, credit: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isCreating}
                >
                  <option value="CREDIT_0">CREDIT_0</option>
                  <option value="CREDIT_15">CREDIT_15</option>
                  <option value="CREDIT_30">CREDIT_30</option>
                  <option value="CREDIT_60">CREDIT_60</option>
                  <option value="CREDIT_90">CREDIT_90</option>
                </select>
              </div>

              {/* Type Vol (simple pour l'instant) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type de vol
                </label>
                <select
                  value={newEntete.typeVol}
                  onChange={(e) =>
                    setNewEntete({ ...newEntete, typeVol: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isCreating}
                >
                  <option value="NATIONAL">Nationale</option>
                  <option value="LONG_COURRIER">Long courrier</option>
                  <option value="REGIONAL">Regionale</option>
                  {/* Ajoute d'autres options si besoin */}
                </select>
              </div>

              {/* Pied */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateEntete}
                  disabled={isCreating || !newEntete.fournisseurId}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}