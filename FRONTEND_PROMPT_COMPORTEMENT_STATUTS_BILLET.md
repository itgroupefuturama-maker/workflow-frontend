# Prompt frontend — Billet : statuts, état Odoo et boutons

> Concerne le module Ticketing → page Billet : `BilletTable.tsx`, les boutons du dossier (Approuver, Émettre), les
> boutons de chaque ligne (Réservation, Achat, Modifier, Annuler), les modals et les notifications.
>
> Ce document regroupe **toutes les règles du backend**. Le front masque ou désactive un bouton quand le backend le
> refuserait, et explique pourquoi (infobulle ou message). En cas de refus du backend, afficher son `message` tel
> quel : il cite les lignes à traiter.
>
> Détail des payloads :
> - `FRONTEND_PROMPT_MODIFICATION_RESERVATION_PASSAGERS.md` (mise à jour de la réservation) ;
> - `FRONTEND_PROMPT_REPROGRAMMATION_FRAIS.md` (modification avec conditions) ;
> - `FRONTEND_PROMPT_ANNULATION_MODIFICATION_BILLET.md` (annulation) ;
> - `FRONTEND_PROMPT_NOTIFICATIONS_ODOO_BILLET.md` (notifications ; compléments au §9 ci-dessous).

---

## 0. Ce qui change

| Avant | Maintenant |
|---|---|
| Statuts `statut` / `statusLigne` | **Inchangés** (mêmes valeurs, même sens) |
| On ne savait pas si Odoo avait répondu | Nouveau champ **`etatOdoo`** sur chaque ligne et sur l'entête : `AUCUN`, `ENVOYE`, `VALIDE`, `REJETE` |
| Odoo ne pouvait pas refuser | Odoo peut **rejeter une ligne avec un motif** (`motifRejet`) |
| Odoo validait tout le dossier d'un coup | Odoo répond **ligne par ligne** |
| On pouvait modifier une ligne pendant qu'Odoo la traitait | Une ligne **en attente d'Odoo est verrouillée** (aucune action) |
| Saisie des numéros de billet possible avant la validation de la vente | Seulement **après** la validation de la vente de la ligne |
| Ligne de frais `X_20` créée en `CLOTURER` | Créée en `FAIT`, passe `CLOTURER` **automatiquement** quand Odoo valide sa vente |
| Annulation sans frais : pas de `X_20` | `X_20` à 0 créée si la ligne annulée était déjà connue d'Odoo |
| Toutes les lignes annulées : dossier reste `CREER` | Dossier **`ANNULER`** |
| Nouveaux champs | `resumeLignes` sur l'entête (§7), `odooSaleId`, `odooPurchaseId`, `motifRejet`, `rejeteAt` sur la ligne |

---

## 1. Les champs

### 1.1 Ligne — `billetLigne`

| Champ | Valeurs |
|---|---|
| `statut` | `CREER` (à réserver), `FAIT` (réservée), `CLOTURER` (numéros de billet saisis), `ANNULER` (annulée ou remplacée). `MODIFIER` : anciennes données, traiter comme `ANNULER` |
| `statusLigne` | `INITIALE` (`X_10`), `MODIFIER` (reprogrammation, `X_30`+), `ANNULATION` (frais d'annulation, `X_20`), `ANNULER` (annulée) |
| `etatOdoo` | Réponse d'Odoo **à l'étape en cours** : la vente si `FAIT`, l'achat si `CLOTURER`. `AUCUN` (rien d'envoyé), `ENVOYE` (en attente), `VALIDE`, `REJETE` |
| `motifRejet`, `rejeteAt` | Dernier rejet d'Odoo |
| `odooSaleId`, `odooPurchaseId` | Ids Odoo (affichage) |

Quand le `statut` change, `etatOdoo` repart à `AUCUN`.

### 1.2 Lecture d'une ligne (badge)

| `statut` \ `etatOdoo` | `AUCUN` | `ENVOYE` | `VALIDE` | `REJETE` |
|---|---|---|---|---|
| `CREER` | À réserver | — | — | — |
| `FAIT` | Réservée, à approuver | Vente en attente d'Odoo | Vente validée, numéros à saisir | **Vente rejetée** + motif |
| `CLOTURER` | À émettre | Achat en attente d'Odoo | **Émise** | **Achat rejeté** + motif |
| `ANNULER` | Annulée (barrée) | — | — | — |

### 1.3 Entête — `billetEntete`

| Champ | Valeurs |
|---|---|
| `statut` | `CREER`, `BC_CLIENT_A_APPROUVER`, `BILLET_EMIS`, `FACTURE_EMISE`, `FACTURE_REGLEE`, `ANNULER` — **calculé par le backend** |
| `etatOdoo` | `REJETE` si une ligne est rejetée, sinon `ENVOYE` si une ligne attend Odoo, sinon `VALIDE` si toutes les lignes actives sont validées, sinon `AUCUN` |
| `resumeLignes` | Compteurs par case du tableau §1.2 (§7) |

| `statut` \ `etatOdoo` | `AUCUN` | `ENVOYE` | `VALIDE` | `REJETE` |
|---|---|---|---|---|
| `CREER` | À réserver ou à approuver | Vente en attente d'Odoo | — | **Vente rejetée, à corriger** |
| `BC_CLIENT_A_APPROUVER` | Numéros à saisir ou à émettre | Achat en attente d'Odoo | Vente validée | **Achat rejeté, à corriger** |
| `BILLET_EMIS`, `FACTURE_EMISE`, `FACTURE_REGLEE` | — | — | Terminé | — |
| `ANNULER` | Annulé | — | — | — |

Le front n'écrit jamais `statut` ni `etatOdoo`. « Émettre la facture » et « Régler la facture » ne sont pas des
boutons : c'est Odoo qui les déclenche.

---

## 2. Le parcours normal

```
Ligne :  CREER ─(Réserver)─► FAIT/AUCUN ─(Approuver)─► FAIT/ENVOYE ─(Odoo)─► FAIT/VALIDE
         ─(Saisir les numéros)─► CLOTURER/AUCUN ─(Émettre)─► CLOTURER/ENVOYE ─(Odoo)─► CLOTURER/VALIDE

Entête : CREER ─► BC_CLIENT_A_APPROUVER (toutes les ventes validées) ─► BILLET_EMIS (tout émis)
         ─► FACTURE_EMISE ─► FACTURE_REGLEE (Odoo)
```

---

## 3. Boutons du dossier

« Lignes actives » = lignes dont le `statut` n'est ni `ANNULER` ni `MODIFIER`.

### 3.1 « Approuver » — `PUT /billet/:id/a-approuver`

Actif si :
- `entete.statut !== 'ANNULER'` ;
- aucune ligne active en `CREER` (sinon : « Réservez d'abord toutes les lignes : A_10 (à réserver) ») ;
- au moins une ligne `FAIT` avec `etatOdoo` `AUCUN` ou `REJETE`.

Un clic peut produire plusieurs envois (création, modification, annulation) : la réponse contient `envois[]`.

### 3.2 « Émettre » — `PUT /billet/:id/emettre`

Actif si :
- toutes les lignes actives sont `CLOTURER` (sinon : « Toutes les lignes doivent avoir leurs numéros de billet
  saisis… », avec la liste) ;
- au moins une ligne `CLOTURER` avec `etatOdoo` `AUCUN` ou `REJETE` ;
- la référence BC client est saisie (obligatoire dans la modal).

### 3.3 Réponse `502` à Approuver / Émettre

Odoo n'a pas accusé réception : les lignes sont revenues à leur `etatOdoo` d'avant. Afficher le `message` et
laisser le bouton actif pour renvoyer.

### 3.4 Dossier `ANNULER`

Aucun bouton, ni sur le dossier ni sur les lignes.

---

## 4. Boutons d'une ligne

| Ligne | Réserver / Mettre à jour la réservation | Saisir les numéros (Achat) | Modifier avec conditions | Annuler |
|---|---|---|---|---|
| `etatOdoo = ENVOYE` (toute ligne) | ❌ « En attente de la réponse d'Odoo » | ❌ | ❌ | ❌ |
| `CREER` | ✅ « Réserver » | ❌ | ✅ | ✅ |
| `FAIT` / `AUCUN` | ✅ | ❌ « La vente doit d'abord être validée par Odoo » | ✅ | ✅ |
| `FAIT` / `REJETE` | ✅ (corriger) | ❌ | ✅ | ✅ |
| `FAIT` / `VALIDE` | ✅ (la ligne repart à Odoo en modification) | ✅ | ✅ | ✅ |
| `CLOTURER` / `AUCUN` ou `REJETE` | ❌ | ✅ (corriger les numéros) | ✅ | ✅ |
| `CLOTURER` / `VALIDE` (émise) | ❌ | ❌ | ✅ | ✅ |
| Ligne de frais (`statusLigne = ANNULATION`) | ❌ | ❌ | ❌ | ❌ |
| `ANNULER` / `MODIFIER` | ❌ | ❌ | ❌ | ❌ |

Routes :
- Réservation : `PUT /billet/ligne/:id/addreservation`
- Saisie des numéros : `PUT /billet/ligne/:id/achat`
- Modification avec conditions : `PATCH /billet/:id/reprogrammer`
- Annulation : `POST /billet/:id/annuler`

---

## 5. Le bouton « Modifier » : deux choix

```
┌─────────────────────────── Modifier la ligne A_10 ───────────────────────────┐
│  ○ Mettre à jour la réservation                                               │
│    Corriger passagers, prix, PNR, pièce jointe. A_10 reste A_10.              │
│    Possible tant que les numéros de billet ne sont pas saisis.                │
│                                                                               │
│  ○ Modifier avec conditions (reprogrammation)                                 │
│    Changement de date, de vol ou de classe, avec frais éventuels.             │
│    A_10 est annulée et remplacée par une nouvelle ligne A_30.                 │
│                                          [Annuler]   [Continuer]              │
└───────────────────────────────────────────────────────────────────────────────┘
```

| Ligne | Mettre à jour la réservation | Modifier avec conditions |
|---|---|---|
| `FAIT` (hors `ENVOYE`) | ✅ | ✅ |
| `CLOTURER` (hors `ENVOYE`) | ❌ « Numéros de billet déjà saisis : utilisez la modification avec conditions » | ✅ (ouvrir directement le formulaire) |

Après une mise à jour de la réservation : la ligne repasse `FAIT` / `AUCUN`, à renvoyer avec **Approuver**. Si sa
vente était déjà validée, Odoo reçoit une mise à jour de son BC.

Après une reprogrammation : l'ancienne ligne passe `ANNULER` ; la nouvelle (`A_30`, puis `A_40`…) est créée
réservée. Les autres lignes gardent leur état. Le dossier repasse en `CREER` jusqu'à la validation de la nouvelle
ligne.

Message de confirmation si le dossier n'est pas `CREER` :
> « Après cette modification, la ligne devra être renvoyée à Odoo (Approuver, puis Émettre). Continuer ? »

---

## 6. Annulation et ligne de frais `X_20`

- La ligne annulée passe `ANNULER`.
- Une ligne de frais `X_20` est créée (`FAIT` / `AUCUN`, `statusLigne = ANNULATION`) :
  - si l'annulation a des frais (pénalité, commission) ;
  - ou si la ligne annulée était déjà connue d'Odoo, même sans frais (montants à 0).
- `X_20` est **toujours en lecture seule**. Elle part avec **Approuver** ; quand Odoo valide sa vente, elle passe
  `CLOTURER` / `AUCUN` toute seule (pas de numéro de billet), puis part avec **Émettre**.
- Si toutes les lignes du dossier sont annulées (et aucune ligne de frais), le dossier passe `ANNULER`.

---

## 7. Résumé des lignes — `resumeLignes`

Renvoyé par `GET /billet/entete/:id`, `GET /billet/entete/:id/devis`, `GET /billet/entete` et
`GET /billet/dossier-commun/:dossierCommunId` :

```json
"resumeLignes": {
  "total": 4,
  "aReserver": 0,
  "aApprouver": 0,
  "venteEnAttente": 1,
  "venteRejetee": 1,
  "aSaisir": 0,
  "aEmettre": 0,
  "achatEnAttente": 0,
  "achatRejete": 0,
  "emises": 1,
  "annulees": 1
}
```

Affichage proposé sous le statut du dossier, en ne montrant que les compteurs non nuls :
> « 1 vente rejetée · 1 en attente d'Odoo · 1 émise »

---

## 8. Rejet par Odoo

- Badge rouge sur la ligne : « Vente rejetée » ou « Achat rejeté », avec `motifRejet` et `rejeteAt`.
- Badge sur le dossier quand `entete.etatOdoo === 'REJETE'` : « À corriger ».
- Actions possibles sur la ligne rejetée :
  - corriger (Mettre à jour la réservation, ou ressaisir les numéros pour un achat rejeté), puis Approuver / Émettre ;
  - renvoyer telle quelle (Approuver / Émettre) ;
  - modifier avec conditions, ou annuler.

---

## 9. Notifications et socket

Nouveaux types de notification : `BILLET_VENTE_REJETEE`, `BILLET_ACHAT_REJETE` (en plus de `BILLET_VENTE_VALIDEE`,
`BILLET_ACHAT_VALIDE`, `BILLET_FACTURE_EMISE`, `BILLET_FACTURE_REGLEE`).

Dans `data` :
- `etatOdoo` : `etatOdoo` de l'entête après la réponse ;
- `lignes[]` : lignes concernées par la réponse d'Odoo (`[]` pour facture et règlement) :

```json
{
  "billetLigneId": "string",
  "referenceLigne": "A_30",
  "decision": "VALIDE | REJETE",
  "statut": "FAIT",
  "etatOdoo": "REJETE",
  "motif": "Tarif non conforme au contrat client",
  "odooSaleId": "1542",
  "odooPurchaseId": null
}
```

Socket `billet:statut` : `{ billetEnteteId, ancienStatut, nouveauStatut, etatOdoo, type }`. À la réception,
recharger le billet ouvert.

---

## 10. Filtres de la liste des lignes — `GET /billet/ligne`

| Paramètre | Valeurs |
|---|---|
| `statut` | `CREER`, `FAIT`, `CLOTURER`, `ANNULER`… |
| `statusLigne` | `INITIALE`, `MODIFIER`, `ANNULER`, `ANNULATION` |
| `etatOdoo` | `AUCUN`, `ENVOYE`, `VALIDE`, `REJETE` (nouveau) |

Exemple : lignes rejetées par Odoo → `?etatOdoo=REJETE`.

---

## 11. Récapitulatif pour coder les conditions

```ts
const estTerminee = (l) => l.statut === 'ANNULER' || l.statut === 'MODIFIER';
const estLigneFrais = (l) => l.statusLigne === 'ANNULATION';
const enAttente = (l) => l.etatOdoo === 'ENVOYE';
const actives = lignes.filter((l) => !estTerminee(l));
const dossierAnnule = entete.statut === 'ANNULER';

// Dossier
const peutApprouver =
  !dossierAnnule &&
  !actives.some((l) => l.statut === 'CREER') &&
  actives.some((l) => l.statut === 'FAIT' && ['AUCUN', 'REJETE'].includes(l.etatOdoo));

const peutEmettre =
  !dossierAnnule &&
  actives.length > 0 &&
  actives.every((l) => l.statut === 'CLOTURER') &&
  actives.some((l) => ['AUCUN', 'REJETE'].includes(l.etatOdoo));

// Ligne
const lectureSeule = (l) => dossierAnnule || estTerminee(l) || estLigneFrais(l) || enAttente(l);

const peutReserver = (l) => !lectureSeule(l) && (l.statut === 'CREER' || l.statut === 'FAIT');
const peutSaisirNumeros = (l) =>
  !lectureSeule(l) &&
  ((l.statut === 'FAIT' && l.etatOdoo === 'VALIDE') ||
    (l.statut === 'CLOTURER' && l.etatOdoo !== 'VALIDE'));
const peutReprogrammer = (l) => !lectureSeule(l);
const peutAnnuler = (l) => !lectureSeule(l);
```
