# Écrire tes questions

Ce guide est pour toi qui écris, pas pour quelqu'un qui reprend le code (ça,
c'est le `README.md` à côté). Tout se passe dans un seul fichier :

```
src/components/experience/entre-nous/questions-perso.json
```

Il est versionné **vide**, et il le restera : ce que tu écris dedans ne part
jamais dans le dépôt, qui est public. Un `skip-worktree` est posé dessus, donc
`git status` ne le montre même plus.

---

## En un coup d'œil

Il y a **sept mécaniques**, plus un **mode pari** qui se pose par-dessus cinq
d'entre elles (c'est probablement ce qui en fait « huit » dans ta tête).

| Mécanique | Ce que ça donne à l'écran | Pour quel genre de question | `options` |
|---|---|---|---|
| `bascule` | Deux gros boutons empilés | Un choix franc, un aveu oui/non | **exactement 2** |
| `curseur` | Un axe entre deux formulations | Une nuance, un degré | **exactement 2** (les deux pôles) |
| `enchere` | Un nombre avec − et + | Un chiffre qu'on avoue | aucune — mais une `echelle` |
| `classement` | Des cartes à remettre dans l'ordre | Hiérarchiser, comparer | **3 à 5** (4 est le bon format) |
| `le-mot` | Une grille de mots, on en choisit 3 | Qualifier quelque chose | **12** (moins marche, voir plus bas) |
| `tir-a-la-corde` | **Un seul** curseur, tiré à deux | Se mettre d'accord sur une position | **exactement 2** (les deux pôles) |
| `a-voix-haute` | Rien à saisir, on se parle | Ce qui ne se tape pas | aucune |

Et le mode `pari` : après avoir répondu pour toi, tu devines la réponse de
l'autre. Compatible avec `bascule`, `curseur`, `enchere`, `classement`,
`le-mot`. **Ignoré** sur `a-voix-haute` (rien à deviner) et sur
`tir-a-la-corde` (deviner une valeur qu'on tient dans la main n'a pas de sens).

---

## Le format, champ par champ

```json
{
  "auteur": "Julien",
  "pour": "Mathilde",
  "questions": [
    { … une entrée … },
    { … une autre … }
  ]
}
```

`auteur` sert au marqueur affiché sur la carte : côté Mathilde elle lit
« écrite par Julien, pour toi », côté toi « c'est toi qui l'as écrite ». Écris
ton prénom **exactement** comme dans `content.ts` (`NOMS`), sinon les deux
côtés reçoivent le repli neutre « écrite par Julien ».

### Une entrée

| Champ | Obligatoire | Ce qu'il fait |
|---|---|---|
| `texte` | **oui** | La question. Une entrée sans texte, ou au texte vide, est ignorée en silence. |
| `mecanique` | non | Un des sept noms du tableau. À défaut, déduite du nombre d'`options` (voir ci-dessous). |
| `options` | selon la mécanique | Les pôles, les cartes, les mots. Forme exacte dans la section de chaque mécanique. |
| `acte` | non | `2` ou `3`. Un `1` est reclassé en `2` : l'échauffement reste neutre. Absent, c'est réparti automatiquement. |
| `pari` | non | `true` pour le mode pari. |
| `echelle` | pour une `enchere` | Les bornes et l'unité du nombre. Ignorée par les autres mécaniques. |
| `mot` | non | Ta phrase, révélée **sous les deux réponses**, à la fin de cette question-là. |

**Si tu ne déclares pas `mecanique`**, elle est déduite du nombre d'options :

| Nombre d'`options` | Mécanique choisie |
|---|---|
| 2 | `bascule` |
| 4 ou 5 | `classement` |
| 12 | `le-mot` |
| 0, 1, 3, ou plus de 5 | `curseur` |

`a-voix-haute` n'est jamais choisie automatiquement : elle se réclame, elle ne
se subit pas. **Déclare toujours `mecanique` explicitement** — la déduction est
un filet, pas une fonctionnalité. Trois options donnent un curseur qui ignore
la troisième, ce qui n'est probablement pas ce que tu voulais.

---

## Les sept mécaniques

### `bascule`

Deux boutons empilés, on en touche un. C'est net, c'est rapide, il n'y a pas de
milieu. Réserve-la aux questions où l'entre-deux serait une dérobade.

```json
{
  "texte": "Tu as déjà relu un de mes messages plus de trois fois",
  "mecanique": "bascule",
  "options": ["oui", "jamais"],
  "acte": 2,
  "pari": true,
  "mot": "Moi oui. Souvent. Et je m'en veux à chaque fois."
}
```

Les deux options sont les libellés des boutons. **Garde-les courts** : en
portrait côte à côte, une moitié fait 192px de large.

### `curseur`

Un axe entre deux formulations opposées, avec une poignée à glisser. Aucun
chiffre n'est jamais affiché : la position se dit en mots (« plutôt ceci »,
« entre les deux »). C'est la mécanique de la nuance.

```json
{
  "texte": "Quand je pars en week-end sans toi",
  "mecanique": "curseur",
  "options": ["ça me fait des vacances", "la maison est trop grande"],
  "acte": 3
}
```

`options` = **les deux pôles**, gauche puis droite. Les deux doivent rester
également défendables — sinon ce n'est plus une question, c'est un jugement, et
personne ne choisit honnêtement le pôle qui a tort d'avance.

### `enchere`

Un nombre qu'on monte et qu'on descend avec deux boutons. Pour les aveux
chiffrés — une durée, un compte, une fréquence.

```json
{
  "texte": "Combien de fois tu as failli m'appeler et raccroché avant",
  "mecanique": "enchere",
  "acte": 3,
  "pari": true,
  "echelle": { "min": 0, "max": 20, "pas": 1, "unite": "fois", "uniteSing": "fois" },
  "mot": "J'ai eu la réponse en te regardant hésiter."
}
```

L'`echelle` dit les bornes et l'unité :

| Champ | Obligatoire | |
|---|---|---|
| `min` | **oui** | La valeur de départ, et le plancher. |
| `max` | **oui** | Le plafond. Doit être strictement supérieur à `min`. |
| `pas` | non | De combien un appui fait bouger. Défaut : `1`. |
| `unite` | non | Le mot au pluriel : « jours », « fois », « onglets ». |
| `uniteSing` | non | Le mot au singulier, pour éviter « 1 jours ». Certaines unités sont invariables (« fois ») : dans ce cas, répète la même. |

Si tu omets `echelle`, ou si elle est incohérente (bornes inversées, `pas` nul,
valeur non numérique), tu retombes sur un repli **0 à 10 sans unité** — utilisable
mais muet. Autant l'écrire.

### `classement`

Des cartes qu'on remet dans l'ordre, au doigt ou avec les flèches. Pour
hiérarchiser, comparer, se trahir sur ce qu'on met en premier.

```json
{
  "texte": "Nos soirées, de la plus à la moins réussie",
  "mecanique": "classement",
  "options": [
    "celle où on n'a rien fait",
    "celle où on s'est perdus",
    "celle du restaurant fermé",
    "celle qu'on n'a pas racontée"
  ],
  "acte": 2
}
```

`options` = **les cartes, dans leur ordre de départ** (3 à 5, quatre est le bon
format). Chaque libellé sur une ligne : au-delà d'une trentaine de caractères,
ça se replie et la carte grandit.

### `le-mot`

Une grille de douze mots, on en choisit trois. Pour qualifier — une personne,
une période, une chose qu'on fabrique.

```json
{
  "texte": "Trois mots pour ce qu'on est en train de construire",
  "mecanique": "le-mot",
  "options": [
    "lent", "solide", "fragile", "évident",
    "neuf", "chaud", "libre", "sérieux",
    "léger", "inattendu", "durable", "vivant"
  ],
  "acte": 3
}
```

`options` = **exactement 12 mots**. La révélation met en évidence ceux que vous
avez choisis tous les deux, c'est là que la mécanique paie.

Deux règles d'écriture qui comptent :

- **Douze est le bon format**, mais une grille plus courte marche : le nombre de
  mots à choisir s'abaisse au nombre disponible. Six mots dans la grille, tu en
  choisis toujours trois ; deux mots, tu en choisis deux, et le compteur affiche
  « 2 / 2 ». En dessous de trois la mécanique perd son intérêt, mais elle ne
  bloque jamais.
- **Les mots doivent s'accorder avec ce qu'ils qualifient**, et être épicènes
  quand ils qualifient une personne : la même grille est montrée aux deux.
  Douze adjectifs au féminin pour « l'année » va ; douze adjectifs au masculin
  pour « la personne en face » ne va pas.

### `tir-a-la-corde`

**Un seul** curseur, partagé par les deux moitiés. Chacun tire de son côté, deux
doigts en même temps s'annulent. On valide quand on lâche — et si l'un lâche
avant l'autre, la révélation montre les deux endroits où vous avez lâché.

```json
{
  "texte": "Où on en est, tous les deux. À deux mains.",
  "mecanique": "tir-a-la-corde",
  "options": ["chacun sa bulle", "collés"],
  "acte": 3
}
```

`options` = les deux pôles. C'est la seule mécanique où vous agissez sur le même
objet en même temps ; garde-la pour une question qui mérite qu'on négocie.
Une seule par partie, sinon l'effet s'use.

### `a-voix-haute`

Pas de champ, pas de saisie. La question s'affiche, vous vous parlez, puis
chacun touche « c'est dit ». Le bouton arrive en fondu sur cinq secondes — il
ne bloque rien, il retient juste le réflexe de valider avant d'avoir parlé.

```json
{
  "texte": "Dites-vous ce que vous n'avez jamais osé demander à l'autre.",
  "mecanique": "a-voix-haute",
  "acte": 3,
  "mot": "J'ai écrit celle-là en sachant très bien ce que j'allais dire."
}
```

Pas d'`options`. C'est la mécanique qui sort les gens de l'écran, et la plus
facile à sous-estimer. **Formule-la à l'impératif, au pluriel** (« Dites-vous
que… »), parce qu'elle s'adresse aux deux à la fois, contrairement à toutes les
autres qui tutoient chacun de son côté.

### Le mode `pari`

`"pari": true` ajoute un second temps : tu réponds pour toi, puis tu devines
la réponse de l'autre. La révélation montre les deux réponses **et** les deux
paris.

C'est le cœur du jeu. L'écart entre ce que tu as cru de l'autre et ce qu'il a
répondu fait beaucoup plus parler que la réponse elle-même. Mais il double le
temps de saisie : **trois ou quatre paris sur toute la partie**, pas plus.

---

## Où tes questions vont tomber

Tu n'as pas la main sur la position exacte, et c'est voulu : le déroulé est
tiré au sort à partir d'une graine, puis contraint par des règles de rythme.

Ce qui est garanti :

1. **Toutes tes questions sont dans la partie.** Aucune n'est écartée.
2. **Jamais deux des tiennes à la suite.**
3. **Jamais en première position, jamais en dernière**, et jamais dans les deux
   dernières de l'acte 3 — la descente finale appartient à la banque.
4. **Acte 2 et acte 3 seulement.** L'acte 1 est l'échauffement, il reste neutre.
5. Un rafraîchissement ne rebat jamais les cartes.

### Combien tu peux en écrire

**Jusqu'à cinq, elles s'ajoutent** — trois en acte 2, deux en acte 3. La banque
reste entière, la partie passe de 23 à 28 questions.

**Au-delà, elles remplacent.** La sixième en acte 2 fait sortir une question de
la banque pour lui faire de la place. Rien ne casse, mais tu perds des questions
arbitrées. Si tu veux en écrire plus sans rien perdre, il y a une ligne à
changer (`TAILLE_CIBLE` dans `build-run.ts`) — demande-moi.

Six questions de la banque ne sortiront jamais, quoi qu'il arrive : l'ouverture
et la clôture de chaque acte, et le doublé de fin. Elles portent le rythme.

**Au-delà de quatorze**, la règle « jamais deux à la suite » commence à céder :
les actes 2 et 3 n'offrent pas assez d'emplacements. Ce n'est pas un bug, c'est
de l'arithmétique. Vérifié sur 2 760 déroulés : jusqu'à quatorze, tout tient.

---

## Les pièges, appris en construisant

**Un mot d'auteur long sur un classement, c'est la carte la plus lourde du jeu.**
Mesuré : une question perso en classement, avec marqueur et mot, demande 477px
de haut là où la moitié en fait 421 — il faut faire défiler de 56px. La même
question sans marqueur ni mot n'en demande que 5. Rien n'est perdu, tout reste
atteignable, mais si tu veux un mot long, mets-le plutôt sur une bascule ou un
curseur, dont la révélation tient en deux lignes.

**Attention au dosage des `a-voix-haute` dans l'acte 3.** La banque en contient
déjà trois sur sept. Si tu en écris une de plus et qu'elle tombe là, l'acte
passe à quatre moments hors de l'écran sur neuf questions — et les mécaniques
qui restent n'ont plus la place de respirer entre deux moments de parole. J'ai
descendu la banque de quatre à trois exactement pour cette raison. Si tu en
écris une, mets-la en acte 2.

**L'ordre du jour final est maigre si vos réponses se ressemblent.** Il liste
les trois écarts les plus grands, les réponses identiques, et les paris les plus
ratés — donc si vous répondez pareil partout, il n'affiche qu'une section sur
trois. Ce n'est pas un défaut, c'est une mesure. Mais si tu veux qu'il soit
riche, écris des questions où vous avez des chances de diverger : les questions
consensuelles font de belles conversations sur le moment et un récapitulatif
vide à la fin.

**Une question qui peut blesser plutôt que faire rire, posée en face de
quelqu'un qu'on aime, elle sort.** C'est le seul filtre, il est strict, et il
vaut surtout pour ce que tu écris toi : la banque est générique, tes questions
sont adressées.

---

## Tester une question sans redémarrer

Le serveur recharge le fichier à chaud. Lance-le une fois :

```bash
npm run dev -- -H 0.0.0.0
```

Sur le téléphone, même wifi : `http://192.168.1.10:3000/experience/entre-nous`
(l'IP s'affiche au démarrage sur la ligne `Network:`).

Ensuite : tu édites `questions-perso.json`, tu **rafraîchis la page**, c'est
pris en compte. Pas besoin de couper le serveur.

**Vide la session après avoir édité.** L'identifiant d'une question est dérivé
de son texte : si tu changes le texte, c'est une nouvelle question, et l'état
enregistré ne correspond plus. Dans la console du navigateur :

```js
sessionStorage.clear(); location.reload()
```

### Forcer une graine

Par défaut, chaque nouvelle session tire une graine au hasard, donc le déroulé
change. Pour retomber sur exactement le même à chaque essai :

```js
sessionStorage.setItem('entre-nous-graine', 'essai-1')
sessionStorage.removeItem('entre-nous')
location.reload()
```

Change `'essai-1'` en n'importe quelle autre chaîne pour voir un autre tirage.
C'est le moyen de vérifier qu'une question tombe bien à plusieurs endroits
différents sans jouer vingt minutes à chaque fois.

### Sauter directement à une question

Dans la console, une fois la calibration passée :

```js
const e = JSON.parse(sessionStorage.getItem('entre-nous'))
e.index = 12          // le numéro de la question, à partir de 0
sessionStorage.setItem('entre-nous', JSON.stringify(e))
location.reload()     // puis « Reprendre où vous en étiez »
```
