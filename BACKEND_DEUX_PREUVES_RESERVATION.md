# Backend — Deux preuves (images) à la réservation d'une ligne billet

## Besoin

Aujourd'hui, la fenêtre de réservation (`PUT /billet/ligne/:id/addreservation`) accepte **une seule image** : `preuveResa`.

Il en faut maintenant **deux**, avec deux rôles distincts :

| # | Preuve | À quoi elle sert | Champ |
|---|---|---|---|
| 1 | **Acceptation du client** | Capture montrant que le client a accepté la réservation (message WhatsApp, e-mail, bon signé…) | **`preuveAcceptationClient`** (nouveau) |
| 2 | **N° de réservation compagnie** | Capture de la plateforme de la compagnie où l'on voit le n° de réservation (PNR) | **`preuveResa`** (existant, même sens qu'avant) |

> À ne pas confondre avec `prospectionEntete.preuveClient`, qui reste la preuve d'acceptation du **devis**, au niveau de l'en-tête (validation du devis). La nouvelle preuve est **par ligne billet**, au moment de la **réservation**.

## 1. Base de données

Sur `BilletLigne`, ajouter :

| Colonne | Type | Null | Remarque |
|---|---|---|---|
| `preuveAcceptationClient` | `String` | oui | chemin du fichier, même format que `preuveResa` (ex. `uploads/preuves/preuve-client-<timestamp>-<random>.png`) |

`preuveResa` reste inchangé. Les anciennes lignes ont `preuveAcceptationClient = null`.

## 2. `PUT /billet/ligne/:id/addreservation` (multipart/form-data)

Accepter **deux fichiers** au lieu d'un (par exemple avec `upload.fields([...])` si Multer est utilisé) :

| Champ du formulaire | Fichier | Enregistré dans |
|---|---|---|
| `preuveAcceptationClient` | 1 image | `billetLigne.preuveAcceptationClient` |
| `preuveResa` | 1 image | `billetLigne.preuveResa` (comme aujourd'hui) |

Les autres champs ne changent pas (`passagers`, `nombre`, `reservation`, `devise`, `resaTauxEchange`, `puResa…CompagnieDevise`, `conditionModif`, `conditionAnnul`).

### Règles

- **Formats** : PNG, JPG, WEBP (et PDF si possible pour les e-mails exportés). **5 Mo max par fichier**, comme aujourd'hui.
- **Première réservation** (ligne `CREER` → `FAIT`) : les deux preuves sont **obligatoires** *(à confirmer côté métier ; sinon, les laisser optionnelles comme aujourd'hui)*.
  - Erreur **400** si un fichier manque, avec un message affichable tel quel :
    `« La preuve d'acceptation du client est obligatoire »` / `« La capture du n° de réservation est obligatoire »`.
- **Mise à jour d'une réservation** (ligne déjà `FAIT`) et **reprogrammation** : chaque fichier est **optionnel**.
  - Fichier envoyé → il remplace l'ancien.
  - Fichier absent → on garde l'existant.
- **Fichier refusé** (mauvais format, trop gros) : **400** avec un message clair. Ne rien enregistrer (même transaction que le reste de la réservation).
- Nom de fichier distinct pour chaque type (`preuve-client-…` / `preuve-resa-…`) pour éviter toute confusion sur le disque.

## 3. Réponses de l'API

Ajouter `preuveAcceptationClient` partout où `preuveResa` est déjà renvoyé sur une ligne billet :

| Route | Où |
|---|---|
| `GET /billet/entete/:devisId/devis` et `GET /billet/entete/:id` | `billetLigne[].preuveAcceptationClient` |
| `GET /prospections/entetes/:id` | `billetEntete[].billetLigne[].preuveAcceptationClient` |
| Réponse de `PUT /billet/ligne/:id/addreservation` | sur la ligne renvoyée |

```jsonc
{
  "id": "cmwj6a7eh003e2xpioyn2fvk2",
  "referenceLine": "A_10",
  "numeroDosRef": "DOSTIC_14_1_1",
  "reservation": "RES123",
  "preuveAcceptationClient": "uploads/preuves/preuve-client-1794828106651-167182955.png", // ← NOUVEAU
  "preuveResa": "uploads/preuves/preuve-resa-1794828106651-167182955.png",
  "…": "…"
}
```

Le fichier doit être servi comme `preuveResa` : `${API_URL}/${chemin}`.

## 4. Reprogrammation et annulation

- La ligne créée par une **reprogrammation** reprend les deux preuves de l'ancienne ligne, sauf si de nouveaux fichiers sont envoyés.
- **Annulation** : les fichiers sont conservés (historique).

## 5. Odoo (optionnel)

Si le contrat Odoo transmet déjà `preuveResa` (URL ou pièce jointe), transmettre aussi `preuveAcceptationClient` de la même façon.

## 6. Côté front (pour information)

Le front ajoutera dans la fenêtre de réservation deux zones d'image distinctes :
- « Preuve d'acceptation du client » ;
- « Capture du n° de réservation (plateforme compagnie) ».

Il les enverra en `multipart/form-data` dans les champs `preuveAcceptationClient` et `preuveResa`. Le tableau des lignes du billet affichera les deux miniatures dans la colonne « Preuve ».

## 7. Tests

| Cas | Attendu |
|---|---|
| Première résa avec les 2 images | 200 ; les 2 chemins sont enregistrés et renvoyés |
| Première résa sans `preuveAcceptationClient` | 400 « La preuve d'acceptation du client est obligatoire » (si la règle est retenue) |
| Mise à jour de résa avec seulement `preuveResa` | `preuveResa` remplacée, `preuveAcceptationClient` inchangée |
| Fichier de 8 Mo ou `.exe` | 400, rien n'est enregistré |
| Reprogrammation sans fichier | la nouvelle ligne garde les 2 preuves de l'ancienne |
| Ancienne ligne | `preuveAcceptationClient: null`, aucune erreur |
