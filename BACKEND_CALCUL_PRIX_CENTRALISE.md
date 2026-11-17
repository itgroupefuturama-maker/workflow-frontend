# Backend — Centraliser le calcul des prix ticketing dans le backend

## 1. Pourquoi

Aujourd'hui, les prix d'une ligne sont calculés à **plusieurs endroits** :

| Étape | Qui calcule | Où |
|---|---|---|
| Prospection | **front** (3 copies du même calcul) | `Prospection.tsx`, saisie en ligne, saisie détaillée |
| Résa | backend | `PUT /billet/ligne/:id/addreservation` |
| Émission | backend | `PUT /billet/ligne/:id/achat` |
| Changement de commission | backend | `PUT /prospections/entetes/:id` |

Le front envoie ses montants calculés (`montantBilletClientDevise`, `commissionEnDevise`…) et le backend les **enregistre tels quels**.

Conséquences déjà constatées :
- **Commission de résa et d'émission fausse** (% × prix client au lieu de % × prix compagnie), alors que la prospection était juste. Voir `BACKEND_DONNEES_MANQUANTES.md` § 0.
- **Taxe présente en prospection mais absente en résa**, et taxe jamais appliquée au service. Voir `BACKEND_TAXE_PRIX_CLIENT.md`.
- **Aucune garantie** sur les montants enregistrés : un appel API peut envoyer n'importe quelle commission ou n'importe quel prix client, et ce sont ces montants qui partent ensuite à **Odoo**.

**Décision** : le backend devient la **seule source de vérité** pour tous les montants calculés. Le front n'envoie que les **saisies de l'agent**, et il affiche ce que l'API renvoie.

## 2. Principe

```
Front  ──(saisies uniquement)──▶  Backend : calcule + arrondit + enregistre  ──▶  réponse = ligne complète
                                                     │
                                                     └──▶ Odoo (mêmes montants)
```

- **Une seule fonction de calcul** côté backend (par exemple `calculerPrixLigne()`), utilisée par la prospection, la résa, l'émission, la reprogrammation, le changement de commission et les scripts de correction.
- Les montants calculés envoyés par le front sont **ignorés**.

## 3. Contrat par route

### 3.1 `POST /prospections/lignes` — création d'une ligne de prospection

**Champs acceptés** (saisies de l'agent) :

| Champ | Type | Remarque |
|---|---|---|
| `prospectionEnteteId` | string | la commission est lue sur l'en-tête (`commissionAppliquer`) |
| `departId`, `destinationId`, `numeroVol`, `avion`, `itineraire`, `classe`, `typePassager` | | inchangés |
| `dateHeureDepart`, `dateHeureArrive`, `dureeVol`, `dureeEscale`, `aeroportDepart`, `aeroportArrivee` | | inchangés |
| `devise` | string | |
| `tauxEchange` | number | |
| `nombre` | number | ≥ 1 |
| `puBilletCompagnieDevise` | number | saisi |
| `puServiceCompagnieDevise` | number | saisi |
| `puPenaliteCompagnieDevise` | number | saisi (0 par défaut) |
| `tauxTaxe` | number | en %. Si l'agent saisit un montant de taxe, le front le convertit en taux avant l'envoi : `tauxTaxe = montant pour 1 billet / puBilletCompagnieDevise × 100` |
| `modePaiement`, `services[]` | | inchangés |

**Champs calculés par le backend** (ignorés s'ils sont envoyés) :
`puBilletCompagnieAriary`, `puServiceCompagnieAriary`, `puPenaliteCompagnieAriary`,
`montant{Billet,Service,Penalite}Compagnie{Devise,Ariary}`,
`montant{Billet,Service,Penalite}Client{Devise,Ariary}`,
`montantTaxeDevise`, `montantTaxeAriary`, `commissionEnDevise`, `commissionEnAriary`.

**Réponse** : la ligne complète, avec tous les montants calculés (même forme que dans `GET /prospections/entetes/:id`).

### 3.2 `PUT /prospections/entetes/:id` — changement de commission

Recalculer **toutes les lignes** de l'en-tête avec la fonction unique, plus les lignes billet liées qui ne sont pas encore émises (si c'est bien la règle métier).

### 3.3 `PUT /billet/ligne/:id/addreservation` — résa (et mise à jour de résa)

**Champs acceptés** : `passagers`, `nombre`, `reservation`, `devise`, `resaTauxEchange`,
`puResaBilletCompagnieDevise`, `puResaServiceCompagnieDevise`, `puResaPenaliteCompagnieDevise`,
`conditionModif`, `conditionAnnul`, `preuveResa`.
Optionnel : `resaTauxTaxe` (par défaut, `tauxTaxe` de la ligne de prospection).

**Champs calculés par le backend** (ignorés s'ils sont envoyés) :
`puResaMontant{Billet,Service,Penalite}CompagnieDevise` (aujourd'hui envoyés par le front), toutes les valeurs `…Ariary`, tous les prix client, `resaMontantTaxe{Devise,Ariary}`, `resaCommissionEn{Devise,Ariary}`.

### 3.4 `PATCH /billet/:id/reprogrammer`

Même règle : le front envoie les PU compagnie, `resaTauxEchange`, la classe, les dates, les passagers, les services et les `frais`. Le backend calcule `puResaMontant…`, les prix client, la taxe et la commission.

### 3.5 `PUT /billet/ligne/:id/achat` — émission

**Champs acceptés** : `emissionTauxChange`, `billets` (numéros), `pjBillets`.
**Calculés par le backend** : tous les `puEmission…`, `emissionMontant…`, `emissionMontantTaxeAriary` et `emissionCommissionEn…`, à partir des PU en devise de la résa et de `emissionTauxChange`.

### 3.6 Compatibilité pendant la transition

- Si un ancien front envoie encore des montants calculés, **ne pas renvoyer d'erreur 400** : les ignorer.
- Écrire un avertissement dans les logs si l'écart avec le calcul du backend dépasse 1 (devise) ou 1 000 Ar. Cela permet de repérer les écrans à mettre à jour.

## 4. Formule unique (référence)

```ts
function calculerPrixLigne(i: {
  nombre: number;
  puBillet: number; puService: number; puPenalite: number;   // PU compagnie en devise
  tauxEchange: number;                                         // taux de l'étape
  commissionPct: number;                                       // entête.commissionAppliquer
  tauxTaxePct: number;
}) {
  const facteur = 1 + i.commissionPct / 100;
  const t = i.tauxTaxePct / 100;

  // Compagnie
  const mtBilletCie   = i.puBillet   * i.nombre;
  const mtServiceCie  = i.puService  * i.nombre;
  const mtPenaliteCie = i.puPenalite * i.nombre;

  // Taxe : billet + service, sur les montants compagnie, sans commission
  const taxeBillet  = mtBilletCie  * t;
  const taxeService = mtServiceCie * t;
  const montantTaxe = taxeBillet + taxeService;

  // Client
  const mtBilletClient   = mtBilletCie   * facteur + taxeBillet;
  const mtServiceClient  = mtServiceCie  * facteur + taxeService;
  const mtPenaliteClient = mtPenaliteCie * facteur;              // pas de taxe

  // Commission = client hors taxe − compagnie
  const commission = (mtBilletCie + mtServiceCie + mtPenaliteCie) * (facteur - 1);

  // Ariary = devise × taux de l'étape
  // PU client = même formule avec nombre = 1
  return { /* … tous les champs, devise et Ariary … */ };
}
```

**Arrondis** (une seule fois, à la fin) :
- devise : 2 décimales ;
- Ariary : entier, calculé à partir de la valeur en devise **non arrondie** × taux ;
- commission : calculée sur les valeurs non arrondies, puis arrondie.

## 5. Route de simulation (phase 2, recommandée)

Pour que le front n'ait plus aucune formule, même pour l'aperçu pendant la saisie :

```
POST /prospections/lignes/simuler
Body : { prospectionEnteteId, nombre, devise, tauxEchange,
         puBilletCompagnieDevise, puServiceCompagnieDevise, puPenaliteCompagnieDevise, tauxTaxe }
200  : { tous les montants calculés, mêmes noms que la ligne enregistrée }   // rien n'est enregistré

POST /billet/ligne/:id/simuler
Body : { etape: "RESA" | "EMISSION", resaTauxEchange?, emissionTauxChange?, puResa…CompagnieDevise?, … }
200  : { montants de l'étape }
```

Le front l'appellera avec un délai d'environ 300 ms pendant la saisie. En attendant cette route, il garde **une seule** fonction d'aperçu, qui reprend la formule du § 4, uniquement pour l'affichage.

## 6. Odoo

Les payloads `TICKET_SALE_ORDER_SUBMITTED` et `TICKET_PURCHASE_ORDER_SUBMITTED` doivent être construits **uniquement** à partir des montants enregistrés par le backend, calculés avec la fonction unique.

## 7. Tests (sur la fonction unique)

| Entrées | Attendu |
|---|---|
| commission 70 %, taxe 10 %, billet 320, service 50, nombre 1, taux 5 100 | billet client 576 / 2 937 600 Ar ; service client 90 / 459 000 Ar ; taxe 37 / 188 700 Ar ; commission 259 / 1 320 900 Ar |
| commission 60 %, taxe 0 %, billet 1 400, service 200, taux 5 100 | billet client 2 240 ; service 320 ; commission 960 / 4 896 000 Ar |
| même ligne, nombre 2 | tous les montants × 2 |
| pénalité 100, commission 70 % | pénalité client 170, sans taxe |
| un front envoie `commissionEnDevise: 99999` | valeur ignorée, commission recalculée, avertissement dans les logs |

## 8. Ordre de mise en place

1. Écrire `calculerPrixLigne()` et ses tests unitaires (§ 7).
2. L'utiliser dans les routes du § 3 ; ignorer les montants envoyés par le front.
3. Lancer le script de recalcul des données existantes (commission, taxe), puis voir avec Odoo s'il faut renvoyer des dossiers.
4. Prévenir le front. Il enverra alors uniquement les saisies et affichera les montants renvoyés par l'API (travail prêt côté front).
5. Phase 2 : routes `…/simuler`.
