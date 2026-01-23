import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAutorisations } from '../../app/back_office/autorisationsSlice';
import type { RootState, AppDispatch } from '../../app/store';
import { FiArrowLeft, FiClock, FiList, FiX, FiLayers, FiLoader} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const AutorisationPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: autorisations, loading,} = useSelector((state: RootState) => state.autorisations);
  const { data: profiles } = useSelector((state: RootState) => state.profiles);

  const [activeTab, setActiveTab] = useState<'modules' | 'users'>('modules');
  const [showHistory, setShowHistory] = useState(false);

  // Dans AutorisationPage.tsx
  useEffect(() => {
    // On lance systématiquement le fetch pour synchroniser les données
    // sans bloquer l'affichage des données déjà présentes dans le store.
    dispatch(fetchAutorisations());
  }, [dispatch]);

  // On récupère le PREMIER élément du tableau pour le panneau
  const firstAuth = autorisations.length > 0 ? autorisations[0] : null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">


      {loading && autorisations.length > 0 && (
        <div className="fixed top-4 right-8 flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-lg z-[100] animate-bounce">
          <FiLoader className="animate-spin" size={12} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Mise à jour...</span>
        </div>
      )}
      
      {/* Retour et Titre */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <FiLayers className="text-indigo-600" /> Paramètre d'Autorisation
          </h2>
          {/* <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">Paramètre d'Autorisation</h2> */}
        </div>
        
      </div>

      {/* PANNEAU : Première Autorisation (Design Simple) */}
      {!loading && firstAuth && (
        <div className="mb-8 bg-white border border-gray-200  p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
              <FiClock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Autorisation enregistrée</p>
              <h3 className="text-lg font-bold text-gray-900">N° {firstAuth.numero}</h3>
              <p className="text-sm text-gray-500">
                date d'activation {new Date(firstAuth.date).toLocaleDateString('fr-FR')} à {new Date(firstAuth.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
              </p>
              <p className="text-sm text-gray-500">
                Date de desactivation {firstAuth.dateDesactivation ? new Date(firstAuth.dateDesactivation).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  }): ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              firstAuth.status === 'CREER' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600'
            }`}>
              Statut : {firstAuth.status}
            </span>

            {/* BOUTON POUR OUVRIR LA MODAL */}
            <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all shadow-md"
            >
              <FiList size={16} />
              VOIR L'HISTORIQUE ({autorisations.length})
            </button>
          </div>
        </div>
      )}

      {/* SÉLECTEUR DE VUE (Design Onglets simple) */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('modules')}
          className={`p-3 bg-white text-sm font-bold transition-all rounded-tr-md border-b-2 ${
            activeTab === 'modules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
        Profile / Module
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`p-3 bg-white text-sm font-bold transition-all rounded-tr-md border-b-2 ${
            activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Profile / Utilisateur
        </button>
      </div>

      {/* TABLEAU DES PROFILS */}
      <div className="bg-white  overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 text-indigo-600">Profil</th>
              {activeTab === 'modules' ? (
                <>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Fonctionnalité</th>
                  <th className="px-6 py-4">Privilèges</th>
                </>
              ) : (
                <th className="px-6 py-4">Utilisateurs</th>
              )}
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((prof) => (
              <tr key={prof.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-800 text-sm">{prof.profil}</span>
                </td>

                {/* Mode Modules */}
                {activeTab === 'modules' && (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prof.modules?.map((m) => (
                          <span key={m.module.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                            {m.module.nom}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                      {prof.modules?.map(m => m.module.description).join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prof.privileges?.map((p) => (
                          <span key={p.privilege.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {p.privilege.privilege}
                          </span>
                        ))}
                      </div>
                    </td>
                  </>
                )}

                {/* Mode Utilisateurs */}
                {activeTab === 'users' && (
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {prof.users?.map((u) => (
                        <span key={u.user.id} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                          {u.user.nom} {u.user.prenom}
                        </span>
                      ))}
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => navigate(`/parametre/profil/${prof.id}`)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    MODIFIER
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Remplacer l'ancien bloc {loading && ...} par celui-ci */}
        {loading && autorisations.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Premier chargement en cours...
            </p>
          </div>
        )}
      </div>

      {/* MODAL HISTORIQUE DES AUTORISATIONS */}
      {showHistory && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiClock className="text-indigo-600" /> Historique des Autorisations
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {autorisations.map((auth, index) => (
                <div key={auth.id} className={`p-4 rounded-xl border transition-all ${index === 0 ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">N° {auth.numero}</span>
                      <p className="text-sm font-bold text-gray-900">
                        Activée le : {new Date(auth.date).toLocaleDateString('fr-FR')} à {new Date(auth.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${auth.status === 'CREER' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {auth.status}
                    </span>
                  </div>
                  {auth.dateDesactivation && (
                    <p className="text-xs text-gray-500 italic">
                      Désactivée le : {new Date(auth.dateDesactivation).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  {index === 0 && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded mt-2 inline-block">ACTUEL</span>}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <button 
                onClick={() => setShowHistory(false)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorisationPage;