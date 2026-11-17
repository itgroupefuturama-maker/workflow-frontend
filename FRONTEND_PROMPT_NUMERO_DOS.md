# Front — N° Dos et N° Dos Ref disponibles à plat dans l'API billet

Le backend renvoie maintenant les références de dossier directement sur le billet et sur ses lignes.
Les objets imbriqués existants ne changent pas : rien ne casse si le front ne fait rien.

## Nouveaux attributs

| Route | Niveau | Attribut | Exemple |
|---|---|---|---|
| `GET /billet/entete/:devisId/devis` | billet | `numeroDos` | `"DOSTIC_14"` |
| | billet | `numeroEntete` | `"DOSTIC_14_1"` |
| | chaque `billetLigne[]` | `numeroDosRef` | `"DOSTIC_14_1_1"` |
| `GET /billet/dossier-commun/:dossierCommunId` | chaque billet | `numeroDos`, `numeroEntete` | `"DOSTIC_14"`, `"DOSTIC_14_1"` |

## À faire côté front

- Remplacer les lectures `billet.prospectionEntete.prestation.numeroDos`, `billet.prospectionEntete.numeroEntete` et
  `ligne.prospectionLigne.numeroDosRef` par `billet.numeroDos`, `billet.numeroEntete` et `ligne.numeroDosRef`.
- Afficher `numeroDosRef` à côté de `referenceLine` (`A_10`, `B_20`, …) dans le tableau des lignes.

## Bon à savoir

- Une ligne de frais d'annulation (`X_20`) a le même `numeroDosRef` que la ligne annulée.
- Une ligne reprogrammée (`X_30` et plus) a son propre `numeroDosRef` (nouvelle ligne de prospection).
- La clé unique d'une ligne reste `id` / `referenceLine`, pas `numeroDosRef`.
