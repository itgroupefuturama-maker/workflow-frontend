import React from 'react';
import CommentairesFournisseurs from './CommentairesFournisseurs';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

type Section = 'commentaires';

const sectionMap: Record<Section, React.ReactNode> = {
        commentaires:  <CommentairesFournisseurs />,
        };

const ParametreCommentaire = () => {
  const navigate = useNavigate();
  const activeSection = 'commentaires';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Système</p>
              <h1 className="text-base font-semibold text-gray-800 mt-0.5">Paramètres</h1>
            </div>
          </div>
          <div className="flex-1 max-w-sm mx-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input
                type="text"
                placeholder="Rechercher un paramètre..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </header>
      {/* Contenu */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <h1 className="text-2xl font-bold mb-4">Paramètres Commentaire</h1>
          <p>Bienvenue sur la page des paramètres Commentaire.</p>
            {sectionMap[activeSection]}
        </main>
    </div>
  );
};

export default ParametreCommentaire;
