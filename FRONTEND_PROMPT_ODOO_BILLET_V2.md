# Prompt frontend — Billet : soumission à Odoo et statuts pilotés par Odoo

> Concerne le module Ticketing → page Billet (boutons « Approuver », « Émettre », « Émettre la facture »,
> « Régler la facture »). Contrat backend ↔ Odoo : `ODOO_API_BILLET_V2.md`.

## 1. Ce qui change en résumé

Le front **ne change plus le statut du billet**. Il **envoie le dossier complet à Odoo**, et c'est Odoo qui fait
avancer le statut une fois son traitement fait.

| Bouton | Route (inchangée) | Avant | Maintenant |
|---|---|---|---|
| Approuver | `PUT /billet/:id/a-approuver` | statut → `BC_CLIENT_A_APPROUVER` | **envoie la vente à Odoo**, le statut reste `CREER` |
| Émettre | `PUT /billet/:id/emettre` (`{ referenceBcClient }`) | statut → `BILLET_EMIS` + rappels / miles | **envoie l'achat à Odoo**, le statut reste `BC_CLIENT_A_APPROUVER` |
| Émettre la facture | `PUT /billet/:id/emettre-facture` | statut → `FACTURE_EMISE` | **réservé à Odoo** : bouton à supprimer |
| Régler la facture | `PUT /billet/:id/regler-facture` | statut → `FACTURE_REGLEE` | **réservé à Odoo** : bouton à supprimer |

Les statuts avancent ensuite **côté Odoo** :
- `BC_CLIENT_A_APPROUVER` : Odoo a validé la vente ;
- `BILLET_EMIS` : Odoo a validé l'achat. Les rappels, sondages et miles sont créés à ce moment-là ;
- `FACTURE_EMISE`, puis `FACTURE_REGLEE`.

Les appels du front à `emettre-facture` et `regler-facture` reçoivent maintenant une **401**.

## 2. `PUT /billet/:id/a-approuver` et `PUT /billet/:id/emettre`

Le backend attend **uniquement l'accusé de réception** d'Odoo, au plus environ 10 s, et jamais son traitement.
Pendant ce temps, afficher un chargement et **désactiver le bouton**.

### Succès — 200

```json
{
  "envoi": {
    "id": "...",
    "eventType": "TICKET_SALE_ORDER_SUBMITTED",
    "eventId": "uuid",
    "sequence": 2,
    "statut": "RECU",
    "httpStatus": 200,
    "erreur": null,
    "nombreTentatives": 1,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "billet": { "...": "le billet entête, même format qu'avant" }
}
```

⚠️ **Le format de la réponse change** : le billet est maintenant dans `billet`. Avant, il constituait toute la réponse.

Message conseillé : « Dossier envoyé à Odoo, en attente de validation ».

### Odoo n'a pas accusé réception — 502

```json
{
  "statusCode": 502,
  "message": "Odoo n'a pas accusé réception de l'envoi : timeout of 10000ms exceeded. Vous pouvez renvoyer.",
  "envoi": { "statut": "ECHEC", "erreur": "timeout of 10000ms exceeded", "sequence": 2, "...": "..." }
}
```

Afficher le message et proposer **« Renvoyer »**, qui rappelle la même route. Si le dossier n'a pas changé,
le renvoi garde la même `sequence`.

### Autres erreurs

- **409** :
  - mauvais statut, par exemple « La vente doit d'abord être validée par Odoo avant de demander l'émission » ;
  - lignes pas prêtes : le message liste les lignes à traiter, par exemple `A_30 (CREER)` ;
  - envoi déjà en cours.
- **400** :
  - `referenceBcClient` manquant (pour `emettre`) ;
  - aucun client facturé ou aucun fournisseur rattaché au dossier.

## 3. Afficher l'état des envois

`GET /billet/entete/:id/devis` renvoie maintenant `odooEnvois` : les 10 derniers envois, du plus récent au plus ancien.

```json
"odooEnvois": [
  {
    "id": "...",
    "eventType": "TICKET_SALE_ORDER_SUBMITTED",
    "sequence": 2,
    "statut": "RECU",
    "httpStatus": 200,
    "erreur": null,
    "nombreTentatives": 1,
    "referenceBcClient": null,
    "valideAt": null,
    "odooReference": null,
    "commentaireOdoo": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

- `eventType` vaut `TICKET_SALE_ORDER_SUBMITTED` pour la vente et `TICKET_PURCHASE_ORDER_SUBMITTED` pour l'achat.
- `statut` :
  - `EN_COURS` : envoi en cours ;
  - `RECU` : reçu par Odoo ;
  - `ECHEC` : non reçu, proposer « Renvoyer ».
- `valideAt` est renseigné quand Odoo a validé cet envoi. `odooReference` et `commentaireOdoo` viennent d'Odoo.

Affichage suggéré sur le billet :
- « Vente envoyée à Odoo le … — en attente de validation » ;
- « Vente validée par Odoo (SO-2026-0341) le … ».

## 4. Modification après envoi

Si une ligne est reprogrammée ou annulée après l'envoi :
- la reprogrammation, l'annulation et la modification d'une réservation remettent le billet en `CREER`, à n'importe
  quel statut, même facturé. Voir `FRONTEND_PROMPT_ANNULATION_MODIFICATION_BILLET.md` ;
- il faut **soumettre à nouveau** le dossier (bouton « Approuver ») ;
- le nouvel envoi porte une `sequence` plus grande, et Odoo remplace l'ancienne version.

Une validation d'Odoo sur l'ancienne version est refusée par le backend.

## 5. Autres changements

- La réservation (`PUT /billet/ligne/:id/addreservation`) et l'achat d'une ligne (`PUT /billet/ligne/:id/achat`)
  n'envoient plus rien à Odoo. Ils sont donc plus rapides, et leurs réponses ne changent pas.
- Il ne sert plus à rien de rafraîchir le statut juste après « Approuver » ou « Émettre » : il change plus tard,
  quand Odoo répond. Recharger le billet à l'ouverture de la page, ou proposer un bouton « Actualiser ».
