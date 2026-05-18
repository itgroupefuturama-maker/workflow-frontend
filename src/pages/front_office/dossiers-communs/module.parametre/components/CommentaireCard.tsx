import React from 'react';
import { FiClock, FiEdit2, FiUser, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

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

export const alerteConfig: Record <
  CommentaireFournisseur['alerte'],
  { label: string; badge: string; bar: string; icon: React.ReactNode }
> = {
  TRES_ELEVE: {
    label: 'Très élevé',
    badge: 'bg-red-50 text-red-600 border-red-200',
    bar:   'bg-red-400',
    icon:  <FiAlertTriangle size={12} className="text-red-500" />,
  },
  ELEVE: {
    label: 'Élevé',
    badge: 'bg-orange-50 text-orange-600 border-orange-200',
    bar:   'bg-orange-400',
    icon:  <FiAlertTriangle size={12} className="text-orange-500" />,
  },
  NORMAL: {
    label: 'Normal',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    bar:   'bg-amber-400',
    icon:  <FiCheckCircle size={12} className="text-amber-500" />,
  },
  FAIBLE: {
    label: 'Faible',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    bar:   'bg-emerald-400',
    icon:  <FiCheckCircle size={12} className="text-emerald-500" />,
  },
};

interface Props {
  c: CommentaireFournisseur;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur?: boolean;
}

const CommentaireCard: React.FC<Props> = ({ c, editingId, onEdit, showFournisseur = false }) => {
  const alerte  = alerteConfig[c.alerte];
  const isEditing = editingId === c.id;
  const isInactif = c.status === 'INACTIF';

  return (
    <div
      className={`relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200 h-full
        ${isInactif ? 'opacity-60 bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'}
        ${isEditing ? 'ring-2 ring-gray-800 border-transparent shadow-md' : ''}
      `}
    >
      {/* Barre colorée en haut selon le niveau d'alerte */}
      <div className={`h-1 w-full flex-shrink-0 ${alerte.bar}`} />

      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* En-tête : fournisseur + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            {showFournisseur && c.fournisseur && (
              <div className="flex items-center gap-1.5">
                <FiUser size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-600 truncate">
                  {c.fournisseur.code}
                  <span className="font-normal text-gray-400"> — {c.fournisseur.libelle}</span>
                </span>
              </div>
            )}
          </div>

          {/* Badges + bouton édition */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${alerte.badge}`}>
              {alerte.icon}
              {alerte.label}
            </span>
            {c.status === 'ACTIF' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-200">
                <FiCheckCircle size={10} /> Actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-400 border-gray-200">
                <FiXCircle size={10} /> Inactif
              </span>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(c)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isEditing
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Modifier ce commentaire"
              >
                <FiEdit2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Corps : le commentaire */}
        <p className="text-sm text-gray-700 leading-relaxed flex-1 line-clamp-4" title={c.commentaire}>
          {c.commentaire}
        </p>

        {/* Pied : dates */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 border-t border-gray-100 pt-2 mt-auto">
          <span className="flex items-center gap-1">
            <FiClock size={11} />
            {new Date(c.dateEnregistrement).toLocaleString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {c.date_desactivation && (
            <span className="flex items-center gap-1 text-red-400">
              <FiXCircle size={11} />
              Désactivé le {new Date(c.date_desactivation).toLocaleString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentaireCard;