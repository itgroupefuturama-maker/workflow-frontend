import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, FiEdit,FiPackage, FiCheckCircle
} from "react-icons/fi";
import { useSelector } from "react-redux";
// import { useState } from "react";
import type { RootState } from "../../../app/store";
import { useState } from "react";

export default function DossierCommunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPrestationId, setSelectedPrestationId] = useState<string | null>(null);

  const { data: dossiers } = useSelector((state: RootState) => state.dossierCommun);
  const dossier = dossiers.find((d) => String(d.id) === id || String(d.numero) === id);
  const user = useSelector((state: RootState) => state.auth.user);

  if (!dossier) {
    return <div className="p-20 text-center text-gray-500">Dossier introuvable</div>;
  }

  const modulesAccessibles = user?.profiles
    ?.filter(p => p.status === 'ACTIF')
    ?.flatMap(p => p.profile.modules.map(m => m.module.nom)) || [];

  // === LOGIQUE DE SÉLECTION AUTOMATIQUE (hors useEffect) ===
  // On exécute ça à chaque rendu, mais seulement si rien n'est sélectionné
  if (selectedPrestationId === null) {
    // Parcourir les colabs actifs
    for (const colab of dossier.dossierCommunColab || []) {
      if (colab.status === "CREER" && colab.prestation && colab.prestation.length > 0) {
        const firstActivePrest = colab.prestation.find(p => p.status === "CREER");
        if (firstActivePrest) {
          // On utilise un setTimeout à 0 pour defer l'appel → évite l'erreur React
          setTimeout(() => {
            setSelectedPrestationId(firstActivePrest.id);
          }, 0);
          break; // On sort dès qu'on a trouvé
        }
      }
    }
  }

  // → Maintenant, on peut faire l'early return en toute sécurité
  if (!dossier) {
    return <div className="p-20 text-center text-gray-500">Dossier introuvable</div>;
  }

  

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 mx-auto font-sans text-slate-900">
      
      {/* HEADER : Épuré */}
      <header className="flex justify-between items-center mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
        </button>

        <button
          onClick={() => navigate(`/dossiers-communs/${dossier.numero}/gerer`)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm"
        >
          <FiEdit size={18} /> Gérer le dossier
        </button>
      </header>

      <div className="gap-8">

        {/* COLONNE DROITE (9) : Détails du Dossier */}
        <main className="lg:col-span-9 space-y-8">
          {/* Carte d'information principale */}
          <section className="bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Fiche Récapitulative</h2>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Numéro Dossier Commun : <span className="text-slate-400">{dossier.numero}</span>
                  </h1>

                  <div className="space-y-1 mt-6">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Description</p>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      {dossier.description || "Aucune description"}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border ${
                  dossier.status === 'ANNULER' 
                    ? 'bg-red-50 text-red-500 border-red-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {dossier.status}
                </span>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Date de Création</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {dossier.createdAt}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Client Facturé</p>
                <p className="font-bold text-slate-800">{dossier.clientfacture?.libelle || "Non renseigné"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Contacts</p>
                <p className="font-bold text-slate-800 text-sm">{dossier.contactPrincipal || "—"}</p>
                {dossier.whatsapp && (
                  <p className="text-[11px] text-emerald-600 font-bold">WhatsApp: {dossier.whatsapp}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Raison d'annulation</p>
                <p className="text-sm font-bold text-red-700">{dossier.raisonAnnulation}</p>
              </div>
            </div>
          </section>

          {/* COLONNE BAS : Liste des Modules */}
          <aside className="lg:col-span-12 space-y-10">
            <div className="px-3 sm:px-4">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-[0.25em] mb-6">
                Tableau de bord • Modules
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {/* Carte To Do List – lumineuse et accueillante */}
                <div
                  onClick={() => navigate('/dossiers-communs/prestations/todolist')}
                  className="group relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center p-7 min-h-[180px]"
                >
                  <div className="absolute -top-8 -right-8 opacity-10">
                    <FiCheckCircle size={90} className="text-indigo-300" />
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl mb-5 shadow-sm group-hover:scale-110 transition-all duration-300">
                    <FiCheckCircle size={36} className="text-indigo-600" />
                  </div>
                  <h3 className="text-indigo-800 font-bold text-lg tracking-wide">To Do List</h3>
                  <p className="text-indigo-600/80 text-sm mt-2 font-medium">Gérer mes tâches prioritaires</p>
                </div>

                {/* Cartes des modules – style clair et aéré */}
                {dossier.dossierCommunColab
                  ?.filter((colab) => {
                    const isCreated = colab.status === "CREER";
                    const isAssignedToMe = modulesAccessibles.some(
                      (mod) =>
                        mod === colab.module.nom &&
                        user?.prenom === colab.user.prenom &&
                        user?.nom === colab.user.nom
                    );
                    return isCreated && isAssignedToMe;
                  })
                  .flatMap((colab) =>
                    colab.prestation?.map((prest) => (
                      <div
                        key={prest.id}
                        className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 overflow-hidden flex flex-col h-full"
                      >
                        {/* En-tête cliquable */}
                        <div
                          onClick={() => navigate(`/prestations/${prest.id}`)}
                          className="px-5 py-4 bg-gradient-to-r from-indigo-50/70 to-blue-50/40 border-b border-gray-200 cursor-pointer transition-colors group/header"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <h3 className="text-base font-bold text-indigo-700 group-hover/header:text-indigo-600 transition-colors">
                                {colab.module.nom}
                              </h3>
                              <p className="text-sm text-gray-600 font-medium">
                                {colab.user.prenom} {colab.user.nom}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                                <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs">
                                  {prest.numeroDos}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {prest.createdAt
                                    ? new Date(prest.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : '—'}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-100/60 text-indigo-600 group-hover/header:bg-indigo-200/70 transition-colors">
                              <FiPackage size={22} />
                            </div>
                          </div>
                        </div>

                        {/* Zone d’action centrale */}
                        <div
                          onClick={() => navigate(`/prestations/${prest.id}`)}
                          className="flex-1 p-6 flex items-center justify-center cursor-pointer hover:bg-indigo-50/30 transition-colors"
                        >
                          <p className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-2">
                            Ouvrir la prestation <span aria-hidden="true">→</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                {/* Aucun module */}
                {(!dossier.dossierCommunColab ||
                  dossier.dossierCommunColab.filter((c) => c.status === "CREER").length === 0) && (
                  <div className="col-span-full py-14 text-center">
                    <p className="text-sm text-gray-500">
                      Aucun module collaboratif actif pour le moment
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}