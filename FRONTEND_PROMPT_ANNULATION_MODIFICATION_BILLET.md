# Prompt frontend — Billet : condition d'annulation, annulation après émission, verrous de modification

> Concerne le module Ticketing → page Billet : `BilletTable.tsx`, `AnnulationBilletModal.tsx`,
> `billetSlice.ts` (thunks d'annulation), et les boutons de réservation / achat / reprogrammation.

## 1. Bug — la condition d'annulation ne s'affiche pas (à corriger)

Le backend enregistre bien la condition, dans `conditionAnnul` **sur la ligne billet**. Deux erreurs côté front
l'empêchent de s'afficher :

### 1.1 `BilletTable.tsx` lit le mauvais champ, sur le mauvais objet

```tsx
const p = ligne.prospectionLigne;            // ligne ~995
<td>{p?.conditionModif || '—'}</td>
<td>{p?.conditionAnnulation || '—'}</td>     // ligne ~1301 : ce champ n'existe pas
```

À remplacer par les champs de la **ligne billet** :

```tsx
<td>{ligne.conditionModif || p?.conditionModif || '—'}</td>
<td>{ligne.conditionAnnul || '—'}</td>
```

Pour la version repliée, juste en dessous (`p?.conditionModif ? '⚠️' : '—'`), utiliser aussi
`ligne.conditionModif || ligne.conditionAnnul`.

### 1.2 `AnnulationBilletModal.tsx` n'envoie pas le texte saisi

La modal exige un champ « raison » (`raison`), mais envoie à la place le libellé de la raison choisie dans la liste :

```ts
conditionAnnul: raisons.find(r => r.id === rasionAnnulationId)?.libelle || '',   // ligne ~92
```

À remplacer par le texte saisi par l'agent. La raison choisie part déjà dans `rasionAnnulationId` :

```ts
conditionAnnul: raison.trim(),
```

## 2. Annulation après émission — route inexistante (à corriger)

Le thunk `annulerEmissionBillet` appelle `PATCH /billet/:id/annuler-emission`. **Cette route n'existe pas** dans le
backend, donc l'appel échoue toujours.

→ Utiliser la **même route que l'annulation avant émission** : `POST /billet/:id/annuler`, avec le même payload,
quel que soit le statut du billet. Le thunk `annulerEmissionBillet` peut être supprimé.

Rappel du payload attendu, une ligne par appel :

```json
{
  "id": "<billetLigneId>",
  "rasionAnnulationId": "<id raison>",
  "conditionAnnul": "Texte saisi par l'agent",
  "type": "SIMPLE | COM | PEN | COM_PEN",
  "tauxChange": 4500,
  "resaCommissionEnDevise": 10,
  "resaCommissionEnAriary": 45000,
  "puResaPenaliteCompagnieDevise": 100,
  "puResaMontantPenaliteCompagnieDevise": 100
}
```

Dans `Billet.tsx`, le payload est adapté avec `ligneIds: [ligneToAnnul.id]`. Ce champ est ignoré par le backend :
c'est `id` qui compte. Le type `AnnulationBilletPayload` (avec `lignes[]`) ne correspond pas non plus à ce qui est
réellement envoyé, et peut être aligné sur le payload ci-dessus.

## 3. Modification et annulation possibles à tout statut — le dossier repasse en `CREER`

Une **reprogrammation** ou une **annulation** est possible même après l'émission ou la facturation. Le
**billet repasse alors en `CREER`**.

C'est aussi le cas quand on modifie la réservation d'une ligne `FAIT` après avoir soumis la vente à Odoo.

→ Après ces actions, afficher par exemple : « Dossier modifié : à soumettre de nouveau à Odoo (bouton Approuver) ».
Odoo fera l'avoir et la facture complémentaire à partir du nouvel envoi.

## 4. Nouveaux refus du backend (à afficher tels quels)

| Action | Cas refusé | Code | Message |
|---|---|---|---|
| Réservation (`PUT ligne/:id/addreservation`) | ligne déjà émise (`CLOTURER`) | 409 | « … la réservation n'est plus modifiable, utilisez la reprogrammation ou l'annulation » |
| Achat (`PUT ligne/:id/achat`) | ligne qui n'est pas `FAIT` (annulée, remplacée ou déjà émise) | 404 | « Le statut de la ligne doit être 'FAIT' avant d'ajouter l'émission (statut actuel : …) » |
| Annulation | ligne d'un autre billet | 400 | « Le billetLigne … n'appartient pas au billet … » |
| Annulation | ligne remplacée par une reprogrammation (`MODIFIER`) | 409 | « … annulez la nouvelle ligne » |
| Annulation | ligne de frais d'annulation (`statusLigne: ANNULATION`, référence `X_20`) | 409 | « … ligne de frais d'annulation : elle ne peut pas être annulée » |
| Toutes | billet annulé | 409 | « Ce billet est déjà annulé » |

Côté interface, il vaut mieux **masquer les boutons** dans ces cas :
- « Réserver / modifier la réservation » seulement sur les lignes `CREER` ou `FAIT` ;
- « Acheter » seulement sur les lignes `FAIT` ;
- « Annuler » et « Reprogrammer » ni sur les lignes `ANNULER` / `MODIFIER`, ni sur les lignes de frais
  (`statusLigne === 'ANNULATION'`).
