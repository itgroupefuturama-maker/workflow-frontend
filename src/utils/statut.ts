/**
 * Libellés français des codes de statut renvoyés par l'API.
 * Utiliser `formatStatut(code)` partout où un statut est affiché, plutôt que
 * `code.replace(/_/g, ' ')`, pour garder les accents et un vocabulaire homogène.
 */
const STATUT_LABELS: Record<string, string> = {
  CREER: 'Créé',
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  ACCEPTER: 'Accepté',
  REFUSER: 'Refusé',
  VALIDER: 'Validé',
  VALIDE: 'Validé',
  APPROUVE: 'Approuvé',
  ANNULE: 'Annulé',
  ACHEVE: 'Achevé',
  INACHEVE: 'Inachevé',
  ENVOYE: 'Envoyé',
  ENREGISTRE: 'Enregistré',
  RECU: 'Reçu',
  EMIS: 'Émis',
  ECHEC: 'Échec',
  ECHOUE: 'Échoué',
  PLANIFIE: 'Planifié',
  REPORTE: 'Reporté',
  CONFORME: 'Conforme',
  BIENTOT: 'Bientôt',
  OUVERT: 'Ouvert',
  FERME: 'Fermé',
  TRES_ELEVE: 'Très élevé',
  ELEVE: 'Élevé',
  MOYEN: 'Moyen',
  FAIBLE: 'Faible',
  CRITIQUE: 'Critique',
  LAISSE_PASSER: 'Laissez-passer',
  TITRE_SEJOUR: 'Titre de séjour',
  MODIFIER: 'Modifié',
  ANNULER: 'Annulé',
  FAIT: 'Fait',
  CLOTURER: 'Clôturé',
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  A_ENREGISTRER: 'À enregistrer',
  DEVIS_EN_ATTENTE: 'Devis en attente',
  DEVIS_A_APPROUVER: 'Devis à approuver',
  DEVIS_APPROUVE: 'Devis approuvé',
  BC_CLIENT_A_APPROUVER: 'BC client à approuver',
  APPROBATION_BC_CLIENT: 'Approbation BC client',
  APPROBATION_BC_FOURNISSEUR: 'Approbation BC fournisseur',
  CREATION_BC_FOURNISSEUR: 'Création BC fournisseur',
  CREATION_BR_FOURNISSEUR: 'Création BR fournisseur',
  CREATION_FACTURE_CLIENT: 'Création facture client',
  CREATION_FACTURE_FOURNISSEUR: 'Création facture fournisseur',
  BILLET_EMIS: 'Billet émis',
  BILLET_ACHAT_VALIDE: 'Achat validé',
  BILLET_VENTE_VALIDEE: 'Vente validée',
  BILLET_VENTE_REJETEE: 'Vente rejetée',
  BILLET_ACHAT_REJETE: 'Achat rejeté',
  BILLET_FACTURE_EMISE: 'Facture émise',
  BILLET_FACTURE_REGLEE: 'Facture réglée',
  FACTURE_EMISE: 'Facture émise',
  FACTURE_REGLEE: 'Facture réglée',
};

/** « BILLET_EMIS » → « Billet émis » ; code inconnu → « Code inconnu » (underscores retirés). */
export function formatStatut(code?: string | null): string {
  if (!code) return '—';
  const known = STATUT_LABELS[code];
  if (known) return known;
  const words = code.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
