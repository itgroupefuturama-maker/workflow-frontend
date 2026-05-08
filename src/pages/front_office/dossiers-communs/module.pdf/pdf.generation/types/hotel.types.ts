
// ─── Entités de base ─────────────────────────────────────────────────

import type { BenchmarkingEntete, HotelDevisData } from "../../../../../../../app/front_office/parametre_hotel/hotelDevisSlice";

export interface HotelFournisseur {
  id: string;
  code: string;
  libelle: string;
  dateApplication: string;
  status: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelPrestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierCommunColabId: string;
  dossierId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelDevise {
  id: string;
  devise: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelTypeChambre {
  id: string;
  type: string;
  capacite: number;
  createdAt: string;
  updatedAt: string;
}

export interface HotelPlateforme {
  id: string;
  code: string;
  nom: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelServiceSpecifique {
  id: string;
  code: string;
  libelle: string;
  type: string | null;
  typeService: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DeviseHotel (par ligne) ─────────────────────────────────────────

export interface HotelDeviseHotel {
  id: string;
  benchmarkingLigneId: string;
  deviseId: string;
  nuiteDevise: number;
  nuiteAriary: number;
  montantDevise: number;
  montantAriary: number;
  tauxChange: number;
  createdAt: string;
  updatedAt: string;
  devise: HotelDevise;
}

// ─── Ligne de benchmarking ───────────────────────────────────────────

export interface HotelBenchmarkingLigne {
  id: string;
  hotel: string;
  benchmarkingEnteteId: string;
  plateformeId: string;
  typeChambreId: string;
  nombreChambre: number;
  isBenchMark: boolean;
  isRefundable: boolean;
  dateLimiteAnnulation: string | null;
  createdAt: string;
  updatedAt: string;
  plateforme: HotelPlateforme;
  typeChambre: HotelTypeChambre;
  deviseHotel: HotelDeviseHotel[];
}

// ─── Service d'un benchmarking ───────────────────────────────────────

export interface HotelBenchService {
  id: string;
  benchmarkingEnteteId: string;
  serviceSpecifiqueId: string;
  createdAt: string;
  updatedAt: string;
  serviceSpecifique: HotelServiceSpecifique;
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
  hotelProspectionEnteteId: string;
  tauxPrixUnitaire: number;
  forfaitaireUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  dateLimitePaiement: string | null;
  createdAt: string;
  updatedAt: string;
  benchService: HotelBenchService[];
  benchmarkingLigne: HotelBenchmarkingLigne[];
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
  | { mode: 'devis';       devis: HotelDevisItem };

// ─── Entête de prospection (HPE-X) ───────────────────────────────────

export interface HotelProspectionEnteteItem {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  rasionAnnulationId: string | null;
  demandeClientId: string | null;
  createdAt: string;
  updatedAt: string;
  isDevis: boolean;
  prestation: HotelPrestation;
  fournisseur: HotelFournisseur;
  RaisonAnnulation: null;
  benchmarkingEntete: HotelBenchmarkingEntete[];
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
        benchService:             b.benchService.map((s) => ({
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
          deviseHotel: b.ligneClient.deviseHotel.map((dv) => ({
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