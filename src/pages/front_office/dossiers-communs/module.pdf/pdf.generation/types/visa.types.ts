// ─── Entités de base ─────────────────────────────────────────────────

export interface VisaConsulat {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisaPays {
  id: string;
  pays: string;
  photo: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisaType {
  id: string;
  nom: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisaDuree {
  id: string;
  duree: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisaEntree {
  id: string;
  entree: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisaParams {
  id: string;
  code: string;
  description: string;
  status: string;
  paysId: string;
  pVenteAriary: number;
  puAchatDevise: number;
  dureeTraitement: number;
  visaTypeId: string;
  visaDureeId: string;
  visaEntreeId: string;
  createdAt: string;
  updatedAt: string;
  pays: VisaPays;
  visaType: VisaType;
  visaDuree: VisaDuree;
  visaEntree: VisaEntree;
}

// ─── Prestation / Dossier ────────────────────────────────────────────

export interface VisaClientFacture {
  id: string;
  code: string;
  libelle: string;
  statut: string;
}

export interface VisaDossierCommun {
  id: string;
  numero: number;
  description: string;
  whatsapp: string;
  contactPrincipal: string;
  referenceTravelPlaner: string;
  clientfacture?: VisaClientFacture;
}

export interface VisaPrestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierId: string;
  dossierCommunColabId: string;
  createdAt: string;
  updatedAt: string;
  dossierCommunColab?: {
    dossierCommun?: VisaDossierCommun;
  };
}

// ─── Ligne de prospection ────────────────────────────────────────────

export interface VisaProspectionLigne {
  id: string;
  devise: string;
  nombre: number;
  etatVisa: string;
  etatPiece: boolean;
  dateDepart: string;
  dateRetour: string;
  tauxEchange: number;
  puClientAriary: number;
  puClientDevise: number;
  puConsulatAriary: number;
  puConsulatDevise: number;
  commissionAriary: number;
  montantTotalClientAriary: number;
  montantTotalClientDevise: number;
  montantTotalConsulatAriary: number;
  montantTotalConsulatDevise: number;
  consulatId: string;
  visaParamsId: string;
  visaProspectionEnteteId: string;
  createdAt: string;
  updatedAt: string;
  consulat?: VisaConsulat;
  visaParams: VisaParams;
}

// ─── Devis ───────────────────────────────────────────────────────────

export interface VisaDevis {
  id: string;
  reference: string;
  totalGeneral: number;
  statut: string;
  url1: string | null;
  url2: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Prospection entête ──────────────────────────────────────────────

export interface VisaProspectionEntete {
  id: string;
  prestationId: string;
  consulatId: string;
  clientFacture: string;
  numeroDossierCommun: number;
  createdAt?: string;
  updatedAt?: string;
  consulat: VisaConsulat;
  prestation: VisaPrestation;
}

// ─── Suivi ───────────────────────────────────────────────────────────

export interface VisaSuivi {
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
  dateModification: string | null;
  modePaiement: string | null;
  numTransaction: string | null;
  dateTransaction: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Réponse API détail ──────────────────────────────────────────────

export interface VisaDevisDetail {
  devis: VisaDevis;
  prospectionVisa: VisaProspectionEntete;
  visaProspectionLignes: VisaProspectionLigne[];
  suivi: VisaSuivi;
}

export interface VisaDevisDetailApiResponse {
  success: boolean;
  data: VisaDevisDetail;
}