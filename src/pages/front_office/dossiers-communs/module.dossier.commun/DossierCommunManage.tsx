import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUsers, FiCheck, FiTrash2, FiX, FiPackage, FiUser, FiFileText } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import type { RootState, AppDispatch } from "../../../../app/store";
import {
  fetchClientBeneficiaireInfos,
  type ClientBeneficiaireInfo,
} from "../../../../app/portail_client/clientBeneficiaireInfosSlice";
import axiosInstance from "../../../../service/Axios";
import { fetchDossiersCommuns } from "../../../../app/front_office/dossierCommunSlice";

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function DossierCommunManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Sélecteurs
  const { data: dossiers } = useSelector((state: RootState) => state.dossierCommun);
  const { data: allClientsFactures } = useSelector((state: RootState) => state.clientFactures);
  const { list: infosList, loadingList: loadingInfos } = useSelector((state: RootState) => state.clientBeneficiaireInfos);

  const dossier = dossiers.find((d) => d.numero === Number(id));

  // Trouver l'objet client facturé complet pour avoir la liste des bénéficiaires parents
  const clientFactureComplet = allClientsFactures.find(c => c.id === dossier?.clientfacture.id);

  // === GESTION DES COLABS (RESPONSABLES) ===
  const [currentColabs, setCurrentColabs] = useState<{ moduleId: string; userId: string }[]>([]);
  const [isSavingColabs, setIsSavingColabs] = useState(false);
  const { data: profiles } = useSelector((state: RootState) => state.profiles);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // On ne charge l'état initial que si le dossier existe et qu'on ne l'a pas encore fait
    if (dossier && !hasLoaded) {
      dispatch(fetchDossiersCommuns());
      const activeColabs = dossier.dossierCommunColab
        ?.filter((c: any) => c.status === "CREER")
        .map((c: any) => ({
          moduleId: c.module.id,
          userId: c.user.id,
        })) || [];
      
      setCurrentColabs(activeColabs);
      setHasLoaded(true); // On marque comme chargé
    }
  }, [dossier, hasLoaded]);

  const getModulesWithUsers = () => {
    const modulesMap = new Map<string, { module: any; users: Map<string, any> }>();
    profiles.forEach((prof) => {
      prof.modules?.forEach((m) => {
        if (!modulesMap.has(m.module.id)) {
          modulesMap.set(m.module.id, { module: m.module, users: new Map() });
        }
        prof.users?.forEach((u) => {
          modulesMap.get(m.module.id)!.users.set(u.user.id, u.user);
        });
      });
    });
    return [...modulesMap.entries()]
      .map(([id, data]) => ({
        id,
        module: data.module,
        users: Array.from(data.users.entries()).map(([userId, user]) => ({ userId, ...user })),
      }))
      .sort((a, b) => a.module.nom.localeCompare(b.module.nom));
  };

  const handleSaveColabs = async () => {
    if (!dossier) return;
    setIsSavingColabs(true);

    try {
      const existingColabs = dossier.dossierCommunColab
        ?.filter((c: any) => c.status === "CREER")
        .map((c: any) => ({
          moduleId: c.module.id,
          userId: c.user.id,
        })) || [];

      const toUpdate: { moduleId: string; newUserId: string }[] = [];
      const toAdd: { moduleId: string; userId: string }[] = [];

      getModulesWithUsers().forEach(({ id: moduleId }) => {
        const currentSelection = currentColabs.find(c => c.moduleId === moduleId);
        const existing = existingColabs.find(e => e.moduleId === moduleId);

        if (currentSelection) {
          if (existing) {
            if (existing.userId !== currentSelection.userId) {
              toUpdate.push({ moduleId, newUserId: currentSelection.userId });
            }
          } else {
            toAdd.push({ moduleId, userId: currentSelection.userId });
          }
        }
      });

      console.log("--- DEBUG ENVOI ---");
      console.log("À Ajouter (POST):", toAdd);
      console.log("À Mettre à jour (PATCH):", toUpdate);

      const requests = [];

      // POST : Ajouts
      for (const colab of toAdd) {
        const payload = { userId: colab.userId, moduleId: colab.moduleId };
        console.log(`Envoi POST vers /dossier-commun/${dossier.id}/colabs`, payload);
        requests.push(axiosInstance.post(`/dossier-commun/${dossier.id}/colabs`, payload));
      }

      // PATCH : Mises à jour
      for (const update of toUpdate) {
        const payload = { userId: update.newUserId, moduleId: update.moduleId };
        console.log(`Envoi PATCH vers /dossier-commun/${dossier.id}/update/colabs`, payload);
        requests.push(axiosInstance.patch(`/dossier-commun/${dossier.id}/update/colabs`, payload));
      }

      if (requests.length > 0) {
        const responses = await Promise.all(requests);
        console.log("--- RÉPONSES SERVEUR ---");
        responses.forEach((res, i) => console.log(`Réponse ${i} :`, res.data));
      }

      setNotification({
        type: "success",
        message: "Mise à jour effectuée avec succès !",
      });

    } catch (err: any) {
      console.error("--- ERREUR DÉTAILLÉE ---");
      if (err.response) {
        // Le serveur a répondu avec un code d'erreur (500, 400, etc.)
        console.log("Data erreur reçue du serveur:", err.response.data);
        console.log("Status erreur:", err.response.status);
        console.log("Headers erreur:", err.response.headers);
      } else if (err.request) {
        // La requête a été envoyée mais aucune réponse n'a été reçue
        console.log("Aucune réponse reçue (problème réseau ou CORS)");
      } else {
        console.log("Erreur de configuration requête:", err.message);
      }

      setNotification({
        type: "error",
        message: err.response?.data?.message || "Échec de la mise à jour",
      });
    } finally {
      setIsSavingColabs(false);
    }
  };

  // === ÉTATS POUR LES DOCUMENTS ===
  const [displayedBeneficiaireId, setDisplayedBeneficiaireId] = useState<string | null>(null);
  const [selectedNewInfos, setSelectedNewInfos] = useState<ClientBeneficiaireInfo[]>([]);
  const [isAddingClients, setIsAddingClients] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Charger les infos quand on change d'onglet bénéficiaire
  useEffect(() => {
    if (displayedBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(displayedBeneficiaireId));
    }
  }, [displayedBeneficiaireId, dispatch]);

  // === NOTIFICATION TOAST ===
  // const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleNewInfo = (info: ClientBeneficiaireInfo) => {
    setSelectedNewInfos((prev) =>
      prev.find((i) => i.id === info.id) ? prev.filter((i) => i.id !== info.id) : [...prev, info]
    );
  };

  const handleAddClients = async () => {
    if (!dossier || selectedNewInfos.length === 0) return;
    setIsAddingClients(true);
    try {
      // Calcul du code suivant (1001, 1002...)
      const maxCode = dossier.dossierCommunClient?.reduce(
        (max, c) => Math.max(max, c.code || 0), 1000
      ) || 1000;

      for (let i = 0; i < selectedNewInfos.length; i++) {
        await axiosInstance.post(`/dossier-commun/${dossier.id}/clients`, {
          clientbeneficiaireInfoId: selectedNewInfos[i].id,
          code: maxCode + i + 1,
        });
      }

      setNotification({ type: "success", message: `${selectedNewInfos.length} document(s) ajouté(s) !` });
      setSelectedNewInfos([]);
      // Optionnel: refresh le dossier ici
    } catch (err: any) {
      setNotification({ type: "error", message: "Erreur lors de l'ajout" });
    } finally {
      setIsAddingClients(false);
    }
  };

  if (!dossier) return <div className="p-10 text-center">Dossier introuvable</div>;

  if (!dossier) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Dossier non trouvé</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 underline">
          Retour
        </button>
      </div>
    );
  }

  // 1. Ajoutez ces états en haut de votre composant avec les autres
const [showCancelModal, setShowCancelModal] = useState(false);
const [raisonAnnulation, setRaisonAnnulation] = useState("");
const [isCancelling, setIsCancelling] = useState(false);

// 2. La fonction pour envoyer la requête
const handleAnnulerDossier = async () => {
  if (!raisonAnnulation.trim()) {
    setNotification({ type: "error", message: "Veuillez saisir une raison" });
    return;
  }

  setIsCancelling(true);
  try {
    await axiosInstance.patch(`/dossier-commun/${dossier.id}/annulation`, {
      raisonAnnulation: raisonAnnulation
    });

    setNotification({ type: "success", message: "Le dossier a été annulé." });
    
    setShowCancelModal(false);
    navigate(-1);
    
    // Optionnel : Rediriger ou rafraîchir les données
    // navigate('/dossiers-communs'); 
  } catch (err: any) {
    setNotification({ 
      type: "error", 
      message: err.response?.data?.message || "Erreur lors de l'annulation" 
    });
  } finally {
    setIsCancelling(false);
  }
};

  return (
  <div className="min-h-screen bg-slate-50">
    {/* NOTIFICATION TOAST */}
    {notification && (
      <div
        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border text-white font-medium animate-in slide-in-from-top duration-300 ${
          notification.type === "success" 
            ? "bg-emerald-600 border-emerald-700" 
            : "bg-red-600 border-red-700"
        }`}
      >
        {notification.type === "success" ? <FiCheck size={20} /> : <FiX size={20} />}
        <span>{notification.message}</span>
        <button 
          onClick={() => setNotification(null)} 
          className="ml-4 hover:opacity-70 transition-opacity"
        >
          <FiX size={18} />
        </button>
      </div>
    )}

    {/* HEADER */}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
            >
              <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            
            <div className="h-6 w-px bg-slate-200"></div>
            
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Gestion du dossier N°{dossier.numero}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                  dossier.status === 'ANNULE' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    dossier.status === 'ANNULE' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}></span>
                  {dossier.status}
                </span>
              </div>
            </div>
          </div>

          {dossier.status !== 'ANNULE' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
            >
              <FiTrash2 size={18} />
              Annuler le dossier
            </button>
          )}
        </div>
      </div>
    </header>

    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* SECTION RESPONSABLES */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <FiUsers className="text-indigo-600" size={20} />
            Attribution des responsables
          </h2>
          <p className="text-sm text-slate-600">
            Gérez les responsables de chaque module ({currentColabs.length} module(s) activé(s))
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">
                    Actif
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Responsable actuel
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nouveau responsable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getModulesWithUsers().map(({ id: moduleId, module, users }) => {
                  const currentColab = currentColabs.find((c) => c.moduleId === moduleId);
                  const isChecked = !!currentColab;
                  const responsableActuel = dossier.dossierCommunColab?.find(
                    (c: any) => c.module.id === moduleId && c.status === "CREER"
                  );

                  return (
                    <tr 
                      key={moduleId} 
                      className={`transition-colors ${
                        isChecked ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const firstUserId = users[0]?.userId || "";
                              setCurrentColabs((prev) => [
                                ...prev.filter((c) => c.moduleId !== moduleId),
                                { moduleId, userId: firstUserId },
                              ]);
                            } else {
                              setCurrentColabs((prev) => prev.filter((c) => c.moduleId !== moduleId));
                            }
                          }}
                          className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FiPackage className="text-indigo-600" size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {module.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {responsableActuel ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                                <FiUser className="text-slate-600" size={12} />
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {responsableActuel.user.prenom} {responsableActuel.user.nom}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-600 font-medium ml-9">
                              ● Responsable actif
                            </span>
                            {currentColab && currentColab.userId !== responsableActuel.user.id && (
                              <span className="mt-1 ml-9 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md w-fit border border-amber-200">
                                → Remplacement prévu
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Aucun responsable actif</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isChecked && (
                          <select
                            value={currentColab?.userId || users[0]?.userId || ""}
                            onChange={(e) => {
                              setCurrentColabs((prev) => {
                                const filtered = prev.filter((c) => c.moduleId !== moduleId);
                                return [...filtered, { moduleId, userId: e.target.value }];
                              });
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          >
                            {users.map((user) => (
                              <option key={user.userId} value={user.userId}>
                                {user.prenom} {user.nom}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER AVEC BOUTON DE SAUVEGARDE */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveColabs}
              disabled={isSavingColabs}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSavingColabs ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  Sauvegarder les responsables
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION BÉNÉFICIAIRES & DOCUMENTS */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <FiUsers className="text-purple-600" size={20} />
            Bénéficiaires et Documents
          </h2>
          <p className="text-sm text-slate-600">
            Attachez des documents aux bénéficiaires du dossier
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* ONGLETS DES BÉNÉFICIAIRES */}
          <div className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex gap-1 p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              {clientFactureComplet?.beneficiaires?.map((link) => {
                const benef = link.clientBeneficiaire;
                if (!benef) return null;
                const isSelected = displayedBeneficiaireId === benef.id;
                const countInDossier = dossier.dossierCommunClient?.filter(
                  c => c.clientbeneficiaireInfo?.id === benef.id
                ).length || 0;

                return (
                  <button
                    key={benef.id}
                    onClick={() => setDisplayedBeneficiaireId(benef.id)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isSelected 
                        ? "bg-purple-600 text-white shadow-md" 
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {benef.libelle}
                    {countInDossier > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isSelected ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {countInDossier}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TABLEAU DES DOCUMENTS */}
          {displayedBeneficiaireId && (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">
                        Statut
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Document / Nom
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingInfos ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-slate-300 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-500">Chargement des documents...</p>
                          </div>
                        </td>
                      </tr>
                    ) : infosList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                                <FiFileText className="text-slate-400" size={24} />
                              </div>
                              <p className="text-sm text-slate-500 font-medium">Aucun document disponible</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        infosList.map((info) => {
                          const alreadyInDossier = dossier.dossierCommunClient?.find(
                            (c) => c.clientbeneficiaireInfoId === info.id
                          );
                          const isPending = selectedNewInfos.some(i => i.id === info.id);

                          return (
                            <tr 
                              key={info.id} 
                              className={`transition-colors ${
                                alreadyInDossier ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="px-6 py-4">
                                {alreadyInDossier ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200">
                                    <FiCheck size={14} />
                                    Attaché
                                  </span>
                                ) : (
                                  <input 
                                    type="checkbox" 
                                    checked={isPending}
                                    onChange={() => toggleNewInfo(info)}
                                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                  />
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {info.prenom} {info.nom}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {info.typeDoc}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-mono text-slate-600">
                                  {info.referenceDoc}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {alreadyInDossier && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                                    {alreadyInDossier.code}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BOUTON D'AJOUT DES DOCUMENTS SÉLECTIONNÉS */}
                {selectedNewInfos.length > 0 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleAddClients}
                      disabled={isAddingClients}
                      className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {isAddingClients ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <FiCheck size={18} />
                          Ajouter {selectedNewInfos.length} document(s) sélectionné(s)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL D'ANNULATION */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FiX size={32} />
            </div>
            <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">
              Annuler le dossier ?
            </h3>
            <p className="text-slate-600 text-center mb-6">
              Cette action est irréversible. Veuillez indiquer le motif de l'annulation.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Raison de l'annulation *
              </label>
              <textarea
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] text-sm resize-none"
                placeholder="Ex: Le client a changé d'avis..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAnnulerDossier}
                disabled={isCancelling || !raisonAnnulation.trim()}
                className="px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isCancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Traitement...
                  </span>
                ) : (
                  "Confirmer l'annulation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}