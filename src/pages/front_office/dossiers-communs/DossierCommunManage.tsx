import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUsers, FiCheck, FiTrash2, FiX } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import type { RootState, AppDispatch } from "../../../app/store";
import {
  fetchClientBeneficiaireInfos,
  type ClientBeneficiaireInfo,
} from "../../../app/portail_client/clientBeneficiaireInfosSlice";
import axiosInstance from "../../../service/Axios";
import { fetchDossiersCommuns } from "../../../app/front_office/dossierCommunSlice";

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

  // useEffect(() => {
  //   dispatch(fetchDossiersCommuns());
  //   if (dossier?.dossierCommunColab) {
  //     setCurrentColabs(
  //       dossier.dossierCommunColab.map((c: any) => ({
  //         moduleId: c.module.id,
  //         userId: c.user.id,
  //       }))
  //     );
  //   }
  // }, [dossier]);

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
    <div className="p-8 max-w-6xl mx-auto relative">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold animate-in slide-in-from-top duration-500 ${
            notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {notification.type === "success" ? <FiCheck size={20} /> : <FiX size={20} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 hover:opacity-70">
            <FiX size={18} />
          </button>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-8 font-medium"
      >
        <FiArrowLeft size={20} />
        Retour
      </button>

      {/* Section titre et bouton annuler */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Dossier Commun N°{dossier.numero} {dossier.id}
          </h1>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
            dossier.status === 'ANNULE' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            Statut: {dossier.status}
          </span>
        </div>

        {dossier.status !== 'ANNULE' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors"
          >
            <FiTrash2 /> Annuler le dossier
          </button>
        )}
      </div>

      {/* === SECTION RESPONSABLES === */}
      <div className="bg-white rounded-3xl shadow-lg p-10 mb-12">
        <div className="flex items-center gap-3 mb-8">
          <FiUsers size={28} className="text-indigo-600" />
          <h2 className="text-2xl font-black text-gray-900">
            Attribution des responsables ({currentColabs.length})
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
              <th className="pb-4 pl-4">Activer</th>
              <th className="pb-4">Module</th>
              <th className="pb-4">Responsable actuel</th>
              <th className="pb-4">Nouveau responsable</th>
              {/* <th className="pb-4 text-right pr-4">Action</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {getModulesWithUsers().map(({ id: moduleId, module, users }) => {
              const currentColab = currentColabs.find((c) => c.moduleId === moduleId);
              const isChecked = !!currentColab;
              // On cherche uniquement celui qui a le statut "CREER"
              const responsableActuel = dossier.dossierCommunColab?.find(
                (c: any) => c.module.id === moduleId && c.status === "CREER"
              );

              return (
                <tr key={moduleId} className={isChecked ? "bg-emerald-50" : ""}>
                  <td className="py-4 pl-4">
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
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-4 font-medium text-gray-900">{module.nom} {module.id}</td>
                  <td className="py-4 text-sm">
                    {responsableActuel ? (
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">
                          {responsableActuel.user.prenom} {responsableActuel.user.nom}
                        </span>
                        <span className="text-gray-700 font-medium">
                          {responsableActuel.user.id}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">
                          Responsable Actif
                        </span>
                        {currentColab && currentColab.userId !== responsableActuel.user.id && (
                          <span className="mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full w-fit">
                            → Remplacement prévu
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Aucun responsable actif</span>
                    )}
                  </td>
                  <td className="py-4">
                    {isChecked && (
                      <select
                        value={currentColab?.userId || users[0]?.userId || ""}
                        onChange={(e) => {
                          setCurrentColabs((prev) => {
                            const filtered = prev.filter((c) => c.moduleId !== moduleId);
                            return [...filtered, { moduleId, userId: e.target.value }];
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        {users.map((user) => (
                          <option key={user.userId} value={user.userId}>
                            {user.prenom} {user.nom} {user.id}
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

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveColabs}
            disabled={isSavingColabs}
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSavingColabs ? "Sauvegarde..." : "Sauvegarder les responsables"}
          </button>
        </div>
      </div>

      {/* === SECTION BÉNÉFICIAIRES & DOCUMENTS === */}
      <div className="bg-white rounded-3xl shadow-lg p-10 mt-10">
        <div className="flex items-center gap-3 mb-8">
          <FiUsers size={28} className="text-purple-600" />
          <h2 className="text-2xl font-black text-gray-900">Bénéficiaires et Documents</h2>
        </div>

        {/* Onglets des bénéficiaires parents (comme dans le Form) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b">
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
                className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all ${
                  isSelected 
                    ? "bg-purple-600 text-white shadow-md" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {benef.libelle}
                {countInDossier > 0 && (
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {countInDossier}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Liste des infos/documents pour le bénéficiaire choisi */}
        {displayedBeneficiaireId && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                  <tr>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Document / Nom</th>
                    <th className="p-4">Référence</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingInfos ? (
                    <tr><td colSpan={4} className="p-10 text-center text-gray-400">Chargement...</td></tr>
                  ) : (
                    infosList.map((info) => {
                      const alreadyInDossier = dossier.dossierCommunClient?.find(
                        (c) => c.clientbeneficiaireInfoId === info.id
                      );
                      const isPending = selectedNewInfos.some(i => i.id === info.id);

                      return (
                        <tr key={info.id} className={`group ${alreadyInDossier ? 'bg-emerald-50/30' : ''}`}>
                          <td className="p-4">
                            {alreadyInDossier ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <FiCheck /> ATTACHÉ
                              </span>
                            ) : (
                              <input 
                                type="checkbox" 
                                checked={isPending}
                                onChange={() => toggleNewInfo(info)}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-800">{info.prenom} {info.nom}</p>
                            <p className="text-xs text-gray-500">{info.typeDoc}</p>
                          </td>
                          <td className="p-4 text-sm font-mono text-gray-600">{info.referenceDoc}</td>
                          <td className="p-4 text-right">
                            {alreadyInDossier && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                    Code: {alreadyInDossier.code}
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

            {selectedNewInfos.length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleAddClients}
                  disabled={isAddingClients}
                  className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-50"
                >
                  {isAddingClients ? "Ajout..." : `Ajouter les ${selectedNewInfos.length} documents sélectionnés`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* MODALE D'ANNULATION */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FiX size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Annuler le dossier ?</h3>
            <p className="text-gray-500 text-center mb-6">
              Cette action est irréversible. Veuillez indiquer le motif de l'annulation.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Raison de l'annulation</label>
              <textarea
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 min-h-[100px] text-sm"
                placeholder="Ex: Le client a changé d'avis..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Ignorer
              </button>
              <button
                onClick={handleAnnulerDossier}
                disabled={isCancelling || !raisonAnnulation.trim()}
                className="py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 disabled:opacity-50 shadow-lg shadow-red-200 transition-all"
              >
                {isCancelling ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}