# Prompt à donner au frontend — Complément pagination `/dossier-commun`

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `FRONTEND_PROMPT_PAGINATION.md` : le paramètre `module` demandé pour débloquer `ListeDossierByModule.tsx` (endpoint #7, `GET /dossier-commun`) est maintenant en place côté backend.

---

## Contexte

`GET /dossier-commun` ne filtrait, en plus de `page`/`limit`/`search`/`statut`, que sur le statut du dossier lui-même — pas sur le module ni le statut du collaborateur assigné, ce dont `ListeDossierByModule.tsx` a besoin. C'est corrigé.

## Ce qui a changé côté backend

Un paramètre `module` (string, optionnel) est ajouté sur `GET /dossier-commun` :
- `module` (ex. `ticketing`, `hotel`, `attestation`, `visa`, insensible à la casse) : ne renvoie que les dossiers où **l'utilisateur connecté lui-même** a un `dossierCommunColab` avec `status = 'CREER'`, sur ce module précis, **et** au moins une prestation liée à cette affectation.

Comportement exact :
- Sans `module` : identique à avant (filtré uniquement par utilisateur connecté + `search`/`statut` si fournis).
- Avec `module` : le filtre `module` se combine avec le filtre utilisateur déjà en place — pas un filtre indépendant, il cible bien la propre affectation de l'utilisateur connecté sur ce module (exactement la logique déjà faite en JS dans `ListeDossierByModule.tsx`).
- Fonctionne normalement avec `page`/`limit`/`search`/`statut` en même temps.

## Ce qu'il faut faire côté frontend

Brancher `ListeDossierByModule.tsx` sur la pagination exactement comme les 10 écrans déjà migrés (même composant `Pagination`, même pattern de thunk paginé — voir `FRONTEND_PROMPT_PAGINATION.md`), en ajoutant `module` aux query params envoyés (valeur du module affiché sur l'écran) et en retirant le filtrage JS local devenu redondant (le filtre par module/statut colab/prestation est maintenant fait côté serveur).

## Ce dont le backend a besoin en retour

Confirmation que le filtre reproduit bien exactement ce qui était fait en JS avant (même liste de dossiers affichée à quantité de données égale) — sinon préciser ce qui diffère.
