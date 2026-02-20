// src/components/fournisseurAlerteBadget/FournisseurAlerteBadge.tsx
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import {
  clearCommentaireFournisseur,
  confirmMalgréAlerte,
  fermerBadgeTresEleve,
  refuserMalgréAlerte,
} from '../../app/front_office/fournisseurCommentaire/fournisseurCommentaireSlice';

const FournisseurAlerteBadge = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { lastComment, fournisseurId, confirmed } = useSelector(
    (state: RootState) => state.fournisseurCommentaire
  );

  if (!fournisseurId || !lastComment?.alerte) return null;

  const upper = lastComment.alerte.toUpperCase();
  const isTresEleve = upper === 'TRES_ELEVE';
  const isEleve     = upper === 'ELEVE';
  const isNormal    = upper === 'NORMAL';

  if (isEleve && confirmed) return null;

  // ── TRES_ELEVE : modal centrale bloquante ────────────────────────────────
  if (isTresEleve) {
    return (
      <div className="fixed inset-0  bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          {/* Bande supérieure noire */}
          <div className="bg-red-600 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide">Accès refusé</p>
              <p className="text-white text-xs mt-0.5">Fournisseur à risque très élevé</p>
            </div>
          </div>

          {/* Corps */}
          <div className="px-6 py-5">
            <p className="text-gray-800 text-sm leading-relaxed">
              {lastComment.commentaire}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastComment.dateEnregistrement}
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-100 my-5" />

            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed">
              Ce fournisseur ne peut pas être utilisé. Veuillez en sélectionner un autre
              ou contacter votre responsable pour débloquer l'accès.
            </div>

            <button
              onClick={() => dispatch(fermerBadgeTresEleve())}
              className="mt-4 w-full px-4 py-2.5 bg-gray-950 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Changer de fournisseur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ELEVE : modal de confirmation ────────────────────────────────────────
  if (isEleve && !confirmed) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

          {/* Bande supérieure orange */}
          <div className="bg-orange-500 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide">Alerte élevée</p>
              <p className="text-orange-100 text-xs mt-0.5">Une vigilance est requise</p>
            </div>
          </div>

          {/* Corps */}
          <div className="px-6 py-5">
            <p className="text-gray-800 text-sm leading-relaxed">
              {lastComment.commentaire}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastComment.dateEnregistrement}
            </div>

            <div className="border-t border-gray-100 my-5" />

            <p className="text-gray-600 text-sm">
              Souhaitez-vous quand même continuer avec ce fournisseur ?
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => dispatch(refuserMalgréAlerte())}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Non, changer
              </button>
              <button
                onClick={() => dispatch(confirmMalgréAlerte())}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-sm font-medium transition-colors"
              >
                Oui, continuer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NORMAL : notif centre sobre ───────────────────────────────────────────
  if (isNormal) {
    return (
      <div className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
      onClick={() => dispatch(clearCommentaireFournisseur())}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        >

          {/* Bande supérieure grise */}
          <div className="bg-green-600 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide">Information</p>
              <p className="text-gray-300 text-xs mt-0.5">Commentaire fournisseur</p>
            </div>
          </div>

          {/* Corps */}
          <div className="px-6 py-5">
            <p className="text-gray-800 text-sm leading-relaxed">
              {lastComment.commentaire}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastComment.dateEnregistrement}
            </div>

            <div className="border-t border-gray-100 my-5" />

            <button
              onClick={() => dispatch(clearCommentaireFournisseur())}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FAIBLE : toast discret en haut à droite ───────────────────────────────
  return (
    <div className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
    onClick={() => dispatch(clearCommentaireFournisseur())}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      >

        {/* Bande supérieure grise */}
        <div className="bg-yellow-400 px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-wide">Information</p>
            <p className="text-white text-xs mt-0.5">Commentaire fournisseur</p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-5">
          <p className="text-gray-800 text-sm leading-relaxed">
            {lastComment.commentaire}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lastComment.dateEnregistrement}
          </div>

          <div className="border-t border-gray-100 my-5" />

          <button
            onClick={() => dispatch(clearCommentaireFournisseur())}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default FournisseurAlerteBadge;