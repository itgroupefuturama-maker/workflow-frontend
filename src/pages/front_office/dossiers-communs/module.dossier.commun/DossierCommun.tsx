import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns, setCurrentClientFactureId, type DossierCommun } from '../../../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../../../app/store';
import {FiPlus, FiFolder, FiSearch, FiRefreshCw, FiArrowLeft} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

function DossierCommun() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: dossiers, loading: loadingDossiers } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  const [searchTerm, setSearchTerm] = useState("");

  // Option 2 (alternative) : ne rien faire ici si le layout recharge déjà tout

  const handleCreateNew = () => {
    navigate("/dossiers-communs/nouveau");
  };

  const handleOpenDossier = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    // console.log(currentClientFactureId);
    navigate(`/dossiers-communs/dossier-detail`);
  };

  const handleRefresh = () => {
    dispatch(fetchDossiersCommuns());
    // Tu peux ajouter d'autres refresh ciblés si besoin
    // dispatch(fetchClientFactures()); etc.
  };

  const filteredDossiers = dossiers.filter((dossier) => {
    const term = searchTerm.toLowerCase();
    return (
      dossier.numero?.toString().toLowerCase().includes(term) ||
      dossier.contactPrincipal?.toLowerCase().includes(term) ||
      dossier.clientfacture?.libelle?.toLowerCase().includes(term) ||
      dossier.description?.toLowerCase().includes(term)
    );
  });


  return (
    <div className="h-screen flex flex-col bg-gray-50/50 overflow-hidden">
      {/* BARRE DE NAVIGATION FIXE ET CENTRÉE */}
      <div className="max-w-[1600px] w-full mx-auto px-6 pt-10 flex flex-col flex-1 overflow-hidden">
        {/* Header avec navigation */}
        <header className="bg-white w-70 backdrop-blur-sm sticky top-0 z-50 mb-10 rounded-2xl">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 flex items-center space-x-5 text-slate-600 hover:text-slate-900 transition-colors group"
                    >
                    <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold">Retour à la page d'accueil</span>
                </button>
            </div>
        </header>
        {/* HEADER SECTION */}
        <div className="shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Dossiers Commun</h1>
              <p className="text-slate-500 text-sm">Gérez l'ensemble de vos dossiers communs ici.</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
            >
              <FiPlus size={18} />
              Nouveau Dossier
            </button>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-gray-200 mb-8">
    
            {/* 1. Onglets (Tabs) - Alignés à gauche */}
            <div className="flex gap-8 overflow-x-auto scrollbar-hide">
              <button className="pb-4 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap transition-all">
                Tous les dossiers
              </button>
              <button className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 border-b-2 border-transparent hover:border-slate-300 whitespace-nowrap transition-all">
                Mes assignations
              </button>
              <button className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 border-b-2 border-transparent hover:border-slate-300 whitespace-nowrap transition-all">
                Dossiers Collaboratifs
              </button>
            </div>

            {/* 2. Bloc Recherche & Actions - Alignés à droite */}
            <div className="flex flex-wrap items-center gap-3 pb-3">
              
              {/* Barre de recherche minimaliste */}
              <div className="relative group min-w-[280px]">
                <FiSearch 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" 
                  size={16} 
                />
                <input
                  type="text"
                  placeholder="Rechercher un dossier..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Séparateur vertical discret */}
              <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />

              {/* Groupe de boutons secondaires */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loadingDossiers}
                  title="Actualiser"
                  className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all disabled:opacity-50 shadow-sm"
                >
                  <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} size={16} />
                </button>

                <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtrer
                </button>

                <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Trier
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 mb-6 flex flex-col">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Numéro Dossier</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Réf Travel Planner</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Création</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Annulation</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Raison Annulation</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Facturé</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Principal</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Whatsapp</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crée par</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {loadingDossiers ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                        <td colSpan={13} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                        </tr>
                    ))
                    ) : filteredDossiers.map((dossier) => (
                    <tr 
                        key={dossier.id} 
                        className="hover:bg-indigo-50/20 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDossier(dossier)}
                    >
                        {/* 1. Numéro Dossier */}
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                            <FiFolder size={16} />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{dossier.numero}</span>
                        </div>
                        </td>

                        {/* 2. Réf Travel Planner */}
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {/* Note: Dans votre JSON, c'est null pour tous, d'où l'affichage du tiret */}
                        {dossier.referenceTravelPlaner || '-'}
                        </td>

                        {/* 3. Date Création */}
                        <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        {/* 4. Statut */}
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                            dossier.status === 'CREER' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : dossier.status === 'ANNULER'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}>
                            {dossier.status === 'CREER' ? 'Ouvert' : dossier.status}
                        </span>
                        </td>

                        {/* 5. Description */}
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-[150px] truncate">
                        {dossier.description}
                        </td>

                        {/* 6. Date Annulation */}
                        <td className="px-6 py-4 text-xs text-red-500">
                        {dossier.dateAnnulation 
                            ? new Date(dossier.dateAnnulation).toLocaleDateString('fr-FR') 
                            : '-'}
                        </td>

                        {/* 7. Raison Annulation */}
                        <td className="px-6 py-4 text-xs text-gray-500 italic">
                        {dossier.raisonAnnulation || '-'}
                        </td>

                        {/* 8. Client Facturé */}
                        <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                        {dossier.clientfacture?.libelle || 'Non défini'}
                        </td>

                        {/* 9. Contact Principal */}
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {dossier.contactPrincipal}
                        </td>

                        {/* 10. Whatsapp */}
                        <td className="px-6 py-4 text-xs text-emerald-600">
                        {dossier.whatsapp || '-'}
                        </td>

                        {/* 11. Créé par */}
                        <td className="px-6 py-4 text-xs text-gray-600">
                        {dossier.user?.nom} {dossier.user?.prenom}
                        </td>

                        {/* 12. Module */}
                        <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                            {dossier.dossierCommunColab
                            ?.filter((colab) => colab.status === "CREER") // On garde uniquement les status "CREER"
                            .map((colab, idx) => (
                                <span key={idx} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                                {colab.module?.nom}
                                </span>
                            ))}
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                </div>

                {/* EMPTY STATE DANS LE TABLEAU */}
                {!loadingDossiers && filteredDossiers.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-gray-50/30">
                    <FiSearch size={40} className="text-gray-200 mb-4" />
                    <p className="text-sm text-gray-400 font-medium">Aucun dossier trouvé pour "{searchTerm}".</p>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default DossierCommun;