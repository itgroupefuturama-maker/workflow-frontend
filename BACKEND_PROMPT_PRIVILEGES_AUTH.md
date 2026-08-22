# Prompt à donner au backend — Privilèges manquants dans la réponse d'authentification

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Sujet indépendant des autres briefs — trouvé en voulant afficher les privilèges de l'utilisateur connecté dans l'AppBar.

---

## Contexte

L'AppBar (`AppBar.tsx`) affiche déjà, dans le menu profil de l'utilisateur connecté, ses **profils actifs** et ses **modules accessibles** — construits à partir de `user.profiles[].profile.modules[]`, une donnée déjà présente dans la réponse d'authentification (`POST /auth/login` et `GET /users/me`).

On veut ajouter une troisième section : les **privilèges** de l'utilisateur, sur le même principe. Le type frontend (`User` dans `authSlice.ts`) anticipe déjà ce champ (`ProfileDetail.privileges: Privilege[]`), avec exactement la même forme que ce que renvoie déjà `GET /profiles` (utilisé par l'écran `Autorisation.tsx`, qui affiche profils/modules/privilèges pour la gestion des droits en back-office) :

```json
{
  "profileId": "...",
  "privilegeId": "...",
  "dateAttribution": "...",
  "status": "ACTIF",
  "privilege": {
    "id": "...",
    "privilege": "...",
    "fonctionnalite": "...",
    "status": "..."
  }
}
```

**Mais en pratique, la réponse de `/auth/login`/`GET /users/me` ne contient pas ce tableau** (vérifié en inspectant la réponse réelle) — `profile.privileges` est absent ou vide, alors que `profile.modules` lui est bien présent.

## Ce qu'il faut ajouter côté backend

Sur `POST /auth/login` et `GET /users/me`, inclure `privileges[]` dans chaque `user.profiles[].profile`, avec exactement la même forme que celle déjà renvoyée par `GET /profiles` pour ce même profil (même structure que `modules[]`, qui fonctionne déjà correctement).

## Ce dont j'ai besoin en retour

- Confirmation que `privileges[]` est bien ajouté avec cette forme exacte (sinon préciser ce qui diffère, pour que j'adapte le type frontend).
- Tant qu'on y est : confirmation que `modules[]` est bien complet aujourd'hui dans ces deux réponses (je pars du principe que oui puisque "Modules accessibles" s'affiche déjà correctement dans l'AppBar, mais autant vérifier des deux côtés en même temps).
