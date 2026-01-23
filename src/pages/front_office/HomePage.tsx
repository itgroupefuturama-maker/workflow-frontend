import { useState ,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns } from '../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../app/store';
import {
  FiPlus, FiFolder, FiSearch, FiRefreshCw,FiArrowLeft
} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state: RootState) => state.auth);
  const { data: dossiers, loading: loadingDossiers } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  const user = useSelector((state: RootState) => state.auth.user);

  const [searchTerm, setSearchTerm] = useState("");

  // Option 1 : refresh uniquement des dossiers communs au montage (recommandé)
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // On recharge TOUJOURS les dossiers communs ici (c'est la page principale)
    dispatch(fetchDossiersCommuns());
  }, [dispatch, token, navigate]);

  // Option 2 (alternative) : ne rien faire ici si le layout recharge déjà tout

  const handleCreateNew = () => {
    navigate("/dossiers-communs/nouveau");
  };

  const handleOpenDossier = (numero: number) => {
    navigate(`/dossiers-communs/${numero}`);
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
  <div className="min-h-screen bg-gray-50/50 pb-20 px-6">
    <div className="max-w-[1600px] mx-auto pt-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-indigo-100 shadow-lg">
              <FiFolder className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Gestion des Dossiers Communs
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Liste complète des dossiers assignés à <span className="text-indigo-600 font-bold">{user?.prenom || "Vous"} {user?.nom || ""}</span>
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
        >
          <FiPlus size={18} />
          Nouveau Dossier
        </button>
      </div>

      {/* RECHERCHE ET ACTIONS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher par N° de dossier, contact ou client..."
            className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Met à jour l'état
          />
        </div>
        <div className="h-8 w-px bg-gray-100 hidden md:block" />
        <button
          onClick={handleRefresh}
          disabled={loadingDossiers}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <FiRefreshCw className={loadingDossiers ? 'animate-spin' : ''} />
          {loadingDossiers ? 'Sync...' : 'Actualiser'}
        </button>
      </div>

      {/* TABLEAU DES DOSSIERS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
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
                onClick={() => handleOpenDossier(dossier.numero)}
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
                <td className="px-6 py-4 text-sm font-bold text-gray-800">
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
                {/* 13. Actions */}
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-indigo-600">
                    <FiArrowLeft className="rotate-180" size={18} />
                  </button>
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
);
}

export default HomePage;