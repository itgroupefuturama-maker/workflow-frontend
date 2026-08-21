# Prompt à donner au frontend — Approbation + transformation d'un devis hôtel

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_APPROBATION_DEVIS_HOTEL.md` : les deux parties (approbation avec preuve+devise, statut de transformation) sont implémentées côté backend.
> ⚠️ **Pas encore actif en base** : la migration Prisma existe mais n'a pas pu être appliquée depuis cet environnement (pas d'accès à la vraie base de données). Tant qu'elle n'est pas appliquée par quelqu'un ayant accès (`npx prisma migrate deploy`), ces deux endpoints renverront une erreur serveur. Vérifiez avec le backend que c'est fait avant de tester.

---

## Partie 1 — Approbation : preuve + devise retenue

### Ce qui a changé côté backend

`PUT /hotel/benchmarking/:devisModuleId/approuver-devis` accepte maintenant un body `multipart/form-data` (au lieu d'aucun body) :
- `preuveApprobation` (fichier image — JPG/PNG/GIF/WEBP, **requis**) : capture d'écran de la validation client.
- `deviseId` (string, **requis seulement si le devis référence plusieurs devises distinctes** à travers ses lignes — sinon optionnel, déduite automatiquement s'il n'y en a qu'une).

Comportement de validation exact :
- Le backend calcule les devises distinctes référencées par les lignes client du devis. Si plus d'une : `deviseId` obligatoire, doit correspondre à l'une d'entre elles (sinon `400`). Si une seule : `deviseId` déduite automatiquement (l'envoyer quand même ne pose pas de souci tant qu'elle correspond). Si aucune (cas limite) : `deviseId` optionnel, juste vérifié comme `Devise` existante si fourni.
- Sans `preuveApprobation`, la requête échoue en `400` — le champ est strictement requis.

Le devis (`DevisModule`) garde ces infos après approbation, exposées sur les endpoints qui le renvoient (ex. après approbation, ou au chargement de l'écran détail) :
- `urlPreuveApprobation` (string | null) : chemin du fichier, à préfixer comme les autres fichiers déjà servis par l'app (`/uploads/...`).
- `deviseRetenueId` (string | null) + `deviseRetenue` (objet `Devise` complet — `{ id, devise, status, createdAt, updatedAt }`, pas juste l'id).

### Ce qu'il faut faire côté frontend

Sur `PageHotelDevis.tsx`, le bouton "Approuver" :
1. Passer l'appel en `multipart/form-data` avec un champ fichier pour `preuveApprobation` (input file, requis avant de pouvoir soumettre) et `deviseId`.
2. Si le devis référence plusieurs devises (à déterminer à partir des lignes déjà chargées côté client, ou en tentant sans `deviseId` et en gérant le `400` retourné), afficher un sélecteur de devise avant de permettre la soumission.
3. Afficher `urlPreuveApprobation`/`deviseRetenue.devise` une fois le devis approuvé (écran détail).

## Partie 2 — Transformation en réservation : statut persistant

### Ce qui a changé côté backend

`POST /hotel/entete` (création réservation à partir d'un devis approuvé) met maintenant à jour le `DevisModule` d'origine après création réussie de la réservation hôtel :
- `hotelEnteteId` (string | null) : id de l'entête hôtel créée.
- `transformeEnHotelAt` (DateTime | null) : horodatage de la transformation.

Ces deux champs sont `null` tant que le devis n'a pas été transformé, remplis dès que `POST /hotel/entete` réussit pour ce devis. Exposés sur les mêmes endpoints que `urlPreuveApprobation` ci-dessus.

**Note** : le backend empêchait déjà techniquement la création de deux réservations pour le même couple (prospection, devis) — une deuxième tentative échouait avec une erreur explicite. Ce qui manquait, c'est juste le signal persistant pour l'UI.

### Ce qu'il faut faire côté frontend

Sur `PageHotelDevis.tsx` :
1. Remplacer le `transformed` en mémoire (Redux, non persisté) par une lecture de `devisModule.transformeEnHotelAt` (ou `hotelEnteteId`) venant du serveur.
2. Désactiver le bouton "Transformer en hôtel" dès que `transformeEnHotelAt` n'est pas `null`.
3. Si `hotelEnteteId` est présent, proposer un lien direct vers la réservation créée (ex. `GET /hotel/entete/:id` déjà existant) plutôt qu'un simple badge "déjà transformé".

## Ce dont le backend a besoin en retour

- Confirmation que `urlPreuveApprobation`/`deviseRetenueId`+`deviseRetenue`/`hotelEnteteId`/`transformeEnHotelAt` sont les bons noms de champs pour ce que vous affichez (sinon dites ce qui manque).
- Si la validation "devise obligatoire seulement si plusieurs devises distinctes" convient telle quelle côté UX, ou si vous préférez la rendre systématiquement obligatoire avec pré-sélection automatique quand il n'y a qu'un choix (plus simple à câbler côté formulaire).
