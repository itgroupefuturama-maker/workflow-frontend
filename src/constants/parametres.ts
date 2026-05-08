import {
  FiUsers, FiUser, FiShield, FiSettings, FiFileText, FiDollarSign,
  FiHash, FiLayers, FiRepeat, FiTag, FiPackage, FiBox,
  FiCreditCard, FiBriefcase,
} from "react-icons/fi";
import type { IconType } from "react-icons";

export interface ParametreItem {
  label: string;
  path: string;
  icon: IconType;
}

export interface ParametreCategory {
  key: string;
  label: string;
  desc: string;
  iconColor: string;
  iconBg: string;
  items: ParametreItem[];
}

export const PARAMETRES_CATEGORIES: ParametreCategory[] = [
  {
    key: 'acces',
    label: 'Accès & Sécurité',
    desc: 'Gestion des utilisateurs, profils, privilèges et autorisations.',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    items: [
      { label: 'Privilège',     path: 'privilege',    icon: FiShield   },
      { label: 'Utilisateur',   path: 'utilisateur',  icon: FiUsers    },
      { label: 'Profil',        path: 'profil',       icon: FiUser     },
      { label: 'Autorisation',  path: 'autorisation', icon: FiSettings },
    ],
  },
  {
    key: 'transactions',
    label: 'Transactions',
    desc: 'Configuration des types de transactions et des transactions elles-mêmes.',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    items: [
      { label: 'Type transaction', path: 'type-transaction', icon: FiRepeat   },
      { label: 'Transaction',      path: 'transaction',      icon: FiFileText },
    ],
  },
  {
    key: 'exploitation',
    label: 'Exploitation',
    desc: 'Modules, commissions, numérotation, modèles, miles et pièces.',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    items: [
      { label: 'Module',       path: 'module',       icon: FiPackage   },
      { label: 'Commission',   path: 'commission',   icon: FiDollarSign},
      { label: 'Numérotation', path: 'numerotation', icon: FiHash      },
      { label: 'Modèle',       path: 'modele',       icon: FiLayers    },
      { label: 'Miles',        path: 'miles',        icon: FiTag       },
      { label: 'Pièces',       path: 'piece',        icon: FiBox       },
    ],
  },
  {
    key: 'commercial',
    label: 'Commercial & Facturation',
    desc: 'Devises, clients facturés, bénéficiaires, articles et fournisseurs.',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    items: [
      { label: 'Devise transaction',    path: 'devis-transaction',   icon: FiCreditCard },
      { label: 'Client facturé',        path: 'client-facture',      icon: FiUser       },
      { label: 'Client bénéficiaire',   path: 'client-beneficiaire', icon: FiUsers      },
      { label: 'Famille article',       path: 'categorie',           icon: FiLayers     },
      { label: 'Article',               path: 'article',             icon: FiBox        },
      { label: 'Fournisseurs',          path: 'fournisseur',         icon: FiBriefcase  },
    ],
  },
];

// Rétrocompatibilité — si d'autres fichiers importent encore PARAMETRES à plat
export const PARAMETRES: ParametreItem[] = PARAMETRES_CATEGORIES.flatMap(c => c.items);