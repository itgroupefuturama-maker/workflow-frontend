# Prompt à donner au frontend — Fusion Fournisseur / Consulat

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.

---

## Contexte

Fournisseur et Consulat sont, métier, la même entité — juste utilisée différemment (un consulat est un type particulier de fournisseur). Côté backend, ils vivaient jusqu'ici dans deux tables séparées (`Fournisseur`, complète, et `Consultat`, minimale — juste un nom). Ça devenait une source de friction (deux CRUD à maintenir en parallèle, notamment pour une future intégration avec l'équipe Odoo qui a besoin d'un seul point d'entrée). C'est maintenant fusionné en une seule table, avec un champ `type` pour les distinguer.

## Ce qui a changé côté backend

**Rien ne casse : aucune action requise dans l'immédiat.** Point important vérifié avant de livrer ce changement : `GET /fournisseurs` (utilisé par `fetchFournisseurs`, partagé par les sélecteurs de fournisseur dans ticketing/hôtel/visa/assurance/miles-compagnie) **ne renvoie toujours que les fournisseurs classiques par défaut** — les consulats n'apparaissent dans aucune de ces listes existantes, exactement comme avant la fusion. Il faut passer explicitement `?type=CONSULAT` (ou `?type=ALL` pour les deux) pour les voir.

Les routes `/visa-params/consultat` existantes (`POST`, `GET`, `GET /:id`) continuent de fonctionner exactement comme avant, même format de réponse (`{id, nom, createdAt, updatedAt}`). En plus, deux routes qui manquaient sont maintenant disponibles :
- `PUT /visa-params/consultat/:id` — modifier un consulat (`{ "nom": "..." }`)
- `DELETE /visa-params/consultat/:id` — supprimer un consulat

**Nouveau, sur `/fournisseurs`** (déjà utilisé par `Fournisseur.tsx`) :
- `POST`/`PUT /fournisseurs/:id` acceptent un champ optionnel `type: "FOURNISSEUR" | "CONSULAT"`. Absent = `FOURNISSEUR` (comportement actuel inchangé).
- `GET /fournisseurs?type=CONSULAT` — ne renvoie que les consulats. `GET /fournisseurs?type=ALL` renvoie les deux. **`GET /fournisseurs` sans paramètre reste filtré sur FOURNISSEUR uniquement** — ne change rien pour l'existant.
- La réponse d'un fournisseur/consulat via `/fournisseurs` a la forme habituelle : `{id, code, libelle, type, status, dateApplication, dateActivation, dateDesactivation, transactions, ...}` — un consulat a un `code` du type `CONS1`, `CONS2`... (au lieu de `FRN1`, `FRN2`... pour les fournisseurs), et n'aura jamais de `transactions` associées en pratique (mais rien ne l'empêche techniquement).

## ⚠️ Ce qui casse réellement — à corriger avant de déployer ce changement

Les endpoints Visa qui renvoyaient l'objet `consulat` imbriqué (`consulat: { id, nom, createdAt, updatedAt }`) renvoient maintenant l'objet `Fournisseur` complet — **`nom` n'existe plus, c'est `libelle`**. Ça concerne les réponses de `/visa/prospection-entete`, `/visa/entete`, `/visa/devis` (partout où `consulat`/`prospectionVisa.consulat` apparaît dans la réponse).

4 endroits identifiés dans le repo frontend actuel à corriger (`.consulat.nom` → `.consulat.libelle`) :
- `src/pages/front_office/dossiers-communs/module.visa/components/VisaTab.tsx:157`
- `src/pages/front_office/dossiers-communs/module.pdf/pdf.generation/generators/visa.generator.ts:46`
- `src/pages/front_office/dossiers-communs/module.visa/components/ProspectionTab.tsx:198` et `:201`

Vérifiez aussi les types TypeScript associés (`prospectionVisa.consulat: { id, libelle }` dans le type `DataDevisVisa` côté PDF, par exemple) qui déclarent encore `nom`.

## Ce qu'il faut faire côté frontend (au-delà du correctif ci-dessus, à votre rythme)

Aujourd'hui vous avez deux écrans/slices séparés pour la même notion :
- `Fournisseur.tsx` + `fournisseursSlice.ts` → CRUD complet (create/update/delete/activate/deactivate)
- `CreateVisaConsultatModal.tsx` + `visaConsultatSlice.ts` → create + list seulement, pas d'édition ni de suppression dans l'UI actuelle

Maintenant que c'est la même table côté backend, deux pistes possibles (à vous de choisir, ou de garder les deux écrans séparés si ça reste plus clair pour vos utilisateurs) :

1. **Unifier l'UI** : ajouter un sélecteur "Type : Fournisseur / Consulat" sur `Fournisseur.tsx`, et faire pointer la création/liste des consulats sur `/fournisseurs?type=CONSULAT` au lieu de `/visa-params/consultat`. Ça donne gratuitement l'édition et la suppression des consulats (actuellement absentes de l'UI), en un seul écran à maintenir.
2. **Garder les deux écrans séparés**, mais profiter des nouvelles routes `PUT`/`DELETE /visa-params/consultat/:id` pour ajouter l'édition/suppression des consulats à l'écran existant, sans toucher au reste.

## Ce dont le backend a besoin en retour

Dites-nous laquelle des deux pistes vous préférez (ou une autre), et si vous voulez qu'on retire un jour les routes `/visa-params/consultat` (elles resteront disponibles tant que vous ne nous dites pas que vous êtes passés sur `/fournisseurs`).
