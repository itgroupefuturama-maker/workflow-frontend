import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { 
  Bell, Calendar, Clock, MoreHorizontal, CheckCircle2, 
  Trash2, Edit3, AlertCircle, ExternalLink, X, Check 
} from 'lucide-react';
import {
  createTodo,
  deactivateTodo,
  deleteTodo,
  fetchTodosByPrestation,
  markAsDone,
  updateTodo,
} from '../../../../app/front_office/todosSlice';

const RappelsTable: React.FC<{ prestationId: string }> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: todos } = useSelector((state: RootState) => state.todos);
  const { data: user } = useSelector((state: RootState) => state.user);
  const googleAccount = user?.googleAccount[0] ?? null;

  // États pour la création
  const [newObjet, setNewObjet] = useState('');
  const [newMoment, setNewMoment] = useState('');
  const [todoType, setTodoType] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  // États pour l'édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editObjet, setEditObjet] = useState('');
  const [editMoment, setEditMoment] = useState('');

  useEffect(() => {
    if (prestationId) dispatch(fetchTodosByPrestation(prestationId));
  }, [dispatch, prestationId]);

  // --- HANDLERS ---
  const handleCreate = async () => {
    if (!newObjet.trim() || !newMoment.trim()) return;
    const momentToSend = new Date(newMoment).toISOString();
    await dispatch(createTodo({ 
      prestationId, 
      objet: newObjet.trim(), 
      moment: momentToSend, 
      type: todoType,
      googleAccountId: todoType === 'URGENT' ? googleAccount?.id : undefined 
    })).unwrap();
    setNewObjet(''); setNewMoment(''); setTodoType('NORMAL');
  };

  const startEdit = (todo: any) => {
    setEditingId(todo.rappel.id);
    setEditObjet(todo.rappel.objet);
    setEditMoment(new Date(todo.rappel.moment).toISOString().slice(0, 16));
  };

  const handleUpdate = async (rappelId: string) => {
    const momentToSend = new Date(editMoment).toISOString();
    await dispatch(updateTodo({ rappelId, objet: editObjet, moment: momentToSend })).unwrap();
    setEditingId(null);
  };

  const confirmAction = (msg: string, fn: () => void) => {
    if (window.confirm(msg)) fn();
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Bell size={18} /></div>
          <h3 className="font-bold text-slate-700 text-sm">Rappels & Tâches</h3>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="divide-y divide-slate-300">
        {todos.map((todo) => {
          const isFait = todo.rappel.status === 'FAIT';
          const isUrgent = todo.rappel.type === 'URGENT';
          const isEditing = editingId === todo.rappel.id;

          return (
            <div key={todo.id} className={`group relative p-4 transition-all ${isFait ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUrgent ? 'bg-amber-500' : 'bg-slate-200'} ${isFait ? 'bg-emerald-400' : ''}`} />

              <div className="flex items-start gap-4">
                {/* Mark as Done */}
                <button 
                  disabled={isFait}
                  onClick={() => confirmAction("Marquer comme terminé ?", () => dispatch(markAsDone(todo.rappel.id)))}
                  className={`mt-1 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isFait ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'
                  }`}
                >
                  <Check size={12} strokeWidth={4} />
                </button>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-blue-200 shadow-inner">
                      <input className="text-sm font-medium outline-none" value={editObjet} onChange={e => setEditObjet(e.target.value)} />
                      <input type="datetime-local" className="text-xs text-slate-500 outline-none" value={editMoment} onChange={e => setEditMoment(e.target.value)} />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16}/></button>
                        <button onClick={() => handleUpdate(todo.rappel.id)} className="p-1 text-emerald-600 hover:text-emerald-700"><Check size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold truncate ${isFait ? 'text-slate-400 line-through font-normal' : 'text-slate-800'}`}>
                          {todo.rappel.objet}
                        </span>
                        {isUrgent && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-bold border border-amber-100">URGENT</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 italic">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(todo.rappel.moment).toLocaleString('fr-FR')}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions contextuelles */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(todo)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Edit3 size={15} />
                    </button>
                    {/* <button onClick={() => confirmAction("Désactiver ce rappel ?", () => dispatch(deactivateTodo(todo.rappel.id)))} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                      <MoreHorizontal size={15} />
                    </button>
                    <button onClick={() => confirmAction("Supprimer définitivement ?", () => dispatch(deleteTodo(todo.rappel.id)))} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={15} />
                    </button> */}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulaire d'ajout */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Objet</label>
          <input value={newObjet} onChange={e => setNewObjet(e.target.value)} placeholder="Titre du rappel..." className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Échéance</label>
          <input type="datetime-local" value={newMoment} onChange={e => setNewMoment(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none" />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type</label>
          <select value={todoType} onChange={e => setTodoType(e.target.value as any)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none cursor-pointer">
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgent (Google)</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <button onClick={handleCreate} className="w-full h-[38px] flex items-center justify-center bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95">
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RappelsTable;