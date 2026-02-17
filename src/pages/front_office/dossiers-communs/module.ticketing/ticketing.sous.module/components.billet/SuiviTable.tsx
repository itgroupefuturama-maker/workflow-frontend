import React from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

interface SuiviTabProps {
  suivis: any[];
  suivisLoading: boolean;
  suivisError: string | null;
  commentaires: any[];
  commLoading: boolean;
  commError: string | null;
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: () => void;
  creating: boolean;
  editingCommentId: string | null;
  editCommentText: string;
  setEditCommentText: (val: string) => void;
  startEditing: (com: any) => void;
  cancelEdit: () => void;
  saveEdit: (id: string) => void;
  updating: boolean;
  handleDeleteComment: (id: string, text: string) => void;
  todos: any[];
  todosLoading: boolean;
  todosError: string | null;
  onMarkAsDone: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="bg-gray-200 text-slate-800 px-4 py-3 text-xs font-semibold border-r border-gray-100 text-left uppercase tracking-wide">
    {children}
  </th>
);

const SuiviTab: React.FC<SuiviTabProps> = ({
  suivis, suivisLoading, suivisError,
  commentaires, commLoading, commError, newComment, setNewComment, handleAddComment, creating,
  editingCommentId, editCommentText, setEditCommentText, startEditing, cancelEdit, saveEdit, updating, handleDeleteComment,
  todos, todosLoading, todosError, onMarkAsDone, onDeleteTodo
}) => {

  return (
    <div className="space-y-6">
      {/* SECTION DU HAUT : COMMENTAIRES ET RAPPELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TABLEAU COMMENTAIRES */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r px-4 py-3 ">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Commentaires
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Commentaire</TableHeader>
                  <TableHeader>Utilisateur</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {/* LIGNE D'AJOUT */}
                <tr className="bg-blue-50/50">
                  <td className="px-4 py-3 text-xs text-gray-500 text-center border-r border-gray-200">
                    Nouveau
                  </td>
                  <td className="px-2 py-2 border-r border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button 
                        onClick={handleAddComment}
                        disabled={creating || !newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {creating ? '...' : 'OK'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400 border-r border-gray-200">
                    —
                  </td>
                </tr>
                
                {/* LISTE DES COMMENTAIRES */}
                {commentaires.map((com: any) => (
                  <tr key={com.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {new Date(com.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                      {editingCommentId === com.id ? (
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            autoFocus
                          />
                          <button 
                            onClick={() => saveEdit(com.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiCheck size={16} />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="group flex justify-between items-center">
                          <span>{com.commentaire}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button
                              onClick={() => startEditing(com)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(com.id, com.commentaire)} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-gray-700 border-r border-gray-200">
                      {com.User?.prenom || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLEAU RAPPELS */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rappels
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Objet Rappel</TableHeader>
                  <TableHeader>Moment Rappel</TableHeader>
                  <TableHeader>Statut</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {todos.map((todo: any) => (
                  <tr key={todo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {new Date(todo.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                      {todo.rappel?.objet}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {new Date(todo.rappel?.moment).toLocaleString('fr-FR', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={todo.rappel?.status === 'FAIT'} 
                          onChange={() => onMarkAsDone(todo.rappel.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                        />
                        <span className="ml-2 text-xs font-medium text-gray-700">
                          {todo.rappel?.status === 'FAIT' ? 'Fait' : 'À faire'}
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION BAS : TABLEAUX D'ÉVOLUTION */}
      <div className="space-y-6">
        
        {/* TABLEAU CLIENT */}
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

        {/* TABLEAU FOURNISSEUR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-orange-600 to-orange-700 px-4 py-3 border-b border-orange-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Évolution Fournisseur
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Origine</TableHeader>
                  <TableHeader>Fournisseur</TableHeader>
                  <TableHeader>Réf. BC FRN</TableHeader>
                  <TableHeader>Création BC</TableHeader>
                  <TableHeader>Soumission BC</TableHeader>
                  <TableHeader>Approb. BC</TableHeader>
                  <TableHeader>Réf. FAC FRN</TableHeader>
                  <TableHeader>Création FAC</TableHeader>
                  <TableHeader>Règlement</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
                      FRN
                    </span>
                  </td>
                  <td colSpan={10} className="px-4 py-3 text-center text-sm text-gray-500 border-r border-gray-200">
                    Données fournisseurs synchronisées avec le billet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiviTab;