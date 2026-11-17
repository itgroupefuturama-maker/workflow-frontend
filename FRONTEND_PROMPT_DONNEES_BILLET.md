# Front — réponse aux « données manquantes » du module Ticketing

Réponse du backend à `BACKEND_DONNEES_MANQUANTES.md`, point par point.

## 0. Commission corrigée

- Résa et émission : commission = prix client − prix compagnie (= % × prix compagnie), plus jamais % × prix client.
  Ex. 60 %, billet 1 400 + service 200, taux 5 100 → `resaCommissionEnDevise = 960`, `resaCommissionEnAriary = 4 896 000`.
- Même correction quand on change la commission d'une entête de prospection (`PUT /prospections/entetes/:id`).
- `billetEntete.totalCompagnie` et `totalCommission` sont maintenant calculés, **en ariary**, sur les lignes ni annulées
  ni remplacées : montants d'émission si la ligne est émise, sinon ceux de la résa.
- Les données existantes sont corrigées par un script backend (lignes billet et totaux).

Le front n'a rien à recalculer : il affiche les valeurs de l'API.

## 1. `GET /prospections/entetes/:id` contient les lignes billet

Chaque `billetEntete[]` contient `billetLigne[]` (tous les champs de prix résa / émission, `statut`, `etatOdoo`,
`reservation`, …) et, par ligne, `billet: [{ numeroBillet, statut }]`. Rattachement à la ligne de prospection :
`billetLigne.prospectionLigneId`. Les appels `GET /billet/entete/:devisId/devis` supplémentaires ne sont plus nécessaires.

## 2. Prix d'émission en devise : pas de nouveaux champs

À l'émission, seul le taux change : les prix en devise sont ceux de la résa. Afficher pour l'émission les champs
`puResa…Devise` / `puResaMontant…Devise`, avec `emissionTauxChange` et les champs `…Ariary` d'émission.
La devise est `billetLigne.devise`.

## 3. Taxe

La taxe est déjà comprise dans le prix compagnie saisi à la résa : il n'y a pas de champ taxe à la résa ni à l'émission.
(Règle encore en cours de validation côté métier.)

## 4. Ville de départ

`GET /prospections/entetes/:id` inclut `departVoyage` sur chaque ligne de prospection, même forme que
`destinationVoyage`. Les deux incluent maintenant `pays`.

## 5. Arrondis

Les montants sont arrondis par le backend : 2 décimales en devise, à l'ariary près en ariary (prospection à la création
de ligne, résa, émission). Les anciennes données gardent leurs décimales, sauf les commissions recalculées.

## 6. N° Dos Ref

- `numeroDosRef` à plat sur chaque `billetLigne` de `GET /billet/entete/:devisId/devis` (voir `FRONTEND_PROMPT_NUMERO_DOS.md`).
- `GET /billet/dossier-commun/:dossierCommunId` : `numerosDosRef: string[]` par billet (sans doublon).

## 7. Divers

- `GET /billet/entete/:id` existe déjà et prend l'**id du billet** : l'utiliser au lieu de `…/:devisId/devis` quand on a l'id du billet.
- Date d'émission : pas de nouveau champ pour l'instant. `achatValideAt` (sur la ligne) = date où Odoo a confirmé l'achat.
