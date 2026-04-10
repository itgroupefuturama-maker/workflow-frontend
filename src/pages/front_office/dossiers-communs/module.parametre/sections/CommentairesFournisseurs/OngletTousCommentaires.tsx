import React, { useEffect, useState } from 'react';
import axios from '../../../../../../service/Axios';
import { FiSearch } from 'react-icons/fi';
import { Spinner } from '../../components/Spinner';
import CommentairesList from '../../components/CommentairesList';
import type { CommentaireFournisseur } from '../../components/CommentaireCard';

const OngletTousCommentaires: React.FC = () => {
  const [tousCommentaires, setTousCommentaires] = useState<CommentaireFournisseur[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [filtreAlerte, setFiltreAlerte]          = useState('TOUS');
  const [filtreStatut, setFiltreStatut]          = useState('TOUS');
  const [recherche, setRecherche]               = useState('');

  const fetchTous = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/commentaires-fournisseur');
      if (res.data.success) setTousCommentaires(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTous(); }, []);

  const filtres = tousCommentaires.filter((c) => {
    const matchAlerte    = filtreAlerte === 'TOUS' || c.alerte === filtreAlerte;
    const matchStatut    = filtreStatut === 'TOUS' || c.status === filtreStatut;
    const matchRecherche = recherche === '' ||
      c.commentaire.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.code.toLowerCase().includes(recherche.toLowerCase());
    return matchAlerte && matchStatut && matchRecherche;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Filtres */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
          />
        </div>

        <select
          value={filtreAlerte}
          onChange={(e) => setFiltreAlerte(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
        >
          <option value="TOUS">Toutes les alertes</option>
          <option value="FAIBLE">Faible</option>
          <option value="NORMAL">Normal</option>
          <option value="ELEVE">Élevé</option>
          <option value="TRES_ELEVE">Très élevé</option>
        </select>

        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>

        <button
          onClick={fetchTous}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner className="w-3 h-3" /> : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Actualiser
        </button>

        {!loading && (
          <span className="ml-auto text-xs text-gray-400">
            {filtres.length} résultat{filtres.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Liste */}
      <div className="p-5">
        <CommentairesList
          commentaires={filtres}
          loading={loading}
          showFournisseur={true}
          emptyMessage="Aucun commentaire ne correspond aux filtres"
        />
      </div>
    </div>
  );
};

export default OngletTousCommentaires;