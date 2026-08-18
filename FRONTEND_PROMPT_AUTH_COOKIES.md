# Prompt à donner au frontend — Migration auth vers cookies httpOnly

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_AUTH_COOKIES.md` : le backend a implémenté la migration demandée, **en mode transitoire** (les deux modes d'auth — cookie et Bearer token — fonctionnent en parallèle). Ce prompt couvre l'adaptation du frontend pour basculer sur les cookies.

---

## Contexte

Le backend a migré l'authentification de "Bearer token en `localStorage`" vers des cookies httpOnly, pour que le JS du navigateur n'ait plus jamais accès aux tokens (protection contre le vol par XSS). Le changement est **rétrocompatible pour l'instant** : rien ne casse tant que ce prompt n'est pas traité, mais l'objectif final est de retirer le stockage `localStorage` des tokens côté frontend.

**Ce qui a changé côté backend (déployé) :**

- `POST /auth/login` avec `{ email, motDePasse }` pose désormais 3 cookies en plus de renvoyer les tokens dans le body (mode transitoire) :
  - `access_token` — httpOnly, durée 24h.
  - `refresh_token` — httpOnly, durée 7j, restreint au path `/auth` (envoyé uniquement sur `/auth/refresh` et `/auth/logout`, pas sur le reste de l'API).
  - `csrf_token` — **non-httpOnly** (lisible en JS), même durée que le refresh token.
  - Le body de réponse contient toujours `{ access_token, refresh_token, expiresIn, user }` pendant la transition, `user` est un champ nouveau (objet utilisateur sans le hash de mot de passe).
- `POST /auth/refresh` lit maintenant le refresh token depuis le cookie en priorité (le body `{ refresh_token }` reste accepté en repli). Le refresh token est **tourné à chaque appel** (rotation) : un nouveau `refresh_token` est reposé en cookie à chaque refresh, l'ancien devient invalide.
- **Nouvel endpoint `POST /auth/logout`** (n'existait pas avant) : révoque le refresh token côté serveur et efface les 3 cookies. À appeler avec `credentials: true`, aucun body requis (le refresh token est lu depuis le cookie).
- Toutes les routes protégées (`JwtAuthGuard`) acceptent maintenant l'auth via cookie `access_token` **ou** header `Authorization: Bearer <token>` (mode dual). Aucune régression si rien n'est changé côté frontend dans l'immédiat.
- CORS : le backend répond maintenant avec `Access-Control-Allow-Credentials: true` et une origine explicite (plus de `*`) — **toute requête `fetch`/`axios` doit envoyer les credentials** (`withCredentials: true` / `credentials: 'include'`) pour que les cookies partent et reviennent.
- **Protection CSRF** (obligatoire dès qu'un cookie d'auth est présent) : pattern *double submit cookie*. Sur toute requête mutante (POST/PUT/PATCH/DELETE) faite alors qu'un cookie d'auth est posé, le backend exige un header `X-CSRF-Token` dont la valeur correspond exactement au cookie `csrf_token`. Sans ce header (ou s'il ne correspond pas), la requête est rejetée avec `403 Forbidden`. **Ce point casse les appels mutants dès que le cookie existe**, même si le frontend continue par ailleurs à envoyer le Bearer token — dès qu'un cookie `access_token`/`refresh_token` est présent (ce qui sera le cas après le premier login une fois ce backend déployé), il faut envoyer ce header.
- Socket.io : aucun changement de comportement requis dans l'immédiat. Le handshake accepte toujours `handshake.auth.token` en priorité (mode actuel, voir `FRONTEND_PROMPT_SOCKET_AUTH.md`) ; un repli sur le cookie `access_token` a été ajouté côté backend pour une bascule future, mais rien à faire côté frontend tant que `auth: { token }` continue d'être envoyé.

## ⚠️ Point bloquant immédiat : CSRF

Dès que le backend ci-dessus est en prod, **le premier login pose les cookies**, et toute requête mutante suivante (création/modification/suppression, y compris `POST /auth/refresh` et `POST /auth/logout`) sans header `X-CSRF-Token` sera rejetée en `403`. Ce point doit être traité en même temps que la mise à jour de l'URL/déploiement backend, pas après.

## Ce qu'il faut changer côté frontend

1. **`src/service/Axios.tsx`** (ou équivalent)
   - Ajouter `withCredentials: true` sur l'instance Axios, pour que les cookies partent et reviennent sur chaque requête (y compris cross-origin si front/back sont sur des domaines différents).
   - Ajouter un intercepteur de requête qui lit le cookie `csrf_token` (non-httpOnly, donc lisible via `document.cookie`) et pose le header `X-CSRF-Token` sur les requêtes `POST`/`PUT`/`PATCH`/`DELETE`.
     ```js
     function getCookie(name) {
       const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
       return match ? decodeURIComponent(match[1]) : undefined;
     }

     axiosInstance.interceptors.request.use((config) => {
       if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
         const csrfToken = getCookie('csrf_token');
         if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
       }
       return config;
     });
     ```
   - L'intercepteur qui pose `Authorization: Bearer <token>` peut rester tel quel pour l'instant (mode dual), à retirer une fois la bascule confirmée (voir stratégie de transition).

2. **`src/pages/LoginPage.tsx`** / **`src/app/authSlice.ts`**
   - Le login continue de fonctionner à l'identique dans l'immédiat (le body contient toujours les tokens). Pas de changement obligatoire tout de suite, mais préparer le terrain :
     - Le body contient maintenant aussi `user` — à vérifier si utile pour éviter un appel `GET /users/me` séparé juste après le login.
     - `expiresIn` est en secondes (86400 = 24h), utilisable pour un compte à rebours de session si besoin.

3. **Logout**
   - Remplacer le simple "vider le `localStorage`" par un appel `POST /auth/logout` (avec `withCredentials: true`) **avant** de nettoyer l'état local. Sinon le refresh token reste valide côté serveur après un logout local.

4. **Flux de refresh automatique (intercepteur 401 sur Axios, si présent)**
   - Si un intercepteur retente la requête après un refresh silencieux, il n'a plus besoin d'envoyer `refresh_token` dans le body : le cookie suffit. Garder l'appel `POST /auth/refresh` avec `withCredentials: true`.
   - Le refresh token étant maintenant **tourné à chaque appel**, ne pas mettre en cache/réutiliser un ancien `refresh_token` — se fier uniquement au cookie.

5. **Socket.io**
   - Rien à faire dans l'immédiat (voir Contexte ci-dessus).

## Stratégie de transition (recommandée, à faire en second temps une fois le point CSRF traité)

Une fois les points 1 et 3 ci-dessus en place et testés :
- Arrêter de stocker `access_token`/`refresh_token` en `localStorage` (c'est tout l'intérêt de la migration : le JS n'a plus besoin d'y toucher, le navigateur gère l'envoi automatiquement via les cookies).
- Retirer l'intercepteur `Authorization: Bearer` (le cookie suffit).
- Prévenir le backend une fois la bascule confirmée : les tokens seront retirés du body de réponse (`access_token`/`refresh_token` disparaîtront de `POST /auth/login` et `POST /auth/refresh`, seuls `expiresIn`/`user` resteront), et le support du header `Authorization` sur les routes protégées pourra être retiré à terme.

## Ce dont le backend a besoin en retour

- Confirmation du (ou des) domaine(s) exact(s) du frontend en prod, pour renseigner `FRONTEND_ORIGIN` côté backend (CORS) — actuellement en avertissement si non renseigné.
- Si front et back sont bien sur des domaines différents (confirmé ou non) — ça détermine si `SameSite=None` (déjà le défaut en prod côté backend) est le bon réglage, ou si `Lax` suffirait (même domaine).
- Confirmation que le point CSRF (ci-dessus) est bien traité avant/au même moment que la mise en prod du backend — sinon toutes les requêtes mutantes échoueront en 403 dès le premier login.
- Une fois testé : confirmation pour retirer les tokens du body de réponse (`access_token`/`refresh_token`) et le support du header `Authorization` côté backend.
