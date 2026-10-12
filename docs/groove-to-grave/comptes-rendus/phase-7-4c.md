# Groove To Grave — compte-rendu du bloc 7.4c (latence réelle, Action allégée, afficheur hors du chemin critique)

12 octobre 2026 · branche `experience/groove-to-grave` · commits `60905d1` (afficheur, Action), `79c6fb9` (ffmpeg) et `329ad17` (.npmrc) et le commit de ce compte-rendu · production https://portfolio-eight-sable-66.vercel.app · preview de la branche https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app

## 1. Mesure vraie de bout en bout, par le relais de production

Le relais fonctionne : la route répond `200 {"declenche":"g2g-medias"}` et l'Action démarre. **Il a d'abord fallu redéployer la production** : une variable d'environnement ajoutée dans Vercel n'est pas lue par un déploiement déjà en ligne, et la route répondait `G2G_GITHUB_TOKEN absent` (réponse 200, sans rien déclencher — c'est le comportement voulu, le filet planifié prend la suite).

Mesure du 12 octobre à 13:55:00, dépôt d'un fichier audio sur une piste publiée (ce que fait le label), chaîne complète :

| Étape | Horodatage | Depuis le dépôt |
|---|---|---|
| Fichier déposé, document publié | 13:55:00,4 | — |
| Webhook Sanity reçu par `/api/g2g/medias` | 13:55:01,6 | **1,3 s** |
| `repository_dispatch` transmis à GitHub par la route | 13:55:05,0 | 4,6 s |
| Exécution créée | 13:55:06 | 5,6 s |
| Exécution terminée (Action **d'avant** ce bloc) | 13:56:33 | 92,6 s |
| Extrait servi par la production | — | ≈ 97 s (revalidation mesurée à 3,6 s après l'Action au bloc 7.4b) |

**Le relais coûte 5,6 s, tout le reste est l'Action.** C'est exactement ce que ce bloc attaque au point 2.

Deux limites de mesure, dites franchement. D'abord le journal des tentatives de Sanity a une bonne minute de retard : mon script ne le voit pas à temps et affiche « aucune tentative vue », alors que l'horodatage, relu après coup, donne 1,3 s. Ensuite, **la mesure du bout en bout avec l'Action allégée n'est pas possible depuis la branche** : `repository_dispatch` exécute toujours le workflow de la branche par défaut, donc celui de `main`. Les 41 s mesurées au point 2 l'ont été par `workflow_dispatch` sur la branche. Après la fusion, je relance `scripts/g2g-mesure-pipeline.ts` pour le chiffre complet ; attendu : **environ 50 s** (5,6 + 41 + 4).

Au passage, le script de mesure avait deux défauts que j'ai corrigés : il attendait la fin de l'Action **avant** de regarder la page (le délai affiché incluait donc l'attente), et il pouvait prendre pour sienne une exécution plus ancienne. Il suit désormais les deux en parallèle et ne retient que les exécutions créées après le dépôt.

## 2. Action allégée : 97 s → 41 s

| Étape | Avant (7.4b) | Après |
|---|---|---|
| File d'attente, préparation | 4 s | 1 s |
| « Quelque chose à traiter ? » | — | 1 s |
| `checkout` | 12 s | **1 s** (partiel : `scripts`, `package.json`, `package-lock.json`, `tsconfig.json`, `.npmrc`) |
| `setup-node` | 8 s | 5 s |
| ffmpeg | **30 s** (`apt-get`) | **0 s** (binaire statique repris du cache) |
| `npm ci` | 22 s | 15 s (`--prefer-offline --no-audit --no-fund`) |
| Pipeline | 14 s | 10 s |
| Artefact | 1 s | 2 s |
| **Total** | **97 s** | **41 s** |

Première exécution après une invalidation du cache (téléchargement de 143 Mo du binaire statique, puis enregistrement du cache) : **44 s**, donc toujours sous l'objectif. Le cache est posé par branche : la première exécution sur `main` après la fusion téléchargera une fois.

Deux pièges rencontrés, tous les deux corrigés :
- les assets de la version « latest » de FFmpeg-Builds sont réécrits régulièrement et répondent **404** pendant ce temps : une exécution a échoué dessus. L'étape fait maintenant quatre reprises, puis **retombe sur `apt-get`** si le binaire reste indisponible ;
- le `checkout` partiel avait oublié **`.npmrc`** (`legacy-peer-deps=true`) : sans lui, `npm ci` échoue sur les pairs de `react-simple-maps`. C'est dans la liste désormais.

## 3. Plus d'exécutions à vide

Première étape du workflow : une requête GROQ unique, en `curl`/`python3`, **avant tout checkout et toute installation**, qui compte les documents dont le fichier d'origine n'a pas l'empreinte du dernier traitement, plus les extraits refusés dont la sortie est désormais parue (même règle que le script). Si le compte est 0, toutes les étapes suivantes sont sautées. Une erreur de lecture compte pour 1 : on ne saute jamais le pipeline sur un incident réseau.

**Mesuré : une exécution à vide passe de ~70 s à 8 s** (secondes de préparation du runner comprises). C'est ce qui arrive après chaque publication de texte et après chaque patch du pipeline lui-même, puisque le filtre du webhook ne sait pas distinguer les changements de fichier (voir 7.4b, `delta::changedAny` sans livraison).

Note d'exploitation découverte en mesurant : le groupe de concurrence fait que, **lorsque plusieurs publications s'enchaînent, les exécutions en attente sont annulées au profit de la dernière**. Ce n'est pas un problème — la dernière voit tout le travail restant — mais cela explique les exécutions « cancelled » dans l'historique.

## 4. VT323 hors du chemin critique

**Ce qui n'allait pas, et que je n'avais pas vu** : `next/font` envoie un en-tête HTTP `Link: <…>; rel=preload; as="font"` pour les polices d'une route **même déclarées `preload: false`**. VT323 partait donc avec Archivo, avant l'image LCP, alors qu'elle ne sert qu'à l'afficheur du lecteur — invisible tant que React n'a pas monté la racine. Gater la famille sous `[data-js]` ne suffisait pas : l'en-tête est émis quoi qu'il arrive.

**Ce qui est fait** : VT323 sort de `next/font`. Elle est déclarée à la main dans `g2g.css` (`@font-face` « G2G LCD », fichier sous-ensemblé copié dans `public/experience/groove-to-grave/polices/` par `scripts/g2g-polices.ts`), et la famille n'est appliquée que sous `.g2g[data-js]`. `font-display: block` : l'afficheur apparaît directement dans la bonne police plutôt que de passer sous les yeux par la monospace du système.

**Vérifié** (navigateur piloté, build de production local) :
- en-tête `Link` : Archivo seule ;
- **JavaScript désactivé : VT323 n'est plus demandée du tout** ;
- JavaScript actif : demandée à 120 ms (1440) et 134 ms (390), après le DOM prêt (94 et 52 ms) et après Archivo et Permanent Marker ;
- **l'afficheur ne saute pas** : géométrie identique au pixel avant et après l'arrivée de la police (afficheur et bande défilante, aux deux formats), `layout-shift` cumulé 0 ;
- `g2g-verif` contrôle désormais ce point à chaque exécution (« police de l'afficheur demandée après le contenu principal ») : **156 contrôles** au lieu de 154, tous au vert ; `g2g-a11y` 42/42 ; tokens 19 paires.

**Lighthouse, preview, mobile, cinq passages, médiane** :

| Page | Avant 7.4c | Après |
|---|---|---|
| accueil | 99 · 2,17 s | 98 · 2,32 s |
| sorties | 97 · 2,66 s | 99 · 2,01 s |
| sortie-gtgr05 | 94 · 3,01 s | **95 · 2,86 s** |
| soirees | 99 · 1,99 s | 99 · 2,17 s |

Les 48 kB de polices avant le LCP tombent à 43 kB. L'effet sur le score reste dans le bruit (les cinq passages d'une page vont de 90 à 100) : la page sortie est à 95, comme avant. Le gain est réel mais ailleurs : cinq kilo-octets et une requête de moins avant l'image sur un lien lent, et une page qui ne demande plus rien d'inutile sans JavaScript.

## 5. Score de la page sortie : arbitrage écrit dans le brief

Ajouté à la section performance : **95 en médiane sur `/sorties/gtgr05` est accepté**, avec sa cause (l'élément LCP est l'artwork en grand ; sur le lien 4G simulé, les octets qui passent avant lui bornent le LCP vers 2,9 s), ce qui a été fait (préchargement, une seule image, police de l'afficheur sortie du chemin critique), ce qui a été mesuré et écarté (médias en même origine : rien hors du bruit), et ce que nous choisissons de ne pas prendre : réduire la résolution de l'artwork ou ajouter une largeur intermédiaire (l'œuvre prime), différer Archivo (elle tient tout le texte visible), tailler le JavaScript inutilisé (socle Next). Le critère bloquant reste ≥ 95, il est tenu.

## 6. Les dix-sept comptes-rendus supprimés : je n'ai pas trouvé

J'ai cherché dans mes scripts : `grep` sur `rmSync`, `unlinkSync`, `renameSync`, `rm -rf`, `rmdir`, `mv`, `cpSync` dans tout `scripts/` ne renvoie **aucune ligne** — aucun outil du dépôt ne supprime, ne déplace ni ne renomme quoi que ce soit ; `dossier()` ne fait qu'un `mkdir -p`. L'archive était fabriquée par `zip -r` depuis la racine, qui copie et ne déplace pas (`zip -m` aurait déplacé, il n'a jamais été utilisé). Aucun dossier temporaire du dépôt n'est nettoyé par un script. **Je ne sais donc pas ce qui a supprimé ces fichiers**, et je préfère le dire plutôt que de désigner une cause plausible.

**Protection ajoutée** : `scripts/g2g-archive-phase.ts` fabrique désormais l'archive en copiant les fichiers dans un dossier temporaire **hors du dépôt** (`mkdtemp` dans le dossier temporaire du système), zippe depuis là, puis supprime ce dossier temporaire — jamais rien dans `docs/`. Le script refuse un chemin qui sortirait du dépôt et signale ceux qui n'existent pas au lieu de les ignorer en silence. La règle est écrite dans le brief. Cette archive-ci a été fabriquée avec.

## 7. Reste

- **Fusionner** : après quoi je relance `g2g-mesure-pipeline.ts` pour le bout en bout avec l'Action allégée (attendu ~50 s) et je te donne le chiffre.
- Phase 7.5 (autonomie du label) : toujours en attente de tes essais Safari et iPhone.
