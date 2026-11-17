// utils/billetPassagerPdf.ts
// Données du billet agence (PDF) d'un passager : partagé par la liste des passagers et la fenêtre d'achat.

import type { BilletEntete, BilletLigne } from '../../../../../../../app/front_office/billetSlice';
import type { BilletPassagerData, BilletPassagerExigence, BilletPassagerService } from '../../../../module.pdf/pdf.generation/generators/billet-passager.generator';

// Liste dédupliquée des exigences de voyage rattachées à la ligne (identique pour tous les passagers de la ligne)
export const collectExigences = (ligne: BilletLigne): BilletPassagerExigence[] => {
  const p = ligne.prospectionLigne;
  const raw = p.destinationVoyage?.pays?.paysVoyage
    ?.map((pv: { exigenceVoyage: BilletPassagerExigence }) => pv.exigenceVoyage)
    .filter(Boolean) ?? [];
  const seen = new Set<string>();
  return raw.filter((e: BilletPassagerExigence) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
};


export const buildBilletData = (
  b: BilletLigne['billet'][0],
  ligne: BilletLigne,
  billetEntete: BilletEntete,
): BilletPassagerData => {
  const info = b.clientbeneficiaireInfo;
  const p    = ligne.prospectionLigne;
  const ent  = billetEntete.prospectionEntete;

  // Collecte des exigences depuis la destination (comme le devis)
  const exigences: BilletPassagerExigence[] =
    p.destinationVoyage?.pays?.paysVoyage
      ?.map((pv: { exigenceVoyage: BilletPassagerExigence }) => pv.exigenceVoyage)
      .filter(Boolean) ?? [];

  // Services depuis prospectionLigne (comme le devis)
  const services: BilletPassagerService[] =
    (p.serviceProspectionLigne ?? []).map(s => ({
      libelle:     s.serviceSpecifique?.libelle    ?? '—',
      code:        s.serviceSpecifique?.code       ?? '—',
      type:        s.serviceSpecifique?.type       ?? null,
      typeService: s.serviceSpecifique?.typeService ?? '—',
      valeur:      s.valeur,
    }));

  return {
    // Passager
    nom:             info.nom,
    prenom:          info.prenom,
    nationalite:     info.nationalite,
    typeDoc:         info.typeDoc,
    referenceDoc:    info.referenceDoc,
    dateValiditeDoc: info.dateValiditeDoc,
    clientType:      info.clientType ?? '—',
    tel:             info.tel       || undefined,
    whatsapp:        info.whatsapp  || undefined,
    // Billet
    numeroBillet:        b.numeroBillet,
    statut:              b.statut,
    numeroBilletEntete:  billetEntete.numeroBillet,
    totalCompagnie:      billetEntete.totalCompagnie,
    commissionPropose:   billetEntete.commissionPropose,
    commissionAppliquer: billetEntete.commissionAppliquer,
    totalCommission:     billetEntete.totalCommission,
    // Dossier
    numeroDossier: ent?.prestation?.numeroDos   ?? '—',
    fournisseur:   ent?.fournisseur?.libelle    ?? '—',
    typeVol:       ent?.typeVol                 ?? '—',
    credit:        ent?.credit                  ?? '—',
    dateEmission:  b.createdAt,
    agence:        'AGT — AL BOURAQ TRAVEL',
    // Ligne de vol — tout ce qui est dans BilletLigne + ProspectionLigne
    ligne: {
      numeroDosRef:   p.numeroDosRef           ?? '—',
      numeroVol:      p.numeroVol              ?? '—',
      avion:          p.avion                  ?? '—',
      itineraire:     p.itineraire             ?? '—',
      classe:         p.classe                 ?? '—',
      typePassager:   p.typePassager           ?? '—',
      nombre:         p.nombre                 ?? 1,
      dateHeureDepart: p.dateHeureDepart,
      dateHeureArrive: p.dateHeureArrive,
      dureeVol:       p.dureeVol               ?? '—',
      dureeEscale:    p.dureeEscale            ?? '—',
      devise:         p.devise                 ?? '—',
      tauxEchange:    p.tauxEchange            ?? 0,
      // Prospection
      puBilletCompagnieDevise:         p.puBilletCompagnieDevise       ?? 0,
      puServiceCompagnieDevise:        p.puServiceCompagnieDevise      ?? 0,
      puPenaliteCompagnieDevise:       p.puPenaliteCompagnieDevise     ?? 0,
      montantBilletClientDevise:       p.montantBilletClientDevise     ?? 0,
      montantServiceClientDevise:      p.montantServiceClientDevise    ?? 0,
      montantPenaliteClientDevise:     p.montantPenaliteClientDevise   ?? 0,
      montantBilletCompagnieAriary:    p.montantBilletCompagnieAriary  ?? 0,
      montantServiceCompagnieAriary:   p.montantServiceCompagnieAriary ?? 0,
      montantPenaliteCompagnieAriary:  p.montantPenaliteCompagnieAriary ?? 0,
      montantBilletClientAriary:       p.montantBilletClientAriary     ?? 0,
      montantServiceClientAriary:      p.montantServiceClientAriary    ?? 0,
      montantPenaliteClientAriary:     p.montantPenaliteClientAriary   ?? 0,
      commissionEnDevise:              p.commissionEnDevise            ?? 0,
      commissionEnAriary:              p.commissionEnAriary            ?? 0,
      conditionModif:                  p.conditionModif,
      conditionAnnul:                  p.conditionAnnul,
      modePaiement:                    p.modePaiement                  ?? '—',
      // Réservation (depuis BilletLigne)
      reservation:                        ligne.reservation,
      puResaBilletCompagnieDevise:         ligne.puResaBilletCompagnieDevise,
      puResaServiceCompagnieDevise:        ligne.puResaServiceCompagnieDevise,
      puResaPenaliteCompagnieDevise:       ligne.puResaPenaliteCompagnieDevise,
      resaTauxEchange:                     ligne.resaTauxEchange,
      puResaBilletClientAriary:            ligne.puResaBilletClientAriary,
      puResaServiceClientAriary:           ligne.puResaServiceClientAriary,
      puResaPenaliteClientAriary:          ligne.puResaPenaliteClientAriary,
      puResaMontantBilletCompagnieAriary:  ligne.puResaMontantBilletCompagnieAriary,
      puResaMontantServiceCompagnieAriary: ligne.puResaMontantServiceCompagnieAriary,
      puResaMontantPenaliteCompagnieAriary:ligne.puResaMontantPenaliteCompagnieAriary,
      resaCommissionEnDevise:              ligne.resaCommissionEnDevise,
      resaCommissionEnAriary:              ligne.resaCommissionEnAriary,
      // Émission (depuis BilletLigne)
      emissionTauxChange:                     ligne.emissionTauxChange,
      emissionMontantBilletCompagnieAriary:    ligne.emissionMontantBilletCompagnieAriary,
      emissionMontantServiceCompagnieAriary:   ligne.emissionMontantServiceCompagnieAriary,
      emissionMontantPenaliteCompagnieAriary:  ligne.emissionMontantPenaliteCompagnieAriary,
      emissionMontantBilletClientAriary:       ligne.emissionMontantBilletClientAriary,
      emissionMontantServiceClientAriary:      ligne.emissionMontantServiceClientAriary,
      emissionMontantPenaliteClientAriary:     ligne.emissionMontantPenaliteClientAriary,
      emissionCommissionEnDevise:              ligne.emissionCommissionEnDevise,
      emissionCommissionEnAriary:              ligne.emissionCommissionEnAriary,
      // Services & destination
      services,
      destinationVoyage: p.destinationVoyage,
    },
    exigences,
  };
};

