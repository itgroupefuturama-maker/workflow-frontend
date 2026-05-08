// ─── Entités de base ─────────────────────────────────────────────────

export interface AssuranceFournisseur {
  id: string;
  code: string;
  libelle: string;
  status: string;
  dateApplication: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssurancePrestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierId: string;
  dossierCommunColabId: string;
  createdAt: string;
  updatedAt: string;
  dossierCommunColab?: {
    dossierCommun?: {
      numero: number;
      clientfacture?: {
        libelle: string;
        code: string;
      };
    };
  };
}

export interface AssuranceParams {
  id: string;
  status: string;
  fournisseur: AssuranceFournisseur;
  fournisseurId: string;
  dateApplication: string;
  zoneDestination: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssuranceTarifPlein {
  id: string;
  devise: string;
  borneInf: number;
  borneSup: number;
  commissionAriary: number;
  commissionDevise: number;
  prixClientAriary: number;
  prixClientDevise: number;
  prixAssureurAriary: number;
  prixAssureurDevise: number;
  assuranceParamsId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Ligne de prospection ────────────────────────────────────────────

export interface AssuranceProspectionLigne {
  id: string;
  duree: number;
  dateDepart: string;
  dateRetour: string;
  dateDevis: string | null;
  tauxChange: number;
  referenceDevis: string | null;
  assuranceParamsId: string;
  assuranceTarifPleinId: string;
  assuranceTarifReduitId: string | null;
  assuranceProspectionEnteteId: string;
  createdAt: string;
  updatedAt: string;
  assuranceParams: AssuranceParams;
  assuranceTarifPlein: AssuranceTarifPlein;
  assuranceTarifReduit: AssuranceTarifPlein | null;
}

// ─── Devis module ────────────────────────────────────────────────────

export interface AssuranceDevis {
  id: string;
  reference: string;
  totalGeneral: number;
  statut: string;
  url1: string | null;
  url2: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Suivi ───────────────────────────────────────────────────────────

export interface AssuranceSuivi {
  id: string;
  evolution: string;
  entity: string;
  statut: string;
  origineLigne: string;
  dateEnvoieDevis: string | null;
  dateApprobation: string | null;
  referenceBcClient: string | null;
  dateCreationBc: string | null;
  dateSoumisBc: string | null;
  dateApprobationBc: string | null;
  referenceFacClient: string | null;
  dateCreationFac: string | null;
  dateReglement: string | null;
  dateAnnulation: string | null;
  modePaiement: string | null;
  numTransaction: string | null;
  dateTransaction: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Prospection entête ──────────────────────────────────────────────

export interface AssuranceProspectionEntete {
  id: string;
  prestationId: string;
  fournisseurId: string;
  clientFacture: string;
  numeroDossierCommun: number;
  createdAt: string;
  updatedAt: string;
  prestation: AssurancePrestation;
  fournisseur: AssuranceFournisseur;
}

// ─── Réponse API détail ──────────────────────────────────────────────

export interface AssuranceDevisDetail {
  devis: AssuranceDevis;
  prospectionAssurance: AssuranceProspectionEntete;
  assuranceProspectionLignes: AssuranceProspectionLigne[];
  suivi: AssuranceSuivi;
}

export interface AssuranceDevisDetailApiResponse {
  success: boolean;
  data: AssuranceDevisDetail;
}