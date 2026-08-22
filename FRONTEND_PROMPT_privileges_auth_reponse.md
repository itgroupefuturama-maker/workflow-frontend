# Réponse au prompt backend — privilèges + lien module/privilège

En réponse à `BACKEND_PROMPT_PRIVILEGES_AUTH.md`.

## Réponse à la question posée : Cas A ou Cas B ?

**Cas B.** Vérifié directement dans `prisma/schema.prisma` : il n'existe **aucune
relation en base entre `Privilege` et `Module`**.

- `ProfilePrivilege` (table de jointure) : `profileId` + `privilegeId` uniquement.
- `ProfileModule` (table de jointure) : `profileId` + `moduleId` uniquement.
- `Privilege.fonctionnalite` est un simple `String?` libre (pas une clé
  étrangère vers `Module`) — donc pas exploitable comme lien fiable.
- Le modèle `Autorisation` (historique/audit des actions d'attribution) a bien
  `privilegeId` et `moduleId` optionnels sur la même ligne, mais c'est un
  journal d'actions (`numero`, `date`, `action`), pas une relation vivante
  "ce privilège s'applique à ce module".

Donc : `profile.modules[]` et `profile.privileges[]` sont bien **deux listes
indépendantes** rattachées au même profil, sans lien explicite entre un
privilège donné et un module donné. Le regroupement le plus fin possible reste
« par profil », comme anticipé dans le prompt.

## État réel des 3 endpoints (vérifié dans le code, pas supposé)

| Endpoint | `profile.privileges[]` | `profile.modules[]` | Forme |
|---|---|---|---|
| `GET /profiles` (`profile.service.ts::findAll`) | ✅ déjà présent | ✅ déjà présent | brute (jointure Prisma non aplatie) |
| `GET /users/me` (`user.service.ts::getMe`) | ✅ déjà présent | ✅ déjà présent | brute, identique à `GET /profiles`, filtrée sur `status: 'ACTIF'` |
| `POST /auth/login` | ❌ absent avant ce correctif → ✅ maintenant ajouté | ❌ absent avant ce correctif → ✅ maintenant ajouté | alignée sur les deux endpoints ci-dessus |

`profile.privileges[]` **n'était pas réellement absent partout** : il était déjà
exposé par `GET /users/me`, qui utilisait déjà la même forme que
`GET /profiles`. Seul `POST /auth/login` ne le renvoyait pas — c'est corrigé
dans `src/modules/auth/auth.service.ts::validateUser` (méthode appelée par
`login()`).

## Forme exacte, désormais identique sur les 3 endpoints

```json
{
  "profiles": [
    {
      "userId": "...",
      "profileId": "...",
      "dateAffectation": "...",
      "status": "ACTIF",
      "profile": {
        "id": "...",
        "profil": "Agent ticketing",
        "status": "ACTIF",
        "privileges": [
          {
            "profileId": "...",
            "privilegeId": "...",
            "status": "ACTIF",
            "privilege": {
              "id": "...",
              "privilege": "Gestion",
              "fonctionnalite": null,
              "status": "ACTIF"
            }
          }
        ],
        "modules": [
          {
            "profileId": "...",
            "moduleId": "...",
            "status": "ACTIF",
            "module": {
              "id": "...",
              "code": "ticketing",
              "nom": "Ticketing",
              "status": "ACTIF"
            }
          }
        ]
      }
    }
  ]
}
```

Points importants :

- Le nom du privilège est dans `profiles[].profile.privileges[].privilege.privilege`
  (pas un tableau de strings à plat).
- Le nom/code du module est dans `profiles[].profile.modules[].module.code` /
  `.nom`.
- `profile.privileges[]` et `profile.modules[]` sont deux tableaux **séparés**
  du même profil, sans clé commune reliant une entrée de l'un à une entrée de
  l'autre — confirmé Cas B ci-dessus.
- Un utilisateur peut avoir plusieurs éléments dans `profiles[]` (plusieurs
  profils actifs) — chacun avec ses propres `privileges[]` et `modules[]`
  potentiellement différents. Le regroupement par profil (colonnes séparées
  par profil, pas fusionnées entre profils) reste donc la bonne approche
  d'affichage, comme évoqué dans le prompt initial pour `Autorisation.tsx`.

## Fichiers backend concernés

- `src/modules/auth/auth.service.ts` (`validateUser` / `login`) — correctif
  appliqué : ajout de `profile.privileges` et `profile.modules` dans le
  `include`, avec la même forme que `GET /profiles` / `GET /users/me`.
- `src/modules/user/user.service.ts::getMe` — déjà correct, sert de référence
  pour la forme.
- `src/modules/profile/profile.service.ts::findAll` — déjà correct, sert de
  référence pour la forme.
