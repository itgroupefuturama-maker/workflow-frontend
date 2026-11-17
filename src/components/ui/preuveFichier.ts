// src/components/ui/preuveFichier.ts
// Règles des pièces jointes « preuve » (FRONTEND_PROMPT_DEUX_PREUVES_RESERVATION.md) :
// PNG, JPG, WEBP ou PDF, 5 Mo max par fichier.

export const PREUVE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const PREUVE_ACCEPT = '.png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf';
export const PREUVE_TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo

export const estPdf = (nomOuType: string) => /pdf$/i.test(nomOuType);

/** Contrôle immédiat avant l'envoi : renvoie un message d'erreur, ou null si le fichier est accepté. */
export function validerFichierPreuve(file: File, libelle: string): string | null {
  const typeOk = PREUVE_TYPES.includes(file.type) || /\.(png|jpe?g|webp|pdf)$/i.test(file.name);
  if (!typeOk) return `${libelle} doit être une image PNG, JPG, WEBP ou un PDF`;
  if (file.size > PREUVE_TAILLE_MAX) return `${libelle} dépasse 5 Mo`;
  return null;
}
