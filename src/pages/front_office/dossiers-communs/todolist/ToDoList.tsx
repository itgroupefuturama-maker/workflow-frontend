import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   FiCheckCircle, FiCalendar, FiArrowLeft, FiSearch, FiGrid, FiList, FiArrowRight, FiX
} from 'react-icons/fi';
import { fetchTodos, markAsDone, updateTodo } from '../../../../app/front_office/todosSlice';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../app/store';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ToDoList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: todos, loading: loadingTodos } = useSelector((state: RootState) => state.todos);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ objet: '', moment: '' });

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const activeTodos = todos.filter(todo => todo.rappel?.status !== 'SUPPRIMER');

  // const startEdit = (todo: any) => {
  //   setEditingId(todo.rappel?.id || null);
  //   setEditForm({
  //     objet: todo.rappel?.objet || '',
  //     moment: todo.rappel?.moment ? new Date(todo.rappel.moment).toISOString().slice(0, 16) : '',
  //   });
  // };

  const handleSaveEdit = (rappelId: string) => {
    if (!editForm.objet || !editForm.moment) return;
    dispatch(updateTodo({ rappelId, objet: editForm.objet, moment: new Date(editForm.moment).toISOString() }))
      .then(() => setEditingId(null));
  };

  if (loadingTodos) return <div className="h-screen flex items-center justify-center bg-[#f0f4f3] text-[#7ebda2] font-medium">Chargement...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* HEADER ÉPURÉ */}
      <header className="fixed top-5 left-0 right-0 bg-white border-b border-slate-200 px-8 pt-20 pb-2 z-30 ">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
          {/* Navigation gauche */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
              title="Retour"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Planning des Rappels</h1>
          </div>

          {/* Barre de recherche centrale */}
          <div className="flex-1 max-w-xl relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une tâche ou un ID..." 
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button className="p-2 bg-white shadow-sm rounded-md text-slate-800"><FiGrid size={18}/></button>
              <button className="p-2 text-slate-500 hover:text-slate-800 transition-colors"><FiList size={18}/></button>
            </div>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all">
              <FiCalendar size={16} />
              <span>Calendrier</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden flex flex-col p-8 mt-15">
        <div className="max-w-[1600px] w-full mx-auto flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
            {activeTodos.map((todo) => {
              const isEditing = editingId === todo.rappel?.id;
              const isFinished = todo.rappel?.status === 'FAIT';
              const dateObj = new Date(todo.rappel?.moment);

              return (
                <div 
                  key={todo.id} 
                  className={`group bg-white border border-slate-200 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-slate-300 flex flex-col relative ${isFinished ? 'bg-slate-50/50 opacity-80' : ''}`}
                >
                  {/* Indicateur de statut subtil */}
                  {!isFinished && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500 rounded-b-full shadow-sm shadow-indigo-200" />}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Date & Badge Temps */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-bold text-slate-800 capitalize">
                          {dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })}
                        </span>
                      </div>
                      <div className="bg-slate-900 text-white px-2 py-1 rounded-md text-[10px] font-black">
                        {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <input 
                          value={editForm.objet} 
                          onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })} 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                        <input 
                          type="datetime-local" 
                          value={editForm.moment} 
                          onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })} 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(todo.rappel.id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                            Sauvegarder
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className={`text-base font-bold leading-snug mb-4 ${isFinished ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {todo.rappel?.objet}
                        </h4>

                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">
                            ID: {todo.prestationId?.substring(0,8)}
                          </span>
                        </div>

                        {/* Footer Actions */}
                        {/* Actions Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {!isFinished && (
                              <button 
                                onClick={() => dispatch(markAsDone(todo.rappel.id))}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" 
                                title="Terminer"
                              >
                                <FiCheckCircle size={18} />
                              </button>
                            )}
                            
                            {/* <button 
                              onClick={() => startEdit(todo)} 
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Modifier"
                            >
                              <FiEdit3 size={16} />
                            </button> */}

                            {/* BOUTON DÉSACTIVER (Ajouté ici) */}
                            {/* {todo.status === 'ACTIF' && (
                              <button 
                                onClick={() => { if(window.confirm('Désactiver ce rappel ?')) dispatch(deactivateTodo(todo.rappel.id)) }}
                                className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
                                title="Désactiver"
                              >
                                <FiSlash size={16} />
                              </button>
                            )} */}

                            {/* <button
                              onClick={() => { if(window.confirm('Supprimer définitivement ?')) dispatch(deleteTodo(todo.rappel.id)) }}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 size={16} />
                            </button> */}
                          </div>

                          <button 
                            onClick={() => navigate(`/dossiers-communs/${todo.prestationId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                          >
                            DOSSIER <FiArrowRight size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* FAB - NOUVEAU RAPPEL */}
      {/* <button className="fixed bottom-8 right-8 group flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all active:scale-95 z-50">
        <FiPlus size={20} strokeWidth={3} />
        <span className="text-sm font-bold tracking-wide">NOUVEAU RAPPEL</span>
      </button> */}
    </div>
  );
}