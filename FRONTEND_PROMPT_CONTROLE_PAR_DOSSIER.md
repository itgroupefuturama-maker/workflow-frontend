# Prompt à donner au frontend — Endpoint `/controle` scopé par dossier

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_CONTROLE_PAR_DOSSIER.md` : le filtrage serveur demandé pour `EvolutionClientTable.tsx` est en place.

---

## Contexte

`EvolutionClientTable.tsx` (onglet "Évolution Client" dans le détail d'un dossier commun) contourne aujourd'hui l'absence de filtre serveur en appelant `GET /controle/paginated?page=1&limit=500` puis en filtrant en JS sur `numDosCommun` et `module.nom`. Deux problèmes avec ça : gaspillage réseau (jusqu'à 500 lignes de toute l'agence rapatriées à chaque ouverture) et **risque de perte de données silencieuse** si un dossier dépasse 500 lignes de contrôle sur sa durée de vie (l'historique affiché serait incomplet, sans aucun signal d'erreur).

## Ce qui a changé côté backend

`GET /controle/paginated` accepte maintenant, en plus de `page`/`limit` déjà en place :
- `numDosCommun` (string, optionnel) : ne renvoie que les lignes dont `numDosCommun` correspond exactement à la valeur donnée (le numéro du dossier commun, ex. `dossier.numero`).
- `module` (string, optionnel, ex. `ticketing`/`hotel`/`attestation`/`visa`, insensible à la casse) : ne renvoie que les lignes dont `module.nom` correspond.

Les deux se combinent normalement. Sans eux, comportement inchangé — `PageControle.tsx` n'est pas affecté.

Même enveloppe de réponse qu'avant : `{ success: true, data: { data: [...], meta: { total, page, limit, totalPages } } }`.

## Ce qu'il faut faire côté frontend

Sur `EvolutionClientTable.tsx` :
1. Remplacer `GET /controle/paginated?page=1&limit=500` par un appel avec `numDosCommun` (et `module` si l'onglet est déjà filtré par module) en query params.
2. Mettre en place une vraie pagination (boutons page suivante/précédente ou infinite scroll selon l'écran) au lieu du `limit: 500` fixe, en s'appuyant sur `meta.totalPages` — sur le modèle des écrans déjà migrés dans `FRONTEND_PROMPT_PAGINATION.md`.
3. Retirer le filtrage JS local sur `numDosCommun`/`module.nom`, devenu redondant (fait côté serveur).

## Ce dont le backend a besoin en retour

Confirmation que `numDosCommun`/`module` sont les bons noms de paramètres pour ce que `EvolutionClientTable.tsx` envoie déjà côté client (ils reprennent exactement les noms des champs déjà utilisés pour le filtrage JS actuel, donc a priori aucun mapping à faire). Si un identifiant plus fiable qu'un numéro (ex. `dossierCommunId`) serait préférable de votre côté, dites-le et on ajuste.
