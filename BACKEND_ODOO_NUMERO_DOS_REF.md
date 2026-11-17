# Backend — Envoyer le N° Dos / N° Dos Ref à Odoo (en-tête + chaque ligne)

## Objectif

L'équipe Odoo a besoin de retrouver, dans chaque envoi de billet, les références de dossier utilisées dans l'application :

| Niveau | Référence | Exemple réel |
|---|---|---|
| Dossier (prestation ticketing) | **N° Dos** | `DOSTIC_14` |
| En-tête de prospection (compagnie) | **N° Dos Ref de l'en-tête** | `DOSTIC_14_1` |
| Ligne | **N° Dos Ref de la ligne** | `DOSTIC_14_1_1`, `DOSTIC_14_1_2` |

Les trois valeurs **existent déjà en base**. Il faut seulement les **ajouter aux payloads envoyés à Odoo**.
Aucune migration n'est nécessaire.

Exemple vérifié sur les données actuelles (billet `BIL-202611-0027`, devis `DEV-202611-0028`) :

| Ligne billet (`referenceLine`) | Vol | `numeroDosRef` à envoyer |
|---|---|---|
| `A_10` | MD-001 | `DOSTIC_14_1_1` |
| `B_10` | MD-002 | `DOSTIC_14_1_2` |

---

## 1. Attributs à ajouter (noms exacts)

Les noms reprennent ceux des colonnes existantes, pour qu'il n'y ait aucune ambiguïté entre l'application, le backend et Odoo.

### 1.1 Au niveau de l'en-tête du payload (le dossier / billet)

| Attribut | Type | Obligatoire | Source (Prisma) | Exemple |
|---|---|---|---|---|
| `numeroDos` | string | oui | `billetEntete.prospectionEntete.prestation.numeroDos` | `"DOSTIC_14"` |
| `numeroEntete` | string | oui | `billetEntete.prospectionEntete.numeroEntete` | `"DOSTIC_14_1"` |

> `numeroEntete` est le « N° Dos Ref de l'en-tête » (c'est ce que l'écran Prospection affiche en badge à côté de la compagnie).

### 1.2 Sur chaque ligne du payload

| Attribut | Type | Obligatoire | Source (Prisma) | Exemple |
|---|---|---|---|---|
| `numeroDosRef` | string | oui | `billetLigne.prospectionLigne.numeroDosRef` | `"DOSTIC_14_1_1"` |

À garder tel quel, à côté : `referenceLine` (`A_10`, `B_10`, …), qui reste la référence technique de la ligne billet.

---

## 2. Où les ajouter

Dans les **deux** événements envoyés à Odoo (contrat `ODOO_API_BILLET_V2.md`) :

| Événement | Déclenché par |
|---|---|
| `TICKET_SALE_ORDER_SUBMITTED` (vente) | `PUT /billet/:id/a-approuver` (« Approuver ») |
| `TICKET_PURCHASE_ORDER_SUBMITTED` (achat) | `PUT /billet/:id/emettre` (« Émettre ») |

Les renvois (« Renvoyer » après un 502) et les nouveaux envois après une reprogrammation ou une annulation (nouvelle `sequence`) doivent aussi les contenir.

### Forme attendue

Les attributs s'ajoutent à la structure existante, **sans renommer ni déplacer** les champs déjà envoyés. Les autres champs ci-dessous sont symbolisés par `"…"`.

```jsonc
{
  "eventType": "TICKET_SALE_ORDER_SUBMITTED",
  "eventId": "…",
  "sequence": 2,
  "…": "…",

  // ── En-tête ──
  "numeroBillet": "BIL-202611-0027",
  "numeroDos": "DOSTIC_14",          // ← NOUVEAU
  "numeroEntete": "DOSTIC_14_1",     // ← NOUVEAU (N° Dos Ref de l'en-tête)

  "lignes": [
    {
      "referenceLine": "A_10",
      "numeroDosRef": "DOSTIC_14_1_1", // ← NOUVEAU
      "…": "…"
    },
    {
      "referenceLine": "B_10",
      "numeroDosRef": "DOSTIC_14_1_2", // ← NOUVEAU
      "…": "…"
    }
  ]
}
```

> Si, dans le contrat actuel, l'en-tête est dans un sous-objet (par exemple `billet`, `dossier` ou `order`) ou si les lignes portent un autre nom que `lignes`, ajouter les attributs **dans ces objets-là**. Ce qui compte, ce sont les noms exacts des attributs et leur niveau (en-tête ou ligne).

### Données à charger

La requête qui construit le payload doit inclure les relations suivantes (à fusionner avec l'`include` existant) :

```ts
include: {
  prospectionEntete: {
    select: {
      numeroEntete: true,
      prestation: { select: { numeroDos: true } },
    },
  },
  billetLigne: {
    include: {
      prospectionLigne: { select: { numeroDosRef: true } },
    },
  },
}
```

Puis, au moment de construire le payload :

```ts
numeroDos: billet.prospectionEntete?.prestation?.numeroDos ?? null,
numeroEntete: billet.prospectionEntete?.numeroEntete ?? null,
// pour chaque ligne :
numeroDosRef: ligne.prospectionLigne?.numeroDosRef ?? null,
```

---

## 3. Règles

1. **Toutes les lignes envoyées** portent `numeroDosRef`, y compris :
   - les lignes reprogrammées (nouvelle ligne billet) : même `numeroDosRef` que la ligne d'origine, puisqu'elles pointent vers la même ligne de prospection ;
   - les lignes de frais d'annulation (`statusLigne = ANNULATION`, ex. `X_20`) : `numeroDosRef` de la ligne annulée ;
   - les lignes annulées encore envoyées pour information.
2. **Plusieurs lignes peuvent avoir le même `numeroDosRef`** (reprogrammation, frais). La clé unique d'une ligne pour Odoo reste `referenceLine` ; `numeroDosRef` sert au rattachement au dossier. Il faut le dire à l'équipe Odoo.
3. **Valeur absente** : si une donnée ancienne n'a pas de valeur, envoyer `null` (ne pas omettre l'attribut) et écrire un avertissement dans les logs. Ne pas bloquer l'envoi.
4. **Format** : chaîne envoyée telle qu'elle est stockée (majuscules, underscores), sans espace ni transformation.

---

## 4. Retours d'Odoo (optionnel, recommandé)

Dans les validations ou rejets renvoyés par Odoo (ligne par ligne), demander à Odoo de **renvoyer `numeroDosRef`** à côté de `referenceLine`. Cela permet de vérifier la correspondance côté backend et facilite le support.

## 5. API de l'application (pour l'affichage)

Pour que le front n'ait plus à lire `prospectionLigne.numeroDosRef` dans les relations, ajouter aussi les attributs à plat dans :

| Route | Attribut à ajouter |
|---|---|
| `GET /billet/entete/:devisId/devis` | `numeroDos`, `numeroEntete` sur le billet ; `numeroDosRef` sur chaque `billetLigne` |
| `GET /billet/dossier-commun/:dossierCommunId` | `numeroDos`, `numeroEntete` sur chaque billet |

(Les objets imbriqués actuels restent inchangés : pas de rupture pour le front.)

---

## 6. Tests à faire

1. « Approuver » le billet `BIL-202611-0027` → le payload `TICKET_SALE_ORDER_SUBMITTED` contient `numeroDos = DOSTIC_14`, `numeroEntete = DOSTIC_14_1`, et `A_10 → DOSTIC_14_1_1`, `B_10 → DOSTIC_14_1_2`.
2. « Émettre » → mêmes valeurs dans `TICKET_PURCHASE_ORDER_SUBMITTED`.
3. Reprogrammer une ligne puis ré-approuver → la nouvelle ligne porte le même `numeroDosRef` que l'ancienne, et la `sequence` augmente.
4. Annuler une ligne avec frais → la ligne de frais porte le `numeroDosRef` de la ligne annulée.
5. Simuler une ligne sans `prospectionLigne` → `numeroDosRef: null`, l'envoi part quand même, avec un avertissement dans les logs.
