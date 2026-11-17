# Front — deux preuves à la réservation d'une ligne billet

Réponse à `BACKEND_DEUX_PREUVES_RESERVATION.md`. C'est en place côté backend.

## Envoi : `PUT /billet/ligne/:id/addreservation` (multipart/form-data)

| Champ du formulaire | Contenu |
|---|---|
| `preuveAcceptationClient` | Preuve que le client a accepté la réservation (WhatsApp, e-mail, bon signé…) |
| `preuveResa` | Capture du n° de réservation sur la plateforme de la compagnie |

Les autres champs ne changent pas.

## Règles

- Formats : PNG, JPG, WEBP ou PDF. **5 Mo max** par fichier.
- **Première réservation** d'une ligne (ligne `CREER`, pas une reprogrammation) : les **deux preuves sont obligatoires**.
  Réponse `{ success: false, message }` avec l'un de ces messages, à afficher tel quel :
  - « La preuve d'acceptation du client est obligatoire »
  - « La capture du n° de réservation est obligatoire »
- **Mise à jour de la réservation** (ligne déjà `FAIT`) : chaque fichier est facultatif. Fichier envoyé = il remplace
  l'ancien ; fichier absent = l'existant est gardé.
- **Fichier refusé** (format ou taille) : HTTP **400**, rien n'est enregistré. Messages possibles :
  - « La preuve d'acceptation du client doit être une image PNG, JPG, WEBP ou un PDF »
  - « La capture du n° de réservation dépasse 5 Mo »
  - (et les deux autres combinaisons)
- **Reprogrammation** : la nouvelle ligne reprend les deux preuves de l'ancienne. **Annulation** : les fichiers sont gardés.

Le contrôle de format et de taille peut aussi être fait côté front avant l'envoi, pour un retour immédiat.

## Lecture

`preuveAcceptationClient` est renvoyé sur chaque ligne billet, à côté de `preuveResa` :
`GET /billet/entete/:devisId/devis`, `GET /billet/entete/:id`, `GET /prospections/entetes/:id`
(`billetEntete[].billetLigne[]`) et la réponse de `addreservation`.

- Chemin du type `uploads/preuves/preuve-client-<timestamp>-<n>.png`, servi comme `preuveResa` : `${API_URL}/${chemin}`.
- Anciennes lignes : `preuveAcceptationClient: null`.

Colonne « Preuve » du tableau des lignes : afficher les deux miniatures (acceptation client, n° de réservation).
