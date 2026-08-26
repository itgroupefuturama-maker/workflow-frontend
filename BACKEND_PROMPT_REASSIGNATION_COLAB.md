# Prompt pour le backend — réassignation du responsable (colab) d'un module

## Contexte

Sur l'écran de gestion d'un dossier commun (`DossierCommunManage.tsx`), on peut changer le
"responsable" (colab) d'un module pour un dossier donné. Deux appels API sont utilisés côté
frontend :

- **Ajout** d'un nouveau colab sur un module qui n'en avait pas : `POST /dossier-commun/:id/colabs`
  avec `{ userId, moduleId }`.
- **Changement** du responsable d'un module qui en a déjà un : `PATCH /dossier-commun/:id/update/colabs`
  avec `{ userId, moduleId }` (le nouvel utilisateur).

## Bug observé

Après avoir réassigné le module **ticketing** à un nouvel utilisateur via ce PATCH :

- ✅ Le nouvel utilisateur a bien accès à la **liste des billets** du dossier.
- ❌ Le nouvel utilisateur **n'a pas accès à la liste des prospections** (entêtes de prospection)
  du même dossier — la liste s'affiche vide alors que le dossier contient bien des entêtes.

## Hypothèse (à vérifier côté backend)

Le modèle de données vu depuis le frontend (`DossierCommunColab` → `prestation: Prestation[]`,
et `Prestation.dossierCommunColabId`) suggère que chaque **colab** (couple module + utilisateur
responsable, avec son propre `id`) a sa ou ses propre(s) `Prestation`, et que les entêtes de
prospection sont rattachées à une prestation (`GET /prospections/entetes/prestation/:prestationId`).

Côté frontend, le `prestationId` utilisé pour charger les prospections est résolu ainsi :

```
dossierCommunColab.find(colab => colab.module.nom.toLowerCase() === "ticketing")?.prestation?.[0]?.id
```

Alors que la liste des billets est chargée directement par `dossierId` (`GET .../billet/...` scopé
dossier), sans dépendre du colab actif.

**Hypothèse la plus probable** : le `PATCH /dossier-commun/:id/update/colabs` crée une **nouvelle**
ligne `DossierCommunColab` pour le nouvel utilisateur (au lieu de mettre à jour l'`userId` sur la
ligne existante), et cette nouvelle ligne n'hérite pas de la `Prestation` existante (`prestation: []`
côté nouveau colab). Résultat : le nouvel utilisateur voit bien le dossier/les billets (scopés dossier)
mais pas les prospections (scopées à une `Prestation` rattachée à l'ancien colab, désormais inactif).

**Merci de vérifier** :
1. Ce que fait concrètement `PATCH /dossier-commun/:id/update/colabs` sur les tables `DossierCommunColab`
   et `Prestation` (update en place vs. nouvelle ligne + désactivation de l'ancienne).
2. Si nouvelle ligne il y a, comment la `Prestation` existante (et donc l'historique des prospections/devis/
   billets qui lui sont rattachés) doit être réassignée ou rendue accessible au nouveau colab.
3. Confirmer/corriger selon le comportement voulu : la réassignation d'un responsable doit donner accès à
   **tout l'historique existant du module pour ce dossier** (prospections comprises), pas seulement aux
   nouvelles données.

## Second point : absence de notification lors d'une réassignation

Quand un utilisateur se voit attribuer la responsabilité d'un module sur un dossier (ajout ou
changement de colab), il devrait recevoir une notification — actuellement rien ne se passe.

Le frontend n'a **pas encore de système de notification implémenté** (l'écran Paramètres →
Notifications est un simple placeholder "disponible prochainement", aucun store/endpoint de
consommation n'existe côté client).

**Questions pour cadrer le travail** :
1. Existe-t-il déjà une brique de notification côté backend (table, service d'envoi, queue) sur
   laquelle s'appuyer, ou tout est à créer ?
2. Quel mécanisme est envisagé : notification in-app (à interroger/poller ou pousser en websocket,
   sachant que Socket.io est déjà utilisé par l'app), email, ou les deux ?
3. Si in-app : quelle forme de données pour le frontend (liste paginée de notifications avec statut
   lu/non-lu ? juste un compteur ?) — ça déterminera ce qu'on construit côté client une fois votre
   réponse reçue.

Merci de répondre dans un `FRONTEND_PROMPT_REASSIGNATION_COLAB.md` avec le diagnostic du bug (1) et
vos préconisations/contraintes pour la notification (2), pour que je puisse adapter le frontend en
conséquence.
