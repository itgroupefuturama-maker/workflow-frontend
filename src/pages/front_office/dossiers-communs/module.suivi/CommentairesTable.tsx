import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { MessageSquare, Send, Edit2, Trash2, X, Check, Clock } from 'lucide-react';
import {
  createCommentaire,
  updateCommentaire,
  deleteCommentaire,
  fetchCommentairesByPrestation,
  type Commentaire,
} from '../../../../app/front_office/commentaireSlice';

const CommentairesTable: React.FC<{ prestationId: string }> = ({ prestationId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: commentaires } = useSelector((state: RootState) => state.commentaire);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (prestationId) dispatch(fetchCommentairesByPrestation(prestationId));
  }, [dispatch, prestationId]);

  const handleCreate = async () => {
    if (!newComment.trim()) return;
    await dispatch(createCommentaire({ commentaire: newComment.trim(), prestationId })).unwrap();
    setNewComment('');
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
      {/* Header Minimaliste */}
      <div className="px-5 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <MessageSquare size={18} />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Commentaires</h3>
          <span className="px-2 py-0.5 bg-slate-300 text-slate-600 text-[10px] font-bold rounded-full">
            {commentaires.length}
          </span>
        </div>
      </div>

      {/* Liste des commentaires style "Timeline" */}
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {commentaires.length > 0 ? (
          commentaires.map((comment) => (
            <div key={comment.id} className="group p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar Initiales */}
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-indigo-700">
                    {comment.User.prenom.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{comment.User.prenom}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock size={12} />
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    {/* Actions au Hover */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(comment.id); setEditingText(comment.commentaire); }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => confirm('Supprimer ?') && dispatch(deleteCommentaire(comment.id))}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">
                          Annuler
                        </button>
                        <button 
                          onClick={async () => {
                            await dispatch(updateCommentaire({ id: comment.id, commentaire: editingText })).unwrap();
                            setEditingId(null);
                          }}
                          className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed break-words">
                      {comment.commentaire}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm italic">
            Aucun commentaire pour le moment.
          </div>
        )}
      </div>

      {/* Input de saisie style "Messenger/Linear" */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Écrire un message..."
            className="w-full pl-4 pr-12 py-2.5 bg-slate-200 border-transparent focus:bg-slate-200 focus:border-blue-500 focus:ring-0 rounded-xl text-sm transition-all outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!newComment.trim()}
            className="absolute right-2 p-1.5 text-blue-500 hover:bg-blue-300 disabled:text-slate-400 rounded-xl transition-colors"
          >
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentairesTable;