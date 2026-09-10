'use client'

import type * as THREE from 'three'

import {
  MAX_HEIGHT,
  TERRAIN_MAX,
  TERRAIN_MIN,
  TERRAIN_RES,
  TERRAIN_SIZE,
  WATER_LEVEL,
  buildHeightmap,
} from './terrain'

// Le sol n'utilise plus de ShaderMaterial maison : celui-ci recalculait son
// propre éclairage avec une lightDir en dur, donc il ignorait les lumières de
// la scène, le fog et les ombres. On part maintenant d'un MeshStandardMaterial
// et on n'injecte QUE le displacement + la couleur, pour que tout le pipeline
// PBR de three (lumières, ombres, brouillard, tone mapping) reste en place.

/**
 * Tessellation du sol. Exportée : la flore reconstruit la surface réellement
 * rasterisée (linéaire par triangle) pour se poser dessus au millimètre, et
 * doit donc connaître le pas exact du maillage.
 */
export const GROUND_SEGMENTS = 384

/**
 * Un `#include` introuvable ferait un `String.replace` no-op : le patch
 * échouerait en silence et le sol redeviendrait un plan lisse sans la moindre
 * erreur. On rend donc l'échec bruyant.
 */
function patchChunk(source: string, token: string, replacement: string): string {
  if (!source.includes(token)) {
    throw new Error(`[DevonianGround] chunk absent du shader three : ${token}`)
  }
  return source.replace(token, replacement)
}

// ─── GLSL ────────────────────────────────────────────────────────────────────

const VERTEX_HEAD = /* glsl */ `
uniform sampler2D uHeightmap;
uniform float uMaxHeight;
uniform float uSize;
uniform float uRes;

varying float vGroundHeight;
varying vec2 vGroundXY;
varying vec3 vGroundTangent;
varying vec3 vGroundBitangent;

// Le texel i de la heightmap échantillonne la position -uSize/2 + i/(uRes-1) * uSize.
// On vise donc le CENTRE du texel, sinon le relief GPU serait décalé d'un demi
// texel par rapport à sampleTerrain() côté JS (placement des objets).
// Le mesh porte rotateX(-PI/2) : objet (x,y,z) -> monde (x, z, -y). L'axe Y du
// plan pointe donc vers le -Z monde, alors que la heightmap est indexée sur le
// +Z monde. Sans ce miroir le relief GPU est inversé en Z par rapport à
// sampleTerrain() (écart mesuré jusqu'à 2.59 unité).
vec2 groundUv(vec2 xy) {
  vec2 t = vec2(xy.x, -xy.y) / uSize + 0.5;
  return (t * (uRes - 1.0) + 0.5) / uRes;
}
`

// La normale stockée en RGB est déjà exprimée en espace OBJET du plan (hauteur
// portée par Z) : three la passe en espace vue via normalMatrix dans
// <defaultnormal_vertex>, il ne faut surtout pas refaire la transformation ici.
const BEGINNORMAL = /* glsl */ `
#include <beginnormal_vertex>

  // RGB stocke (-dh/dx_monde, -dh/dz_monde, 1). L'axe Y du plan étant l'opposé
  // du Z monde, la composante G doit être inversée pour l'espace objet.
  vec3 hmN = texture2D(uHeightmap, groundUv(position.xy)).xyz;
  objectNormal = normalize(vec3(hmN.x, -hmN.y, hmN.z));

  // Base tangente du plan transportée en espace vue, pour perturber la normale
  // côté fragment (normalMatrix n'existe que dans le prefix vertex de three).
  vGroundTangent = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
  vGroundBitangent = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
`

// Le plan vit dans XY (le mesh porte le rotateX), la hauteur va donc sur Z.
const BEGIN_VERTEX = /* glsl */ `
#include <begin_vertex>

  float groundHeight = texture2D(uHeightmap, groundUv(position.xy)).a * uMaxHeight;
  transformed.z += groundHeight;

  vGroundHeight = groundHeight;
  vGroundXY = position.xy;
`

const FRAGMENT_HEAD = /* glsl */ `
uniform float uWaterLevel;
uniform float uTerrainMin;
uniform float uTerrainMax;

// Relus côté fragment pour le test de planéité : la normale interpolée depuis
// le vertex est en espace VUE une fois arrivée ici, elle ne dit donc rien de
// l'horizontalité réelle. On relit la normale OBJET dans la heightmap.
uniform sampler2D uHeightmap;
uniform float uSize;
uniform float uRes;

varying float vGroundHeight;
varying vec2 vGroundXY;
varying vec3 vGroundTangent;
varying vec3 vGroundBitangent;

// Frange humide : 1 sous le niveau d'eau, retombe à 0 quarante centimètres
// plus haut. Coût nul, mais c'est ce qui vend la transition eau/terre.
float groundWetness(float h) {
  return 1.0 - smoothstep(uWaterLevel, uWaterLevel + 0.4, h);
}

float groundHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float groundNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(groundHash(i + vec2(0.0, 0.0)), groundHash(i + vec2(1.0, 0.0)), u.x),
    mix(groundHash(i + vec2(0.0, 1.0)), groundHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Même ciblage de centre de texel que côté vertex (dupliqué : les deux shaders
// sont des unités de compilation séparées, une fonction ne traverse pas).
vec2 groundUvFrag(vec2 xy) {
  vec2 t = vec2(xy.x, -xy.y) / uSize + 0.5;
  return (t * (uRes - 1.0) + 0.5) / uRes;
}

// ─── Tapis cryptogamique ─────────────────────────────────────────────────────
// Dévonien inférieur : mousses, lichens et croûtes biologiques, pas d'herbe ni
// de feuille. D'où une palette volontairement désaturée — un vert franc serait
// un anachronisme de 100 Ma.

// Horizontalité en espace MONDE. RGB de la heightmap = normale en espace OBJET
// du plan, qui porte rotateX(-PI/2) : le « haut » y est donc Z, pas Y. Le
// canal B est déjà normalisé côté JS, il vaut cos(pente) tel quel.
float groundFlatness(vec2 xy) {
  return texture2D(uHeightmap, groundUvFrag(xy)).z;
}

// Deux octaves : la grande donne la taille de plaque, la petite déchiquette
// les contours. Décorrélé de la hauteur, sinon les plaques suivraient les
// courbes de niveau.
float cryptoPatch(vec2 p, float scale, vec2 offset) {
  float coarse = groundNoise(p / scale + offset);
  float fine = groundNoise(p / (scale * 0.38) + offset.yx * 1.7);
  return coarse * 0.62 + fine * 0.38;
}

// Bords NETS : c'est le SEUIL qui suit la densité (la plaque s'étend ou se
// rétracte), pas l'opacité. Fondre le masque redonnerait le dégradé mou qu'on
// cherche justement à casser.
// (« patch » est un mot réservé en GLSL ES 3.00, d'où le nom du paramètre.)
float cryptoMask(float value, float density, float rare, float dense, float edge) {
  float t = mix(rare, dense, clamp(density, 0.0, 1.0));
  return smoothstep(t - edge, t + edge, value);
}
`

// La couleur est appliquée sur diffuseColor et non sur gl_FragColor : elle
// traverse ensuite <lights_physical_fragment> / <lights_fragment_*>, donc le
// sol s'assombrit bien quand on baisse l'intensité des lumières.
const COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>

  // Plaine humide à tapis cryptogamique : brun-vert sombre au ras de l'eau,
  // olive dominant sur la plaine, roche gris-brun désaturée sur les hauteurs.
  vec3 lowColor  = vec3(0.075, 0.095, 0.055);
  vec3 midColor  = vec3(0.190, 0.205, 0.100);
  vec3 highColor = vec3(0.300, 0.280, 0.235);

  // Rampe recalée sur la plage RÉELLE du relief : avec un terrain qui descend
  // sous zéro, un simple /4.0 tassait tout sur la couleur basse.
  float groundT = clamp(
    (vGroundHeight - uTerrainMin) / max(0.001, uTerrainMax - uTerrainMin),
    0.0, 1.0
  );
  // clamp indispensable : groundT * 1.5 dépasse 1 au sommet de l'éminence et
  // mix() EXTRAPOLE au-delà de highColor, ce qui blanchissait la roche.
  vec3 groundColor = mix(lowColor, mix(midColor, highColor, clamp(groundT * 1.5, 0.0, 1.0)), groundT);

  // Biofilm dans les creux
  float biofilm = smoothstep(0.0, 0.8, 1.0 - groundT) * 0.4;
  groundColor = mix(groundColor, vec3(0.08, 0.14, 0.06), biofilm);

  // Berge détrempée : plus sombre et plus saturée
  float wet = groundWetness(vGroundHeight);
  groundColor = mix(groundColor, groundColor * vec3(0.42, 0.48, 0.40), wet);

  // ── Tapis cryptogamique ────────────────────────────────────────────────────
  // Règle de proximité de l'eau PARTAGÉE avec la flore : 1 au niveau de l'eau,
  // 0 six unités plus haut. Ne pas la faire diverger, mousse et plantes doivent
  // coloniser les mêmes berges.
  float wetProximity = 1.0 - smoothstep(uWaterLevel, uWaterLevel + 4.0, vGroundHeight);
  float flatness = groundFlatness(vGroundXY);

  // Brise-bord haute fréquence : sans lui, le contour d'une plaque suit
  // exactement une isoligne de bruit basse fréquence et se lit comme une tache
  // d'aquarelle. Ajouté AVANT le smoothstep, il granule la frontière.
  float edgeBreak = (groundNoise(vGroundXY * 1.7 + vec2(19.0)) - 0.5) * 0.17
                  + (groundNoise(vGroundXY * 5.3 - vec2(3.0)) - 0.5) * 0.07;

  // La mousse tient à l'horizontale et lâche sur les parois de chenal. Le
  // relief est plat presque partout (cos(pente) médian mesuré 0.992), le seuil
  // doit donc être haut pour que le test morde ailleurs que sur les berges.
  // Seuils calibrés sur la heightmap réelle : ~40 % de la surface émergée en
  // mousse, ~3 % en lichen, et 0.4 % de recouvrement entre les deux.
  // Boue humide : bande basse au contact de l'eau, frontière brisée.
  // L'humidité CONDITIONNE la boue, elle ne s'y ajoute pas : en additif, le
  // bruit seul suffisait à franchir le seuil et de la boue apparaissait au
  // sommet de l'éminence sèche (31 % de sa surface, mesuré).
  // wetProximity vaut encore ~0.9 sur la majorité du terrain émergé (sa médiane
  // est à 0.6 unité au-dessus de l'eau) : s'en servir pour la boue en couvrait
  // les deux tiers. La boue se définit donc sur une vraie bande de RIVE.
  float mudBand = 1.0 - smoothstep(uWaterLevel, uWaterLevel + 1.2, vGroundHeight);
  float mudMask = smoothstep(
    0.40, 0.60,
    mudBand + (cryptoPatch(vGroundXY, 6.0, vec2(41.0, -13.0)) - 0.5) * 0.38 + edgeBreak
  );

  // Mousse. Plancher de densité à 0.25 : sans lui, wetProximity tombe à 0 sur
  // l'éminence centrale et la mousse en disparaît entièrement — c'est
  // précisément ce que cadre la caméra presence.
  // Échelle 10 : mesuré comme donnant le plus de plaques DISTINCTES dans ce
  // cadre (10 contre 5 à l'échelle 14, et 4 à l'échelle 5 où elles percolent).
  float mossFlat = smoothstep(0.70, 0.90, flatness);
  float mossDensity = mix(0.25, 1.0, wetProximity) * mossFlat;
  float mossMask = cryptoMask(
    cryptoPatch(vGroundXY, 10.0, vec2(11.3, 4.7)) + edgeBreak,
    mossDensity, 0.72, 0.28, 0.02
  );
  mossMask *= 1.0 - mudMask;

  // Roche nue = ce qui reste. Les trois états sont exclusifs.
  float rockMask = 1.0 - max(mossMask, mudMask);

  // Lichen : zones hautes et sèches, l'exact complément. Autre échelle et autre
  // décalage pour que les deux masques ne se superposent pas. Pas de test de
  // planéité : un lichen crustacé colonise aussi la roche inclinée.
  float dryness = 1.0 - wetProximity;
  float lichenDensity = smoothstep(0.30, 0.65, dryness);
  float lichenMask = cryptoMask(
    cryptoPatch(vGroundXY, 9.0, vec2(-27.9, 63.1)) + edgeBreak,
    lichenDensity, 0.88, 0.50, 0.025
  ) * rockMask;

  // Vert-jaune olive désaturé, nuancé pour que la plaque ne soit pas un aplat.
  vec3 mossColor = vec3(0.145, 0.180, 0.070)
    * (0.80 + 0.40 * groundNoise(vGroundXY / 2.3 + vec2(7.0)));
  groundColor = mix(groundColor, mossColor, mossMask);

  // Boue : brun très sombre, elle doit trancher en VALEUR avec la mousse.
  vec3 mudColor = vec3(0.052, 0.044, 0.032)
    * (0.85 + 0.30 * groundNoise(vGroundXY / 1.4 - vec2(11.0)));
  groundColor = mix(groundColor, mudColor, mudMask);

  // Cailloux : assombrissement ponctuel, sur roche et berge seulement.
  // Voronoï F1 calculé UNE SEULE FOIS ici : color_fragment précède
  // normal_fragment_maps dans meshphysical, les deux partagent le scope de
  // main(). Le recalculer doublait 36 appels de hash par pixel.
  float stoneZone = clamp(rockMask + mudMask, 0.0, 1.0) * (1.0 - mossMask);
  vec2 spC = vGroundXY / 0.85;
  vec2 cellC = floor(spC);
  vec2 fracC = fract(spC);
  float f1 = 8.0;
  vec2 f1Dir = vec2(0.0);
  float pebble = 0.0;
  // 18 appels de hash par pixel : on ne les paye QUE sur roche et berge. Les
  // zones sont spatialement cohérentes, la branche est donc efficace sur GPU.
  if (stoneZone > 0.01) {
    for (int oy = -1; oy <= 1; oy++) {
      for (int ox = -1; ox <= 1; ox++) {
        vec2 nb = vec2(float(ox), float(oy));
        vec2 jitter = vec2(groundHash(cellC + nb), groundHash(cellC + nb + vec2(37.1, 11.7)));
        vec2 diff = nb + jitter - fracC;
        float d = dot(diff, diff);
        if (d < f1) { f1 = d; f1Dir = diff; }
      }
    }
    f1 = sqrt(f1);
    pebble = (1.0 - smoothstep(0.16, 0.42, f1)) * stoneZone;
    groundColor *= 1.0 - 0.34 * (1.0 - smoothstep(0.10, 0.34, f1)) * stoneZone;
  }

  // Gris-vert pâle, presque minéral.
  vec3 lichenColor = vec3(0.34, 0.36, 0.30)
    * (0.88 + 0.24 * groundNoise(vGroundXY / 1.6 - vec2(3.0)));
  groundColor = mix(groundColor, lichenColor, lichenMask * 0.70);

  diffuseColor.rgb *= groundColor;
`

// Détail haute fréquence : gradient d'un bruit à ~0.5 unité appliqué dans le
// plan tangent. Coût géométrique nul, mais le sol cesse d'être lisse de près.
const NORMAL_FRAGMENT = /* glsl */ `
#include <normal_fragment_maps>

  vec3 gT = normalize(vGroundTangent);
  vec3 gB = normalize(vGroundBitangent);

  // Grain fin (~0.5 u) : visible de près uniquement.
  vec2 grainP = vGroundXY / 0.5;
  float grain0 = groundNoise(grainP);
  float grainX = groundNoise(grainP + vec2(0.6, 0.0)) - grain0;
  float grainY = groundNoise(grainP + vec2(0.0, 0.6)) - grain0;

  // Octave intermédiaire (~3 u) : ondulations, ravines, bosses. C'est elle qui
  // reste lisible à moyenne distance, là où le grain fin a disparu.
  vec2 midP = vGroundXY / 3.0;
  float mid0 = groundNoise(midP);
  float midX = groundNoise(midP + vec2(0.6, 0.0)) - mid0;
  float midY = groundNoise(midP + vec2(0.0, 0.6)) - mid0;

  // stoneZone, f1Dir et pebble viennent de color_fragment (même scope).
  float mid = mix(0.30, 1.0, stoneZone); // la mousse atténue le relief moyen
  normal = normalize(
    normal
      - 0.30 * (grainX * gT + grainY * gB)
      - 1.10 * mid * (midX * gT + midY * gB)
      - 1.30 * pebble * (f1Dir.x * gT + f1Dir.y * gB)
  );
`

// mossMask / lichenMask viennent de COLOR_FRAGMENT : dans meshphysical_frag,
// <color_fragment> précède <roughnessmap_fragment> dans le MÊME scope de main,
// les variables sont donc encore vivantes ici. On les réutilise plutôt que de
// repayer huit fetches de bruit par pixel.
const ROUGHNESS_FRAGMENT = /* glsl */ `
#include <roughnessmap_fragment>

  roughnessFactor = mix(roughnessFactor, 0.22, groundWetness(vGroundHeight));

  // Rugosité par état de surface. C'est ce qui rend les plaques lisibles même
  // quand les teintes sont proches : la mousse absorbe, la boue renvoie.
  roughnessFactor = mix(roughnessFactor, 0.70, rockMask);   // roche : spéculaire
  roughnessFactor = mix(roughnessFactor, 1.00, mossMask);   // mousse : mate
  roughnessFactor = mix(roughnessFactor, 0.20, mudMask);    // boue : vernie
  roughnessFactor = mix(roughnessFactor, 0.90, lichenMask * 0.5);
`

// ─── Patch ───────────────────────────────────────────────────────────────────

function onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uHeightmap = { value: buildHeightmap() }
  shader.uniforms.uMaxHeight = { value: MAX_HEIGHT }
  shader.uniforms.uSize = { value: TERRAIN_SIZE }
  shader.uniforms.uRes = { value: TERRAIN_RES }
  shader.uniforms.uWaterLevel = { value: WATER_LEVEL() }
  shader.uniforms.uTerrainMin = { value: TERRAIN_MIN() }
  shader.uniforms.uTerrainMax = { value: TERRAIN_MAX() }

  let vert = VERTEX_HEAD + shader.vertexShader
  vert = patchChunk(vert, '#include <beginnormal_vertex>', BEGINNORMAL)
  vert = patchChunk(vert, '#include <begin_vertex>', BEGIN_VERTEX)
  shader.vertexShader = vert

  let frag = FRAGMENT_HEAD + shader.fragmentShader
  frag = patchChunk(frag, '#include <color_fragment>', COLOR_FRAGMENT)
  frag = patchChunk(frag, '#include <normal_fragment_maps>', NORMAL_FRAGMENT)
  frag = patchChunk(frag, '#include <roughnessmap_fragment>', ROUGHNESS_FRAGMENT)
  shader.fragmentShader = frag
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function DevonianGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS]} />
      <meshStandardMaterial
        roughness={0.95}
        metalness={0}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  )
}
