# Prompt à donner au frontend — Devise sur la réservation hôtel

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_DEVISE_RESERVATION_HOTEL.md`.
> ⚠️ **Pas encore actif en base** : même situation que `BACKEND_PROMPT_APPROBATION_DEVIS_HOTEL.md` — la migration Prisma existe mais n'a pas pu être appliquée depuis l'environnement de dev de cette session (pas d'accès à la vraie base de données). Vérifiez avec le backend qu'elle a bien été appliquée (`npx prisma migrate deploy` sur la vraie base) avant de tester.

---

## Ce qui a changé côté backend

**`PATCH /hotel/ligne/:ligneId/reservation`** (`HotelReservationModal.tsx`) accepte maintenant `deviseId` dans le body :
- **Requis** si la `BenchmarkingLigne` référence plusieurs devises distinctes (`deviseHotel[]` a plus d'une devise). Doit correspondre à l'une d'entre elles (sinon `400`).
- **Optionnel** s'il n'y en a qu'une seule — déduite automatiquement.
- **Propagation automatique** (réponse au point 4 du prompt) : si vous n'envoyez pas `deviseId` et que la ligne a plusieurs devises possibles, le backend regarde d'abord si `devis.deviseRetenueId` (fixée à l'approbation du devis, voir l'autre prompt) fait partie des devises de cette ligne — si oui, il l'utilise automatiquement sans redemander à l'agent. Sinon, `400` avec message explicite demandant `deviseId`. **Vous restez libre d'envoyer un `deviseId` différent** par ligne si besoin (des lignes d'un même devis peuvent légitimement être dans des devises différentes) — la propagation automatique n'est qu'un défaut, pas une contrainte.

`HotelLigne` garde cette info : `deviseId` (string | null) + `devise` (objet `Devise` complet — `{ id, devise, status, createdAt, updatedAt }`), exposés sur tous les endpoints qui renvoient une `HotelLigne` (`GET /hotel/entete/:id`, `GET /hotel/entete` liste, `GET /hotel/entete/prestation/:id`).

## Ce qu'il faut faire côté frontend

1. Sur `HotelReservationModal.tsx` : envoyer le `deviseId` déjà sélectionné dans le sélecteur existant (mentionné dans le prompt backend comme déjà présent côté UI) dans le payload `PATCH .../reservation`.
2. Sur `HotelReservationDetail.tsx`, bloc "Tarif réservation réelle" : afficher `ligne.devise.devise` (le code, ex. `USD`) à côté de `ligne.puResaNuiteHotelDevise`/`ligne.puResaMontantDevise`, exactement comme le bloc "Tarif référence (Benchmarking)" au-dessus le fait déjà avec `d.devise.devise`.
3. Si la ligne n'a qu'une devise possible, pas besoin d'afficher le sélecteur avant soumission (le backend la déduit automatiquement) — mais l'envoyer quand même si déjà connue côté client ne pose pas de souci.

## Bonus trouvé en marge de ce chantier (déjà corrigé côté backend, rien à faire ici)

En creusant l'insertion des lignes `Controle` depuis une réservation hôtel, deux points ont été corrigés côté backend, sans impact sur le contrat déjà utilisé par le frontend :
- La devise inscrite sur les lignes de contrôle comptable (`Controle.cmDevise`/`fcDevise`) venait auparavant de la première devise de référence du benchmarking, indépendamment de celle réellement utilisée pour les montants saisis par l'agent — maintenant elle vient de `HotelLigne.deviseId` (la vraie devise saisie).
- La preuve d'approbation du devis (`DevisModule.urlPreuveApprobation`, voir l'autre prompt) est désormais rattachée aux `Controle` de la réservation (type `PREUVE_APPROBATION`), comme c'est déjà le cas côté ticketing pour la preuve client.

## Ce dont le backend a besoin en retour

- Confirmation que `deviseId` est le bon nom de champ et que la logique de propagation automatique (point ci-dessus) convient, ou si vous préférez toujours redemander explicitement à l'agent même quand une valeur par défaut est déductible.
