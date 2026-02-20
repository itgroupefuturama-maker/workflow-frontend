import { FiArrowLeft, FiPlus, FiCheck, FiTrash2, FiChevronDown, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import type { RootState, AppDispatch } from "../../../../app/store";
import { createDossierCommun, resetCreateStatus } from "../../../../app/front_office/dossierCommunSlice";
import axiosInstance from "../../../../service/Axios";

const useAppDispatch = () => useDispatch<AppDispatch>();

// SectionHeader (inchangé)
interface SectionHeaderProps {
  num: number;
  title: string;
  isComplete: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader = ({ num, title, isComplete, isExpanded, onToggle }: SectionHeaderProps) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 transition-all border-b border-slate-100 ${
      isExpanded ? "bg-white shadow-sm" : "bg-gray-50 hover:bg-gray-100"
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
          isComplete 
            ? "bg-green-600 text-white" 
            : isExpanded ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        }`}
      >
        {isComplete ? <FiCheck size={14} /> : num}
      </span>
      <span className={`font-semibold ${isExpanded ? "text-blue-700" : "text-gray-800"}`}>
        {title}
      </span>
    </div>
    <FiChevronDown 
      className={`transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-600" : "text-gray-400"}`} 
    />
  </button>
);

export default function DossierCommunForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: profiles } = useSelector((state: RootState) => state.profiles);
  const { data: clients } = useSelector((state: RootState) => state.clientFactures);
  const { loading: loadingCreate, createSuccess, createError, data: dossiers } = useSelector(
    (state: RootState) => state.dossierCommun
  );

  // États
  const [selectedClientFactureId, setSelectedClientFactureId] = useState<string | null>(null);
  const [selectedClientFactureLibelle, setSelectedClientFactureLibelle] = useState("");
  const [selectedColabs, setSelectedColabs] = useState<{ userId: string; moduleId: string }[]>([]);
  const [referenceTravelPlaner, setReferenceTravelPlaner] = useState("");
  const [description, setDescription] = useState("");
  const [contactPrincipal, setContactPrincipal] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  // Suggestions automatiques des collaborateurs
  const [suggestedCollaborators, setSuggestedCollaborators] = useState<Record<string, string>>({});

  // Notification
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reset au montage
  useEffect(() => {
    dispatch(resetCreateStatus());
  }, [dispatch]);


  // Redirection après succès
  useEffect(() => {
    if (createSuccess && dossiers?.length > 0) {
      const nouveauDossier = dossiers[0];
      if (nouveauDossier?.numero) {
        setNotification({
          type: "success",
          message: "Dossier commun créé avec succès ! Redirection...",
        });

        const timer = setTimeout(() => {
          navigate(`/dossiers-communs`);
          dispatch(resetCreateStatus());
        }, 2500);

        return () => clearTimeout(timer);
      }
    }
  }, [createSuccess, dossiers, navigate, dispatch]);

  // Gestion erreurs
  useEffect(() => {
    if (createError) {
      setNotification({ type: "error", message: `Erreur : ${createError}` });
    }
  }, [createError]);

  // Fermeture auto notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Récupérer les modules et leurs utilisateurs
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

    return Array.from(modulesMap.entries()).map(([id, data]) => ({
      id,
      module: data.module,
      users: Array.from(data.users.entries()).map(([userId, user]) => ({ userId, ...user })),
    }));
  };

  // Charger les suggestions de collaborateurs quand le client facturé change
  useEffect(() => {
    console.log("useEffect suggestions déclenché - clientId :", selectedClientFactureId);

    setSuggestedCollaborators({});

    if (!selectedClientFactureId) {
      console.log("→ Pas de client sélectionné → suggestions vidées");
      return;
    }

    const fetchSuggestions = async () => {
      console.log("→ Début fetch pour client :", selectedClientFactureId);
      const modules = getModulesWithUsers();
      console.log("Modules trouvés :", modules.map(m => m.id));

      const suggestions: Record<string, string> = {};

      for (const { id: moduleId } of modules) {
        console.log(`→ Appel API pour module ${moduleId}`);
        try {
          const response = await axiosInstance.get(
            `/prestations/${moduleId}/clientFact/${selectedClientFactureId}`
          );
          console.log(`Réponse module ${moduleId} :`, response.data);

          if (response.data.success && response.data.data?.collaboratorId) {
            suggestions[moduleId] = response.data.data.collaboratorId;
            console.log(`→ Suggestion trouvée pour ${moduleId} : ${suggestions[moduleId]}`);
          } else {
            console.log(`→ Pas de collaboratorId valide pour ${moduleId}`);
          }
        } catch (err: any) {
          console.error(`Erreur API module ${moduleId} :`, err?.response?.data || err.message);
        }
      }

      console.log("Suggestions finales :", suggestions);
      setSuggestedCollaborators(suggestions);
    };

    fetchSuggestions();
  }, [selectedClientFactureId, profiles]);


  const toggleSection = (sectionNum: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionNum) ? prev.filter((id) => id !== sectionNum) : [...prev, sectionNum]
    );
  };

  const handleSelectClientFacture = (id: string, libelle: string) => {
    setSelectedClientFactureId(id);
    setSelectedClientFactureLibelle(libelle);
  };

  const handlePreview = () => {
    if (!selectedClientFactureId) {
      return setNotification({ type: "error", message: "Veuillez sélectionner un Client Facturé" });
    }

    const payload = {
      referenceTravelPlaner: referenceTravelPlaner || undefined,
      description: description || undefined,
      contactPrincipal: contactPrincipal || undefined,
      whatsapp: whatsapp || undefined,
      clientFactureId: selectedClientFactureId,
      colabs: selectedColabs,
    };

    dispatch(createDossierCommun(payload));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Notification */}
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

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4"
          >
            <FiArrowLeft size={16} /> Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau Dossier Commun</h1>
          <p className="text-gray-500 text-sm mt-1">Remplissez les informations pour créer un nouveau dossier</p>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <SectionHeader
            num={0}
            title="Informations générales"
            isComplete={!!referenceTravelPlaner || !!description}
            isExpanded={expandedSections.includes(0)}
            onToggle={() => toggleSection(0)}
          />
          {expandedSections.includes(0) && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Référence Travel Planner
                </label>
                <input
                  type="text"
                  value={referenceTravelPlaner}
                  onChange={(e) => setReferenceTravelPlaner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="REF-2026-001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Import/Export, Voyage groupe..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Contact Principal
                </label>
                <input
                  type="text"
                  value={contactPrincipal}
                  onChange={(e) => setContactPrincipal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="+261 34 00 000 00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Client Facturé */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <SectionHeader
            num={1}
            title="Client Facturé"
            isComplete={!!selectedClientFactureId}
            isExpanded={expandedSections.includes(1)}
            onToggle={() => toggleSection(1)}
          />
          {expandedSections.includes(1) && (
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="pb-3 pl-4">Sélection</th>
                    <th className="pb-3">Libellé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => handleSelectClientFacture(client.id, client.libelle)}
                      className={`cursor-pointer transition-colors ${
                        selectedClientFactureId === client.id ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3 pl-4">
                        <input
                          type="radio"
                          checked={selectedClientFactureId === client.id}
                          onChange={() => handleSelectClientFacture(client.id, client.libelle)}
                          className="w-4 h-4 text-blue-600"
                        />
                      </td>
                      <td className="py-3 font-medium text-gray-900">{client.libelle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attribution Modules avec suggestion auto */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <SectionHeader
            num={2}
            title={`Attribution des modules (${selectedColabs.length})`}
            isComplete={selectedColabs.length > 0}
            isExpanded={expandedSections.includes(2)}
            onToggle={() => toggleSection(2)}
          />
          {expandedSections.includes(2) && (
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="pb-3 pl-4">Activer</th>
                    <th className="pb-3">Module</th>
                    <th className="pb-3">Responsable</th>
                    <th className="pb-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getModulesWithUsers().map(({ id: moduleId, module, users }) => {
                    const suggestedId = suggestedCollaborators[moduleId];
                    const selectedColab = selectedColabs.find((c) => c.moduleId === moduleId);
                    const isChecked = !!selectedColab;

                    return (
                      <tr key={moduleId} className={isChecked ? "bg-blue-50" : ""}>
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // 1. On vérifie s'il y a une suggestion stockée pour ce module
                                const suggestedId = suggestedCollaborators[moduleId];
                                // 2. On vérifie si cet ID suggéré existe bien dans la liste des users du module
                                const suggestionExisteDansListe = users.some(u => u.userId === suggestedId);
                                // 3. On choisit l'ID final : la suggestion si elle est valide, sinon le 1er user, sinon vide
                                const finalUserId = (suggestedId && suggestionExisteDansListe) 
                                  ? suggestedId 
                                  : (users[0]?.userId || "");

                                setSelectedColabs((prev) => [
                                  ...prev,
                                  { moduleId, userId: finalUserId }
                                ]);
                              } else {
                                // Si on décoche, on retire simplement le module de la liste
                                setSelectedColabs((prev) => prev.filter((c) => c.moduleId !== moduleId));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                        </td>

                        <td className="py-3">
                          <span className="font-medium text-gray-900">{module.nom}</span>
                          {suggestedId && (
                            <span className="ml-2 text-xs text-green-600 italic">(suggéré)</span>
                          )}
                        </td>

                        <td className="py-3">
                          {isChecked ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedColab?.userId || ""}
                                onChange={(e) => {
                                  // Cette mise à jour manuelle ne sera PAS écrasée par le useEffect 
                                  // car le module sera déjà considéré comme "alreadySelected"
                                  setSelectedColabs((prev) => {
                                    const filtered = prev.filter((c) => c.moduleId !== moduleId);
                                    return [...filtered, { userId: e.target.value, moduleId }];
                                  });
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 flex-1"
                              >
                                <option value="">— Choisir —</option>
                                {users.map((user) => (
                                  <option key={user.userId} value={user.userId}>
                                    {user.prenom} {user.nom}
                                  </option>
                                ))}
                              </select>

                              {/* Badge dynamique */}
                              {suggestedId === selectedColab?.userId && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold whitespace-nowrap">
                                  Suggéré
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">En attente d'activation...</span>
                          )}
                        </td>

                        <td className="py-3 text-right pr-4">
                          {isChecked && (
                            <button
                              onClick={() => setSelectedColabs((prev) => prev.filter((c) => c.moduleId !== moduleId))}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">
            {selectedClientFactureId ? (
              <span className="text-green-600">✓ Client: {selectedClientFactureLibelle}</span>
            ) : (
              <span>Aucun client sélectionné</span>
            )}
          </div>
          <button
            onClick={handlePreview}
            disabled={!selectedClientFactureId || loadingCreate}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiPlus size={18} />
            {loadingCreate ? "Création..." : "Créer le Dossier"}
          </button>
        </div>
      </div>
    </div>
  );
}