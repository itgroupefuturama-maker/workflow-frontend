# Prompt à donner au frontend — Itinéraire = produit (référentiel)

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.

---

## Contexte

Jusqu'ici, l'« itinéraire » d'une ligne de prospection (billet) ou d'attestation était un **texte libre** saisi par l'utilisateur (`"TNR - CDG"`, `"Marseille → Paris"`…), à côté de `departId` / `destinationId` (villes = `DestinationVoyage`).

L'équipe Odoo a besoin que l'itinéraire soit un **produit** : une table dédiée `Itineraire` contient toutes les combinaisons possibles **ville de départ → ville d'arrivée** (le sens compte : A→B et B→A sont deux itinéraires). Ce référentiel est complété par Odoo, et nous avons aussi un CRUD côté workflow.

Un itinéraire :
```ts
type Itineraire = {
  id: string;
  odooId: number | null;   // id du produit Odoo (null tant qu'Odoo ne l'a pas complété)
  code: string;            // "IT-1", "IT-2"…
  libelle: string;         // "Antananarivo - Paris"
  paysDepartId: string;   paysDepart: Pays;
  villeDepartId: string;  villeDepart: DestinationVoyage;
  paysArriveeId: string;  paysArrivee: Pays;
  villeArriveeId: string; villeArrivee: DestinationVoyage;
  statut: 'ACTIF' | 'INACTIF';
  createdAt: string; updatedAt: string;
};
```

## ⚠️ Ce qui change sur les lignes (prospection billet + attestation)

1. **`departId` et `destinationId` deviennent obligatoires** :
   - `POST /prospections/lignes` (ils l'étaient déjà dans le DTO) ;
   - **`POST /attestation/ligne`** : ils étaient facultatifs, ils sont maintenant **obligatoires** (400 sinon).
2. Le backend cherche l'itinéraire correspondant à `(departId → destinationId)` :
   - **aucun itinéraire** pour cette combinaison → **404** `"Aucun itinéraire n'existe pour cette ville de départ et cette ville d'arrivée…"` ;
   - itinéraire **INACTIF** → **400**.
3. **Le champ `itineraire` (texte) envoyé par le front est ignoré.** Le backend le remplit lui-même avec le `libelle` de l'itinéraire (format stable `"Ville départ - Ville arrivée"`). Vous pouvez arrêter de l'envoyer (l'envoyer ne provoque pas d'erreur).
4. Les réponses des lignes incluent maintenant `itineraireId` et l'objet **`itineraireVoyage`** (l'itinéraire complet) partout où `destinationVoyage` était déjà inclus.

Les lignes existantes ont été rattachées à un itinéraire par une reprise de données ; leur texte `itineraire` d'origine n'a pas été modifié.

## Nouvelle saisie : sélection en cascade

Remplacer, dans les formulaires de ligne de prospection (billet) et de ligne d'attestation, le champ texte « Itinéraire » + les deux sélecteurs départ/arrivée par **4 listes en cascade** :

**Pays de départ → Ville de départ → Pays d'arrivée → Ville d'arrivée**

Chaque étape ne propose **que ce qui mène à au moins un itinéraire ACTIF**, l'utilisateur ne peut donc pas tomber sur une combinaison inexistante.

| Étape | Endpoint | Réponse |
|---|---|---|
| 1. Pays de départ | `GET /itineraire/options/pays-depart` | `Pays[]` |
| 2. Ville de départ | `GET /itineraire/options/villes-depart?paysId=<paysDepartId>` | `DestinationVoyage[]` (avec `pays`) |
| 3. Pays d'arrivée | `GET /itineraire/options/pays-arrivee?villeDepartId=<id>` | `Pays[]` |
| 4. Ville d'arrivée | `GET /itineraire/options/villes-arrivee?villeDepartId=<id>&paysArriveeId=<id>` | **`Itineraire[]`** (chaque élément contient `villeArrivee`, `libelle`, `id`) |

- À l'étape 4, afficher `item.villeArrivee.ville` comme option. Le choix donne directement l'itinéraire : afficher son `libelle` en lecture seule à la place de l'ancien champ texte.
- À l'envoi de la ligne : `departId = villeDepartId` et `destinationId = item.villeArriveeId` (inchangé côté payload, plus de `itineraire` à envoyer).
- Quand une étape change, réinitialiser les étapes suivantes.
- Pour pré-remplir en édition : `ligne.itineraireVoyage` contient `paysDepartId`, `villeDepartId`, `paysArriveeId`, `villeArriveeId`.
- Utilitaire facultatif : `GET /itineraire/lookup?villeDepartId=&villeArriveeId=` renvoie l'itinéraire d'une combinaison (404 si aucun).

Si une liste est vide, afficher un message du type « Aucun itinéraire disponible, il doit être créé dans le référentiel (Odoo / paramétrage Itinéraires) ».

## Nouvel écran de paramétrage : Itinéraires (CRUD)

À placer à côté du paramétrage Pays / Destinations.

- **Liste paginée** : `GET /itineraire?page=1&limit=10&search=&statut=&paysDepartId=&villeDepartId=&paysArriveeId=&villeArriveeId=`
  → `{ data: Itineraire[], meta: { total, page, limit, totalPages } }`
  `search` porte sur le code, le libellé, les villes et les pays. Colonnes suggérées : Code, Libellé, Départ (ville, pays), Arrivée (ville, pays), Odoo (✔ si `odooId`), Statut.
- **Détail** : `GET /itineraire/:id`
- **Création** : `POST /itineraire`
  ```json
  { "villeDepartId": "…", "villeArriveeId": "…", "libelle": "facultatif", "statut": "ACTIF" }
  ```
  Les pays ne sont pas à envoyer : ils sont déduits des villes. S'ils sont envoyés, ils doivent correspondre (400 sinon). `libelle` absent → `"<ville départ> - <ville arrivée>"`. Pour la saisie, réutilisez `GET /exigence-destination/pays` puis `GET /exigence-destination/destination/pays/:paysId` (toutes les villes, pas seulement celles qui ont déjà un itinéraire).
  Erreurs : 409 si la combinaison existe déjà, 400 si départ = arrivée.
- **Modification** : `PUT /itineraire/:id` (mêmes champs, tous facultatifs). **Changer les villes est refusé (409) si l'itinéraire est déjà utilisé** par une ligne : il faut le désactiver et en créer un nouveau.
- **Suppression** : `DELETE /itineraire/:id`. **Refusée (409) si l'itinéraire est utilisé** : proposer alors de le passer en `INACTIF` (`PUT { "statut": "INACTIF" }`). Un itinéraire inactif n'apparaît plus dans la cascade.
- `odooId` est géré par Odoo : l'afficher, mais ne pas le proposer à la saisie.

## Format des erreurs

Comme le reste de l'API : `{ success: false, message: "…" }` avec le code HTTP correspondant (400 / 404 / 409). Affichez `message` tel quel, il est rédigé pour l'utilisateur.
