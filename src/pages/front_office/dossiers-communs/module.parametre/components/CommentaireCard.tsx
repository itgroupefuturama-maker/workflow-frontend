import React from 'react';
import { FiClock, FiEdit2, FiUser } from 'react-icons/fi';

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
}

export interface CommentaireFournisseur {
  id: string;
  commentaire: string;
  dateEnregistrement: string;
  date_activation: string;
  date_desactivation: string | null;
  status: 'ACTIF' | 'INACTIF';
  alerte: 'FAIBLE' | 'NORMAL' | 'ELEVE' | 'TRES_ELEVE';
  fournisseurId: string;
  fournisseur?: Fournisseur;
}

export const alerteConfig = {
  TRES_ELEVE: { label: 'Très élevé', class: 'bg-red-50 text-red-600 border-red-200' },
  ELEVE:      { label: 'Élevé',      class: 'bg-orange-50 text-orange-600 border-orange-200' },
  NORMAL:     { label: 'Normal',     class: 'bg-amber-50 text-amber-600 border-amber-200' },
  FAIBLE:     { label: 'Faible',     class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

interface Props {
  c: CommentaireFournisseur;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur?: boolean;
}

const CommentaireCard: React.FC<Props> = ({ c, editingId, onEdit, showFournisseur = false }) => {
  const alerte = alerteConfig[c.alerte];
  return (
    <div className={`p-4 rounded-lg border transition-all ${
      c.status === 'ACTIF'
        ? 'bg-white border-gray-200 hover:border-gray-300'
        : 'bg-gray-50 border-gray-100 opacity-50'
    } ${editingId === c.id ? 'ring-2 ring-gray-300 border-transparent' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {showFournisseur && c.fournisseur && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <FiUser size={11} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                {c.fournisseur.code} — {c.fournisseur.libelle}
              </span>
            </div>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{c.commentaire}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <FiClock size={11} />
              {new Date(c.dateEnregistrement).toLocaleString('fr-FR')}
            </span>
            {c.date_desactivation && (
              <span className="text-red-400">
                Désactivé le {new Date(c.date_desactivation).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${alerte.class}`}>
            {alerte.label}
          </span>
          {c.status === 'ACTIF' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-200">Actif</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-400 border-gray-200">Inactif</span>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(c)}
              className={`p-1.5 rounded-lg transition-colors ${
                editingId === c.id ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Modifier"
            >
              <FiEdit2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentaireCard;