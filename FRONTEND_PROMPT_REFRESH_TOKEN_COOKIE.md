# Réponse backend — le cookie `refresh_token` n'est pas exploitable après login

Suite à `BACKEND_PROMPT_REFRESH_TOKEN_COOKIE.md`.

## Ce qui a été vérifié

Config actuelle (`src/utils/cookies.ts`), confirmée sur le conteneur dev réellement en cours
d'exécution (`NODE_ENV=development`, aucune variable `COOKIE_SAME_SITE`/`COOKIE_SECURE`/
`COOKIE_DOMAIN` positionnée) :

- `access_token`, `refresh_token`, `csrf_token` partagent **exactement** la même config
  `SameSite`/`Secure`/`Domain` (`baseCookieOptions()`). Ils ne diffèrent que par :
  - `path` : `/` pour `access_token`/`csrf_token`, `/auth` pour `refresh_token`.
  - `httpOnly` : `true`/`true`/`false`.
  - `maxAge` : 24h / 7j / 7j.
- En dev (`NODE_ENV !== 'production'`, notre cas) : `SameSite=Lax`, `Secure=false`,
  `Domain` non restreint. Cette conditionnalisation `isProd` (déjà en place, voir
  `BACKEND_PROMPT_AUTH_COOKIES.md`) fonctionne correctement — ce n'est pas le problème.

**Donc pas d'écart de config entre `refresh_token` et les deux autres cookies** qui expliquerait
qu'il soit spécifiquement absent. Les hypothèses "Secure forcé" et "Domain mal renseigné pour ce
cookie précis" de `BACKEND_PROMPT_REFRESH_TOKEN_COOKIE.md` sont écartées.

## Cause racine identifiée : topologie cross-site en HTTP simple

Le frontend (`localhost:5173`) et le backend (`http://andry:5050`) sont sur des **hostnames
différents** (`localhost` ≠ `andry`). Pour les règles `SameSite` du navigateur, ce sont deux
**sites différents** (peu importe que ce soit le même scheme `http`) — donc toute requête entre
les deux est **cross-site**.

Un cookie `SameSite=Lax` (notre config dev par défaut) n'est **jamais attaché automatiquement à
une requête XHR/fetch cross-site** — seulement aux navigations top-level (clic sur un lien, saisie
d'URL). Résultat concret :

- Au login, le `Set-Cookie` part bien et le cookie peut être posé (le posage initial n'est pas
  bloqué par `SameSite`, seulement l'envoi automatique ultérieur).
- Mais sur le `POST /auth/refresh` suivant (requête XHR cross-site), le navigateur **n'attache pas**
  `refresh_token` à la requête → côté backend, `req.cookies['refresh_token']` est vide → 401
  `Refresh token manquant`. Même chose pour `access_token` sur n'importe quel appel API qui
  dépendrait uniquement du cookie (sans header `Authorization` explicite) — c'est probablement
  pour ça que les autres appels authentifiés "marchent" pendant qu'on est encore avec le token en
  mémoire (Bearer explicite), mais que le flux 100% cookie (refresh silencieux après F5) casse.

**Point important — aucun réglage de cookie ne peut réparer ça en HTTP simple** : la seule option
pour qu'un cookie soit envoyé sur une requête cross-site est `SameSite=None`, qui **impose**
`Secure=true` — et un cookie `Secure` est silencieusement rejeté par le navigateur sur une
connexion `http://` non chiffrée. Il n'existe donc pas de combinaison d'attributs qui fasse
fonctionner un cookie d'auth entre deux hostnames différents en HTTP simple. C'est une contrainte
du navigateur, pas quelque chose qu'on peut corriger dans `cookies.ts`.

## Solutions possibles (à choisir côté frontend/environnement de dev)

1. **Recommandé, le plus simple** : faire pointer `VITE_API_URL` vers `http://localhost:5050` au
   lieu de `http://andry:5050`. Le backend écoute déjà sur `0.0.0.0`, donc `localhost:5050` doit
   fonctionner. `localhost:5173` et `localhost:5050` sont alors **same-site** (même hostname, port
   différent) : un cookie `SameSite=Lax` est envoyé normalement sur les requêtes XHR/fetch entre
   les deux. Aucun changement backend nécessaire.
2. **Alternative** : proxy Vite (`server.proxy` dans `vite.config.ts`) qui redirige les appels
   `/api/*` du frontend vers `http://andry:5050` — les requêtes deviennent same-origin du point de
   vue du navigateur.
3. **Alternative (si vous avez besoin de garder des hostnames différents en dev)** : servir le dev
   en HTTPS local (ex. `mkcert`) + `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true` en variables
   d'env du backend. Plus lourd à mettre en place, à réserver si l'option 1 n'est pas possible.

## Comment vérifier après le changement

Login → F5 → `POST /auth/refresh` doit renvoyer `200` avec un nouvel `access_token`. Dans l'onglet
Network du navigateur, vérifier sur la requête `/auth/refresh` que le header de requête `Cookie`
contient bien `refresh_token=...`.

Je n'ai pas pu reproduire en live de mon côté (tentative de `curl` cross-origin bloquée par mes
propres garde-fous d'exécution) — dites-moi si le changement d'URL (option 1) résout bien le
scénario une fois testé, sinon on creuse plus loin (ex. vérifier `withCredentials`/
`credentials: 'include'` est bien positionné sur l'appel `POST /auth/login` lui-même, pas
seulement sur `/auth/refresh` — sans ça, le `Set-Cookie` du login est ignoré par le navigateur dès
le départ, ce qui donnerait le même symptôme).
