
// ─── Entités de base ─────────────────────────────────────────────────

import type { BenchmarkingEntete, HotelDevisData, BenchService, DeviseHotelDevis } from "../../../../../../app/front_office/parametre_hotel/hotelDevisSlice";

export interface HotelFournisseur {
  id: string;
  code: string;
  libelle: string;
  status: string;
  // Non garantis par l'entête de prospection (hotelProspectionEnteteSlice.FournisseurLight
  // ne fournit que id/code/libelle/status) ; renseignés côté devis (normalizeDevisToEntete) :
  dateApplication?: string;
  dateActivation?: string;
  dateDesactivation?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelPrestation {
  id: string;
  numeroDos: string;
  // Non garantis par l'entête de prospection (hotelProspectionEnteteSlice.PrestationLight
  // ne fournit que id/numeroDos) ; renseignés côté devis (normalizeDevisToEntete) :
  status?: string;
  dossierCommunColabId?: string;
  dossierId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelDevise {
  id: string;
  devise: string;
  status: string;
  // Non garantis par hotelProspectionEnteteSlice.DeviseHotel.devise (non lus par le générateur PDF) :
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelTypeChambre {
  id: string;
  type: string;
  capacite: number;
  // Non garantis par hotelProspectionEnteteSlice (typeChambre inline, non lus par le générateur PDF) :
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelPlateforme {
  id: string;
  code: string;
  nom: string;
  status: string;
  // Non garantis par hotelProspectionEnteteSlice (plateforme inline, non lus par le générateur PDF) :
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelServiceSpecifique {
  id: string;
  code: string;
  libelle: string;
  type: string | null;
  typeService: string;
  // Non garantis par hotelProspectionEnteteSlice.BenchService.serviceSpecifique (non lus par le générateur PDF) :
  createdAt?: string;
  updatedAt?: string;
}

// ─── DeviseHotel (par ligne) ─────────────────────────────────────────

export interface HotelDeviseHotel {
  id: string;
  // Non lu par le générateur PDF ; l'API sérialise parfois ces champs en string
  // (cf. hotelProspectionEnteteSlice.DeviseHotel) :
  nuiteDevise: number | string;
  nuiteAriary: number | string;
  montantDevise: number;
  montantAriary: number;
  tauxChange: number;
  // Non lus par le générateur PDF (cf. hotelProspectionEnteteSlice.DeviseHotel /
  // hotelDevisSlice.DeviseHotelDevis, dont le type ne les expose pas tous) :
  benchmarkingLigneId?: string;
  deviseId?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  devise: HotelDevise;
}

// ─── Ligne de benchmarking ───────────────────────────────────────────

export interface HotelBenchmarkingLigne {
  id: string;
  hotel: string;
  nombreChambre: number;
  isBenchMark: boolean;
  isRefundable: boolean;
  dateLimiteAnnulation: string | null;
  plateforme: HotelPlateforme;
  typeChambre: HotelTypeChambre;
  deviseHotel: HotelDeviseHotel[];
  // Non garantis par hotelProspectionEnteteSlice.BenchmarkingEntete.benchmarkingLigne (non lus par le générateur PDF) :
  benchmarkingEnteteId?: string;
  plateformeId?: string;
  typeChambreId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Service d'un benchmarking ───────────────────────────────────────

export interface HotelBenchService {
  id: string;
  serviceSpecifiqueId: string;
  serviceSpecifique: HotelServiceSpecifique;
  // Non garantis par hotelProspectionEnteteSlice.BenchService (non lus par le générateur PDF) :
  benchmarkingEnteteId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Entête de benchmarking ──────────────────────────────────────────

export interface HotelBenchmarkingEntete {
  id: string;
  numero: string;
  du: string;
  au: string;
  nuite: number;
  pays: string;
  ville: string;
  tauxPrixUnitaire: number;
  forfaitaireUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  benchService: HotelBenchService[];
  benchmarkingLigne: HotelBenchmarkingLigne[];
  // Non garantis par hotelProspectionEnteteSlice.BenchmarkingEntete (non lus par le générateur PDF) :
  hotelProspectionEnteteId?: string;
  dateLimitePaiement?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Ligne client du devis (structure différente du benchmarking) ────

export interface HotelDevisLigneClient {
  id: string;
  hotel: string;
  plateforme: HotelPlateforme;
  deviseHotel: HotelDeviseHotel[];
  isBenchMark: boolean;
  isRefundable: boolean;
  typeChambre: HotelTypeChambre;
  nombreChambre: number;
  plateformeId: string;
  typeChambreId: string;
  benchmarkingEnteteId: string;
  dateLimiteAnnulation: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── BenchmarkingEntete dans le devis (structure différente) ─────────

export interface HotelDevisBenchmarkingEntete {
  id: string;
  numero: string;
  du: string;
  au: string;
  nuite: number;
  pays: string;
  ville: string;
  hotelProspectionEnteteId: string;
  tauxPrixUnitaire: number;
  forfaitaireUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  dateLimitePaiement: string | null;
  createdAt: string;
  updatedAt: string;
  ligneClient: HotelDevisLigneClient;       // ← une seule ligne client (pas un tableau)
  benchService: HotelBenchService[];
}

// ─── ProspectionHotel dans le devis ──────────────────────────────────

export interface HotelDevisProspection {
  id: string;
  isDevis: boolean;
  numeroEntete: string;
  prestationId: string;
  fournisseurId: string;
  demandeClientId: string | null;
  rasionAnnulationId: string | null;
  RaisonAnnulation: null;
  createdAt: string;
  updatedAt: string;
  prestation: HotelPrestation;
  fournisseur: HotelFournisseur;
}

// ─── Devis hôtel complet ─────────────────────────────────────────────

export interface HotelDevisItem {
  id: string;
  reference: string;
  totalGeneral: number;
  url1: string | null;
  url2: string | null;
  statut: string;
  entity: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
  data: {
    prospectionHotel: HotelDevisProspection;
    benchmarkingEntetes: HotelDevisBenchmarkingEntete[];
  };
}

export interface HotelDevisApiResponse {
  success: boolean;
  data: HotelDevisItem;
}

// ─── Type union pour le modal PDF ────────────────────────────────────
// Permet d'accepter soit la liste (benchmarking), soit le devis (page devis)

export type HotelPdfInput =
  | { mode: 'prospection'; entete: HotelProspectionEnteteItem }
  | { mode: 'devis';       devis: HotelDevisData };

// ─── Entête de prospection (HPE-X) ───────────────────────────────────

export interface HotelProspectionEnteteItem {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  createdAt: string;
  isDevis: boolean;
  // Optionnels : l'API peut renvoyer une entête sans prestation/fournisseur résolus
  // (cf. hotelProspectionEnteteSlice.HotelProspectionEntete) — voir garde dans hotel.generator.ts.
  prestation?: HotelPrestation;
  fournisseur?: HotelFournisseur;
  benchmarkingEntete: HotelBenchmarkingEntete[];
  // Champs non garantis par l'endpoint liste prospection (cf. hotelProspectionEnteteSlice.HotelProspectionEntete) —
  // pas de raison d'annulation tant que l'entête n'est pas passée en devis/réservation :
  rasionAnnulationId?: string | null;
  demandeClientId?: string | null;
  updatedAt?: string;
  RaisonAnnulation?: null;
}

// ─── Réponse API liste ───────────────────────────────────────────────

export interface HotelProspectionApiResponse {
  success: boolean;
  data: HotelProspectionEnteteItem[];
}

// ─── Sélection utilisateur pour le PDF ──────────────────────────────
// Structure transmise au générateur après le modal de sélection

export interface HotelPdfSelection {
  benchmarkingEnteteId: string;
  lignes: {
    ligneId: string;
    deviseIds: string[]; // IDs des deviseHotel sélectionnées
  }[];

  images?: string[];
}

// ─── Normalisation vers HotelProspectionEnteteItem ───────────────────
// Convertit un HotelDevisItem en HotelProspectionEnteteItem
// pour que le modal et le générateur puissent traiter les deux sans distinction

export function normalizeDevisToEntete(
  devisData: HotelDevisData
): HotelProspectionEnteteItem {
  const devis = devisData.devis;
  if (!devis) throw new Error('Devis manquant');

  const p = devis.data.prospectionHotel;

  return {
    id:                 p.id,
    prestationId:       p.prestationId,
    numeroEntete:       p.numeroEntete,
    fournisseurId:      p.fournisseurId,
    rasionAnnulationId: null,
    demandeClientId:    null,
    createdAt:          devis.createdAt,
    updatedAt:          devis.updatedAt,
    isDevis:            true,
    RaisonAnnulation:   null,

    // Prestation — reconstruire depuis ce que le slice a
    prestation: {
      id:                    p.prestation.id,
      numeroDos:             p.prestation.numeroDos,
      status:                p.prestation.status,
      dossierCommunColabId:  '',   // pas dans le slice, valeur neutre
      dossierId:             '',
      createdAt:             devis.createdAt,
      updatedAt:             devis.updatedAt,
    },

    // Fournisseur
    fournisseur: {
      id:                  p.fournisseur.id,
      code:                p.fournisseur.code,
      libelle:             p.fournisseur.libelle,
      dateApplication:     '',
      status:              '',
      dateActivation:      '',
      dateDesactivation:   null,
      createdAt:           '',
      updatedAt:           '',
    },

    // Convertir les benchmarkingEntetes
    benchmarkingEntete: devis.data.benchmarkingEntetes.map(
      (b: BenchmarkingEntete) => ({
        id:                       b.id,
        numero:                   b.numero,
        du:                       b.du,
        au:                       b.au,
        nuite:                    b.nuite,
        pays:                     b.pays,
        ville:                    b.ville,
        hotelProspectionEnteteId: b.hotelProspectionEnteteId,
        tauxPrixUnitaire:         b.tauxPrixUnitaire,
        forfaitaireUnitaire:      b.forfaitaireUnitaire,
        forfaitaireGlobal:        b.forfaitaireGlobal,
        montantCommission:        b.montantCommission,
        dateLimitePaiement:       b.dateLimitePaiement,
        createdAt:                b.createdAt,
        updatedAt:                b.updatedAt,
        benchService:             b.benchService.map((s: BenchService) => ({
          id:                    s.id,
          benchmarkingEnteteId:  b.id,
          serviceSpecifiqueId:   s.serviceSpecifiqueId,
          createdAt:             '',
          updatedAt:             '',
          serviceSpecifique: {
            id:          s.serviceSpecifique.id,
            code:        s.serviceSpecifique.code,
            libelle:     s.serviceSpecifique.libelle,
            type:        s.serviceSpecifique.type,
            typeService: s.serviceSpecifique.typeService,
            createdAt:   '',
            updatedAt:   '',
          },
        })),

        // ligneClient → benchmarkingLigne (tableau d'une ligne)
        benchmarkingLigne: b.ligneClient ? [{
          id:                   b.ligneClient.id,
          hotel:                b.ligneClient.hotel,
          benchmarkingEnteteId: b.id,
          plateformeId:         b.ligneClient.plateformeId,
          typeChambreId:        b.ligneClient.typeChambreId,
          nombreChambre:        b.ligneClient.nombreChambre,
          isBenchMark:          b.ligneClient.isBenchMark,
          isRefundable:         b.ligneClient.isRefundable,
          dateLimiteAnnulation: b.ligneClient.dateLimiteAnnulation ?? null,
          createdAt:            '',
          updatedAt:            '',
          plateforme: {
            id:        b.ligneClient.plateforme.id,
            code:      b.ligneClient.plateforme.code,
            nom:       b.ligneClient.plateforme.nom,
            status:    b.ligneClient.plateforme.status,
            createdAt: '',
            updatedAt: '',
          },
          typeChambre: {
            id:        b.ligneClient.typeChambre.id,
            type:      b.ligneClient.typeChambre.type,
            capacite:  b.ligneClient.typeChambre.capacite,
            createdAt: '',
            updatedAt: '',
          },
          deviseHotel: b.ligneClient.deviseHotel.map((dv: DeviseHotelDevis) => ({
            id:                  dv.id,
            benchmarkingLigneId: dv.benchmarkingLigneId,
            deviseId:            dv.deviseId,
            nuiteDevise:         dv.nuiteDevise,
            nuiteAriary:         dv.nuiteAriary,
            montantDevise:       dv.montantDevise,
            montantAriary:       dv.montantAriary,
            tauxChange:          dv.tauxChange,
            createdAt:           '',
            updatedAt:           '',
            devise: {
              id:        dv.devise.id,
              devise:    dv.devise.devise,
              status:    dv.devise.status,
              createdAt: '',
              updatedAt: '',
            },
          })),
        }] : [],
      })
    ),
  };
}