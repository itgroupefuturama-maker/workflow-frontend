# Réponse backend — réassignation du responsable (colab) d'un module

Suite à `BACKEND_PROMPT_REASSIGNATION_COLAB.md`.

## 1. Diagnostic du bug (prospections vides après réassignation)

L'hypothèse initiale n'était pas tout à fait la bonne : `PATCH /dossier-commun/:id/update/colabs`
(`addOrChangeColab` côté backend) **transfère bien** la `Prestation` existante vers le nouveau
colab (`prestation.updateMany({ dossierCommunColabId: oldColab.id → newColab.id })`), il ne crée
pas un colab "vide".

Le vrai problème était en aval : l'ancien colab n'est pas supprimé, il passe juste en
`status: 'ANNULER'` (pour garder l'historique/audit). `GET /dossier-commun/:id` (et les endpoints
de liste) renvoyaient **tous** les `dossierCommunColab`, actifs et annulés confondus. Pour un
module réassigné, le tableau contenait donc deux entrées `module.nom === "ticketing"` : l'ancienne
(ANNULER, `prestation: []` puisque la Prestation a été déplacée) et la nouvelle (CREER, avec la
Prestation). Votre résolution `dossierCommunColab.find(colab => colab.module.nom === "ticketing")`
pouvait tomber sur la première des deux — l'ancienne, vide — d'où les prospections introuvables
alors que les billets (scopés par `dossierId`, pas par colab) restaient visibles.

**Correctif appliqué** : `GET /dossier-commun/:id`, `GET /dossier-commun` (liste complète et
paginée) ne renvoient plus désormais que les `dossierCommunColab` **actifs**
(`status !== 'ANNULER'`). Il ne peut plus y avoir qu'une seule entrée par module dans
`dossierCommunColab` pour un dossier donné. Votre `.find(colab => colab.module.nom === ...)`
n'a donc plus besoin de traiter le cas de doublon — il n'y en aura plus.

Aucun changement de contrat/format de réponse par ailleurs (mêmes champs, `prestation` reste un
tableau).

## 2. Notifications

La brique de notification existe déjà côté backend (elle est utilisée à la création d'un dossier
commun) — elle est maintenant **branchée sur l'ajout et la réassignation de colab** aussi :

- `POST /dossier-commun/:id/colabs` (ajout d'un colab sur un module qui n'en avait pas) envoie
  désormais une notification au nouvel utilisateur.
- `PATCH /dossier-commun/:id/update/colabs` (réassignation) envoie désormais **deux**
  notifications : une au nouveau responsable
  (`description: "Un module de dossier vous a été attribué"`), et une à l'ancien responsable
  (`description: "Vous n'êtes plus responsable de ce module de dossier"`).

### Mécanisme disponible

**In-app**, via table `Notification` (`id`, `receiverId`, `description`, `status`, `isRead`,
`createdAt`) + REST + push websocket. Pas d'email actuellement.

**REST** (`/notifications`, toutes les routes sous `JwtAuthGuard`) :
- `GET /notifications/user/:userId` — liste complète, triée `createdAt desc` (pas encore paginée,
  contrairement aux dossiers — voir `BACKEND_PAGINATION_TRACKING.md`. Si le volume devient
  important, prévenez-nous, on ajoutera la pagination avec le même utilitaire).
- `GET /notifications/user/:userId/unread` — non lues uniquement.
- `GET /notifications/user/:userId/count` — `{ receiverId, unreadCount }`, pour un badge compteur.
- `PATCH /notifications/:id/read` — marquer une notification comme lue.
- `PATCH /notifications/user/:userId/read-all` — tout marquer lu.
- `DELETE /notifications/:id` — soft-delete (`status: 'SUPPRIMER'`).

**Websocket** (Socket.io, voir `BACKEND_PROMPT_SOCKET_AUTH.md` pour l'auth du handshake) : chaque
client rejoint automatiquement une room = son `userId`. Événement `notification` émis à la création,
payload :
```json
{ "entityType": "NOTIFICATION", "receiverId": "...", "entityId": "<notification.id>", "action": "CREATE" }
```
Le payload ne contient pas encore le `dossierCommunId`/module concerné — seulement l'id de la
notification. Pour l'instant il faut re-fetch la notif (ou la liste) pour afficher/naviguer.
Dites-nous si vous avez besoin d'un lien direct vers le dossier dans le payload, on peut l'ajouter
au `description` ou en champ dédié.

### Suggestion d'implémentation frontend

1. Se connecter au socket (déjà fait pour l'auth JWT) et écouter `notification` pour déclencher un
   `refetch` du compteur (`GET /notifications/user/:userId/count`) et/ou toast.
2. Écran Paramètres → Notifications : remplacer le placeholder par un fetch de
   `GET /notifications/user/:userId`, avec bouton "tout marquer lu" sur `read-all`.

Dites-nous si ce format vous convient ou si vous préférez un format différent (pagination immédiate,
`dossierCommunId` dans le payload) — on ajuste.
