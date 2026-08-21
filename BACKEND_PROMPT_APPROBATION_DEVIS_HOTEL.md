# Prompt à donner au backend — Approbation + transformation d'un devis hôtel

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Sujet indépendant des autres briefs pagination/auth — trouvé en travaillant sur `PageHotelDevis.tsx`.
> Deux problèmes distincts mais sur le même écran/flux : l'approbation (partie 1) et la transformation en réservation (partie 2).

---

## Partie 1 — Approbation : preuve + devise retenue

### Contexte

Sur l'écran de détail d'un devis hôtel (`PageHotelDevis.tsx`), le bouton "Approuver" appelle aujourd'hui :

```
PUT /hotel/benchmarking/:devisId/approuver-devis
```

Sans aucun body — juste un changement de statut (`DEVIS_A_APPROUVER` → `DEVIS_APPROUVE`). Il manque deux informations métier à cette étape, actuellement absentes du flux :

1. **Une preuve de validation client** : l'agent doit pouvoir joindre une image (capture d'écran de la discussion — WhatsApp, email, etc. — où le client valide le devis) au moment de l'approbation. Rien n'existe aujourd'hui pour ça sur cet endpoint (à la différence d'autres entités de l'app, ex. `Controle.pjControle`, qui ont déjà un système de pièces jointes).

2. **La devise retenue pour ce devis** : un devis hôtel regroupe plusieurs `benchmarkingEntetes`, chacun avec une `ligneClient`, elle-même avec potentiellement **plusieurs devises simultanément** (`ligneClient.deviseHotel[]` — un même hôtel/chambre peut être chiffré en USD et en EUR par exemple, pour comparaison). Au moment d'approuver, l'agent doit choisir **une seule devise pour l'ensemble du devis**, car cette information sera réutilisée par la suite (facturation/transformation en réservation — actuellement rien ne fixe quelle devise fait foi une fois le devis approuvé).

### Ce qu'il faut ajouter côté backend

Faire accepter à `PUT /hotel/benchmarking/:devisId/approuver-devis` un body `multipart/form-data` (même pattern que les autres endpoints de l'app qui combinent fichier + champs, ex. l'émission de billets) :

- `preuveApprobation` (fichier image, requis) : à stocker et exposer ensuite via une URL sur le devis (même logique que les champs `url1`/`url2` déjà présents sur l'entité `Devis` pour les PDF).
- `deviseId` (string, requis si le devis référence plus d'une devise distincte à travers ses lignes — sinon optionnel/déductible automatiquement s'il n'y en a qu'une) : l'id de la `Devise` à retenir pour ce devis.

Le devis (`Devis`) devrait garder cette information après approbation — au minimum :
- l'URL de la preuve (nouveau champ, ex. `urlPreuveApprobation`),
- la devise retenue (nouveau champ, ex. `deviseRetenueId` + relation vers `Devise`),

pour qu'on puisse les afficher/réutiliser sur les écrans en aval (détail du devis, transformation en réservation, éventuellement la facturation).

## Partie 2 — Transformation en réservation : aucun changement de statut

### Contexte

Une fois le devis approuvé, le bouton "Transformer en hôtel" appelle :

```
POST /hotel/entete
Body : { hotelProspectionEnteteId, devisModuleId }
```

Ça crée bien une nouvelle réservation hôtel à partir du devis, mais **le statut du devis n'est jamais mis à jour en retour** — la réponse ne contient rien qui indique que la transformation a eu lieu. Le frontend actuel se contente de mémoriser un booléen `transformed` en mémoire (Redux, non persisté) juste après l'appel réussi, ce qui pose deux problèmes concrets :

1. **Perte d'info au rechargement** : si l'agent recharge la page, revient plus tard sur ce devis, ou qu'un collègue l'ouvre, rien n'indique que le devis a déjà été transformé — puisque `devis.statut` reste à `DEVIS_APPROUVE` indéfiniment.
2. **Doublons possibles** : le bouton "Transformer en hôtel" reste cliquable tant que `devis.statut === 'DEVIS_APPROUVE'` (jamais désactivé après une transformation réussie, puisque rien ne change ce statut) — rien n'empêche aujourd'hui de cliquer plusieurs fois et de créer plusieurs réservations hôtel pour le même devis.

### Ce qu'il faut ajouter côté backend

Que `POST /hotel/entete` (ou le service qui le traite) mette à jour le devis d'origine (`devisModuleId`) après création réussie de la réservation :
- Un nouveau statut dédié (ex. `DEVIS_TRANSFORME`), ou un champ booléen/horodatage séparé (ex. `transformeEnHotelAt`) si vous préférez ne pas toucher à la machine à états du statut existant.
- Idéalement, garder une référence vers l'entête hôtel créée (ex. `hotelEnteteId` sur le devis) pour qu'on puisse proposer un lien direct "voir la réservation" depuis l'écran du devis, plutôt que de juste afficher un badge "déjà transformé".

## Ce dont j'ai besoin en retour

- Partie 1 : confirmation des noms de champs retenus (`preuveApprobation`/`deviseId` ou une autre convention si vous préférez), et le nom exact du/des champ(s) ajoutés sur la réponse du devis pour que je les affiche (URL preuve, devise retenue). Si la validation "devise obligatoire seulement si plusieurs devises distinctes dans le devis" est faisable telle quelle côté serveur, ou si vous préférez la rendre systématiquement obligatoire (plus simple à implémenter, quitte à ce que le frontend pré-sélectionne automatiquement s'il n'y a qu'un choix).
- Partie 2 : quel champ/statut utiliser pour détecter côté frontend qu'un devis a déjà été transformé (nom exact + valeur), et si une référence vers l'entête hôtel créée est prévue.
