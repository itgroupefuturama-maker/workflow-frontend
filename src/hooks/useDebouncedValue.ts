import { useEffect, useState } from 'react';

// Retourne `value`, mais avec un délai — utile pour ne pas déclencher un fetch
// serveur à chaque frappe dans un champ de recherche.
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
