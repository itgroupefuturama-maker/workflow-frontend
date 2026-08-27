export const API_URL = import.meta.env.VITE_API_URL;
export const API_URL_PORTAIL = import.meta.env.VITE_API_URL_PORTAIL;

// Base utilisée pour les appels API authentifiés (axios). En dev, quand le backend tourne sur une
// autre machine (ex. via Tailscale), un appel direct à VITE_API_URL est cross-site du point de vue
// du navigateur : les cookies SameSite=Lax ne sont alors jamais attachés aux requêtes XHR/fetch
// (seulement posés au login) — voir PRODUCTION_CHECKLIST.md, "Sécurité des tokens d'auth". On passe
// donc par le proxy Vite dev (vite.config.ts, /api → VITE_API_URL) qui rend la requête same-origin
// du point de vue du navigateur — activé en définissant VITE_API_PROXY_URL=/api dans .env.local.
// Par défaut (rien défini, notamment en prod où le proxy Vite dev n'existe pas), on retombe sur
// API_URL, comportement inchangé.
export const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || API_URL;