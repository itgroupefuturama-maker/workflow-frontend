// src/components/modals/ReprogrammationModal.tsx
// Reprogrammation d'une ligne billet en 3 étapes : Modification → Prix & frais → Récapitulatif.
// Contrat API : FRONTEND_PROMPT_REPROGRAMMATION_FRAIS.md. Les montants Ariary sont calculés ici
// (devise × taux, arrondi à l'entier) et envoyés tels quels : le backend ne recalcule rien.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  FiX, FiAlertTriangle, FiCheck, FiTrash2, FiChevronDown, FiChevronLeft, FiChevronRight, FiArrowRight, FiPlus,
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice';
import type {
  ALaChargeDe,
  BilletLigne,
  FraisReprogrammationPayload,
  ReprogrammationPayload,
  ServiceSpecifique,
  TypeFraisReprogrammation,
} from '../../app/front_office/billetSlice';
import { fetchRaisonsAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import { selectServicesByType, type ServicePreference } from '../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import { toast } from '../Toast/toast';
import Button from '../ui/Button';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReprogrammationPayload) => void;
  ligne: BilletLigne | null | undefined;
  loading?: boolean;
  serviceById: Map<string, ServiceSpecifique>;
}

type Step = 1 | 2 | 3;

interface Passager {
  beneficiaireId: string;
  infoId: string;
  nomComplet: string;
  typeDoc?: string;
  referenceDoc?: string;
}

interface FraisSaisie {
  montant: string;               // saisie brute en devise ('' = pas de frais)
  aLaChargeDe: ALaChargeDe | null;
}

const CLASSES = [
  { value: 'ECONOMIE', label: 'Économie' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
];
const classeRank = (c?: string | null) => CLASSES.findIndex((x) => x.value === c);
const classeLabel = (c?: string | null) => CLASSES.find((x) => x.value === c)?.label || c || '—';

const FRAIS_LABELS: Record<TypeFraisReprogrammation, { label: string; aide: string }> = {
  COMMISSION: { label: 'Commission', aide: "Commission de l'agence sur la modification" },
  SERVICE: { label: 'Frais de service', aide: 'Frais de service liés à la modification' },
  PENALITE: { label: 'Pénalité', aide: 'Pénalité appliquée par la compagnie' },
  SURCLASSEMENT: { label: 'Surclassement', aide: 'Différence de prix vers la classe supérieure' },
};
const FRAIS_ORDER: TypeFraisReprogrammation[] = ['COMMISSION', 'SERVICE', 'PENALITE', 'SURCLASSEMENT'];

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Modification' },
  { id: 2, label: 'Prix & frais' },
  { id: 3, label: 'Récapitulatif' },
];

// Valeur d'un <input type="datetime-local"> en heure LOCALE (toISOString() décalerait de l'offset UTC).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmtDate = (local: string) =>
  local ? new Date(local).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const parseMontant = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
const toAriary = (devise: number, taux: number) => Math.round(devise * taux);
const fmtAr = (n: number) => `${n.toLocaleString('fr-FR')} Ar`;
const fmtDev = (n: number, devise: string) =>
  `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;

// ─── Styles partagés ────────────────────────────────────────
const inputCls =
  'w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-500 transition';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';
const hintCls = 'text-xs text-slate-500 mt-1.5';
const readonlyCls =
  'flex h-10 items-center justify-between px-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 tabular-nums';
const Required = () => <span className="text-red-500">*</span>;

export default function ReprogrammationModal({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  loading = false,
  serviceById,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );
  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );
  const { items: raisons, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );
  const servicesStore = useSelector(selectServicesByType('TICKET'));

  const pl = ligne?.prospectionLigne;
  const devise = ligne?.devise || pl?.devise || 'EUR';

  // Valeurs d'origine (pour signaler ce qui change)
  const origine = useMemo(
    () => ({
      classe: pl?.classe || 'ECONOMIE',
      depart: toLocalInput(pl?.dateHeureDepart),
      arrive: toLocalInput(pl?.dateHeureArrive),
    }),
    [pl]
  );

  const [step, setStep] = useState<Step>(1);

  // ─── Étape 1 : modification ───────────────────────────────
  const [raisonAnnulationId, setRaisonAnnulationId] = useState('');
  const [conditionModif, setConditionModif] = useState('');
  const [dateHeureDepart, setDateHeureDepart] = useState(origine.depart);
  const [dateHeureArrive, setDateHeureArrive] = useState(origine.arrive);
  const [classe, setClasse] = useState(origine.classe);
  const [services, setServices] = useState<{ serviceSpecifiqueId: string; valeur: string }[]>(
    pl?.serviceProspectionLigne?.map((s) => ({ serviceSpecifiqueId: s.serviceSpecifiqueId, valeur: s.valeur })) || []
  );
  // Pré-sélection des passagers déjà liés à la ligne (la modal est remontée à chaque ouverture)
  const [selectedPassagers, setSelectedPassagers] = useState<Passager[]>(() =>
    (ligne?.billet || []).map((b) => {
      const info = b.clientbeneficiaireInfo;
      return {
        beneficiaireId: info.clientbeneficiaireId,
        infoId: info.id,
        nomComplet: `${info.prenom || ''} ${info.nom || ''}`.trim() || 'Passager inconnu',
        typeDoc: info.typeDoc,
        referenceDoc: info.referenceDoc,
      };
    })
  );
  // Préférences modifiées dans la modal, par passager. Un passager absent de cette map garde
  // les préférences déjà enregistrées sur son billet (voir getPrefs).
  const [prefParPassager, setPrefParPassager] = useState<Record<string, string[]>>({});
  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');

  // ─── Étape 2 : prix & frais ───────────────────────────────
  const [tauxChange, setTauxChange] = useState<string>(
    String(ligne?.resaTauxEchange || pl?.tauxEchange || '')
  );
  // Prix de réservation actuels de la ligne (PU Cie devise réservation) : valeur initiale et base du surclassement
  const ancienPuBillet = Number(ligne?.puResaBilletCompagnieDevise) || 0;
  const ancienPuService = Number(ligne?.puResaServiceCompagnieDevise) || 0;
  const [puBillet, setPuBillet] = useState<string>(String(ancienPuBillet));
  // PU service non modifiable : le coût de service de la modification passe par le frais SERVICE
  // (« Frais de la modification »), sinon il serait compté deux fois
  const puService = String(ancienPuService);
  const [frais, setFrais] = useState<Record<TypeFraisReprogrammation, FraisSaisie>>({
    COMMISSION: { montant: '', aLaChargeDe: null },
    SERVICE: { montant: '', aLaChargeDe: null },
    PENALITE: { montant: '', aLaChargeDe: null },
    SURCLASSEMENT: { montant: '', aLaChargeDe: null },
  });

  useEffect(() => {
    if (isOpen) dispatch(fetchRaisonsAnnulation());
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (currentBeneficiaireId) dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
  }, [currentBeneficiaireId, dispatch]);

  // Fermeture avec Échap (bloquée pendant l'enregistrement)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  // ─── Valeurs dérivées ─────────────────────────────────────
  const taux = parseMontant(tauxChange);
  const nbPassagers = selectedPassagers.length;
  const estSurclassement = classeRank(classe) > classeRank(origine.classe);
  const fraisVisibles = FRAIS_ORDER.filter((t) => t !== 'SURCLASSEMENT' || estSurclassement);

  const changements = {
    dates: dateHeureDepart !== origine.depart || dateHeureArrive !== origine.arrive,
    classe: classe !== origine.classe,
  };

  const servicesActifs = (pl?.serviceProspectionLigne || []).filter(
    (s) => s.valeur && s.valeur !== 'false' && s.valeur !== ''
  );

  // Le billet stocke les préférences en libellés ("Chien", "Chat") alors que l'API attend des ids :
  // on retrouve les ids parmi les préférences des services actifs de la ligne. Calculé à l'affichage
  // (et non à l'ouverture) pour fonctionner même si les services sont chargés après.
  const prefsInitiales = (infoId: string): string[] => {
    const libelles = ligne?.billet?.find((b) => b.clientbeneficiaireInfoId === infoId)?.servicePreference || [];
    if (libelles.length === 0) return [];
    return servicesActifs
      .flatMap((sa) => servicesStore.find((s) => s.id === sa.serviceSpecifiqueId)?.servicePreference || [])
      .filter((pref) => libelles.includes(pref.preference))
      .map((pref) => pref.id);
  };
  const getPrefs = (infoId: string) => prefParPassager[infoId] ?? prefsInitiales(infoId);

  // Surclassement non saisi : (nouveau PU billet − PU billet de réservation actuel) × passagers
  const diffPuBillet = parseMontant(puBillet) - ancienPuBillet;
  const montantSurclassement = estSurclassement ? Math.max(0, diffPuBillet) * nbPassagers : 0;
  const montantFrais = (t: TypeFraisReprogrammation) =>
    t === 'SURCLASSEMENT' ? montantSurclassement : parseMontant(frais[t].montant);

  const fraisPayload: FraisReprogrammationPayload[] = fraisVisibles
    .filter((t) => montantFrais(t) > 0)
    .map((t) => {
      const montantDevise = montantFrais(t);
      return {
        typeFrais: t,
        montantDevise,
        montantAriary: toAriary(montantDevise, taux),
        aLaChargeDe: frais[t].aLaChargeDe as ALaChargeDe,
      };
    });

  const totalClientAr = fraisPayload.filter((f) => f.aLaChargeDe === 'CLIENT').reduce((s, f) => s + f.montantAriary, 0);
  const totalAgenceAr = fraisPayload.filter((f) => f.aLaChargeDe === 'AGENCE').reduce((s, f) => s + f.montantAriary, 0);

  const totalBilletDevise = (parseMontant(puBillet) + parseMontant(puService)) * nbPassagers;

  // ─── Contrôles par étape ──────────────────────────────────
  const erreursEtape1 = (): string[] => {
    const e: string[] = [];
    if (!conditionModif.trim()) e.push('La condition de modification est obligatoire.');
    if (nbPassagers === 0) e.push('Au moins un passager est requis.');
    if (!classe) e.push('La classe est obligatoire.');
    if (!dateHeureDepart || isNaN(new Date(dateHeureDepart).getTime())) e.push('Date de départ invalide.');
    if (!dateHeureArrive || isNaN(new Date(dateHeureArrive).getTime())) e.push("Date d'arrivée invalide.");
    if (dateHeureDepart && dateHeureArrive && new Date(dateHeureArrive) <= new Date(dateHeureDepart)) {
      e.push("L'arrivée doit être après le départ.");
    }
    return e;
  };

  const erreursEtape2 = (): string[] => {
    const e: string[] = [];
    if (!(taux > 0)) e.push('Le taux de change doit être supérieur à 0.');
    if (parseMontant(puBillet) < 0 || parseMontant(puService) < 0) e.push('Les prix ne peuvent pas être négatifs.');
    fraisVisibles.forEach((t) => {
      const m = montantFrais(t);
      if (m < 0) e.push(`${FRAIS_LABELS[t].label} : montant négatif.`);
      if (m > 0 && !frais[t].aLaChargeDe) e.push(`${FRAIS_LABELS[t].label} : choisir « À la charge de ».`);
    });
    return e;
  };

  const goTo = (target: Step) => {
    if (target > step) {
      const e1 = erreursEtape1();
      const e2 = target === 3 ? erreursEtape2() : [];
      if (e1.length || e2.length) {
        toast.warning([...e1, ...e2].join('\n'));
        // Ramène sur la première étape en défaut
        setStep(e1.length ? 1 : 2);
        return;
      }
    }
    setStep(target);
  };

  const buildPayload = (): ReprogrammationPayload => ({
    id: ligne!.id,
    conditionModif: conditionModif.trim(),
    raisonAnnulationId: raisonAnnulationId || null,
    resaTauxEchange: taux,
    devise,
    classe,
    dateHeureDepart: new Date(dateHeureDepart).toISOString(),
    dateHeureArrive: new Date(dateHeureArrive).toISOString(),
    passagers: selectedPassagers.map((p) => ({
      clientbeneficiaireInfoId: p.infoId,
      clientBeneficiaireId: p.beneficiaireId,
      servicePreferenceIds: getPrefs(p.infoId),
    })),
    services: services.map((s) => ({ serviceSpecifiqueId: s.serviceSpecifiqueId, valeur: s.valeur })),
    puResaBilletCompagnieDevise: parseMontant(puBillet),
    puResaServiceCompagnieDevise: parseMontant(puService),
    // Même convention que ReservationModal : montant = PU × nombre de passagers, en devise
    puResaMontantBilletCompagnieDevise: parseMontant(puBillet) * nbPassagers,
    puResaMontantServiceCompagnieDevise: parseMontant(puService) * nbPassagers,
    frais: fraisPayload,
  });

  const handleConfirm = () => {
    const erreurs = [...erreursEtape1(), ...erreursEtape2()];
    if (erreurs.length) {
      toast.error(erreurs.join('\n'));
      return;
    }
    onSubmit(buildPayload());
  };

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;
  if (!ligne) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <FiAlertTriangle className="text-red-600" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-900">Ligne indisponible</p>
          <p className="mt-1 mb-5 text-sm text-slate-500">La ligne à reprogrammer n'a pas pu être chargée.</p>
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    );
  }

  // ─── Passagers ────────────────────────────────────────────
  const selectedInfoDetails = infosList.find((info) => info.id === currentInfoId);

  const addPassager = () => {
    const beneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find((i) => i.id === currentInfoId);
    if (!beneficiaire || !info) {
      toast.warning('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }
    if (selectedPassagers.some((p) => p.infoId === currentInfoId)) {
      toast.warning('Ce document est déjà sélectionné');
      return;
    }
    setSelectedPassagers((prev) => [
      ...prev,
      {
        beneficiaireId: currentBeneficiaireId,
        infoId: currentInfoId,
        nomComplet: `${info.prenom || ''} ${info.nom || ''}`.trim() || beneficiaire.clientBeneficiaire.libelle,
        typeDoc: info.typeDoc,
        referenceDoc: info.referenceDoc,
      },
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

  const setFraisField = (t: TypeFraisReprogrammation, patch: Partial<FraisSaisie>) =>
    setFrais((prev) => ({ ...prev, [t]: { ...prev[t], ...patch } }));

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reprog-modal-title"
        className="flex w-full max-w-5xl max-h-[92vh] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        {/* Header */}
        <div className="border-b border-slate-200 px-6 pt-4 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="reprog-modal-title" className="text-lg font-semibold text-slate-900">
                Reprogrammer la ligne
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                <span className="font-medium text-slate-700">{pl?.itineraire || '—'}</span>
                <span className="mx-1.5 text-slate-300">|</span>
                {classeLabel(origine.classe)}
                <span className="mx-1.5 text-slate-300">|</span>
                Départ {fmtDate(origine.depart)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Fermer"
              className="-mr-2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Stepper */}
          <ol className="mt-4 flex items-center">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-current={active ? 'step' : undefined}
                    className="group flex items-center gap-2 rounded-md py-1 pr-2 text-sm"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : done
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'border border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {done ? <FiCheck size={13} strokeWidth={3} /> : s.id}
                    </span>
                    <span
                      className={`font-medium ${
                        active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                      } group-hover:text-slate-900`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-3 h-px flex-1 ${done ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-5">
          {/* ═══ Étape 1 : Modification ═══ */}
          {step === 1 && (
            <>
              <Section title="Motif">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="reprog-raison" className={labelCls}>Raison</label>
                    {raisonsLoading ? (
                      <div className={`${readonlyCls} text-slate-400`}>Chargement…</div>
                    ) : (
                      <select
                        id="reprog-raison"
                        value={raisonAnnulationId}
                        onChange={(e) => setRaisonAnnulationId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Aucune</option>
                        {raisons
                          .filter((r) => r.statut === 'ACTIF')
                          .map((r) => (
                            <option key={r.id} value={r.id}>{r.libelle}</option>
                          ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label htmlFor="reprog-condition" className={labelCls}>
                      Condition de modification <Required />
                    </label>
                    <input
                      id="reprog-condition"
                      type="text"
                      value={conditionModif}
                      onChange={(e) => setConditionModif(e.target.value)}
                      className={inputCls}
                      placeholder="Ex : changement horaire à la demande du client"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Vol & dates" badge={<ChangeBadge changed={changements.dates} />}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="reprog-depart" className={labelCls}>
                      Départ <Required />
                    </label>
                    <input
                      id="reprog-depart"
                      type="datetime-local"
                      value={dateHeureDepart}
                      onChange={(e) => setDateHeureDepart(e.target.value)}
                      className={inputCls}
                    />
                    <p className={hintCls}>Actuel : {fmtDate(origine.depart)}</p>
                  </div>
                  <div>
                    <label htmlFor="reprog-arrive" className={labelCls}>
                      Arrivée <Required />
                    </label>
                    <input
                      id="reprog-arrive"
                      type="datetime-local"
                      value={dateHeureArrive}
                      onChange={(e) => setDateHeureArrive(e.target.value)}
                      className={inputCls}
                    />
                    <p className={hintCls}>Actuel : {fmtDate(origine.arrive)}</p>
                  </div>
                </div>
              </Section>

              <Section title="Classe & services" badge={<ChangeBadge changed={changements.classe} />}>
                <div className="space-y-5">
                  <div className="md:w-1/2">
                    <label htmlFor="reprog-classe" className={labelCls}>
                      Classe <Required />
                    </label>
                    <select
                      id="reprog-classe"
                      value={classe}
                      onChange={(e) => setClasse(e.target.value)}
                      className={inputCls}
                    >
                      {CLASSES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <p className={hintCls}>Actuelle : {classeLabel(origine.classe)}</p>
                    {estSurclassement && (
                      <Notice>Surclassement : la différence de prix se saisit à l'étape « Prix & frais ».</Notice>
                    )}
                  </div>

                  {services.length > 0 && (
                    <div>
                      <p className={labelCls}>Services spécifiques</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((svc, index) => {
                          const libelle = serviceById.get(svc.serviceSpecifiqueId)?.libelle || 'Service inconnu';
                          const setValeur = (valeur: string) =>
                            setServices((prev) => prev.map((s, i) => (i === index ? { ...s, valeur } : s)));
                          // Les services oui/non sont stockés en 'true' / 'false' : case à cocher plutôt que texte libre
                          const estBooleen = svc.valeur === 'true' || svc.valeur === 'false';
                          return estBooleen ? (
                            <label
                              key={svc.serviceSpecifiqueId}
                              className="flex h-10 cursor-pointer items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={svc.valeur === 'true'}
                                onChange={(e) => setValeur(e.target.checked ? 'true' : 'false')}
                                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                              />
                              <span className="truncate">{libelle}</span>
                            </label>
                          ) : (
                            <div
                              key={svc.serviceSpecifiqueId}
                              className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white pl-3 pr-1"
                            >
                              <span className="flex-1 truncate text-sm text-slate-700">{libelle}</span>
                              <input
                                type="text"
                                value={svc.valeur}
                                onChange={(e) => setValeur(e.target.value)}
                                aria-label={libelle}
                                className="h-8 w-24 rounded border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              <Section
                title="Passagers"
                badge={<CountBadge>{nbPassagers} sélectionné{nbPassagers > 1 ? 's' : ''}</CountBadge>}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Ajout */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="reprog-benef" className={labelCls}>Bénéficiaire</label>
                      <select
                        id="reprog-benef"
                        value={currentBeneficiaireId}
                        onChange={(e) => {
                          setCurrentBeneficiaireId(e.target.value);
                          setCurrentInfoId('');
                        }}
                        className={inputCls}
                      >
                        <option value="">Choisir un bénéficiaire</option>
                        {beneficiaires.map((b) => (
                          <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                            {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentBeneficiaireId && (
                      <div>
                        <label htmlFor="reprog-doc" className={labelCls}>Document</label>
                        {infosLoading ? (
                          <div className={`${readonlyCls} text-slate-400`}>Chargement…</div>
                        ) : (
                          <select
                            id="reprog-doc"
                            value={currentInfoId}
                            onChange={(e) => setCurrentInfoId(e.target.value)}
                            className={inputCls}
                          >
                            <option value="">Choisir un document</option>
                            {infosList
                              .filter((info) => info.clientType === pl?.typePassager)
                              .map((info) => (
                                <option key={info.id} value={info.id}>
                                  {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    )}

                    {selectedInfoDetails && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-900">
                          {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                        </p>
                        <p className="text-slate-500">
                          {selectedInfoDetails.typeDoc} {selectedInfoDetails.referenceDoc} · {selectedInfoDetails.nationalite}
                        </p>
                        {selectedInfoDetails.dateValiditeDoc && (() => {
                          const expire = new Date(selectedInfoDetails.dateValiditeDoc) < new Date();
                          return (
                            <p className={`mt-1 text-xs font-medium ${expire ? 'text-red-600' : 'text-emerald-700'}`}>
                              {expire ? 'Document expiré le ' : "Valide jusqu'au "}
                              {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                            </p>
                          );
                        })()}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addPassager}
                      disabled={!currentBeneficiaireId || !currentInfoId}
                      icon={<FiPlus />}
                      className="w-full justify-center"
                    >
                      Ajouter le passager
                    </Button>
                  </div>

                  {/* Liste */}
                  <div>
                    {nbPassagers === 0 ? (
                      <div className="flex h-full min-h-[8rem] items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-400">
                        Aucun passager sélectionné
                      </div>
                    ) : (
                      <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                        {selectedPassagers.map((p, idx) => (
                          <li key={p.infoId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{p.nomComplet}</p>
                                <p className="truncate text-xs text-slate-500">
                                  {p.typeDoc} {p.referenceDoc ? `· ${p.referenceDoc}` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePassager(p.infoId)}
                              aria-label={`Retirer ${p.nomComplet}`}
                              className="shrink-0 rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Préférences de services par passager */}
                {nbPassagers > 0 && servicesActifs.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-sm font-semibold text-slate-900">Préférences de services</p>
                    <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                      {selectedPassagers.map((passager) => {
                        const prefsPassager = getPrefs(passager.infoId);
                        return (
                          <div key={passager.infoId} className="p-3">
                            <p className="mb-2 text-sm font-medium text-slate-800">{passager.nomComplet}</p>
                            <div className="space-y-2">
                              {servicesActifs.map((serviceActif) => {
                                const serviceStore = servicesStore.find((s) => s.id === serviceActif.serviceSpecifiqueId);
                                const prefsDisponibles: ServicePreference[] = serviceStore?.servicePreference || [];
                                if (prefsDisponibles.length === 0) return null;
                                return (
                                  <div key={serviceActif.id} className="flex flex-wrap items-center gap-1.5">
                                    <span className="w-32 shrink-0 text-xs text-slate-500">
                                      {serviceStore?.libelle || serviceActif.serviceSpecifique?.libelle || '—'}
                                    </span>
                                    {prefsDisponibles.map((pref) => {
                                      const isSelected = prefsPassager.includes(pref.id);
                                      return (
                                        <button
                                          key={pref.id}
                                          type="button"
                                          aria-pressed={isSelected}
                                          onClick={() =>
                                            setPrefParPassager((prev) => ({
                                              ...prev,
                                              [passager.infoId]: isSelected
                                                ? prefsPassager.filter((id) => id !== pref.id)
                                                : [...prefsPassager, pref.id],
                                            }))
                                          }
                                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                            isSelected
                                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                          }`}
                                        >
                                          {isSelected && <FiCheck size={12} strokeWidth={3} />}
                                          {pref.preference}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ═══ Étape 2 : Prix & frais ═══ */}
          {step === 2 && (
            <>
              <Section title="Taux de change">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                  <div className="w-full sm:w-56">
                    <label htmlFor="reprog-taux" className={labelCls}>
                      1 {devise} en Ariary <Required />
                    </label>
                    <div className="relative">
                      <input
                        id="reprog-taux"
                        type="number"
                        min="0"
                        step="0.01"
                        value={tauxChange}
                        onChange={(e) => setTauxChange(e.target.value)}
                        className={`${inputCls} pr-10 tabular-nums`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Ar</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 sm:pb-3">Tous les montants en Ariary sont calculés avec ce taux.</p>
                </div>
              </Section>

              <Section title="Prix du nouveau billet (compagnie)">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <MontantField
                    label="PU billet"
                    devise={devise}
                    value={puBillet}
                    onChange={setPuBillet}
                    taux={taux}
                    aide={`Prix réservation actuel : ${fmtDev(ancienPuBillet, devise)}`}
                  />
                  <MontantField
                    label="PU service"
                    devise={devise}
                    value={puService}
                    taux={taux}
                    aide="Repris de la réservation. Les frais de service de la modification se saisissent dans « Frais de la modification »."
                  />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="text-slate-500">
                    Total pour {nbPassagers} passager{nbPassagers > 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {fmtDev(totalBilletDevise, devise)}
                    <span className="mx-2 font-normal text-slate-300">|</span>
                    {fmtAr(toAriary(totalBilletDevise, taux))}
                  </span>
                </div>
              </Section>

              <Section title="Frais de la modification">
                <p className="mb-3 text-xs text-slate-500">
                  Laisser vide si le frais ne s'applique pas. Pour chaque frais saisi, indiquer qui le paie.
                </p>
                <div className="overflow-hidden rounded-md border border-slate-200">
                  {/* En-tête des colonnes (desktop) */}
                  <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 md:grid">
                    <span>Type</span>
                    <span>Montant ({devise})</span>
                    <span>Ariary</span>
                    <span className="w-[8.5rem]">À la charge de</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fraisVisibles.map((t) => {
                      const m = montantFrais(t);
                      return (
                        <div
                          key={t}
                          className="grid grid-cols-1 items-center gap-3 px-3 py-3 md:grid-cols-[1.4fr_1fr_0.8fr_auto]"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{FRAIS_LABELS[t].label}</p>
                            <p className="text-xs text-slate-400">
                              {t === 'SURCLASSEMENT'
                                ? `(${fmtDev(parseMontant(puBillet), devise)} − ${fmtDev(ancienPuBillet, devise)}) × ${nbPassagers} passager${nbPassagers > 1 ? 's' : ''}`
                                : FRAIS_LABELS[t].aide}
                            </p>
                          </div>
                          {t === 'SURCLASSEMENT' ? (
                            <div className={readonlyCls} title="Calculé automatiquement à partir du PU billet">
                              {m.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs text-slate-400">{devise}</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={frais[t].montant}
                                onChange={(e) => setFraisField(t, { montant: e.target.value })}
                                className={`${inputCls} pr-12 tabular-nums`}
                                placeholder="0,00"
                                aria-label={`${FRAIS_LABELS[t].label} en ${devise}`}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                {devise}
                              </span>
                            </div>
                          )}
                          <div className="text-sm tabular-nums text-slate-700">
                            {m > 0 ? fmtAr(toAriary(m, taux)) : <span className="text-slate-300">—</span>}
                          </div>
                          <ChargeToggle
                            value={frais[t].aLaChargeDe}
                            disabled={!(m > 0)}
                            missing={m > 0 && !frais[t].aLaChargeDe}
                            onChange={(v) => setFraisField(t, { aLaChargeDe: v })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {!estSurclassement && (
                  <p className={hintCls}>
                    Le surclassement n'apparaît que si une classe supérieure est choisie à l'étape 1.
                  </p>
                )}
                {estSurclassement && diffPuBillet <= 0 && (
                  <Notice tone="warning">
                    Le nouveau PU billet n'est pas supérieur au prix de réservation actuel : aucun surclassement à facturer.
                  </Notice>
                )}
              </Section>
            </>
          )}

          {/* ═══ Étape 3 : Récapitulatif ═══ */}
          {step === 3 && (
            <>
              <Section title="Ce qui change" collapsible={false}>
                <dl className="divide-y divide-slate-100 text-sm">
                  <RecapRow label="Départ" avant={fmtDate(origine.depart)} apres={fmtDate(dateHeureDepart)} />
                  <RecapRow label="Arrivée" avant={fmtDate(origine.arrive)} apres={fmtDate(dateHeureArrive)} />
                  <RecapRow label="Classe" avant={classeLabel(origine.classe)} apres={classeLabel(classe)} />
                  <RecapLine label="Passagers">
                    {selectedPassagers.map((p) => p.nomComplet).join(', ') || '—'}
                  </RecapLine>
                  <RecapLine label="Motif">
                    {conditionModif}
                    {raisonAnnulationId && (
                      <span className="text-slate-500"> · {raisons.find((r) => r.id === raisonAnnulationId)?.libelle}</span>
                    )}
                  </RecapLine>
                </dl>
              </Section>

              <Section title="Prix & frais" collapsible={false}>
                <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <MiniStat label="Taux de change" value={`1 ${devise} = ${taux.toLocaleString('fr-FR')} Ar`} />
                  <MiniStat label="PU billet" value={fmtDev(parseMontant(puBillet), devise)} />
                  <MiniStat label="PU service" value={fmtDev(parseMontant(puService), devise)} />
                </dl>

                {fraisPayload.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                    Aucun frais : reprogrammation sans frais.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                          <th className="px-3 py-2 font-medium">Frais</th>
                          <th className="px-3 py-2 text-right font-medium">{devise}</th>
                          <th className="px-3 py-2 text-right font-medium">Ariary</th>
                          <th className="px-3 py-2 text-right font-medium">À la charge de</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fraisPayload.map((f) => (
                          <tr key={f.typeFrais}>
                            <td className="px-3 py-2.5 text-slate-800">{FRAIS_LABELS[f.typeFrais].label}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{fmtDev(f.montantDevise, devise)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{fmtAr(f.montantAriary)}</td>
                            <td className="px-3 py-2.5 text-right">
                              <ChargeBadge value={f.aLaChargeDe} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TotalCard label="À payer par le client" value={fmtAr(totalClientAr)} />
                <TotalCard label="À la charge de l'agence" value={fmtAr(totalAgenceAr)} tone="agence" />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3">
          {step > 1 ? (
            <Button
              variant="secondary"
              icon={<FiChevronLeft />}
              onClick={() => setStep((step - 1) as Step)}
              disabled={loading}
            >
              Précédent
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
          )}

          <span className="hidden text-xs text-slate-400 sm:block">
            Étape {step} sur {STEPS.length}
          </span>

          {step < 3 ? (
            <Button onClick={() => goTo((step + 1) as Step)}>
              <span className="inline-flex items-center gap-1.5">
                Suivant <FiChevronRight />
              </span>
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={loading}
              icon={
                loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <FiCheck />
                )
              }
            >
              {loading ? 'Enregistrement…' : 'Confirmer la reprogrammation'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────

function Section({
  title,
  badge,
  defaultOpen = true,
  collapsible = true,
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;

  const header = (
    <span className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      {badge}
    </span>
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 rounded-lg px-5 py-3.5 text-left hover:bg-slate-50/60"
        >
          {header}
          <FiChevronDown className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <div className="px-5 py-3.5">{header}</div>
      )}
      {isOpen && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </section>
  );
}

function ChangeBadge({ changed }: { changed: boolean }) {
  return changed ? (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Modifié</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inchangé</span>
  );
}

function CountBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{children}</span>;
}

function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  const cls =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-indigo-100 bg-indigo-50 text-indigo-800';
  return <p className={`mt-2 rounded-md border px-3 py-2 text-xs ${cls}`}>{children}</p>;
}

function MontantField({
  label,
  devise,
  value,
  onChange,
  taux,
  aide,
}: {
  label: string;
  devise: string;
  value: string;
  // Sans onChange : champ en lecture seule
  onChange?: (v: string) => void;
  taux: number;
  aide?: string;
}) {
  const m = parseMontant(value);
  const lectureSeule = !onChange;
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={lectureSeule}
            className={`${inputCls} pr-12 tabular-nums ${lectureSeule ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            placeholder="0,00"
            aria-label={`${label} en ${devise}`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{devise}</span>
        </div>
        <div className={readonlyCls}>{fmtAr(toAriary(m, taux))}</div>
      </div>
      {aide && <p className={hintCls}>{aide}</p>}
    </div>
  );
}

// Contrôle segmenté Client / Agence
function ChargeToggle({
  value,
  disabled,
  missing,
  onChange,
}: {
  value: ALaChargeDe | null;
  disabled: boolean;
  missing: boolean;
  onChange: (v: ALaChargeDe) => void;
}) {
  const opts: { v: ALaChargeDe; label: string }[] = [
    { v: 'CLIENT', label: 'Client' },
    { v: 'AGENCE', label: 'Agence' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="À la charge de"
      className={`inline-flex w-[8.5rem] rounded-md bg-slate-100 p-0.5 ring-1 ${
        missing ? 'ring-red-400' : 'ring-transparent'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      {opts.map((o) => {
        const checked = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(o.v)}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ${
              checked
                ? `bg-white shadow-sm ${o.v === 'CLIENT' ? 'text-indigo-700' : 'text-amber-700'}`
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ChargeBadge({ value }: { value: ALaChargeDe }) {
  return value === 'CLIENT' ? (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Client</span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Agence</span>
  );
}

function RecapLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function RecapRow({ label, avant, apres }: { label: string; avant: string; apres: string }) {
  const changed = avant !== apres;
  return (
    <RecapLine label={label}>
      {changed ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-normal text-slate-400 line-through">{avant}</span>
          <FiArrowRight className="text-slate-400" size={14} />
          <span className="text-indigo-700">{apres}</span>
        </span>
      ) : (
        <span>
          {apres} <span className="text-xs font-normal text-slate-400">(inchangé)</span>
        </span>
      )}
    </RecapLine>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

function TotalCard({ label, value, tone = 'client' }: { label: string; value: string; tone?: 'client' | 'agence' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'agence' ? 'text-amber-700' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}