# Prompt à donner au backend — Complément pagination `/dossier-commun`

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Fait suite à `BACKEND_PROMPT_PAGINATION.md` / `FRONTEND_PROMPT_PAGINATION.md` : 10 des 13 endpoints identifiés ont été migrés côté frontend avec succès. `GET /dossier-commun` (endpoint #7 du brief initial) est bloqué — le contrat reçu ne couvre pas un filtre nécessaire à l'écran concerné.

---

## Contexte

L'écran `ListeDossierByModule.tsx` (liste des dossiers communs par module — ticketing/hôtel/attestation/visa) ne se contente pas d'afficher tous les dossiers : il filtre côté client sur **le module et le statut du collaborateur assigné**, pas sur le statut du dossier lui-même. Un dossier n'apparaît sur cet écran que si :
- il a un `dossierCommunColab` dont `status === 'CREER'` **et** `colab.module.nom` correspond au module affiché (ticketing/hôtel/...),
- **et** ce collaborateur a au moins une `prestation` non vide.

Le contrat actuel (`page`, `limit`, `search` sur description/contact/référence travel planner, `statut` sur le statut du dossier) ne permet pas de reproduire ce filtre côté serveur. Si on paginait tel quel, certaines pages afficheraient 0 résultat après filtrage côté client alors qu'il en resterait sur d'autres pages — la pagination serait inutilisable pour cet écran précis.

## Ce qu'il faut ajouter côté backend

Un paramètre supplémentaire sur `GET /dossier-commun`, en plus de ceux déjà en place :
- `module` (string, optionnel, ex. `ticketing`/`hotel`/`attestation`/`visa`) : ne renvoyer que les dossiers ayant au moins un `dossierCommunColab` avec `status = 'CREER'`, `colab.module.nom` correspondant (insensible à la casse) à ce paramètre, **et** au moins une `prestation` liée à ce collaborateur.

Sans ce paramètre, le comportement reste inchangé (comme les autres endpoints déjà migrés — rétrocompatible).

## Ce dont j'ai besoin en retour

- Confirmation que ce filtre est faisable tel quel, ou la variante que vous préférez (ex. accepter directement un `moduleId` plutôt qu'un nom si c'est plus simple côté requête SQL/Prisma).
- Une fois en place : je branche `ListeDossierByModule.tsx` sur la pagination exactement comme les 10 autres écrans déjà migrés (même composant `Pagination`, même pattern de thunk paginé).
