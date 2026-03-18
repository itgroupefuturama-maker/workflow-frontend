// utils/ticketingHeaderItems.ts
import type { BreadcrumbItem } from "../TicketingHeader"; // adapte le chemin

const TICKETING_BASE = `/dossiers-communs/ticketing/pages`;

/** Liste des billets (badge jaune simple) */
export const billetListeItems = (): BreadcrumbItem[] => [
  { label: "Liste des billets", isCurrent: true },
];

/** Liste des prospections (badge jaune simple) */
export const prospectionListeItems = (): BreadcrumbItem[] => [
  { label: "Liste des Prospection", isCurrent: true },
];

/** Détail d'un billet */
export const billetDetailItems = (numeroBillet: string | number): BreadcrumbItem[] => [
  {
    label: "Liste des billets",
    path: TICKETING_BASE,
    state: { targetTab: "billet" },
  },
  { label: `Billet n° ${numeroBillet}`, isCurrent: true },
];

/** Détail d'une prospection */
export const prospectionDetailItems = (enteteId: string | number): BreadcrumbItem[] => [
  {
    label: "Liste des Prospection",
    path: TICKETING_BASE,
    state: { targetTab: "prospection" },
  },
  { label: "Prospection detail", isCurrent: true },
];

/** Liste des devis d'une prospection */
export const devisListeItems = (enteteId: string | number): BreadcrumbItem[] => [
  {
    label: "Liste des Prospection",
    path: TICKETING_BASE,
    state: { targetTab: "prospection" },
  },
  {
    label: "Prospection detail",
    path: `${TICKETING_BASE}/prospection/${enteteId}`,
  },
  { label: "Liste Devis", isCurrent: true },
];