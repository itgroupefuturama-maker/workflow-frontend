// src/pages/front_office/dossiers-communs/module.ticketing/prospection/ColonnesPrixBillet.tsx
//
// Colonnes « Prix Résa » et « Prix Émission » ajoutées au tableau des lignes de prospection.
// Les en-têtes et les cellules sont générés à partir de la même liste de colonnes,
// ils restent donc toujours alignés (y compris avec le bouton « Pénalités »).

import type { ReactNode } from 'react';
import { Ticket, Stamp } from 'lucide-react';
import type { BilletLigne } from '../../../../../app/front_office/billetSlice';
import { fmtAriary, fmtDevise, fmtNombre } from '../../../../../utils/format';
import { CLASSES_TON, libelleLigne } from '../ticketing.sous.module/components.billet/utils/billetStatuts';
import { aEmission, aResa, type BilletLigneLiee } from './vuesPrix';

export type VueBillet = 'RESA' | 'EMISSION';

interface Colonne {
  key: string;
  label: string;
  /** Colonne de pénalité : masquée quand « Pénalités » est désactivé */
  penalite?: boolean;
  align?: 'left' | 'right' | 'center';
  minW?: string;
  render: (b: BilletLigne, ctx: Contexte) => ReactNode;
  /** Info-bulle de l'en-tête */
  title?: string;
}

/** Données venant de la ligne de prospection (le taux de taxe n'existe pas sur la ligne billet) */
interface Contexte {
  tauxTaxe?: number;
}

const statutCell = (b: BilletLigne) => {
  const e = libelleLigne(b);
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CLASSES_TON[e.ton]}`}>
      {e.texte}
    </span>
  );
};

const n = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));

/**
 * Taxe de la ligne en devise (billet + service, sur les montants compagnie de la résa).
 * Le backend ne stocke pas la taxe sur la ligne billet : elle est recalculée ici pour l'affichage
 * (FRONTEND_PROMPT_CALCUL_PRIX_BACKEND.md). Les prix client renvoyés par l'API l'incluent déjà.
 */
const taxeDevise = (b: BilletLigne, ctx: Contexte) => {
  const t = n(ctx.tauxTaxe);
  if (t === undefined) return undefined;
  return ((n(b.puResaMontantBilletCompagnieDevise) ?? 0) + (n(b.puResaMontantServiceCompagnieDevise) ?? 0)) * t / 100;
};
const taxeAriary = (b: BilletLigne, ctx: Contexte, taux: unknown) => {
  const d = taxeDevise(b, ctx);
  const tx = n(taux);
  return d === undefined || !tx ? undefined : Math.round(d * tx);
};
const TITRE_TAXE = 'Taux de taxe de la prospection × (billet + service compagnie). Déjà inclus dans les prix client.';
const TITRE_DEVISE_EMISSION = "À l'émission, seul le taux change : prix en devise repris de la résa.";

// ─── Colonnes RÉSA ───────────────────────────────────────────
const COLONNES_RESA: Colonne[] = [
  { key: 'statut', label: 'Statut billet', align: 'left', minW: 'min-w-[160px]', render: statutCell },
  { key: 'resa', label: 'N° Résa', align: 'left', minW: 'min-w-[110px]', render: (b) => b.reservation || '—' },
  { key: 'taux', label: 'Taux Résa', render: (b) => fmtNombre(n(b.resaTauxEchange) as number) },
  { key: 'puBilletCie', label: 'PU Billet Cie', render: (b) => fmtDevise(n(b.puResaBilletCompagnieDevise) as number) },
  { key: 'puServiceCie', label: 'PU Service Cie', render: (b) => fmtDevise(n(b.puResaServiceCompagnieDevise) as number) },
  { key: 'puPenCie', label: 'PU Pénalité Cie', penalite: true, render: (b) => fmtDevise(n(b.puResaPenaliteCompagnieDevise) as number) },
  { key: 'mtBilletCieAr', label: 'Mt Billet Cie Ar', render: (b) => fmtAriary(n(b.puResaMontantBilletCompagnieAriary) as number) },
  { key: 'mtServiceCieAr', label: 'Mt Service Cie Ar', render: (b) => fmtAriary(n(b.puResaMontantServiceCompagnieAriary) as number) },
  { key: 'mtPenCieAr', label: 'Mt Pénalité Cie Ar', penalite: true, render: (b) => fmtAriary(n(b.puResaMontantPenaliteCompagnieAriary) as number) },
  { key: 'taxe', label: 'Taxe', title: TITRE_TAXE, render: (b, ctx) => { const v = taxeDevise(b, ctx); return v === undefined ? '—' : fmtDevise(v); } },
  { key: 'taxeAr', label: 'Taxe Ar', title: TITRE_TAXE, render: (b, ctx) => { const v = taxeAriary(b, ctx, b.resaTauxEchange); return v === undefined ? '—' : fmtAriary(v); } },
  { key: 'mtBilletCli', label: 'Mt Billet Client', render: (b) => fmtDevise(n(b.puResaMontantBilletClientDevise) as number) },
  { key: 'mtServiceCli', label: 'Mt Service Client', render: (b) => fmtDevise(n(b.puResaMontantServiceClientDevise) as number) },
  { key: 'mtBilletCliAr', label: 'Mt Billet Client Ar', render: (b) => fmtAriary(n(b.puResaMontantBilletClientAriary) as number) },
  { key: 'mtServiceCliAr', label: 'Mt Service Client Ar', render: (b) => fmtAriary(n(b.puResaMontantServiceClientAriary) as number) },
  { key: 'mtPenCliAr', label: 'Mt Pénalité Client Ar', penalite: true, render: (b) => fmtAriary(n(b.puResaMontantPenaliteClientAriary) as number) },
  { key: 'comDev', label: 'Commission', render: (b) => fmtDevise(n(b.resaCommissionEnDevise) as number) },
  { key: 'comAr', label: 'Commission Ar', render: (b) => fmtAriary(n(b.resaCommissionEnAriary) as number) },
];

// ─── Colonnes ÉMISSION ───────────────────────────────────────
// NB : le backend ne renvoie les prix d'émission qu'en Ariary (voir BACKEND_DONNEES_MANQUANTES.md)
const ecartTaux = (b: BilletLigne) => {
  const em = n(b.emissionTauxChange);
  const re = n(b.resaTauxEchange);
  if (!em || !re) return '—';
  const d = em - re;
  if (d === 0) return <span className="text-slate-400">=</span>;
  return (
    <span className={d > 0 ? 'text-red-600' : 'text-emerald-600'} title="Taux d'émission − taux de résa">
      {d > 0 ? '+' : ''}{fmtNombre(d)}
    </span>
  );
};

const COLONNES_EMISSION: Colonne[] = [
  {
    key: 'numeros', label: 'N° Billet(s)', align: 'left', minW: 'min-w-[130px]',
    render: (b) => (b.billet ?? []).map((x) => x.numeroBillet).filter(Boolean).join(', ') || '—',
  },
  { key: 'taux', label: 'Taux Émission', render: (b) => fmtNombre(n(b.emissionTauxChange) as number) },
  { key: 'ecart', label: 'Écart / Résa', render: ecartTaux },
  { key: 'puBilletCie', label: 'PU Billet Cie', title: TITRE_DEVISE_EMISSION, render: (b) => fmtDevise(n(b.puResaBilletCompagnieDevise) as number) },
  { key: 'puServiceCie', label: 'PU Service Cie', title: TITRE_DEVISE_EMISSION, render: (b) => fmtDevise(n(b.puResaServiceCompagnieDevise) as number) },
  { key: 'puPenCie', label: 'PU Pénalité Cie', penalite: true, title: TITRE_DEVISE_EMISSION, render: (b) => fmtDevise(n(b.puResaPenaliteCompagnieDevise) as number) },
  { key: 'puBilletCieAr', label: 'PU Billet Cie Ar', render: (b) => fmtAriary(n(b.puEmissionBilletCompagnieAriary) as number) },
  { key: 'puServiceCieAr', label: 'PU Service Cie Ar', render: (b) => fmtAriary(n(b.puEmissionServiceCompagnieAriary) as number) },
  { key: 'puPenCieAr', label: 'PU Pénalité Cie Ar', penalite: true, render: (b) => fmtAriary(n(b.puEmissionPenaliteCompagnieAriary) as number) },
  { key: 'mtBilletCieAr', label: 'Mt Billet Cie Ar', render: (b) => fmtAriary(n(b.emissionMontantBilletCompagnieAriary) as number) },
  { key: 'mtServiceCieAr', label: 'Mt Service Cie Ar', render: (b) => fmtAriary(n(b.emissionMontantServiceCompagnieAriary) as number) },
  { key: 'mtPenCieAr', label: 'Mt Pénalité Cie Ar', penalite: true, render: (b) => fmtAriary(n(b.emissionMontantPenaliteCompagnieAriary) as number) },
  { key: 'taxeAr', label: 'Taxe Ar', title: TITRE_TAXE, render: (b, ctx) => { const v = taxeAriary(b, ctx, b.emissionTauxChange); return v === undefined ? '—' : fmtAriary(v); } },
  { key: 'mtBilletCli', label: 'Mt Billet Client', title: TITRE_DEVISE_EMISSION, render: (b) => fmtDevise(n(b.puResaMontantBilletClientDevise) as number) },
  { key: 'mtServiceCli', label: 'Mt Service Client', title: TITRE_DEVISE_EMISSION, render: (b) => fmtDevise(n(b.puResaMontantServiceClientDevise) as number) },
  { key: 'mtBilletCliAr', label: 'Mt Billet Client Ar', render: (b) => fmtAriary(n(b.emissionMontantBilletClientAriary) as number) },
  { key: 'mtServiceCliAr', label: 'Mt Service Client Ar', render: (b) => fmtAriary(n(b.emissionMontantServiceClientAriary) as number) },
  { key: 'mtPenCliAr', label: 'Mt Pénalité Client Ar', penalite: true, render: (b) => fmtAriary(n(b.emissionMontantPenaliteClientAriary) as number) },
  { key: 'comDev', label: 'Commission', render: (b) => fmtDevise(n(b.emissionCommissionEnDevise) as number) },
  { key: 'comAr', label: 'Commission Ar', render: (b) => fmtAriary(n(b.emissionCommissionEnAriary) as number) },
];

// ─── Styles par vue ──────────────────────────────────────────
const STYLE: Record<VueBillet, {
  titre: string; icon: typeof Ticket; group: string; sub: string; cell: string; replie: string; chevron: string;
}> = {
  RESA: {
    titre: 'Prix Résa', icon: Ticket,
    group: 'bg-violet-700 border-violet-500 hover:bg-violet-600',
    sub: 'text-violet-700 bg-violet-50', cell: 'text-violet-800', replie: 'text-violet-700 bg-violet-50', chevron: 'text-violet-300',
  },
  EMISSION: {
    titre: 'Prix Émission', icon: Stamp,
    group: 'bg-amber-700 border-amber-500 hover:bg-amber-600',
    sub: 'text-amber-800 bg-amber-50', cell: 'text-amber-800', replie: 'text-amber-800 bg-amber-50', chevron: 'text-amber-300',
  },
};

export const colonnesVisibles = (vue: VueBillet, showPenalite: boolean) =>
  (vue === 'RESA' ? COLONNES_RESA : COLONNES_EMISSION).filter((c) => showPenalite || !c.penalite);

const alignCls = (a: Colonne['align'] = 'right') => (a === 'left' ? 'text-left' : a === 'center' ? 'text-center' : 'text-right');

// ─── En-tête ligne 1 (groupe) ────────────────────────────────
export function EnTeteGroupeBillet({
  vue, collapsed, onToggle, showPenalite,
}: { vue: VueBillet; collapsed: boolean; onToggle?: () => void; showPenalite: boolean }) {
  const s = STYLE[vue];
  const Icon = s.icon;
  return (
    <th
      colSpan={collapsed ? 1 : colonnesVisibles(vue, showPenalite).length}
      onClick={onToggle}
      className={`px-4 py-2 text-center text-xs font-bold uppercase text-white border-x transition-colors select-none ${onToggle ? 'cursor-pointer' : ''} ${s.group}`}
    >
      <div className="flex items-center justify-center gap-2">
        <Icon size={13} aria-hidden="true" className="inline shrink-0" /> {s.titre}
        {onToggle && <span className={`text-xs ${s.chevron}`}>{collapsed ? '▶' : '▼'}</span>}
      </div>
    </th>
  );
}

// ─── En-tête ligne 2 (sous-colonnes) ─────────────────────────
export function SousEnTetesBillet({
  vue, collapsed, showPenalite,
}: { vue: VueBillet; collapsed: boolean; showPenalite: boolean }) {
  const s = STYLE[vue];
  if (collapsed) {
    return <th className={`px-4 py-2 text-center text-xs italic ${s.sub}`}>— replié —</th>;
  }
  return (
    <>
      {colonnesVisibles(vue, showPenalite).map((c) => (
        <th key={c.key} title={c.title} className={`px-4 py-2 text-xs font-semibold ${alignCls(c.align)} ${c.minW ?? 'min-w-[130px]'} ${s.sub}`}>
          {c.label}
        </th>
      ))}
    </>
  );
}

// ─── Cellules d'une ligne de prospection ─────────────────────
export function CellulesBillet({
  vue, liee, collapsed, showPenalite, loading, tauxTaxe,
}: {
  vue: VueBillet;
  liee?: BilletLigneLiee;
  collapsed: boolean;
  showPenalite: boolean;
  loading?: boolean;
  /** Taux de taxe de la ligne de prospection (en %) */
  tauxTaxe?: number;
}) {
  const s = STYLE[vue];
  const cols = colonnesVisibles(vue, showPenalite);
  const b = liee?.principale;
  const disponible = vue === 'RESA' ? aResa(b) : aEmission(b);

  // Pas encore de billet / de résa / d'émission pour cette ligne
  if (!b || !disponible) {
    const msg = loading
      ? 'Chargement…'
      : !b
        ? 'Pas encore de billet'
        : vue === 'RESA' ? 'Pas encore réservée' : 'Pas encore émise';
    return (
      <td colSpan={collapsed ? 1 : cols.length} className={`px-4 py-4 text-center text-xs italic text-slate-400 bg-slate-50/60`}>
        {msg}
      </td>
    );
  }

  if (collapsed) {
    const resume = vue === 'RESA'
      ? `${b.reservation || '—'} · ${fmtAriary(n(b.puResaMontantBilletClientAriary) as number)} Ar`
      : `Taux ${fmtNombre(n(b.emissionTauxChange) as number)} · ${fmtAriary(n(b.emissionMontantBilletClientAriary) as number)} Ar`;
    return <td className={`px-4 py-4 text-center text-xs font-semibold whitespace-nowrap ${s.replie}`}>{resume}</td>;
  }

  const autres = (liee?.toutes.length ?? 1) - 1;
  return (
    <>
      {cols.map((c, i) => (
        <td key={c.key} className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${alignCls(c.align)} ${s.cell}`}>
          {c.render(b, { tauxTaxe })}
          {i === 0 && autres > 0 && (
            <span
              className="ml-1.5 rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500"
              title={`${autres} autre(s) ligne(s) billet liée(s) (reprogrammation, annulation, frais) — affichage de la ligne courante`}
            >
              +{autres}
            </span>
          )}
        </td>
      ))}
    </>
  );
}
