# Front — achat : e-billets, preuve d'achat et historique des fichiers

Réponse à `BACKEND_PJ_BILLET_ET_PREUVE_ACHAT.md`. C'est en place côté backend.

## Envoi : `PUT /billet/ligne/:id/achat` (multipart/form-data)

| Champ | Contenu |
|---|---|
| `emissionTauxChange` | inchangé |
| `billets` | JSON `[{ billetId, numeroBillet, nouveauPjBillet }]` |
| `pjBillets` | e-billets compagnie, **un par entrée `nouveauPjBillet: true`, dans le même ordre** |
| `preuveAchat` | **nouveau** : 1 fichier pour la ligne (justificatif du paiement à la compagnie) |

`nouveauPjBillet: true` = un e-billet est envoyé pour ce passager. C'est ce qui permet de corriger un seul passager :
`billets = [{ b1, …, nouveauPjBillet: false }, { b2, …, nouveauPjBillet: true }]` avec un seul fichier dans `pjBillets`
→ le fichier va à b2. (Sans aucun `nouveauPjBillet`, l'ancien comportement reste : `pjBillets` dans l'ordre de `billets`.)

## Règles

- Formats : PDF, PNG, JPG, WEBP. **5 Mo max** par fichier.
- **1re émission** : un e-billet pour **chaque passager** de la ligne et la preuve d'achat sont **obligatoires**.
- **Correction** (ligne émise, achat pas encore envoyé ou rejeté) : tout est facultatif ; un fichier absent garde
  l'existant (l'e-billet n'est plus effacé).
- **Tout ou rien** : en cas d'erreur, ni numéros ni fichiers ne sont enregistrés.
- Erreurs HTTP **400**, messages à afficher tels quels :
  - « La preuve d'achat est obligatoire »
  - « L'e-billet de {NOM} {Prénom} est obligatoire »
  - « La preuve d'achat doit être un PDF ou une image PNG, JPG, WEBP » / « La preuve d'achat dépasse 5 Mo »
  - « L'e-billet doit être un PDF ou une image PNG, JPG, WEBP » / « L'e-billet dépasse 5 Mo »
  - « 2 e-billet(s) reçu(s) pour 1 passager(s) marqué(s) nouveauPjBillet » (le front envoie un mauvais nombre de fichiers)

## Lecture

- `billetLigne.preuveAchat` (chemin, ou `null`) partout où `preuveResa` est renvoyé :
  `GET /billet/entete/:devisId/devis`, `GET /billet/entete/:id`, `GET /prospections/entetes/:id`. Servi comme les autres :
  `${API_URL}/${chemin}`.
- `billet.pjBillet` = e-billet compagnie **en vigueur** du passager.
- **Historique** : `GET /billet/ligne/:id/pieces-jointes`, du plus récent au plus ancien, fichiers remplacés compris :

```jsonc
[
  { "id": "…", "type": "E_BILLET", "billetId": "…", "chemin": "uploads/billets/billet-….pdf",
    "nomOriginal": "TKT-001.pdf", "tailleOctets": 182334, "actif": true, "remplaceParId": null,
    "creePar": { "nom": "…", "prenom": "…" }, "createdAt": "…" },
  { "id": "…", "type": "PREUVE_ACHAT", "billetId": null, "actif": false, "remplaceParId": "…", "…": "…" }
]
```

`type` : `E_BILLET`, `PREUVE_ACHAT`, `PREUVE_RESA`, `PREUVE_ACCEPTATION_CLIENT` (les deux preuves de la résa sont aussi
dans l'historique). Les fichiers déjà présents avant l'historique y sont repris avec `creePar: null` et, comme nom
d'origine, le nom sur le disque.

## Reprogrammation / annulation

- Reprogrammation : la nouvelle ligne n'a ni e-billet ni preuve d'achat (nouvel achat) ; l'historique de l'ancienne
  ligne reste consultable avec son id.
- Annulation : fichiers et historique conservés.
