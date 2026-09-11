# Rapport — passage du rendu prototype au rendu crédible

Branche `feat/rendu-graphique`. `npx tsc --noEmit` vert, `npm run build` vert,
ESLint propre sur tous les fichiers touchés (les 5 erreurs de
`NarrativeOverlay.tsx` / `useNarrativeEngine.ts` préexistent et n'ont pas été
touchées).

---

## 1. Fichiers

### Créés
- `src/components/experience/prototaxites/scene/terrain.ts` — heightmap unique (JS + GPU)
- `RAPPORT_GRAPHISME.md`

### Modifiés
- `scene/DevonianGround.tsx` — MeshStandardMaterial patché, heightmap, 384², ombres
- `scene/DevonianAtmosphere.tsx` — ciel 3 arrêts + halo solaire, ombres directionnelle
- `scene/DevonianForest.tsx` — ancrage terrain, rejet de pente, colonisation, `getForestPositions`
- `scene/DevonianTree.tsx` — `growth` en scale remplace `opacity`, `castShadow`
- `scene/Smoke.tsx` — réécriture : 4 colonnes × 90 particules, shader, disque doux
- `scene/Prototaxite.tsx` — MeshStandardMaterial patché (défaut D4, hors lots)
- `scene/PrototaxiteGroup.tsx` — ancrage terrain
- `scene/Arthropods.tsx` — resample de la hauteur à chaque pas
- `scene/DevonianWater.tsx` — niveau dérivé du terrain
- `scene/usePhaseVisibility.ts` — `easeInOutCubic`, `forestSpread`, `interior` à 0.3
- `PrototaxitesScene.tsx` et `lab/LabScene.tsx` — ombres, post-processing, câblage
- `package.json` — `@react-three/postprocessing` 3.1.1 + `postprocessing` 6.39.4

### Supprimés
Aucun fichier. La prop `opacity` de `DevonianForest`/`DevonianTree` a disparu au
profit de `forestSpread`/`growth`.

---

## 2. Défauts D1 → D7

| | État | Comment |
|---|---|---|
| **D1** arbres à y=0 | **Corrigé** | Chaque arbre lit `sampleTerrain(x,z)`, enfoncement 0.30. Vérifié numériquement sur les 24 arbres : pire flottement **−0.249** (jamais flottant), enfoncement entre 0.25 et 0.37. Idem Prototaxites (−0.235). |
| **D2** sol plat, éclairage en dur | **Corrigé** | `MeshStandardMaterial` + `onBeforeCompile`. La couleur passe par `diffuseColor` donc traverse le pipeline PBR ; `receiveShadow` actif ; détail de normale procédural à ~0.5 unité ; 384² segments. |
| **D3** ciel deux couleurs | **Corrigé** | 3 arrêts (horizon chaud → bande médiane → zénith bleu), transitions en `pow()`, halo solaire à 3 lobes synchronisé sur `sunPosition`. |
| **D4** Prototaxites fades | **Corrigé, hors lots** | Aucun lot ne le couvrait (A=sol, B=ciel, C=forêt, D=fumée). Je l'ai traité en Phase 2 avec le même motif que le sol : `MeshStandardMaterial` patché, stries fines, `castShadow`/`receiveShadow`. |
| **D5** forêt en fondu global | **Corrigé** | Colonisation par arbre : seuil sur le rang de distance au centre + jitter ±0.15, `growth = smoothstep(seuil, seuil+0.25, forestSpread)`, appliqué en **scale**. Les arbres sous 0.01 retournent `null` — mesuré : **8 draw calls** avant colonisation contre 85 après. |
| **D6** transitions raides | **Corrigé** | `easeInOutCubic` sur forest, prototaxites et smoke. Bornes et seuils inchangés (vérifié sur les 49 combinaisons phase × progress). |
| **D7** fumée illisible | **Corrigé** | 4 colonnes × 90 particules en 1 draw call, pied au sol via `sampleTerrain`, cône, ondulation déphasée, disque à bord doux, blending normal. Les foyers viennent de `getForestPositions()` : le feu naît dans la forêt. |

---

## 3. Mesures

Relevées sur `/lab`, GPU de la machine, rendu 2940×1594 (dpr 2).

| Phase | Draw calls | Triangles | Scène seule | Frame complète | Coût post |
|---|---|---|---|---|---|
| `presence` / `interior` / `ecosystem` | **8** | 304 k | 0.5–0.6 ms | — | — |
| `eclipse` @1 | **85** | 619 k | 1.2 ms | 2.8 ms | **1.6 ms** |
| `zoomout` @1 | **86** | 619 k | 1.0 ms | — | — |
| `resonance` | **85** | 619 k | 0.6 ms | — | — |

**Avant travaux** (relevé de la session précédente) : 30 draw calls, 108 k triangles.

- Le triangle count monte à 619 k, essentiellement le sol qui passe de 200² à 384²
  (80 k → 294 k triangles). C'est le prix assumé de la suppression du facettage.
- **Coût du post-processing isolé : 1.6 ms**, très en dessous du seuil de 8 ms.
  **SSAO est donc conservé.**
- Frame complète 2.8 ms au pire cas mesuré, soit ~357 fps théoriques. Le budget de
  50 fps n'est jamais approché.
- Les 8 draw calls des trois premières phases confirment que les arbres non encore
  colonisés ne coûtent rien.

---

## 4. Décisions prises face à une spec ambiguë ou fausse

### 4.1 Le contrôle numérique du socle (0.05) est inatteignable, et ne mesure pas la bonne chose

La spec demandait que `sampleTerrain(x,z).height` colle à `terrainHeight(x,z)` à
moins de 0.05, en annonçant qu'un écart supérieur signifierait un bug
d'interpolation. **Ce n'est pas un bug.** Mesures :

| Résolution | Écart max | Poids texture |
|---|---|---|
| 512 (spec) | 0.166 | 4 Mo |
| 1024 | 0.083 | 16 Mo |
| 2048 | 0.032 | 64 Mo |

L'écart est **divisé par deux à chaque doublement** de résolution : signature
exacte de l'erreur d'interpolation linéaire. La cause est que le fbm contient des
octaves de longueur d'onde 0.15 à 2.9 unités, très en dessous du texel de 1.56.
Atteindre 0.05 exigerait 2048², soit 64 Mo de texture — inacceptable.

Surtout, **ce contrôle ne mesure pas ce qui compte** : au rendu, plus rien
n'utilise `terrainHeight`. Le GPU déplace les sommets en lisant la heightmap, et
`sampleTerrain` lit la même heightmap. L'accord JS/GPU est donc exact **par
construction**, quelle que soit la distance à la fonction analytique.

J'ai remplacé le contrôle par celui qui décide réellement du défaut D1 : l'écart
entre `sampleTerrain` et la **surface effectivement rendue** (linéaire par
triangle sur 384 segments). Résultat : **0.2246** au pire cas.

### 4.2 L'enfoncement de 0.15 est insuffisant — porté à 0.30

Conséquence directe de la mesure ci-dessus : 0.15 ne couvre pas un écart de
0.2246, des arbres flotteraient. J'ai imposé 0.30 aux lots C et au groupe
Prototaxites. Vérification finale : pire flottement **−0.249**, donc jamais de
liseré visible, et enfoncement maximal 0.37, invisible car la base du tronc est
large.

### 4.3 Un miroir en Z rendait tout l'ancrage faux — bug le plus grave de la session

Le lot C l'a signalé sur l'ancien sol, je l'ai confirmé sur le nouveau. Le mesh du
sol porte `rotateX(-π/2)`, donc objet `(x,y,z)` → monde `(x, z, −y)` : **l'axe Y
du plan pointe vers le −Z monde**, alors que la heightmap est indexée sur le +Z
monde. Le shader échantillonnait donc le relief inversé en Z.

Mesure de l'écart entre la hauteur lue par le shader et `sampleTerrain` au même
point monde :

- sans correctif : **2.589 unités**
- avec miroir sur Y dans `groundUv()` : **0.0000**

Sans ça, tout le travail d'ancrage de la Phase 2 aurait été bâti sur du sable, avec
des arbres décalés de 1 à 2.5 unités. Deux corrections liées :
`groundUv()` mire l'axe Y, et la composante G de la normale est inversée pour
passer en espace objet.

### 4.4 Une erreur de signe dans ma propre `terrain.ts`

En vérifiant le point précédent j'ai trouvé que `sampleTerrain` retournait la
normale monde en `(r, b, −g)` au lieu de `(r, b, g)`. Sans effet sur le rejet de
pente (qui ne lit que `normal.y`, non affecté), mais faux pour tout usage futur de
l'inclinaison. Corrigé.

### 4.5 Le niveau d'eau : pas de cuvette, je ne bricole pas

La spec demandait de placer l'eau « à la hauteur réelle du terrain sous son
emprise », en me demandant de signaler l'absence de dépression crédible plutôt que
de bricoler. **Il n'y en a pas.** `terrainHeight` est structurellement ≥ 0 : le
`hash` est un `fract()` donc dans [0,1], le fbm en est une somme pondérée positive,
et le bruit n'est jamais recentré. Amplitude réelle mesurée : **0 à 4.67**, et sous
l'emprise du plan d'eau la « cuvette » ne fait que **0.33 unité** — du bruit, pas
une forme de relief.

Je n'ai donc pas recentré le bruit (changement à part entière, comme tu l'as dit).
J'ai remplacé le `y = 2.0` arbitraire par un **percentile des hauteurs réelles sous
l'emprise** (35ᵉ), soit `y = 2.614`, ce qui donne 35 % de l'emprise submergée. Le
niveau suit désormais le relief si celui-ci change. Taux de submersion mesurés :

| y | 2.0 (ancien) | 2.4 | 2.6 | 2.8 |
|---|---|---|---|---|
| submergé | 4.8 % | 20.3 % | 34.6 % | 49.3 % |

À 4.8 %, l'eau ne se lisait qu'en filets — c'est pour ça qu'elle paraissait absente.

**Proposition** : si tu veux une vraie zone humide plutôt que des mares entre les
bosses, il faut recentrer le bruit (`(fbm − 0.5) * amplitude`) pour que le sol
descende sous 0. C'est ta décision, elle change le relief déjà validé.

### 4.6 L'easing sur les arthropodes est sans effet

La spec demandait d'appliquer `easeInOutCubic` aux quatre rampes, arthropodes
inclus. Mais `arthropods` est une **fonction en escalier** (0 avant `ecosystem`,
1 à partir de) : il n'y a aucune rampe à adoucir, et adoucir une constante est un
no-op. Leur donner une vraie rampe changerait la valeur à la borne
`ecosystem @ progress 0` (de 1 à 0), ce que la spec interdit explicitement. J'ai
donc laissé l'escalier et je le signale plutôt que de faire semblant.

### 4.7 D4 n'était couvert par aucun lot

A = sol, B = ciel, C = forêt, D = fumée. Les Prototaxites n'apparaissaient nulle
part alors qu'ils figurent dans la liste des défauts. Je l'ai traité en Phase 2
avec le motif validé sur le sol. Sans ça le défaut serait resté ouvert en silence.

### 4.8 Réglage SSAO revu après constat visuel

Le premier réglage (`intensity 22`, `radius 3`, 16 samples) produisait un **grain
visible sur les troncs**, constaté sur capture zoomée. Ramené à `intensity 9`,
`radius 2.2`, 31 samples / 7 rings + `depthAwareUpsampling`. `denoiseIterations`
n'existe pas dans le typage de `@react-three/postprocessing` 3.1.1 — écarté.

### 4.9 Branche plutôt que commits directs sur `main`

Tu demandais des commits après Phase 0 et Phase 2 sans préciser la branche. J'ai
créé `feat/rendu-graphique` plutôt que de committer sur `main`. Fusion triviale si
ça te convient.

---

## 5. Ce qui n'a pas marché

- **npm n'a pas installé le peer `postprocessing`.** `@react-three/postprocessing`
  3.1.1 s'installe seul mais son peer requis `postprocessing@^6.36.0` restait
  absent (`npm ls postprocessing` → vide), ce qui aurait planté à l'import.
  Installé explicitement en 6.39.4. Compat R3F v9 confirmée par ailleurs : le peer
  déclaré est `@react-three/fiber >=9.7.0`, on est exactement à 9.7.0.
- **L'agent du lot A a été coupé** par une limite de session avant son
  auto-vérification. Son fichier était écrit et cohérent ; j'ai repris la
  vérification à mon compte (existence des 4 chunks `#include` dans
  `meshphysical.glsl.js` de three 0.185 — les quatre présents une fois chacun,
  donc les patchs s'appliquent et le garde-fou ne lève pas).
- **La vérification visuelle phase par phase n'a pas pu être menée à son terme.**
  Le blocage de mesure R3F déjà connu (canvas figé à 300×150 parce que le
  `ResizeObserver` de `react-use-measure` ne reçoit jamais de frame dans la fenêtre
  automatisée) s'est déclenché après rechargement et a résisté à un onglet neuf.
  J'ai obtenu **une capture exploitable en phase `presence`**, qui montre le
  nouveau ciel, l'eau lisible, les ombres portées au pied des Prototaxites et le
  sol éclairé par la scène. Les autres phases ont été validées **numériquement**
  (opacités, draw calls, ancrage, absence de clipping) faute de mieux. **À vérifier
  de ton côté sur `/lab`**, notamment `eclipse` en faisant glisser le slider, qui
  est la transition la plus difficile à juger sur des chiffres.
- **Le rejet de pente est inerte.** Implémenté comme demandé (`normal.y < 0.75`),
  mais le lot C a mesuré un `normal.y` minimal de 0.900 sur l'anneau de placement :
  le relief est trop doux pour qu'une pente de 41° existe. Le garde-fou est correct
  mais ne se déclenchera jamais tant que l'amplitude du terrain ne monte pas.

---

## 6. Ce qui reste faible visuellement, par ordre d'impact

1. **Le relief est trop mou pour l'échelle de la scène.** Amplitude 0 → 4.67 sur
   800 unités, sans aucune dépression. C'est la racine de trois symptômes : l'eau
   qui ne peut faire que des flaques, le rejet de pente inerte, et un horizon
   monotone. C'est le seul changement qui débloquerait vraiment le réalisme, et
   c'est celui que je n'ai pas fait parce qu'il touche le relief validé.
2. **Le sol reste peu texturé de loin.** La perturbation de normale à 0.5 unité
   joue de près, mais au-delà de ~30 unités elle disparaît sous la résolution
   écran. Il manque une variation de couleur à moyenne échelle (5–20 unités),
   plaques de lichen ou d'humidité, pour casser l'aplat.
3. **Les ombres ne couvrent que ±60 unités.** Choix assumé pour la netteté, mais
   au-delà les arbres de l'anneau extérieur (rayon jusqu'à 34, plus leur canopée)
   sont à la limite du frustum. À surveiller si tu élargis la forêt.
4. **La fumée ignore le fog.** Un `ShaderMaterial` ne reçoit pas le `FogExp2` : à
   distance les colonnes seront un peu trop nettes par rapport au reste. La
   dilution en altitude compense partiellement.
5. **La transparence du tronc en `interior` (0.3) va se battre avec SSAO et les
   ombres.** Les objets transparents ne s'écrivent pas dans le depth prepass ;
   l'occlusion ambiante autour des tubes internes risque d'être incohérente. Non
   vérifié visuellement, faute de navigateur.
6. **Le halo solaire n'a pas de god rays.** Il est purement dans le shader de ciel,
   donc il ne réagit pas aux occlusions du terrain ni des troncs.

---
---

# Lot relief & eau — 9 septembre 2026

Branche `feat/relief-eau`, partie de `feat/rendu-graphique`. `npx tsc --noEmit`
vert, `npm run build` vert, ESLint propre sur les fichiers touchés (les 5 erreurs
de `NarrativeOverlay.tsx` / `useNarrativeEngine.ts` restent hors périmètre).

Cible : le point 1 de la section 6 précédente — relief trop mou, racine de l'eau
en flaques, du rejet de pente inerte et de l'horizon monotone.

## 1. Fichiers touchés

- `scene/terrain.ts` — bruit signé, réseau de chenaux, `TERRAIN_MIN/MAX`, `WATER_LEVEL`
- `scene/DevonianWater.tsx` — réécriture : plan 500² au niveau d'eau, `MeshReflectorMaterial`
- `scene/DevonianGround.tsx` — frange humide sur la berge, rampe de couleur recalée
- `scene/DevonianForest.tsx` — rejet sous l'eau, fenêtre angulaire élargie, repli au plus sec
- `scene/PrototaxiteGroup.tsx` — décalage vers le point sec le plus proche
- `scene/Arthropods.tsx` — demi-tour au bord des chenaux
- `RAPPORT_GRAPHISME.md` — cette section

## 2. Mesures

### Contrôle 1.5 (relief)

| Contrôle | Résultat | Cible |
|---|---|---|
| (a) surface sous `WATER_LEVEL` | **25,1 %** | 20–30 % ✅ |
| (b) minimum zone centrale `r < 10` | **1,79** contre eau à −2,13 | au-dessus ✅ |
| (c) composante immergée dominante | **89,0 %** en 45 composantes | > 60 % ✅ |

`TERRAIN_MIN = −5,00`  `TERRAIN_MAX = 3,09`  `WATER_LEVEL = −2,128`
Creux à 5 unités sous zéro, contre la consigne d'au moins 3.

### Coût isolé du reflet

`MeshReflectorMaterial` à `resolution 512`, mesuré en masquant le plan d'eau :
**0,80 ms** (1,40 ms avec, 0,60 ms sans). Seuil de bascule à 6 ms — très en
dessous, **résolution 512 conservée**, pas de repli à 256.

### Ancrage après changement de relief

24 arbres : pire flottement **−0,244**, enfoncement max 0,458, **0 sous l'eau**,
rayon max 32,6. Aucun clipping. **L'enfoncement de 0,30 reste suffisant** : le
relief est plus profond mais pas plus accidenté à l'échelle du quad de 2,08.
Prototaxites : pire flottement −0,234, 0 sous l'eau après décalage.

## 3. Décisions face à une spec ambiguë ou fausse

### 3.1 Soustraire une profondeur de chenal ne marche pas — il faut creuser vers un fond commun

La spec proposait `1 - abs(noise)` composé « par un min() ou un mélange
pondéré ». Appliqué tel quel, le résultat échoue au contrôle de connectivité :
**23,1 % de composante dominante sur 214 composantes**, soit exactement les
flaques qu'on voulait éviter.

Cause : en soustrayant une profondeur, le **fond du chenal suit le relief de
base**. Là où la base remonte, le fond repasse au-dessus du niveau d'eau et coupe
le chenal en chapelet. J'ai remplacé la soustraction par une **interpolation vers
un fond constant** (`base * (1 - masque) + FOND * masque`) : le fond des chenaux
devient plat, donc continûment sous l'eau. Résultat : **89 %**.

Deuxième correction dans la même veine : le masque est bâti sur **une seule
octave**, pas sur le fbm à 5 octaves. `|fbm|` a un ensemble de zéros haché, donc
des chenaux hachés. Mesuré : 5 octaves → 214 composantes, 1 octave → 118, avant
même le changement de composition.

Réglage retenu après balayage : fréquence 0,020 et exposant 6 — j'ai ajouté une
mesure de **finesse (périmètre/aire)** pour distinguer un vrai réseau d'un lac,
que le seul critère de connectivité ne sépare pas. Un lac compact et un réseau
ramifié donnent tous deux une composante dominante élevée. Finesse 0,33 à
fréquence 0,010 (lac) contre **0,64** à 0,020 (rubans), à connectivité
équivalente.

### 3.2 Le rejet de pente est TOUJOURS inerte, et les 66 % de rejet ne sont pas un seuil à assouplir

La spec anticipait que le rejet `normal.y < 0.75` se déclencherait sur le nouveau
relief et demandait d'assouplir le seuil au-delà de 40 % de rejet. Mesuré :

- **pente seule : 0,0 %** — `normal.y` percentile 10 = **0,909**, très au-dessus
  de 0,75. Le relief est plus profond mais toujours doux en pente, parce que les
  chenaux sont larges par rapport à leur profondeur et que la heightmap lisse à
  1,56 unité/texel.
- **eau seule : 66,7 %** — la totalité du rejet.

Assouplir le seuil n'aurait donc **rien changé** (le critère de pente ne se
déclenche jamais), et assouplir le critère d'eau aurait remis des arbres dans les
chenaux, ce que le lot cherchait précisément à éviter. Le vrai problème était
ailleurs : la fenêtre angulaire de recherche était de ±0,25 rad autour du secteur
attribué à chaque arbre, donc un arbre dont le secteur tombait sur un chenal ne
pouvait pas s'en extraire — 4 arbres finissaient dans l'eau malgré 16 tentatives.

J'ai **élargi progressivement la fenêtre angulaire** avec le numéro de tentative
(±0,25 rad au premier essai, jusqu'à ±π au dernier) et ajouté un **repli sur le
candidat le plus sec** plutôt que sur le dernier tiré. La répartition régulière en
anneau est préservée pour la majorité des arbres, et on ne s'en éloigne qu'au
besoin. Résultat : 0 arbre dans l'eau.

Le taux de rejet par tirage reste 66,6 %, mais **ce n'est pas un défaut** : c'est
la mesure de la fraction de l'anneau 14–34 désormais occupée par les chenaux. Je
l'ai laissé tel quel et documenté plutôt que de le maquiller.

### 3.3 Les Prototaxites sont composés, pas tirés au sort

La spec dit « rien ne doit être placé sous `WATER_LEVEL` (rejette et retire un
autre point) ». Applicable aux arbres, pas aux Prototaxites : leurs positions sont
un choix de composition. Un Prototaxite se retrouvait sous l'eau après le
changement de relief.

Plutôt que de les retirer au sort (ce qui casserait la composition) ou de les
soulever (ce qui les ferait flotter), j'ai ajouté une **recherche en spirale
courte** vers le point sec le plus proche. Deux des six ont bougé, de 1,5 et 6,0
unités ; les quatre autres n'ont pas bougé. La composition est préservée à peu
près.

### 3.4 La rampe de couleur du sol était calée sur l'ancienne plage — corrigé

Effet de bord non prévu par la spec, repéré sur capture : le shader du sol
calculait `t = clamp(hauteur / 4.0, 0, 1)`. Avec un relief passé de [0 ; 4,67] à
[−5,00 ; 3,09], presque tout le terrain tombait sur `t ≈ 0`, donc sur la couleur
basse — un aplat vert olive uniforme. J'ai recalé la rampe sur
`TERRAIN_MIN`/`TERRAIN_MAX` passés en uniforms. Sans ça, tout le travail de
relief aurait été invisible faute de contraste.

### 3.5 `WATER_LEVEL` exposé comme fonction, pas comme constante

`TERRAIN_MIN`, `TERRAIN_MAX` et `WATER_LEVEL` sont des **fonctions** et non des
`const` exportées, parce qu'elles dépendent de la heightmap : les évaluer au
chargement du module forcerait la construction de la texture 512² à l'import,
donc côté serveur au build de Next. Sous forme de fonctions mémoïsées, le calcul
n'a lieu qu'au premier appel réel, côté client.

### 3.6 Le frustum d'ombre n'a pas eu besoin de changer

Vérifié comme demandé (3.3) : le rayon maximal effectivement occupé après les
rejets est de **32,6** pour les arbres et 21,6 pour les Prototaxites, largement
dans les ±60 du frustum. Aucune modification.

## 4. Ce qui n'a pas pu être vérifié

La vérification visuelle a été **partielle**. J'ai obtenu **une capture
exploitable** avant la correction de la rampe de couleur (3.4) : elle montre le
relief en place, l'éminence centrale, l'ombre portée du Prototaxite, l'horizon
qui ondule enfin, et les nappes d'eau réfléchissantes de part et d'autre. Après
la correction de rampe, le blocage de mesure R3F connu (canvas figé à 300×150) est
revenu et a résisté à la seconde tentative — je n'ai pas insisté, conformément à
la consigne. **La rampe de couleur recalée n'est donc pas confirmée
visuellement** : c'est une remise à l'échelle arithmétique, sûre en soi, mais le
choix des trois couleurs `lowColor`/`midColor`/`highColor` mérite ton œil
maintenant qu'elles se répartissent sur toute la plage. **À regarder en premier
sur `/lab`.**

## 5. Ce qui reste faible visuellement, par ordre d'impact

1. **Les trois couleurs du sol n'ont pas été rechoisies après le recalage.** Elles
   avaient été réglées pour une plage [0 ; 4,67] tassée vers le bas ; elles
   s'étalent maintenant sur [−5 ; 3,09]. Le dégradé fonctionne, mais les teintes
   elles-mêmes n'ont pas été retravaillées pour le nouveau contraste.
2. **Les stries des Prototaxites sont trop régulières.** Le `sin(uv.y * 220)`
   ajouté au lot précédent donne un effet velours côtelé bien visible de près sur
   la capture. Un bruit remplacerait avantageusement la sinusoïde.
3. **La berge humide n'est qu'un assombrissement.** La bande entre `WATER_LEVEL`
   et `+0,4` fonctionne, mais il manque le vrai marqueur de rive : dépôt clair,
   ligne de laisse, végétation basse. Le lot végétation le traitera mieux.
4. **L'eau n'a ni transparence de profondeur ni écume.** `MeshReflectorMaterial`
   donne le reflet, qui est l'essentiel, mais le fond n'est pas visible en eau
   peu profonde et le contact eau/terre est net au pixel près.
5. **Le réseau de chenaux n'a pas de sens d'écoulement.** Le fond est à niveau
   constant (−5), ce qui garantit la connectivité mais interdit tout ruissellement
   crédible. Un léger gradient général donnerait une direction à la plaine.

---
---

# Lot végétation & troncs — 9 septembre 2026

Branche `feat/vegetation-troncs`, partie de `feat/relief-eau`. `npx tsc --noEmit`
vert, `npm run build` vert, ESLint propre sur les fichiers touchés (les 5 erreurs
de `NarrativeOverlay.tsx` / `useNarrativeEngine.ts` restent hors périmètre).

## 1. Fichiers touchés

- `scene/GroundFlora.tsx` — **créé** : ~400 Cooksonia instanciées, 1 draw call
- `scene/DevonianGround.tsx` — tapis cryptogamique (mousse + lichen), `GROUND_SEGMENTS` exporté
- `scene/Prototaxite.tsx` — écorce à bruit deux échelles, normale perturbée, pied lichéneux, graine par instance ; gardes `visible`/`castShadow` sur l'opacité
- `scene/DevonianForest.tsx` — seuils de colonisation renormalisés, `GROWTH_BAND` 0.25 → 0.35, exports `getForestThresholds` / `FOREST_GROWTH_BAND`
- `scene/PrototaxiteGroup.tsx` — graines distinctes 0 à 5
- `PrototaxitesScene.tsx` et `lab/LabScene.tsx` — câblage de `<GroundFlora />`
- `RAPPORT_GRAPHISME.md` — cette section

## 2. Vérification du lot 1.2 (colonisation)

Seuils désormais étalés sur **exactement [0.000, 0.650]** = `[0, 1 − GROWTH_BAND]`.

| forestSpread | 0.50 | 0.75 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|
| arbres à `growth = 1` | 7 | 17 | 21 | 23 | **24 / 24** |

- **Le dernier arbre atteint `growth = 1` à `forestSpread = 1.000`** — donc bien
  au-delà du seuil de 0.95 demandé.
- Premier arbre plein à 0.350, plus grand palier entre deux achèvements
  consécutifs : **0.078**. Le front progresse continûment.

## 3. Coût du lot 3 (Cooksonia)

Mesuré en masquant l'`InstancedMesh`, phase `presence`, rendu 2940×1594 :

| | avec flore | sans flore |
|---|---|---|
| temps de rendu | 0.70 ms | 0.70 ms |
| draw calls | **15** | 14 |
| triangles | 353 922 | 313 122 |

**Coût isolé : 0.00 ms**, sous la résolution de mesure. 400 instances pour
**+1 draw call** et +40 800 triangles. Budget de 2 ms très largement respecté,
aucune raison de réduire la densité.

## 4. Décisions face à une spec ambiguë ou fausse

### 4.1 « Aucun arbre n'atteint growth = 1 avant 0.95 » est incompatible avec un front progressif

Pris au pied de la lettre, ce critère imposerait que **tous** les arbres finissent
leur croissance après 0.95, donc qu'ils poussent tous en bloc à la toute fin —
exactement le « fondu global » que le lot cherche à supprimer. J'ai retenu la
lecture cohérente avec la phrase précédente de la spec (« le **dernier** arbre
finit au tout dernier moment ») : c'est le maximum qui doit dépasser 0.95, pas
l'ensemble. Mesuré à 1.000. Si tu voulais vraiment la lecture littérale, dis-le,
mais elle annule l'effet de colonisation.

### 4.2 La cause du velours côtelé n'était pas celle indiquée

La spec attribuait l'effet à « `sin(uv.y * 220)` », en le décrivant comme des
stries verticales. Sur une `CylinderGeometry`, **`uv.y` est la coordonnée
axiale** : cette ligne empilait donc ~220 **anneaux horizontaux** le long du
tronc. C'était précisément ça, l'effet corduroy. Les cannelures verticales
viennent de `uv.x`. Le commentaire « stries verticales fines » du fichier était
faux, et il a été corrigé en même temps que le code.

Corollaire non prévu : `uv.x` reboucle de 1 à 0 autour du tronc, donc un bruit de
valeur écrit pour un plan y laisse une **couture verticale nette**. Le bruit
d'écorce prend un paramètre de bouclage, et l'offset de graine doit rester entier
sous peine de désaligner ce bouclage.

### 4.3 `wetProximity + 6.0` est plus large que tout le relief émergé

La règle de densité que j'ai imposée aux deux lots
(`1 - smoothstep(WATER_LEVEL, WATER_LEVEL + 6, h)`) suppose 6 unités d'émergé.
Le terrain n'en a que **5.21** (−5.00 à +3.09, eau à −2.128). `wetProximity` ne
tombe donc jamais à 0 : minimum ~0.05 au point le plus haut, et encore 0.82 à
l'altitude médiane. Conséquence directe : sans compensation, **le lichen sec
n'apparaissait nulle part**. Il a fallu remapper la sécheresse. J'ai gardé la
formule inchangée parce que c'était le contrat partagé entre mousse et flore —
mais elle est mal calibrée pour ce relief, et la vraie correction serait
`WATER_LEVEL + 4.0`.

### 4.4 `sampleTerrain` ne suffit pas pour poser des plantes de 15 cm

Écart connu entre la heightmap bilinéaire et la surface réellement rasterisée
(linéaire par triangle) : médiane 0.005, mais **max 0.139** sur les zones de
semis. Négligeable pour un arbre de 8 unités, pas pour une Cooksonia de 0.15 —
jusqu'à 90 % de sa hauteur. Le lot 3 reconstruit donc la hauteur du triangle
effectivement rendu à partir de quatre `sampleTerrain` aux coins du quad, ce qui
ramène l'enfoncement nécessaire à 0.02. Cela imposait de connaître le pas exact
du maillage : **j'ai exporté `GROUND_SEGMENTS` depuis `DevonianGround.tsx`** pour
supprimer la constante dupliquée que le lot avait dû recopier.

### 4.5 Le test de planéité de la mousse doit être très serré

Les normales de la heightmap sont des différences finies au pas de 1.57 unité :
cos(pente) médian **0.992**, 0.778 au 1ᵉʳ percentile. Un `smoothstep(0.5, 0.9)`
« naturel » aurait été un no-op complet. Il faut `[0.82, 0.94]` pour que la mousse
lâche effectivement sur les parois de chenal. Même remarque que pour le rejet de
pente des arbres au lot précédent : ce relief est profond mais doux.

### 4.6 Le seuil de coupure des ombres est un compromis, pas une solution

Une shadow map ignore l'alpha d'un matériau opaque : il n'existe pas de moyen
simple de faire *fondre* une ombre. J'ai donc coupé `castShadow` sous une opacité
de **0.2** — bas volontairement, pour que le « pop » de l'ombre survienne quand le
tronc est déjà très effacé. Vérifié : à `eclipse@1`, 0/6 `castShadow` et 0/6
visibles ; à `eclipse@0.75` (opacité 0.5) les six projettent encore. Une
disparition vraiment continue demanderait des ombres dithered, hors budget ici.

### 4.7 Sporanges volontairement surdimensionnés

À l'échelle réelle (~2 mm) les sporanges passeraient sous le pixel et la plante se
lirait comme un simple fil. Ils font ~2 cm. C'est le seul écart assumé au
réalisme morphologique — la structure (axe nu, dichotomie unique, aucune feuille)
est elle strictement dévonienne.

### 4.8 Semis en touffes plutôt que point à point

Ajout du lot 3 par rapport à la spec : la règle `wetProximity` seule donne un
semis régulier de type gazon. Les points tirés servent de graines, et cinq plantes
s'y accrochent dans un rayon de 1.1. Distance médiane au plus proche voisin 0.45 :
ça lit comme des tapis de berge plutôt qu'un gazon. Réversible en une constante.

### 4.9 `<Instances frames={1}>` et un piège de mesure

La flore est statique, donc drei n'a pas besoin de recomposer 400 matrices par
frame. Attention pour toute mesure future : **drei ne renseigne `count` que dans
son `useFrame`**. Tant qu'aucune frame n'a tourné, tous les `InstancedMesh` de la
scène ont `count = 0` et ne rendent rien — j'ai d'abord cru la flore absente avant
de comprendre que c'était l'environnement de mesure figé, pas un bug.

## 5. Ce qui reste faible visuellement, par ordre d'impact

1. **La palette du sol est trop pâle et trop sableuse.** Sur la capture, le
   dominant est un beige clair ; les plaques de mousse et de lichen se lisent,
   mais l'ensemble est loin du « tapis vert-jaune » de la référence. C'est la
   suite directe du point 1 de la section précédente : les trois couleurs de base
   n'ont toujours pas été rechoisies depuis le recalage sur `TERRAIN_MIN/MAX`, et
   elles dominent les deux nouvelles couches. C'est le réglage à faire en premier.
2. **`wetProximity` est mal calibré** (4.3) : à `+6.0` sur 5.21 unités d'émergé,
   la mousse est presque partout et le lichen presque nulle part. Passer à `+4.0`
   redonnerait du contraste entre berge et hauteur — un seul chiffre à changer,
   dans les deux fichiers.
3. **Les cannelures n'affectent pas la silhouette des troncs.** Elles agissent sur
   la normale et la couleur, pas sur le contour : le déplacement radial était hors
   périmètre du lot. De profil sur ciel clair, le bord du tronc reste lisse.
4. **La flore s'arrête net à 45 unités.** Le rayon borné coûte zéro, mais la
   limite est visible en vue aérienne (`resonance`, `zoomout`) où le tapis de
   berge disparaît d'un coup. Un fade en scale sur les 10 dernières unités
   suffirait.
5. **Le grain d'écorce est en coordonnée UV, donc constant en angle.** Sur les
   troncs à `sx = 0.5` il est deux fois plus dense en unités monde que sur le
   principal. Peu visible, mais incohérent si on compare deux troncs voisins.

---
---

# Lot palette & performance — 10 septembre 2026

Branche `fix/palette-perf`, partie de `feat/vegetation-troncs`. `npx tsc --noEmit`
vert, `npm run build` vert, ESLint propre sur les fichiers touchés.

## 1. Priorité 1 — régression de performance

### D'abord : ma mesure précédente était fausse

Le rapport du lot relief annonçait « frame complète 2.8 ms, ~357 fps ». **C'est
faux.** Ces chiffres venaient d'un `gl.render()` encadré par `ctx.finish()` — or
`finish()` sur un contexte WebGL ne bloque pas jusqu'à la fin du travail GPU sous
Chrome/ANGLE, il se comporte en gros comme un `flush()`. Toutes les mesures des
lots précédents sous-estimaient donc massivement le coût GPU.

J'ai refait les mesures avec `EXT_disjoint_timer_query_webgl2`, qui donne le vrai
temps GPU écoulé. **Les 19 fps que tu observes sont réels ; mes 60 fps ne
l'étaient pas.**

Deuxième correctif de méthode : `rAF` est complètement gelé dans la fenêtre
automatisée (0 frame en 3.4 s), donc le compteur `<Stats />` y est inexploitable —
ce qui explique les « 0 FPS » et les « 60 FPS » erratiques des sessions
précédentes.

### Mesure par élimination (temps GPU réel, phase `presence`, 2940×1594, dpr 2)

Décomposition de la scène (hors composer), base 14.65 ms :

| Élément | Coût isolé |
|---|---|
| Sol 384² + shader | **7.06 ms** |
| Reflector (eau) | 0.84 ms |
| GroundFlora (400 instances) | 0.78 ms |
| Reste (troncs, ciel, shadow map) | ~6 ms |

Élimination sur la frame complète :

| Configuration | Frame GPU | fps (cette machine) |
|---|---|---|
| Départ (SSAO 31/7, multisampling 8) | **114.68 ms** | 8.7 |
| SSAO ramené à 8 samples / 3 rings | 70.69 ms | 14.1 |
| SSAO retiré | 51.96 ms | 19.2 |
| `multisampling={0}` | 25.76 ms | 38.8 |
| + SMAA en compensation | 43.72 ms | 22.9 |
| **Configuration retenue** (sans SSAO, sans SMAA, multisampling 0) | **25.5 ms** | **39.2** |

### Ce qui a été coupé, et le gain de chaque coupe

1. **`multisampling={0}` sur `<EffectComposer>` — gain ~26 ms.** C'est la coupe la
   plus rentable de tout le lot, et elle n'était pas dans la liste des suspects.
   drei crée par défaut une cible de rendu **MSAA ×8** ; à 2940×1594 la résolution
   du framebuffer multi-échantillonné coûtait à elle seule plus que toute la scène.
2. **SSAO retiré — gain ~26 ms supplémentaires** (38.7 ms mesurés à 8/3, après
   passage à multisampling 0). Réduire les samples de 31/7 à 8/3 ne suffisait pas :
   l'essentiel du coût vient de `enableNormalPass`, qui impose **un rendu complet
   de la scène en plus** pour la passe de normales. Conforme à l'ordre d'arbitrage
   de la spec (samples réduits, puis retrait).
3. **SMAA testé puis abandonné** — 18 ms pour compenser la perte du MSAA, hors
   budget. À dpr 2 le suréchantillonnage limite déjà l'aliasing.

**Non coupés, mesures à l'appui** : le reflector reste à `resolution 512` (0.84 ms,
soit 0.7 % de la frame de départ) et le sol reste à 384² (7.06 ms mais c'est lui
qui porte le relief et supprime le facettage). La spec plaçait le reflector en
tête de l'ordre d'arbitrage — la mesure dit l'inverse, je ne l'ai donc pas touché.

**Bilan : 114.68 ms → 25.5 ms, soit 4.5× plus rapide.**

### Ce que je ne peux pas garantir

Je ne peux pas mesurer le fps sur ta machine, seulement sur ce contexte
automatisé, qui est plus lent : j'y mesure 114.68 ms sur la configuration de
départ là où tu observes 52 ms (19 fps), soit un facteur **~2.2**. Au même
rapport, les 25.5 ms retenus donneraient **~11.6 ms chez toi, soit ~85 fps**. La
cible de 60 fps devrait donc être atteinte avec de la marge, mais c'est une
extrapolation, pas une mesure. **À confirmer sur ton Chrome.**

Si c'est encore court, le levier suivant, dans l'ordre : `dpr={[1, 1.5]}` sur les
deux `<Canvas>` (−44 % de pixels, gain proportionnel sur composer et fill rate),
puis le sol à 256² (~3 ms), puis Bloom (~6 ms).

## 2. Valeurs retenues — palette, fog, écorce

| | avant | après |
|---|---|---|
| `lowColor` (près de l'eau) | `0.10, 0.12, 0.06` | **`0.075, 0.095, 0.055`** brun-vert sombre humide |
| `midColor` (plaine) | `0.28, 0.15, 0.07` | **`0.190, 0.205, 0.100`** olive dominant |
| `highColor` (hauteurs) | `0.42, 0.26, 0.10` | **`0.300, 0.280, 0.235`** gris-brun désaturé |
| `wetProximity` | `WATER_LEVEL + 6.0` | **`+ 4.0`** (les deux fichiers) |
| mousse — seuil de pente | `smoothstep(0.82, 0.94)` | **`(0.74, 0.90)`** |
| mousse — seuils de plaque | `0.80 → 0.46` | **`0.66 → 0.30`** |
| mousse — force du mélange | `0.85` | **`0.95`** |
| fog | `#b8956a`, densité `0.012` | **`#c2a276`, densité `0.0065`** |
| écorce | `0.19,0.085,0.028 → 0.38,0.21,0.075` | **`0.055,0.048,0.042 → 0.155,0.140,0.120`** |
| lichen de pied | `0.26,0.31,0.21` à 0.7 | **`0.30,0.36,0.24` à 0.85** |

Densité de fog choisie par le calcul plutôt qu'à tâtons : à 0.0065, le facteur
`FogExp2` vaut 0.81 à 200 unités et 0.93 à 250 — la profondeur se lit — mais 0.999
à 400 unités, donc le bord du sol (demi-largeur 400) reste noyé. Le plan d'eau,
lui, a une demi-largeur de 250 où le fog n'est qu'à 0.93 : son bord est le point
limite, à surveiller.

## 3. Décisions face à une spec ambiguë ou fausse

### 3.1 L'hypothèse principale de la spec est infirmée

La spec désignait l'interaction `MeshReflectorMaterial × SSAO` comme suspect
numéro un, à vérifier en premier. Vérifié : **le reflector coûte 0.84 ms**, soit
moins de 1 % de la frame. Le vrai coupable était ailleurs — un réglage par défaut
de drei (`multisampling: 8`) que personne n'avait choisi explicitement. J'ai suivi
l'ordre demandé pour la vérification, mais pas pour les coupes : couper le
reflector en premier, comme le prescrivait l'ordre d'arbitrage, aurait dégradé
l'image pour 0.7 % de gain.

### 3.2 Les modifications GLSL ne survivent pas au hot reload

Piège coûteux, à connaître pour la suite : three met en cache le programme
compilé, et changer une chaîne GLSL dans `onBeforeCompile` **ne recompile pas** le
matériau existant. Après HMR, j'ai vu le fog changer (c'est une prop three) mais
ni la palette ni l'écorce (ce sont des shaders). J'ai d'abord cru que mes valeurs
étaient mauvaises. **Toute vérification visuelle d'un changement de shader exige
un rechargement complet de la page.**

### 3.3 Le fps mesurable ici ne vaut rien, le temps GPU si

Détaillé en 1. Conséquence pratique : j'ai abandonné `<Stats />` et `rAF` comme
instruments dans cet environnement, au profit des requêtes de timer GPU. C'est la
seule mesure fiable dont je dispose, et elle est en temps absolu, pas en fps.

### 3.4 L'éminence centrale ne reçoit plus de mousse — c'est voulu mais discutable

Avec `wetProximity` à `+4.0`, le monticule central (hauteur ~2.2, eau à −2.13) est
à `wetProximity = 0` : **aucune mousse**. Physiquement cohérent — c'est le point
sec — mais c'est aussi la plus grande surface du cadre en phase `presence`, et
elle se lit maintenant comme une roche pâle assez nue. Le `+4.0` demandé résout
bien le problème du lichen invisible, mais crée celui-ci. Je l'ai appliqué comme
demandé et je le signale plutôt que d'arbitrer seul : la correction serait soit de
monter la couverture du lichen sec sur les hauteurs, soit d'accepter `+5.0` comme
compromis.

## 4. Ce qui reste faible, par ordre d'impact

1. **L'éminence centrale est nue et pâle** (3.4). C'est le premier plan de la
   phase `presence`, donc le défaut le plus exposé. Monter la présence du lichen
   sec plutôt que celle de la mousse est la piste la plus directe.
2. **Aucun anti-aliasing.** Le MSAA est parti, SMAA est trop cher. À dpr 2 ça
   passe, mais sur un écran non-Retina les silhouettes de troncs sur ciel clair
   crèneleront. `FXAA` (bien moins cher que SMAA) n'a pas été testé, faute de
   budget — c'est le premier essai à faire si l'aliasing gêne.
3. **L'occlusion ambiante a disparu avec SSAO.** Les objets sont moins ancrés au
   sol : le contact tronc/terrain repose désormais uniquement sur la shadow map.
   Un AO moins cher (N8AO, ou SSAO sans `enableNormalPass`) mériterait un essai
   maintenant que le budget est dégagé.
4. **Le bord du plan d'eau est le point limite du nouveau fog** (250 unités, fog à
   0.93). Non observé en pratique, mais c'est là que ça cassera si tu baisses
   encore la densité.
5. **Le contraste de valeur troncs/sol reste moyen** en plein soleil. Les colonnes
   se détachent bien mieux qu'avant, mais la lumière clé chaude à intensité 2.8
   les ramène vers le ton du terrain sur les faces éclairées.

---
---

# Lot mosaïque du sol — 10 septembre 2026

Branche `feat/sol-plaques`, partie de `fix/palette-perf`. `npx tsc --noEmit` vert,
`npm run build` vert, ESLint propre sur les fichiers touchés.

## 1. Fichiers touchés

- `scene/DevonianGround.tsx` — trois états de surface exclusifs, brise-bord, rugosité par état, octave de normale intermédiaire, cailloux Voronoï
- `scene/GroundFlora.tsx` — plancher de densité en zone sèche, fondu en échelle au bord

## 2. Diagnostic du lot 1 : aucune des deux hypothèses ne dominait

La spec proposait deux causes : masques trop doux, ou amplitude de mélange trop
faible. J'ai répliqué la logique du shader en TypeScript sur le vrai terrain pour
trancher. **Les deux sont fausses.**

| Mesure, cadre `presence` (r < 18) | Résultat |
|---|---|
| masque de mousse **saturé** à 0 ou 1 | **84.5 %** |
| masque en transition (« bouillie ») | 15.5 % |
| répartition mousse / lichen / nu | 40.2 % / 12.7 % / 47.2 % |

Les bords étaient donc déjà **nets**, et la couverture déjà proche du tiers. Ce
n'était ni la douceur ni l'amplitude.

La vraie cause est double, et aucune des deux n'était dans la liste :

1. **Trop peu de plaques dans le cadre.** À l'échelle 14 unités, on ne compte que
   **5 plaques distinctes** dans le disque r < 18 que cadre la caméra `presence`.
   Cinq taches sur tout l'écran se lisent comme un aplat, pas comme une mosaïque.
   Mesuré par comptage de composantes connexes : 14 u → 5 plaques, **10 u → 10**,
   7 u → 6, 5 u → 4 (à échelle fine les plaques percolent et refusionnent).
   Échelle retenue : **10**.
2. **La densité annulait le masque là où la caméra regarde.** `wetProximity`
   tombe à 0 sur l'éminence centrale, donc `mossDensity = 0` : 32.4 % de la
   surface cadrée n'avait structurellement aucune mousse. Corrigé par un plancher
   de densité (`mix(0.25, 1.0, wetProximity)`).

## 3. Répartition mesurée des trois états

Après implémentation, sur le cadre `presence` (r < 18) :

| État | Part |
|---|---|
| Roche nue (dont lichen 16.5 %) | **53.3 %** |
| Mousse | **33.8 %** |
| Boue de rive | **12.8 %** |

Sur le terrain entier : mousse 52.4 %, roche 31.0 %, boue 16.6 %. Masques
toujours nets (7.6 % en transition seulement). La boue reste minoritaire par
construction — c'est une bande de rive, pas un tiers du paysage, et la forcer à
33 % l'aurait fait remonter sur les hauteurs sèches.

### Deux itérations qu'il a fallu pour y arriver

La boue est passée par deux versions fausses, corrigées à la mesure :

- **v1, terme additif** : `smoothstep(wetProximity)*0.62 + bruit*0.38`. Le bruit
  seul suffisait à franchir le seuil → **31 % de boue au sommet de l'éminence
  sèche**. L'humidité doit *conditionner*, pas *s'ajouter*.
- **v2, `wetProximity` en porte** : pire, **63.7 %** de boue sur le terrain.
  Parce que `wetProximity` vaut encore **~0.9 sur la majorité du terrain
  émergé** (sa médiane est à 0.6 unité au-dessus de l'eau) : ce n'est pas une
  mesure de « bord de l'eau », c'est presque une constante.
- **v3 retenue** : bande de rive explicite,
  `1 - smoothstep(WATER_LEVEL, WATER_LEVEL + 1.2, h)`.

## 4. Cooksonia dans le frustum `presence`

Le diagnostic proposé était exact, et le trou plus large que prévu : la règle
`r < 6` et la zone sèche `wetProximity = 0` ne se recouvrent pas, elles se
**juxtaposent** — le semis ne plaçait **aucune** plante avant r = 12, alors que
seuls les 6 premiers mètres étaient voulus. Or 36 % de l'écran en `presence`
regarde précisément du terrain de rayon 6 à 12.

| | avant | après |
|---|---|---|
| instances dans le frustum | 122 | **145** |
| dont non occultées par le relief | 52 | **73** |
| dont à moins de 25 u (premier plan) | **0** | **24** |
| instances à r < 12 (éminence cadrée) | **0** | **30** |
| plante visible la plus proche | 29.1 u | **9.6 u** |

Le compte brut « dans le frustum » était un mauvais indicateur : 122 instances y
étaient déjà, toutes lointaines et à moitié occultées. Correction par un plancher
d'acceptation à 0.4 (testé 0.2 / 0.3 / 0.4 / 0.5 : 0.2 laissait encore l'éminence
vide, 0.5 aplatissait le gradient d'humidité). Fondu en échelle sur les 8
dernières unités avant `maxRadius`, calculé au semis donc **à coût nul par frame**.

## 5. Coût GPU du sol

Mesuré avec `EXT_disjoint_timer_query_webgl2`, jamais avec `finish()`.

| Étape | Sol isolé | Frame complète |
|---|---|---|
| Avant ce lot | 7.06 ms | 25.5 ms |
| Après lots 1+2, version naïve | **18.48 ms** | 35.9 ms |
| Après optimisation | **7.90 ms** | **26.7 ms** |

La version naïve dépassait largement le plafond de 12 ms fixé par la spec. Deux
optimisations, mesurées :

1. **Voronoï sous branche.** Les cailloux coûtent 18 appels de hash (donc 18
   `sin`) par pixel. Ils ne servent que sur roche et berge : `if (stoneZone >
   0.01)`. Les zones sont spatialement cohérentes, la branche est donc efficace
   sur GPU plutôt que pathologique.
2. **Voronoï calculé une seule fois.** Il l'était deux fois — dans
   `<color_fragment>` pour l'assombrissement et dans `<normal_fragment_maps>`
   pour la normale. Or `color_fragment` (ligne 172 de `meshphysical`) précède
   `normal_fragment_maps` (ligne 179) dans le même `main()` : le résultat se
   réutilise. 36 appels de hash économisés par pixel.
3. Gradients de bruit en **différences avant** (3 évaluations) au lieu de
   centrées (4), amplitudes doublées en compensation.

**Le sol est revenu à son coût d'avant le lot** (7.90 contre 7.06 ms) alors qu'il
porte maintenant trois états, un brise-bord, une octave de relief supplémentaire
et des cailloux.

## 6. Décisions face à une spec ambiguë

### 6.1 « Un tiers chacun » n'est pas atteignable pour la boue sans la rendre fausse

La spec demandait « un tiers chacun en ordre de grandeur, pas 90/5/5 ». Mousse et
roche y sont (33.8 % et 53.3 %). La boue est à 12.8 % et je l'y ai laissée : c'est
une bande de rive définie par la distance à l'eau, et les deux tentatives pour
l'élargir (§3) l'ont fait remonter sur les crêtes sèches, ce qui est absurde
géologiquement. J'ai préféré une répartition physiquement juste à une
répartition conforme au chiffre.

### 6.2 Un bug d'extrapolation trouvé au passage

`mix(midColor, highColor, groundT * 1.5)` : `groundT * 1.5` vaut **1.33** au
sommet de l'éminence, et `mix()` **extrapole** au-delà du second argument. La
roche y était donc plus claire que `highColor`, ce qui la faisait virer au blanc
cassé — visible sur la capture intermédiaire comme des plaques de neige. Borné
par `clamp`. Ce bug préexistait au lot, introduit lors du recalage de la rampe.

### 6.3 Le brise-bord agit avant le seuil, pas après

La spec dit « perturbe le masque » sans préciser où. Ajouté à la **valeur de
bruit avant le `smoothstep`**, et non au masque résultant : appliqué après, il
ne ferait que rendre le bord flou ; appliqué avant, il déplace localement la
frontière et la rend dentelée tout en gardant la transition franche (`edge`
resserré de 0.05 à 0.02).

## 7. Ce qui reste faible, par ordre d'impact

1. **Le micro-relief ne se voit toujours pas à moyenne distance.** L'octave à 3
   unités est en place et modulée par l'état de surface, mais l'éminence reste
   visuellement lisse : la perturbation de normale ne produit pas d'auto-ombrage
   ni de silhouette. Seul un vrai déplacement de géométrie, ou du parallax
   mapping, donnerait du volume. C'est le plus gros écart restant à la référence.
2. **Les cailloux sont invisibles au-delà de ~15 unités.** À 0.85 unité de maille
   ils passent sous le pixel. Ils ne servent donc que la vue rapprochée, pour un
   coût payé sur tout l'écran — une atténuation par distance serait rentable.
3. **La frontière mousse/roche est nette mais plate.** Il manque une transition
   d'épaisseur : dans la référence, le tapis de mousse a un bord légèrement
   surélevé et plus sombre. Un liseré assombri sur le contour du masque
   coûterait presque rien.
4. **La flore perd de la matière entre 37 et 45 unités** à cause du fondu :
   ~34 % des instances y sont réduites. Le levier propre est `count` (460
   donnerait 85 plantes visibles au lieu de 73, ~+15 % de coût), pas
   l'élargissement du fondu.
5. **Toujours aucun anti-aliasing** (hérité du lot précédent) : les silhouettes de
   troncs sur ciel clair crènelent sur écran non-Retina.

---
---

# Lot colonisation & cadrage — 10 septembre 2026

Branche `feat/coloniser-cadrer`, partie de `feat/sol-plaques`. `npx tsc --noEmit`
vert, `npm run build` vert, ESLint propre sur les fichiers touchés.

## 1. Fichiers touchés

- `scene/DevonianForest.tsx` — rendu instancié, LOD, count dynamique, 300 arbres à 180 u
- `scene/DevonianTree.tsx` — **supprimé** (remplacé par l'instanciation)
- `scene/usePhaseVisibility.ts` — colonisation démarrée en `ecosystem`, poursuivie en `zoomout`
- `scene/CameraRig.tsx` — cadrages `context`/`presence` et `ecosystem`
- `scene/DevonianGround.tsx` — contraste mousse/roche, rugosité par état
- `lab/LabScene.tsx`, `PrototaxitesScene.tsx` — 300 arbres

## 2. Courbe de colonisation mesurée

| Phase | progress | forestSpread | growth > 0.5 | adultes | en pousse | absents |
|---|---|---|---|---|---|---|
| ecosystem | 0.80 | 0.018 | 0 | 0 | 1 | 299 |
| ecosystem | 1.00 | 0.120 | 0 | 0 | 17 | 283 |
| eclipse | 0.25 | 0.147 | 0 | 0 | 28 | 272 |
| eclipse | 0.50 | 0.335 | 67 | 4 | 120 | 176 |
| eclipse | 0.75 | 0.523 | 162 | 86 | 151 | 63 |
| eclipse | 1.00 | 0.550 | 177 | 99 | 155 | 46 |
| zoomout | 0.50 | 0.775 | 290 | 221 | 79 | 0 |
| zoomout | 1.00 | 1.000 | 300 | 300 | 0 | 0 |
| resonance | — | 1.000 | 300 | 300 | 0 | 0 |

La courbe n'est jamais saturée avant la toute fin, et à mi-eclipse la coexistence
demandée est là : **4 adultes, 120 en pousse, 176 zones encore vides** dans le
même cadre.

## 3. Arbres, coût GPU, technique

**300 arbres** (contre 24), rayon **14 → 180 unités**.

| | triangles | draw calls |
|---|---|---|
| `presence` avant ce lot | 353 922 | 15 |
| `resonance`, instanciation naïve | **5 305 754** | 10 |
| `resonance`, après LOD | **1 907 153** | 12 |
| `presence`, après count dynamique | **353 922** | 15 |

Technique retenue : **`InstancedMesh`**, deux géométries extraites du GLB avec
leur matrice locale cuite dedans, matrices d'instance recomposées en `useFrame`
uniquement quand `forestSpread` bouge. `DevonianTree` et son `<Clone>` par arbre
ont disparu.

Trois optimisations, chacune mesurée :

1. **LOD à 60 unités.** Le feuillage fait 8056 triangles contre 223 pour le
   tronc : c'est lui seul qu'il faut alléger. Au-delà de 60 u, feuillage décimé à
   34 % **par paires de triangles** (les cartes de feuillage sont des quads, en
   retirer un triangle sur deux les trouerait). Répartition obtenue : 51 arbres
   proches en pleine géométrie, 249 lointains allégés.
2. **Plus d'ombre portée au-delà de 60 u.** Le frustum de la directionnelle ne
   couvre que ±60 : ces arbres alimentaient la shadow map sans pouvoir rien y
   inscrire. Coût de l'ombre de la forêt mesuré à 5.73 ms avant.
3. **`count` dynamique sur l'`InstancedMesh`.** Un `InstancedMesh` dessine
   **toutes** ses instances même à échelle nulle : la forêt coûtait 1 922 721
   triangles en phase `presence`, où aucun arbre n'est levé. Les seuils étant
   triés, la boucle s'arrête au premier arbre non levé et `count` est ajusté.
   Retour exact au coût d'avant le lot.

## 4. Coordonnées de caméra retenues

Recherche numérique par marche de rayons sur le vrai terrain (28 × 16 rayons par
cadrage, balayage azimut × rayon × hauteur), et non par tâtonnement.

| Phase | avant | après | eau dans le cadre | berge | eau la plus proche |
|---|---|---|---|---|---|
| `context` / `presence` | `[8, 5, 14]` | **`[22, 5, 0]`** | 6.3 → **6.5 %** | 6.7 → **8.9 %** | 34 → **26 u** |
| `ecosystem` | `[18, 8, 22]` | **`[28, 8, -4.9]`** | 13.8 → **15.2 %** | 24.8 → **29.0 %** | 19 → **18 u** |
| `eclipse` | `[14, 6, 18]` | **inchangé** | 9.2 % | 10.7 % | 23 u |

`presence` gagne en **reculant** (16 → 22 u), pas en tournant : à rayon constant,
tous les azimuts testés perdaient de l'eau (3.3 % au mieux) pour gagner de la
berge. Le Prototaxite principal passe de 46 % à 34 % de la hauteur d'écran — il
reste très largement le sujet dominant.

`eclipse` n'a pas été touchée : ses 9.2 % d'eau sont la **meilleure part d'eau de
tous les azimuts testés** à ce rayon ; les alternatives gagnaient de la berge
(jusqu'à 16.3 %) en perdant de l'eau, sans gain net. Je préfère ne pas bouger un
cadrage plutôt que de le changer pour un échange nul.

`interior` et `resonance` non touchées, comme demandé. Les Prototaxites n'ont pas
été déplacés : le point 2.3 n'a pas eu à être utilisé.

## 5. Décisions face à une spec ambiguë ou fausse

### 5.1 Faire lever les premiers arbres pendant `ecosystem`

La spec décrit le récit — « les premiers arbres apparaissent alors que les
Prototaxites dominent encore » — mais `forestSpread` valait 0 jusqu'au début
d'`eclipse`, or c'est justement pendant `eclipse` que les Prototaxites s'effacent.
Le croisement des deux règnes était donc impossible à montrer. J'ai fait démarrer
la colonisation sur les 30 derniers pour cent d'`ecosystem` : 17 arbres lèvent
alors que `prototaxites` vaut encore 1.00. C'est ce que dit le texte de la spec,
même si ce n'est pas ce que disait sa consigne technique.

### 5.2 La rampe d'`eclipse` avait une demi-phase morte

`easeInOutCubic(clamp01(p * 1.5))` atteint 1 dès **p = 0.667** : de 0.667 à 1.0,
`forestSpread` ne bougeait plus. Le facteur 1.5, hérité d'un lot antérieur,
annulait la moitié de la phase la plus importante du récit. Retiré.

### 5.3 L'instanciation crée un coût que les clones n'avaient pas

Piège non anticipé par la spec : passer de `<Clone>` à `InstancedMesh` fait
**perdre** l'optimisation « un arbre non levé ne coûte rien ». Les clones
retournaient `null` sous `growth < 0.01` ; un `InstancedMesh` dessine tout son
buffer. Sans le `count` dynamique, ce lot aurait ajouté 1.9 M de triangles à
`presence`, une phase où la forêt n'existe pas. C'est le genre de régression qui
ne se voit pas à l'écran.

### 5.4 Les mesures de temps de frame de cette session sont inexploitables

Les triangles et les draw calls sont fiables et reproductibles ; les temps GPU en
millisecondes ont dérivé de 26.7 ms à 49 ms sur une phase **inchangée** au fil de
la session, à mesure que les rechargements s'accumulaient. Pire, `resonance`
(1.9 M triangles) mesure plus **rapide** que `presence` (354 k) — cohérent avec
un coût dominé par le fill rate du sol vu de près, pas par la géométrie, mais
cela rend tout delta en millisecondes ininterprétable ici. **Je rapporte donc les
compteurs de géométrie, pas des fps.** À vérifier sur ta machine.

### 5.5 Un incident de commit à signaler

Ton travail en cours sur `un-moment-hors-du-temps` et `entre-nous` était présent
dans l'arbre, dont un renommage déjà indexé vers `src/lib/use-reduced-motion.ts`.
Mon premier `git add -A` l'a embarqué dans mon commit. J'ai défait et recommité
en listant explicitement mes cinq fichiers. **Ton travail est intact et toujours
non commité**, renommage compris. À vérifier tout de même de ton côté.

## 6. Ce qui reste faible, par ordre d'impact

1. **Le contraste de la mosaïque est peut-être passé de trop faible à trop fort.**
   Les plaques de roche claire sur mousse sombre lisent maintenant très
   nettement, au risque du filet de camouflage. C'est la direction demandée et
   c'était nécessaire, mais c'est le premier réglage à revoir à l'œil.
2. **La frontière du LOD est visible en `zoomout`.** À 60 unités le feuillage
   passe de 8056 à 2686 triangles d'un coup ; sur une vue qui traverse cette
   distance, la transition peut s'apercevoir. Un LOD à trois niveaux, ou une
   décimation progressive, l'adoucirait.
3. **Les arbres lointains ne projettent plus d'ombre du tout.** Correct tant que
   le frustum reste à ±60, mais si tu l'élargis un jour, la forêt lointaine
   restera sans ombre sans que rien ne le signale.
4. **La forêt ne colonise pas au-delà de 180 unités**, alors que le fog porte à
   300. Le dernier plan de `resonance` montre donc une lisière, noyée dans la
   brume mais présente.
5. **Toujours aucun anti-aliasing**, hérité du lot palette-perf.

# Lot dôme & densité — 10 septembre 2026

Branche `feat/dome-densite`, partie de `feat/coloniser-cadrer`. `npx tsc --noEmit`
vert, `npm run build` vert, ESLint propre sur les fichiers touchés.

## 1. Fichiers touchés

- `scene/Prototaxite.tsx` — sommet en dôme, normales redérivées, 64 anneaux
- `scene/DevonianForest.tsx` — loi de densité, placement, 4 paliers de LOD
- `lab/LabScene.tsx`, `PrototaxitesScene.tsx` — effectif et rayon pris des `DEFAULTS`

`PrototaxiteGroup.tsx` n'a pas eu à bouger : le dôme mange le haut du fût au
lieu de s'y ajouter, donc la hauteur totale et l'ancrage au sol sont inchangés.

## 2. Le dôme : paramétré par l'angle, pas par la hauteur

La spec proposait de « resserrer le rayon sur la dernière fraction de hauteur
selon une courbe lisse ». Fait littéralement, ça ne marche pas : sur un dôme, la
pente `dr/dy` est **infinie à l'apex**. Échantillonné à pas de hauteur constant,
le dernier anneau porte à lui seul toute la pointe et laisse une facette plate.
Mesuré, profil hémisphérique, 64 anneaux : le rayon passait de **0.43 à 0 en un
seul segment**.

Le dôme est donc paramétré par l'**angle polaire** : `r = cos(φ)^e`,
`y = s + (1−s)·sin(φ)`, φ de 0 à π/2. Les anneaux se répartissent le long de
l'arc. Derniers anneaux mesurés (graine 0) :

| anneau | 58 | 59 | 60 | 61 | 62 | 63 | 64 |
|---|---|---|---|---|---|---|---|
| rayon (u) | 0.371 | 0.325 | 0.276 | 0.224 | 0.167 | 0.102 | 0.000 |

Le couvercle du cylindre se referme sur l'apex en triangles dégénérés : pas de
géométrie composée, pas de cas particulier.

**Variation par instance** (1.3), depuis `uSeed` :

| graine | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| début du dôme | 0.700 | 0.753 | 0.782 | 0.729 | 0.794 | 0.796 |
| exposant | 0.70 | 1.20 | 0.89 | 1.38 | 1.08 | 0.77 |
| hauteur du dôme | 2.40 u | 1.97 u | 1.74 u | 2.17 u | 1.65 u | 1.63 u |

**Irrégularité** (1.2) : l'épaule n'est pas un cercle. Elle ondule de
**0.50 u** autour du tronc, sur trois sinusoïdes de périodes entières — bouclage
vérifié à 8.7 × 10⁻¹⁰ entre `uv.x = 0` et `uv.x = 1`, donc pas de couture. Le
displacement radial d'écorce continue de s'appliquer sur le dôme, son amplitude
ne s'éteint que sur le dernier dixième où le rayon ne pourrait plus l'absorber.

**Normales** (1.4) : redérivées analytiquement du profil, pas laissées telles
quelles. Sur une surface de révolution `(r(t), y(t))` la normale sortante vaut
`(y'·dir, −r')`, obtenue par différences centrées — le même calcul couvre le fût
conique et le dôme, donc aucune discontinuité au raccord. Élévation mesurée :

| t | 0.20 | 0.50 | 0.75 | 0.85 | 0.95 | 0.99 | 1.00 |
|---|---|---|---|---|---|---|---|
| normale | 3.6° | 3.6° | 6.2° | 15.2° | 47.7° | 84.1° | 87.6° |

Continuité au passage de l'épaule : Δrayon 1.0 × 10⁻⁴ pour un pas de 1 × 10⁻⁴.

## 3. Densité surfacique par tranche de rayon

**1 200 arbres** (contre 300), rayon **14 → 240 unités** (contre 14 → 180).

| tranche | avant (n / densité) | après (n / densité) | densité ×|
|---|---|---|---|
| 0–25 | 17 / 0.00866 | 11 / **0.00560** | ×0.65 |
| 25–60 | 34 / 0.00364 | 46 / **0.00492** | ×1.35 |
| 60–120 | 123 / 0.00363 | 203 / **0.00598** | ×1.65 |
| 120–180 | 126 / 0.00223 | 350 / **0.00619** | ×2.78 |
| 180–240 | 0 / 0 | 590 / **0.00745** | — |

La densité **croît** désormais avec la distance au lieu de s'effondrer. C'est le
chiffre qui compte : occlusion d'un rayon rasant depuis 100 u jusqu'au bord de la
forêt, **64.8 % avant → 99.1 % après**. L'horizon se referme.

Le centre reste aéré, et **structurellement** : le premier plan a son effectif
fixé en absolu (`NEAR_COUNT = 55` sur `[14, 70]`), hors loi de densité. Vérifié
par balayage — de 800 à 2 000 arbres au total, la densité de la tranche 0–25 ne
bouge pas d'un chiffre : 0.00560 partout.

**Placement** (2.4) : **0 arbre dans l'eau** sur 1 200, **0** sur une pente
au-delà du seuil, tirage déterministe. Deux corrections ont été nécessaires :

- Le rayon cible est tiré **une fois** et tenu pendant tout le balayage
  angulaire. Le code redessinait le rayon à chaque tentative, si bien que les
  anneaux traversés par un chenal exportaient leurs rejets vers les anneaux secs.
- Une spirale déterministe vers le point sec le plus proche a été ajoutée en
  dernier recours. L'ancien repli gardait « le candidat le plus sec » même s'il
  était encore sous l'eau : tolérable à 300 tirages, statistiquement certain à
  1 200.

## 4. Coût géométrique

Mesuré dans un vrai Chrome, en comptant les triangles **au niveau WebGL** et en
ventilant par framebuffer. Le baseline mesuré avec le même instrument reproduit
**exactement** les chiffres du lot précédent (353 922 et 1 907 153), ce qui a au
passage établi leur convention : passe de scène **+ shadow map**.

| phase | avant | après | delta |
|---|---|---|---|
| `presence` | 353 922 | **359 554** | +5 632 (+1.6 %) |
| `resonance` | 1 907 153 | **2 795 659** | +888 506 (+46.6 %) |

`presence` ne bouge que du dôme : le `count` dynamique tient, la forêt y coûte
toujours zéro. Draw calls de la passe de scène : `presence` 9 → 9,
`resonance` 10 → 14 (quatre paliers de LOD au lieu de deux).

Forêt seule : 1 146 570 → **1 985 402** triangles pour **4× plus d'arbres**.

| palier | rayon | feuillage gardé | tris/arbre | arbres | total |
|---|---|---|---|---|---|
| 0 | ≤ 60 | 100 % | 8 279 | 57 | 471 903 |
| 1 | 60–110 | 34 % | 2 909 | 153 | 445 077 |
| 2 | 110–170 | 17 % | 1 567 | 323 | 506 141 |
| 3 | > 170 | 8 % | 843 | 667 | 562 281 |

Quatre paliers plutôt que le troisième palier demandé : les marches passent d'un
facteur 3 unique à ~2.3 réparti sur quatre distances, ce qui traite au passage la
frontière de LOD visible signalée au point 2 du lot précédent.

**Lisière** (2.5) : la forêt va maintenant à 240 u, où la brume ne laisse passer
que **8.8 %**. À 180 u elle en laissait passer 25 %, une lisière y était donc
bien perceptible — le rapport précédent avait raison de la signaler. À 300 u on
serait à 2 %, mais l'anneau 240–300 coûterait 900 arbres de plus pour un gain
invisible.

## 5. Décisions face à une spec ambiguë ou fausse

### 5.1 Le diagnostic de densité était juste en principe, mais pas dominant

La spec attribue le problème à la loi en 1/r. Mesuré : un tirage uniforme en
rayon prédisait **63 arbres** entre 25 et 60 u, il y en avait **34**. Le déficit
ne venait pas de la loi mais de la boucle de rejet, qui redessinait le rayon à
chaque tentative et déplaçait ainsi la population des anneaux mouillés vers les
anneaux secs. Il y avait donc **deux** causes ; la seconde n'était pas dans la
spec et pesait autant que la première sur le plan moyen.

### 5.2 « À cette distance un arbre couvre quelques pixels » est faux

Le point 2.3 justifie une décimation agressive au-delà de 120 u par la taille à
l'écran. Calculé : à 120 u, un arbre de 8.5 u sous un fov de 55° occupe **73 px**
sur un canvas de 673 px de haut, et la brume en laisse passer **60 %**. Il reste
parfaitement lisible. J'ai donc **gardé le tronc entier à toutes les distances** —
223 triangles, mais le décimer par paires perce le tube. Les ~90 000 triangles
que ça aurait rendus (4 % du budget) ne valaient pas ce risque. Seul le feuillage
est allégé.

### 5.3 Une loi de densité unique affame le centre

Appliquer une seule loi sur `[14, 240]` était intenable : l'anneau extérieur pèse
97 % de la surface, donc monter l'effectif pour boiser l'horizon n'aurait ajouté
qu'une poignée d'arbres au centre — et le tirer vers le centre aurait vidé
l'horizon. D'où deux populations : un premier plan à effectif **absolu**, et le
reste sous la loi de densité. C'est ce qui rend la contrainte de composition
structurelle plutôt que dépendante d'un réglage.

### 5.4 Un bug latent dans le rang de colonisation

Le rayon mémorisé pour classer les arbres était celui **tiré**, pas celui
**retenu**. Un arbre déplacé par le rejet prenait donc le rang de sa position
d'origine et pouvait lever hors de son tour. Corrigé (`Math.hypot` sur la
position finale). Courbe après correction, à 1 200 arbres :

| phase | progress | spread | adultes | en pousse | absents |
|---|---|---|---|---|---|
| ecosystem | 1.00 | 0.120 | 0 | 78 | 1122 |
| eclipse | 0.50 | 0.335 | 22 | 505 | 673 |
| eclipse | 1.00 | 0.550 | 381 | 653 | 166 |
| zoomout | 0.50 | 0.775 | 929 | 271 | 0 |
| zoomout | 1.00 | 1.000 | 1200 | 0 | 0 |

### 5.5 Le « blocage R3F » n'en était pas un, et il cachait une erreur GLSL

Diagnostic corrigé : dans la fenêtre automatisée, le canvas fait **1470 × 797**
(pas 300 × 150) et `document.hasFocus()` vaut `true`, mais **0 frame de `rAF` en
500 ms** parce que `document.visibilityState` vaut `hidden`. Ce n'est pas la
mesure de R3F qui bloque, c'est Chrome qui suspend `requestAnimationFrame` pour
un document non visible. Rien ne compile, rien ne rend, aucune erreur.

Contourné en pilotant un vrai Chrome `--headless=new` via le protocole DevTools
(WebSocket intégré à Node, aucune dépendance ajoutée), avec les triangles comptés
au niveau WebGL. **Ce dispositif a immédiatement attrapé une erreur de
compilation GLSL** — `protoT` redéfini, le patch de normale déclarait déjà ce nom
dans le même `main()` — qui serait partie en production sous la forme d'un
matériau silencieusement non compilé. Le garde-fou `patchChunk()` ne couvre que
les `#include` manquants, pas les collisions de noms entre deux patchs.

## 6. Ce qui reste faible, par ordre d'impact

1. **`resonance` coûte 46.6 % de triangles en plus.** C'est l'arbitrage demandé
   — la densité avant le compte — et les quatre paliers l'ont contenu à +888 k
   pour 4× plus d'arbres. Mais c'est une hausse réelle et **je ne peux pas la
   valider en fps** : le rendu logiciel du Chrome headless tourne à 2 fps, ce qui
   ne dit rien d'une vraie carte. À vérifier sur ta machine, c'est le premier
   point à contrôler.
2. **Le feuillage au-delà de 170 u ne garde que 8 % de ses cartes.** Pris
   isolément un de ces arbres est squelettique ; il ne tient que par la densité et
   par les 91 % de brume. Si tu baisses un jour `fogExp2`, ce palier se verra en
   premier.
3. **Le centre est passé de 17 à 11 arbres entre 0 et 25 u.** C'est la consigne
   « aéré » appliquée, mais c'est une réduction que j'ai choisie. Si ça lit trop
   vide, `NEAR_COUNT` est le seul bouton à tourner, sans effet sur le reste.
4. **Les arbres lointains ne projettent toujours aucune ombre** — inchangé, le
   frustum de la directionnelle reste à ±60.
5. **Le contraste de la mosaïque du sol** reste le point signalé au lot
   précédent, non retouché ici.
6. **Toujours aucun anti-aliasing.**

# Lot performance & brume aérienne — 11 septembre 2026

Branche `fix/resonance`, partie de `feat/dome-densite`. `npx tsc --noEmit` vert,
`npm run build` vert, ESLint propre sur les fichiers touchés.

## 1. Fichiers touchés

- `scene/aerial.ts` — **nouveau**, le pilote commun brume / reflet
- `scene/DevonianWater.tsx` — démontage du reflet en vue aérienne
- `scene/DevonianAtmosphere.tsx` — densité de brume pilotée, shadow map gelée, teinte

## 2. Diagnostic : coût constant, et le « creux à 2 fps » n'est pas où on le croit

Les deux hypothèses de la spec ont été testées séparément. Aucune des deux n'est
la cause.

**La recomposition des matrices d'instance (piste 1.2) est hors de cause.** La
boucle de `useFrame` rejouée à l'identique sur 1 200 arbres et 8 `InstancedMesh`
coûte **0.106 ms**, soit **0.6 %** d'une frame à 60 fps. Il en faudrait **4 723
dans la même frame** pour produire un creux à 2 fps. Et en `resonance` elle ne
tourne même pas : `forestSpread` y vaut 1 en permanence, la garde à 0.0005
l'arrête dès la seconde frame.

**Le régime établi en `resonance` est parfaitement plat.** Profilé frame par
frame, 28 frames : **5 119 435 triangles à chaque frame**, sans aucune variance,
0 compilation de shader, 4 uploads de 8 ko. Il n'y a pas de pic.

**Le creux à 2 fps est au CHARGEMENT.** Profil des 67 premières frames :

| frame | durée | ce qu'elle contient |
|---|---|---|
| #3 | **2 405 ms** | 7 `texImage2D`, 0 triangle — décodage des textures du GLB |
| #5 | **2 798 ms** | **17 `linkProgram`, 34 `compileShader`** — compilation |
| médiane | 169 ms | — |

Ce sont les **seuls** événements multi-secondes de toute la session. Et
`<Stats />` affiche un minimum **cumulé depuis le chargement de la page** : le
« 2 » que tu lis en `resonance` a été enregistré avant même que tu cliques sur
la phase. La moyenne à 40 fps, elle, est bien réelle et vient du coût constant.

### Répartition du coût constant en `resonance`

| passe | triangles/frame | part |
|---|---|---|
| scène | 2 323 756 | 45.4 % |
| **reflet de l'eau** | **2 323 754** | **45.4 %** |
| shadow map | 471 903 | 9.2 % |

Le reflet redessine la scène **entière** une seconde fois, tous les 1 200 arbres
compris.

## 3. Ce qui a été modifié, et le gain de chacun

| | avant | après | gain |
|---|---|---|---|
| `resonance` | 5 119 435 tris | **2 323 773** | **−54.6 %** |
| `presence` | 704 568 tris | **704 568** | inchangé |

**3.1 Démontage du reflet en vue aérienne — −2 323 754 tris/frame (−45.4 %).**

`DevonianWater` avait déjà une prop `reflections` documentée « permet de couper
le reflet si le coût devient un problème ». **Elle ne coupait rien.** Elle ne
touchait que `resolution` et `mirror` ; or le `useFrame` interne de
`MeshReflectorMaterial` (drei, `core/MeshReflectorMaterial.js:151`) appelle
`gl.render(scene, virtualCamera)` **inconditionnellement**, sans regarder ni
l'une ni l'autre. Baisser la résolution réduisait la qualité du reflet sans
jamais supprimer la seconde traversée de la scène, qui est tout le coût. Le seul
moyen d'économiser est de **démonter le matériau**, ce qui est maintenant fait
au profit d'un `meshStandardMaterial` de même teinte et même rugosité.

Vérifié dans la ventilation par framebuffer : le seau `512x512` du reflet a
disparu en `resonance`, il est toujours là en `presence`.

**3.2 Gel de la shadow map en vue aérienne — −471 903 tris/frame (−9.2 %).**

Le frustum de la directionnelle ne couvre que ±60 unités, soit le quart central
d'une image qui porte à 240, et à 45 unités d'altitude ces ombres font quelques
pixels. Elles étaient redessinées à chaque frame dans une cible 2048². Le seau
`2048x2048` a disparu en `resonance`, il est toujours là en `presence`.

**3.3 Les paliers de LOD n'ont pas été touchés.** Le point 1.4 demandait de les
ajuster si le coût était constant et géométrique. Il l'est — mais la géométrie
qui pesait n'était pas celle des arbres, c'était celle de la **passe dupliquée**.
Retirer le premier palier aurait rendu 306 090 triangles (6 %), un cinquième
palier au-delà de 200 unités 121 952 (2.4 %) ; le reflet en rendait 45.4 %, sans
rien coûter à l'image. Toucher au LOD aurait dégradé la densité obtenue au lot
précédent pour un dixième du gain. Je ne l'ai pas fait.

## 4. La brume : pilotée par l'altitude de caméra

**Approche retenue**, et pourquoi les deux pistes de la spec ont été écartées
telles quelles :

- *Fog à densité décroissante en altitude, calculé dans le shader.* C'est la
  bonne physique, mais pour atteindre aussi les matériaux issus du **GLB des
  arbres** il faudrait réécrire `THREE.ShaderChunk.fog_fragment`
  **globalement** — un effet de bord sur tout le module three, pour une seule
  scène.
- *Modulation par la phase.* Elle fait un palier à chaque changement de phase et
  se désynchronise du cadrage si une caméra est retouchée.

Retenu : la densité est modulée par l'**altitude de la caméra**, lue dans
`useFrame`. C'est l'approximation « toute la scène est à la profondeur optique de
la caméra » — exacte précisément dans le cas qui casse, une caméra haute
regardant un terrain bas. Elle est continue, donc la rampe de `zoomout` se fait
toute seule sans palier, et elle suit automatiquement un cadrage retouché. Les
phases au sol tiennent entre 3.5 et 8 unités, `resonance` est à 45 : le seuil est
posé entre 14 et 38, aucune phase au sol n'en approche.

Facteur retenu : **0.80**. Transmittance mesurée depuis la caméra `resonance` :

| distance | avant | **0.80** | 0.72 |
|---|---|---|---|
| 69 u (éminence centrale) | 81.8 % | **87.9 %** | 90.1 % |
| 180 u (plan moyen) | 25.4 % | **41.6 %** | 49.2 % |
| 295 u (bord de la forêt) | 2.5 % | **9.5 %** | 14.9 % |

0.72 a été mesuré puis **écarté** : il ne gagne que 2.5 % d'écart-type de
luminance et 0.8 de balance verte, mais fait passer la lisière de la forêt de
9.5 % à 14.9 % de visibilité — le lot précédent avait justement étendu la forêt
à 240 unités pour la noyer. Mauvais échange.

**Teinte : `#c2a276` → `#b0a083`.** Statistiques sur la moitié haute de l'image,
là où la brume domine :

| | luminance | écart-type | G−R | saturation |
|---|---|---|---|---|
| `resonance` avant | 127.9 | 19.94 | **−23.1** | 0.401 |
| `resonance` après | 113.8 | 20.99 | **−9.7** | 0.282 |

La dominante rouge-sur-vert est **coupée de 58 %** et la saturation de 30 %.
L'essentiel de ce gain vient de la teinte, pas de la densité : passer de 0.80 à
0.72 ne déplace G−R que de 0.8. Le sépia d'origine était plus **lumineux** que le
sol ; à 60 % de brume il ne délavait pas le lointain, il l'éclaircissait.

**Contrôle en `presence` (point 2.3)** — identique au pixel près :

| | luminance | écart-type | RGB | G−R |
|---|---|---|---|---|
| avant | 163.4 | 25.41 | 159/163/177 | +4.0 |
| après | 163.4 | 25.40 | 159/163/177 | +4.0 |

À 22 unités la brume laisse passer 98 % : sa teinte n'a rien à dire. Le réglage
bas, validé, n'a pas bougé — ni en chiffres, ni en triangles.

## 5. Décisions face à une spec ambiguë ou fausse

### 5.1 Les deux pistes de perf de la spec étaient les mauvaises

La spec désignait la recomposition de matrices comme « piste prioritaire » et le
reflet comme « piste secondaire ». C'est l'inverse : la première coûte 0.106 ms
et ne tourne pas en `resonance`, la seconde coûte 45 % de la frame. Mesurer
l'hypothèse prioritaire avant de coder a évité d'étaler sur plusieurs frames un
travail qui prend un dixième de milliseconde.

### 5.2 Le « creux à 2 fps » ne se corrige pas là où il se lit

Le compteur `<Stats />` affiche un minimum cumulé depuis le chargement. Le creux
est la compilation des 17 programmes et le décodage des textures du GLB, au
chargement, en phase `presence`. Chercher un pic en `resonance` était une
impasse : il n'y en a pas. C'est une bonne nouvelle — le régime établi était déjà
stable, seul son niveau était trop bas.

### 5.3 Une prop qui ne faisait pas ce qu'elle disait

`reflections` promettait de couper le reflet et ne coupait que sa qualité. Le
coût annoncé « négligeable » au lot palette-perf avait été mesuré en `presence`
avec 24 arbres ; il est resté négligeable dans le rapport alors que la scène
avait pris 1 200 arbres entre-temps. Une mesure vieille de trois lots, jamais
refaite.

### 5.4 Le basculement coûte une frame

Démonter `MeshReflectorMaterial` fait compiler le `meshStandardMaterial` qui le
remplace : **1 `linkProgram`, 2 `compileShader`**, une seule fois, au milieu de
`zoomout`. Mesuré, c'est la seule frame chargée de la transition. Sur une vraie
carte un programme standard se compile en quelques dizaines de millisecondes,
donc une frame sautée pendant un mouvement de caméra. Je n'ai pas cherché à le
pré-compiler : les contournements possibles (monter les deux matériaux, forcer un
rendu invisible) sont des bricolages, et je ne peux pas mesurer leur gain ici.

## 6. Ce qui reste faible, par ordre d'impact

1. **Je ne peux toujours pas valider les fps.** Le Chrome headless rend en
   logiciel, à 3 fps. Ce que je rapporte est un **compte de triangles par frame**,
   fiable et reproductible : 5 119 435 → 2 323 773, et deux passes de rendu
   complètes supprimées. Si le goulot était bien la géométrie — ce que le profil
   parfaitement plat suggère — ça pointe vers ~88 fps ; mais le post-traitement et
   le fill rate n'ont pas bougé, donc le chiffre réel sera plus bas. **À mesurer
   chez toi**, c'est le seul verdict qui compte.
2. **Le stall de chargement reste entier** : ~2.4 s de textures GLB et 17
   programmes à compiler. Il est hors du périmètre de ce lot, mais c'est lui que
   tu vois dans le minimum de `<Stats />`, et c'est la vraie première impression.
3. **Une frame sautée au basculement du reflet**, milieu de `zoomout` (§5.4).
4. **Plus de reflet du tout en vue aérienne** : la nappe y est un aplat. Assumé —
   le Fresnel la rend quasi non réfléchissante vue de haut — mais si tu descends
   un jour la caméra `resonance`, le seuil de 14 à 38 unités est à revoir.
5. **Ombres gelées en vue aérienne** : les arthropodes continuent de bouger sous
   une ombre figée. Invisible à 45 unités d'altitude sous 12 % de brume, mais
   c'est une approximation.
6. **Le contraste de la mosaïque du sol**, signalé depuis deux lots, toujours pas
   retouché.
