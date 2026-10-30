# Prompt frontend — Notifications des retours d'Odoo sur un billet

> Concerne `AppBar.tsx` (cloche des notifications), `FrontOfficeLayout.tsx` et `ListeParametreLayout.tsx` (socket),
> et la page Billet (`ticketing/pages/billet/:enteteId`).
> À lire avec `FRONTEND_PROMPT_ODOO_BILLET_V2.md`.

## 1. Ce qui change

Le statut d'un billet avance quand Odoo répond, et non plus au clic sur « Approuver » ou « Émettre ». Le backend
envoie maintenant une **notification** à chacune de ces étapes :

| `type` | Quand | Nouveau statut du billet |
|---|---|---|
| `BILLET_VENTE_VALIDEE` | Odoo a validé la vente | `BC_CLIENT_A_APPROUVER` |
| `BILLET_ACHAT_VALIDE` | Odoo a validé l'achat (billet émis, rappels et miles créés) | `BILLET_EMIS` |
| `BILLET_FACTURE_EMISE` | Odoo a émis la facture client | `FACTURE_EMISE` |
| `BILLET_FACTURE_REGLEE` | Odoo a enregistré le règlement | `FACTURE_REGLEE` |

**Destinataires :**
- le **responsable du billet**, c'est-à-dire le collaborateur affecté au module Ticketing du dossier ;
- l'agent qui a **soumis le dossier à Odoo**, s'il est différent du responsable.

Chacun reçoit **une seule** notification par étape, même si Odoo renvoie plusieurs fois le même appel.

## 2. Format d'une notification

C'est le même format partout : dans la base, dans `GET /notifications/me` et dans le socket.

```json
{
  "id": "cmvuwn7tf00001a7vfbtc27kp",
  "status": "ACTIF",
  "receiverId": "<id utilisateur>",
  "type": "BILLET_VENTE_VALIDEE",
  "titre": "Vente validée par Odoo",
  "description": "La vente du billet BIL-202610-0006 (dossier DOSTIC_8) a été validée : vous pouvez demander l'émission.",
  "isRead": false,
  "module": "BILLET",
  "entityType": "BILLET_ENTETE",
  "entityId": "cmvuotrfo00032xrp07k3firm",
  "data": {
    "billetEnteteId": "cmvuotrfo00032xrp07k3firm",
    "numeroBillet": "BIL-202610-0006",
    "devisId": "cmvuorqg600012xrpzwkw0tw5",
    "prospectionEnteteId": "cmup6moo600012xqgc0ag4e0g",
    "prestationId": "cmotuu278000s35mxkp5k5iz9",
    "numeroDos": "DOSTIC_8",
    "dossierCommunId": "cmotuu26w000m35mxmz0r499x",
    "numeroDossierCommun": 9,
    "clientFacture": { "id": "...", "code": "ClF-1", "libelle": "Client Air France" },
    "ancienStatut": "CREER",
    "nouveauStatut": "BC_CLIENT_A_APPROUVER",
    "sequence": 2,
    "odoo": {
      "reference": "SO-2026-0341",
      "commentaire": null,
      "referenceFacture": null,
      "referenceFactureOdoo": null,
      "dateFacture": null,
      "montantRegleAriary": null,
      "dateReglement": null
    },
    "acteur": "ODOO"
  },
  "createdAt": "2026-10-30T11:44:38.739Z",
  "updatedAt": "2026-10-30T11:44:38.739Z"
}
```

- `titre` et `description` sont **prêts à afficher**.
- Les **anciennes notifications** (attribution de dossier, etc.) n'ont que `description`. Leurs champs `type`,
  `titre`, `module`, `entityType`, `entityId` et `data` valent `null` : il faut les afficher comme avant.
- Dans `data.odoo`, seuls les champs connus à l'étape sont remplis :

| Étape | Champs remplis |
|---|---|
| `BILLET_VENTE_VALIDEE`, `BILLET_ACHAT_VALIDE` | `reference` (n° de commande Odoo), `commentaire` |
| `BILLET_FACTURE_EMISE` | `referenceFacture`, `referenceFactureOdoo`, `dateFacture` |
| `BILLET_FACTURE_REGLEE` | `montantRegleAriary`, `dateReglement`, plus les champs de facture |

Icônes suggérées : vente ✅, achat / billet émis 🎫, facture 🧾, réglée 💰.

## 3. Clic sur une notification : ouvrir la page du billet

La page Billet est routée sur le **`devisId`**, pas sur l'id du billet entête, comme dans `Devis.tsx` :

```ts
function lienNotification(n: Notification): string | null {
  if (n.module === 'BILLET' && n.data) {
    const { devisId, prospectionEnteteId } = n.data;
    return `/dossiers-communs/ticketing/pages/billet/${devisId}?prospectionEnteteId=${prospectionEnteteId}`;
  }
  return null; // ancienne notification : pas de lien
}

const onClickNotification = async (n: Notification) => {
  if (!n.isRead) await axiosInstance.patch(`/notifications/${n.id}/read`);
  const lien = lienNotification(n);
  if (lien) navigate(lien);
};
```

Si la page Billet a besoin d'un dossier ou d'une prestation sélectionnés dans le store (Redux), utilisez
`data.dossierCommunId` et `data.prestationId` pour les sélectionner avant la navigation.

Le backend ne fournit volontairement pas d'URL : les routes du front peuvent changer sans casser les notifications
déjà enregistrées.

## 4. Temps réel (socket)

### 4.1 Événement `notification` (existant, enrichi)

Il garde ses anciens champs, donc le code actuel continue de fonctionner, et reçoit en plus la notification
complète :

```json
{
  "entityType": "NOTIFICATION",
  "receiverId": "<id utilisateur>",
  "entityId": "<id de la notification>",
  "action": "CREATE",
  "notification": { "...": "format du §2" }
}
```

→ Si `data.notification` est présent, ajoutez-la en tête de la liste de la cloche et affichez un toast avec
`titre` et `description`. Le clic sur le toast suit la même règle qu'au §3. Il n'est pas nécessaire de recharger
la liste. Sinon (ancien format), rechargez la liste comme aujourd'hui.

Dans `FrontOfficeLayout.tsx`, le handler actuel ne fait qu'un `console.log("refresh")` : c'est là qu'il faut
brancher la mise à jour de la cloche et le toast.

### 4.2 Nouvel événement `billet:statut`

Il est envoyé à **tous** les utilisateurs connectés à chaque changement de statut par Odoo :

```json
{
  "billetEnteteId": "cmvuotrfo00032xrp07k3firm",
  "ancienStatut": "CREER",
  "nouveauStatut": "BC_CLIENT_A_APPROUVER",
  "type": "BILLET_VENTE_VALIDEE"
}
```

→ Sur la page Billet, si `billetEnteteId` correspond au billet affiché, rechargez-le avec
`GET /billet/entete/:devisId/devis`. Le statut, les boutons et `odooEnvois` se mettent ainsi à jour sans action de
l'agent. Pensez à retirer l'écouteur (`socket.off`) quand la page est fermée.

## 5. Routes des notifications

| Route | Rôle |
|---|---|
| `GET /notifications/me?nonLues=true&limit=50` | **Nouvelle.** Notifications de l'utilisateur connecté, hors supprimées, de la plus récente à la plus ancienne. `nonLues` et `limit` (max 200) sont optionnels. |
| `GET /notifications/me/count` | **Nouvelle.** `{ receiverId, unreadCount }` |
| `PATCH /notifications/me/read-all` | **Nouvelle.** Tout marquer comme lu. |
| `PATCH /notifications/:id/read`, `DELETE /notifications/:id` | Inchangées. |

→ Remplacez dans `AppBar.tsx` :
- `GET /notifications/user/${user.id}` par `GET /notifications/me` ;
- `PATCH /notifications/user/${user.id}/read-all` par `PATCH /notifications/me/read-all`.

`GET /notifications/me` **masque les notifications supprimées** (`status: SUPPRIMER`). L'ancienne route les
renvoyait.

### Sécurité (nouveau)

- Les routes `/notifications/user/:userId/...` répondent **403** si `userId` n'est pas l'utilisateur connecté.
- `PATCH /notifications/:id/read` et `DELETE /notifications/:id` répondent **403** si la notification appartient à un
  autre utilisateur.
- `GET /notifications` ne renvoie plus que les notifications de l'utilisateur connecté.

Le front n'appelle ces routes qu'avec son propre id, donc rien ne casse. Passer à `/me` reste plus simple.

## 6. Disponibilité

Disponible au prochain déploiement, après la migration `20261030000100_notification_structuree`.
