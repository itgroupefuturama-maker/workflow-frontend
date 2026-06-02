import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../app/store";

import {
  CheckCircle, XCircle, FileText, User, Briefcase,
  GraduationCap, Phone, AlertCircle, Loader2, Plus,
  Pencil,
  ArrowLeft
} from "lucide-react";
import AddBeneficiaireModal from "./components/AddBeneficiaireModal";
import StatusBadge from "./components/StatusBadge";
import DocumentRow from "./components/DocumentRow";
import AddPersonModal from "./components/AddPersonModal";
import EditBeneficiaireModal from "./components/EditBeneficiaireModal";
import EditPersonModal from "./components/EditPersonModal";
import InlineClientForm from "./components/InlineClientForm";
import AssuranceSection from "./components/AssuranceSection";
import AddAssuranceFormModal from "./components/AddAssuranceFormModal";
import ChoicePopup from "./components/ChoicePopup";
import { InfoField, Td, Th } from "./components/utilitaire";
import { fetchClientInfo, type ClientAssuranceFormPayload, type ClientBeneficiairePerson, type ClientFormPayload } from "../../../../app/portail_client/clientFormSlice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContainer from "../../../../layouts/TabContainer";
import { AssuranceHeader } from "../module.assurance/components/AssuranceHeader";
import { VisaHeader } from "../module.visa/components/VisaHeader";

// ── Page principale ──
const ClientInfoPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  console.log(`userId @@@@@@@@@@: ${userId}`);
  const { data: client, loading, error } = useSelector((state: RootState) => state.clientForm);
  const numeroDos  = location.state?.numeroDos  ?? '—';

  const tabs = client?.userType === 'ASSURANCE'
  ? [
      { id: 'prospection',  label: 'Listes des prospections' },
      { id: 'assurance',    label: 'Listes des assurance' },
      { id: 'beneficiaire', label: 'Listes des bénéficiaires' },
    ]
  : [
      { id: 'prospection',  label: 'Listes des prospections' },
      { id: 'visa',         label: 'Listes des visa' },
      { id: 'beneficiaire', label: 'Listes des bénéficiaires' },
    ];

  const [activeTab, setActiveTab] = useState('assurance');

  const [editModal, setEditModal] = useState(false);
  const [editPersonModal, setEditPersonModal] = useState<ClientBeneficiairePerson | null>(null);
  const [assurancePrefill, setAssurancePrefill] = useState<Partial<ClientAssuranceFormPayload> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [personModal, setPersonModal] = useState<{ id: string; nom: string } | null>(null);

    // ── Dernier bénéficiaire uniquement ──
  const lastB  = client?.clientBeneficiaireForms.at(-1);
  const shared = client?.sharedClientBeneficiaireForms ?? [];

  const [showChoicePopup,  setShowChoicePopup]  = useState(false);
  const [showInlineForm,   setShowInlineForm]   = useState(false);
  const [prefillData,      setPrefillData]      = useState<Partial<ClientFormPayload> | null>(null);
  const [prefillPersons,   setPrefillPersons]   = useState<any[]>([]);
  const [assuranceModal, setAssuranceModal] = useState(false);

  // ← Remplace les useState directs par ce useEffect
  useEffect(() => {
    if (loading) return;
    if (client?.userType === 'ASSURANCE') return; // ← bloquer pour l'assurance
    if (!lastB && shared.length > 0) {
      setShowChoicePopup(true);
      setShowInlineForm(false);
    } else if (!lastB && shared.length === 0) {
      setShowChoicePopup(false);
      setShowInlineForm(true);
    }
  }, [loading]);

  useEffect(() => {
    if (userId) dispatch(fetchClientInfo(userId));
  }, [userId, dispatch]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // ← Réécrit location.state sans changer l'URL
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span className="text-sm">{error || 'Données introuvables.'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 bg-slate-100 rounded-t-xl">
              {client?.userType === 'ASSURANCE' ? (
                <AssuranceHeader
                  numeroassurance="Dossier Client"
                  nomPassager={client?.nom}
                  navigate={navigate}
                  isDetail={true}
                  isProspection={false}
                  isDevis={false}
                  isPassager={true}
                />
                ) : (
                <VisaHeader
                  numerovisa={client?.id}
                  nomPassager={client?.nom}
                  navigate={navigate}
                  isDetail={true}
                  isPassager={true}
                /> 
              )}
            </div>
            {/* ── Topbar ── */}
            <header className="bg-slate-100 rounded-b-xl px-4 py-2 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 hover:text-slate-900 cursor-pointer">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Retour</span>
                  </button>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">Fiche Client</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {client.userType === 'ASSURANCE' ? (
                  !client.clientAssuranceForms?.length ? (
                    <button
                      onClick={() => shared.length > 0 ? setShowChoicePopup(true) : setAssuranceModal(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm"
                    >
                      <Plus size={15} /> Compléter mon dossier
                    </button>
                  ) : (
                    // bouton modifier pour assurance — à implémenter plus tard si besoin
                    null
                  )
                ) : (
                  !lastB ? (
                    <button
                      onClick={() => shared.length > 0 ? setShowChoicePopup(true) : setShowInlineForm(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm"
                    >
                      <Plus size={15} /> Compléter mon dossier
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditModal(true)}
                      className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm"
                    >
                      <Pencil size={14} />
                      Modifier mes informations
                    </button>
                  )
                )}
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              <div className="py-2 space-y-6">
                {/* ── Bannière profil ── */}
                <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                  {/* Décoration de fond */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-10" />

                  <div className="relative flex items-start justify-between gap-6">

                    {/* ── Gauche : Visa en vedette ── */}
                    <div className="flex items-start gap-5 flex-1">

                      {/* Icône */}
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-2xl shrink-0">
                        {client.userType === 'ASSURANCE' ? '🛡️' : '🛂'}
                      </div>

                      <div className="flex-1">
                        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                          {client.userType === 'ASSURANCE'
                            ? `Assurance — ${client.assurance?.zoneDestination ?? '—'}`
                            : `Visa — ${client.visa?.pays ?? '—'}`}
                        </p>
                        <h2 className="text-xl font-extrabold tracking-tight leading-tight capitalize">
                          {client.userType === 'ASSURANCE'
                            ? client.assurance?.assureur ?? '—'
                            : client.visa?.visaType ?? '—'}
                        </h2>
                        <p className="text-blue-200 text-sm mt-1 capitalize">
                          {client.userType === 'ASSURANCE'
                            ? `Destination : ${client.assurance?.destination || client.assurance?.zoneDestination || '—'}`
                            : client.visa?.visaDescription ?? '—'}
                        </p>

                        {/* Chips infos secondaires */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                            <User size={10} className="text-blue-200" />
                            <span className="text-blue-100">Client :</span>
                            <span className="font-semibold">{client.nom}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                            <span className="text-blue-100">Créé le</span>
                            <span className="font-semibold">
                              {new Date(client.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Droite : Statuts ── */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        client.actif
                          ? 'bg-green-400/20 text-green-100 border-green-400/30'
                          : 'bg-red-400/20 text-red-100 border-red-400/30'
                      }`}>
                        {client.actif ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {client.actif ? 'Compte actif' : 'Compte inactif'}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        client.isValidate
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-white/10 text-blue-200 border-white/20'
                      }`}>
                        {client.isValidate ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {client.isValidate ? 'Dossier validé' : 'En attente de validation'}
                      </span>

                      {/* Pays avec drapeau */}
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white mt-1">
                        🌍 {client.visa?.pays ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Indicateurs rapides ── */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Statut du dossier",
                      value: lastB?.status ?? "Non rempli",
                      description: lastB ? "Dossier en cours de traitement" : "Veuillez compléter votre dossier",
                      icon: FileText,
                      color: "blue",
                    },
                    {
                      label: "Personnes liées",
                      value: lastB ? `${lastB.clientBeneficiairePerson.length} personne(s)` : "—",
                      description: "Conjoint(e) et enfants inclus",
                      icon: User,
                      color: "purple",
                    },
                    {
                      label: "Documents joints",
                      value: `${client.userDocument.length} fichier(s)`,
                      description: client.userDocument.every(d => !!d.pj) ? "✓ Tous les documents fournis" : "⚠ Documents manquants",
                      icon: FileText,
                      color: "green",
                    },
                  ].map(({ label, value, description, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                        color === 'blue'   ? 'bg-blue-50'   :
                        color === 'purple' ? 'bg-purple-50' : 'bg-green-50'
                      }`}>
                        <Icon size={16} className={
                          color === 'blue'   ? 'text-blue-500'   :
                          color === 'purple' ? 'text-purple-500' : 'text-green-500'
                        } />
                      </div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
                    </div>
                  ))}
                </div>

                {/* ── Contenu principal ── */}
                <div className="grid grid-cols-3 gap-6">

                  {/* ── Colonne principale (2/3) ── */}
                  <div className="col-span-2 space-y-5">
                    {client.userType === 'ASSURANCE' ? (
                    <AssuranceSection
                        assurance={client.assurance}
                        forms={client.clientAssuranceForms ?? []}
                        onAdd={() => setAssuranceModal(true)}   // ← ici
                      />
                    ) : (
                        !lastB ? (

                          showInlineForm ? (
                            // *****************************) Formulaire inline (vide ou pré-rempli *****************************)
                            <InlineClientForm initialData={prefillData ?? undefined} prefillPersons={prefillPersons} userIdClient={client?.id} />
                          ) : (
                            // État vide — bouton pour démarrer
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                                <User size={28} className="text-blue-400" />
                              </div>
                              <h3 className="text-base font-bold text-gray-800 mb-1">Dossier incomplet</h3>
                              <p className="text-sm text-gray-400 max-w-sm mb-6">
                                Vous n'avez pas encore renseigné vos informations personnelles.
                              </p>
                              <button
                                onClick={() => shared.length > 0 ? setShowChoicePopup(true) : setShowInlineForm(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
                              >
                                <Plus size={15} /> Compléter mon dossier
                              </button>
                            </div>
                          )
                          ) : (
                            <div className="space-y-5">
                              {/* Section Identité */}
                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                      <User size={14} className="text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-gray-900">Informations personnelles</h3>
                                      <p className="text-xs text-gray-400">Identité civile et coordonnées</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-6 grid grid-cols-3 gap-x-8 gap-y-5">
                                  <InfoField label="Prénom"            value={lastB.prenom} />
                                  <InfoField label="Nom"               value={lastB.nom} />
                                  <InfoField label="Sexe"              value={lastB.sexe} />
                                  <InfoField label="Date de naissance" value={new Date(lastB.dateNaissance).toLocaleDateString('fr-FR')} />
                                  <InfoField label="Lieu de naissance" value={lastB.lieuNaissance} />
                                  <InfoField label="Nationalité"       value={lastB.nationalite} />
                                  <InfoField label="État civil"        value={lastB.etatCivil} />
                                  <InfoField label="Pays de résidence" value={lastB.paysResidence} />
                                  <InfoField label="Téléphone"         value={lastB.numero} />
                                  <div className="col-span-3">
                                    <InfoField label="Adresse complète" value={lastB.adresse} />
                                  </div>
                                </div>
                              </div>

                              {/* Section Document d'identité */}
                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FileText size={14} className="text-amber-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900">Document d'identité</h3>
                                    <p className="text-xs text-gray-400">Passeport ou carte nationale d'identité</p>
                                  </div>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-5">
                                  <InfoField label="Type de document"   value={lastB.typeDoc} />
                                  <InfoField label="Numéro / Référence" value={lastB.referenceDoc} />
                                  <InfoField label="Date de délivrance" value={new Date(lastB.dateDelivranceDoc).toLocaleDateString('fr-FR')} />
                                  <InfoField label="Date de validité"   value={new Date(lastB.dateValiditeDoc).toLocaleDateString('fr-FR')} />
                                </div>
                              </div>

                              {/* Section Profession + Formation */}
                              <div className="grid grid-cols-2 gap-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                  <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                      <Briefcase size={14} className="text-purple-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-gray-900">Profession</h3>
                                      <p className="text-xs text-gray-400">Situation professionnelle</p>
                                    </div>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <InfoField label="Profession actuelle" value={lastB.professionActuelle} />
                                    <InfoField label="Employeur"           value={lastB.nomEmployeur} />
                                    <InfoField label="Téléphone pro"       value={lastB.numeroTelephone} />
                                    <InfoField label="Email professionnel" value={lastB.emailProfessionnel} />
                                    <InfoField label="Adresse pro"         value={lastB.adresseProfessionnel} />
                                  </div>
                                </div>

                                <div className="space-y-5">
                                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                        <GraduationCap size={14} className="text-green-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-sm font-bold text-gray-900">Formation</h3>
                                        <p className="text-xs text-gray-400">Parcours académique</p>
                                      </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                      <InfoField label="Établissement" value={lastB.etablissement} />
                                      <InfoField label="Diplôme"       value={lastB.diplome} />
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                        <Phone size={14} className="text-red-500" />
                                      </div>
                                      <div>
                                        <h3 className="text-sm font-bold text-gray-900">Contact d'urgence</h3>
                                        <p className="text-xs text-gray-400">Personne à prévenir</p>
                                      </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 gap-4">
                                      <InfoField label="Nom"       value={lastB.nomContactUrgence} />
                                      <InfoField label="Prénom"    value={lastB.prenomContactUrgence} />
                                      <InfoField label="Téléphone" value={lastB.numeroContactUrgence} />
                                      <InfoField label="Email"     value={lastB.emailContactUrgence} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Section Personnes liées */}
                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                      <User size={14} className="text-indigo-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-gray-900">Personnes liées au dossier</h3>
                                      <p className="text-xs text-gray-400">Conjoint(e) et enfants inclus dans la demande</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={lastB.status} />
                                    <button
                                      onClick={() => setPersonModal({ id: lastB.id, nom: `${lastB.prenom} ${lastB.nom}` })}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                                    >
                                      <Plus size={12} />
                                      Ajouter
                                    </button>
                                  </div>
                                </div>
                                {lastB.clientBeneficiairePerson.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                    <User size={28} className="mb-2" />
                                    <p className="text-xs text-gray-400">Aucune personne liée pour le moment.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                          <Th>Nom complet</Th>
                                          <Th>Type</Th>
                                          <Th>Sexe</Th>
                                          <Th>Nationalité</Th>
                                          <Th>Date de naissance</Th>
                                          <Th>Téléphone</Th>
                                          <Th>Actions</Th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {lastB.clientBeneficiairePerson.map((p: ClientBeneficiairePerson) => (
                                          <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                            <Td>
                                              <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                  {p.prenom?.[0]}{p.nom?.[0]}
                                                </div>
                                                <span className="font-semibold text-gray-800">{p.prenom} {p.nom}</span>
                                              </div>
                                            </Td>
                                            <Td>
                                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                p.typePerson === 'CONJOINT'
                                                  ? 'bg-purple-50 text-purple-600'
                                                  : 'bg-blue-50 text-blue-600'
                                              }`}>
                                                {p.typePerson === 'CONJOINT' ? '💍 Conjoint(e)' : '👶 Enfant'}
                                              </span>
                                            </Td>
                                            <Td>{p.sexe || '—'}</Td>
                                            <Td>{p.nationalite || '—'}</Td>
                                            <Td>{new Date(p.dateNaissance).toLocaleDateString('fr-FR')}</Td>
                                            <Td>{p.numero || '—'}</Td>
                                            <Td>
                                              <button
                                                onClick={() => setEditPersonModal(p)}
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition font-medium"
                                              >
                                                <Pencil size={11} /> Modifier
                                              </button>
                                            </Td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        }
                              
                  </div>

                  {/* ── Colonne latérale (1/3) — toujours visible ── */}
                  <div className="space-y-5">

                    {/* Avancement du dossier */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Avancement du dossier</h3>
                      <div className="space-y-3">
                        {(client.userType === 'ASSURANCE'
                          ? [
                              { label: "Formulaire assuré",     done: (client.clientAssuranceForms?.length ?? 0) > 0 },
                              { label: "Pièces jointes",         done: client.userDocument.length > 0 && client.userDocument.every(d => !!d.pj) },
                              { label: "Validation du dossier",  done: client.isValidate },
                            ]
                          : [
                              { label: "Informations personnelles", done: !!lastB },
                              { label: "Document d'identité",       done: !!lastB?.referenceDoc },
                              { label: "Situation professionnelle", done: !!lastB?.professionActuelle },
                              { label: "Pièces jointes",            done: client.userDocument.length > 0 && client.userDocument.every(d => !!d.pj) },
                              { label: "Validation du dossier",     done: client.isValidate },
                            ]
                        ).map(({ label, done }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              done ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {done
                                ? <CheckCircle size={12} className="text-green-600" />
                                : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              }
                            </div>
                            <span className={`text-xs font-medium ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                              {label}
                            </span>
                            {done && <span className="ml-auto text-xs text-green-500 font-semibold">✓</span>}
                          </div>
                        ))}
                      </div>

                      {/* Barre de progression globale */}
                      {(() => {
                        const steps = client.userType === 'ASSURANCE'
                          ? [
                              (client.clientAssuranceForms?.length ?? 0) > 0,
                              client.userDocument.length > 0 && client.userDocument.every(d => !!d.pj),
                              client.isValidate,
                            ]
                          : [
                              !!lastB,
                              !!lastB?.referenceDoc,
                              !!lastB?.professionActuelle,
                              client.userDocument.length > 0,
                              client.isValidate,
                            ];
                        const done = steps.filter(Boolean).length;
                        const pct  = Math.round((done / steps.length) * 100);
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-400">Progression</span>
                              <span className="text-xs font-bold text-blue-600">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Pièces jointes — inchangé */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <FileText size={14} className="text-blue-500" />
                          Pièces jointes
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          client.userDocument.length > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {client.userDocument.length}
                        </span>
                      </div>
                      {client.userDocument.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl text-gray-300">
                          <FileText size={24} className="mb-2" />
                          <p className="text-xs text-gray-400">Aucun document joint.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {client.userDocument.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message important — adapté selon userType */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 mb-1">Informations importantes</p>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            {client.userType === 'ASSURANCE'
                              ? "Assurez-vous que toutes vos informations sont exactes avant la soumission. Toute inexactitude peut invalider votre couverture d'assurance."
                              : "Assurez-vous que toutes vos informations sont exactes avant la soumission. Toute inexactitude peut entraîner un refus de visa."
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* ── Modals ── */}
          {showModal && <AddBeneficiaireModal 
            beneficiaireId={userId || ''}
            userId={client.id}
            onClose={() => setShowModal(false)} 
          />}
          {editModal && lastB && (
            <EditBeneficiaireModal
              beneficiaire={lastB}
              onClose={() => setEditModal(false)}
            />
          )}
          {editPersonModal && (
            <EditPersonModal
              beneficiaireId={userId || ''}
              person={editPersonModal}
              onClose={() => setEditPersonModal(null)}
            />
          )}
          {personModal && (
            <AddPersonModal
              beneficiaireId={userId || ''} 
              userId={personModal.id}
              beneficiaireNom={personModal.nom}
              onClose={() => setPersonModal(null)}
            />
          )}

          {assuranceModal && (
            <AddAssuranceFormModal
              beneficiaireId={userId || ''}
              userId={client.id}
              onClose={() => setAssuranceModal(false)}
              initialData={assurancePrefill ?? undefined}
            />
          )}

          {/* ── Popup choix données existantes ── */}
          {showChoicePopup && (
            <ChoicePopup
              shared={shared}
              onClose={() => setShowChoicePopup(false)}
              onStartFresh={() => {
                setShowChoicePopup(false);
                client.userType === 'ASSURANCE' ? setAssuranceModal(true) : setShowInlineForm(true);
              }}
              onChoose={(data, persons) => {
                if (client.userType === 'ASSURANCE') {
                  // ← Extraire uniquement les champs nécessaires pour l'assurance
                  setAssurancePrefill({
                    nom:            data.nom,
                    prenom:         data.prenom,
                    dateNaissance:  data.dateNaissance,
                    numero:         data.numero,
                    email:          data.email,
                    adresse:        data.adresse,
                    numeroPassport: data.referenceDoc, // ← passeport = referenceDoc
                  });
                  setShowChoicePopup(false);
                  setAssuranceModal(true);
                } else {
                  setPrefillData(data);
                  setPrefillPersons(persons);
                  setShowChoicePopup(false);
                  setShowInlineForm(true);
                }
              }}
            />
          )}
        </div>
      </TabContainer>
    </div>
  );
};

export default ClientInfoPage;