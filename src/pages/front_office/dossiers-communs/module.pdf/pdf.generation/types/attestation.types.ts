// ─── Entités de base ─────────────────────────────────────────────────

export interface AttestationFournisseur {
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

export interface AttestationPrestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierCommunColabId: string;
  dossierId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Ligne d'attestation ─────────────────────────────────────────────

export interface AttestationLigne {
  id: string;
  numeroDosRef: string;
  numeroVol: string;
  origineLine: string | null;
  referenceLine: string;
  attestationEnteteId: string;
  status: string;
  statusLigne: string;
  avion: string;
  itineraire: string;
  departId: string;
  destinationId: string;
  classe: string;
  typePassager: string;
  dateHeureDepart: string;
  dateHeureArrive: string;
  dureeVol: string;
  dureeEscale: string;
  numeroReservation: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Entête d'attestation (ATT-X) ───────────────────────────────────

export interface AttestationEnteteItem {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  totalCommission: number;
  puAriary: number;
  createdAt: string;
  updatedAt: string;
  prestation: AttestationPrestation;
  fournisseur: AttestationFournisseur;
  attestationLigne: AttestationLigne[];
}

// ─── Réponse API liste ───────────────────────────────────────────────

export interface AttestationApiResponse {
  success: boolean;
  data: AttestationEnteteItem[];
}

// types/attestation.types.ts — ajouter les nouveaux types

export interface AttestationDestinationVoyage {
  id: string;
  code: string;
  ville: string;
  createdAt: string;
  updatedAt: string;
  paysId: string;
}

export interface ClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  nationalite: string;
  document: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  clientType: string | null;
  whatsapp: string | null;
  tel: string;
  clientbeneficiaireId: string;
  clientBeneficiaireFormId: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttestationPassager {
  id: string;
  clientbeneficiaireInfoId: string;
  attestationLigneId: string;
  createdAt: string;
  updatedAt: string;
  clientbeneficiaireInfo: ClientBeneficiaireInfo;
}

// ─── Mettre à jour AttestationLigne ──────────────────────────────────
export interface AttestationLigne {
  id: string;
  numeroDosRef: string;
  numeroVol: string;
  origineLine: string | null;
  referenceLine: string;
  attestationEnteteId: string;
  status: string;
  statusLigne: string;
  avion: string;
  itineraire: string;
  departId: string;
  destinationId: string;
  classe: string;
  typePassager: string;
  dateHeureDepart: string;
  dateHeureArrive: string;
  dureeVol: string;
  dureeEscale: string;
  numeroReservation: string;
  createdAt: string;
  updatedAt: string;
  destinationVoyage?: AttestationDestinationVoyage;
  attestationPassager: AttestationPassager[];  // ← ajout
}

// ─── Mode de rendu PDF ───────────────────────────────────────────────
export type AttestationPdfMode = 'par_entete' | 'par_passager';

// ─── Sélection mise à jour ───────────────────────────────────────────
export interface AttestationPdfSelection {
  enteteId: string;
  ligneIds: string[];
}