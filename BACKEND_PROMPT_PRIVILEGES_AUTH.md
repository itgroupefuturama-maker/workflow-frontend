# Prompt à donner au backend — Privilèges manquants + clarté profil/module/privilège dans l'auth

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Sujet indépendant des autres briefs — trouvé en voulant afficher les privilèges de l'utilisateur connecté dans l'AppBar.

---

## Contexte

L'AppBar (`AppBar.tsx`) affiche déjà, dans le menu profil de l'utilisateur connecté, ses **profils actifs** et ses **modules accessibles** — construits à partir de `user.profiles[].profile.modules[]`, déjà présent dans la réponse d'authentification (`POST /auth/login` et `GET /users/me`). On veut ajouter les **privilèges**, sur le même principe — mais `profile.privileges[]` est absent de cette réponse aujourd'hui (vérifié en pratique), alors que le type frontend l'anticipe déjà (`ProfileDetail.privileges`, même forme que `GET /profiles`, utilisé par l'écran `Autorisation.tsx`).

**Complication réelle repérée en creusant** : un même utilisateur peut avoir plusieurs profils actifs, et deux profils différents peuvent donner des privilèges différents pour un même module (ex. le profil "Agent ticketing" donne le privilège "Gestion" sur le module ticketing, un autre profil du même utilisateur ne donne que "Consultation" sur ce même module). Pour afficher ça sans ambiguïté (savoir précisément quel privilège s'applique à quel module, via quel profil), j'ai besoin de comprendre la structure réelle de vos données :

**Question pour vous** : dans votre modèle actuel, un `Privilege` (ex. "Gestion") est-il déjà rattaché à un `Module` précis (une vraie relation profil + module + privilège en base), ou bien `profile.modules[]` et `profile.privileges[]` sont-ils deux listes indépendantes attachées au même profil, sans lien explicite entre un privilège donné et un module donné (c'est ce que suggère l'écran `Autorisation.tsx` actuel, qui affiche les deux comme deux colonnes de tags séparées, côte à côte, sans les croiser) ?

## Ce qu'il faut faire côté backend, selon la réponse

**Cas A — un lien module↔privilège existe déjà en base** (ou peut être déduit, ex. via `Privilege.fonctionnalite` qui référencerait un module) : exposez-le explicitement dans la réponse de `/auth/login`/`GET /users/me`, idéalement sous une forme déjà aplatie et sans ambiguïté, par profil, par exemple :

```json
"profiles": [
  {
    "profileId": "...",
    "profile": "Agent ticketing",
    "status": "ACTIF",
    "acces": [
      { "module": "ticketing", "privilege": "Gestion" },
      { "module": "ticketing", "privilege": "Consultation" }
    ]
  }
]
```

(la forme exacte vous appartient — l'essentiel est que chaque entrée dise sans ambiguïté "ce privilège s'applique à ce module, dans ce profil").

**Cas B — pas de lien module↔privilège en base, ce sont deux listes indépendantes par profil** : pas de changement de structure nécessaire au-delà de ce qui était déjà demandé (juste ajouter `profile.privileges[]`, même forme que `GET /profiles`). Dans ce cas le regroupement le plus fin possible reste "par profil" (un profil donné a CES modules et CES privilèges, sans savoir lequel va avec lequel) — je gérerai l'affichage en conséquence côté frontend (grouper par profil au lieu de tout mélanger entre profils, comme c'est fait actuellement par erreur pour les modules).

## Ce dont j'ai besoin en retour

- Laquelle des deux situations (cas A ou B) correspond à votre modèle actuel.
- Si cas A : la forme exacte de la réponse une fois ajoutée.
- Si cas B : confirmation que `profile.privileges[]` sera bien ajouté avec la même forme que `GET /profiles`.
- Dans les deux cas : confirmation que `profile.modules[]` est bien complet aujourd'hui dans ces réponses (je pars du principe que oui puisque "Modules accessibles" s'affiche déjà dans l'AppBar, mais autant vérifier en même temps).
