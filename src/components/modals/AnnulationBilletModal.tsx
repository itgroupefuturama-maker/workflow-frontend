import { useEffect, useState, type ReactNode } from 'react';
import { FiX, FiAlertTriangle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import type { AnnulationBilletPayload, BilletLigne, TypeAnnulation } from '../../app/front_office/billetSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchRaisonsAnnulation } from '../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import { toast } from '../Toast/toast';
import { useEscapeKey } from '../../hooks/useEscapeKey';

type AnnulType = TypeAnnulation;

// Annulation possible à tout statut (le billet repasse en CREER), sauf lignes déjà annulées,
// remplacées par une reprogrammation, ou lignes de frais d'annulation (refus 409 du back)
const estAnnulable = (l: BilletLigne) =>
  !['ANNULER', 'MODIFIER'].includes(l.statut) && l.statusLigne !== 'ANNULATION';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AnnulationBilletPayload) => void;
  lignes: BilletLigne[];
  type: 'reservation' | 'emission';
  loading?: boolean;
  enteteId: string;
}

const TYPES: { value: AnnulType; label: string; desc: string }[] = [
  { value: 'SIMPLE', label: 'Simple', desc: 'Condition seulement' },
  { value: 'COM', label: 'Commission', desc: 'Commission uniquement' },
  { value: 'PEN', label: 'Pénalité', desc: 'Pénalité uniquement' },
  { value: 'COM_PEN', label: 'Commission + Pénalité', desc: 'Les deux frais' },
];

// Conditions fréquentes : un clic pré-remplit le texte, modifiable ensuite
const CONDITIONS_RAPIDES = [
  'Annulation à la demande du client',
  'Erreur de saisie / double réservation',
  "Changement d'itinéraire",
  'Problème médical / décès',
  'Vol annulé par la compagnie',
  'Surbooking / overbooking',
];

// ─── Styles partagés ────────────────────────────────────────
const inputCls =
  'w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';
const hintCls = 'text-xs text-slate-500 mt-1.5';
const readonlyCls =
  'flex h-10 items-center px-3 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 tabular-nums';
const Required = () => <span className="text-red-500">*</span>;

export default function AnnulationBilletModal({
  isOpen,
  onClose,
  onSubmit,
  lignes,
  loading = false,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const { items: raisons, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );

  const [typeAnnul, setTypeAnnul] = useState<AnnulType>('SIMPLE');
  const [raison, setRaison] = useState('');
  const [resaCommDevise, setResaCommDevise] = useState(0);
  const [penalitePu, setPenalitePu] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Charger les raisons une seule fois à l'ouverture : ne pas dépendre de
  // raisons.length / raisonsLoading, sinon une liste vide relance le GET en boucle
  useEffect(() => {
    if (isOpen) dispatch(fetchRaisonsAnnulation());
  }, [isOpen, dispatch]);

  // Fermeture avec Échap (bloquée pendant l'envoi)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  // La modal est montée à chaque ouverture (Billet.tsx) : initialisation directe, sans effet.
  // Un effet sur `lignes` (nouveau tableau à chaque rendu du parent) réinitialisait la sélection en boucle.
  const tauxResaDe = (ligneId: string) => {
    const taux = Number(lignes?.find((l) => l.id === ligneId)?.resaTauxEchange);
    return taux > 0 ? taux : '';
  };
  const [selectedLigneId, setSelectedLigneId] = useState<string>(
    () => lignes?.find(estAnnulable)?.id || ''
  );
  const [rasionAnnulationId, setRaisonAnnulationId] = useState<string>('');
  // Taux de change initialisé avec le taux de réservation de la ligne sélectionnée
  const [tauxChange, setTauxChange] = useState<number | ''>(() => tauxResaDe(selectedLigneId));

  // Montants Ariary calculés automatiquement : montant devise × taux de change
  const toAriary = (montantDevise: number) =>
    tauxChange === '' ? 0 : Math.round((Number(montantDevise) || 0) * Number(tauxChange));
  const fmtAr = (n: number) => `${n.toLocaleString('fr-FR')} Ar`;
  const fmtDev = (n: number) =>
    Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const resaCommAriary = toAriary(resaCommDevise);
  // Nombre de passagers de la ligne sélectionnée : le montant total de pénalité = PU × nb pax
  const nbPaxDe = (ligneId: string) => {
    const n = Number((lignes?.find((l) => l.id === ligneId) as any)?.prospectionLigne?.nombre);
    return n > 0 ? n : 1;
  };
  const nbPax = nbPaxDe(selectedLigneId);
  const penaliteMontant = Math.round((Number(penalitePu) || 0) * nbPax * 100) / 100;
  const penaliteAriary = toAriary(penaliteMontant);

  const avecCommission = typeAnnul === 'COM' || typeAnnul === 'COM_PEN';
  const avecPenalite = typeAnnul === 'PEN' || typeAnnul === 'COM_PEN';
  const conditionObligatoire = typeAnnul !== 'PEN';

  // Garde très tôt
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  if (!lignes || !Array.isArray(lignes)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <FiAlertTriangle className="text-red-600" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-900">Aucune ligne disponible</p>
          <p className="mt-1 mb-5 text-sm text-slate-500">Impossible de charger les lignes à annuler.</p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const lignesAnnulables = lignes.filter(estAnnulable);
  const ligneSelectionnee = lignes.find((l) => l.id === selectedLigneId);
  const ligneLabel = (l: BilletLigne) =>
    [l.reservation || 'Sans n° de réservation', (l as any).prospectionLigne?.itineraire, l.statut]
      .filter(Boolean)
      .join(' · ');
  const raisonLibelle = raisons.find((r) => r.id === rasionAnnulationId)?.libelle;
  const typeLibelle = TYPES.find((t) => t.value === typeAnnul)?.label;

  const buildPayload = () => {
    const payload: AnnulationBilletPayload = {
      id: selectedLigneId,
      rasionAnnulationId: rasionAnnulationId,
      type: typeAnnul,
      tauxChange: Number(tauxChange),
      // Texte saisi par l'agent ; la raison choisie dans la liste part dans rasionAnnulationId
      conditionAnnul: raison.trim(),
    };

    if (avecCommission) {
      payload.resaCommissionEnDevise = Number(resaCommDevise);
      payload.resaCommissionEnAriary = Number(resaCommAriary);
    }

    if (avecPenalite) {
      payload.puResaPenaliteCompagnieDevise = Number(penalitePu);
      payload.puResaMontantPenaliteCompagnieDevise = Number(penaliteMontant);
    }

    return payload;
  };

  // Mêmes contrôles avant la vérification et avant l'envoi : l'utilisateur sait tout de suite ce qui manque
  const erreurs = (): string[] => {
    const e: string[] = [];
    if (!selectedLigneId) e.push('Veuillez sélectionner une ligne à annuler.');
    if (!rasionAnnulationId) e.push("Veuillez choisir une raison d'annulation.");
    if (tauxChange === '' || isNaN(Number(tauxChange)) || Number(tauxChange) <= 0) {
      e.push('Le taux de change est obligatoire et doit être un nombre valide.');
    }
    if (conditionObligatoire && !raison.trim()) {
      e.push("La condition d'annulation est obligatoire sauf pour le type Pénalité.");
    }
    return e;
  };

  const handleVerifier = () => {
    const e = erreurs();
    if (e.length) {
      toast.warning(e.join('\n'));
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = () => {
    if (loading) return;
    const e = erreurs();
    if (e.length) {
      toast.warning(e.join('\n'));
      setShowPreview(false);
      return;
    }
    try {
      onSubmit(buildPayload());
    } catch (err: any) {
      toast.error(err.message || 'Erreur validation');
    }
  };

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
        aria-labelledby="annul-modal-title"
        className="flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <FiAlertTriangle className="text-red-600" size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="annul-modal-title" className="text-lg font-semibold text-slate-900">
                {showPreview ? "Vérifier l'annulation" : 'Annuler un billet'}
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {showPreview
                  ? 'Contrôlez les informations avant de confirmer.'
                  : 'Le billet repassera au statut « Créé ».'}
              </p>
            </div>
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

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-5">
          {!showPreview ? (
            <>
              {/* Ligne & raison */}
              <Card title="Ligne concernée">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="annul-ligne" className={labelCls}>
                      Ligne à annuler <Required />
                    </label>
                    <select
                      id="annul-ligne"
                      value={selectedLigneId}
                      onChange={(e) => {
                        setSelectedLigneId(e.target.value);
                        setTauxChange(tauxResaDe(e.target.value));
                      }}
                      disabled={lignesAnnulables.length === 0}
                      className={inputCls}
                    >
                      {lignesAnnulables.length === 0 ? (
                        <option value="">Aucune ligne annulable</option>
                      ) : (
                        <>
                          <option value="">Choisir une ligne</option>
                          {lignesAnnulables.map((l) => (
                            <option key={l.id} value={l.id}>{ligneLabel(l)}</option>
                          ))}
                        </>
                      )}
                    </select>
                    {lignesAnnulables.length === 0 && (
                      <p className={hintCls}>Toutes les lignes sont déjà annulées ou reprogrammées.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="annul-raison" className={labelCls}>
                      Raison d'annulation <Required />
                    </label>
                    {raisonsLoading ? (
                      <div className={`${readonlyCls} font-normal text-slate-400`}>Chargement…</div>
                    ) : raisons.length === 0 ? (
                      <div className="flex h-10 items-center rounded-md border border-red-200 bg-red-50 px-3 text-sm text-red-700">
                        Aucune raison paramétrée
                      </div>
                    ) : (
                      <select
                        id="annul-raison"
                        value={rasionAnnulationId}
                        onChange={(e) => setRaisonAnnulationId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Choisir une raison</option>
                        {raisons
                          .filter((r) => r.statut === 'ACTIF')
                          .map((r) => (
                            <option key={r.id} value={r.id}>{r.libelle}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </Card>

              {/* Type d'annulation */}
              <Card title="Type d'annulation">
                <div role="radiogroup" aria-label="Type d'annulation" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {TYPES.map((t) => {
                    const checked = typeAnnul === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => setTypeAnnul(t.value)}
                        className={`relative rounded-md border px-3 py-2.5 text-left transition ${
                          checked
                            ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className={`block text-sm font-medium ${checked ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {t.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">{t.desc}</span>
                        {checked && (
                          <FiCheck className="absolute right-2.5 top-2.5 text-indigo-600" size={14} strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Condition */}
              <Card title="Condition d'annulation">
                <label htmlFor="annul-condition" className={labelCls}>
                  Détail {conditionObligatoire ? <Required /> : <span className="font-normal text-slate-400">(facultatif)</span>}
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CONDITIONS_RAPIDES.map((c) => {
                    const actif = raison === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRaison(c)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          actif
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  id="annul-condition"
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  className={`${inputCls} h-auto min-h-[88px] resize-y py-2`}
                  placeholder="Précisez la condition d'annulation…"
                />
              </Card>

              {/* Montants */}
              <Card title="Montants">
                <div className="md:w-1/2">
                  <label htmlFor="annul-taux" className={labelCls}>
                    Taux de change <Required />
                  </label>
                  <div className="relative">
                    <input
                      id="annul-taux"
                      type="number"
                      step="0.01"
                      min="0"
                      value={tauxChange}
                      onChange={(e) => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`${inputCls} pr-10 tabular-nums`}
                      placeholder="Ex : 4500"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Ar</span>
                  </div>
                  <p className={hintCls}>Initialisé avec le taux de réservation de la ligne.</p>
                </div>

                {avecCommission && (
                  <SubBlock title="Commission de réservation">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="annul-comm" className={labelCls}>Commission (devise)</label>
                        <input
                          id="annul-comm"
                          type="number"
                          step="0.01"
                          min="0"
                          value={resaCommDevise}
                          onChange={(e) => setResaCommDevise(Number(e.target.value))}
                          className={`${inputCls} tabular-nums`}
                        />
                      </div>
                      <div>
                        <span className={labelCls}>
                          Commission (Ariary) <span className="font-normal text-slate-400">· calculé</span>
                        </span>
                        <div className={readonlyCls}>{fmtAr(resaCommAriary)}</div>
                      </div>
                    </div>
                  </SubBlock>
                )}

                {avecPenalite && (
                  <SubBlock title="Pénalité d'annulation">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="annul-pen-pu" className={labelCls}>Prix unitaire par pax (devise)</label>
                        <input
                          id="annul-pen-pu"
                          type="number"
                          step="0.01"
                          min="0"
                          value={penalitePu}
                          onChange={(e) => setPenalitePu(Number(e.target.value))}
                          className={`${inputCls} tabular-nums`}
                        />
                      </div>
                      <div>
                        <span className={labelCls}>
                          Montant total (devise){' '}
                          <span className="font-normal text-slate-400">· {nbPax} pax × PU</span>
                        </span>
                        <div className={readonlyCls}>{fmtDev(penaliteMontant)}</div>
                      </div>
                      <div>
                        <span className={labelCls}>
                          Montant total (Ariary) <span className="font-normal text-slate-400">· calculé</span>
                        </span>
                        <div className={readonlyCls}>{fmtAr(penaliteAriary)}</div>
                      </div>
                    </div>
                  </SubBlock>
                )}

                {!avecCommission && !avecPenalite && (
                  <p className="mt-4 rounded-md border border-dashed border-slate-300 px-3 py-2.5 text-xs text-slate-500">
                    Annulation simple : aucun frais appliqué.
                  </p>
                )}
              </Card>
            </>
          ) : (
            /* ═══ Vérification ═══ */
            <>
              <Card title="Récapitulatif">
                <dl className="divide-y divide-slate-100 text-sm">
                  <RecapLine label="Ligne">{ligneSelectionnee ? ligneLabel(ligneSelectionnee) : '—'}</RecapLine>
                  <RecapLine label="Passagers">
                    <span className="tabular-nums">{nbPax} pax</span>
                  </RecapLine>
                  <RecapLine label="Raison">{raisonLibelle || '—'}</RecapLine>
                  <RecapLine label="Type">{typeLibelle}</RecapLine>
                  <RecapLine label="Condition">
                    {raison.trim() || <span className="font-normal text-slate-400">Non renseignée</span>}
                  </RecapLine>
                  <RecapLine label="Taux de change">
                    <span className="tabular-nums">{Number(tauxChange).toLocaleString('fr-FR')} Ar</span>
                  </RecapLine>
                </dl>
              </Card>

              {(avecCommission || avecPenalite) && (
                <Card title="Frais appliqués">
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                          <th className="px-3 py-2 font-medium">Frais</th>
                          <th className="px-3 py-2 text-right font-medium">Devise</th>
                          <th className="px-3 py-2 text-right font-medium">Ariary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {avecCommission && (
                          <tr>
                            <td className="px-3 py-2.5 text-slate-800">Commission de réservation</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{fmtDev(resaCommDevise)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{fmtAr(resaCommAriary)}</td>
                          </tr>
                        )}
                        {avecPenalite && (
                          <tr>
                            <td className="px-3 py-2.5 text-slate-800">
                              Pénalité
                              <span className="ml-1 text-xs text-slate-400">(PU {fmtDev(penalitePu)} × {nbPax} pax)</span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{fmtDev(penaliteMontant)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{fmtAr(penaliteAriary)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
                <p>Cette action annule la ligne sélectionnée. Vérifiez les informations avant de confirmer.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3">
          {!showPreview ? (
            <>
              <p className="hidden text-xs text-slate-500 sm:block">
                <Required /> Champs obligatoires
              </p>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleVerifier}
                  disabled={!selectedLigneId}
                  className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Vérifier
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FiChevronLeft size={16} />
                Modifier
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {loading ? 'Annulation en cours…' : "Confirmer l'annulation"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function SubBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
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