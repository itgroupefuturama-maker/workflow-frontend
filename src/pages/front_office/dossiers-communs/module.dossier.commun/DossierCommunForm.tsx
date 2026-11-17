import { FiArrowLeft, FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useMemo, useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import type { RootState, AppDispatch } from "../../../../app/store";
import { createDossierCommun, resetCreateStatus } from "../../../../app/front_office/dossierCommunSlice";
import axiosInstance from "../../../../service/Axios";
import type { ModuleAttribution, UserAttribution } from "../../../../app/back_office/profilesSlice";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import { toast } from "../../../../components/Toast/toast";

const useAppDispatch = () => useDispatch<AppDispatch>();

const inputClass =
  "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition";

/* ---------- Petits composants de mise en page ---------- */

const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-6 py-6 border-b border-slate-100 last:border-b-0">
    <div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
    <div className="md:col-span-2">{children}</div>
  </div>
);

const Field = ({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/* ---------- Sélecteur de client facturé avec recherche ---------- */

interface ClientOption {
  id: string;
  code: string;
  libelle: string;
  statut?: string;
}

const ClientSelect = ({
  clients,
  value,
  onChange,
}: {
  clients: ClientOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.libelle?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
    );
  }, [clients, query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="client-facture"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{selected.libelle}</span>
            {selected.code && <span className="text-xs text-slate-400 shrink-0">{selected.code}</span>}
          </span>
        ) : (
          <span className="text-slate-400">Sélectionner un client facturé…</span>
        )}
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Effacer"
            >
              <FiX size={14} />
            </span>
          )}
          <FiChevronDown className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou code…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">Aucun client trouvé</li>
            )}
            {filtered.map((c) => {
              const isSelected = c.id === value;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{c.libelle}</span>
                      {c.code && <span className="text-xs text-slate-400 shrink-0">{c.code}</span>}
                      {c.statut === "INACTIF" && (
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Inactif
                        </span>
                      )}
                    </span>
                    {isSelected && <FiCheck size={14} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ---------- Page ---------- */

export default function DossierCommunForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: profiles } = useSelector((state: RootState) => state.profiles);
  const { data: clients } = useSelector((state: RootState) => state.clientFactures);
  const { creating } = useSelector((state: RootState) => state.dossierCommun);

  const [clientFactureId, setClientFactureId] = useState<string | null>(null);
  const [referenceTravelPlaner, setReferenceTravelPlaner] = useState("");
  const [description, setDescription] = useState("");
  const [contactPrincipal, setContactPrincipal] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [colabs, setColabs] = useState<Record<string, string>>({}); // moduleId -> userId
  // Suggestions (moduleId -> userId) mémorisées pour le client qui les a produites
  const [suggestionState, setSuggestionState] = useState<{ clientId: string; map: Record<string, string> } | null>(
    null
  );
  const suggestions: Record<string, string> =
    suggestionState && suggestionState.clientId === clientFactureId ? suggestionState.map : {};
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(resetCreateStatus());
  }, [dispatch]);

  // Modules disponibles et leurs utilisateurs (dérivés des profils)
  const modules = useMemo(() => {
    const map = new Map<
      string,
      { module: ModuleAttribution["module"]; users: Map<string, UserAttribution["user"]> }
    >();
    profiles.forEach((prof) => {
      prof.modules?.forEach((m) => {
        if (m.module?.status?.toUpperCase() !== "ACTIF") return; // modules inactifs masqués
        if (!map.has(m.module.id)) map.set(m.module.id, { module: m.module, users: new Map() });
        prof.users?.forEach((u) => map.get(m.module.id)!.users.set(u.user.id, u.user));
      });
    });
    return Array.from(map.entries()).map(([id, d]) => ({
      id,
      module: d.module,
      users: Array.from(d.users.entries()).map(([userId, user]) => ({ userId, ...user })),
    }));
  }, [profiles]);

  // Suggestions de responsables selon le client facturé
  useEffect(() => {
    if (!clientFactureId) return;

    let cancelled = false;
    Promise.all(
      modules.map(async ({ id: moduleId }) => {
        try {
          const res = await axiosInstance.get(`/prestations/${moduleId}/clientFact/${clientFactureId}`);
          const colabId = res.data?.success ? res.data.data?.collaboratorId : null;
          return colabId ? ([moduleId, colabId] as const) : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      results.forEach((r) => {
        if (r) next[r[0]] = r[1];
      });
      setSuggestionState({ clientId: clientFactureId, map: next });
    });

    return () => {
      cancelled = true;
    };
  }, [clientFactureId, modules]);

  const toggleModule = (moduleId: string, users: { userId: string }[]) => {
    setColabs((prev) => {
      if (moduleId in prev) {
        const rest = { ...prev };
        delete rest[moduleId];
        return rest;
      }
      const suggested = suggestions[moduleId];
      const defaultUser =
        suggested && users.some((u) => u.userId === suggested) ? suggested : users[0]?.userId ?? "";
      return { ...prev, [moduleId]: defaultUser };
    });
  };

  const activeCount = Object.keys(colabs).length;
  const missingResponsable = Object.values(colabs).some((u) => !u);
  const clientError = submitted && !clientFactureId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!clientFactureId) {
      toast.error("Veuillez sélectionner un client facturé.");
      return;
    }
    if (missingResponsable) {
      toast.error("Chaque module activé doit avoir un responsable.");
      return;
    }

    try {
      await dispatch(
        createDossierCommun({
          referenceTravelPlaner: referenceTravelPlaner.trim() || undefined,
          description: description.trim() || undefined,
          contactPrincipal: contactPrincipal.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          clientFactureId,
          colabs: Object.entries(colabs).map(([moduleId, userId]) => ({ moduleId, userId })),
        })
      ).unwrap();
      toast.success("Le dossier commun a été créé.");
      dispatch(resetCreateStatus());
      navigate("/dossiers-communs");
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Impossible de créer le dossier.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-3"
          >
            <FiArrowLeft size={14} /> Retour
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Nouveau dossier commun</h1>
          <p className="text-sm text-slate-500 mt-1">
            Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.
          </p>
        </div>

        <Card>
          {/* Client */}
          <FormSection
            title="Client facturé"
            description="Le client à qui seront facturées les prestations de ce dossier."
          >
            <Field label="Client facturé" required htmlFor="client-facture">
              <div className={clientError ? "[&>div>button]:border-red-400" : ""}>
                <ClientSelect clients={clients} value={clientFactureId} onChange={setClientFactureId} />
              </div>
              {clientError && <p className="mt-1.5 text-xs text-red-600">Ce champ est obligatoire.</p>}
            </Field>
          </FormSection>

          {/* Informations */}
          <FormSection
            title="Informations générales"
            description="Référence, objet du dossier et coordonnées du contact côté client."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Référence Travel Planner" htmlFor="ref-tp">
                <input
                  id="ref-tp"
                  value={referenceTravelPlaner}
                  onChange={(e) => setReferenceTravelPlaner(e.target.value)}
                  className={inputClass}
                  placeholder="REF-2026-001"
                />
              </Field>
              <Field label="Contact principal" htmlFor="contact">
                <input
                  id="contact"
                  value={contactPrincipal}
                  onChange={(e) => setContactPrincipal(e.target.value)}
                  className={inputClass}
                  placeholder="Nom du contact"
                />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsapp">
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={inputClass}
                  placeholder="+261 34 00 000 00"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" htmlFor="description">
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Voyage de groupe, séminaire, import/export…"
                  />
                </Field>
              </div>
            </div>
          </FormSection>

          {/* Modules */}
          <FormSection
            title="Modules et responsables"
            description="Activez les prestations concernées et désignez un responsable pour chacune. Un responsable habituel est suggéré selon le client."
          >
            {modules.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun module disponible.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {modules.map(({ id: moduleId, module, users }) => {
                  const active = moduleId in colabs;
                  const userId = colabs[moduleId] ?? "";
                  const suggested = suggestions[moduleId];
                  return (
                    <div
                      key={moduleId}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 transition-colors ${
                        active ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <label className="flex items-center gap-3 sm:w-48 shrink-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleModule(moduleId, users)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-600"}`}>
                          {module.nom}
                        </span>
                      </label>

                      <div className="flex-1 flex items-center gap-2">
                        <select
                          value={userId}
                          disabled={!active}
                          onChange={(e) => setColabs((prev) => ({ ...prev, [moduleId]: e.target.value }))}
                          className={`${inputClass} py-1.5 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                            submitted && active && !userId ? "border-red-400" : ""
                          }`}
                        >
                          <option value="">{active ? "Choisir un responsable" : "Module non activé"}</option>
                          {users.map((u) => (
                            <option key={u.userId} value={u.userId}>
                              {u.prenom} {u.nom}
                              {u.userId === suggested ? " (suggéré)" : ""}
                            </option>
                          ))}
                        </select>
                        {active && suggested && userId === suggested && (
                          <span className="shrink-0 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Suggéré
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </FormSection>

          {/* Pied de formulaire */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              {activeCount === 0
                ? "Aucun module activé"
                : `${activeCount} module${activeCount > 1 ? "s" : ""} activé${activeCount > 1 ? "s" : ""}`}
            </p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={creating}>
                Annuler
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Création…" : "Créer le dossier"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
