import { useState } from 'react';
import { 
  FiChevronDown, FiLayout, FiMaximize2, FiPlus, FiX, 
  FiClock, FiTrash2, FiCheckCircle, FiEdit3 
} from 'react-icons/fi';

// Types (à adapter selon tes besoins)
interface RappelsPostItProps {
  todos: any[];
  onAdd: (objet: string, moment: string) => void;
  onToggleDone: (id: string) => void;
  onSaveEdit: (id: string, objet: string, moment: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RappelsPostIt({ 
  todos, onAdd, onToggleDone, onSaveEdit, onDeactivate, onDelete 
}: RappelsPostItProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({ objet: '', moment: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ objet: '', moment: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newTodo.objet, newTodo.moment);
    setNewTodo({ objet: '', moment: '' });
    setShowAddTodo(false);
  };

  const startEdit = (todo: any) => {
    setEditingId(todo.rappel?.id || null);
    setEditForm({
      objet: todo.rappel?.objet || '',
      moment: todo.rappel?.moment ? new Date(todo.rappel.moment).toISOString().slice(0, 16) : '',
    });
  };

  return (
  <aside 
    className={`fixed top-21 right-6 z-40 flex flex-col bg-white border border-slate-200 transition-all ease-in-out overflow-hidden ${
      isCollapsed 
        ? "w-14 h-14 rounded-2xl" // État Cercle
        : "w-80 max-h-[85vh] rounded-2xl" // État Panel (on évite le rounded-full ici)
    } ${isFloating ? "z-50 ring-2 ring-indigo-500/20" : "z-40"}`}
  >
    
    {/* --- HEADER --- */}
    {/* On force une hauteur fixe pour le header en mode réduit pour centrer l'icône */}
    <div className={`flex items-center transition-all duration-500 ${
      isCollapsed ? "justify-center h-14" : "justify-between p-4 "
    }`}>
      
      {!isCollapsed ? (
        <>
          <div className="flex items-center gap-2 animate-in fade-in">
            <div className="w-2 h-2 bg-indigo-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
              Rappels <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px]">{todos.length}</span>
            </h2>
          </div>
          
          <div className="flex gap-1.5">
            <button 
              onClick={() => setIsFloating(!isFloating)} 
              className={`p-2 rounded-lg transition-colors ${isFloating ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <FiLayout size={14} />
            </button>
            <button 
              onClick={() => setShowAddTodo(!showAddTodo)} 
              className={`p-2 rounded-lg transition-all ${showAddTodo ? "bg-red-50 text-red-500" : "bg-slate-900 text-white"}`}
            >
              {showAddTodo ? <FiX size={14} /> : <FiPlus size={14} />}
            </button>
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
            >
              <FiChevronDown size={18} />
            </button>
          </div>
        </>
      ) : (
        /* Icône quand réduit : on l'entoure d'un bouton qui prend toute la place du cercle */
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-full h-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <FiClock size={22} />
        </button>
      )}
    </div>

    {/* --- CONTENU --- */}
    {!isCollapsed && (
      <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* FORMULAIRE D'AJOUT */}
        {showAddTodo && (
          <form onSubmit={handleCreate} className="p-4 bg-slate-50/50 border-b border-slate-100 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tâche</label>
              <input 
                type="text" 
                placeholder="Ex: Relancer le client..." 
                value={newTodo.objet} 
                onChange={(e) => setNewTodo({ ...newTodo, objet: e.target.value })} 
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Échéance</label>
              <input 
                type="datetime-local" 
                value={newTodo.moment} 
                onChange={(e) => setNewTodo({ ...newTodo, moment: e.target.value })} 
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600" 
                required 
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all uppercase tracking-wide">
              Confirmer
            </button>
          </form>
        )}

        {/* LISTE DES TODOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <div className="p-3 bg-slate-50 rounded-full mb-3">
                <FiClock size={24} />
              </div>
              <p className="text-[11px] font-medium italic">Aucun rappel pour le moment</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="group p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                {editingId === todo.rappel?.id ? (
                   <div className="space-y-3">
                      <input value={editForm.objet} onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })} className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
                      <input type="datetime-local" value={editForm.moment} onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })} className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
                      <div className="flex gap-2 text-white">
                        <button onClick={() => { onSaveEdit(todo.rappel.id, editForm.objet, editForm.moment); setEditingId(null); }} className="flex-1 bg-slate-900 text-[10px] py-2 rounded-lg font-bold">ENREGISTRER</button>
                        <button onClick={() => setEditingId(null)} className="px-3 bg-slate-100 text-slate-500 text-[10px] py-2 rounded-lg font-bold">ANNULER</button>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold truncate transition-all ${todo.rappel?.status === "FAIT" ? "line-through text-slate-300" : "text-slate-700 group-hover:text-indigo-600"}`}>
                          {todo.rappel?.objet}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-tighter">
                          📅 {new Date(todo.rappel?.moment).toLocaleString()}
                        </p>
                      </div>
                      <button onClick={() => onDelete(todo.rappel.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                      <button 
                        onClick={() => onToggleDone(todo.rappel.id)} 
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          todo.rappel?.status === "FAIT" ? "bg-slate-50 text-slate-400" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        <FiCheckCircle size={13} /> {todo.rappel?.status === "FAIT" ? "TERMINÉ" : "FAIT"}
                      </button>
                      
                      <button onClick={() => startEdit(todo)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-all">
                        <FiEdit3 size={13} />
                      </button>

                      {todo.status === "ACTIF" && (
                        <button 
                          onClick={() => onDeactivate(todo.rappel.id)} 
                          className="ml-auto text-[9px] font-black text-slate-400 hover:text-orange-500 uppercase tracking-tighter transition-colors"
                        >
                          Désactiver
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </aside>
);
}