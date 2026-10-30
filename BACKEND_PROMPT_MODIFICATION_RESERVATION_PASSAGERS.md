# Prompt backend — Modification de réservation : les passagers doivent être remplacés, pas ajoutés

> Concerne `PUT /billet/ligne/:id/addreservation` (et `PATCH /billet/:billetEnteteId/reprogrammer` pour la copie
> des passagers). Front : `ReservationModal.tsx`, nouveau bouton « Modifier résa » sur les lignes `FAIT`.

## Le bug

Le front permet maintenant de **modifier la réservation d'une ligne `FAIT`**, comme indiqué dans
`FRONTEND_PROMPT_ANNULATION_MODIFICATION_BILLET.md`.

La modal envoie **la liste complète et finale** des passagers dans `passagers`. Elle ne peut jamais en envoyer plus
que `nombre`. Si l'agent retire l'ancien passager et en ajoute un nouveau, le payload ne contient que le nouveau.

Le backend **ajoute** ces passagers aux billets passagers déjà liés à la ligne au lieu de **remplacer** la liste.
L'ancien passager reste, et le nouveau s'ajoute.

Cas constaté sur le billet entête `cmvuorqg600012xrpzwkw0tw5`, le 30/10 :

| Ligne | statut | `prospectionLigne.nombre` | billets passagers |
|---|---|---|---|
| ancienne ligne | `ANNULER` | 1 | 3 (Bekoto Alphons, Jean Dupont, Tsiory Kol) |
| nouvelle ligne (reprogrammée) | `FAIT` | 1 | 3 (les mêmes) |

Les passagers se sont accumulés au fil des modifications, puis la reprogrammation a recopié les 3 sur la nouvelle
ligne.

## Ce qui est attendu

### `PUT /billet/ligne/:id/addreservation`

`passagers` est la **liste complète** des passagers de la ligne après l'opération, pas une liste à ajouter :

- un passager déjà lié à la ligne (même `clientbeneficiaireInfoId`) et présent dans `passagers` → **conservé**,
  avec ses préférences mises à jour (`servicePreferenceIds`) ;
- un passager lié à la ligne mais **absent** de `passagers` → **retiré** de la ligne ;
- un passager présent dans `passagers` mais pas encore lié → **ajouté**.

Le tout dans une **seule transaction**, comme le reste de la réservation (n° de réservation, prix, taux, preuve).

Contrôle technique conseillé : `passagers.length` ne doit pas dépasser `nombre`, sinon renvoyer une 400.

Pour une première réservation (ligne `CREER`), rien ne change : il n'y a aucun passager à retirer.

Si la ligne est `FAIT` et qu'un envoi Odoo existe, le billet repasse en `CREER`, comme prévu.

### `PATCH /billet/:billetEnteteId/reprogrammer`

La nouvelle ligne doit avoir **exactement** les passagers du payload `passagers`. Ce sont ceux choisis dans la
modal de reprogrammation. La nouvelle ligne ne doit pas recopier tous les billets passagers de l'ancienne ligne.

### Données déjà en base

Les lignes qui ont plus de billets passagers que leur `nombre`, comme ci-dessus, sont à corriger. Le plus simple est
d'en faire la liste pour que l'agent les reprenne avec « Modifier résa », une fois le correctif déployé.

## Réponse attendue par le frontend

1. Confirmation que `passagers` est traité comme la liste complète (remplacement) sur les deux routes.
2. Ce que deviennent les données liées à un passager retiré : préférences, et rappels ou miles éventuels.
3. La date de déploiement.
