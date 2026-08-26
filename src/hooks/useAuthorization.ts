import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export type PrivilegeLevel = 'CONSULTATION' | 'GESTION';

const LEVEL_RANK: Record<PrivilegeLevel, number> = {
  CONSULTATION: 1,
  GESTION: 2,
};

// `Privilege.privilege` est du texte libre saisi en back-office (voir parametres/Privilege.tsx),
// pas un enum — on matche par préfixe insensible à la casse plutôt que par égalité stricte pour
// tolérer "Consultation"/"CONSULTATION"/"consultation", etc.
function normalizeLevel(raw: string | undefined | null): PrivilegeLevel | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper.startsWith('GEST')) return 'GESTION';
  if (upper.startsWith('CONSULT')) return 'CONSULTATION';
  return null;
}

/**
 * Contrôle d'accès par module, dérivé des profils actifs de l'utilisateur connecté.
 *
 * Deux niveaux seulement : `GESTION` (fait toutes les actions d'un module, y compris ce que
 * l'UI appelle "Approuver" — un simple marqueur de validation externe, pas une étape distincte)
 * et `CONSULTATION` (lecture seule). Le modèle de données (voir BACKEND_PROMPT_PRIVILEGES_AUTH.md,
 * Cas B confirmé) n'a pas de lien explicite en base entre un module et un privilège précis :
 * `profile.modules[]` et `profile.privileges[]` sont deux listes indépendantes rattachées au même
 * profil. On applique donc le niveau de privilège le plus élevé du profil à tous les modules de ce
 * même profil. Un utilisateur ADMIN (n'importe quel profil actif nommé "ADMIN", même convention
 * que ProtectedRoute.tsx) a accès complet partout.
 */
export function useAuthorization() {
  const user = useSelector((state: RootState) => state.auth.user);

  return useMemo(() => {
    const activeProfiles = user?.profiles?.filter((p) => p.status === 'ACTIF') ?? [];
    const isAdmin = activeProfiles.some((p) => p.profile?.profil === 'ADMIN');

    const accessMap = new Map<string, PrivilegeLevel>();
    if (!isAdmin) {
      for (const p of activeProfiles) {
        const modules = p.profile?.modules ?? [];
        const privileges = p.profile?.privileges ?? [];

        const maxLevel = privileges.reduce<PrivilegeLevel | null>((max, pr) => {
          const level = normalizeLevel(pr.privilege?.privilege);
          if (!level) return max;
          if (!max || LEVEL_RANK[level] > LEVEL_RANK[max]) return level;
          return max;
        }, null);
        if (!maxLevel) continue;

        for (const m of modules) {
          // Identifié par `nom` (ex: "hotel", "ticketing"), pas par `code` (code court style
          // "HTL") — c'est la convention utilisée partout ailleurs dans le code pour résoudre un
          // module (ex: dossierCommunColab.find(c => c.module.nom.toLowerCase() === "hotel")).
          const nom = m.module?.nom?.toLowerCase();
          if (!nom) continue;
          const existing = accessMap.get(nom);
          if (!existing || LEVEL_RANK[maxLevel] > LEVEL_RANK[existing]) {
            accessMap.set(nom, maxLevel);
          }
        }
      }
    }

    const getLevel = (moduleCode: string): PrivilegeLevel | null => {
      if (isAdmin) return 'GESTION';
      return accessMap.get(moduleCode.toLowerCase()) ?? null;
    };

    const hasAccess = (moduleCode: string, required: PrivilegeLevel = 'CONSULTATION') => {
      if (isAdmin) return true;
      const level = getLevel(moduleCode);
      return !!level && LEVEL_RANK[level] >= LEVEL_RANK[required];
    };

    return {
      isAdmin,
      getLevel,
      hasAccess,
      canConsult: (moduleCode: string) => hasAccess(moduleCode, 'CONSULTATION'),
      canManage: (moduleCode: string) => hasAccess(moduleCode, 'GESTION'),
    };
  }, [user]);
}
