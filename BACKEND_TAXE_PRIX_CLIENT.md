# Backend — Taxe dans les prix client (billet ET service), de la prospection à l'émission

Réponse à `FRONTEND_PROMPT_DONNEES_BILLET.md` § 3. La règle métier est **confirmée** (et elle remplace « la taxe est déjà comprise dans le prix compagnie saisi à la résa ») :

> **Le taux de taxe s'applique au billet ET au service.** La taxe est calculée sur les **montants compagnie** (× nombre), elle s'ajoute au prix client **sans commission**, et elle doit être présente à **chaque étape** : prospection, résa, émission.

## 1. Constat (en-tête `DOSTIC_16_1`, ligne `A_10` / `DOSTIC_16_1_1`, devis `cmwkcwclq000s2xlmzcaddj0r`)

Commission 70 %, taux de taxe 10 %, billet compagnie 320 EUR, service compagnie 50 EUR, nombre 1.

| Champ | Prospection (taux 5 000) | Résa (taux 5 100) | Attendu |
|---|---|---|---|
| Billet client (devise) | 576 ✅ | **544** ❌ (taxe absente) | **576** = 320 × 1,7 + 32 |
| Service client (devise) | **85** ❌ | **85** ❌ | **90** = 50 × 1,7 + 5 |
| Billet client (Ar) | 2 880 000 ✅ | **2 774 400** ❌ | prospection 2 880 000 / résa **2 937 600** |
| Service client (Ar) | **425 000** ❌ | **433 500** ❌ | prospection **450 000** / résa **459 000** |
| Taxe totale (devise) | **32** ❌ (billet seul) | — (aucun champ) | **37** = (320 + 50) × 10 % |
| Commission | 259 / 1 295 000 ✅ | 259 / 1 320 900 ✅ | inchangée (pas de commission sur la taxe) |
| `totalCompagnie` / `totalCommission` | | 1 887 000 / 1 320 900 ✅ | inchangés |

## 2. Formule unique (à appliquer en prospection, résa et émission)

```ts
const facteur = 1 + commissionAppliquer / 100;   // 70 → 1,7
const t       = tauxTaxe / 100;                  // 10 → 0,10

// Montants compagnie (déjà × nombre)
const taxeBillet  = mtBilletCompagnie  * t;
const taxeService = mtServiceCompagnie * t;
const montantTaxe = taxeBillet + taxeService;    // taxe totale de la ligne

const mtBilletClient   = mtBilletCompagnie   * facteur + taxeBillet;
const mtServiceClient  = mtServiceCompagnie  * facteur + taxeService;
const mtPenaliteClient = mtPenaliteCompagnie * facteur;          // pas de taxe sur la pénalité

const commission = (mtBilletCompagnie + mtServiceCompagnie + mtPenaliteCompagnie) * (facteur - 1);
// en Ariary : × taux de l'étape (tauxEchange / resaTauxEchange / emissionTauxChange)
```

Les PU client suivent la même formule avec les PU compagnie.

## 3. Ce que le backend doit changer

### 3.1 Prospection (`POST /prospections/lignes`, `PUT /prospections/entetes/:id` quand la commission change)

Le front envoie désormais (déjà en place) :
- `montantServiceClientDevise` / `montantServiceClientAriary` **avec** la taxe service ;
- `montantTaxeDevise` / `montantTaxeAriary` = **taxe totale de la ligne** (billet + service, × nombre).
  Jusqu'ici, c'était la taxe sur **1 billet** seulement.

Si le backend recalcule ces montants (par exemple au changement de commission sur l'en-tête), il doit utiliser la formule du § 2.

### 3.2 Résa (`PUT /billet/ligne/:id/addreservation`, reprogrammation, mise à jour de résa)

- Reprendre `tauxTaxe` de la ligne de prospection (la saisie de résa n'a pas de champ taxe).
- Calculer `puResaBilletClient…`, `puResaServiceClient…`, `puResaMontantBilletClient…` et `puResaMontantServiceClient…` (devise et Ariary) avec la taxe.
- **Nouveaux champs** sur `billetLigne` :

| Champ | Type | Exemple (A_10) |
|---|---|---|
| `resaTauxTaxe` | number | 10 |
| `resaMontantTaxeDevise` | number | 37 |
| `resaMontantTaxeAriary` | number | 188 700 (= 37 × 5 100) |

### 3.3 Émission (`PUT /billet/ligne/:id/achat`)

- Prix client Ariary d'émission (`puEmission…ClientAriary`, `emissionMontant…ClientAriary`) avec la taxe billet et service.
- **Nouveau champ** : `emissionMontantTaxeAriary` (= taxe en devise de la résa × `emissionTauxChange`).

### 3.4 Envoi à Odoo

Les prix client envoyés dans `TICKET_SALE_ORDER_SUBMITTED` et `TICKET_PURCHASE_ORDER_SUBMITTED` doivent inclure la taxe. Ajouter aussi `tauxTaxe` et `montantTaxe` (devise et Ariary) par ligne, si le contrat Odoo le permet.

### 3.5 Données existantes

Script de correction pour :
- `prospectionLigne` : `montantServiceClient*` et `montantTaxe*` ;
- `billetLigne` : prix client de résa et d'émission, nouveaux champs de taxe.

La commission et `totalCompagnie` / `totalCommission` ne changent pas, puisque la taxe n'a pas de commission. Les dossiers déjà envoyés à Odoo ont transmis des prix client sans taxe sur le service : il faut voir avec l'équipe Odoo s'il faut les renvoyer.

## 4. Tests

| Cas | Attendu |
|---|---|
| 70 %, taxe 10 %, billet 320, service 50, nombre 1, taux 5 100 (résa) | billet client 576 / 2 937 600 Ar ; service client 90 / 459 000 Ar ; taxe 37 / 188 700 Ar ; commission 259 / 1 320 900 Ar |
| Même ligne, nombre 2 | tous les montants × 2 (taxe 74) |
| Taxe 0 % | prix client = prix compagnie × facteur |
| Pénalité 100 EUR | client 170 EUR, pas de taxe |
| Émission au taux 5 200 | billet client 576 × 5 200 = 2 995 200 Ar ; service 90 × 5 200 = 468 000 Ar |
