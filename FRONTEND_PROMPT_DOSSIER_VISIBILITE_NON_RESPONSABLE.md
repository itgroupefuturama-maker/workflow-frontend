# Réponse backend — Dossiers : visibilité élargie, statut « responsable »

Réponse à `BACKEND_PROMPT_DOSSIER_VISIBILITE_NON_RESPONSABLE.md`. Étape 1 livrée (visibilité + statut responsable). Étape 2 (refus 403 des actions) : **module ticketing (billet) livré**, les autres modules suivront — voir §5.

## 1. Mécanisme « responsable » (confirmé)

- **Responsable d'un module sur un dossier** = l'utilisateur de l'affectation `DossierCommunColab` active (`status` ≠ `ANNULER`) de ce module sur ce dossier. C'est la même affectation que celle gérée par `addColab` / `addOrChangeColab`.
- **Accès à un module** = l'un des profils actifs de l'utilisateur donne ce module (`UserProfile` → `Profile` → `ProfileModule` actif). Il n'y a pas de notion `GESTION`/`CONSULTATION` côté backend : avoir le module dans son profil suffit.
- **Admin** = utilisateur avec le profil `ADMIN`. **Un admin est toujours responsable**, de tous les dossiers et sur tous les modules.

## 2. Endpoints qui filtraient par responsable

**Un seul : `GET /dossier-commun`.** Aucune autre lecture (prospection, devis, billet, hôtel, visa, attestation, assurance, détail d'un dossier) ne filtre par utilisateur : elles renvoient déjà tout.

## 3. Nouveau comportement de `GET /dossier-commun?module=<module>&page=..&limit=..`

| Utilisateur | Avant | Maintenant |
|---|---|---|
| A accès au module (profil) ou admin | seulement les dossiers où il est affecté au module | **tous les dossiers du module** |
| N'a pas accès au module | seulement les dossiers où il est affecté | inchangé |

Les autres conditions ne changent pas : affectation `CREER` sur ce module avec au moins une prestation, `search`, `statut`, pagination.

**Sans `module`** (`GET /dossier-commun` avec ou sans pagination) : la liste reste celle des dossiers où l'utilisateur est affecté. Seuls les nouveaux champs ci-dessous sont ajoutés.

## 4. Nouveaux champs (format choisi : les deux)

Ajoutés sur `GET /dossier-commun` (toutes variantes) et sur `GET /dossier-commun/:id` :

| Champ | Où | Valeur |
|---|---|---|
| `isResponsable` | sur le dossier | **avec `module`** : l'utilisateur connecté est responsable de CE module (ou admin). **Sans `module`** et sur `/:id` : responsable d'au moins un module du dossier (ou admin). |
| `responsable` | sur le dossier | `{ id, nom, prenom }` du responsable du module demandé. `null` sans `module`, sur `/:id`, ou si personne n'est affecté. |
| `isResponsable` | sur chaque élément de `dossierCommunColab[]` | l'utilisateur connecté est responsable de CE module (ou admin) |

👉 **Dans un écran de module, utilisez `isResponsable` du dossier.** Dans le détail d'un dossier, utilisez `dossierCommunColab[i].isResponsable` du module affiché.

Exemple (`GET /dossier-commun?module=ticketing&page=1&limit=10`, utilisateur non responsable) :

(Contenu de `data` : comme toutes les routes, la réponse réelle est enveloppée dans `{ "success": true, "data": ... }`.)

```json
{
  "data": [
    {
      "id": "cmdossiercommun001",
      "numero": 45,
      "referenceTravelPlaner": "TP-2026-0045",
      "status": "CREER",
      "description": "Voyage séminaire Paris",
      "contactPrincipal": "Mme RASOA",
      "whatsapp": "+261340000001",
      "userId": "cmuser_owner",
      "clientFactureId": "cmclientfact001",
      "user": { "id": "cmuser_owner", "email": "owner@agence.mg", "nom": "RAKOTO", "prenom": "Paul", "...": "..." },
      "clientfacture": { "id": "cmclientfact001", "code": "CF-0012", "libelle": "Société X", "...": "..." },
      "dossierCommunColab": [
        {
          "id": "cmcolab001",
          "status": "CREER",
          "userId": "cmuser_agent_tkt",
          "moduleId": "cmmodule_tkt",
          "user": { "id": "cmuser_agent_tkt", "nom": "RABE", "prenom": "Hery", "...": "..." },
          "module": { "id": "cmmodule_tkt", "code": "tkt", "nom": "ticketing", "...": "..." },
          "prestation": [ { "id": "cmprest001", "numeroDos": "DOS-2026-045", "...": "..." } ],
          "isResponsable": false
        }
      ],
      "dossierCommunClient": [ "..." ],
      "isResponsable": false,
      "responsable": { "id": "cmuser_agent_tkt", "nom": "RABE", "prenom": "Hery" }
    }
  ],
  "meta": { "total": 9, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### Sécurité : `motDePasse` retiré des réponses

Les objets `user` (propriétaire et collaborateurs) renvoyés par les routes `/dossier-commun` contenaient le hash du mot de passe. Ce champ est maintenant **retiré**. Les autres champs de `user` ne changent pas. Si le frontend lisait ce champ quelque part, il ne doit plus le faire.

## 5. Actions (403) — étape 2

Règle : une action dans un dossier est refusée si l'utilisateur connecté n'est **ni le responsable du module sur ce dossier, ni admin**.

### Réponse en cas de refus

**HTTP 403**, au format d'erreur habituel de l'API :

```json
{
  "success": false,
  "message": "Action refusée : vous n'êtes pas responsable de ce dossier pour ce module (lecture seule)."
}
```

- Testez **le code HTTP 403** pour distinguer ce refus des autres erreurs : les erreurs métier habituelles des contrôleurs (ex. « Toutes les lignes doivent être clôturées… ») continuent d'arriver en HTTP 200 avec `success: false`.
- Id inexistant : pas de 403, la route renvoie son erreur habituelle « … non trouvé ».
- Les appels d'Odoo (clé API) ne sont pas concernés.

### ✅ Module ticketing (billet) — protégé

| Route | Ressource contrôlée |
|---|---|
| `POST /billet/entete` | dossier du devis (`devisId` du body) |
| `PUT /billet/ligne/:id/addreservation` | dossier de la ligne de billet |
| `PUT /billet/ligne/:id/achat` | dossier de la ligne de billet |
| `PUT /billet/:id/a-approuver` | dossier de l'entête de billet |
| `POST /billet/:id/annuler` | dossier de l'entête de billet |
| `PATCH /billet/:id/reprogrammer` | dossier de l'entête de billet |
| `PUT /billet/:id/emettre` | dossier de l'entête de billet |
| `PUT /billet/:id/emettre-facture` | dossier de l'entête de billet |
| `PUT /billet/:id/regler-facture` | dossier de l'entête de billet |
| `PATCH /billet/:id/reporter` | dossier du billet |

Les lectures (`GET /billet/...`) restent ouvertes à tous les utilisateurs connectés.

### ⏳ Pas encore protégés

Hôtel, visa, attestation, assurance, prospection. Pour l'instant, seul le frontend limite les actions dans ces modules (via `isResponsable`). Ils seront ajoutés au tableau ci-dessus au fur et à mesure.

## 6. Ce que le frontend peut faire dès maintenant

1. `ListeDossierByModule.tsx` : le module affiche maintenant tous ses dossiers (9 au lieu de 7 dans l'exemple du ticket).
2. Badge « lecture seule » quand `isResponsable === false`, avec éventuellement « Responsable : `responsable.prenom` `responsable.nom` ».
3. Désactivation des boutons d'action dans ces dossiers.
4. Gestion du **HTTP 403** sur les routes billet du §5 : afficher le `message` (cas où l'interface aurait laissé passer l'action).
