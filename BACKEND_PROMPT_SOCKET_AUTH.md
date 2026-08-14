# Prompt à donner au backend — Authentification Socket.io

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Objectif : la connexion Socket.io accepte aujourd'hui n'importe qui sans vérifier d'identité — combler ce trou avant la mise en production.
> Indépendant de la migration cookies httpOnly (voir `BACKEND_PROMPT_AUTH_COOKIES.md`, point 7) — celle-ci reste à faire plus tard et changera la connexion socket une deuxième fois (passage à une auth via cookie). Ce prompt-ci couvre le correctif immédiat avec le système d'auth actuel (JWT Bearer).

---

## Contexte

Le frontend (React/Vite, repo séparé) ouvre une connexion Socket.io vers l'API dès qu'un utilisateur est connecté (deux endroits identiques : `FrontOfficeLayout.tsx` et `ListeParametreLayout.tsx`), pour recevoir des notifications temps réel. Jusqu'ici, cette connexion se faisait **sans transmettre aucune information d'authentification** :

```js
const socket = io(VITE_API_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});
```

Ce qui veut dire que **côté serveur, si rien ne filtre au handshake, n'importe qui peut se connecter au socket et recevoir les événements diffusés** (notifications, refresh de données), sans être authentifié.

**Vient d'être corrigé côté frontend** : le token JWT (le même `access_token` que celui envoyé en `Authorization: Bearer <token>` sur les requêtes REST, récupéré depuis le state Redux `auth.token`) est maintenant transmis à la connexion :

```js
const socket = io(VITE_API_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  auth: { token },   // ← ajouté
});
```

Le token arrive donc côté serveur dans `socket.handshake.auth.token` — **brut, sans préfixe `Bearer `**.

## Ce qu'il faut vérifier/changer côté backend

1. **Middleware d'authentification au handshake Socket.io**
   - Lire `socket.handshake.auth.token`.
   - Le valider avec exactement la même logique de vérification JWT que le middleware HTTP existant (signature, expiration).
   - Si absent ou invalide : rejeter la connexion (`next(new Error('unauthorized'))` en Socket.io côté serveur, ou équivalent selon la lib utilisée), pas de connexion silencieuse acceptée.

2. **Récupération de l'identité utilisateur**
   - Une fois le token validé, attacher l'utilisateur décodé au socket (ex. `socket.data.user = payload`), pour pouvoir cibler les événements par utilisateur (le frontend filtre déjà côté client sur `data.receiverId === user.id`, mais si le serveur diffuse en broadcast à tout le monde, autant restreindre l'émission côté serveur aussi si c'est déjà possible dans votre architecture).

3. **Reconnexion avec token expiré**
   - Le frontend retente automatiquement la connexion (5 tentatives, 3s d'intervalle) si le socket se déconnecte. Si le rejet pour token invalide déclenche ces 5 tentatives inutiles à chaque fois, dites-le moi : je peux adapter le frontend pour écouter `connect_error` et arrêter de retenter si l'erreur est une auth invalide (au lieu de laisser les 5 tentatives automatiques du client Socket.io).

## Ce dont j'ai besoin en retour

- Confirmation que le handshake rejette bien une connexion sans token ou avec un token invalide/expiré (un test rapide de votre côté suffit).
- Le nom exact du champ que vous lisez si ce n'est pas `handshake.auth.token` (par exemple si vous préférez `handshake.query.token` ou un header custom — dites-le-moi, j'adapte le frontend en conséquence).
- Si vous voulez émettre les événements ciblés par utilisateur (room par `userId` au lieu de broadcast global) — actuellement le frontend filtre côté client, ce qui n'est pas une vraie protection si les données du payload sont sensibles.
