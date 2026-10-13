# Groove To Grave — compte-rendu de la Phase 7.7 (gabarit artiste, chronologie, registre public)

13 octobre 2026 · branche `experience/groove-to-grave`, commit `733d239` · Studio redéployé · preview https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app · **rien n'est fusionné**

## Fait

**A. Le gabarit artiste, refait pour le cas réel.** Le défaut a été trouvé en regardant une page rendue, pas le code : à 1440, la ligne de piste flottait seule dans une colonne lointaine en pleine largeur, et `g2g-pistes` dessinait **un filet de 2 px tout seul** quand aucune piste n'était créditée (julius, karaba). Un seul gabarit désormais, qui tient d'abord pour le cas le plus fréquent — une sortie, aucun texte, aucun portrait, aucune piste créditée : affiche au nom, ligne de méta, puis la cassette. Ce qui existe s'ajoute dans le même ordre : présentation, œuvre en grand avec sa légende et les liens dessous, puis les sorties en grille, chacune portant ses pistes **seulement si elle en a** (`pistes.length`). Colonne mesurée (`--mesure-artiste: 62ch` au-delà de 1100 px, grille des sorties plafonnée à 920 px), plus de colonne à 9 fractions. Le crédit d'artwork absent n'écrit plus rien du tout.

**B. Une seule charte d'en-tête.** Toutes les pages d'artistes portent l'affiche scotchée, dont le papier prend la **dominante relevée sur la pochette** par le pipeline (`lib/couleur-affiche.ts`, prop `couleur` de `TitrePage`, variable `--papier-affiche`). Garde-fou : si la dominante ne porte pas l'encre à **4,5:1** — le seuil déjà appliqué au texte sur papier — le site prend la couleur de palette la plus proche qui le tient. `tokens.test.ts` passe les **dix-neuf affiches réellement en service**, lues dans l'instantané du contenu publié via l'adaptateur Sanity (la dérivation est partagée avec la page : `lib/artiste.ts`).

| Artiste | Papier | Rapport | | Artiste | Papier | Rapport |
|---|---|---|---|---|---|---|
| lukasdarian | `#009ee2` | 6,28:1 | | julius | `#a9c4a8` | 10,02:1 *(repli)* |
| emi-omar | `#51995a` | 5,44:1 | | gregs | `#a9c4a8` | 10,02:1 *(repli)* |
| mamaaa | `#f14442` | 5,08:1 | | azbine | `#a9c4a8` | 10,02:1 *(repli)* |
| local-dj | `#f14442` | 5,08:1 | | merov | `#a9c4a8` | 10,02:1 *(repli)* |
| venetia | `#f14442` | 5,08:1 | | lungo | `#a9c4a8` | 10,02:1 *(repli)* |
| loupiot | `#f14442` | 5,08:1 | | yotam-nadav | `#a9c4a8` | 10,02:1 *(repli)* |
| jad-sabbah | `#f14442` | 5,08:1 | | l-abominable | `#a9c4a8` | 10,02:1 *(repli)* |
| kitchen-plug | `#f0ada0` | 10,06:1 *(repli)* | | crane-de-poule | `#a9c4a8` | 10,02:1 *(repli)* |
| karaba | `#f0ada0` | 10,06:1 *(repli)* | | phyto | `#a9c4a8` | 10,02:1 *(repli)* |
| | | | | atay | `#a9c4a8` | 10,02:1 *(repli)* |

**Sept dominantes tiennent, douze se replient** : la charte montre donc la couleur de l'œuvre sur sept pages, et la palette sur les douze autres (les pochettes du label sont sombres). C'est le comportement que tu as demandé ; si la proportion te dérange, la variante à étudier est d'**éclaircir la dominante en gardant sa teinte** plutôt que de basculer sur la palette. C'est écrit au brief.

**C. La chronologie, composée à partir des champs** (`lib/chronologie.ts`, plus de gabarit collé dans le JSX) : « Soirée » n'est ajouté que si le titre existe et ne le porte pas déjà, le lieu n'est rappelé que si le titre ne le contient pas (comparaison sans accents, sans ponctuation, sans parenthèses), et il ne reste jamais de virgule en attente d'un champ absent. La chronologie du label compte **vingt-quatre lignes : dix-sept soirées et sept sorties** ; seules les lignes de soirées sont recomposées, **sept d'entre elles changent**, et ce sont exactement les cinq fautes que tu avais nommées.

| Date | Avant | Après |
|---|---|---|
| 2025-07-25 | Soirée Groove To Grave x Jardin21, open air, Jardin21 | Soirée Groove To Grave x Jardin21, open air |
| 2025-02-07 | Soirée, Lieu à vérifier | Lieu non retrouvé |
| 2024-11-01 | Soirée, 42 Marches, annulée | 42 Marches, annulée |
| 2024-07-13 | Soirée La Péniche Marcounet invite Groove To Grave Records, Péniche Marcounet | Soirée La Péniche Marcounet invite Groove To Grave Records |
| 2023-05-10 | Soirée Groove To Grave Records à la Panic Room, Panic Room | Soirée Groove To Grave Records à la Panic Room |
| 2023-02-22 | Soirée Groove To Grave Records au bar éphémère L'Exode, Bar éphémère L'Exode (ex-45 Tours) | Soirée Groove To Grave Records au bar éphémère L'Exode |
| 2023-01-07 | Soirée Première soirée, thème Plaisir, Liebe, bar électro | Première soirée, thème Plaisir, Liebe, bar électro |

Les dix autres lignes de soirées sont identiques au caractère près (table complète produite par comparaison des deux compositions sur les dix-sept documents).

**D. Le registre public.** Règle écrite au brief : **une information inconnue se tait, ou se dit « non retrouvé » — jamais « à vérifier », « à confirmer », « à compléter », « TODO » ni « ? »**, ni dans le contenu, ni en dur dans le code. Elle tient en trois endroits, avec **une seule expression** (`lib/registre.ts`, importée telle quelle par le Studio et par `g2g-verif`) :

1. **Barrière de saisie dans le Studio** sur les champs publics (soirée : nom, lieu, adresse, ville, horaires, prix ; sortie : titre, artwork, mastering ; artiste : nom, ville, rôle ; image : alt et crédit ; tout corps de texte ; label : nom, ville), avec un message en français : « Cette formule est une note de chantier, et le site n'en affiche aucune. Laissez le champ vide si l'information n'est pas connue : la page s'en passera proprement. » Passée sur les **924 chaînes du contenu publié**, elle en refusait deux, et seulement deux : le lieu du 7 février 2025, et le texte de démo que nous avions écrit (« le délai de réponse reste à préciser »). Quinze formules de chantier et quinze valeurs légitimes servent de cas d'essai (« auteur non identifié », « Lieu non retrouvé », « Wytgh ? », « What To Do » passent).
2. **Écriture autorisée, un seul champ.** Lieu de la soirée du 7 février 2025 (`soiree-2025-02-07`), relevé avant et après, sous garde de révision :

   | | document | comptes publiés |
   |---|---|---|
   | avant | `_rev Cvt34EWfACWfcjF2Jow2sP`, `lieu: "Lieu à vérifier"`, `verifiee: false`, aucun brouillon | 19 artistes, 17 soirées, 7 sorties, 1 textes, 1 réglages — **279 documents, 6 brouillons** |
   | après | `_rev 4va9zR1kOKU6h4oimL2PFJ`, `lieu: null`, `verifiee: false`, aucun brouillon | **279 documents, 6 brouillons** (identiques) |

   **Retour arrière documenté** : `npx sanity exec outils/registre-releve.ts --with-user-token -- revenir` (remet la valeur exacte), et l'historique du document garde la révision précédente. L'outil de relevé est conservé dans le dépôt, c'est lui qui servira à toute écriture future.
3. **Contrôle sur le texte rendu** : `g2g-verif` repasse l'expression sur `document.body.innerText` de chaque page, aux deux formats (+22 contrôles). Il a trouvé quatre notes que le code écrivait lui-même, toutes corrigées : `Artwork : à vérifier` en légende de pochette (la mention disparaît au lieu de se plaindre), la pastille « à vérifier » du crédit de mastering (cette note nous appartient, elle vit dans `a-completer-par-le-label.md`, pas sur la page), « Date à confirmer par le label » → **« Date relevée sans source en ligne »**, et le « ? » dessiné sur l'étiquette de la cassette vierge → « A ».

   **Conséquence de données, rattrapée au passage** : l'adaptateur des soirées écartait tout document sans lieu — vider le champ faisait **disparaître la soirée du site**. Il n'exige plus que la date ; la soirée reste au registre et le site écrit « Lieu non retrouvé », sur l'affiche typographique comme dans la chronologie.

**E. Proposer une démo.** Plus de texte en brouillon dans cette section : si `label.contactDemo` est rempli, le site affiche l'adresse en lien ; sinon il dit l'état réel (« Le label n'a pas publié d'adresse pour les démos. Le contact du site est le seul chemin ouvert pour l'instant. »). « Sources et crédits » est sorti de la section. La page contact suit la même règle, puisque c'est elle qui affichait le brouillon fautif.

**F. Le détecteur de creux** (`scripts/g2g-creux.ts`, partagé par `g2g-verif` et les planches) couvre quatre cas : titre orphelin, section visible vide, **grille trouée** et **vide de fin**. Il a d'abord été passé sur l'**ancien** état, et il échoue bien là où il fallait :

```
KO 1440 /artistes/julius · grille trouée LI › g2g-pistes 984×2 (filet) · (×2)
KO 1440 /artistes/karaba · grille trouée LI › g2g-pistes 984×2 (filet)
KO  390 /artistes/julius · grille trouée LI › g2g-pistes 358×2 (filet) · (×2)
KO  390 /artistes/karaba · grille trouée LI › g2g-pistes 358×2 (filet)
```

Après le gabarit : **les dix-neuf pages d'artistes passent aux deux formats**, plus /label, /soirees et /contact — « 0 page(s) en défaut », vide de fin compris.

## Arbitrages

- **Le lieu d'une soirée devient facultatif dans le schéma**, avec la raison écrite dans le champ : une barrière qui refuse « à vérifier » n'a de sens que si l'on peut laisser vide. Le site, lui, ne laisse jamais une case vide à l'écran : il écrit « Lieu non retrouvé ».
- **La note sur le mastering de GTGR02 sort de la page.** C'est une note d'enquête (relevée sur une étiquette), pas une information publique : elle reste dans la liste à compléter par le label.
- **Le « ? » de la cassette vierge** était décoratif, mais c'est précisément la formule que la règle interdit : la face porte « A », comme une vraie étiquette.
- **Une seule expression pour trois endroits.** `studio/schemas/communs.ts` importe `lib/registre.ts` du site : la barrière de saisie, le contrôle de rendu et le libellé ne peuvent pas diverger. Vérifié par `npx sanity build` (le Studio se construit avec cet import).
- **Deux relevés faussés dans la journée**, par un `npm run start` d'une session précédente qui tenait déjà le port (le nouveau serveur échouait en silence) et par un `.next` qui a resservi une page prérendue alors que la source avait changé. La parade est au brief : tuer ce qui tient le port, reconstruire avec `.next` supprimé, et chercher dans la page servie une chaîne propre à la modification. Rappel qui m'a coûté une mesure : **le port local est 3999**, le seul déclaré dans les CORS de Sanity.

## Résultats

- `npx tsc --noEmit`, `npx eslint` sur les fichiers touchés, `npm run build`, `npm run test:g2g-tokens` (19 paires + 19 affiches) : propres.
- **`g2g-verif` : 204/204 en local et 204/204 sur la preview** (182 + 22 pour le registre). `g2g-a11y` : **42/42**.
- Détecteur de creux : 0 défaut sur les 19 pages d'artistes, /label, /soirees et /contact, en 1440 et 390.
- Planches-contact des dix-neuf pages d'artistes, pleine hauteur, légendées : `planches/phase-7.7-artistes-1440-2026-10-13.jpg` et `…-390-…jpg` (option `--pages` / `--vignette` ajoutée à `g2g-planche-captures.ts`).
- Studio redéployé (barrière de saisie en service), types Sanity regénérés — `types.generated.ts` inchangé.
- Guide du label : la section « Ajouter une soirée » explique le champ lieu vide et la règle du registre. `a-completer-par-le-label.md` : la ligne du 7 février 2025 est mise à jour.

## Reste

- **Aucune fusion** : la production est toujours à 7.6. `g2g-verif` contre la production après ton accord.
- Le texte de démo écrit par nous reste en base avec sa formule de chantier (« à préciser ») : il n'est plus affiché nulle part, et le Studio le signalera au label à la première ouverture. Je ne l'ai pas réécrit, c'était une deuxième écriture.
- La variante « éclaircir la dominante au lieu de basculer sur la palette », si les douze replis te gênent.
