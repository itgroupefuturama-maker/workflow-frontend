import React from 'react';
import CommentaireCard, { type CommentaireFournisseur } from './CommentaireCard';
import { Spinner } from './Spinner';

interface Props {
  commentaires: CommentaireFournisseur[];
  loading: boolean;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur: boolean;
  emptyMessage: string;
}

const CommentairesList: React.FC<Props> = ({
  commentaires, loading, editingId, onEdit, showFournisseur, emptyMessage,
}) => {
  if (loading) return (
    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-12">
      <Spinner className="w-4 h-4" /> Chargement...
    </div>
  );

  if (commentaires.length === 0) return (
    <div className="text-center py-12">
      <p className="text-xs text-gray-300 uppercase tracking-wider">Aucun commentaire</p>
      <p className="text-sm text-gray-400 mt-1">{emptyMessage}</p>
    </div>
  );

  return (
    <div className="space-y-2.5">
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