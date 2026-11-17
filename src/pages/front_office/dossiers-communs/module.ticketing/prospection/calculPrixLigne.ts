// src/pages/front_office/dossiers-communs/module.ticketing/prospection/calculPrixLigne.ts
//
// Calcul UNIQUE des prix d'une ligne de prospection, utilisé pour l'APERÇU pendant la saisie
// (Prospection.tsx, saisie en ligne, saisie détaillée).
//
// ⚠️ Même formule que le backend (voir BACKEND_CALCUL_PRIX_CENTRALISE.md § 4).
// Quand le backend calculera lui-même les montants, ces valeurs ne serviront plus qu'à l'affichage
// pendant la saisie : la valeur enregistrée sera celle renvoyée par l'API.
//
// Règles :
// - montant compagnie = PU × nombre ; Ariary = devise × taux de change
// - prix client hors taxe = montant compagnie × (1 + commission %)
// - la taxe s'applique au billet ET au service (sur les montants compagnie), sans commission
// - pas de taxe sur la pénalité
// - commission = prix client hors taxe − montant compagnie

export type ModeSaisieTaxe = 'POURCENTAGE' | 'MONTANT';

export interface EntreesPrixLigne {
  nombre: number;
  tauxEchange: number;
  /** Commission appliquée de l'en-tête, en % (60 = 60 %) */
  commissionPct: number;
  puBilletCieDevise: number;
  puServiceCieDevise: number;
  puPenaliteCieDevise: number;
  modeSaisieTaxe?: ModeSaisieTaxe | string;
  /** Taux de taxe en % (mode POURCENTAGE) */
  tauxTaxe?: number;
  /** Montant de taxe pour 1 billet (mode MONTANT) : converti en taux */
  montantTaxeBilletUnitaireDevise?: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function calculerPrixLigne(e: EntreesPrixLigne) {
  const nombre = num(e.nombre) || 1;
  const taux = num(e.tauxEchange);
  const commissionPct = num(e.commissionPct);
  const facteur = 1 + commissionPct / 100;

  // PU compagnie (saisis)
  const puBilletCieDevise = num(e.puBilletCieDevise);
  const puServiceCieDevise = num(e.puServiceCieDevise);
  const puPenaliteCieDevise = num(e.puPenaliteCieDevise);

  // Montants compagnie
  const mtBilletCieDevise = puBilletCieDevise * nombre;
  const mtServiceCieDevise = puServiceCieDevise * nombre;
  const mtPenaliteCieDevise = puPenaliteCieDevise * nombre;

  const puBilletCieAriary = puBilletCieDevise * taux;
  const puServiceCieAriary = puServiceCieDevise * taux;
  const puPenaliteCieAriary = puPenaliteCieDevise * taux;

  const mtBilletCieAriary = puBilletCieAriary * nombre;
  const mtServiceCieAriary = puServiceCieAriary * nombre;
  const mtPenaliteCieAriary = puPenaliteCieAriary * nombre;

  // Taxe : taux saisi, ou déduit du montant saisi pour 1 billet (règle de trois)
  const modeSaisieTaxe: ModeSaisieTaxe = e.modeSaisieTaxe === 'MONTANT' ? 'MONTANT' : 'POURCENTAGE';
  const tauxTaxe = modeSaisieTaxe === 'MONTANT'
    ? (puBilletCieDevise > 0 ? (num(e.montantTaxeBilletUnitaireDevise) / puBilletCieDevise) * 100 : 0)
    : num(e.tauxTaxe);
  const t = tauxTaxe / 100;
  const taxeBilletDevise = mtBilletCieDevise * t;
  const taxeServiceDevise = mtServiceCieDevise * t;
  const montantTaxeDevise = taxeBilletDevise + taxeServiceDevise; // taxe totale de la ligne
  const montantTaxeAriary = montantTaxeDevise * taux;

  // Prix client
  const mtBilletClientDeviseHorsTaxe = mtBilletCieDevise * facteur;
  const mtServiceClientDeviseHorsTaxe = mtServiceCieDevise * facteur;
  const mtPenaliteClientDevise = mtPenaliteCieDevise * facteur;

  const mtBilletClientDevise = mtBilletClientDeviseHorsTaxe + taxeBilletDevise;
  const mtServiceClientDevise = mtServiceClientDeviseHorsTaxe + taxeServiceDevise;

  const mtBilletClientAriary = mtBilletClientDevise * taux;
  const mtServiceClientAriary = mtServiceClientDevise * taux;
  const mtPenaliteClientAriary = mtPenaliteClientDevise * taux;

  // Commission (jamais sur la taxe)
  const commissionEnDevise = (mtBilletCieDevise + mtServiceCieDevise + mtPenaliteCieDevise) * (facteur - 1);
  const commissionEnAriary = commissionEnDevise * taux;

  return {
    nombre, taux, commissionPct, facteur,
    puBilletCieDevise, puServiceCieDevise, puPenaliteCieDevise,
    mtBilletCieDevise, mtServiceCieDevise, mtPenaliteCieDevise,
    puBilletCieAriary, puServiceCieAriary, puPenaliteCieAriary,
    mtBilletCieAriary, mtServiceCieAriary, mtPenaliteCieAriary,
    modeSaisieTaxe, tauxTaxe, taxeBilletDevise, taxeServiceDevise, montantTaxeDevise, montantTaxeAriary,
    mtBilletClientDeviseHorsTaxe, mtServiceClientDeviseHorsTaxe,
    mtBilletClientDevise, mtServiceClientDevise, mtPenaliteClientDevise,
    mtBilletClientAriary, mtServiceClientAriary, mtPenaliteClientAriary,
    commissionEnDevise, commissionEnAriary,
  };
}

export type PrixLigne = ReturnType<typeof calculerPrixLigne>;
