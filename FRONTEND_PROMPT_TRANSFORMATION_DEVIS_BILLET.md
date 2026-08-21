# Prompt à donner au frontend — Transformation devis → billet : statut persistant

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_TRANSFORMATION_DEVIS_BILLET.md`.
> ⚠️ **Pas encore actif en base** : même situation que les prompts hôtel précédents — la migration Prisma existe mais n'a pas pu être appliquée depuis l'environnement de dev de cette session (pas d'accès à la vraie base de données). Vérifiez avec le backend qu'elle a bien été appliquée (`npx prisma migrate deploy`) avant de tester.

---

## Ce qui a changé côté backend

`POST /billet/entete` met maintenant à jour le `Devis` d'origine (`devisId` du payload) après création réussie de l'entête de billet :
- `billetEnteteId` (string | null) : id du dernier `BilletEntete` créé pour ce devis.
- `transformeEnBilletAt` (DateTime | null) : horodatage de la dernière transformation.

Exposés sur `GET /devis/entete/:prospectionEnteteId` (déjà utilisé par `Devis.tsx`) — aucune autre modification de contrat, ces deux champs viennent s'ajouter aux objets `Devis` déjà renvoyés.

## Point important : un devis peut être transformé plusieurs fois

Contrairement au flux hôtel (où une réservation par devis est strictement imposée en base), `Devis.billetEntete` est une vraie relation **1-N** côté ticketing, et **rien n'empêche aujourd'hui de créer plusieurs `BilletEntete` pour le même devis** — ce n'était déjà pas bloqué avant ce changement, et je n'ai pas ajouté de blocage. `billetEnteteId` pointe donc vers le **dernier** billet créé, pas une preuve d'unicité.

**Décision côté UX à prendre par vous** (le backend ne tranche pas) :
- Bloquer complètement le bouton "Transformer / Billet" dès la première transformation (traiter ça comme du 1-à-1 même si techniquement possible d'en refaire), ou
- Le garder actif mais basculer "Voir les billets" en action principale dès `transformeEnBilletAt` non nul, en laissant "Transformer" en action secondaire pour les cas où plusieurs billets sont légitimement attendus pour un même devis.

## Ce qu'il faut faire côté frontend

1. Désactiver (ou reléguer en secondaire, selon la décision UX ci-dessus) le bouton "Transformer / Billet" dès que `devis.transformeEnBilletAt` n'est plus `null`.
2. Basculer "Voir les billets" en action principale dans ce cas (actuellement dans le menu "..." et activée par `statut === 'DEVIS_APPROUVE'`, indépendamment de la transformation réelle).
3. Utiliser `devis.billetEnteteId` pour un lien direct vers le dernier billet créé.

## Ce dont le backend a besoin en retour

- La décision UX ci-dessus (bloquer ou permettre plusieurs transformations) — n'affecte que le frontend, rien à changer côté backend dans les deux cas.
- Confirmation que `billetEnteteId`/`transformeEnBilletAt` sont les bons noms de champs.
