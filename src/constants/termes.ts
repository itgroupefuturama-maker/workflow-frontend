// Vocabulaire du « fournisseur » selon le module : en ticketing on parle de compagnie aérienne.
export type TermeFournisseur = 'fournisseur' | 'compagnie';
export const TERMES_FOURNISSEUR: Record<TermeFournisseur, {
  label: string; pluriel: string; choisir: string; ce: string; bloque: string; autre: string; changer: string; commentaire: string; risque: string;
}> = {
  fournisseur: {
    label: 'Fournisseur', pluriel: 'fournisseurs', choisir: '— Choisir un fournisseur —', ce: 'Ce fournisseur',
    bloque: 'Fournisseur bloqué', autre: 'Veuillez en sélectionner un autre', changer: 'Changer de fournisseur',
    commentaire: 'Commentaire fournisseur', risque: 'Fournisseur à risque très élevé',
  },
  compagnie: {
    label: 'Compagnie', pluriel: 'compagnies', choisir: '— Choisir une compagnie —', ce: 'Cette compagnie',
    bloque: 'Compagnie bloquée', autre: 'Veuillez en sélectionner une autre', changer: 'Changer de compagnie',
    commentaire: 'Commentaire compagnie', risque: 'Compagnie à risque très élevé',
  },
};
