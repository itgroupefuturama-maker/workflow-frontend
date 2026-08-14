# Prompt à donner au backend — Migration auth vers cookies httpOnly

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Objectif : sécuriser l'authentification contre le vol de token via XSS, en remplaçant le stockage des tokens côté client (localStorage) par des cookies httpOnly gérés par le serveur.

---

## Contexte

Le frontend (React/Vite, repo séparé) fait actuellement de l'auth par Bearer token stocké en `localStorage`. On veut migrer vers des cookies httpOnly pour que le JS du navigateur n'ait plus jamais accès aux tokens (protection contre le vol par XSS).

**Comportement actuel du frontend, à connaître avant de changer quoi que ce soit :**

- `POST /auth/login` avec `{ email, motDePasse }` → réponse actuelle : `{ data: { access_token, refresh_token } }`. Le frontend stocke ensuite ces deux tokens en `localStorage`.
- Juste après, le frontend fait `GET /users/me` avec `Authorization: Bearer <access_token>` pour récupérer le profil utilisateur.
- `POST /auth/refresh` avec `Authorization: Bearer <refresh_token>` → réponse actuelle : `{ success, data: { access_token, refresh_token, expiresIn } }`.
- Il n'y a **pas d'endpoint `/auth/logout`** appelé côté serveur actuellement — le frontend se contente de vider son `localStorage`.
- Le frontend et le backend sont potentiellement sur des **domaines différents** (déploiement Docker/Nginx pour le front, API séparée) — à confirmer, car ça détermine les réglages `SameSite`/`Secure` des cookies.
- Il y a aussi une connexion **Socket.io** ouverte depuis le frontend vers l'API, actuellement sans authentification passée à la connexion.

## Ce qu'il faut changer côté backend

1. **`POST /auth/login`**
   - Continuer à valider les identifiants comme avant.
   - Au lieu de (ou en plus de, voir stratégie de transition plus bas) renvoyer `access_token`/`refresh_token` dans le corps JSON, les poser via `Set-Cookie` :
     - `access_token` : httpOnly, `Secure` (en prod, donc HTTPS obligatoire), `SameSite=None` si domaines différents (sinon `Lax` suffit), durée de vie courte (ex. 15 min).
     - `refresh_token` : mêmes attributs, mais `Path` restreint à l'endpoint de refresh (ex. `/auth/refresh`) et durée de vie plus longue (ex. 7-30 jours).
   - Le corps de réponse peut garder les infos non sensibles (ex. `user`), mais plus les tokens bruts.

2. **`POST /auth/refresh`**
   - Lire le `refresh_token` depuis le cookie (plus depuis le header `Authorization`).
   - Générer un nouvel `access_token` (et idéalement une rotation du `refresh_token`), les repositionner via `Set-Cookie`.
   - Retourner `expiresIn` dans le corps si le frontend en a besoin pour de l'UI (ex. afficher un compte à rebours), mais plus les tokens eux-mêmes.

3. **Nouvel endpoint `POST /auth/logout`**
   - Invalider le refresh token côté serveur (blacklist / suppression en DB selon votre implémentation).
   - Effacer les cookies (`Set-Cookie` avec `Max-Age=0` sur les mêmes noms/attributs que ceux posés au login).

4. **Middleware d'authentification**
   - Les routes protégées doivent lire le `access_token` depuis le cookie au lieu du header `Authorization: Bearer`.
   - Garder la vérification JWT (signature, expiration) identique à aujourd'hui.

5. **CORS**
   - `Access-Control-Allow-Credentials: true`.
   - `Access-Control-Allow-Origin` doit être une **origine explicite** (l'URL du frontend), jamais `*` — incompatible avec les credentials.

6. **Protection CSRF** (nécessaire dès qu'on passe en cookies, car le navigateur les envoie automatiquement)
   - Approche recommandée : pattern *double submit cookie*. Le backend pose un cookie **non-httpOnly** `csrf_token` (lisible en JS) au login. Le frontend le renvoie dans un header custom (ex. `X-CSRF-Token`) sur chaque requête mutante (POST/PUT/PATCH/DELETE). Le backend vérifie que le header correspond au cookie.
   - Dites-moi le nom exact du cookie/header choisi pour que je le câble côté frontend (interceptor Axios).

7. **Socket.io**
   - Accepter l'authentification via le cookie au moment du handshake (`socket.handshake.headers.cookie`), et rejeter la connexion si le token est absent/invalide.

## Stratégie de transition (recommandée)

Comme le frontend et le backend sont déployés indépendamment (repos/machines séparées), un changement brutal des deux côtés en même temps est risqué. Suggestion :
- Le backend supporte **les deux modes en parallèle** un temps : accepte le token soit via cookie, soit via header `Authorization` (comme aujourd'hui), et pose les cookies **en plus** de renvoyer les tokens dans le body.
- Une fois que le frontend est basculé et testé, retirer le support de l'ancien mode (tokens dans le body/header).

## Ce dont j'ai besoin en retour (pour câbler le frontend)

Merci de me confirmer, une fois implémenté :
- Les noms exacts des cookies (`access_token`, `refresh_token`, ou autres noms choisis).
- Le nom du cookie/header CSRF choisi.
- Si `POST /auth/logout` a été ajouté avec ce nom exact ou un autre.
- Les attributs `SameSite`/`Secure` réellement utilisés (dépend de si front et back sont sur le même domaine ou non).
- Si `GET /users/me` reste inchangé (auth via cookie automatique) ou si son contrat change.

Avec ces infos je met à jour `src/service/Axios.tsx`, `src/app/authSlice.ts`, `src/pages/LoginPage.tsx` et la connexion Socket.io côté frontend pour coller exactement au nouveau contrat.
