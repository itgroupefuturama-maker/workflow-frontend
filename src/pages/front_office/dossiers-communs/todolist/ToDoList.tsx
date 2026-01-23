import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   FiCheckCircle, FiPlus, FiX, FiClock, FiCalendar, FiEdit3, FiTrash2, FiArrowLeft
} from 'react-icons/fi';
import { fetchTodos, createTodo, markAsDone, updateTodo, deactivateTodo,deleteTodo } from '../../../../app/front_office/todosSlice';
import { useNavigate } from 'react-router-dom';
import type {AppDispatch, RootState } from '../../../../app/store';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ToDoList() {


  // Utilise soit la prop, soit le paramètre d'URL (selon comment tu appelles le composant)
  const prestationId = '';

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
    dispatch(fetchTodos());
  }, [prestationId, dispatch]);

  // Filtrer les todos pour cette prestation uniquement
//   const filteredTodos = todos.filter((t: any) => t.prestationId === prestationId);

  const activeTodos = todos.filter(todo => todo.rappel?.status !== 'SUPPRIMER' );

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

  if (loadingTodos) {
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

      <div className="bg-white p-6 md:p-8 min-h-[500px] flex flex-col rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FiCheckCircle className="text-indigo-600" /> Module To Do List
          </h2>
          <button
            onClick={() => setShowAddTodo(!showAddTodo)}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-transform active:scale-95"
          >
            {showAddTodo ? <FiX size={20} /> : <FiPlus size={20} />}
          </button>
        </div>

        {showAddTodo && (
          <form
            onSubmit={handleCreate}
            className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm">
                <FiPlus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nouveau rappel</h3>
                <p className="text-xs text-slate-500">Planifiez une action pour cette prestation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  <FiEdit3 size={14} /> Objet du rappel
                </label>
                <input
                  type="text"
                  placeholder="Ex: Relancer le client..."
                  value={newTodo.objet}
                  onChange={(e) => setNewTodo({ ...newTodo, objet: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  <FiCalendar size={14} /> Échéance
                </label>
                <input
                  type="datetime-local"
                  value={newTodo.moment}
                  onChange={(e) => setNewTodo({ ...newTodo, moment: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              Créer le rappel
            </button>
          </form>
        )}

        {/* GRILLE ADAPTATIVE : 1 col (mobile), 2 cols (tablette), 4 cols (desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto p-1">
          {activeTodos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FiClock size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Aucune tâche</p>
            </div>
          ) : (
            activeTodos.map((todo) => {
              const isEditing = editingId === todo.rappel?.id;
              const isFinished = todo.rappel?.status === 'FAIT';
              const isActive = todo.status === 'ACTIF';

              return (
                <div
                  key={todo.id}
                  className={`group flex flex-col h-full transition-all duration-200 rounded-2xl border ${
                    isFinished 
                      ? 'bg-slate-50/50 border-slate-200 opacity-75' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1'
                  }`}
                >
                  {isEditing ? (
                    <div className="p-4 space-y-3 h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <input 
                          value={editForm.objet} 
                          onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })} 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                        <input 
                          type="datetime-local" 
                          value={editForm.moment} 
                          onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })} 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleSaveEdit(todo.rappel.id)} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">Valider</button>
                        <button onClick={() => setEditingId(null)} className="w-full py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 flex flex-col h-full"
                    onClick={() => navigate(`/prestations/${todo.prestationId}`)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${isFinished ? 'bg-slate-200' : 'bg-indigo-50 text-indigo-600'}`}>
                          <FiCalendar size={18} />
                        </div>
                        <button
                          onClick={() => handleDelete(todo.rappel.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      <div className="flex-1">
                        <h4 className={`font-bold text-base mb-1 line-clamp-2 ${isFinished ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {todo.rappel?.objet}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(todo.rappel?.moment).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                        {!isFinished && (
                          <button
                            onClick={() => handleToggleDone(todo.rappel.id)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold rounded-lg transition-all"
                          >
                            <FiCheckCircle size={14} /> Terminer
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => startEdit(todo)}
                            className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg transition-colors"
                          >
                            Modifier
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleDeactivate(todo.rappel.id)}
                              className="py-2 text-orange-600 hover:bg-orange-50 text-[10px] font-bold uppercase rounded-lg transition-colors"
                            >
                              Désactiver
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}