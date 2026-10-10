# Checklist — Dossiers visibles en lecture seule pour les non-responsables

> Suivi interne de la tâche. Ne pas commencer les phases 1/2 avant la réponse du backend à
> `BACKEND_PROMPT_DOSSIER_VISIBILITE_NON_RESPONSABLE.md`.
> Même logique que le rollout RBAC précédent : par module, on désactive des boutons, on ne les
> masque pas.

## Phase 0 — Backend (bloquant, rien côté frontend avant ça)

- [x] Envoyer `BACKEND_PROMPT_DOSSIER_VISIBILITE_NON_RESPONSABLE.md` à l'équipe backend
- [x] Réponse backend reçue (`FRONTEND_PROMPT_DOSSIER_VISIBILITE_NON_RESPONSABLE.md`) :
  - [x] `GET /dossier-commun?module=` renvoie désormais tous les dossiers du module
  - [x] Un seul autre endpoint concerné : aucun — seul `GET /dossier-commun` filtrait par responsable
  - [x] Format exposé : les deux — `isResponsable` (dossier + par colab) et `responsable: {id,nom,prenom}`
        (dossier, seulement si requête avec `?module=`)
  - [~] 403 sur mutations : livré pour le module ticketing/billet (10 routes), reste à faire pour
        hôtel/visa/attestation/assurance/prospection (Phase 2)

## Phase 1 — Affichage lecture seule ✅ fait

- [x] Types mis à jour (`dossierCommunSlice.ts`) : `DossierCommun.isResponsable`/`.responsable`,
      `DossierCommunColab.isResponsable`
- [x] Emplacement choisi : **Option A**, affiné en deux endroits (pas l'AppBar — voir note ci-dessous) :
  - badge "Lecture seule" dans `Sidebar.tsx`, à côté du sélecteur de dossier actif
  - badge "Lecture seule" dans `ListeDossierByModule.tsx`, à côté du numéro de dossier dans la liste
  - Note sur l'AppBar (Option B) : écartée pour cette phase — `AppBar.tsx` est rendu hors de l'arbre
    des routes de module (`module` n'y est pas disponible nativement, contrairement à `Sidebar`/aux
    pages qui le reçoivent déjà en prop). Ajouter ce contexte à l'AppBar serait un chantier à part ;
    à reconsidérer si le client y tient après avoir vu le rendu actuel.
- [x] Implémenté — texte seul, aucun bouton désactivé à ce stade
- [x] Bug de régression trouvé et corrigé au passage : `Sidebar.tsx` dérivait le dossier actif
      (`activeDossier`) et l'auto-sélection à partir de la liste globale `dossiers` (`state.
      dossierCommun.data`), qui reste restreinte aux dossiers où l'utilisateur est affecté (confirmé
      par le backend, §3) — un dossier non-responsable ouvert depuis `ListeDossierByModule.tsx`
      n'y apparaît jamais. Sans correctif, la Sidebar aurait affiché "Aucun dossier" et l'auto-sélection
      aurait réécrasé le dossier actif. Corrigé en vérifiant l'appartenance au module directement sur
      `currentClientFactureId`, indépendamment de cette liste restreinte.
- [x] Testé en conditions réelles — confirmé fonctionnel (le badge n'apparaît pas pour un compte
      ADMIN, ce qui est le comportement attendu : un admin est toujours responsable de tout)
- [x] Colonne "Responsable" (nom visible, pas seulement en infobulle) ajoutée dans
      `ListeDossierByModule.tsx`, entre "Statut" et "Description"

## Phase 2 — Désactivation des actions (plus tard, module par module)

- [ ] Lister les boutons d'action concernés par module (ticketing, hôtel, visa, assurance, attestation) —
      créer/modifier/supprimer/valider/transformer, etc.
- [ ] Créer ou étendre un hook de type `useAuthorization` (ex. `isResponsable(dossier)`) pour centraliser
      la vérification, plutôt que de la dupliquer page par page
- [ ] Désactiver (pas masquer) les boutons un module à la fois, dans cet ordre suggéré : ticketing → hôtel
      → les autres (à ajuster selon priorité business)
- [ ] Revalider à chaque module que :
  - [ ] le bouton est bien désactivé en UI pour un non-responsable
  - [ ] l'action est bien refusée côté backend (403) même en contournant l'UI (sécurité, pas seulement
        cosmétique)
- [ ] Mettre à jour `PRODUCTION_CHECKLIST.md` si cette tâche y a sa place une fois terminée
