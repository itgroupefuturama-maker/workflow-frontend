import type { BilletLigne, EtatOdoo, ResumeLignes } from '../../../../../../../app/front_office/billetSlice';

// Règles du backend (voir FRONTEND_PROMPT_COMPORTEMENT_STATUTS_BILLET.md) : le front masque ou désactive ce que
// le backend refuserait. Le backend garde ces contrôles (refus avec un message à afficher tel quel).
// `statut` et `etatOdoo` sont calculés par le backend : Odoo répond ligne par ligne (validation ou rejet).

type Ligne = Pick<BilletLigne, 'statut' | 'statusLigne' | 'referenceLine'> & {
  etatOdoo?: EtatOdoo | string | null;
};
type Entete = { statut?: string; etatOdoo?: EtatOdoo | string | null } | null | undefined;

const etat = (l: Ligne) => l.etatOdoo ?? 'AUCUN';
const aEnvoyer = (l: Ligne) => etat(l) === 'AUCUN' || etat(l) === 'REJETE';

// ANNULER (annulée ou remplacée) ; MODIFIER : anciennes données, traité comme ANNULER
export const estTerminee = (l: Ligne) => l.statut === 'ANNULER' || l.statut === 'MODIFIER';
// Ligne de frais d'annulation (X_20) : part à Odoo avec le dossier mais reste en lecture seule
export const estLigneFrais = (l: Ligne) => l.statusLigne === 'ANNULATION';
// Envoyée à Odoo, réponse attendue : verrouillée
export const estEnAttente = (l: Ligne) => etat(l) === 'ENVOYE';

const actives = (lignes: Ligne[]) => lignes.filter((l) => !estTerminee(l));

// ─── Libellés (badges) ───

export type Ton = 'neutre' | 'info' | 'attente' | 'succes' | 'erreur';

// Lecture d'une ligne : statut × etatOdoo
export const libelleLigne = (l: Ligne): { texte: string; ton: Ton } => {
  if (estTerminee(l)) return { texte: 'Annulée', ton: 'neutre' };
  const e = etat(l);
  if (l.statut === 'CREER') return { texte: 'À réserver', ton: 'neutre' };
  if (l.statut === 'FAIT') {
    if (e === 'ENVOYE') return { texte: "Vente en attente d'Odoo", ton: 'attente' };
    if (e === 'VALIDE') return { texte: 'Vente validée, numéros à saisir', ton: 'info' };
    if (e === 'REJETE') return { texte: 'Vente rejetée', ton: 'erreur' };
    return { texte: 'Réservée, à approuver', ton: 'info' };
  }
  if (l.statut === 'CLOTURER') {
    if (e === 'ENVOYE') return { texte: "Achat en attente d'Odoo", ton: 'attente' };
    if (e === 'VALIDE') return { texte: 'Émise', ton: 'succes' };
    if (e === 'REJETE') return { texte: 'Achat rejeté', ton: 'erreur' };
    return { texte: 'À émettre', ton: 'info' };
  }
  return { texte: l.statut || '—', ton: 'neutre' };
};

// Lecture du dossier : statut × etatOdoo
export const libelleDossier = (entete: Entete): { texte: string; ton: Ton } => {
  const e = entete?.etatOdoo ?? 'AUCUN';
  switch (entete?.statut) {
    case 'ANNULER':
      return { texte: 'Annulé', ton: 'neutre' };
    case 'CREER':
      if (e === 'ENVOYE') return { texte: "Vente en attente d'Odoo", ton: 'attente' };
      if (e === 'REJETE') return { texte: 'Vente rejetée, à corriger', ton: 'erreur' };
      return { texte: 'À réserver ou à approuver', ton: 'info' };
    case 'BC_CLIENT_A_APPROUVER':
      if (e === 'ENVOYE') return { texte: "Achat en attente d'Odoo", ton: 'attente' };
      if (e === 'VALIDE') return { texte: 'Vente validée', ton: 'succes' };
      if (e === 'REJETE') return { texte: 'Achat rejeté, à corriger', ton: 'erreur' };
      return { texte: 'Numéros à saisir ou à émettre', ton: 'info' };
    case 'BILLET_EMIS':
      return { texte: 'Billet émis', ton: 'succes' };
    case 'FACTURE_EMISE':
      return { texte: 'Facture émise', ton: 'succes' };
    case 'FACTURE_REGLEE':
      return { texte: 'Facture réglée', ton: 'succes' };
    default:
      return { texte: entete?.statut || '—', ton: 'neutre' };
  }
};

// « 1 vente rejetée · 1 vente en attente d'Odoo · 1 émise » : compteurs non nuls seulement
const LIBELLES_RESUME: [keyof ResumeLignes, string, string][] = [
  ['venteRejetee', 'vente rejetée', 'ventes rejetées'],
  ['achatRejete', 'achat rejeté', 'achats rejetés'],
  ['aReserver', 'à réserver', 'à réserver'],
  ['aApprouver', 'à approuver', 'à approuver'],
  ['venteEnAttente', "vente en attente d'Odoo", "ventes en attente d'Odoo"],
  ['aSaisir', 'numéros à saisir', 'numéros à saisir'],
  ['aEmettre', 'à émettre', 'à émettre'],
  ['achatEnAttente', "achat en attente d'Odoo", "achats en attente d'Odoo"],
  ['emises', 'émise', 'émises'],
  ['annulees', 'annulée', 'annulées'],
];

export const texteResumeLignes = (resume?: ResumeLignes | null): string =>
  resume
    ? LIBELLES_RESUME.filter(([cle]) => resume[cle] > 0)
        .map(([cle, un, plusieurs]) => `${resume[cle]} ${resume[cle] > 1 ? plusieurs : un}`)
        .join(' · ')
    : '';

// « A_10 (à réserver), B_10 (à réserver) »
const listeLignes = (lignes: Ligne[]) =>
  lignes.map((l) => `${l.referenceLine || '?'} (${libelleLigne(l).texte.toLowerCase()})`).join(', ');

// ─── Dossier ───

// Approuver (envoi des ventes) : plus aucune ligne à réserver, et au moins une ligne réservée à envoyer
export const motifBlocageApprouver = (entete: Entete, lignes: Ligne[]): string | null => {
  if (entete?.statut === 'ANNULER') return 'Le dossier est annulé';
  const a = actives(lignes);
  const aReserver = a.filter((l) => l.statut === 'CREER');
  if (aReserver.length) return `Réservez d'abord toutes les lignes : ${listeLignes(aReserver)}`;
  if (!a.some((l) => l.statut === 'FAIT' && aEnvoyer(l))) {
    return a.some((l) => l.statut === 'FAIT' && estEnAttente(l))
      ? "Vente en attente de la réponse d'Odoo"
      : 'Aucune vente à envoyer à Odoo';
  }
  return null;
};

// Émettre (envoi des achats) : toutes les lignes actives ont leurs numéros, et au moins une est à envoyer
export const motifBlocageEmettre = (entete: Entete, lignes: Ligne[]): string | null => {
  if (entete?.statut === 'ANNULER') return 'Le dossier est annulé';
  const a = actives(lignes);
  if (a.length === 0) return 'Le dossier ne contient aucune ligne active';
  const aSaisir = a.filter((l) => l.statut !== 'CLOTURER');
  if (aSaisir.length) return `Toutes les lignes doivent avoir leurs numéros de billet saisis : ${listeLignes(aSaisir)}`;
  if (!a.some(aEnvoyer)) {
    return a.some(estEnAttente) ? "Achat en attente de la réponse d'Odoo" : 'Aucun achat à envoyer à Odoo';
  }
  return null;
};

// Message de confirmation avant une modification ou une annulation (null : dossier CREER, rien à dire)
export const messageRenvoiOdoo = (entete: Entete): string | null =>
  !entete?.statut || entete.statut === 'CREER'
    ? null
    : 'Après cette modification, la ligne devra être renvoyée à Odoo (Approuver, puis Émettre).';

// ─── Ligne ───

// Dossier annulé, ligne annulée ou remplacée, ligne de frais, ou ligne en attente d'Odoo : aucun bouton
export const estLectureSeule = (entete: Entete, l: Ligne) =>
  entete?.statut === 'ANNULER' || estTerminee(l) || estLigneFrais(l) || estEnAttente(l);

// Réserver (CREER) ou mettre à jour la réservation (FAIT, y compris rejetée ou déjà validée)
export const peutReserver = (entete: Entete, l: Ligne) =>
  !estLectureSeule(entete, l) && (l.statut === 'CREER' || l.statut === 'FAIT');
export const peutMettreAJourResa = (entete: Entete, l: Ligne) => !estLectureSeule(entete, l) && l.statut === 'FAIT';
// Saisie des numéros de billet : après validation de la vente de la ligne, ou pour corriger un achat pas validé
export const peutSaisirNumeros = (entete: Entete, l: Ligne) =>
  !estLectureSeule(entete, l) &&
  ((l.statut === 'FAIT' && etat(l) === 'VALIDE') || (l.statut === 'CLOTURER' && etat(l) !== 'VALIDE'));
export const peutReprogrammer = (entete: Entete, l: Ligne) => !estLectureSeule(entete, l);
export const peutAnnuler = (entete: Entete, l: Ligne) => !estLectureSeule(entete, l);

export const CLASSES_TON: Record<Ton, string> = {
  neutre: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  attente: 'bg-amber-50 text-amber-700 border-amber-200',
  succes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  erreur: 'bg-red-50 text-red-700 border-red-200',
};
