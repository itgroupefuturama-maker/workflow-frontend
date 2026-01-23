import {
  FiUsers,
  FiUser,
  FiShield,
  FiSettings,
  FiFileText,
  FiDollarSign,
  FiHash,
  FiLayers,
  FiRepeat,
  FiTag,
  FiPackage,
  FiBox,
  FiCreditCard,
  FiBriefcase,
} from "react-icons/fi";

import type { IconType } from "react-icons";

export interface ParametreItem {
  label: string;
  path: string;
  icon: IconType;
}

export const PARAMETRES: ParametreItem[] = [
  { label: "Paramétrage Privilège", path: "privilege", icon: FiShield },
  { label: "Paramétrage Utilisateur", path: "utilisateur", icon: FiUsers },
  { label: "Paramétrage Profil", path: "profil", icon: FiUser },
  { label: "Paramétrage Autorisation", path: "autorisation", icon: FiSettings },

  { label: "Paramétrage Type Transaction", path: "type-transaction", icon: FiRepeat },
  { label: "Paramétrage Transaction", path: "transaction", icon: FiFileText },

  { label: "Paramétrage Module", path: "module", icon: FiPackage },
  { label: "Paramétrage Commission", path: "commission", icon: FiDollarSign },
  { label: "Paramétrage Numérotation", path: "numerotation", icon: FiHash },
  { label: "Paramétrage Modele", path: "modele", icon: FiLayers },
  { label: "Paramétrage Miles", path: "miles", icon: FiTag },
  { label: "Paramétrage Pièces", path: "piece", icon: FiBox },

  { label: "Paramétrage Devise Transaction", path: "devis-transaction", icon: FiCreditCard },
  { label: "Paramétrage Client Facturé", path: "client-facture", icon: FiUser },
  { label: "Paramétrage Client Bénéficiaire", path: "client-beneficiaire", icon: FiUsers },
  { label: "Paramétrage Famille Article", path: "categorie", icon: FiLayers },
  { label: "Paramétrage Article", path: "article", icon: FiBox },
  { label: "Paramétrage Fournisseurs", path: "fournisseur", icon: FiBriefcase },
];

