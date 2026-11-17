import { useEffect, useRef } from 'react';

/**
 * Appelle `onEscape` quand l'utilisateur appuie sur Échap, tant que `active` est vrai.
 * À utiliser dans toutes les modales et tiroirs pour un comportement homogène.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const cb = useRef(onEscape);

  // Garde toujours la dernière version du callback sans réabonner l'écouteur
  useEffect(() => {
    cb.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active]);
}
