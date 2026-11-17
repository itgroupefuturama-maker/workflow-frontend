# Analyse — le bouton « Reporter » (informations passager du billet)

> Analyse faite **uniquement à partir du code frontend** (le code backend n'est pas dans ce dépôt).
> Les points marqués **[à confirmer backend]** sont des déductions à valider.

## 1. Où se trouve le bouton

Page **Billet** → tableau « Lignes du billet » → colonne **Passagers & Billets** → une ligne par passager → icône **horloge** (avant : bouton « Reporter » dans la carte dépliée).

Fichiers :
- `ticketing.sous.module/components.billet/PassagersCell.tsx` : bouton + fenêtre de confirmation ;
- `ticketing.sous.module/Billet.tsx` : `handleReporter(ligne)` ;
- `app/front_office/billetSlice.ts` : thunk `reporterLigne` → `PATCH /billet/:id/reporter` ;
- `ticketing.sous.module/components.billet/utils/ReporterDialog.tsx` : **fenêtre avec choix d'une nouvelle date, jamais utilisée** (code mort).

## 2. Ce que fait le code aujourd'hui

```
Clic « Reporter » (passager X, statut PLANIFIE)
   └─ fenêtre « Reporter le billet — X » → « Confirmer »
        └─ handleReporter(ligne)                      // la LIGNE de vol, pas le passager
             └─ PATCH /billet/{ligne.id}/reporter     // aucun corps : ni date, ni motif
                  └─ rechargement du billet (fetchBilletById)
```

| Élément | Constat |
|---|---|
| Condition d'affichage | Actif seulement si le **billet passager** est au statut `PLANIFIE` |
| Donnée envoyée | Uniquement l'**id de la ligne billet**, sans date, sans motif, sans passager |
| Portée réelle | **Toute la ligne de vol**, donc tous ses passagers (le commentaire du code le confirme : « reporterLigne utilise ligne.id, pas l'id du billet passager ») |
| Retour à l'agent | Aucun message de succès ; seulement un message en cas d'erreur |
| Statuts connus | Billet passager : `PLANIFIE`, `REPORTE`, `ANNULE` (filtres de la page **Liste des passages**, `PageListePassage.tsx`) |

## 3. À quoi ça sert (déduction)

Le statut `PLANIFIE` est attribué au billet passager une fois émis. La page **Liste des passages** (départs à venir, avec PNR, n° de vol, statut) filtre sur `PLANIFIE` / `REPORTE` / `ANNULE`.

→ « Reporter » sert à **signaler qu'un vol planifié n'aura pas lieu à la date prévue** : le passager ne voyage pas ce jour-là (billet « open » / départ repoussé). Il passe en `REPORTE`, et sort donc des départs planifiés (rappels, liste des passages). **[à confirmer backend : quels champs et quels traitements — rappels, sondages, miles — sont modifiés]**

### Différence avec « Reprogrammer »

| | Reporter | Reprogrammer |
|---|---|---|
| Nouvelle date | **Non** (aucune date envoyée) | Oui |
| Frais / pénalité / changement de classe | Non | Oui (frais, prise en charge client / agence) |
| Nouvelle ligne billet | Non | Oui (ancienne ligne en `MODIFIER`) |
| Odoo | **Inconnu** [à confirmer] | Remet le billet en `CREER`, à renvoyer à Odoo |
| Usage | « Le passager ne part pas à la date prévue, date future inconnue » | « On connaît la nouvelle date / classe » |

## 4. Problèmes relevés

1. **Bouton par passager, action sur toute la ligne** : l'agent clique sur un passager, mais tous les passagers de la ligne sont reportés. *Corrigé côté affichage :* la fenêtre l'indique maintenant clairement (« s'applique à toute la ligne de vol (N passagers) »).
2. **Aucune date ni motif** : on ne sait pas pourquoi ni jusqu'à quand le vol est reporté. `ReporterDialog.tsx` prévoit une date mais n'est branché nulle part.
3. **Message « irréversible »** : aucune action « Annuler le report » ou « Replanifier » n'existe. Que fait l'agent quand le client donne sa nouvelle date ? Probablement une **reprogrammation** [à confirmer].
4. **Statut `REPORTE` sans libellé** dans `utils/statut.ts` (affiché brut). *Corrigé :* libellé « Reporté » ajouté.
5. **Pas de confirmation de succès** après le report.
6. **Nom trompeur côté API** : `reporterLigne(billetId)` reçoit en réalité un id de **ligne** billet (bug déjà corrigé une fois, voir `PRODUCTION_CHECKLIST.md`).
7. **Aucune documentation** de la route `PATCH /billet/:id/reporter` dans les fichiers `FRONTEND_PROMPT_*` (contrairement à l'annulation, la reprogrammation ou l'émission).

## 5. Questions pour le backend / le métier

1. Que modifie exactement `PATCH /billet/:id/reporter` ? Statut des billets passagers → `REPORTE` ? Statut de la ligne billet ? Statut du billet (en-tête) ?
2. Le report doit-il concerner **un passager** ou **toute la ligne** ? (Le bouton est par passager.)
3. Faut-il une **date prévisionnelle** et/ou un **motif** (champs `dateReport`, `motifReport`) ?
4. Effets de bord : rappels / sondages / miles supprimés ou décalés ? Envoi à **Odoo** ?
5. Comment sortir d'un report : reprogrammation obligatoire, ou action « Replanifier » ?
6. Réponse attendue : renvoie-t-elle la ligne mise à jour (pour éviter un rechargement complet) ?

## 6. Recommandation

- **Court terme (fait)** : message clair sur la portée (toute la ligne), libellé « Reporté », design simplifié (icône horloge avec info-bulle).
- **Après réponse du backend** :
  - si le report est **par passager** → envoyer l'id du billet passager (route dédiée) ;
  - ajouter **motif** (obligatoire) + **date prévisionnelle** (optionnelle) en réutilisant `ReporterDialog.tsx`, sinon supprimer ce fichier mort ;
  - afficher un message de succès et, sur une ligne reportée, un bouton **« Reprogrammer »** pour donner la nouvelle date ;
  - documenter la route dans un `FRONTEND_PROMPT_REPORT_BILLET.md`.
