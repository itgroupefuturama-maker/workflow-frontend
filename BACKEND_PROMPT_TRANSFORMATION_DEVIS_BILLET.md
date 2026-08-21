# Prompt à donner au backend — Transformation devis → billet : aucun statut

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Sujet indépendant des autres briefs — trouvé en analysant `Devis.tsx` (module ticketing). Même problème que celui déjà corrigé côté hôtel (`BACKEND_PROMPT_APPROBATION_DEVIS_HOTEL.md`, partie 2), mais ici sur le devis billetterie (`Devis`, pas `DevisModule`).

---

## Contexte

Sur l'écran de liste des devis (`Devis.tsx`, module ticketing), une fois un devis au statut `DEVIS_APPROUVE`, le bouton principal "Transformer / Billet" appelle :

```
POST /billet/entete
Body : { devisId, prospectionEnteteId }
```

Ça crée bien un nouvel entête de billet à partir du devis (la réponse contient l'id du billet créé, utilisé pour naviguer vers l'écran billet), mais **le statut du devis n'est jamais mis à jour en retour** — `devis.statut` reste à `DEVIS_APPROUVE` indéfiniment, sans aucune trace que la transformation a eu lieu.

Conséquences concrètes côté frontend :
1. **Bouton "Transformer / Billet" jamais désactivé** : comme il ne dépend que de `devis.statut === 'DEVIS_APPROUVE'` (qui ne change jamais après transformation), rien n'empêche de cliquer plusieurs fois et de créer plusieurs entêtes de billet pour le même devis.
2. **Aucun signal fiable pour savoir si un devis a déjà été transformé** — au rechargement de la page, ou pour un collègue qui ouvre le même devis plus tard, impossible de le voir sans aller vérifier manuellement dans le module billet.
3. L'action secondaire "Voir les billets" (menu "...") est déjà présente mais activée seulement par `statut === 'DEVIS_APPROUVE'` — donc active en même temps que "Transformer", pas comme conséquence d'une transformation réussie.

Statuts actuels connus côté frontend pour `Devis.statut` : `CREER`, `DEVIS_A_APPROUVER`, `DEVIS_APPROUVE`, `ANNULER`. Aucun ne représente "transformé en billet".

## Ce qu'il faut ajouter côté backend

Que `POST /billet/entete` mette à jour le `Devis` d'origine (`devisId` du payload) après création réussie de l'entête de billet — deux approches possibles, à votre convenance (même choix que pour le devis hôtel) :
- Un nouveau statut dédié (ex. `DEVIS_TRANSFORME`), ou
- Un champ séparé (ex. `billetEnteteId` + `transformeEnBilletAt`) sans toucher à la machine à états `statut` existante — **recommandé**, pour rester cohérent avec la solution déjà adoptée côté hôtel (`hotelEnteteId`/`transformeEnHotelAt` sur `DevisModule`) et ne pas avoir deux conventions différentes dans la même app.

Exposer ce(s) champ(s) sur `GET /devis/entete/:enteteId` (déjà utilisé par `Devis.tsx` pour charger la liste des devis d'une prospection).

## Ce qu'il faut faire côté frontend une fois en place

1. Désactiver le bouton "Transformer / Billet" dès que `billetEnteteId`/`transformeEnBilletAt` n'est plus `null`, et le remplacer par "Voir les billets" comme action principale (au lieu de rester dans le menu secondaire).
2. Utiliser `billetEnteteId` pour un lien direct vers le billet déjà créé.

## Ce dont j'ai besoin en retour

- Confirmation des noms de champs retenus, et si vous partez sur la même convention que côté hôtel (`billetEnteteId`/`transformeEnBilletAt`) ou un nouveau statut.
- Si un devis peut légitimement être transformé plusieurs fois (billets multiples pour un même devis) ou si c'est strictement 1-à-1 — ça détermine si on bloque complètement le bouton après la première transformation, ou si on autorise d'en recréer d'autres en plus d'afficher les billets déjà créés.
