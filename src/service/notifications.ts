import { CircleCheck, CircleX, Receipt, Ticket, Wallet, type LucideIcon } from 'lucide-react';
// Notifications structurées et événements socket temps réel — voir FRONTEND_PROMPT_NOTIFICATIONS_ODOO_BILLET.md

export type NotificationType =
  | 'BILLET_VENTE_VALIDEE'
  | 'BILLET_ACHAT_VALIDE'
  | 'BILLET_VENTE_REJETEE'
  | 'BILLET_ACHAT_REJETE'
  | 'BILLET_FACTURE_EMISE'
  | 'BILLET_FACTURE_REGLEE';

export interface NotificationBilletData {
  billetEnteteId: string;
  numeroBillet: string;
  devisId: string;
  prospectionEnteteId: string;
  prestationId: string;
  numeroDos: string;
  dossierCommunId: string;
  numeroDossierCommun: number;
  ancienStatut: string;
  nouveauStatut: string;
  // etatOdoo de l'entête après la réponse d'Odoo
  etatOdoo?: string;
  // Lignes concernées par la réponse d'Odoo ([] pour facture et règlement)
  lignes?: NotificationBilletLigne[];
  [key: string]: unknown;
}

export interface NotificationBilletLigne {
  billetLigneId: string;
  referenceLigne: string;
  decision: 'VALIDE' | 'REJETE';
  statut: string;
  etatOdoo: string;
  motif: string | null;
  odooSaleId: string | null;
  odooPurchaseId: string | null;
}

// Les anciennes notifications (attribution de dossier, etc.) n'ont que `description` :
// type / titre / module / entityType / entityId / data valent null.
export interface AppNotification {
  id: string;
  status: string;
  receiverId: string;
  type: NotificationType | string | null;
  titre: string | null;
  description: string;
  isRead: boolean;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  data: NotificationBilletData | null;
  createdAt: string;
  updatedAt: string;
}

export interface BilletStatutEvent {
  billetEnteteId: string;
  ancienStatut: string;
  nouveauStatut: string;
  etatOdoo?: string;
  type: NotificationType;
}

// Icône + couleur par type de notification (icônes vectorielles plutôt qu'emojis :
// rendu identique sur tous les systèmes).
export const ICONE_NOTIFICATION: Record<string, { icon: LucideIcon; className: string }> = {
  BILLET_VENTE_VALIDEE: { icon: CircleCheck, className: 'text-emerald-600' },
  BILLET_ACHAT_VALIDE: { icon: Ticket, className: 'text-indigo-600' },
  BILLET_VENTE_REJETEE: { icon: CircleX, className: 'text-red-600' },
  BILLET_ACHAT_REJETE: { icon: CircleX, className: 'text-red-600' },
  BILLET_FACTURE_EMISE: { icon: Receipt, className: 'text-blue-600' },
  BILLET_FACTURE_REGLEE: { icon: Wallet, className: 'text-amber-600' },
};

// La page Billet est routée sur le devisId (comme dans Devis.tsx). Le backend ne fournit pas d'URL
// volontairement : null = ancienne notification, pas de lien.
export function lienNotification(n: AppNotification): string | null {
  if (n.module === 'BILLET' && n.data?.devisId) {
    const { devisId, prospectionEnteteId } = n.data;
    return `/dossiers-communs/ticketing/pages/billet/${devisId}?prospectionEnteteId=${prospectionEnteteId}`;
  }
  return null;
}

// ── Bus d'événements socket ──────────────────────────────────────────────────
// Le socket vit dans FrontOfficeLayout / ListeParametreLayout ; la cloche (AppBar) et la page Billet
// s'abonnent ici, ce qui leur évite de dépendre de l'instance socket.

const notificationListeners = new Set<(n: AppNotification) => void>();
const billetStatutListeners = new Set<(e: BilletStatutEvent) => void>();

export function emitNotification(n: AppNotification) {
  notificationListeners.forEach((l) => l(n));
}

export function onNotification(listener: (n: AppNotification) => void) {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function emitBilletStatut(e: BilletStatutEvent) {
  billetStatutListeners.forEach((l) => l(e));
}

export function onBilletStatut(listener: (e: BilletStatutEvent) => void) {
  billetStatutListeners.add(listener);
  return () => {
    billetStatutListeners.delete(listener);
  };
}


// ── Changements faits ailleurs (page Notifications) → la cloche resynchronise son badge ──
const changementListeners = new Set<() => void>();

export function emitNotificationsChangees() {
  changementListeners.forEach((l) => l());
}

export function onNotificationsChangees(listener: () => void) {
  changementListeners.add(listener);
  return () => {
    changementListeners.delete(listener);
  };
}
