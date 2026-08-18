# Prompt à donner au frontend — Pagination des listes à fort volume

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo frontend.
> Fait suite à `BACKEND_PROMPT_PAGINATION.md` : le backend a implémenté la pagination + recherche sur les 13 endpoints à volume élevé identifiés. Ce prompt donne le contrat exact de chaque endpoint pour câbler les écrans correspondants.

---

## Contexte

Le backend a ajouté `page`/`limit` (+ recherche et filtres) sur 13 endpoints qui renvoyaient jusqu'ici une liste complète chargée en mémoire côté client. **Le changement est rétrocompatible** : tant qu'un écran n'envoie pas `page`/`limit`, l'endpoint renvoie exactement la même chose qu'avant (liste brute, sans enveloppe `{data, meta}`). Rien ne casse tant que ce prompt n'est pas traité — vous pouvez migrer les écrans un par un, à votre rythme, sans coordination serrée avec le backend (contrairement à la migration auth cookies qui, elle, était bloquante dès le premier login).

**Convention commune à tous les endpoints ci-dessous** (identique à `GET /controle/paginated`, déjà utilisé dans l'app) :
- Query params : `page` (défaut 1), `limit` (défaut 10, plafonné à 100 côté serveur), `search` (texte libre, insensible à la casse) + filtres spécifiques par endpoint (voir tableau).
- Dès que `page` **ou** `limit` est présent dans la requête, la réponse passe en mode paginé : `{ data: [...], meta: { total, page, limit, totalPages } }`. Sans eux, réponse legacy inchangée (tableau brut, ou forme spécifique selon l'endpoint).
- Valeurs de `page`/`limit` invalides ou absentes retombent silencieusement sur les défauts côté serveur — pas besoin de valider strictement avant l'envoi.

## Endpoints traités (contrat détaillé)

| # | Endpoint | Query params disponibles | Notes |
|---|---|---|---|
| 1 | `GET /client-factures` | `page`, `limit`, `search` (code/libellé), `statut` | — |
| 2 | `GET /compagnie-clients` | `page`, `limit`, `search` (identifiant/n° carte/nom client bénéficiaire/nom fournisseur) | — |
| 3 | `GET /suivi` | `page`, `limit`, `search` (référence BC/FAC, évolution), `statut`, `entity` | Pas de filtre par plage de dates pour l'instant (table à 8 champs date différents selon l'étape du workflow, pas de champ "pivot" évident) — à demander si un écran de recherche en a besoin. |
| 4 | `GET /client-beneficiaires` | `page`, `limit`, `search` (code/libellé), `statut`, `typeClient` | — |
| 5 | `GET /client-beneficiaires/all-miles` | `page`, `limit`, `search` (code/libellé), `statut`, `typeClient` | Même filtres que #4, forme de réponse `data[]` inchangée (chaque élément garde `{beneficiaire, milesCompagnie, milesABT}`). |
| 6 | `GET /clientbeneficiaire-infos` | `page`, `limit`, `search` (nom/prénom/nationalité/référence doc/tél), `statut`, `typeDoc`, `clientType`, `validite` (`valide` ou `expire`, compare la date de validité du document à aujourd'hui) | Volume le plus élevé potentiel de la liste. |
| 7 | `GET /dossier-commun` | `page`, `limit`, `search` (description/contact/référence travel planner), `statut` | Reste filtré sur l'utilisateur connecté comme avant (jamais un vrai fetch global). |
| 8 | `GET /todolists` | `page`, `limit`, `search` (objet du rappel), `statut` (ex. `FAIT` = terminé), `type` (`URGENT`/`NORMAL`/`FAIBLE`), `periode` (`passe` ou `avenir`, compare la date du rappel à maintenant) | `periode` + `statut=FAIT` couvrent les filtres "anciens / à venir / terminés" déjà faits en JS aujourd'hui. |
| 9 | `GET /sav/rappel-ticketing` | `page`, `limit`, `search` (texte du rappel), `statut`, `clientBeneficiaireId`, `billetLigneId` | ⚠️ Voir point de vigilance routage ci-dessous. |
| 10 | `GET /sav/sondage` | `page`, `limit`, `search` (n° envoi, nom/code client), `statut`, `clientBeneficiaireId`, `lienSondageId` | ⚠️ Voir point de vigilance routage ci-dessous. |
| 11 | `GET /billet/search-by-date-range` | `startDate`, `endDate` (toujours requis, inchangé) + `page`, `limit`, `search` (PNR/nom passager), `statut` | La recherche cible les vrais champs sous-jacents aux colonnes affichées (`pnr`, `nom`) — le nom de l'agent (`owner`) n'est pas cherchable pour l'instant. |
| 12 | `GET /profilage/all` | `page`, `limit`, `search` (code/libellé client) | Chaque page de clients déclenche un calcul de profil par client côté serveur (plusieurs requêtes par client) — privilégier une `limit` raisonnable (10–20) sur cet écran plutôt qu'une grosse page. |
| 13 | `GET /hotel/stats/plateforme/par-date` | `du`, `au` (toujours requis, inchangé) + `page`, `limit` (pas de `search`) | **Forme de réponse différente des autres** : la structure groupée par plateforme est conservée (`plateformes: [...]`), c'est le tableau `reservations` *à l'intérieur de chaque groupe* qui est paginé, avec un `reservationsMeta: {total, page, limit, totalPages}` ajouté par groupe. Les totaux agrégés par plateforme (`nombreReservations`, montants) restent calculés sur toute la période, pas juste la page affichée — ne pas les recalculer côté client à partir de `reservations.length`. |

## ⚠️ Point de vigilance — bug de routage repéré côté backend (#9 et #10)

En creusant le controller `sav.controller.ts` pour brancher la pagination, une anomalie préexistante (indépendante de ce chantier) a été repérée : `GET /sav/rappel-ticketing/:id` et `GET /sav/sondage/:id` sont déclarés **avant** leurs sous-routes plus spécifiques (`/range`, `/client/:id`, `/billet/:id`, `/lien/:id`). Comme Express/Nest matche les routes dans l'ordre de déclaration, `:id` capture probablement ces sous-routes en premier — si votre app appelle `GET /sav/rappel-ticketing/range` ou `GET /sav/sondage/client/:id` quelque part, vérifiez que la réponse reçue est bien celle attendue (et pas une erreur "non trouvé" qui viendrait de `findOneRappelTicketing`/`findOneSondage` appelé avec un id invalide). Le backend n'a pas corrigé ce point (hors périmètre pagination) — à confirmer si ça vous impacte, on le traite séparément si besoin.

## Ce qu'il faut faire côté frontend

Pour chaque écran qui charge aujourd'hui une des 13 listes ci-dessus en entier puis filtre/recherche en JS (`useMemo`/`.filter()` sur le tableau complet) :
1. Passer l'appel API en mode paginé (envoyer `page`/`limit`).
2. Remplacer le filtrage/recherche JS local par l'envoi des query params correspondants (`search` + filtres du tableau ci-dessus) — le backend fait le filtrage, plus besoin de charger toute la liste pour ça.
3. Adapter l'affichage pour consommer `{ data, meta }` (pagination UI : boutons page suivante/précédente, ou infinite scroll selon l'écran, en s'appuyant sur `meta.totalPages`).
4. Pour #13 spécifiquement : gérer la pagination `reservations` par groupe de plateforme séparément (chaque plateforme peut être à une page différente si vous paginez indépendamment par groupe, ou synchronisée si un seul contrôle de pagination pilote tous les groupes — à votre convenance).

Pas besoin de tout migrer d'un coup : chaque endpoint est utilisé par un seul écran, la bascule peut se faire écran par écran.

## Ce dont le backend a besoin en retour

- Pour chaque écran migré, confirmation que la recherche/les filtres côté serveur couvrent bien ce qui était fait en JS avant (sinon, dites lesquels manquent — ex. plage de dates sur `/suivi`, ou recherche sur le nom de l'agent pour `/billet/search-by-date-range` — et on les ajoute).
- Confirmation ou non que le bug de routage `/sav/rappel-ticketing/:id` et `/sav/sondage/:id` vous impacte réellement en pratique.
- Une fois un écran testé et validé en pagination : pas besoin de prévenir le backend, contrairement à la migration auth — chaque endpoint reste rétrocompatible indéfiniment (pas de mode dual à retirer plus tard), sauf si vous voulez explicitement qu'on supprime le comportement legacy sur un endpoint donné.

## Phase 2 (non traitée, pas urgente)

Trois endpoints à volume modéré n'ont pas été traités (jugés non prioritaires par le prompt initial) : `GET /miles-transaction/client/{clientId}` (déjà borné à un client), `GET /fournisseurs` (utilisé comme source de dropdowns partout dans l'app — paginer casserait ces usages sans coordination), `GET /users` (borné par l'effectif de l'agence). Dites si l'un d'eux devient prioritaire de votre côté.
