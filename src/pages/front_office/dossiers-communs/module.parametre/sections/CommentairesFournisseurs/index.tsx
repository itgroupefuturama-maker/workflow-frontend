import React, { useEffect, useState } from 'react';
import axios from '../../../../../../service/Axios';
import { FiList, FiUser } from 'react-icons/fi';
import TabButton from '../../components/TabButton';
import OngletParFournisseur from './OngletParFournisseur';
import OngletTousCommentaires from './OngletTousCommentaires';
import type { Fournisseur } from '../../components/CommentaireCard';

const CommentairesFournisseurs: React.FC = () => {
  const [activeTab, setActiveTab]               = useState<'par_fournisseur' | 'tous'>('tous');
  const [fournisseurs, setFournisseurs]         = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/fournisseurs');
        setFournisseurs(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFournisseurs(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      {/* En-tête + onglets */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paramètres</p>
        <h2 className="text-base font-semibold text-gray-800 mt-0.5">Commentaires fournisseurs</h2>
        <p className="text-xs text-gray-400 mt-1">Gérez les commentaires et alertes associés aux fournisseurs</p>

        <div className="flex gap-1 mt-4 border-b border-gray-100">
          <TabButton
            active={activeTab === 'tous'}
            onClick={() => setActiveTab('tous')}
            icon={<FiList size={13} />}
            label="Tous les commentaires"
          />
          <TabButton
            active={activeTab === 'par_fournisseur'}
            onClick={() => setActiveTab('par_fournisseur')}
            icon={<FiUser size={13} />}
            label="Par fournisseur"
          />
        </div>
      </div>

      {activeTab === 'tous'           && <OngletTousCommentaires />}
      {activeTab === 'par_fournisseur' && (
        <OngletParFournisseur fournisseurs={fournisseurs} loadingFournisseurs={loadingFournisseurs} />
      )}
    </div>
  );
};

export default CommentairesFournisseurs;