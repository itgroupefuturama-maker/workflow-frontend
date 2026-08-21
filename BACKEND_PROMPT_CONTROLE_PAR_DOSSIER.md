# Prompt à donner au backend — Endpoint `/controle` scopé par dossier

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Ne fait pas suite à `BACKEND_PROMPT_PAGINATION.md` (les 13 endpoints de ce brief sont tous traités) — c'est un problème séparé, trouvé en marge de ce chantier.

---

## Contexte

Le frontend a un composant `EvolutionClientTable.tsx` (onglet "Évolution Client" affiché dans le détail d'un dossier commun) qui a besoin de l'historique complet des lignes `Controle` **d'un seul dossier** (même modèle de données que l'écran `PageControle.tsx`, déjà servi par `GET /controle/paginated`).

**Problème actuel** : il n'existe pas d'endpoint pour filtrer les `Controle` par dossier côté serveur. Le frontend contourne ça en appelant `GET /controle/paginated?page=1&limit=500`, puis filtre en JS sur `numDosCommun` (numéro du dossier commun) et `module.nom`. Deux problèmes réels avec ce contournement :
- Ça rapatrie jusqu'à 500 lignes de contrôle de **toute l'agence** à chaque ouverture de l'onglet, pour n'en garder qu'une poignée après filtrage — gaspillage réseau.
- **Risque de perte de données silencieuse** : si un dossier accumule plus de 500 lignes sur sa durée de vie, tout ce qui dépasse la 500e ligne (au sens du tri par défaut de `/controle/paginated`, pas forcément les plus anciennes/récentes du dossier) n'est jamais chargé — le composant affiche alors un historique incomplet sans aucun signal d'erreur.

Ce n'est pas lié à l'entité `Suivi`/`GET /suivi` (existante mais non utilisée côté frontend, code mort) — c'est bien le même modèle `Controle` que `PageControle.tsx`, juste filtré différemment.

## Ce qu'il faut ajouter côté backend

Un moyen de filtrer `GET /controle/paginated` par dossier, en plus de `page`/`limit` déjà en place :
- `numDosCommun` (string, optionnel) : ne renvoyer que les lignes dont `numDosCommun` correspond exactement à la valeur donnée (le numéro du dossier commun, tel qu'affiché partout ailleurs dans l'app — ex. `dossier.numero`).
- `module` (string, optionnel, ex. `ticketing`/`hotel`/`attestation`/`visa`, insensible à la casse) : ne renvoyer que les lignes dont `module.nom` correspond.

Les deux peuvent être combinés (comme actuellement fait côté client). Sans ces paramètres, comportement inchangé (rétrocompatible avec l'écran `PageControle.tsx`, qui ne les enverra pas).

Même enveloppe de réponse que `/controle/paginated` actuellement : `{ success: true, data: { data: [...], meta: { total, page, limit, totalPages } } }`.

## Ce dont j'ai besoin en retour

Confirmation que `numDosCommun`/`module` sont les bons noms de paramètres (ou la variante que vous préférez, ex. accepter directement un `dossierCommunId` plutôt qu'un numéro si c'est plus simple/fiable côté requête). Une fois en place, je branche `EvolutionClientTable.tsx` dessus avec une vraie pagination (au lieu du `limit: 500` actuel), sur le modèle des écrans déjà migrés dans `BACKEND_PROMPT_PAGINATION.md`.
