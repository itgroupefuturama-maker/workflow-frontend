# Prompt à donner au frontend — Suite de l'authentification Socket.io

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_SOCKET_AUTH.md` : le backend a implémenté le correctif demandé. Ce prompt couvre la vérification côté frontend et un point de vigilance à traiter.

---

## Contexte

Le trou de sécurité sur la connexion Socket.io (n'importe qui pouvait se connecter sans authentification) est corrigé côté backend :

- Le handshake Socket.io valide maintenant le JWT lu dans `socket.handshake.auth.token` — **exactement le champ déjà utilisé côté frontend**, aucune adaptation du code d'envoi n'est nécessaire.
- Une connexion sans token, avec un token invalide, ou avec un token expiré est rejetée : le client reçoit un événement `connect_error` avec le message `unauthorized`.
- Une connexion avec un token valide est acceptée normalement.
- Les notifications ciblées (`notification`, `new Notif`) ne sont plus diffusées à tous les clients connectés : elles n'arrivent désormais qu'au(x) client(s) de l'utilisateur destinataire (le backend place chaque socket dans une "room" nommée par son `userId`, déduit du JWT).
- Ceci a été validé par une suite de tests automatisés côté backend (handshake rejeté/accepté selon le token, émission bien reçue uniquement par le destinataire ciblé).

## Ce qu'il faut vérifier/tester côté frontend

1. **Connexion normale** (login → dashboard) : le socket doit se connecter comme avant, les notifications doivent continuer d'arriver normalement.

2. **Logout** : vérifier que le socket se déconnecte bien (`socket.disconnect()`) au moment du logout. Sinon, un client authentifié périmé reste connecté côté serveur tant que la coupure réseau n'est pas détectée.

3. **⚠️ Point de vigilance principal — rafraîchissement du token** :
   L'option `auth: { token }` passée à `io(...)` est un objet capturé **une seule fois**, au moment où le socket est créé. Si le token est rafraîchi plus tard (refresh silencieux, nouveau login) **sans recréer complètement le socket**, les tentatives de reconnexion automatiques de Socket.io renverront l'**ancien** token capturé à la création — qui sera rejeté par le nouveau middleware d'auth.
   - Vérifier : le socket est-il recréé à chaque changement de session/token, ou vit-il plus longtemps que le token (ex: sur tout le cycle de vie de l'app) ?
   - Si le token peut changer sans que le socket soit recréé, remplacer l'objet statique par une fonction, pour que chaque tentative de connexion/reconnexion envoie le token courant :
     ```js
     const socket = io(VITE_API_URL, {
       transports: ['websocket'],
       autoConnect: true,
       reconnection: true,
       reconnectionAttempts: 5,
       reconnectionDelay: 3000,
       auth: (cb) => cb({ token: store.getState().auth.token }),
     });
     ```

4. **Session qui expire pendant que le socket est ouvert** : observer ce qui se passe visuellement à la prochaine tentative de reconnexion (échec silencieux ? notification d'erreur affichée à l'utilisateur ? boucle des 5 tentatives puis abandon ?).

5. **Multi-onglets / même utilisateur connecté plusieurs fois** : plusieurs sockets peuvent rejoindre la même room `userId` côté backend sans problème — à vérifier une fois en conditions réelles que chaque onglet reçoit bien ses notifications.

## Décision à prendre : gestion des 5 tentatives de reconnexion sur token invalide/expiré

Actuellement, si le handshake est rejeté (`connect_error: unauthorized`), Socket.io retente automatiquement 5 fois (toutes les 3s) avant d'abandonner — ces tentatives sont inutiles si la cause est une auth invalide plutôt qu'une coupure réseau. Deux options :

- **Ne rien changer** : le coût des 5 tentatives ratées est faible, elles échoueront proprement à chaque fois.
- **Écouter `connect_error`** et arrêter le retry immédiatement si le message est `unauthorized` (via `socket.disconnect()` dans le handler, ou `reconnection: false` combiné à une reconnexion manuelle après refresh du token) — plus propre si l'expiration de session est un cas fréquent.

## Ce dont le backend a besoin en retour

- Confirmation que la connexion fonctionne toujours normalement pour un utilisateur authentifié (pas de régression).
- Réponse sur le point 3 (rafraîchissement du token) : est-ce déjà géré correctement, ou faut-il l'adapter ?
- Décision sur la gestion des 5 tentatives de reconnexion (section ci-dessus) — dites-le si vous voulez que le backend ajuste quelque chose de son côté (peu probable, mais à confirmer).
