/**
 * Formatage des nombres partagé par toute l'application (locale fr-FR).
 * - Montants en devise : toujours 2 décimales      → 1 234,50
 * - Montants en Ariary : sans décimale             → 1 141 875
 * - Taux et quantités  : jusqu'à 2 décimales        → 4 900 / 1,5
 * Valeur absente ou invalide → « — » (même symbole partout).
 */
export const VIDE = '—';

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const devise = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ariary = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/** Montant en devise étrangère : « 210,00 ». Ajoute la devise si fournie : « 210,00 EUR ». */
export function fmtDevise(v: unknown, code?: string | null): string {
  const n = toNumber(v);
  if (n === null) return VIDE;
  return code ? `${devise.format(n)} ${code}` : devise.format(n);
}

/** Montant en Ariary : « 1 141 875 ». Avec `suffixe` : « 1 141 875 Ar ». */
export function fmtAriary(v: unknown, suffixe = false): string {
  const n = toNumber(v);
  if (n === null) return VIDE;
  return suffixe ? `${ariary.format(n)} Ar` : ariary.format(n);
}

/** Taux, pourcentages, quantités : « 4 900 », « 1,5 ». */
export function fmtNombre(v: unknown): string {
  const n = toNumber(v);
  if (n === null) return VIDE;
  return nombre.format(n);
}

/** Crédit client : « CREDIT_60 » → « 60 jours », « CREDIT_0 » → « Au comptant ». */
export function fmtCredit(credit?: string | null): string {
  if (!credit) return VIDE;
  const jours = Number(String(credit).replace(/\D/g, ''));
  if (!String(credit).match(/\d/) || Number.isNaN(jours)) return credit;
  return jours === 0 ? 'Au comptant' : `${jours} jours`;
}
