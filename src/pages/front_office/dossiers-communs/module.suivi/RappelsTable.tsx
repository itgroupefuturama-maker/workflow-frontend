import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  createTodo,
  deactivateTodo,
  deleteTodo,
  fetchTodosByPrestation,
  markAsDone,
  updateTodo,
} from '../../../../app/front_office/todosSlice';

interface Props {
  prestationId: string;
}

const RappelsTable: React.FC<Props> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: todos } = useSelector((state: RootState) => state.todos);
  const { data: user} = useSelector((state: RootState) => state.user);
  const googleAccount = user?.googleAccount[0] ?? null;

  console.log(`l google account est : ${googleAccount?.id}`);
  

  const [newObjet, setNewObjet] = useState('');
  const [newMoment, setNewMoment] = useState('');
  const [todoType, setTodoType] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [googleAccountId, setGoogleAccountId] = useState('');

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingObjet, setEditingObjet] = useState('');
  const [editingMoment, setEditingMoment] = useState('');

  const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchTodosByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  const handleCreate = async () => {
    if (!newObjet.trim() || !newMoment.trim() || !prestationId) {
      alert('Remplir objet et moment');
      return;
    }
    // Remplace l'ancienne vérification googleAccountId
    if (todoType === 'URGENT' && !googleAccount?.id) {
      alert('Aucun compte Google connecté. Connectez votre compte dans les paramètres.');
      return;
    }

    const momentToSend = newMoment.includes('Z') ? newMoment : new Date(newMoment).toISOString();

    try {
      if (todoType === 'URGENT') {
        await dispatch(createTodo({
          prestationId,
          objet: newObjet.trim(),
          moment: momentToSend,
          type: 'URGENT',
          googleAccountId: googleAccount!.id,   // ← id automatique
        })).unwrap();
      } else {
        await dispatch(createTodo({ prestationId, objet: newObjet.trim(), moment: momentToSend })).unwrap();
      }
      setNewObjet('');
      setNewMoment('');
      setTodoType('NORMAL');
    } catch {
      alert('Erreur création rappel');
    }
  };

  const startEdit = (todo: any) => {
    setEditingTodoId(todo.rappel.id);
    setEditingObjet(todo.rappel.objet);
    setEditingMoment(todo.rappel.moment);
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingObjet('');
    setEditingMoment('');
  };

  const handleUpdate = async () => {
    if (!editingTodoId || !editingObjet.trim() || !editingMoment.trim()) return;
    const momentToSend = editingMoment.includes('Z') ? editingMoment : new Date(editingMoment).toISOString();
    try {
      await dispatch(updateTodo({ rappelId: editingTodoId, objet: editingObjet.trim(), moment: momentToSend })).unwrap();
      cancelEdit();
    } catch {
      alert('Erreur modification rappel');
    }
  };

  const handleMarkAsDone = async (rappelId: string) => {
    if (!confirm('Marquer comme terminé ?')) return;
    try { await dispatch(markAsDone(rappelId)).unwrap(); }
    catch { alert('Erreur marquage fait'); }
  };

  const handleDeactivate = async (rappelId: string) => {
    if (!confirm('Désactiver ?')) return;
    try { await dispatch(deactivateTodo(rappelId)).unwrap(); }
    catch { alert('Erreur désactivation'); }
  };

  const handleDelete = async (rappelId: string) => {
    if (!confirm('Supprimer ce rappel ?')) return;
    try { await dispatch(deleteTodo(rappelId)).unwrap(); }
    catch { alert('Erreur suppression rappel'); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Rappels
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
          {todos.length} rappels
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objet</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date / heure</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider pr-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {todos.map((todo) => (
              <tr
                key={todo.id}
                className={`transition-colors duration-100 hover:bg-gray-50 ${
                  todo.rappel.status === 'FAIT' ? 'opacity-50' :
                  todo.status === 'INACTIF' ? 'opacity-40' : ''
                }`}
              >
                {/* Objet */}
                <td className="px-4 py-3">
                  {editingTodoId === todo.rappel.id ? (
                    <input
                      className="w-full px-3 py-1.5 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      value={editingObjet}
                      onChange={(e) => setEditingObjet(e.target.value)}
                    />
                  ) : (
                    <span className={`font-medium ${todo.rappel.status === 'FAIT' ? 'line-through text-gray-400 font-normal' : 'text-gray-900'}`}>
                      {todo.rappel.objet}
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  {editingTodoId === todo.rappel.id ? (
                    <input
                      type="datetime-local"
                      className="px-3 py-1.5 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      value={editingMoment}
                      min={minDateTime}
                      onChange={(e) => setEditingMoment(e.target.value)}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(todo.rappel.moment).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </td>

                {/* Statut */}
                <td className="px-4 py-3 text-center">
                  {todo.rappel.status === 'FAIT' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      Fait
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      En cours
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {editingTodoId === todo.rappel.id ? (
                      <>
                        <button onClick={handleUpdate} className="px-3 py-1 text-xs font-medium text-green-700 bg-white hover:bg-green-50 border border-green-200 rounded-lg transition-colors">
                          Sauver
                        </button>
                        <button onClick={cancelEdit} className="px-3 py-1 text-xs font-medium text-gray-500 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                          Annuler
                        </button>
                      </>
                    ) : (
                      todo.rappel.status !== 'FAIT' && todo.status !== 'INACTIF' && (
                        <>
                          {/* Action principale */}
                          <button onClick={() => handleMarkAsDone(todo.rappel.id)} className="px-3 py-1 text-xs font-medium text-green-700 bg-white hover:bg-green-50 border border-green-200 rounded-lg transition-colors">
                            Fait
                          </button>

                          {/* Séparateur */}
                          <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

                          {/* Actions secondaires */}
                          <button onClick={() => startEdit(todo)} className="px-3 py-1 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors">
                            Modifier
                          </button>
                          <button onClick={() => handleDeactivate(todo.rappel.id)} className="px-3 py-1 text-xs font-medium text-amber-700 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors">
                            Désactiver
                          </button>
                          <button onClick={() => handleDelete(todo.rappel.id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                            Supprimer
                          </button>
                        </>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulaire d'ajout */}
      <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={newObjet}
            onChange={(e) => setNewObjet(e.target.value)}
            placeholder="Objet du rappel…"
            className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <input
            type="datetime-local"
            value={newMoment}
            min={minDateTime}
            onChange={(e) => setNewMoment(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <select
            value={todoType}
            onChange={(e) => setTodoType(e.target.value as 'NORMAL' | 'URGENT')}
            className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Important — To Do List + Google Calendar</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          {todoType === 'URGENT' && (
            googleAccount ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleAccount.email}
                <span className="text-gray-300 ml-1">· compte lié</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-500">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Aucun compte Google connecté
              </div>
            )
          )}

          <button
            onClick={handleCreate}
            className={`ml-auto px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              todoType === 'URGENT'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            + Ajouter
          </button>
        </div>
      </div>

    </div>
  );
};

export default RappelsTable;