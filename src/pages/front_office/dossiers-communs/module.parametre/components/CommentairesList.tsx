import React from 'react';
import CommentaireCard, { type CommentaireFournisseur } from './CommentaireCard';
import { Spinner } from './Spinner';

interface Props {
  commentaires: CommentaireFournisseur[];
  loading: boolean;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur?: boolean;
  emptyMessage?: string;
}

const CommentairesList: React.FC<Props> = ({
  commentaires,
  loading,
  editingId,
  onEdit,
  showFournisseur = false,
  emptyMessage = 'Aucun commentaire',
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Spinner className="w-5 h-5" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (commentaires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.852L3 20l1.09-3.635C3.396 15.025 3 13.556 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    // Grille responsive : 1 col mobile → 2 col md → 3 col lg/xl → 4 col 2xl
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {commentaires.map((c) => (
        <CommentaireCard
          key={c.id}
          c={c}
          editingId={editingId}
          onEdit={onEdit}
          showFournisseur={showFournisseur}
        />
      ))}
    </div>
  );
};

export default CommentairesList;