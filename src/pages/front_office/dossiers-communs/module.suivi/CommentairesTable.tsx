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

interface Props {
  prestationId: string;
}

const CommentairesTable: React.FC<Props> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { list: commentaires } = useSelector((state: RootState) => state.commentaire);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchCommentairesByPrestation(prestationId));
    }
  }, [dispatch, prestationId]);

  const handleCreate = async () => {
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

  const handleUpdate = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    try {
      await dispatch(updateCommentaire({ id: editingCommentId, commentaire: editingCommentText.trim() })).unwrap();
      cancelEditing();
    } catch {
      alert('Erreur modification commentaire');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      await dispatch(deleteCommentaire(id)).unwrap();
    } catch {
      alert('Erreur suppression commentaire');
    }
  };

  return (
    <div className="bg-white overflow-hidden border border-gray-200 rounded-bl-xl rounded-r-xl shadow-sm">
      <div className="px-6 py-4">
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
              <tr
                key={comment.id}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}
              >
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
                        onClick={handleUpdate}
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
                        onClick={() => handleDelete(comment.id)}
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

      {/* Ajout */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={handleCreate}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentairesTable;