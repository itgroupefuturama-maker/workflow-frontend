import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiX,
  FiTrash2,
  FiCheck,
  FiChevronDown,
  FiAlertTriangle,
  FiUserPlus,
  FiPaperclip,
  FiExternalLink,
} from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice';
import {
  selectServicesByType,
  type ServicePreference,
} from '../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import { fetchPreferencesBeneficiaire } from '../../app/back_office/clientFacturesSlice';
import PreferencesInlinePanel from './Hotel/PreferencesInlinePanel';
import { toast } from '../Toast/toast';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { API_URL } from '../../service/env';
import { ChampPreuve } from '../ui/Preuve';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
  // Requête en cours : boutons d'envoi bloqués (évite le double envoi)
  loading?: boolean;
}

type PuKey =
  | 'puResaBilletCompagnieDevise'
  | 'puResaServiceCompagnieDevise'
  | 'puResaPenaliteCompagnieDevise';

// ─── Helpers d'affichage ─────────────────────────────────────
const formatMontant = (val: number) =>
  Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmt = (val?: number | null, suffix = '') =>
  val != null ? `${formatMontant(val)}${suffix}` : '—';

// Le back renvoie un chemin relatif (ex. "uploads/…") ; on garde une URL déjà absolue telle quelle.
const fichierUrl = (chemin: string) =>
  /^https?:\/\//i.test(chemin) ? chemin : `${String(API_URL ?? '').replace(/\/+$/, '')}/${chemin.replace(/^\/+/, '')}`;

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 read-only:bg-slate-50';

const TYPE_CLIENT_STYLES: Record<string, string> = {
  SIMPLE: 'bg-slate-100 text-slate-600 ring-slate-200',
  BRONZE: 'bg-orange-50 text-orange-700 ring-orange-200',
  SILVER: 'bg-sky-50 text-sky-700 ring-sky-200',
  GOLD: 'bg-amber-50 text-amber-700 ring-amber-200',
  VIP: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const TypeClientBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
      TYPE_CLIENT_STYLES[type] ?? TYPE_CLIENT_STYLES.SIMPLE
    }`}
  >
    {type}
  </span>
);

const Label: React.FC<{ children: React.ReactNode; required?: boolean; hint?: string }> = ({
  children,
  required,
  hint,
}) => (
  <label className="mb-1.5 block text-xs font-medium text-slate-600">
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
    {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
  </label>
);

const Section: React.FC<{
  step: number;
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ step, title, description, aside, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white">
    <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {aside}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-slate-400">{label}</dt>
    <dd className="mt-0.5 truncate text-sm text-slate-800">{children}</dd>
  </div>
);

// ─── Composant ───────────────────────────────────────────────
const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  loading = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [prefBeneficiaire, setPrefBeneficiaire] = useState<any>(null);

  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );
  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );
  const servicesStore = useSelector(selectServicesByType('TICKET'));

  const prospection = ligne?.prospectionLigne;
  const defaultDevise = prospection?.devise || 'EUR';
  const defaultTaux = prospection?.tauxEchange || 4900;

  // Ligne déjà réservée (FAIT) : on modifie sa réservation, la modal part des valeurs enregistrées.
  // Après un envoi à Odoo, le back remet alors le billet en CREER (à soumettre de nouveau).
  // La modal est remontée à chaque ouverture (key dans Billet.tsx) : initialisation directe.
  const estModification = ligne?.statut === 'FAIT';

  // ─── États ───────────────────────────────────────────────
  const [formData, setFormData] = useState(() => ({
    reservation: estModification ? ligne?.reservation || '' : '',
    devise: (estModification && ligne?.devise) || defaultDevise,
    resaTauxEchange: (estModification && Number(ligne?.resaTauxEchange)) || defaultTaux,
    puResaBilletCompagnieDevise: estModification ? Number(ligne?.puResaBilletCompagnieDevise) || 0 : 0,
    puResaServiceCompagnieDevise: estModification ? Number(ligne?.puResaServiceCompagnieDevise) || 0 : 0,
    puResaPenaliteCompagnieDevise: estModification ? Number(ligne?.puResaPenaliteCompagnieDevise) || 0 : 0,
    puResaMontantBilletCompagnieDevise: 0,
    puResaMontantServiceCompagnieDevise: 0,
    puResaMontantPenaliteCompagnieDevise: 0,
  }));

  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{
      beneficiaireId: string; // clientBeneficiaireId
      infoId: string; // clientbeneficiaireInfoId
      nomComplet: string;
      servicePreferenceIds: string[];
    }>
  >(() =>
    estModification
      ? (ligne?.billet || []).map((b: any) => {
          const info = b.clientbeneficiaireInfo;
          return {
            beneficiaireId: info?.clientbeneficiaireId ?? b.clientBeneficiaireId,
            infoId: info?.id ?? b.clientbeneficiaireInfoId,
            nomComplet: `${info?.prenom || ''} ${info?.nom || ''}`.trim() || 'Passager inconnu',
            servicePreferenceIds: [],
          };
        })
      : []
  );

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Deux preuves (FRONTEND_PROMPT_DEUX_PREUVES_RESERVATION.md) : obligatoires à la première réservation
  const [preuveAcceptationClient, setPreuveAcceptationClient] = useState<File | null>(null);
  const [preuveResa, setPreuveResa] = useState<File | null>(null);
  const [preuvesManquantes, setPreuvesManquantes] = useState(false);
  const [prefParPassager, setPrefParPassager] = useState<Record<string, string[]>>({});

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ─── Calculs dérivés ─────────────────────────────────────
  const nombrePassagers = prospection?.nombre || 0;
  const totalBillet = formData.puResaBilletCompagnieDevise * nombrePassagers;
  const totalService = formData.puResaServiceCompagnieDevise * nombrePassagers;
  const totalPenalite = formData.puResaPenaliteCompagnieDevise * nombrePassagers;
  const totalCompagnie = totalBillet + totalService + totalPenalite;

  const isFormValid =
    formData.reservation.trim() !== '' &&
    selectedPassagers.length === nombrePassagers &&
    formData.puResaBilletCompagnieDevise > 0 &&
    formData.resaTauxEchange > 0;

  const currentBeneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
  const selectedInfoDetails = infosList.find((info) => info.id === currentInfoId);
  const documentExpire =
    !!selectedInfoDetails && new Date(selectedInfoDetails.dateValiditeDoc) < new Date();

  const infosFiltrees = infosList.filter(
    (info) =>
      !prospection?.typePassager ||
      info.clientType === null ||
      info.clientType === prospection?.typePassager
  );

  // Services actifs sur cette ligne (valeur !== "false" et !== "")
  const servicesActifs = (prospection?.serviceProspectionLigne || []).filter(
    (s: any) => s.valeur && s.valeur !== 'false' && s.valeur !== ''
  );

  // En modification, un passager absent de prefParPassager garde les préférences de son billet.
  // Le billet les stocke en libellés ("Chien") alors que l'API attend des ids : on les retrouve
  // parmi les préférences des services actifs (calculé à l'affichage, les services pouvant arriver après).
  const prefsInitiales = (infoId: string): string[] => {
    if (!estModification) return [];
    const libelles: string[] =
      ligne?.billet?.find((b: any) => b.clientbeneficiaireInfoId === infoId)?.servicePreference || [];
    if (libelles.length === 0) return [];
    return servicesActifs
      .flatMap((sa: any) => servicesStore.find((s) => s.id === sa.serviceSpecifiqueId)?.servicePreference || [])
      .filter((pref: ServicePreference) => libelles.includes(pref.preference))
      .map((pref: ServicePreference) => pref.id);
  };
  const getPrefs = (infoId: string) => prefParPassager[infoId] ?? prefsInitiales(infoId);

  const lignesTarifs: Array<{
    key: PuKey;
    label: string;
    required?: boolean;
    editable: boolean;
    total: number;
    original?: number | null;
  }> = [
    {
      key: 'puResaBilletCompagnieDevise',
      label: 'Billet',
      required: true,
      editable: true,
      total: totalBillet,
      original: prospection?.puBilletCompagnieDevise,
    },
    {
      key: 'puResaServiceCompagnieDevise',
      label: 'Service',
      editable: true,
      total: totalService,
      original: prospection?.puServiceCompagnieDevise,
    },
    {
      key: 'puResaPenaliteCompagnieDevise',
      label: 'Pénalité',
      editable: false,
      total: totalPenalite,
      original: prospection?.puPenaliteCompagnieDevise,
    },
  ];

  const lignesClient = [
    { label: 'Billet', devise: prospection?.montantBilletClientDevise, ariary: prospection?.montantBilletClientAriary },
    { label: 'Service', devise: prospection?.montantServiceClientDevise, ariary: prospection?.montantServiceClientAriary },
    { label: 'Pénalité', devise: prospection?.montantPenaliteClientDevise, ariary: prospection?.montantPenaliteClientAriary },
  ];

  // ─── Effets ──────────────────────────────────────────────
  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
    }
  }, [currentBeneficiaireId, dispatch]);

  // Mise à jour automatique des montants totaux
  useEffect(() => {
    if (nombrePassagers > 0) {
      setFormData((prev) => ({
        ...prev,
        puResaMontantBilletCompagnieDevise: totalBillet,
        puResaMontantServiceCompagnieDevise: totalService,
        puResaMontantPenaliteCompagnieDevise: totalPenalite,
      }));
    }
  }, [nombrePassagers, totalBillet, totalService, totalPenalite]);

  // Initialisation des tarifs compagnie depuis prospectionLigne (nouvelle réservation seulement)
  useEffect(() => {
    if (isOpen && ligne?.prospectionLigne && !estModification) {
      setFormData((prev) => ({
        ...prev,
        puResaBilletCompagnieDevise: ligne.prospectionLigne.puBilletCompagnieDevise || 0,
        puResaServiceCompagnieDevise: ligne.prospectionLigne.puServiceCompagnieDevise || 0,
        puResaPenaliteCompagnieDevise: ligne.prospectionLigne.puPenaliteCompagnieDevise || 0,
      }));
    }
  }, [isOpen, ligne, estModification]);


  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="beneficiaire"]') && !triggerRef.current?.contains(target)) {
        setDropdownOpen(false);
      }
    };

    // Recalculer la position si scroll dans le modal
    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [dropdownOpen]);

  // ─── Handlers ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        'puResaBilletCompagnieDevise',
        'puResaServiceCompagnieDevise',
        'puResaPenaliteCompagnieDevise',
        'resaTauxEchange',
        'puResaMontantBilletCompagnieDevise',
        'puResaMontantServiceCompagnieDevise',
        'puResaMontantPenaliteCompagnieDevise',
      ].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  // Première réservation : les deux preuves sont obligatoires ; en modification, l'existant est gardé
  const preuvesObligatoires = !estModification;
  const messagePreuvesManquantes = (): string | null => {
    if (!preuvesObligatoires) return null;
    if (!preuveAcceptationClient) return "La preuve d'acceptation du client est obligatoire";
    if (!preuveResa) return 'La capture du n° de réservation est obligatoire';
    return null;
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setDropdownOpen((v) => !v);
  };

  const choisirBeneficiaire = (b: any | null) => {
    setCurrentInfoId('');
    setDropdownOpen(false);
    if (!b) {
      setCurrentBeneficiaireId('');
      return;
    }
    setCurrentBeneficiaireId(b.clientBeneficiaireId);
    dispatch(fetchPreferencesBeneficiaire(b.clientBeneficiaireId));
    setPrefBeneficiaire(b);
  };

  const addPassager = () => {
    if (!currentBeneficiaireId || !currentInfoId) {
      toast.warning('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }
    if (selectedPassagers.length >= nombrePassagers) {
      toast.warning(`Nombre maximum de passagers atteint (${nombrePassagers})`);
      return;
    }
    if (selectedPassagers.some((p) => p.infoId === currentInfoId)) {
      toast.warning('Ce passager est déjà dans la liste');
      return;
    }

    const beneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find((i) => i.id === currentInfoId);
    if (!beneficiaire || !info) return;

    const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim() || beneficiaire.clientBeneficiaire.libelle;

    setSelectedPassagers((prev) => [
      ...prev,
      { beneficiaireId: currentBeneficiaireId, infoId: currentInfoId, nomComplet, servicePreferenceIds: [] },
    ]);
    setPrefParPassager((prev) => ({ ...prev, [currentInfoId]: [] }));
    setCurrentBeneficiaireId('');
    setCurrentInfoId('');
  };

  const removePassager = (infoId: string) => {
    setSelectedPassagers((prev) => prev.filter((p) => p.infoId !== infoId));
    setPrefParPassager((prev) => {
      const next = { ...prev };
      delete next[infoId];
      return next;
    });
  };

  const togglePreference = (infoId: string, prefId: string) => {
    setPrefParPassager((prev) => {
      const current = prev[infoId] ?? getPrefs(infoId);
      return {
        ...prev,
        [infoId]: current.includes(prefId) ? current.filter((id) => id !== prefId) : [...current, prefId],
      };
    });
  };

  const handleShowConfirmation = () => {
    if (!isFormValid) {
      toast.warning('Veuillez compléter tous les champs obligatoires.');
      return;
    }
    const manque = messagePreuvesManquantes();
    if (manque) {
      setPreuvesManquantes(true);
      toast.warning(manque);
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmAndSubmit = () => {
    if (loading) return;
    const payload = {
      passagers: selectedPassagers.map((p) => ({
        clientbeneficiaireInfoId: p.infoId,
        clientBeneficiaireId: p.beneficiaireId,
        servicePreferenceIds: getPrefs(p.infoId),
      })),
      nombre: nombrePassagers,
      reservation: formData.reservation,
      puResaBilletCompagnieDevise: formData.puResaBilletCompagnieDevise,
      puResaServiceCompagnieDevise: formData.puResaServiceCompagnieDevise,
      puResaPenaliteCompagnieDevise: formData.puResaPenaliteCompagnieDevise,
      devise: formData.devise,
      resaTauxEchange: formData.resaTauxEchange,
      // puResaMontant… : calculés par le backend (FRONTEND_PROMPT_CALCUL_PRIX_BACKEND.md)
      preuveAcceptationClient,
      preuveResa,
    };

    onSubmit(payload);
    setShowConfirmation(false);
  };

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const placesRestantes = Math.max(0, nombrePassagers - selectedPassagers.length);
  const quotaAtteint = selectedPassagers.length === nombrePassagers && nombrePassagers > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[95vh] w-full max-w-[1400px] items-stretch justify-center gap-3">
        {/* ═══ Modal principale ═══ */}
        <div className="flex w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {estModification ? 'Modifier la réservation' : 'Nouvelle réservation'}
                </h2>
                {estModification && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    Réservation existante
                  </span>
                )}
              </div>
              {(prospection?.numeroVol || prospection?.itineraire) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  {prospection?.numeroVol && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      Vol {prospection.numeroVol}
                    </span>
                  )}
                  {prospection?.itineraire && <span>{prospection.itineraire}</span>}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <FiX size={18} />
            </button>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
            <div className="space-y-5">
              {/* 1. Passagers */}
              <Section
                step={1}
                title="Passagers"
                description={`${nombrePassagers} passager${nombrePassagers > 1 ? 's' : ''} à renseigner`}
                aside={
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                      quotaAtteint
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedPassagers.length} / {nombrePassagers}
                  </span>
                }
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Sélection */}
                  <div className="space-y-4">
                    <div>
                      <Label required>Bénéficiaire</Label>
                      <button
                        ref={triggerRef}
                        type="button"
                        onClick={toggleDropdown}
                        className={`${inputCls} flex items-center justify-between gap-2 text-left`}
                      >
                        {currentBeneficiaire ? (
                          <span className="flex min-w-0 items-center gap-2">
                            <TypeClientBadge type={currentBeneficiaire.clientBeneficiaire.typeClient} />
                            <span className="truncate font-medium">{currentBeneficiaire.clientBeneficiaire.libelle}</span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {currentBeneficiaire.clientBeneficiaire.code}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Sélectionner un bénéficiaire</span>
                        )}
                        <FiChevronDown
                          className={`shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {dropdownOpen &&
                        ReactDOM.createPortal(
                          <div
                            data-dropdown="beneficiaire"
                            style={{
                              position: 'absolute',
                              top: dropdownPos.top,
                              left: dropdownPos.left,
                              width: dropdownPos.width,
                              zIndex: 9999,
                            }}
                            className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
                          >
                            <div className="max-h-60 overflow-y-auto py-1">
                              {beneficiaires.length === 0 && (
                                <p className="px-3 py-2 text-sm text-slate-400">Aucun bénéficiaire sur ce dossier</p>
                              )}
                              {beneficiaires.map((b) => {
                                const isSelected = currentBeneficiaireId === b.clientBeneficiaireId;
                                return (
                                  <button
                                    key={b.clientBeneficiaireId}
                                    type="button"
                                    onClick={() => choisirBeneficiaire(b)}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                                      isSelected ? 'bg-slate-50' : ''
                                    }`}
                                  >
                                    <TypeClientBadge type={b.clientBeneficiaire.typeClient} />
                                    <span className="flex-1 truncate font-medium text-slate-900">
                                      {b.clientBeneficiaire.libelle}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-400">{b.clientBeneficiaire.code}</span>
                                    {isSelected && <FiCheck className="shrink-0 text-slate-900" size={14} />}
                                  </button>
                                );
                              })}
                            </div>
                            {currentBeneficiaireId && (
                              <button
                                type="button"
                                onClick={() => choisirBeneficiaire(null)}
                                className="w-full border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
                              >
                                Effacer la sélection
                              </button>
                            )}
                          </div>,
                          document.body
                        )}
                    </div>

                    {currentBeneficiaireId && (
                      <div>
                        <Label required>Document du passager</Label>
                        {infosLoading ? (
                          <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                            Chargement des documents…
                          </div>
                        ) : infosFiltrees.length === 0 ? (
                          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Aucun document trouvé pour ce bénéficiaire.
                          </p>
                        ) : (
                          <select
                            value={currentInfoId}
                            onChange={(e) => setCurrentInfoId(e.target.value)}
                            className={inputCls}
                          >
                            <option value="">Sélectionner un document</option>
                            {infosFiltrees.map((info) => (
                              <option key={info.id} value={info.id}>
                                {info.prenom} {info.nom} – {info.typeDoc} {info.referenceDoc}
                                {info.clientType ? ` (${info.clientType})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {selectedInfoDetails && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                          </p>
                          {documentExpire && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-200">
                              Document expiré
                            </span>
                          )}
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                          <Detail label="Type passager">{selectedInfoDetails.clientType ?? '—'}</Detail>
                          <Detail label="Nationalité">{selectedInfoDetails.nationalite || '—'}</Detail>
                          <Detail label={selectedInfoDetails.typeDoc || 'Document'}>
                            {selectedInfoDetails.referenceDoc}
                          </Detail>
                          <Detail label="Délivré le">{formatDate(selectedInfoDetails.dateDelivranceDoc)}</Detail>
                          <Detail label="Valide jusqu’au">
                            <span className={documentExpire ? 'font-medium text-red-600' : ''}>
                              {formatDate(selectedInfoDetails.dateValiditeDoc)}
                            </span>
                          </Detail>
                          {selectedInfoDetails.referenceCin && (
                            <Detail label="CIN">{selectedInfoDetails.referenceCin}</Detail>
                          )}
                          {selectedInfoDetails.tel && <Detail label="Téléphone">{selectedInfoDetails.tel}</Detail>}
                          {selectedInfoDetails.whatsapp && (
                            <Detail label="WhatsApp">{selectedInfoDetails.whatsapp}</Detail>
                          )}
                        </dl>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FiPaperclip size={13} />
                            Pièce jointe
                          </span>
                          {selectedInfoDetails.document ? (
                            <a
                              href={fichierUrl(selectedInfoDetails.document)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <FiExternalLink size={13} />
                              Voir le fichier
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Aucun fichier joint</span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addPassager}
                      disabled={!currentBeneficiaireId || !currentInfoId || selectedPassagers.length >= nombrePassagers}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <FiUserPlus size={15} />
                      Ajouter le passager
                    </button>
                  </div>

                  {/* Liste */}
                  <div>
                    <Label>Passagers ajoutés</Label>
                    <ul className="max-h-[400px] space-y-2 overflow-y-auto">
                      {selectedPassagers.map((p, idx) => (
                        <li
                          key={p.infoId}
                          className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{p.nomComplet}</p>
                            <p className="text-[11px] text-slate-400">Réf. {p.infoId.slice(0, 8)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePassager(p.infoId)}
                            aria-label={`Retirer ${p.nomComplet}`}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </li>
                      ))}
                      {Array.from({ length: placesRestantes }).map((_, i) => (
                        <li
                          key={`vide-${i}`}
                          className="flex items-center gap-3 rounded-md border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs">
                            {selectedPassagers.length + i + 1}
                          </span>
                          Passager à ajouter
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>

              {/* 2. Réservation */}
              <Section step={2} title="Réservation">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label required>N° de réservation</Label>
                    <input
                      type="text"
                      name="reservation"
                      value={formData.reservation}
                      onChange={handleChange}
                      placeholder="RES-2026-002"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>Devise</Label>
                    <input type="text" value={formData.devise} readOnly className={`${inputCls} font-medium`} />
                  </div>
                  <div>
                    <Label required>Taux de change</Label>
                    <div className="relative">
                      <input
                        type="number"
                        name="resaTauxEchange"
                        value={formData.resaTauxEchange}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="4500"
                        className={`${inputCls} pr-10 tabular-nums`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        Ar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                  <div>
                    <Label required={preuvesObligatoires} hint={preuvesObligatoires ? undefined : 'optionnel'}>
                      Preuve d'acceptation du client
                    </Label>
                    <p className="mb-2 text-xs text-slate-500">WhatsApp, e-mail, bon signé…</p>
                    <ChampPreuve
                      libelleErreur="La preuve d'acceptation du client"
                      placeholder="Choisir la preuve du client"
                      file={preuveAcceptationClient}
                      onChange={(f) => { setPreuveAcceptationClient(f); setPreuvesManquantes(false); }}
                      existant={estModification ? ligne?.preuveAcceptationClient : null}
                      onErreur={(m) => toast.error(m)}
                      enErreur={preuvesManquantes && preuvesObligatoires && !preuveAcceptationClient}
                    />
                  </div>
                  <div>
                    <Label required={preuvesObligatoires} hint={preuvesObligatoires ? undefined : 'optionnel'}>
                      Capture du n° de réservation
                    </Label>
                    <p className="mb-2 text-xs text-slate-500">Écran de la plateforme de la compagnie</p>
                    <ChampPreuve
                      libelleErreur="La capture du n° de réservation"
                      placeholder="Choisir la capture"
                      file={preuveResa}
                      onChange={(f) => { setPreuveResa(f); setPreuvesManquantes(false); }}
                      existant={estModification ? ligne?.preuveResa : null}
                      onErreur={(m) => toast.error(m)}
                      enErreur={preuvesManquantes && preuvesObligatoires && !preuveResa}
                    />
                  </div>
                </div>
              </Section>

              {/* 3. Tarifs compagnie */}
              <Section
                step={3}
                title={`Tarifs compagnie (${formData.devise})`}
                description="Pré-remplis depuis la prospection, modifiables si nécessaire."
              >
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Élément</th>
                        <th className="px-4 py-2 text-left font-medium">Prix unitaire</th>
                        <th className="px-4 py-2 text-right font-medium">Prospection</th>
                        <th className="px-4 py-2 text-right font-medium">
                          Total ({nombrePassagers} pax)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lignesTarifs.map((row) => (
                        <tr key={row.key}>
                          <td className="px-4 py-2.5 font-medium text-slate-700">
                            {row.label}
                            {row.required && <span className="ml-0.5 text-red-500">*</span>}
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative w-44">
                              <input
                                type="number"
                                name={row.key}
                                value={formData[row.key]}
                                onChange={handleChange}
                                disabled={!row.editable}
                                step="0.01"
                                className={`${inputCls} pr-12 text-right tabular-nums`}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                {formData.devise}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{fmt(row.original)}</td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-900">
                            {formatMontant(row.total)} {formData.devise}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-sm font-medium text-slate-700">
                          Total compagnie
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatMontant(totalCompagnie)} {formData.devise}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Section>

              {/* 4. Tarifs client */}
              <Section step={4} title="Tarifs client" description="Repris de la prospection, en lecture seule.">
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Élément</th>
                        <th className="px-4 py-2 text-right font-medium">Devise</th>
                        <th className="px-4 py-2 text-right font-medium">Ariary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lignesClient.map((row) => (
                        <tr key={row.label}>
                          <td className="px-4 py-2.5 text-slate-700">{row.label}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">{fmt(row.devise)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">{fmt(row.ariary, ' Ar')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50">
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-slate-700">Commission</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {fmt(prospection?.commissionEnDevise)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {fmt(prospection?.commissionEnAriary, ' Ar')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Section>

              {/* 5. Préférences de services */}
              {servicesActifs.length > 0 && selectedPassagers.length > 0 && (
                <Section
                  step={5}
                  title="Préférences de services"
                  description="Choisissez, pour chaque passager, les préférences liées aux services de la ligne."
                >
                  <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {selectedPassagers.map((passager, idx) => {
                      const prefsPassager = getPrefs(passager.infoId);
                      return (
                        <div key={passager.infoId} className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-900">{passager.nomComplet}</span>
                            {prefsPassager.length > 0 && (
                              <span className="ml-auto text-xs text-slate-500">
                                {prefsPassager.length} préférence{prefsPassager.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {servicesActifs.map((serviceActif: any) => {
                              const serviceStore = servicesStore.find((s) => s.id === serviceActif.serviceSpecifiqueId);
                              const prefsDisponibles: ServicePreference[] = serviceStore?.servicePreference || [];
                              const nbChoisies = prefsDisponibles.filter((p) => prefsPassager.includes(p.id)).length;

                              return (
                                <div key={serviceActif.id} className="rounded-md border border-slate-200 p-3">
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-semibold text-slate-700">
                                      {serviceStore?.libelle || serviceActif.serviceSpecifique?.libelle || '—'}
                                    </span>
                                    {prefsDisponibles.length > 0 && (
                                      <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                                        {nbChoisies}/{prefsDisponibles.length}
                                      </span>
                                    )}
                                  </div>

                                  {prefsDisponibles.length === 0 ? (
                                    <p className="text-xs text-slate-400">Aucune préférence disponible</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {prefsDisponibles.map((pref) => {
                                        const isSelected = prefsPassager.includes(pref.id);
                                        return (
                                          <button
                                            key={pref.id}
                                            type="button"
                                            aria-pressed={isSelected}
                                            onClick={() => togglePreference(passager.infoId, pref.id)}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                              isSelected
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                                            }`}
                                          >
                                            {isSelected && <FiCheck size={11} />}
                                            {pref.preference}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                <span className="text-red-500">*</span> Champs obligatoires
              </span>
              <span className="hidden sm:inline">
                Total compagnie :{' '}
                <strong className="font-semibold tabular-nums text-slate-900">
                  {formatMontant(totalCompagnie)} {formData.devise}
                </strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleShowConfirmation}
                disabled={!isFormValid || loading}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <FiCheck size={15} />
                {loading ? 'Envoi en cours…' : 'Vérifier et confirmer'}
              </button>
            </div>
          </footer>
        </div>

        {/* ═══ Panneau préférences du bénéficiaire, à droite de la modal ═══ */}
        {prefBeneficiaire && (
          <aside className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <PreferencesInlinePanel beneficiaire={prefBeneficiaire} onClose={() => setPrefBeneficiaire(null)} />
          </aside>
        )}
      </div>

      {/* ═══ Confirmation ═══ */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <header className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Confirmer la réservation</h3>
              <p className="mt-0.5 text-sm text-slate-500">Vérifiez les informations avant l’envoi.</p>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Detail label="N° de réservation">
                  <span className="font-semibold">{formData.reservation || '—'}</span>
                </Detail>
                <Detail label="Devise">{formData.devise}</Detail>
                <Detail label="Taux de change">{formData.resaTauxEchange.toLocaleString('fr-FR')} Ar</Detail>
                <Detail label="Passagers">{nombrePassagers}</Detail>
              </dl>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700">Passagers</h4>
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {selectedPassagers.map((p, idx) => {
                    const nbPrefs = getPrefs(p.infoId).length;
                    return (
                      <li key={p.infoId} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="w-5 text-right tabular-nums text-slate-400">{idx + 1}.</span>
                        <span className="flex-1 truncate font-medium text-slate-900">{p.nomComplet}</span>
                        {nbPrefs > 0 && (
                          <span className="text-xs text-slate-500">
                            {nbPrefs} préférence{nbPrefs > 1 ? 's' : ''}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700">Montants compagnie</h4>
                <table className="w-full overflow-hidden rounded-md border border-slate-200 text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {lignesTarifs.map((row) => (
                      <tr key={row.key}>
                        <td className="px-3 py-2 text-slate-600">{row.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                          {formatMontant(row.total)} {formData.devise}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">Total</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                        {formatMontant(totalCompagnie)} {formData.devise}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {(preuveAcceptationClient || preuveResa) && (
                <div className="space-y-0.5 text-sm text-slate-600">
                  {preuveAcceptationClient && (
                    <p>Acceptation client : <span className="font-medium text-slate-900">{preuveAcceptationClient.name}</span></p>
                  )}
                  {preuveResa && (
                    <p>Capture n° résa : <span className="font-medium text-slate-900">{preuveResa.name}</span></p>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
                <p>Une fois confirmée, cette action est irréversible.</p>
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3.5">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiCheck size={15} />
                {loading ? 'Envoi en cours…' : 'Confirmer et envoyer'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationModal;