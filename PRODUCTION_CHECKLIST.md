# Fiche de suivi — Préparation mise en production

> Dernière mise à jour : 2026-08-06
> Comment l'utiliser : coche les cases au fur et à mesure (`[ ]` → `[x]`), ajoute des notes sous chaque tâche si besoin. Ce fichier vit dans le repo, donc on peut reprendre exactement où on s'est arrêté d'une session à l'autre.

Légende statut : `[ ]` à faire · `[~]` en cours · `[x]` terminé

---

## 🔴 Bloquant avant mise en production

- [x] **`npm run build` échouait — était 241 erreurs TypeScript dans 84 fichiers** *(découvert le 2026-08-06, résolu le 2026-08-14)*
  - **Vague 1 terminée (2026-08-06)** : les 114× `TS6133` (imports/variables inutilisés) + 25× `TS7006`/`TS7031` (`any` implicite) sont corrigés — 139 erreurs éliminées sur 67 fichiers, via 3 agents en parallèle. Vérifié : plus aucune occurrence de ces 3 codes, aucune régression détectée (spot-check des diffs les plus gros, ex. `DossierActifCard.tsx`, `DetailAttestation.tsx`), `git diff --stat` : 82 fichiers modifiés, +1316/-1061 lignes.
  - **Vague 2 terminée (2026-08-14)** : 101 → 43 → **0 erreur**. `npx tsc -b --noEmit` et `npm run build` passent intégralement (vite build OK, 3074 modules).
    - ✅ 42× `TS2740` corrigées — un seul fichier (`src/utils/exportAgentIataExcel.ts`), le paramètre `align` de `setCell` était typé `ExcelJS.Alignment` (toutes propriétés requises) au lieu de `Partial<ExcelJS.Alignment>`. Fix d'une ligne, purement au niveau du type.
    - ✅ 8× `TS2345` corrigées (cluster Assurance/Visa) — `AssuranceDevisDetail`/`VisaDevisDetail` étaient définis deux fois indépendamment (une fois dans les slices `assuranceProspectionSlice.ts`/`visaDevisSlice.ts`, une fois dans `module.pdf/pdf.generation/types/*.types.ts`), et les deux versions avaient divergé. Les slices sont maintenant la source unique de vérité ; les fichiers `assurance.types.ts`/`visa.types.ts` réexportent depuis les slices.
      - Au passage, deux vrais oublis de type trouvés et corrigés dans les slices (champs bien utilisés par les générateurs PDF mais absents du type) : `assuranceProspectionLignes[]` manquait `assuranceParams`/`assuranceTarifReduit` (assurance), `prospectionVisa` manquait `clientFacture`/`consulat` (visa).
      - Un vrai bug potentiel révélé au passage et corrigé : `assurance.generator.ts:53` appelait `fmt.replace_(suivi.evolution)` sans protection alors que `suivi.evolution` peut être `null` (aurait crashé la génération PDF si l'évolution du suivi n'est pas renseignée). Protégé avec `suivi.evolution ? fmt.replace_(...) : '—'`, même pattern que les champs voisins.
    - ✅ 9× `TS18047`/`TS18048` corrigées (accès null/undefined non protégés) — **le groupe le plus à risque, tous vérifiés un par un** :
      - `PageDetailVisa.tsx` (3 erreurs) : `detail.id`/`detail.visaLigne` utilisés sans garde dans le rendu des modals (`CreateAccesPortailModal`, `SubmitVisaLigneModal`), alors que `detail` peut être `null`. Fonctionnellement sans risque (les boutons qui ouvrent ces modals ne sont rendus que quand `detail` existe déjà), mais TS ne peut pas le déduire. Ajout d'une garde `detail &&` sur les deux blocs, cohérent avec le style du reste du fichier.
      - `Fournisseur.tsx` (2 erreurs) : `trans.transactiontype` est typé nullable (`TransactionType | null`) mais utilisé directement (`trans.transactiontype.transactionType`). Ajout de `?.` + fallback `'—'`, même pattern que `trans.module?.nom || 'Sans module'` juste au-dessus.
      - `Prospection.tsx` (2 erreurs) : `suggestionAnchor?.bottom`/`.top` (un `DOMRect | null`) utilisés dans un calcul arithmétique sans fallback. Ajout de `?? 0` — sans impact car ces valeurs ne sont utilisées que quand `suggestionAnchor` est non-null.
      - `PageProfilage.tsx` (2 erreurs) : `percent` du callback `label` de Recharts est typé `number | undefined`. Ajout de `?? 0`.
    - ✅ **43 dernières erreurs corrigées (2026-08-14, 4 agents en parallèle par domaine fonctionnel)** :
      - **Types PDF dupliqués (attestation/hotel/devis)** : même pattern que le cluster Assurance/Visa — les types `*Item` de `module.pdf/pdf.generation/types/*.types.ts` avaient divergé des slices Redux sources. Unifiés. Champs manquants ajoutés aux slices (`statusLigne`/`origineLine` attestation, `status` fournisseur hôtel, `dateLimiteAnnulation` benchmarking hôtel). Chemin d'import cassé corrigé dans `hotel.types.ts` (`hotelDevisSlice` introuvable).
      - **Pattern de bug généralisé `dispatch(thunk).then(r => r.payload?.error)`** : les thunks utilisent `rejectWithValue(message: string)`, donc `payload` est soit l'entité créée, soit directement une string — `.error` n'existe jamais. **Ce check ne détectait donc jamais un échec API** (le formulaire se fermait comme si ça avait réussi). Corrigé dans `ParametreViewHotel.tsx` (+ un cas où le résultat n'était même pas vérifié pour `createTypeChambre`) et `DeviseListe.tsx`, en utilisant les matchers RTK (`.fulfilled.match()`).
      - **Ticketing/Prospection** : `modePaiement` choisi par l'utilisateur dans le formulaire de prospection était **commenté dans la construction du payload** — jamais envoyé au backend. Décommenté. Le report de vol (`BilletTable.tsx`) envoyait l'id du ticket passager au lieu de l'id de la ligne de vol à `reporterLigne` — corrigé.
      - **`InlineClientForm.tsx`** : l'appel `createClientPerson` omettait complètement `beneficiaireId`, ce qui aurait cassé le `fetchClientInfo` déclenché après création côté thunk — corrigé.
      - **`FormulaireDemandeClient.tsx`** : la chaîne vide `""` est le marqueur métier "nouvel attribut" attendu par l'API, mais était convertie en `undefined` juste avant l'envoi (`|| undefined`), cassant ce contrat pour tous les attributs custom — corrigé.
      - **`AccueilView.tsx`** : le filtre de recherche du tableau de bord (`dateDebut`/`dateFin`) était **silencieusement inopérant** — l'API (`EtatVenteParams`) n'accepte que `year`/`month`/`quinzaine`, ces deux champs n'étaient jamais lus côté backend. Corrigé en convertissant vers les bons params.
      - **`RappelsTable.tsx`/`todosSlice.ts`** : type trop restrictif empêchait `type: 'NORMAL'` alors que l'UI propose bien Normal/Urgent ; `Todo.rappel.type` manquait au type alors que lu par l'UI (`isUrgent`). Corrigés.
      - Reste de la liste (types trop stricts/laxistes divers, props manquantes, imports morts, `BreadcrumbItem` non exporté, etc.) : corrigés au cas par cas après lecture du contexte réel, sans `as any` ni `?.`/`??` à l'aveugle — deux casts ciblés et commentés ont été nécessaires (`ClientBeneficiaireInfosForm.tsx`, `ClientFactureForm.tsx`) faute de pouvoir modifier les slices sources (hors périmètre de la tâche), à corriger proprement plus tard en typant `rejectValue` et `creditdefault` à la source.
      - **1 régression introduite en cours de route repérée et corrigée** : la cascade d'unification des types hôtel/devis avait cassé `ModalHotelPdfSelector.tsx` (`normalizeDevisToEntete` appelé avec le mauvais type). Corrigé en alignant `HotelPdfInput['devis']` sur le vrai type attendu (`HotelDevisData`).
  - `npm run lint` a encore ~715 erreurs, mais toutes pré-existantes et déjà couvertes par les items dédiés plus bas (654× `any` explicites, `exhaustive-deps`, etc.) — aucune régression de lint introduite par la vague 2.
  - **Rien n'est encore committé** — tout est dans le working tree (`git status --short` : 122 fichiers).
  - Commande de vérification : `npx tsc -b --noEmit` (0 erreur) / `npm run build` (OK)

- [~] **Sécurité des tokens d'auth** — `token`, `refresh_token`, `user` stockés en `localStorage` (`authSlice.ts`, `Axios.tsx`, `LoginPage.tsx`), accessibles en JS donc vulnérables en cas de XSS. Pas de cookie HttpOnly.
  - Décision : migration vers cookie httpOnly, avec changement côté backend en plus du frontend.
  - Prompt de brief backend rédigé → voir `BACKEND_PROMPT_AUTH_COOKIES.md` (à copier-coller sur le repo backend, autre machine).
  - **Bloqué en attente du retour backend** : noms des cookies, nom du header/cookie CSRF, endpoint `/auth/logout`, attributs SameSite/Secure retenus.
  - Une fois le retour reçu : mettre à jour `src/service/Axios.tsx`, `src/app/authSlice.ts`, `src/pages/LoginPage.tsx`, connexion Socket.io (`FrontOfficeLayout.tsx`).
- [x] **ErrorBoundary non branché** — corrigé le 2026-08-06 : `ErrorBoundary` importé et englobe `<App />` dans `src/main.tsx`.
- [x] **URL de fallback en dur dans `env.ts`** — corrigé dans le working tree (`http://andry:5050` supprimé, ne dépend plus que de `VITE_API_URL`). *(déjà fait, à commit)*
- [x] **`.env.example` non versionné** — vérifié le 2026-08-18 : le fichier est en fait déjà tracké dans le repo (`git ls-files` le confirme). Rien à faire, l'item était obsolète.
- [x] **Socket.io sans authentification** *(fix frontend le 2026-08-14, backend confirmé le 2026-08-14)* — `FrontOfficeLayout.tsx` et `ListeParametreLayout.tsx` se connectaient à `VITE_API_URL` sans jamais passer le token. Ajouté l'envoi du token à la connexion.
  - **Backend implémenté et testé** (voir `FRONTEND_PROMPT_SOCKET_AUTH.md`, réponse du backend) : le handshake valide le JWT dans `socket.handshake.auth.token`, rejette (`connect_error: unauthorized`) si absent/invalide/expiré, et les notifications sont maintenant ciblées par room `userId` au lieu d'un broadcast à tous les clients connectés.
  - **Point de vigilance soulevé par le backend, traité** : `auth: { token }` est un objet figé à la création du socket — si Socket.io reconnecte automatiquement en interne (coupure réseau, sans passer par React) après un changement de token, il aurait renvoyé l'ancien token. Remplacé par une fonction (`auth: (cb) => cb({ token: store.getState().auth.token })`) dans les deux fichiers, qui relit le token courant à chaque tentative. Le cas "React recrée le socket sur changement de token" était déjà correct de son côté (`token` est déjà dans les deps de l'effet), et le logout déconnecte déjà bien le socket (`logout` met `token: null` → cleanup de l'effet).
  - **Décision prise** : garder le comportement par défaut de Socket.io (5 tentatives de reconnexion avant abandon) même en cas de rejet pour auth invalide — coût faible, pas de UX dégradée constatée. À revisiter seulement si l'expiration de session en cours d'usage s'avère fréquente en pratique.
  - **À tester manuellement (runtime, backend+frontend démarrés ensemble)**, pas vérifiable par simple lecture de code : connexion normale après login, déconnexion propre au logout, notifications reçues par le bon utilisateur, comportement visuel si la session expire pendant que le socket est ouvert, multi-onglets.
  - `npx tsc -b --noEmit` : toujours 0 erreur après ce fix.
- [ ] **Aucun test automatisé** — pas de vitest/jest/testing-library installé, 0 fichier `*.test.tsx`. Risque élevé de régressions silencieuses en prod.
  - Suggestion : commencer petit — tests sur les fonctions critiques (calculs de prix, export Excel, auth) avant tout.
- [x] **Build à vérifier** — `npm run build` (tsc -b + vite build) passe sans erreur (2026-08-14). `npm run lint` tourne mais remonte ~715 erreurs pré-existantes (voir items dédiés plus bas) ; pas bloquant pour le build lui-même.

---

## 🟠 Important (fortement recommandé avant/juste après le lancement)

- [x] **86 `console.log` / 43 `console.error` / 9 `console.warn`** oubliés dans le code *(traité le 2026-08-18)* — dont le log de debug à chaque navigation dans `ProtectedRoute.tsx` (chemin + profils utilisateur exposés en prod), corrigé en premier.
  - `console.log` : tous supprimés (résidus de debug) — il n'en reste que 2, dans du code déjà commenté (`PageFormulairePassager.tsx`).
  - `console.warn` : supprimés sauf 6, tous dans les generators PDF (`pdf-base.ts`, `*.generator.ts`) — avertissement métier volontaire (échec de chargement d'un cachet/logo, non bloquant pour la génération), laissés tels quels à dessein.
  - `console.error` : conservés (pas de Sentry en place, seule visibilité sur les erreurs runtime), mais un `toast.error(...)` a été ajouté à côté de chaque catch qui n'avait encore aucun retour visible pour l'utilisateur (~15 ajouts). Ceux qui alimentaient déjà un état d'erreur affiché en JSX ont été laissés sans toast pour ne pas dupliquer le message. `src/service/Axios.tsx` (intercepteur global) volontairement laissé sans toast pour éviter les doublons avec les toasts ajoutés dans chaque appelant. `ErrorBoundary.tsx` non touché (fallback UI déjà géré).
  - Fait via 4 agents en parallèle par domaine fonctionnel (state/infra, PDF/modals/assurance/visa/attestation, ticketing/billet/prospection, hôtel/état-vente/dossier-commun/paramètres). `npx tsc -b --noEmit` et `npm run build` passent toujours à 0 erreur après coup.
  - **Rien n'est encore committé** — tout est dans le working tree.
- [x] **87 `alert()` natifs** *(traité le 2026-08-18)* — tous remplacés par le composant `Toast` (`toast.success/error/warning/info`) déjà en place et monté dans `App.tsx`. Messages de validation/champ manquant → `toast.warning`, échecs → `toast.error`. Il n'en reste que dans du code déjà commenté (`SuiviTabContent.tsx`, `SuiviActions.tsx`, `PageFormulairePassager.tsx`) et le commentaire de doc dans `toast.ts` lui-même. Aucun `confirm()`/`window.confirm()` touché.
- [ ] **Aucun code splitting** — 0 `React.lazy`/`Suspense`, ~60 pages importées statiquement dans les routes → bundle initial lourd. Impact direct sur le temps de chargement en prod.
- [ ] **RBAC simpliste** — `ProtectedRoute.tsx` ne distingue que `ADMIN` vs non-admin, alors qu'un module "Autorisation/Privilège" existe côté paramètres. Vérifier que ça correspond au besoin réel avant prod.
- [ ] **Duplication forte dans `src/utils/export*Excel.ts`** (8 fichiers, ~1683 lignes) — `exportEmiratesExcel.ts`, `exportEthiopianExcel.ts`, etc. partagent quasiment la même structure. Candidat à une factorisation (fonction générique paramétrée par compagnie).
- [ ] **654 occurrences de `any`** en TypeScript — dette de typage qui masque des bugs potentiels, notamment dans `ProtectedRoute.tsx`, `Axios.tsx`.
- [ ] **Pas de librairie de validation de formulaires** (pas de zod/yup/react-hook-form) — validation manuelle dispersée, risque d'incohérence.
- [ ] **Pas de reporting d'erreurs centralisé** (type Sentry) — en prod, une erreur côté client ne remonte à personne.

---

## 🟡 Améliorations (peuvent attendre après le lancement)

- [ ] **7 `eslint-disable`** dont 5 sur `react-hooks/exhaustive-deps` (`PageBaseConnaissance.tsx`, `PageEtatVente.tsx`) — dépendances `useEffect` à vérifier, source classique de bugs subtils.
- [ ] **Fichiers très volumineux** à découper pour la maintenabilité : `BilletTable.tsx` (1734 lignes), `Prospection.tsx` (1567), `BenchmarkingDetailPage.tsx` (1303), `ReservationModal.tsx` (1381), `HotelReservationModal.tsx` (1035), et ~20 autres fichiers >500 lignes.
- [ ] **Mémoïsation React déséquilibrée** — 45 `useMemo`, 0 `useCallback`, 0 `React.memo` dans tout le projet. À revoir sur les composants qui re-rendent souvent (tableaux, listes).
- [x] **`vite.config.ts`** — bloc `server.proxy` commenté (dead code) nettoyé le 2026-08-06. `build.sourcemap: false` (implicite) toujours à confirmer explicitement si besoin.
- [x] **`texte.tsx`** à la racine — fichier scratch inutilisé, supprimé le 2026-08-06.

---

## 📋 Modifications en cours (working tree au 2026-08-06)

Fichiers déjà modifiés mais non commités — à finaliser, tester puis committer avant de passer à la suite :

- `Dockerfile`, `docker-compose.yml`, `nginx.conf` (nouveau) — mise en place du déploiement Docker/Nginx
- `src/service/env.ts` — suppression du fallback d'URL en dur ✅
- Modules `module.etat.vente`, `module.hotel`, `module.ticketing/prospection`, `Fournisseur.tsx` — changements fonctionnels importants (ex. `PageEtatVente.tsx` : ~600 lignes modifiées)
- Nouveaux fichiers non trackés : `src/components/ConfirmDialog.tsx`, `src/components/Toast/`, `src/utils/export*Excel.ts` (5 fichiers) — à ajouter au repo (`git add`) une fois validés

---

## Notes de session

*(ajoute ici au fil des sessions ce qui a été fait, ce qui bloque, les décisions prises — pour qu'on puisse reprendre le fil facilement)*

- **2026-08-06** : Premier audit complet du projet réalisé. Fiche de suivi créée.
- **2026-08-06** : Décision de traiter en premier la sécurité des tokens d'auth. Rédaction du brief `BACKEND_PROMPT_AUTH_COOKIES.md` à transmettre côté backend (autre machine). En attente du retour backend (noms cookies/CSRF/logout) avant de coder la partie frontend.
- **2026-08-06** : Passage aux tâches frontend sans dépendance backend. Découverte que `npm run build` échouait (241 erreurs TS). `ErrorBoundary` branché dans `main.tsx`. `texte.tsx` supprimé, `vite.config.ts` nettoyé. Vague 1 de correction TS terminée (139 erreurs mécaniques corrigées sur 67 fichiers via 3 agents en parallèle) — reste 102 erreurs de vraies incompatibilités de types à traiter (vague 2). Rien n'a été committé — tout est encore dans le working tree.
- **2026-08-14** : Début vague 2. Corrigé les 42× `TS2740` (fichier unique, fix de type d'une ligne). Corrigé le cluster Assurance/Visa (8× `TS2345`) en unifiant les types dupliqués entre les slices et `module.pdf/pdf.generation/types/` — les slices sont maintenant la source unique. Ça a aussi révélé et corrigé un vrai bug potentiel (accès non protégé à une valeur `null` dans `assurance.generator.ts`). Puis corrigé les 9× `TS18047`/`TS18048` (accès null/undefined non protégés — `PageDetailVisa.tsx`, `Fournisseur.tsx`, `Prospection.tsx`, `PageProfilage.tsx`), traités un par un en vérifiant à chaque fois le contexte réel plutôt que d'ajouter des `?.`/`??` à l'aveugle. 101 → 43 erreurs restantes.
- **2026-08-18** : Vérifié que le working tree du 2026-08-14 (122 fichiers) avait bien été committé entre-temps (commits `mis a jour des tout les amélioration le 14 aout 2026` + `Authentifie la connexion Socket.io`) — plus rien en attente côté build. `.env.example` : déjà versionné, item coché (obsolète). Sécurité tokens auth (cookie httpOnly) : toujours bloquée, aucun retour backend reçu. Traité `console.log`/`console.warn`/`console.error`/`alert()` (4 agents en parallèle par domaine) : `ProtectedRoute.tsx` corrigé en premier (log de debug à chaque navigation), puis suppression des `console.log` de debug, ajout de `toast.error` à côté des `console.error` qui n'avaient pas encore de retour utilisateur visible, et remplacement des 87 `alert()` par le composant `Toast`. `console.warn` dans les generators PDF laissés tels quels (avertissement métier volontaire). `npx tsc -b --noEmit` et `npm run build` passent toujours à 0 erreur. **Rien n'est committé** — 56 fichiers modifiés dans le working tree. Prochaine étape suggérée : faire tester l'appli (le comportement des notifications change partout), puis committer, puis attaquer un autre item 🟠 (code splitting, RBAC, dédoublonnage export Excel) ou relancer le suivi du retour backend sur les cookies auth.
- **2026-08-14 (suite)** : Fin de la vague 2 — les 43 dernières erreurs corrigées via 4 agents en parallèle par domaine fonctionnel (types PDF, formulaires client/hôtel, ticketing/billet, dossier commun/assurance/suivi), chacun avec consigne stricte d'investiguer la cause réelle avant de corriger (pas de cast à l'aveugle). Plusieurs vrais bugs fonctionnels découverts et corrigés au passage (détail dans le bloc ci-dessus) : un `modePaiement` jamais envoyé au backend, un check d'erreur API qui ne détectait jamais l'échec (`dispatch(thunk).then(r => r.payload?.error)`), un id de ticket envoyé à la place d'un id de ligne de vol lors d'un report, un `beneficiaireId` manquant à la création d'un bénéficiaire, une conversion `"" → undefined` qui cassait un contrat API, et un filtre de recherche du tableau de bord totalement inopérant. Une régression introduite en cours de route par la cascade d'unification des types hôtel/devis a été repérée et corrigée avant de considérer la vague terminée. **`npx tsc -b --noEmit` et `npm run build` passent maintenant à 0 erreur.** `npm run lint` remonte encore ~715 erreurs mais toutes pré-existantes (couvertes par d'autres items de la checklist). Rien n'a été committé — tout est encore dans le working tree (122 fichiers modifiés). Prochaine étape suggérée : faire tester l'appli par l'utilisateur (beaucoup de vrais bugs corrigés = comportement qui change), puis committer, puis passer à l'item suivant (`.env.example` non versionné, ou sécurité des tokens si le retour backend est arrivé).
