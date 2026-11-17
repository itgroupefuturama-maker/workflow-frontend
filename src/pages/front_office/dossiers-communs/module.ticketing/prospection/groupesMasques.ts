// src/pages/front_office/dossiers-communs/module.ticketing/prospection/groupesMasques.ts
//
// Groupes de colonnes MASQUÉS (0 colonne) d'un tableau, mémorisés par écran dans le navigateur.

import { useState } from 'react';

export type GroupesMasques<K extends string> = Record<K, boolean>;
type Maj<K extends string> = GroupesMasques<K> | ((prev: GroupesMasques<K>) => GroupesMasques<K>);

export function useGroupesMasques<K extends string>(cle: string, initial: GroupesMasques<K>) {
  const [masques, setState] = useState<GroupesMasques<K>>(() => {
    try {
      const brut = JSON.parse(localStorage.getItem(cle) || 'null');
      if (brut && typeof brut === 'object') {
        // On ne garde que les clés connues (le tableau a pu changer depuis)
        const res = { ...initial };
        (Object.keys(initial) as K[]).forEach((k) => { if (typeof brut[k] === 'boolean') res[k] = brut[k]; });
        return res;
      }
    } catch { /* stockage indisponible */ }
    return initial;
  });

  const setMasques = (maj: Maj<K>) => {
    setState((prev) => {
      const next = typeof maj === 'function' ? maj(prev) : maj;
      try { localStorage.setItem(cle, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return [masques, setMasques] as const;
}
