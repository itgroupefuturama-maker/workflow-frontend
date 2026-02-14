import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns, setCurrentClientFactureId, type DossierCommun } from '../../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import {FiFolder, FiSearch, FiRefreshCw, FiArrowLeft, FiCalendar, FiUser} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

function ListeDossierByModule() {
  const { module } = useParams<{ module: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: dossiers, loading: loadingDossiers } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  const [searchTerm, setSearchTerm] = useState("");

  const handleRefresh = () => {
    dispatch(fetchDossiersCommuns());
    // Tu peux ajouter d'autres refresh ciblés si besoin
    // dispatch(fetchClientFactures()); etc.
  };

  const handleOpenDossier = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    navigate(`/dossiers-communs/${module}/pages`, {
      state: { targetTab: 'prospection' }
    });
  };

  const filteredDossiers = dossiers.filter((dossier) => {
    const colabs = dossier.dossierCommunColab || [];

    // On cherche s'il y a au moins UNE prestation ticketing valide
    const hasValidTicketing = colabs.some((colab) => {
      if (
        !colab ||
        colab.status !== "CREER" ||
        colab.module?.nom?.toLowerCase() !== module
      ) {
        return false;
      }

      // Point clé : on exige que prestation ne soit pas vide
      const prestations = colab.prestation || [];
      return prestations.length > 0;
    });

    if (!hasValidTicketing) return false;

    // ───────────────────────────────────────────────
    // Filtre texte (recherche)
    const term = searchTerm.toLowerCase().trim();
    if (term === "") return true;

    return [
      dossier.numero,
      dossier.contactPrincipal,
      dossier.clientfacture?.libelle,
      dossier.description,
    ].some((val) => String(val || "").toLowerCase().includes(term));
  });


  return (
    <div className="h-screen flex flex-col bg-gray-50/50 overflow-hidden">
      {/* BARRE DE NAVIGATION FIXE ET CENTRÉE */}
      <div className="max-w-[1600px] w-full mx-auto px-6 pt-5 flex flex-col flex-1 overflow-hidden">
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
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Listes de Dossier {module}</h1>
              <p className="text-slate-500 text-sm">Gérez l'ensemble de vos dossiers Attestation de Voyage ici.</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-gray-200 mb-8">
    
            {/* 1. Onglets (Tabs) - Alignés à gauche */}
            <div className="flex gap-8 overflow-x-auto scrollbar-hide">
              <button className="pb-4 text-sm font-bold text-purple-600 border-b-2 border-purple-600 whitespace-nowrap transition-all">
                Tous les dossiers
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
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Dossier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Réf Travel
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date création
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        WhatsApp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Créé par
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingDossiers ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={10} className="px-6 py-6">
                            <div className="h-12 bg-slate-100 rounded-lg"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredDossiers.map((dossier) => {
                      const firstValidPrest = (dossier.dossierCommunColab || [])
                        .filter(
                          (colab) =>
                            colab?.module?.nom?.toLowerCase() === "ticketing" &&
                            colab.status === "CREER" &&
                            Array.isArray(colab.prestation) &&
                            colab.prestation.length > 0
                        )
                        .flatMap((colab) => colab.prestation || [])
                        .find((prest) => prest?.id);

                      return (
                        <tr
                          key={dossier.id}
                          onClick={() => {
                            // if (firstValidPrest?.id) {
                              handleOpenDossier(dossier);
                            // }
                          }}
                          className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                        >
                          {/* Numéro Dossier */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                                <FiFolder size={18} className="text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {dossier.numero}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Réf Travel Planner */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">
                              {dossier.referenceTravelPlaner || '-'}
                            </span>
                          </td>

                          {/* Date Création */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FiCalendar size={14} className="text-slate-400" />
                              {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>

                          {/* Statut */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                              dossier.status === 'CREER' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : dossier.status === 'ANNULER'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                dossier.status === 'CREER' ? 'bg-emerald-500' :
                                dossier.status === 'ANNULER' ? 'bg-red-500' : 'bg-slate-400'
                              }`}></span>
                              {dossier.status === 'CREER' ? 'Actif' : dossier.status}
                            </span>
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 max-w-[200px] truncate" title={dossier.description}>
                              {dossier.description}
                            </div>
                          </td>

                          {/* Client Facturé */}
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900">
                              {dossier.clientfacture?.libelle || 'Non défini'}
                            </div>
                          </td>

                          {/* Contact Principal */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                                <FiUser size={14} className="text-slate-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {dossier.contactPrincipal}
                              </span>
                            </div>
                          </td>

                          {/* WhatsApp */}
                          <td className="px-6 py-4">
                            {dossier.whatsapp ? (
                              <a 
                                href={`https://wa.me/${dossier.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                {dossier.whatsapp}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>

                          {/* Créé par */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">
                              {dossier.user?.nom} {dossier.user?.prenom}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default ListeDossierByModule;