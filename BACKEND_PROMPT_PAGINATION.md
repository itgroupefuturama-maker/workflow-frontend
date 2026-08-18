# Prompt à donner au backend — Pagination des listes à fort volume

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Objectif : plusieurs endpoints renvoient actuellement une liste complète (aucun `page`/`limit`), chargée entièrement en mémoire côté frontend puis filtrée/recherchée en JS. Ça ne passera pas à l'échelle une fois la donnée réelle accumulée (des mois/années d'usage) — temps de réponse, mémoire navigateur, UX de recherche qui ralentit avec le volume.

---

## Contexte

Le frontend (React/Vite, repo séparé) charge aujourd'hui plusieurs listes en une seule requête sans pagination, puis fait la recherche/le filtrage entièrement côté client (`useMemo`/`.filter()` sur le tableau complet déjà en mémoire). C'est tenable tant que le volume est faible, mais plusieurs de ces listes correspondent à des données qui s'accumulent en continu (dossiers, tickets, todos, factures clients...) et grossiront indéfiniment.

**Convention déjà en place à généraliser** — un endpoint est déjà paginé côté backend et fonctionne bien, à prendre comme référence pour tous les nouveaux :
- `GET /controle/paginated?page=<n>&limit=<n>`
- Réponse : `{ success: true, data: { data: [...], meta: { total, page, limit, totalPages } } }`

On aimerait le même contrat (mêmes noms de paramètres et même enveloppe de réponse) sur les endpoints listés ci-dessous, pour rester cohérent et ne pas avoir un format différent par écran.

## Endpoints à paginer (volume élevé, priorité haute)

Ce sont des entités qui s'accumulent en continu avec l'activité de l'agence — sur plusieurs mois/années ça peut représenter des milliers de lignes.

| Endpoint actuel | Utilisé pour | Pourquoi ça devient un problème |
|---|---|---|
| `GET /dossier-commun` | Liste des dossiers communs (écran principal de gestion) | Un dossier par vente ; recherche déjà faite en JS sur la totalité chargée |
| `GET /suivi` | Fetch global de tous les suivis (devis/billet/attestation/assurance confondus) | **Cas le plus critique** — aucun filtre, potentiellement un suivi par action sur tout le système, le code frontend a même un commentaire de doute du dev sur ce fetch global |
| `GET /todolists` | Liste des rappels/todos | Un todo par prestation, recherche + filtres (anciens/à venir/terminés) faits en JS |
| `GET /profilage/all` | Profilage calculé par client | Un enregistrement par client, croît avec la base clientèle |
| `GET /client-beneficiaires/all-miles` | Miles par client bénéficiaire | Idem, un enregistrement par client |
| `GET /client-beneficiaires` | Liste des clients bénéficiaires (paramétrage back-office) | Recherche/filtre déjà en JS sur toute la liste, croît avec chaque nouveau client |
| `GET /client-factures` | Comptes de facturation clients | Idem, recherche en JS sur toute la liste |
| `GET /billet/search-by-date-range` | Liste passagers/billets par plage de dates | Une plage large peut ramener des centaines de lignes, recherche + filtres multiples en JS |
| `GET /compagnie-clients` | Comptes miles client × compagnie aérienne | Un enregistrement par (client, compagnie), recherche + filtres en JS |
| `GET /sav/rappel-ticketing` | Rappels SAV | Un rappel potentiel par ligne de billet, s'accumule en continu |
| `GET /sav/sondage` | Sondages SAV | Même profil que les rappels SAV |
| `GET /clientbeneficiaire-infos` | Infos passeport/passager de tous les clients | **Volume le plus élevé potentiel** — tous les passagers de tous les clients/dossiers/compagnies confondus, recherche + filtres de validité en JS |
| `GET /hotel/stats/plateforme/par-date` | Réservations hôtel par plateforme (tableau de bord) | Les `reservations[]` imbriquées par plateforme peuvent devenir volumineuses sur une longue période sélectionnée |

**Cas à volume modéré, priorité plus basse** (à discuter, pas urgent mais à garder à l'œil) :
| Endpoint actuel | Utilisé pour | Remarque |
|---|---|---|
| `GET /miles-transaction/client/{clientId}` | Historique miles d'un seul client | Historique transactionnel qui peut grossir sur plusieurs années, mais déjà borné à un client à la fois |
| `GET /fournisseurs` | Liste des fournisseurs/compagnies | Pas figé comme un vrai référentiel, utilisé comme source de dropdowns partout dans l'app — à trancher selon la taille réelle attendue |
| `GET /users` | Comptes utilisateurs internes | Borné par l'effectif de l'agence, probablement jamais critique sauf grosse structure |

## Important : la recherche doit suivre, pas juste la pagination

Sur presque tous les écrans ci-dessus, le frontend fait actuellement une **recherche texte + des filtres côté client** sur la liste complète déjà chargée (nom, statut, plage de montant, plage de dates, etc. selon l'écran). Si on ajoute juste `page`/`limit` sans que le backend accepte aussi ces mêmes critères en paramètres de requête, on casse la recherche existante (elle ne s'appliquerait plus que sur la page affichée). Pour chaque endpoint ci-dessus, on va avoir besoin en plus de `page`/`limit` d'au moins :
- un paramètre de recherche texte libre (ex. `search`),
- les filtres déjà utilisés à l'écran correspondant (on précisera le détail exact par endpoint au moment de câbler chaque écran côté frontend, une fois que vous confirmez que c'est faisable côté backend).

Pas besoin de tout spécifier dans le détail dès maintenant — dites-moi juste si c'est acceptable comme principe général, et on affinera écran par écran pendant l'implémentation.

## Endpoints déjà paginés (référence, rien à faire)

- `GET /controle/paginated` (`controleSlice.ts`)
- Deux endpoints du tableau de bord (`dashboardSlice.ts` : `fetchStatParDossier`, `fetchEtatVente`) sont déjà correctement paginés côté requête et retournent déjà `meta.total`/`meta.totalPages`.

## Stratégie de transition

Contrairement à la migration auth (où beaucoup de code consommait les mêmes tokens), chaque endpoint ci-dessus est utilisé par un seul écran frontend clairement identifié. Pas besoin d'un mode dual complexe : on peut traiter **endpoint par endpoint**, dans l'ordre de priorité qui vous arrange, et coordonner la mise à jour du composant frontend correspondant au fur et à mesure que chaque endpoint est prêt côté backend. Pas besoin de tout livrer d'un coup.

## Ce dont j'ai besoin en retour

Pour chaque endpoint que vous traitez, merci de confirmer :
- Les noms de paramètres retenus (`page`/`limit`, ou autre convention si vous préférez — dites-le et on s'aligne).
- Le format exact de la réponse (si vous gardez `{ data: { data: [...], meta: {...} } }` comme `/controle/paginated`, rien à ajouter ; sinon précisez).
- Si le paramètre de recherche/filtres est ajouté en même temps que la pagination ou dans un second temps.
- L'ordre dans lequel vous comptez les traiter, pour que je prépare le câblage frontend au fur et à mesure plutôt que d'attendre que tout soit fini.
