'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// En dessous de ce seuil le tronc ne projette plus d'ombre, et il sort
// complètement du rendu sous VISIBILITY_EPS.
// Bas volontairement : couper l'ombre trop tôt ferait un « pop » alors que le
// tronc est encore bien visible. À 0.2 il est déjà très effacé.
const SHADOW_EPS = 0.2
const VISIBILITY_EPS = 0.01

interface PrototaxiteProps {
  position?: [number, number, number]
  height?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
  /**
   * Décale l'échantillonnage du bruit d'écorce. Deux troncs de graines
   * différentes n'ont plus le même motif — sans ça les six Prototaxites
   * partagent le même dessin et l'œil repère la répétition immédiatement.
   */
  seed?: number
}

// Même motif que DevonianGround : on part d'un MeshStandardMaterial et on
// n'injecte que le displacement radial et la couleur, au lieu de recalculer
// l'éclairage avec une lightDir en dur. Le tronc reçoit ainsi les lumières,
// les ombres, le fog et le tone mapping de la scène (défaut D4).
function patch(src: string, token: string, repl: string): string {
  if (!src.includes(token)) throw new Error(`[Prototaxite] chunk absent : ${token}`)
  return src.replace(token, repl)
}

const VERT_HEAD = /* glsl */ `
uniform float uSeed;
uniform float uHeight;
// (rayon du pied, rayon du sommet) du fût, avant dôme.
uniform vec2 uRadii;

varying vec2 vProtoUv;
varying vec3 vProtoTangent;
varying vec3 vProtoBitangent;

// ── Sommet en dôme ──────────────────────────────────────────────────────────
// Les reconstructions montrent un sommet arrondi, pas une coupe nette. Plutôt
// que de composer une géométrie, on referme le cylindre dans le vertex shader :
// le displacement radial y est déjà en place et continue donc de s'appliquer
// sur le dôme, ce qui évite une couture au raccord.
//
// Le dôme est paramétré par l'ANGLE POLAIRE, pas par la hauteur. Un profil
// r(y) échantillonné à pas de hauteur constant s'effondre en un seul segment
// à l'apex (la pente dr/dy y est infinie) et laisse une facette plate au
// sommet ; à pas d'angle constant les anneaux se répartissent le long de l'arc.

// Début du dôme et galbe, dérivés de la graine : certains sommets sont
// coniques, d'autres presque plats.
float protoDomeExp() { return 0.70 + fract(uSeed * 0.6183) * 0.80; }

// La ligne d'épaule n'est pas un cercle : elle ondule autour du tronc. Des
// multiples entiers de 2π, donc pas de couture là où uv.x repasse de 1 à 0.
float protoDomeStart(float u) {
  float a = u * 6.2831853;
  float wobble = sin(a * 3.0 + uSeed * 2.1) * 0.55
               + sin(a * 5.0 - uSeed * 1.3) * 0.30
               + sin(a * 2.0 + uSeed * 4.7) * 0.15;
  return clamp(0.70 + fract(uSeed * 0.3721) * 0.14 + wobble * 0.035, 0.55, 0.94);
}

// Profil du tronc en fonction de la hauteur normalisée t (0 au pied, 1 au
// sommet) : .x = rayon, .y = hauteur normalisée effective. Sous l'épaule c'est
// le cône d'origine ; au-dessus, le rayon suit cos(φ)^e et la hauteur sin(φ),
// donc la hauteur totale du tronc ne change pas — le dôme mange le haut du
// fût, il ne s'y ajoute pas, et l'ancrage au sol reste valable.
vec2 protoProfile(float t, float u) {
  float tc = clamp(t, 0.0, 1.0);
  float radius = mix(uRadii.x, uRadii.y, tc);
  float s = protoDomeStart(u);
  if (tc <= s) return vec2(radius, tc);
  float k = clamp((tc - s) / (1.0 - s), 0.0, 1.0);
  float phi = k * 1.5707963;
  return vec2(radius * pow(max(cos(phi), 0.0), protoDomeExp()), s + (1.0 - s) * sin(phi));
}
`

// Base tangente du cylindre transportée en espace vue : c'est le seul endroit
// où normalMatrix existe (three ne l'expose pas dans le prefix fragment).
// T suit la circonférence, B suit l'axe du tronc — les deux directions dans
// lesquelles on perturbera la normale côté fragment.
const BEGINNORMAL_VERTEX = /* glsl */ `
#include <beginnormal_vertex>

  // Déplacer des vertices n'ajuste pas les normales. Sur une surface de
  // révolution paramétrée (r(t), y(t)), la normale sortante vaut
  // (y'·dir, -r'), qu'on obtient par différences centrées sur le profil. Le
  // même calcul couvre le fût conique et le dôme, donc pas de discontinuité au
  // raccord. Les couvercles du cylindre (normale colinéaire à l'axe) sont
  // laissés tels quels : celui du haut se referme sur l'apex en triangles
  // dégénérés, sa normale n'éclaire plus rien.
  if (abs(objectNormal.y) < 0.9) {
    float protoNT = clamp((position.y + uHeight * 0.5) / uHeight, 0.0, 1.0);
    vec2 protoNDir = normalize(position.xz + vec2(0.0001));
    float protoNE = 0.01;
    vec2 protoPA = protoProfile(protoNT - protoNE, uv.x);
    vec2 protoPB = protoProfile(protoNT + protoNE, uv.x);
    float protoDR = protoPB.x - protoPA.x;
    float protoDY = (protoPB.y - protoPA.y) * uHeight;
    objectNormal = normalize(vec3(protoDY * protoNDir.x, -protoDR, protoDY * protoNDir.y));
  }

  vec3 protoAxis = vec3(0.0, 1.0, 0.0);
  vec3 protoT = cross(protoAxis, objectNormal);
  float protoTLen = length(protoT);
  // Sur les couvercles du cylindre la normale est colinéaire à l'axe : le
  // produit vectoriel s'annule et normalize() rendrait des NaN.
  protoT = protoTLen > 1e-4 ? protoT / protoTLen : vec3(1.0, 0.0, 0.0);

  vProtoTangent = normalize(normalMatrix * protoT);
  vProtoBitangent = normalize(normalMatrix * cross(objectNormal, protoT));
`

const BEGIN_VERTEX = /* glsl */ `
#include <begin_vertex>

  // Direction radiale prise AVANT le resserrement : près de l'apex le rayon
  // tend vers zéro et normalize() n'y aurait plus de sens.
  vec2 xzDir = normalize(transformed.xz + vec2(0.0001));

  // Préfixe protoV : les deux patchs vivent dans le même main(), et protoT y
  // désigne déjà la tangente posée par le patch de normale.
  float protoVT = clamp((transformed.y + uHeight * 0.5) / uHeight, 0.0, 1.0);
  vec2 protoVProf = protoProfile(protoVT, uv.x);
  float protoVBase = mix(uRadii.x, uRadii.y, protoVT);
  float protoShrink = protoVBase > 1e-4 ? protoVProf.x / protoVBase : 0.0;
  transformed.xz *= protoShrink;
  transformed.y = (protoVProf.y - 0.5) * uHeight;

  float radialDisp = sin(transformed.y * 3.0 + uv.x * 6.28318) * 0.08
                   + sin(transformed.y * 7.0) * 0.04;
  // L'écorce sculpte aussi le dôme — sans quoi le raccord fût/sommet se lirait
  // comme une couture — mais son amplitude s'éteint sur le dernier dixième, où
  // le rayon devient trop petit pour l'absorber sans faire éclater l'apex.
  radialDisp *= smoothstep(0.0, 0.22, protoShrink);
  transformed.x += xzDir.x * radialDisp;
  transformed.z += xzDir.y * radialDisp;

  vProtoUv = uv;
`

// uHeight : la hauteur du cylindre vient des args de géométrie, le shader ne
// la connaît pas. On la passe pour convertir vProtoUv.y (0 en pied, 1 au
// sommet) en hauteur locale en unités monde — la géométrie étant centrée,
// position.y ne donnerait pas directement la distance à la base.
const FRAG_HEAD = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uHeight;

varying vec2 vProtoUv;
varying vec3 vProtoTangent;
varying vec3 vProtoBitangent;

// Nombre de cellules de bruit sur un tour complet. Entiers obligatoires :
// c'est la période sur laquelle le bruit reboucle à la couture uv.x = 0 / 1.
const float PROTO_FLUTE_CELLS = 13.0;
const float PROTO_GRAIN_CELLS = 79.0;
const float PROTO_LICHEN_CELLS = 6.0;
const float PROTO_MOTTLE_CELLS = 41.0;

// Hauteur nominale du pied lichéneux, en unités monde.
const float PROTO_LICHEN_HEIGHT = 2.0;

float protoHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Bruit de valeur bouclé sur X. La coordonnée X parcourt la circonférence du
// tronc : un bruit non périodique laisserait une couture verticale nette là où
// uv.x repasse de 1 à 0. wrap est le nombre de cellules sur un tour.
float protoNoise(vec2 p, float wrap) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float x0 = mod(i.x, wrap);
  float x1 = mod(i.x + 1.0, wrap);

  return mix(
    mix(protoHash(vec2(x0, i.y)), protoHash(vec2(x1, i.y)), u.x),
    mix(protoHash(vec2(x0, i.y + 1.0)), protoHash(vec2(x1, i.y + 1.0)), u.x),
    u.y
  );
}

// La composante X de l'offset de graine doit rester ENTIÈRE, sinon elle
// désaligne le bouclage et la couture réapparaît.
vec2 protoSeedOffset() {
  return vec2(floor(uSeed * 7.0), uSeed * 13.31 + 4.0);
}

// Champ d'écorce sur deux échelles :
//  .x = grandes cannelures verticales (très étirées le long de l'axe)
//  .y = grain fibreux fin par-dessus
// Le paramétrage ne dépend que de u (tour du tronc) et de la hauteur locale.
vec2 protoBarkLayers(float u, float h) {
  vec2 s = protoSeedOffset();

  vec2 fp = vec2(u * PROTO_FLUTE_CELLS + s.x, h * 0.22 + s.y);
  float flutes = protoNoise(fp, PROTO_FLUTE_CELLS) * 0.66
               + protoNoise(fp * 2.0, PROTO_FLUTE_CELLS * 2.0) * 0.34;
  // Sans ce recentrage le bruit reste massé autour de 0.5 et les cannelures
  // n'ont ni crête ni creux lisibles.
  flutes = smoothstep(0.28, 0.74, flutes);

  vec2 gp = vec2(u * PROTO_GRAIN_CELLS + s.x * 3.0, h * 1.6 + s.y * 2.0);
  float grain = protoNoise(gp, PROTO_GRAIN_CELLS) * 0.62
              + protoNoise(gp * 2.0, PROTO_GRAIN_CELLS * 2.0) * 0.38;

  return vec2(flutes, grain);
}

float protoBarkField(float u, float h) {
  vec2 b = protoBarkLayers(u, h);
  return b.x * 0.7 + b.y * 0.3;
}
`

const COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>

  float protoH = vProtoUv.y * uHeight;
  vec2 protoBark = protoBarkLayers(vProtoUv.x, protoH);

  // Cannelures : creux sombres, crêtes plus claires et plus chaudes.
  // Colonnes gris-brun cendré : le contraste avec le sol doit être un contraste
  // de VALEUR, pas seulement de teinte. L'ancienne écorce dorée se confondait.
  vec3 protoColor = mix(vec3(0.055, 0.048, 0.042), vec3(0.155, 0.140, 0.120), protoBark.x);
  // Grain fibreux : modulation fine par-dessus, franchement irrégulière.
  protoColor *= 0.86 + protoBark.y * 0.28;

  // Pied lichéneux. La limite haute est modulée par du bruit : un dégradé
  // rectiligne se lit comme un anneau peint, une frontière irrégulière comme
  // une colonisation.
  vec2 protoSeed = protoSeedOffset();
  float lichenEdge = PROTO_LICHEN_HEIGHT * (0.45 + 0.85 * protoNoise(
    vec2(vProtoUv.x * PROTO_LICHEN_CELLS + protoSeed.x, protoSeed.y),
    PROTO_LICHEN_CELLS
  ));
  float lichen = 1.0 - smoothstep(lichenEdge - 0.5, lichenEdge + 0.25, protoH);
  // Tacheté : le lichen pousse par plaques, pas en aplat.
  float lichenMottle = protoNoise(
    vec2(vProtoUv.x * PROTO_MOTTLE_CELLS + protoSeed.x, protoH * 3.0 + protoSeed.y),
    PROTO_MOTTLE_CELLS
  );
  lichen *= 0.3 + 0.7 * smoothstep(0.34, 0.78, lichenMottle);
  protoColor = mix(protoColor, vec3(0.30, 0.36, 0.24), lichen * 0.85);

  float pulse = sin(uTime * 0.4) * 0.5 + 0.5;
  protoColor += vec3(0.10, 0.04, 0.01) * pulse * 0.06;

  diffuseColor.rgb *= protoColor;
`

// Le relief d'écorce doit exister en lumière rasante, pas seulement en
// couleur : on perturbe la normale dans le plan tangent par le gradient du
// même champ. Les deux epsilons sont volontairement asymétriques — le motif
// varie vite autour du tronc et lentement le long de l'axe, comme des fibres.
const NORMAL_FRAGMENT = /* glsl */ `
#include <normal_fragment_maps>

  float protoNrmH = vProtoUv.y * uHeight;
  float protoB0 = protoBarkField(vProtoUv.x, protoNrmH);
  float protoBU = protoBarkField(vProtoUv.x + 0.004, protoNrmH);
  float protoBV = protoBarkField(vProtoUv.x, protoNrmH + 0.05);

  normal = normalize(
    normal - 2.2 * (
      (protoBU - protoB0) * normalize(vProtoTangent)
      + (protoBV - protoB0) * normalize(vProtoBitangent)
    )
  );
`

export default function Prototaxite({
  position = [0, 0, 0],
  height = 8,
  radiusTop = 0.6,
  radiusBottom = 1.1,
  opacity = 1,
  seed = 0,
}: PrototaxiteProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  // Les objets uniform sont portés par des refs : ils doivent garder leur
  // identité entre les frames, three ne relit pas onBeforeCompile après la
  // compilation du programme.
  const timeRef = useRef<THREE.IUniform<number>>({ value: 0 })
  const seedRef = useRef<THREE.IUniform<number>>({ value: seed })
  const heightRef = useRef<THREE.IUniform<number>>({ value: height })
  const radiiRef = useRef<THREE.IUniform<THREE.Vector2>>({
    value: new THREE.Vector2(radiusBottom, radiusTop),
  })

  useEffect(() => {
    const m = matRef.current
    if (m) m.opacity = opacity
  }, [opacity])

  useEffect(() => {
    seedRef.current.value = seed
  }, [seed])

  useEffect(() => {
    heightRef.current.value = height
  }, [height])

  useEffect(() => {
    radiiRef.current.value.set(radiusBottom, radiusTop)
  }, [radiusBottom, radiusTop])

  useFrame((state) => {
    timeRef.current.value = state.clock.elapsedTime
  })

  const [x, y, z] = position

  return (
    // Un matériau transparent ne fait pas disparaître son ombre : la shadow
    // map ignore l'alpha d'un matériau opaque. Sans ces deux gardes, les
    // Prototaxites laissent leur ombre au sol après s'être effacés en eclipse.
    <mesh
      position={[x, y + height / 2, z]}
      visible={opacity > VISIBILITY_EPS}
      castShadow={opacity > SHADOW_EPS}
      receiveShadow
    >
      {/* 64 anneaux au lieu de 48 : le dôme n'en occupe que le dernier quart,
          il lui en faut assez pour que son arc ne se lise pas en facettes.
          +512 triangles par tronc, soit +3 072 sur les six. */}
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 16, 64]} />
      <meshStandardMaterial
        ref={matRef}
        transparent
        opacity={opacity}
        roughness={0.88}
        metalness={0}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = timeRef.current
          shader.uniforms.uSeed = seedRef.current
          shader.uniforms.uHeight = heightRef.current
          shader.uniforms.uRadii = radiiRef.current

          let vert = VERT_HEAD + shader.vertexShader
          vert = patch(vert, '#include <beginnormal_vertex>', BEGINNORMAL_VERTEX)
          vert = patch(vert, '#include <begin_vertex>', BEGIN_VERTEX)
          shader.vertexShader = vert

          let frag = FRAG_HEAD + shader.fragmentShader
          frag = patch(frag, '#include <color_fragment>', COLOR_FRAGMENT)
          frag = patch(frag, '#include <normal_fragment_maps>', NORMAL_FRAGMENT)
          shader.fragmentShader = frag
        }}
      />
    </mesh>
  )
}
