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
