# Entre nous

Un téléphone, posé entre deux personnes. L'écran est coupé en deux, chacun
répond de son côté, et **rien ne se révèle tant que les deux n'ont pas validé**.
Trois actes, vingt-trois questions, une quinzaine de minutes. Ça se joue une fois.

Ce n'est pas un quiz : il n'y a **ni score, ni pourcentage, ni verdict de
compatibilité**, nulle part, y compris à la fin. L'objet du jeu, c'est la
conversation entre les questions.

Route : `/experience/entre-nous` — non indexée (`robots: { index: false }`).

---

## Lancer

```bash
npm run dev
# puis http://localhost:3000/experience/entre-nous
```

Le premier écran demande comment vous êtes installés (face à face ou côte à
côte) et qui occupe quelle moitié. **Il n'y a aucune saisie clavier de toute
l'expérience** : les deux prénoms vivent dans `content.ts`, la calibration ne
fait que les attribuer.

L'état complet survit au rafraîchissement (`sessionStorage`). Au retour, un
écran propose explicitement de reprendre ou de repartir du début — on ne
replonge jamais quelqu'un dans une partie sans le prévenir.

---

## Le fichier de questions personnelles

`questions-perso.json` — des questions écrites par l'un pour l'autre, glissées
dans le déroulé. Il est **livré vide**, et c'est un cas normal : sans lui,
l'expérience tourne sur la seule banque, sans écran creux ni marqueur orphelin.

`questions-perso.example.json` montre le format. Pour l'utiliser, recopiez-le :

```json
{
  "auteur": "Julien",
  "pour": "Mathilde",
  "questions": [
    {
      "texte": "Le trajet en voiture où on n'a rien dit pendant vingt minutes",
      "mecanique": "curseur",
      "options": ["j'étais bien", "j'étais mal"],
      "acte": 2,
      "mot": "Moi j'étais bien. J'ai mis trois jours à oser te le demander."
    }
  ]
}
```

| Champ | Obligatoire | Ce qu'il fait |
|---|---|---|
| `texte` | oui | La question. Une entrée sans texte est ignorée en silence. |
| `mecanique` | non | Voir la liste plus bas. À défaut, déduite du nombre d'options. |
| `options` | selon la mécanique | Deux pôles, quatre cartes, douze mots… |
| `acte` | non | 2 ou 3. Un `1` déclaré est reclassé en 2 : l'échauffement reste neutre. |
| `mot` | non | La phrase de l'auteur, révélée **sous les deux réponses** de sa question. |

**Ces questions s'annoncent.** Une ligne en laiton apparaît sur la carte :
« écrite par Julien, pour toi » du côté de la destinataire, « c'est toi qui l'as
écrite » du côté de l'auteur. Les deux y répondent — la réponse de celui qui
l'a écrite est souvent la partie intéressante, et sa moitié d'écran serait vide
sinon.

Le fichier est lu défensivement : champs manquants, types faux, JSON incomplet,
rien de tout cela ne casse une partie.

### Les règles de placement

Elles sont dans `build-run.ts` et sont **des règles de rythme, pas de
camouflage** — depuis que les questions perso s'annoncent, elles servent
uniquement à ce qu'elles tombent bien :

1. Toutes les questions perso sont dans le déroulé. Si la place manque, ce sont
   des questions de la banque qui sortent, jamais une perso.
2. Jamais deux perso à la suite.
3. Jamais en première position, jamais en dernière, et **jamais dans les deux
   dernières de l'acte 3** — la fin de l'acte doit rester à la banque.
4. Acte 2 et acte 3 seulement.
5. L'ordre d'auteur de la banque est préservé exactement : l'expérience se joue
   une fois, le rythme écrit vaut mieux que la rejouabilité.
6. Les questions marquées `garde: true` ne sont jamais sacrifiées pour faire de
   la place (voir plus bas).
7. Le tirage est déterminé par une graine rangée dans `sessionStorage`, donc un
   rafraîchissement ne rebat jamais les cartes.

**Jusqu'à quatorze questions perso, tous ces invariants tiennent** (vérifié sur
2 760 déroulés). Au-delà, les actes 2 et 3 n'offrent que quinze emplacements :
à quinze perso, toutes les positions sont perso et « jamais deux à la suite »
devient impossible par définition. C'est une limite arithmétique, pas un
défaut.

---

## Ajouter une question à la banque

Tout est dans `questions/pool.ts`, en trois tableaux (`ACTE_1`, `ACTE_2`,
`ACTE_3`). Une question ressemble à ça :

```ts
{
  id: 'a2-12',
  texte: 'Manger debout devant le frigo ouvert',
  mecanique: 'curseur',
  acte: 2,
  options: ['c’est un vrai repas', 'c’est un crime'],
  pari: true,        // facultatif : chacun devine aussi la réponse de l'autre
}
```

Les règles d'écriture, dans l'ordre d'importance :

- **Le filtre de curation d'abord.** Si une question peut faire mal plutôt que
  rire quand elle est posée en face de quelqu'un qu'on aime, elle sort. Les
  deux pôles d'un curseur doivent rester également défendables — sinon ce n'est
  plus une question, c'est un jugement.
- **Court.** En portrait côte à côte, une moitié ne fait que 192px de large.
- **Jamais deux mécaniques identiques à la suite**, y compris de part et
  d'autre d'un changement d'acte.
- Pour `le-mot`, les douze mots doivent s'accorder avec ce qu'ils qualifient :
  la même grille est montrée aux deux, et elle doit être juste des deux côtés.
- `a-voix-haute` se réserve aux meilleures questions : c'est elle qui sort les
  gens de l'écran, et elle s'use vite.
- **Aucune question sur le jeu lui-même.** « Ce jeu, pour l'instant ? », « on a
  joué ou on s'est parlé ? » : une expérience qui demande ce qu'on pense d'elle
  arrête la conversation qu'elle essaie d'ouvrir, et elle le fait toujours au
  pire moment, c'est-à-dire à la fin d'un acte.

Un `id` doit être unique. Le script de vérification plus bas contrôle tout ça.

### `garde: true`

Le sélecteur retire des questions de la banque quand les perso réclament la
place, et il traite par défaut toute la banque comme interchangeable. Une
question marquée `garde: true` est hors d'atteinte.

C'est réservé à la dramaturgie, pas au favoritisme : aujourd'hui seules `a3-6`
(le tir à la corde) et `a3-7` (la dernière parole) le portent, parce qu'elles
forment le doublé de fin — on place à quatre mains où on en est, puis on dit
tout haut ce qu'on espère. Sans ce marqueur, un fichier perso un peu fourni
supprimait purement et simplement cette fin-là, et l'acte se terminait sur ce
qui restait.

---

## Les sept mécaniques

| Mécanique | Réponse | `options` |
|---|---|---|
| `bascule` | l'une des deux | exactement 2 |
| `curseur` | une position sur un axe | 2 pôles |
| `enchere` | un nombre, monté ou descendu | aucune, mais une `echelle` |
| `classement` | des cartes remises dans l'ordre | 3 à 5 |
| `le-mot` | trois mots parmi douze | exactement 12 |
| `tir-a-la-corde` | **une seule** position, tirée à deux | 2 pôles |
| `a-voix-haute` | rien à l'écran, on se parle | aucune |

Aucune n'affiche jamais de chiffre pour un curseur : la position se dit en
mots (« plutôt ceci », « entre les deux »).

### Le pari

`pari: true` ajoute un second temps : après avoir répondu pour soi, on devine
la réponse de l'autre. C'est la mécanique centrale du jeu — l'écart entre ce
qu'on a cru de l'autre et ce qu'il a répondu fait plus parler que la réponse
elle-même.

Ne l'activez ni sur `a-voix-haute` (aucune donnée) ni sur `tir-a-la-corde`
(deviner une valeur qu'on tient soi-même dans la main n'a pas de sens).

### Le tir à la corde

La seule mécanique où **les deux agissent sur le même objet en même temps** :
une position unique, hissée au-dessus des deux moitiés dans `entre-nous-app.tsx`,
que chacun pousse depuis son côté. Deux doigts qui tirent à force égale en sens
opposé s'annulent.

Deux pièges y sont traités explicitement, et il faut les connaître avant d'y
toucher :

- **Pas de garde `event.isPrimary`.** Sur un appareil unique posé entre deux
  personnes, le second doigt posé sur l'écran n'est jamais le pointeur
  primaire : une telle garde annulerait purement et simplement le geste de la
  deuxième personne. Chaque pointeur est suivi individuellement. La même
  remarque vaut pour `classement`, où les deux moitiés glissent en même temps.
- **L'API est en delta, pas en valeur absolue.** Un « va à 62 » calculé depuis
  la position lue au début du geste écraserait ce que l'autre est en train de
  faire.

---

## Ajouter une mécanique

1. Le nom dans le type `Mecanique` (`types.ts`).
2. Le composant dans `mecaniques/`. Il reçoit une valeur et un `onChange`, il
   ne connaît ni la question ni l'autre moitié.
3. Le branchement dans `mecaniques/rendu.tsx` : `valeurInitiale`, `estComplet`,
   `formater`, le `case` de `Saisie`, et le rendu dans `Revelation` si les deux
   réponses gagnent à être montrées ensemble plutôt que l'une sous l'autre.
4. Le barème de distance dans `distance.ts`, sans quoi la mécanique n'entrera
   jamais dans l'ordre du jour.
5. Les styles dans `entre-nous.module.css`, **y compris les paliers de densité**
   (voir plus bas) : une mécanique qui ne tient que dans une moitié de portrait
   est une mécanique à moitié écrite.

Si la mécanique se joue au doigt dans un conteneur potentiellement pivoté,
passez impérativement par `mecaniques/espace-conteneur.ts`.

---

## Ce qu'il faut savoir avant de toucher au CSS

**La rotation.** En face à face, la moitié du haut est rendue sous
`rotate(180deg)` pour se lire depuis l'autre bord du téléphone. Les
`PointerEvent`, eux, restent en espace écran. `versConteneur()` est le seul
point de conversion, et il est partagé : une correction faite à moitié ne se
verrait que d'un seul côté.

**Les paliers de densité.** Une moitié mesure entre 192px et 844px de haut
selon l'installation et l'orientation, un rapport de plus de quatre. Aucune
`@media` ne saurait trancher, parce que la hauteur d'une moitié ne se déduit
pas de celle du viewport. C'est donc **la moitié elle-même qui est le contexte
de requête** (`container-type: size`), et trois paliers `@container` se
déclenchent sur sa taille : moitié basse, moitié très basse, moitié fine. Une
requête de conteneur ne pouvant pas styler son propre conteneur, la colonne de
contenu vit dans `.corps`, à l'intérieur de `.half`.

**Le filet.** `.half` défile plutôt que de couper. Ce n'est pas la mise en page
normale — une moitié qui défile de vingt pixels vaut toujours mieux qu'un
contenu tronqué en silence.

**Les jetons de couleur** sont déclarés à la fois sur `.stage` et sur `.plein`.
Tout ce qui vit hors de ces deux-là n'hérite d'aucune couleur et devient
illisible sur fond sombre.

---

## La garantie de non-fuite

Elle est structurelle, pas conventionnelle : **une réponse n'entre dans l'état
qu'à la validation**. Tant qu'un côté n'a pas validé, sa réponse n'existe nulle
part — ni dans l'état, ni dans le DOM. Et `HalfPanel` ne reçoit la réponse de
l'autre que lorsque les deux ont validé ; avant, elle vaut `undefined`.

Si vous modifiez `use-duo-machine.ts`, c'est l'invariant à ne pas casser.

---

## La fin, en trois temps

1. **La couture** (`ecrans/couture.tsx`) — la seule animation ample du projet.
   La ligne s'efface, les deux fonds convergent, la rotation à 180° se déroule.
   Tout le reste de l'expérience est volontairement sobre pour que ce
   mouvement-là surprenne.
2. **L'ordre du jour** (`ecrans/ordre-du-jour.tsx`) — les endroits où vous
   n'êtes pas d'accord, ceux où vous n'avez pas hésité, et ceux où l'un s'est
   trompé sur l'autre. Les distances de `distance.ts` servent **uniquement à
   trier** ; elles ne s'affichent jamais. Une section vide disparaît, et si
   tout a été passé, l'écran le dit au lieu de rester creux.
3. **La dernière question** (`ecrans/derniere.tsx`) — une question, rien
   autour. Pas de champ, pas de bouton, pas de partage, pas de « recommencer ».
   L'écran s'éteint au bout de vingt secondes, et il n'y a rien après.

---

## Vérifier

```bash
npx tsc --noEmit
npx eslint src/components/experience/entre-nous
npm run build
```

Et à la main, parce que rien de tout ça ne l'attrape :

- Un déroulé complet à deux, en portrait **et** en paysage, dans les deux
  installations.
- En face à face, la moitié du haut doit se lire confortablement à l'envers.
- Le classement au doigt **et** aux flèches, dans les deux orientations.
- Le tir à la corde à deux doigts en même temps.
- Un rafraîchissement en plein milieu d'un acte.
- Chaque question doit pouvoir être passée, sans commentaire.

### Résidu connu

En **paysage face à face**, chaque personne ne dispose que de 194px de haut.
Le classement et les révélations les plus denses y demandent une vingtaine à
une quarantaine de pixels de défilement. Tout reste atteignable, mais c'est
serré : en paysage, **côte à côte est nettement plus confortable**. Les trois
autres combinaisons tiennent sans défilement.
