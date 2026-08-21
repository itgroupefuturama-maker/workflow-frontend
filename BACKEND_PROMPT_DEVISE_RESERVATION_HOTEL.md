# Prompt à donner au backend — Devise non persistée sur une réservation hôtel

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Sujet indépendant des autres briefs — trouvé en creusant `HotelReservationModal.tsx`/`HotelReservationDetail.tsx`, dans la continuité de `BACKEND_PROMPT_APPROBATION_DEVIS_HOTEL.md` (même thématique : traçabilité de la devise utilisée sur un dossier hôtel).

---

## Contexte

Une ligne de benchmarking (`BenchmarkingLigne`) peut être chiffrée dans **plusieurs devises simultanément** (`deviseHotel[]` — ex. un même hôtel/chambre coté en USD et en EUR pour comparaison). C'est déjà bien géré à l'affichage : `HotelReservationDetail.tsx` montre chaque devise de référence avec son code (`d.devise.devise`) dans le bloc "Tarif référence (Benchmarking)".

Le problème apparaît à l'étape suivante, la réservation réelle (`PATCH /hotel/ligne/:ligneId/reservation`, formulaire dans `HotelReservationModal.tsx`) :
- Le payload envoyé (`puResaNuiteHotelDevise`, `resaTauxChange`, `puResaMontantDevise`, etc.) ne contient **aucune référence de devise** — ce sont des nombres bruts.
- `HotelLigne` (l'entité stockée) n'a **aucun champ `deviseId`/`devise`** — impossible de savoir après coup dans quelle devise ces montants ont été saisis.
- Résultat concret : dans `HotelReservationDetail.tsx`, le bloc "Tarif réservation réelle" affiche `ligne.puResaNuiteHotelDevise`/`ligne.puResaMontantDevise` **sans aucun code devise**, contrairement au bloc juste au-dessus (référence benchmarking) qui, lui, l'affiche correctement.

**Corrigé côté frontend en attendant** : `HotelReservationModal.tsx` pré-remplit maintenant les tarifs à partir de la devise de référence du benchmarking (auto-sélectionnée s'il n'y en a qu'une, sinon l'agent choisit laquelle avant de saisir), et les libellés affichent le vrai code devise au lieu du mot générique "Devise". Mais ce choix de devise n'est **envoyé nulle part** dans le payload actuel puisque le backend ne l'accepte pas.

**Autre point lié** : le devis d'origine (`DevisModule`) a désormais un champ `deviseRetenueId` (voir `BACKEND_PROMPT_APPROBATION_DEVIS_HOTEL.md`, déjà implémenté), fixé à l'approbation. Mais rien ne relie cette devise retenue aux lignes de la réservation hôtel créée ensuite via `POST /hotel/entete` — l'info est capturée une fois puis perdue à l'étape suivante du même flux.

## Ce qu'il faut ajouter côté backend

1. Ajouter un champ `deviseId` (+ relation `Devise`) sur `HotelLigne`.
2. Faire accepter `deviseId` dans le body de `PATCH /hotel/ligne/:ligneId/reservation` :
   - Requis si la `BenchmarkingLigne` associée référence plusieurs devises distinctes dans `deviseHotel[]`.
   - Optionnel/déductible automatiquement s'il n'y en a qu'une seule.
3. Exposer `deviseId`/`devise` (objet `Devise` complet) sur les endpoints qui renvoient une `HotelLigne` (ex. `GET /hotel/entete/:id` déjà utilisé par `HotelReservationDetail.tsx`).
4. Question ouverte, à votre avis : quand une réservation est créée pour une ligne dont le devis parent a déjà une `deviseRetenueId` fixée, ça aurait du sens de pré-remplir/valider automatiquement avec cette même devise plutôt que de la re-redemander à l'agent — dites si c'est faisable simplement de votre côté (ex. le backend refuse `deviseId` s'il ne correspond pas à `devis.deviseRetenueId` quand cette dernière existe), ou si on laisse l'agent libre de choisir indépendamment par ligne (cas où différentes lignes d'un même devis auraient des devises différentes).

## Ce dont j'ai besoin en retour

- Confirmation du nom de champ (`deviseId`) et si la validation "obligatoire seulement si plusieurs devises" convient telle quelle.
- Réponse sur le point 4 ci-dessus (propagation automatique depuis `devis.deviseRetenueId` ou choix indépendant par ligne).
- Une fois en place, je branche l'envoi de `deviseId` dans `HotelReservationModal.tsx` (le sélecteur existe déjà côté UI) et j'affiche le code devise dans le bloc "Tarif réservation réelle" de `HotelReservationDetail.tsx`.
