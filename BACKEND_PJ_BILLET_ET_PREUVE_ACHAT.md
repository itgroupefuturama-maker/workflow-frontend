# Backend — Achat (émission) : e-billet ET preuve d'achat, avec historique des fichiers

## Besoin

À l'achat d'une ligne (`PUT /billet/ligne/:id/achat`), le front envoie aujourd'hui **un fichier PDF par passager** (`pjBillets`), enregistré dans `billet.pjBillet`. On ne sait pas si c'est le billet ou la preuve de l'achat.

On veut **deux pièces distinctes** et **garder la trace** de tous les fichiers envoyés (y compris ceux qui ont été remplacés lors d'une correction) :

| Pièce | Rôle | Niveau | Champ |
|---|---|---|---|
| **E-billet compagnie** | Billet électronique émis par la compagnie pour un passager | **par passager** (`Billet`) | `pjBillet` (existant, sens précisé) |
| **Preuve d'achat** | Justificatif du paiement à la compagnie (reçu, facture, capture du paiement BSP / carte) | **par ligne billet** (un achat pour tous les passagers de la ligne) | `preuveAchat` (**nouveau**) |

> Si la compagnie fournit une preuve par passager, le contrat peut être étendu ; par défaut, on considère un achat par ligne.

## 1. Base de données

### 1.1 Nouveau champ

| Table | Colonne | Type | Null |
|---|---|---|---|
| `BilletLigne` | `preuveAchat` | `String` | oui (anciennes lignes) |

### 1.2 Historique des pièces jointes (trace)

Nouvelle table `BilletPieceJointe` : une ligne **par fichier reçu**, jamais supprimée.

| Colonne | Type | Remarque |
|---|---|---|
| `id` | cuid | |
| `billetLigneId` | String | ligne billet concernée |
| `billetId` | String? | passager concerné (null pour une preuve d'achat de ligne) |
| `type` | enum `E_BILLET` \| `PREUVE_ACHAT` \| `PREUVE_RESA` \| `PREUVE_ACCEPTATION_CLIENT` | |
| `chemin` | String | ex. `uploads/billets/billet-…pdf` |
| `nomOriginal` | String | nom du fichier envoyé par l'agent |
| `tailleOctets` | Int | |
| `actif` | Boolean | `true` = fichier en vigueur ; `false` = remplacé |
| `remplaceParId` | String? | fichier qui l'a remplacé |
| `creeParId` | String | utilisateur connecté |
| `createdAt` | DateTime | |

Règle : quand un fichier remplace l'ancien (correction des numéros, nouvelle résa…), l'ancien passe `actif = false` mais **le fichier reste sur le disque**. Les champs `pjBillet`, `preuveAchat`, `preuveResa` et `preuveAcceptationClient` continuent de pointer vers le fichier **actif** (compatibilité).

## 2. `PUT /billet/ligne/:id/achat` (multipart/form-data)

| Champ du formulaire | Contenu | Obligatoire |
|---|---|---|
| `emissionTauxChange` | taux d'émission | oui (inchangé) |
| `billets` | JSON `[{ billetId, numeroBillet }]` | oui (inchangé) |
| `pjBillets` | 1 PDF par passager, **même ordre** que `billets` = e-billet compagnie | oui à la 1re émission (inchangé) |
| `preuveAchat` | 1 fichier pour la ligne | **oui à la 1re émission**, optionnel en correction (absent = on garde l'existant) |

- Formats `preuveAchat` : PDF, PNG, JPG, WEBP — **5 Mo max**.
- Messages d'erreur (affichés tels quels par le front) :
  - « La preuve d'achat est obligatoire »
  - « La preuve d'achat doit être un PDF ou une image PNG, JPG, WEBP »
  - « La preuve d'achat dépasse 5 Mo »
- Tout ou rien : en cas d'erreur, rien n'est enregistré (ni numéros, ni fichiers).
- Chaque fichier reçu (e-billets et preuve d'achat) crée une ligne dans `BilletPieceJointe`.

## 3. Lecture

- `billetLigne.preuveAchat` renvoyé partout où `preuveResa` l'est (`GET /billet/entete/:devisId/devis`, `GET /billet/entete/:id`, `GET /prospections/entetes/:id`).
- Nouvelle route **historique** :

```
GET /billet/ligne/:id/pieces-jointes
200 : [
  { "id": "…", "type": "E_BILLET", "billetId": "…", "chemin": "uploads/billets/…pdf", "nomOriginal": "TKT-001.pdf",
    "tailleOctets": 182334, "actif": true, "creePar": { "nom": "…", "prenom": "…" }, "createdAt": "…" },
  { "id": "…", "type": "PREUVE_ACHAT", "billetId": null, "actif": false, "remplaceParId": "…", … }
]
```
(tri : plus récent d'abord)

## 4. Reprogrammation / annulation

- Reprogrammation : la nouvelle ligne n'a **pas** encore d'e-billet ni de preuve d'achat (nouvel achat à faire) ; l'historique de l'ancienne ligne reste consultable.
- Annulation : les fichiers et l'historique sont conservés.

## 5. Odoo

Dans `TICKET_PURCHASE_ORDER_SUBMITTED`, transmettre l'URL de la **preuve d'achat** de chaque ligne (et des e-billets si le contrat le prévoit).

## 6. Côté front (pour information)

- Fenêtre d'achat : nouveau champ « Preuve d'achat » (un par ligne) en plus de « E-billet compagnie (PDF) » par passager (libellé déjà clarifié).
- Tableau des lignes : colonne Preuves = Devis client · Accept. client · N° résa · **Preuve d'achat** ; e-billet accessible sur chaque passager.
- Les boutons « Aperçu / Générer le billet agence » ne sont actifs qu'après l'émission et si la pièce d'identité du passager est jointe (déjà en place).
- Un historique des pièces jointes par ligne pourra être affiché grâce à la route du § 3.

## 7. Tests

| Cas | Attendu |
|---|---|
| 1re émission avec e-billets + preuve d'achat | 200 ; `preuveAchat` renvoyé ; 3 entrées `BilletPieceJointe` pour 2 passagers |
| 1re émission sans preuve d'achat | 400 « La preuve d'achat est obligatoire » ; rien n'est enregistré |
| Correction des numéros avec un nouvel e-billet pour 1 passager | l'ancien e-billet passe `actif = false`, le nouveau est actif ; preuve d'achat inchangée |
| Fichier de 8 Mo | 400, rien n'est enregistré |
| `GET /billet/ligne/:id/pieces-jointes` | liste complète, fichiers remplacés compris |
