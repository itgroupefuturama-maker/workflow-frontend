// ─── Entités de base ─────────────────────────────────────────────────
// prestation/fournisseur réexportés depuis le slice, source unique de vérité :
// l'API /attestation/entete/... ne renvoie pas les champs étendus
// (dossierCommunColabId, dossierId, dateApplication, ...), seulement ce sous-ensemble.
import type { PrestationMini, FournisseurMini } from '../../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
export type { PrestationMini as AttestationPrestation, FournisseurMini as AttestationFournisseur };

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
  prestation: PrestationMini;
  fournisseur: FournisseurMini;
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
  // Champs non garantis par l'endpoint /attestation/entete/... (voir slice AttestationLigne) :
  createdAt?: string;
  updatedAt?: string;
  paysId?: string;
}

export interface ClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  nationalite: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  statut: string;
  // Champs non garantis par l'endpoint liste attestation (cf. attestationEnteteSlice.ClientBeneficiaireInfo) :
  document?: string;
  clientType?: string | null;
  whatsapp?: string | null;
  tel?: string;
  clientbeneficiaireId?: string;
  clientBeneficiaireFormId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttestationPassager {
  id: string;
  clientbeneficiaireInfoId: string;
  // Non garantis par l'endpoint liste (cf. attestationEnteteSlice.AttestationLigne.attestationPassager) :
  attestationLigneId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  // Optionnel : l'API ne renvoie pas toujours ce tableau (cf. attestationEnteteSlice.AttestationLigne).
  attestationPassager?: AttestationPassager[];
}

// ─── Mode de rendu PDF ───────────────────────────────────────────────
export type AttestationPdfMode = 'par_entete' | 'par_passager';

// ─── Sélection mise à jour ───────────────────────────────────────────
export interface AttestationPdfSelection {
  enteteId: string;
  ligneIds: string[];
}