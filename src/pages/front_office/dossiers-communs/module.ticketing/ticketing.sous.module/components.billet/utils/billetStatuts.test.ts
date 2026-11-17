import { describe, expect, it } from 'vitest';
import {
  estLectureSeule,
  libelleDossier,
  libelleLigne,
  messageRenvoiOdoo,
  motifBlocageApprouver,
  motifBlocageEmettre,
  peutAnnuler,
  peutMettreAJourResa,
  peutReprogrammer,
  peutReserver,
  peutSaisirNumeros,
  texteResumeLignes,
} from './billetStatuts';

const ligne = (referenceLine: string, statut: string, etatOdoo = 'AUCUN', statusLigne = 'INITIALE') =>
  ({ referenceLine, statut, etatOdoo, statusLigne });

const creer = { statut: 'CREER' };

describe('Approuver', () => {
  it("bloque tant qu'une ligne active est à réserver, avec la liste des lignes", () => {
    const motif = motifBlocageApprouver(creer, [ligne('A_10', 'CREER'), ligne('B_10', 'FAIT')]);
    expect(motif).toBe("Réservez d'abord toutes les lignes : A_10 (à réserver)");
  });

  it('ignore les lignes annulées ou remplacées', () => {
    const lignes = [ligne('A_10', 'ANNULER'), ligne('A_30', 'FAIT', 'AUCUN', 'MODIFIER'), ligne('B_10', 'CLOTURER', 'VALIDE')];
    expect(motifBlocageApprouver(creer, lignes)).toBeNull();
  });

  it('actif pour renvoyer une vente rejetée, quel que soit le statut du dossier', () => {
    expect(motifBlocageApprouver({ statut: 'BC_CLIENT_A_APPROUVER' }, [ligne('A_10', 'FAIT', 'REJETE')])).toBeNull();
  });

  it("bloqué quand toutes les ventes attendent Odoo ou sont validées", () => {
    expect(motifBlocageApprouver(creer, [ligne('A_10', 'FAIT', 'ENVOYE')])).toBe("Vente en attente de la réponse d'Odoo");
    expect(motifBlocageApprouver(creer, [ligne('A_10', 'FAIT', 'VALIDE')])).toBe('Aucune vente à envoyer à Odoo');
  });

  it('bloqué sur un dossier annulé', () => {
    expect(motifBlocageApprouver({ statut: 'ANNULER' }, [ligne('A_10', 'FAIT')])).not.toBeNull();
  });
});

describe('Émettre', () => {
  it('bloqué tant que les numéros ne sont pas saisis partout', () => {
    const motif = motifBlocageEmettre(creer, [ligne('A_10', 'CLOTURER'), ligne('A_30', 'FAIT', 'VALIDE')]);
    expect(motif).toContain('numéros de billet saisis : A_30');
  });

  it('actif quand toutes les lignes actives sont CLOTURER et une est à envoyer (ou rejetée)', () => {
    const lignes = [ligne('A_10', 'ANNULER'), ligne('A_20', 'CLOTURER', 'AUCUN', 'ANNULATION'), ligne('B_10', 'CLOTURER', 'VALIDE')];
    expect(motifBlocageEmettre({ statut: 'BC_CLIENT_A_APPROUVER' }, lignes)).toBeNull();
    expect(motifBlocageEmettre({ statut: 'BC_CLIENT_A_APPROUVER' }, [ligne('B_10', 'CLOTURER', 'REJETE')])).toBeNull();
  });

  it('bloqué quand tous les achats attendent Odoo', () => {
    expect(motifBlocageEmettre(creer, [ligne('A_10', 'CLOTURER', 'ENVOYE')])).toBe("Achat en attente de la réponse d'Odoo");
  });
});

describe('Boutons de ligne', () => {
  const dossier = { statut: 'BC_CLIENT_A_APPROUVER' };
  const boutons = (l: ReturnType<typeof ligne>) => [
    peutReserver(dossier, l),
    peutSaisirNumeros(dossier, l),
    peutReprogrammer(dossier, l),
    peutAnnuler(dossier, l),
  ];

  it('CREER : Réserver, Modifier avec conditions, Annuler', () => {
    expect(boutons(ligne('A_10', 'CREER'))).toEqual([true, false, true, true]);
  });

  it('FAIT / AUCUN ou REJETE : pas de saisie des numéros avant validation de la vente', () => {
    expect(boutons(ligne('A_10', 'FAIT'))).toEqual([true, false, true, true]);
    expect(boutons(ligne('A_10', 'FAIT', 'REJETE'))).toEqual([true, false, true, true]);
  });

  it('FAIT / VALIDE : tout est possible', () => {
    expect(boutons(ligne('A_10', 'FAIT', 'VALIDE'))).toEqual([true, true, true, true]);
  });

  it('CLOTURER : correction des numéros tant que l\'achat n\'est pas validé', () => {
    expect(boutons(ligne('A_10', 'CLOTURER'))).toEqual([false, true, true, true]);
    expect(boutons(ligne('A_10', 'CLOTURER', 'REJETE'))).toEqual([false, true, true, true]);
    expect(boutons(ligne('A_10', 'CLOTURER', 'VALIDE'))).toEqual([false, false, true, true]);
    expect(peutMettreAJourResa(dossier, ligne('A_10', 'CLOTURER'))).toBe(false);
  });

  it("ligne en attente d'Odoo : verrouillée", () => {
    expect(boutons(ligne('A_10', 'FAIT', 'ENVOYE'))).toEqual([false, false, false, false]);
    expect(boutons(ligne('A_10', 'CLOTURER', 'ENVOYE'))).toEqual([false, false, false, false]);
  });

  it('lignes annulées, remplacées, de frais, ou dossier annulé : lecture seule', () => {
    expect(estLectureSeule(dossier, ligne('A_10', 'ANNULER'))).toBe(true);
    expect(estLectureSeule(dossier, ligne('A_10', 'MODIFIER'))).toBe(true);
    expect(estLectureSeule(dossier, ligne('A_20', 'FAIT', 'AUCUN', 'ANNULATION'))).toBe(true);
    expect(estLectureSeule({ statut: 'ANNULER' }, ligne('A_10', 'FAIT'))).toBe(true);
  });
});

describe('Libellés', () => {
  it('ligne : statut × etatOdoo', () => {
    expect(libelleLigne(ligne('A_10', 'FAIT', 'REJETE'))).toEqual({ texte: 'Vente rejetée', ton: 'erreur' });
    expect(libelleLigne(ligne('A_10', 'CLOTURER', 'VALIDE')).texte).toBe('Émise');
    expect(libelleLigne(ligne('A_10', 'MODIFIER')).texte).toBe('Annulée');
  });

  it('dossier : statut × etatOdoo', () => {
    expect(libelleDossier({ statut: 'CREER', etatOdoo: 'REJETE' }).texte).toBe('Vente rejetée, à corriger');
    expect(libelleDossier({ statut: 'BC_CLIENT_A_APPROUVER', etatOdoo: 'ENVOYE' }).texte).toBe("Achat en attente d'Odoo");
  });

  it('résumé : compteurs non nuls seulement', () => {
    const resume = {
      total: 4, aReserver: 0, aApprouver: 0, venteEnAttente: 1, venteRejetee: 1, aSaisir: 0,
      aEmettre: 0, achatEnAttente: 0, achatRejete: 0, emises: 2, annulees: 0,
    };
    expect(texteResumeLignes(resume)).toBe("1 vente rejetée · 1 vente en attente d'Odoo · 2 émises");
  });

  it('confirmation seulement hors CREER', () => {
    expect(messageRenvoiOdoo(creer)).toBeNull();
    expect(messageRenvoiOdoo({ statut: 'FACTURE_REGLEE' })).toContain('renvoyée à Odoo');
  });
});
