# Prompt frontend — Émission / achat / réservation billet : double clic, erreurs et miles

> Concerne le module Ticketing → page Billet : boutons de réservation (`PUT /billet/ligne/:id/resa`),
> d'achat / émission par ligne (`PUT /billet/ligne/:id/achat`) et d'émission du billet (`PUT /billet/:id/emettre`).

## 1. Réponses plus rapides (rien à changer, mais à savoir)

Le backend n'attend plus Odoo avant de répondre : réservation, achat et reprogrammation répondent tout de suite,
même si Odoo est lent ou en panne. Auparavant, une requête pouvait rester bloquée jusqu'à 10 s.

## 2. Empêcher le double envoi — à faire

Un deuxième clic pendant que la première requête était en cours provoquait l'erreur
**« Le statut de la ligne doit être 'FAIT' avant d'ajouter l'émission (statut actuel : CLOTURER) »**.
(Avant le 30/10, le message était : « … doit être 'FAIT', 'MODIFIER' ou 'ANNULER' … ».)
La première requête avait réussi : la ligne était déjà passée en `CLOTURER`.

- Désactiver le bouton (et afficher un chargement) pendant toute la durée de la requête : réservation,
  achat / émission de ligne, émission du billet, reprogrammation.
- Si cette erreur arrive quand même, **recharger le billet** (`GET /billet/entete/:id/devis`) au lieu d'afficher
  un échec : la ligne est probablement déjà émise.

## 3. `PUT /billet/:id/emettre` renvoie maintenant de vrais codes d'erreur — à adapter

Avant, toute erreur était renvoyée en **HTTP 200** avec `{ success: false, message }`. Désormais :

- succès → **200** avec le billet entête (inchangé) ;
- erreur → **4xx/5xx** avec le format d'erreur standard (`{ statusCode, message, error }`).

Erreurs possibles (404) :
- `Ce billet est déjà annulé`
- `Toutes les lignes doivent être en statut 'CLOTURER', 'MODIFIER' ou 'ANNULER' pour changer le statut du billet`

S'il n'y a pas de configuration Miles active pour le module, le billet est quand même émis, sans miles.

→ Gérer l'erreur dans le `catch` de l'appel axios, et ne plus tester `success === false` dans la réponse.

L'émission est maintenant **tout ou rien** : si elle échoue, le billet ne reste pas à moitié émis.

## 4. Autres changements visibles

- Les lignes d'annulation (pénalité / commission, `statusLigne: 'ANNULATION'`) ne génèrent plus de rappel
  ticketing, de sondage ni de miles.
- Les heures dans les textes de rappel sont maintenant à l'heure de Madagascar (avant : heure UTC du serveur).
- **Historique des miles** : une ligne annulée ou reprogrammée ne supprime plus les miles. Elle ajoute une
  transaction `status: 'ANNULER'`, avec `gainMiles` négatif et une description qui commence par `Annulation : …`.
  La transaction d'origine passe aussi en `status: 'ANNULER'`. Si l'écran des miles les affiche, il peut les
  griser ou les filtrer. Le solde affiché (`soldeMiles` de la dernière transaction) reste juste.
- Une nouvelle émission du même billet, par exemple après une reprogrammation, ne redonne pas les miles des
  lignes déjà émises.
