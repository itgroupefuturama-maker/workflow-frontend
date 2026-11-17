# Front — les prix ticketing sont calculés par le backend

Réponse à `BACKEND_CALCUL_PRIX_CENTRALISE.md` et `BACKEND_TAXE_PRIX_CLIENT.md`.
Le backend est maintenant la **seule source** des montants. Le front envoie les saisies de l'agent et affiche ce que
l'API renvoie.

## Règle de calcul (une seule fonction côté backend)

- prix client = prix compagnie × (1 + commission %) + taxe ;
- taxe = taux de taxe × montant compagnie, sur le **billet et le service** (jamais la pénalité), sans commission,
  **seulement dans le prix client** ;
- commission = % × prix compagnie (billet + service + pénalité), sans la taxe ;
- montant = PU × nombre ;
- arrondis : 2 décimales en devise, ariary entier (calculé depuis la devise non arrondie × taux de l'étape).

Ex. 70 %, taxe 10 %, billet 320, service 50, taux 5 100 → billet client 576 / 2 937 600 Ar, service client
90 / 459 000 Ar, taxe 37 / 188 700 Ar, commission 259 / 1 320 900 Ar.

## Ce que le front envoie

| Route | Saisies à envoyer |
|---|---|
| `POST /prospections/lignes` | `puBilletCompagnieDevise`, `puServiceCompagnieDevise`, `puPenaliteCompagnieDevise`, `tauxEchange`, `nombre`, `tauxTaxe` (en %), + les champs non financiers habituels |
| `PUT /prospections/entetes/:id` | `commissionAppliquer` : toutes les lignes de prospection de l'entête sont recalculées (prix client, taxe, commission) |
| `PUT /billet/ligne/:id/addreservation` | `resaTauxEchange`, `puResaBilletCompagnieDevise`, `puResaServiceCompagnieDevise`, `puResaPenaliteCompagnieDevise`, `nombre`, + passagers, réservation, conditions, preuve |
| `PATCH /billet/:id/reprogrammer` | mêmes PU compagnie et taux que la résa (le calcul passe par la résa) |
| `PUT /billet/ligne/:id/achat` | `emissionTauxChange`, billets, pièces jointes |

Tous les montants calculés (`montant…`, `…Ariary`, prix client, `montantTaxe…`, `commissionEn…`,
`puResaMontant…`) sont **ignorés** s'ils sont envoyés : pas d'erreur, mais un avertissement dans les logs du
backend si l'écart dépasse 1 en devise ou 1 000 Ar. Le front peut arrêter de les envoyer.

## Ce qui change dans les réponses

- Prospection : `montantServiceClient…` inclut la taxe du service ; `montantTaxeDevise` / `montantTaxeAriary` =
  **taxe totale de la ligne** (billet + service, × nombre), et non plus la taxe d'un billet.
- Résa et émission : les prix client (`puResa…Client…`, `puResaMontant…Client…`, `puEmission…ClientAriary`,
  `emissionMontant…ClientAriary`) incluent la taxe. Il n'y a **pas de champ taxe** sur la ligne billet : le taux est
  `prospectionLigne.tauxTaxe`. Pour afficher la taxe de résa : `tauxTaxe × (puResaMontantBilletCompagnieDevise +
  puResaMontantServiceCompagnieDevise) / 100`.
- Les prix compagnie ne contiennent jamais la taxe.

## Aperçu pendant la saisie

Pas encore de route de simulation (phase 2). Garder **une seule** fonction d'aperçu côté front, avec la formule
ci-dessus, uniquement pour l'affichage : la valeur enregistrée est celle renvoyée par l'API.

## Données existantes

Un script backend recalcule les montants des lignes de prospection, des lignes billet en vigueur et des totaux
(prix client avec taxe, commission, arrondis). Les montants affichés pour d'anciens dossiers vont donc changer.
