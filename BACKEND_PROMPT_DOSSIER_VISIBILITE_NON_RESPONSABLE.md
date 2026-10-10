# Prompt à donner au backend — Dossiers : visibilité élargie, restriction déplacée vers les actions

> À copier-coller tel quel dans une session Claude Code (ou pour un dev) sur le repo backend.
> Fait suite à une demande du client sur `ListeDossierByModule.tsx` (écran de liste des dossiers par module, front).

---

## Contexte

Sur `GET /dossier-commun?module=<module>`, la liste des dossiers renvoyée est aujourd'hui filtrée par
module **et** par un critère de "responsable" : un utilisateur connecté qui n'est pas considéré comme
responsable du module sur un dossier donné ne voit tout simplement pas ce dossier dans la liste.

Constaté côté front : pour un utilisateur non-responsable, un module qui contient réellement 9 dossiers
n'en retourne que 7 — les 2 dossiers où cet utilisateur n'est pas responsable sont absents de la réponse,
pas seulement désactivés ou grisés.

**Nous n'avons pas le détail exact du mécanisme actuel côté backend** (quelle relation/colonne porte la
notion de "responsable" : un champ sur `dossierCommunColab`, une relation vers `User`, autre chose ?) —
merci de confirmer/préciser en répondant à ce prompt.

## Nouveau comportement demandé par le client

Un utilisateur qui a accès à un module (au sens du système de privilèges existant, `GESTION`/`CONSULTATION`)
doit pouvoir **voir et naviguer dans n'importe quel dossier de ce module**, qu'il en soit responsable ou
non. La notion de "responsable" ne doit plus conditionner la **visibilité** d'un dossier, seulement
l'autorisation d'y **agir** (créer/modifier/supprimer/valider quoi que ce soit à l'intérieur).

Concrètement :
1. **`GET /dossier-commun?module=<module>` ne doit plus filtrer par responsable** — renvoyer tous les
   dossiers du module auxquels l'utilisateur a accès (même filtrage qu'aujourd'hui pour un responsable/admin).
2. Même chose pour **tout endpoint de lecture imbriqué dans un dossier** si le filtrage par responsable
   existe aussi là (listes de prospection/devis/billet rattachées à un dossier, détail d'un dossier, etc.)
   — à vérifier et lister de votre côté, nous n'avons pas la visibilité complète sur tous les endpoints
   concernés.
3. **Chaque dossier renvoyé doit indiquer si l'utilisateur connecté en est responsable**, pour que le
   frontend sache afficher un badge "lecture seule" et désactiver les actions. Deux formats possibles,
   au choix du backend (le plus simple à produire de votre côté) :
   - un booléen calculé `isResponsable: boolean` par dossier (le plus simple à consommer pour nous), ou
   - l'identité du/des responsable(s) du dossier pour ce module (`responsable: { id, nom, prenom }` ou
     équivalent), charge au frontend de comparer avec l'utilisateur connecté.
4. **Les endpoints de modification (création/mise à jour/suppression/validation) doivent continuer à
   vérifier le statut responsable et refuser (403) l'action si l'utilisateur connecté n'est pas
   responsable du dossier concerné** — qu'il soit déjà fait ou à ajouter, c'est le seul endroit où la
   restriction doit désormais s'appliquer. Masquer les boutons côté UI n'est jamais une mesure de
   sécurité suffisante à elle seule.

## Ce dont le frontend a besoin en retour

- Confirmation du mécanisme exact de "responsable" aujourd'hui (champ/relation en base).
- La liste des endpoints qui filtrent actuellement par responsable (au-delà de
  `GET /dossier-commun`), pour qu'on sache où le changement de visibilité s'applique.
- Le format choisi pour exposer le statut responsable par dossier (`isResponsable` vs `responsable: {...}`).
- Confirmation que les endpoints de mutation vérifient déjà (ou vérifieront) ce statut et renvoient 403
  sinon, avec le format d'erreur standard de l'API (`{ success: false, message }`).
- Si le filtrage par responsable existe sur d'autres ressources en dehors des dossiers (prospection,
  devis, billet directement, indépendamment du dossier parent), merci de le signaler — ça change le
  périmètre du ticket frontend qui suivra.

## Ce que fera le frontend une fois la réponse reçue

Pas de changement de code avant cette réponse. Une fois reçue, le travail frontend se fera en deux
phases (voir `CHECKLIST_DOSSIER_VISIBILITE_NON_RESPONSABLE.md` pour le détail) :
1. Affichage d'un indicateur "lecture seule" pour les dossiers où l'utilisateur n'est pas responsable.
2. Désactivation des boutons d'action dans ces dossiers, module par module.
