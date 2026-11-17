# Backend — données manquantes / à corriger (module Ticketing)

Contexte : la page front « Détail de la prospection » affiche désormais, au choix, les prix **Prospection**, **Résa** et **Émission** de chaque ligne (`numeroDosRef`), ainsi que le **taux de change d'émission**.
Le front fonctionne déjà avec l'API actuelle (appels supplémentaires), mais les points ci-dessous sont nécessaires pour des données complètes et cohérentes.

Exemple réel utilisé pour l'analyse : en-tête `DOSTIC_14_1` (id `cmwj63np5002g2xpiyjhpu2rk`), devis `DEV-202611-0028`, billet `BIL-202611-0027`.

---

## 0. [BUG — prioritaire] Commission de résa et d'émission mal calculée

**Constat** : à la résa (et à l'émission), le backend calcule la commission comme **% × prix client**, alors que la commission est **prix client − prix compagnie** (soit % × prix compagnie). La commission est donc surévaluée d'un facteur (1 + %).

### Exemple réel — billet `BIL-202611-0028`, ligne `A_10` / `DOSTIC_15_1_1`, commission appliquée **60 %**

| Donnée | Valeur |
|---|---|
| PU billet compagnie | 1 400 EUR |
| PU service compagnie | 200 EUR |
| Taux prospection / taux résa | 5 000 / 5 100 |
| Prix client billet (résa) | 1 400 × 1,6 = **2 240 EUR** ✅ |
| Prix client service (résa) | 200 × 1,6 = **320 EUR** ✅ |

| Commission | Renvoyé par l'API | Attendu | Écart |
|---|---|---|---|
| Prospection `commissionEnDevise` / `commissionEnAriary` | 960 / 4 800 000 | 960 / 4 800 000 | ✅ |
| Résa `resaCommissionEnDevise` | **1 536** = (2 240 + 320) × 0,6 | **960** = (2 240 − 1 400) + (320 − 200) | +576 EUR |
| Résa `resaCommissionEnAriary` | **7 833 600** | **4 896 000** (960 × 5 100) | +2 937 600 Ar |

Même erreur sur le billet `BIL-202611-0027` (commission 0,05 %) : résa et émission renvoient `0,0950475` (= 190,095 × 0,0005) au lieu de `0,095`, et `emissionCommissionEnAriary = 475,2375` au lieu de `475` (950 000 × 0,0005). L'écart était invisible avec 0,05 %, il devient énorme à 60 %.

### Formule correcte (identique à celle de la prospection)

```ts
const facteur = 1 + commissionAppliquer / 100;          // 60 → 1,6

// Résa (en devise)
const clientBilletHT = puResaMontantBilletCompagnieDevise  * facteur;
const clientService  = puResaMontantServiceCompagnieDevise * facteur;
const clientPenalite = puResaMontantPenaliteCompagnieDevise * facteur;

resaCommissionEnDevise =
    (clientBilletHT - puResaMontantBilletCompagnieDevise)
  + (clientService  - puResaMontantServiceCompagnieDevise)
  + (clientPenalite - puResaMontantPenaliteCompagnieDevise);
// = (Mt billet + service + pénalité compagnie) × commission / 100
resaCommissionEnAriary = resaCommissionEnDevise * resaTauxEchange;

// Émission (en Ariary)
emissionCommissionEnAriary =
    (emissionMontantBilletClientAriary   - emissionMontantBilletCompagnieAriary)
  + (emissionMontantServiceClientAriary  - emissionMontantServiceCompagnieAriary)
  + (emissionMontantPenaliteClientAriary - emissionMontantPenaliteCompagnieAriary);
emissionCommissionEnDevise = emissionCommissionEnAriary / emissionTauxChange;
```

Règles :
- la **taxe ne porte jamais de commission** (elle est reversée telle quelle) ;
- la commission ne doit **jamais** être calculée à partir du prix client.

### À corriger aussi

1. **Recalculer les lignes existantes** (script de migration) : `resaCommissionEnDevise`, `resaCommissionEnAriary`, `emissionCommissionEnDevise`, `emissionCommissionEnAriary`, puis `billetEntete.totalCommission`. Attention : les lignes déjà envoyées à Odoo ont transmis une commission fausse, il faut voir avec l'équipe Odoo s'il faut renvoyer ces dossiers.
2. **`billetEntete.totalCompagnie` et `totalCommission` valent 0** sur les deux billets examinés, alors que les lignes ont des montants : ces totaux ne sont pas calculés.
3. **Taxe absente à la résa** (voir § 3) : sur ce billet, le client paie 2 380 EUR en prospection (taxe de 140 EUR incluse) mais 2 240 EUR à la résa, soit 714 000 Ar de moins à 5 100. À trancher en même temps que ce bug.

### Tests

| Cas | Attendu |
|---|---|
| Commission 60 %, billet 1 400, service 200, taux 5 100 | `resaCommissionEnDevise = 960`, `resaCommissionEnAriary = 4 896 000` |
| Commission 0 % | commission = 0, prix client = prix compagnie |
| Pénalité 100 EUR à 60 % | +60 EUR de commission |
| Émission taux 5 200 sur la même ligne | `emissionCommissionEnAriary = 960 × 5 200 = 4 992 000` (si les prix devise sont inchangés) |

---

## 1. Inclure les lignes billet dans `GET /prospections/entetes/:id`

**Aujourd'hui** : la réponse contient `billetEntete[]` mais **sans** `billetLigne`. Le front doit faire un appel `GET /billet/entete/:devisId/devis` par devis pour retrouver résa / émission.

**Demandé** : inclure dans chaque `billetEntete` la liste `billetLigne` (champs de prix seulement, sans la relation `prospectionLigne` pour éviter la duplication) :

```jsonc
"billetEntete": [
  {
    "id": "cmwj6a7ea003d2xpila7cu3z5",
    "numeroBillet": "BIL-202611-0027",
    "devisId": "cmwj68mo6003b2xpigfenog5c",
    "statut": "FACTURE_EMISE",
    "billetLigne": [
      {
        "id": "cmwj6a7eh003e2xpioyn2fvk2",
        "prospectionLigneId": "cmwj65yo1002h2xpihg5gw57i",   // ← clé de rattachement
        "referenceLine": "A_10",
        "statut": "CLOTURER", "statusLigne": "INITIALE", "etatOdoo": "VALIDE",
        "reservation": "RES123",
        "resaTauxEchange": 4900,
        "puResa…": "…tous les champs puResa* / resaCommission*",
        "emissionTauxChange": 5000,
        "puEmission…": "…tous les champs puEmission* / emissionMontant* / emissionCommission*",
        "billet": [{ "numeroBillet": "TKT-001", "statut": "PLANIFIE" }],
        "createdAt": "…", "updatedAt": "…"
      }
    ]
  }
]
```

Exemple Prisma (à adapter) :

```ts
include: {
  prospectionLigne: { include: { /* inchangé */ } },
  billetEntete: {
    include: {
      billetLigne: {
        include: { billet: { select: { numeroBillet: true, statut: true } } },
      },
    },
  },
}
```

Dès que c'est en place, le front passe ces lignes au hook (`lignesDejaChargees`) et n'effectue plus d'appels supplémentaires.

## 2. Prix d'émission en **devise** (actuellement uniquement en Ariary)

À l'émission, seuls les champs Ariary existent (`puEmissionBilletCompagnieAriary`, `emissionMontantBilletClientAriary`, …). Il manque l'équivalent en devise pour comparer avec la prospection et la résa (qui ont devise + Ariary) :

| Champ à ajouter | Exemple (ligne DOSTIC_14_1_1) |
|---|---|
| `puEmissionBilletCompagnieDevise` | 130 |
| `puEmissionServiceCompagnieDevise` | 60 |
| `puEmissionPenaliteCompagnieDevise` | 0 |
| `emissionMontantBilletCompagnieDevise` / `…ServiceCompagnieDevise` / `…PenaliteCompagnieDevise` | 130 / 60 / 0 |
| `puEmissionBilletClientDevise` / `…ServiceClientDevise` / `…PenaliteClientDevise` | 130,065 / 60,03 / 0 |
| `emissionMontantBilletClientDevise` / `…ServiceClientDevise` / `…PenaliteClientDevise` | idem × nombre |
| `emissionDevise` (si la devise peut changer à l'émission, sinon reprendre `devise`) | EUR |

## 3. Taxe à la résa et à l'émission — règle à confirmer

Constat sur la même ligne :

| Étape | PU billet Cie | Taxe | Mt billet **client** (devise) |
|---|---|---|---|
| Prospection | 130 € | 20 % = 26 € | **156,065 €** (taxe incluse) |
| Résa | 130 € | *aucun champ* | **130,065 €** (taxe absente) |
| Émission | 650 000 Ar | *aucun champ* | 650 325 Ar (taxe absente) |

→ Le prix client chute de 26 € entre la prospection et la résa. Deux possibilités, à trancher :

- **a)** la taxe doit être reprise à la résa et à l'émission → ajouter `resaTauxTaxe`, `resaMontantTaxeDevise`, `resaMontantTaxeAriary`, `emissionMontantTaxeDevise`, `emissionMontantTaxeAriary` et les inclure dans les montants client ;
- **b)** la taxe est volontairement exclue → le documenter, pour que le front l'indique à l'agent.

## 4. Ville de départ sur la ligne de prospection

`GET /prospections/entetes/:id` inclut `destinationVoyage` (ville d'arrivée) mais **pas** la ville de départ (seulement `departId`). Les colonnes « Départ » / « Destination » du tableau s'affichent donc à « — ».

**Demandé** : inclure `departVoyage` (même forme que `destinationVoyage`, avec `ville` et `pays`), ou au minimum `villeDepart` / `villeArrivee` à plat.

## 5. Arrondis des montants

Les montants sont stockés avec des erreurs de virgule flottante :

```
montantServiceClientDevise: 60.029999999999994
commissionEnDevise:          0.09499999999999176
commissionEnAriary:          465.49999999995964
montantBilletClientAriary:   764718.5
```

**Demandé** : arrondir côté backend (Decimal) — 2 décimales pour la devise, 0 décimale pour l'Ariary — à la création de ligne, à la résa et à l'émission.

## 6. N° Dos Ref côté billets (optionnel)

La donnée existe déjà : `billetLigne.prospectionLigne.numeroDosRef` (le front l'affiche maintenant dans le détail du billet). Pour simplifier :

- ajouter `numeroDosRef` à plat sur chaque `billetLigne` (utile si un jour `prospectionLigne` n'est plus incluse) ;
- dans `GET /billet/dossier-commun/:dossierCommunId` (liste des billets), ajouter `numerosDosRef: string[]` par billet pour pouvoir l'afficher/rechercher dans la liste.

## 7. Divers (non bloquant)

- `GET /billet/entete/:id/devis` attend un **devisId** et non un id de billet (le nom de la route prête à confusion ; un id de billet renvoie « BilletEntete avec l'ID devis … non trouvé »). Une route `GET /billet/entete/:billetId` serait plus claire.
- Date d'émission : `achatValideAt` existe ; exposer aussi la date de saisie des prix d'émission (`emissionAt`) permettrait d'afficher « émis le … » à côté du taux.
