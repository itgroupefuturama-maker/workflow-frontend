// SuiviTabContent.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';

import {
  createCommentaire,
  updateCommentaire,
  deleteCommentaire,
  type Commentaire,
  fetchCommentairesByPrestation,
} from '../../../../app/front_office/commentaireSlice';

import {
  createTodo,
  deactivateTodo,
  deleteTodo,
  fetchTodosByPrestation,
  markAsDone,
  updateTodo,
} from '../../../../app/front_office/todosSlice';
import { fetchSuivis } from '../../../../app/front_office/suiviSlice';

// import SuiviActions from './SuiviActions';

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="bg-gray-200 text-slate-800 px-4 py-3 text-xs font-semibold border-r border-gray-100 text-left uppercase tracking-wide">
    {children}
  </th>
);

interface SuiviTabSectionProps {
  prestationId: string;
}

const SuiviTabSection: React.FC<SuiviTabSectionProps> = ({
  prestationId,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  console.log(`id tonga eto ${prestationId}`);
  

  // ── États Commentaires ───────────────────────────────────────
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // ── États Rappels ────────────────────────────────────────────
  const { items: todos, loading: loadingTodos } = useSelector(
    (state: RootState) => state.todos
  );

  const { list: suivis, loading: suivisLoading, error: suivisError } = useSelector(
    (state: RootState) => state.suivi
  );

  const { list: commentaires, loading: loadingCommentaires } = useSelector(
    (state: RootState) => state.commentaire
  );

  const [newObjet, setNewObjet] = useState('');
  const [newMoment, setNewMoment] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingObjet, setEditingObjet] = useState('');
  const [editingMoment, setEditingMoment] = useState('');
  // Calcule la date/heure minimale (maintenant) au format requis par datetime-local
  const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  useEffect(() => {
    if (prestationId) {
      // Option 1 : fetch global (si l'API renvoie tout)
      dispatch(fetchSuivis());
    }
  }, [dispatch, prestationId]);

  // Charge les commentaires quand on passe sur l'onglet suivi
  useEffect(() => {
    if (prestationId) {
      dispatch(fetchCommentairesByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  useEffect(() => {
    if (prestationId) {
      // Charger les rappels spécifiques à cette prestation
      dispatch(fetchTodosByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  // ── Fonctions Commentaires (copiées de DetailAttestation) ───
  const handleCreateComment = async () => {
    if (!newComment.trim() || !prestationId) return;
    try {
      await dispatch(createCommentaire({ commentaire: newComment.trim(), prestationId })).unwrap();
      setNewComment('');
    } catch {
      alert('Erreur création commentaire');
    }
  };

  const startEditing = (comment: Commentaire) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.commentaire);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    try {
      await dispatch(updateCommentaire({ id: editingCommentId, commentaire: editingCommentText.trim() })).unwrap();
      cancelEditing();
    } catch {
      alert('Erreur modification commentaire');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      await dispatch(deleteCommentaire(id)).unwrap();
    } catch {
      alert('Erreur suppression commentaire');
    }
  };

  // ── Fonctions Rappels ────────────────────────────────────────
  const handleCreateRappel = async () => {
    if (!newObjet.trim() || !newMoment.trim() || !prestationId) {
      alert('Remplir objet et moment');
      return;
    }

    let momentToSend = newMoment;
    if (!newMoment.includes('Z')) {
      momentToSend = new Date(newMoment).toISOString();
    }

    try {
      await dispatch(createTodo({ prestationId, objet: newObjet.trim(), moment: momentToSend })).unwrap();
      setNewObjet('');
      setNewMoment('');
    } catch {
      alert('Erreur création rappel');
    }
  };

  const startEditRappel = (todo: any) => {
    setEditingTodoId(todo.rappel.id);
    setEditingObjet(todo.rappel.objet);
    setEditingMoment(todo.rappel.moment);
  };

  const cancelEditRappel = () => {
    setEditingTodoId(null);
    setEditingObjet('');
    setEditingMoment('');
  };

  const handleUpdateRappel = async () => {
    if (!editingTodoId || !editingObjet.trim() || !editingMoment.trim()) return;

    let momentToSend = editingMoment;
    if (!editingMoment.includes('Z')) {
      momentToSend = new Date(editingMoment).toISOString();
    }

    try {
      await dispatch(updateTodo({ rappelId: editingTodoId, objet: editingObjet.trim(), moment: momentToSend })).unwrap();
      cancelEditRappel();
    } catch {
      alert('Erreur modification rappel');
    }
  };

  const handleMarkAsDone = async (rappelId: string) => {
    if (!confirm('Marquer comme terminé ?')) return;
    try {
      await dispatch(markAsDone(rappelId)).unwrap();
    } catch {
      alert('Erreur marquage fait');
    }
  };

  const handleDeactivate = async (rappelId: string) => {
    if (!confirm('Désactiver ?')) return;
    try {
      await dispatch(deactivateTodo(rappelId)).unwrap();
    } catch {
      alert('Erreur désactivation');
    }
  };

  const handleDeleteRappel = async (rappelId: string) => {
    if (!confirm('Supprimer ce rappel ?')) return;
    try {
      await dispatch(deleteTodo(rappelId)).unwrap();
    } catch {
      alert('Erreur suppression rappel');
    }
  };

  return (
  <>
    <div className="">
        {/* <h2 className="text-xl font-bold text-gray-800 pl-5 pt-3 mb-6">
          <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
          Suivi du traitement
        </h2> */}

        {/* --- SECTION TABLEAUX DU HAUT (Commentaires & Rappels) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Tableau 1: Commentaires */}
          <div className="bg-white overflow-hidden border border-gray-200 shadow-lg">
            <div className=" px-6 py-4">
              <h3 className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Commentaires
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Commentaire</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commentaires.map((comment, index) => (
                    <tr key={comment.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {editingCommentId === comment.id ? (
                          <input 
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                            value={editingCommentText} 
                            onChange={(e) => setEditingCommentText(e.target.value)}
                          />
                        ) : (
                          <span className="line-clamp-2">{comment.commentaire}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {comment.User.prenom}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingCommentId === comment.id ? (
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={handleUpdateComment} 
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Valider"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button 
                              onClick={cancelEditing} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => startEditing(comment)} 
                              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)} 
                              className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Ajout rapide Commentaire */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex gap-3">
                <input 
                  value={newComment} 
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..." 
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button 
                  onClick={handleCreateComment} 
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Tableau 2: Rappels */}
          <div className="bg-white overflow-hidden border border-gray-200 shadow-lg">
            <div className=" px-6 py-4">
              <h3 className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rappels
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Objet</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date/Heure</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todos.map((todo, index) => (
                    <tr 
                      key={todo.id} 
                      className={`${
                        todo.rappel.status === 'FAIT' 
                          ? 'bg-gray-100 opacity-60' 
                          : todo.status === 'INACTIF' 
                          ? 'bg-gray-200' 
                          : index % 2 === 0 
                          ? 'bg-white' 
                          : 'bg-gray-50'
                      } hover:bg-slate-50 transition-colors duration-150`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {editingTodoId === todo.rappel.id ? (
                          <input 
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                            value={editingObjet} 
                            onChange={(e) => setEditingObjet(e.target.value)} 
                          />
                        ) : (
                          <span className={`${todo.rappel.status === 'FAIT' ? 'line-through' : ''}`}>
                            {todo.rappel.objet}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {editingTodoId === todo.rappel.id ? (
                          <input
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            value={editingMoment}
                            min={minDateTime}
                            onChange={(e) => setEditingMoment(e.target.value)}
                          />
                        ) : (
                          <span className="whitespace-nowrap">
                            {new Date(todo.rappel.moment).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {todo.rappel.status === 'FAIT' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Fait
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            En cours
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {editingTodoId === todo.rappel.id ? (
                            <>
                              <button 
                                onClick={handleUpdateRappel} 
                                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                Sauver
                              </button>
                              <button 
                                onClick={cancelEditRappel} 
                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            todo.rappel.status !== 'FAIT' && todo.status !== 'INACTIF' && (
                              <>
                                <button 
                                  onClick={() => handleMarkAsDone(todo.rappel.id)} 
                                  className="px-2.5 py-1 border border-slate-100 text-xs font-medium text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                  Fait
                                </button>
                                <button 
                                  onClick={() => startEditRappel(todo)} 
                                  className="px-2.5 py-1 border border-slate-100 text-xs font-medium text-blue-700  hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  Modifier
                                </button>
                                <button 
                                  onClick={() => handleDeactivate(todo.rappel.id)} 
                                  className="px-2.5 py-1 border border-slate-100 text-xs font-medium text-orange-700  hover:bg-orange-100 rounded-lg transition-colors"
                                >
                                  Désactiver
                                </button>
                                <button 
                                  onClick={() => handleDeleteRappel(todo.rappel.id)} 
                                  className="px-2.5 py-1 border border-slate-100 text-xs font-medium text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                >
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
            {/* Ajout rapide Rappel */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  value={newObjet} 
                  onChange={(e) => setNewObjet(e.target.value)} 
                  placeholder="Objet du rappel..." 
                  className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" 
                />
                <div className="flex gap-3">
                  <input
                    type="datetime-local"
                    value={newMoment}
                    min={minDateTime}
                    onChange={(e) => setNewMoment(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                  <button 
                    onClick={handleCreateRappel} 
                    className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-indigo-500 to-indigo-400 px-4 py-3 ">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Évolution Client
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Origine</TableHeader>
                  <TableHeader>Envoi Devis</TableHeader>
                  <TableHeader>Approbation</TableHeader>
                  <TableHeader>Réf. BC</TableHeader>
                  <TableHeader>Création BC</TableHeader>
                  <TableHeader>Soumission BC</TableHeader>
                  <TableHeader>Approb. BC</TableHeader>
                  <TableHeader>Réf. FAC</TableHeader>
                  <TableHeader>Création FAC</TableHeader>
                  <TableHeader>Règlement</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {suivis.map((suivi: any) => (
                  <tr key={suivi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center border-r border-gray-200">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800">
                        CLIENT
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        {suivi.statut.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-700 border-r border-gray-200">
                      {suivi.origineLigne}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateEnvoieDevis ? new Date(suivi.dateEnvoieDevis).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateApprobation ? new Date(suivi.dateApprobation).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 border-r border-gray-200">
                      {suivi.referenceBcClient || '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateCreationBc ? new Date(suivi.dateCreationBc).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateSoumisBc ? new Date(suivi.dateSoumisBc).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateApprobationBc ? new Date(suivi.dateApprobationBc).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 border-r border-gray-200">
                      {suivi.referenceFacClient || '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateCreationFac ? new Date(suivi.dateCreationFac).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-green-700 border-r border-gray-200 whitespace-nowrap">
                      {suivi.dateReglement ? new Date(suivi.dateReglement).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  </>
);
};

export default SuiviTabSection;