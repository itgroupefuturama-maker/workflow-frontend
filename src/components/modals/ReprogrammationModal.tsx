// src/components/modals/ReprogrammationModal.tsx
// Reprogrammation d'une ligne billet en 3 étapes : Modification → Prix & frais → Récapitulatif.
// Contrat API : FRONTEND_PROMPT_REPROGRAMMATION_FRAIS.md. Les montants Ariary sont calculés ici
// (devise × taux, arrondi à l'entier) et envoyés tels quels : le backend ne recalcule rien.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  FiX, FiAlertTriangle, FiCheckCircle, FiTrash2, FiChevronDown, FiChevronLeft, FiChevronRight, FiArrowRight,
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

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

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
  const [puService, setPuService] = useState<string>(String(ancienPuService));
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

  if (!isOpen) return null;
  if (!ligne) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-center max-w-md">
          <FiAlertTriangle className="text-red-600 text-5xl mx-auto mb-4" />
          <p className="text-red-600 font-medium text-lg mb-6">Erreur : ligne à reprogrammer non disponible</p>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">Reprogrammer la ligne</h2>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {pl?.itineraire || '—'} · {classeLabel(origine.classe)} · départ {fmtDate(origine.depart)}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Stepper */}
          <ol className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={`flex items-center gap-2 text-sm font-semibold ${
                    step === s.id ? 'text-indigo-700' : step > s.id ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === s.id
                        ? 'bg-indigo-600 text-white'
                        : step > s.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > s.id ? '✓' : s.id}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
              </li>
            ))}
          </ol>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          {/* ═══ Étape 1 : Modification ═══ */}
          {step === 1 && (
            <>
              <Section title="Motif">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Raison</label>
                    {raisonsLoading ? (
                      <p className="text-sm text-slate-500 py-2">Chargement…</p>
                    ) : (
                      <select
                        value={raisonAnnulationId}
                        onChange={(e) => setRaisonAnnulationId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">— Aucune —</option>
                        {raisons
                          .filter((r) => r.statut === 'ACTIF')
                          .map((r) => (
                            <option key={r.id} value={r.id}>{r.libelle}</option>
                          ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>
                      Condition de modification <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={conditionModif}
                      onChange={(e) => setConditionModif(e.target.value)}
                      className={inputCls}
                      placeholder="Ex. changement horaire à la demande du client"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Vol & dates" badge={<ChangeBadge changed={changements.dates} />} defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Départ <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateHeureDepart}
                      onChange={(e) => setDateHeureDepart(e.target.value)}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400 mt-1">Actuel : {fmtDate(origine.depart)}</p>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Arrivée <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateHeureArrive}
                      onChange={(e) => setDateHeureArrive(e.target.value)}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400 mt-1">Actuel : {fmtDate(origine.arrive)}</p>
                  </div>
                </div>
              </Section>

              <Section title="Classe & services" badge={<ChangeBadge changed={changements.classe} />}>
                <div className="space-y-4">
                  <div className="md:w-1/2">
                    <label className={labelCls}>
                      Classe <span className="text-red-600">*</span>
                    </label>
                    <select value={classe} onChange={(e) => setClasse(e.target.value)} className={inputCls}>
                      {CLASSES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Actuelle : {classeLabel(origine.classe)}</p>
                    {estSurclassement && (
                      <p className="text-xs text-indigo-700 mt-1">
                        Surclassement : la différence de prix se saisit à l'étape « Prix & frais ».
                      </p>
                    )}
                  </div>

                  {services.length > 0 && (
                    <div className="space-y-2">
                      <p className={labelCls}>Services spécifiques</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {services.map((svc, index) => {
                          const libelle = serviceById.get(svc.serviceSpecifiqueId)?.libelle || 'Service inconnu';
                          const setValeur = (valeur: string) =>
                            setServices((prev) => prev.map((s, i) => (i === index ? { ...s, valeur } : s)));
                          // Les services oui/non sont stockés en 'true' / 'false' : case à cocher plutôt que texte libre
                          const estBooleen = svc.valeur === 'true' || svc.valeur === 'false';
                          return estBooleen ? (
                            <label
                              key={svc.serviceSpecifiqueId}
                              className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={svc.valeur === 'true'}
                                onChange={(e) => setValeur(e.target.checked ? 'true' : 'false')}
                                className="accent-indigo-600"
                              />
                              {libelle}
                            </label>
                          ) : (
                            <div key={svc.serviceSpecifiqueId} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                              <span className="flex-1 text-sm text-slate-700 truncate">{libelle}</span>
                              <input
                                type="text"
                                value={svc.valeur}
                                onChange={(e) => setValeur(e.target.value)}
                                aria-label={libelle}
                                className="w-24 border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
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
                badge={
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {nbPassagers} sélectionné{nbPassagers > 1 ? 's' : ''}
                  </span>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Bénéficiaire</label>
                      <select
                        value={currentBeneficiaireId}
                        onChange={(e) => {
                          setCurrentBeneficiaireId(e.target.value);
                          setCurrentInfoId('');
                        }}
                        className={inputCls}
                      >
                        <option value="">— Choisir —</option>
                        {beneficiaires.map((b) => (
                          <option key={b.clientBeneficiaireId} value={b.clientBeneficiaireId}>
                            {b.clientBeneficiaire.libelle} • {b.clientBeneficiaire.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentBeneficiaireId && (
                      <div>
                        <label className={labelCls}>Document</label>
                        {infosLoading ? (
                          <p className="text-sm text-slate-500 py-2">Chargement…</p>
                        ) : (
                          <select value={currentInfoId} onChange={(e) => setCurrentInfoId(e.target.value)} className={inputCls}>
                            <option value="">— Choisir —</option>
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
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                        <p className="font-semibold text-slate-900">
                          {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                        </p>
                        <p className="text-slate-600">
                          {selectedInfoDetails.typeDoc} {selectedInfoDetails.referenceDoc} · {selectedInfoDetails.nationalite}
                        </p>
                        {selectedInfoDetails.dateValiditeDoc && (
                          <p
                            className={`text-xs font-semibold mt-1 ${
                              new Date(selectedInfoDetails.dateValiditeDoc) < new Date() ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            Document valide jusqu'au {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={addPassager}
                      disabled={!currentBeneficiaireId || !currentInfoId}
                      className="w-full justify-center"
                    >
                      + Ajouter le passager
                    </Button>
                  </div>

                  <div>
                    {nbPassagers === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-400">
                        Aucun passager
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedPassagers.map((p, idx) => (
                          <div key={p.infoId} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="shrink-0 w-6 h-6 bg-slate-800 text-white text-xs rounded flex items-center justify-center font-semibold">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{p.nomComplet}</p>
                                <p className="text-xs text-slate-500 truncate">
                                  {p.typeDoc} {p.referenceDoc ? `(${p.referenceDoc})` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePassager(p.infoId)}
                              aria-label={`Retirer ${p.nomComplet}`}
                              className="shrink-0 text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Préférences de services par passager */}
                {nbPassagers > 0 && servicesActifs.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
                    <p className="text-sm font-semibold text-slate-900">Préférences de services</p>
                    {selectedPassagers.map((passager) => {
                      const prefsPassager = getPrefs(passager.infoId);
                      return (
                        <div key={passager.infoId} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <p className="text-sm font-semibold text-slate-800 mb-2">{passager.nomComplet}</p>
                          <div className="space-y-2">
                            {servicesActifs.map((serviceActif) => {
                              const serviceStore = servicesStore.find((s) => s.id === serviceActif.serviceSpecifiqueId);
                              const prefsDisponibles: ServicePreference[] = serviceStore?.servicePreference || [];
                              if (prefsDisponibles.length === 0) return null;
                              return (
                                <div key={serviceActif.id} className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-slate-500 w-32 shrink-0">
                                    {serviceStore?.libelle || serviceActif.serviceSpecifique?.libelle || '—'}
                                  </span>
                                  {prefsDisponibles.map((pref) => {
                                    const isSelected = prefsPassager.includes(pref.id);
                                    return (
                                      <button
                                        key={pref.id}
                                        type="button"
                                        onClick={() =>
                                          setPrefParPassager((prev) => ({
                                            ...prev,
                                            [passager.infoId]: isSelected
                                              ? prefsPassager.filter((id) => id !== pref.id)
                                              : [...prefsPassager, pref.id],
                                          }))
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                                        }`}
                                      >
                                        {isSelected && '✓ '}
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
                )}
              </Section>
            </>
          )}

          {/* ═══ Étape 2 : Prix & frais ═══ */}
          {step === 2 && (
            <>
              <Section title="Taux de change">
                <div className="flex items-end gap-4">
                  <div className="w-56">
                    <label className={labelCls}>
                      1 {devise} = … Ar <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tauxChange}
                      onChange={(e) => setTauxChange(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <p className="text-xs text-slate-500 pb-2.5">Tous les montants en Ariary sont calculés avec ce taux.</p>
                </div>
              </Section>

              <Section title="Prix du nouveau billet (compagnie)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={setPuService}
                    taux={taux}
                    aide={`Prix réservation actuel : ${fmtDev(ancienPuService, devise)}`}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Total pour {nbPassagers} passager{nbPassagers > 1 ? 's' : ''} :{' '}
                  <span className="font-semibold text-slate-700">
                    {fmtDev((parseMontant(puBillet) + parseMontant(puService)) * nbPassagers, devise)} ·{' '}
                    {fmtAr(toAriary((parseMontant(puBillet) + parseMontant(puService)) * nbPassagers, taux))}
                  </span>
                </p>
              </Section>

              <Section title="Frais de la modification">
                <p className="text-xs text-slate-500 mb-3">
                  Laisser vide si le frais ne s'applique pas. Pour chaque frais saisi, indiquer qui le paie.
                </p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  {fraisVisibles.map((t) => {
                    const m = montantFrais(t);
                    return (
                      <div key={t} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-center p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{FRAIS_LABELS[t].label}</p>
                          <p className="text-xs text-slate-400">
                            {t === 'SURCLASSEMENT'
                              ? `(${fmtDev(parseMontant(puBillet), devise)} − ${fmtDev(ancienPuBillet, devise)}) × ${nbPassagers} passager${nbPassagers > 1 ? 's' : ''}`
                              : FRAIS_LABELS[t].aide}
                          </p>
                        </div>
                        {t === 'SURCLASSEMENT' ? (
                          <div
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 tabular-nums"
                            title="Calculé automatiquement à partir du PU billet"
                          >
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
                            className={`${inputCls} pr-12`}
                            placeholder="0.00"
                            aria-label={`${FRAIS_LABELS[t].label} en ${devise}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{devise}</span>
                        </div>
                        )}
                        <div className="text-sm text-slate-700 tabular-nums">
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
                {!estSurclassement && (
                  <p className="text-xs text-slate-400 mt-2">
                    Le surclassement n'apparaît que si une classe supérieure est choisie à l'étape 1.
                  </p>
                )}
                {estSurclassement && diffPuBillet <= 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    Le nouveau PU billet n'est pas supérieur au prix de réservation actuel : aucun surclassement à facturer.
                  </p>
                )}
              </Section>
            </>
          )}

          {/* ═══ Étape 3 : Récapitulatif ═══ */}
          {step === 3 && (
            <>
              <Section title="Ce qui change">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <RecapRow label="Départ" avant={fmtDate(origine.depart)} apres={fmtDate(dateHeureDepart)} />
                  <RecapRow label="Arrivée" avant={fmtDate(origine.arrive)} apres={fmtDate(dateHeureArrive)} />
                  <RecapRow label="Classe" avant={classeLabel(origine.classe)} apres={classeLabel(classe)} />
                  <div>
                    <dt className="text-xs text-slate-500">Passagers</dt>
                    <dd className="font-medium text-slate-800">
                      {selectedPassagers.map((p) => p.nomComplet).join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Motif</dt>
                    <dd className="font-medium text-slate-800">
                      {conditionModif}
                      {raisonAnnulationId && (
                        <span className="text-slate-500"> · {raisons.find((r) => r.id === raisonAnnulationId)?.libelle}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </Section>

              <Section title="Prix & frais">
                <p className="text-xs text-slate-500 mb-3">
                  Taux : 1 {devise} = {taux.toLocaleString('fr-FR')} Ar · Nouveau billet :{' '}
                  {fmtDev(parseMontant(puBillet), devise)} + service {fmtDev(parseMontant(puService), devise)} par passager
                </p>
                {fraisPayload.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg p-4 text-center">
                    Aucun frais : reprogrammation sans frais.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                        <th className="py-2 font-semibold">Frais</th>
                        <th className="py-2 font-semibold text-right">{devise}</th>
                        <th className="py-2 font-semibold text-right">Ariary</th>
                        <th className="py-2 font-semibold text-right">À la charge de</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fraisPayload.map((f) => (
                        <tr key={f.typeFrais}>
                          <td className="py-2 text-slate-800">{FRAIS_LABELS[f.typeFrais].label}</td>
                          <td className="py-2 text-right tabular-nums">{fmtDev(f.montantDevise, devise)}</td>
                          <td className="py-2 text-right tabular-nums">{fmtAr(f.montantAriary)}</td>
                          <td className="py-2 text-right">
                            <ChargeBadge value={f.aLaChargeDe} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payé par le client</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{fmtAr(totalClientAr)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payé par l'agence</p>
                  <p className="text-2xl font-bold text-amber-700 tabular-nums mt-1">{fmtAr(totalAgenceAr)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="secondary" icon={<FiChevronLeft />} onClick={() => setStep((step - 1) as Step)} disabled={loading}>
              Précédent
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
          )}
          {step < 3 ? (
            <Button onClick={() => goTo((step + 1) as Step)}>
              Suivant <FiChevronRight />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={loading}
              icon={
                loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCheckCircle />
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
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-slate-200 rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-3"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          {badge}
        </span>
        <FiChevronDown className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

function ChangeBadge({ changed }: { changed: boolean }) {
  return changed ? (
    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Modifié</span>
  ) : (
    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Inchangé</span>
  );
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
  onChange: (v: string) => void;
  taux: number;
  aide?: string;
}) {
  const m = parseMontant(value);
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
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} pr-12`}
            placeholder="0.00"
            aria-label={`${label} en ${devise}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{devise}</span>
        </div>
        <div className="flex items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 tabular-nums">
          {fmtAr(toAriary(m, taux))}
        </div>
      </div>
      {aide && <p className="text-xs text-slate-400 mt-1">{aide}</p>}
    </div>
  );
}

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
      className={`inline-flex rounded-lg border p-0.5 ${missing ? 'border-red-400' : 'border-slate-300'} ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          disabled={disabled}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${
            value === o.v
              ? o.v === 'CLIENT'
                ? 'bg-indigo-600 text-white'
                : 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChargeBadge({ value }: { value: ALaChargeDe }) {
  return value === 'CLIENT' ? (
    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Client</span>
  ) : (
    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Agence</span>
  );
}

function RecapRow({ label, avant, apres }: { label: string; avant: string; apres: string }) {
  const changed = avant !== apres;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800 flex items-center gap-2 flex-wrap">
        {changed ? (
          <>
            <span className="text-slate-400 line-through">{avant}</span>
            <FiArrowRight className="text-slate-400" size={14} />
            <span className="text-indigo-700">{apres}</span>
          </>
        ) : (
          <span>{apres} <span className="text-xs text-slate-400 font-normal">(inchangé)</span></span>
        )}
      </dd>
    </div>
  );
}
