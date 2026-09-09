'use client'

import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { TERRAIN_SIZE, WATER_LEVEL, sampleTerrain } from './terrain'
import { GROUND_SEGMENTS } from './DevonianGround'

// ─── Flore rase du Dévonien inférieur ────────────────────────────────────────
// Au Dévonien inférieur, les seules plantes dressées sont des axes NUS,
// ramifiés par dichotomie et terminés par des sporanges : pas de feuille (elles
// n'apparaissent qu'au Dévonien supérieur), pas de fleur, pas d'herbe, et une
// hauteur qui plafonne vers 30 cm. Une seule espèce type Cooksonia suffit donc,
// et toute silhouette « touffe d'herbe » serait un anachronisme de 100 Ma.

export interface GroundFloraProps {
  count?: number
  seed?: number
  maxRadius?: number
}

const DEFAULT_COUNT = 400
const DEFAULT_SEED = 17
// Stratégie de coût : rayon de placement borné plutôt que fade en distance.
// Un fade coûterait un calcul par instance et par frame ; borner le rayon coûte
// zéro à l'exécution, et au-delà de ~45 unités une plante de 0.3 fait moins
// d'un pixel de toute façon.
const DEFAULT_MAX_RADIUS = 45

// ─── Morphologie (géométrie unitaire, hauteur totale = 1) ────────────────────

/** Hauteur à laquelle l'axe se divise en deux. */
const STEM_TOP = 0.55
const BRANCH_LEN = 0.42
/** Écartement de la dichotomie, en radians depuis la verticale. */
const BRANCH_TILT = 0.42
// Sporanges volontairement grossis : à l'échelle réelle (~2 mm sur une plante
// de 30 cm) ils tomberaient sous le pixel et la plante se lirait comme un fil.
const SPORANGE_R = 0.075

const TIP_X = Math.sin(BRANCH_TILT) * BRANCH_LEN
const TIP_Y = STEM_TOP + Math.cos(BRANCH_TILT) * BRANCH_LEN

/**
 * Une plante entière fusionnée en UNE géométrie : tige + deux branches + deux
 * sporanges. C'est ce qui permet de tenir les quelques centaines d'instances en
 * un seul draw call — un groupe de 5 primitives instanciées séparément en
 * coûterait cinq.
 *
 * Cylindres ouverts (pas de capuchon) et sphères à 6×4 segments : ~110 sommets
 * par plante, invisible à cette taille à l'écran.
 */
function buildPlantGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  const stem = new THREE.CylinderGeometry(0.028, 0.045, STEM_TOP, 5, 1, true)
  stem.translate(0, STEM_TOP / 2, 0)
  parts.push(stem)

  for (const side of [-1, 1]) {
    const branch = new THREE.CylinderGeometry(0.016, 0.028, BRANCH_LEN, 5, 1, true)
    branch.translate(0, BRANCH_LEN / 2, 0)
    branch.rotateZ(side * BRANCH_TILT)
    branch.translate(0, STEM_TOP, 0)
    parts.push(branch)

    const sporange = new THREE.SphereGeometry(SPORANGE_R, 6, 4)
    // Aplati : les sporanges de Cooksonia sont des capsules en dôme, pas des
    // billes.
    sporange.scale(1, 0.72, 1)
    sporange.translate(side * TIP_X, TIP_Y, 0)
    parts.push(sporange)
  }

  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  merged.computeBoundingSphere()
  return merged
}

// Mémoïsation module : la géométrie est identique pour toutes les instances et
// survit aux remontages (le <primitive> la porte en dispose={null}).
let cachedGeometry: THREE.BufferGeometry | null = null

function getPlantGeometry(): THREE.BufferGeometry {
  if (!cachedGeometry) cachedGeometry = buildPlantGeometry()
  return cachedGeometry
}

// ─── Hauteur du sol RÉELLEMENT AFFICHÉ ───────────────────────────────────────
// sampleTerrain interpole la heightmap (texel de 1.56), alors que le sol rendu
// est un plan tessellé linéairement par quad de 2.08 : les deux surfaces ne
// coïncident qu'aux sommets de la grille. Écart mesuré sur les zones où cette
// flore pousse : médiane 0.005, p95 0.058, max 0.139 — soit jusqu'à 90 % de la
// hauteur d'une plante de 0.15. Un arbre de 8 unités peut ignorer ça (et
// DevonianForest l'absorbe avec un enfoncement de 0.30), pas une plante de
// 15 cm : on reconstruit donc la hauteur du TRIANGLE affiché.
//
const GROUND_CELL = TERRAIN_SIZE / GROUND_SEGMENTS
const HALF = TERRAIN_SIZE / 2

/**
 * Hauteur du sol tel qu'il est rasterisé, au point monde (x, z).
 *
 * Le plan porte rotation X = -π/2, donc local (x, y) → monde (x, -y), et la
 * ligne iy de PlaneGeometry tombe sur z = -HALF + iy * cell. La triangulation
 * de three est (a, b, d) puis (b, c, d) : la diagonale du quad va du coin
 * (ix, iz+1) au coin (ix+1, iz). Vérifié numériquement : exact aux sommets
 * (4e-10) et continu de part et d'autre de la diagonale.
 */
function renderedGroundHeight(x: number, z: number): number {
  const gx = (x + HALF) / GROUND_CELL
  const gz = (z + HALF) / GROUND_CELL
  const ix = Math.floor(gx)
  const iz = Math.floor(gz)
  const fx = gx - ix
  const fz = gz - iz

  const x0 = -HALF + ix * GROUND_CELL
  const x1 = x0 + GROUND_CELL
  const z0 = -HALF + iz * GROUND_CELL
  const z1 = z0 + GROUND_CELL

  const hA = sampleTerrain(x0, z0).height
  const hB = sampleTerrain(x0, z1).height
  const hC = sampleTerrain(x1, z1).height
  const hD = sampleTerrain(x1, z0).height

  if (fx + fz <= 1) return hA + (hD - hA) * fx + (hB - hA) * fz
  return hC + (hB - hC) * (1 - fx) + (hD - hC) * (1 - fz)
}

// ─── Placement ───────────────────────────────────────────────────────────────

/** Zone centrale réservée aux Prototaxites. */
const MIN_RADIUS = 6
/** Marge au-dessus de l'eau : rien ne pousse dans un chenal ni sur sa lèvre. */
const WATER_MARGIN = 0.2
/** Hauteur au-dessus de l'eau où la proximité humide retombe à zéro. */
const WET_FALLOFF = 6.0
/** normal.y sous lequel la paroi est trop raide pour retenir un tapis. */
const MIN_NORMAL_Y = 0.6
/** Nombre de plantes tirées autour d'un même point accepté. */
const CLUMP_SIZE = 5
const CLUMP_RADIUS = 1.1
const MIN_SCALE = 0.15
const MAX_SCALE = 0.4
/** Enfoncement : les cylindres sont ouverts, un pied posé pile au sol montre
 *  son tube creux dès que la caméra descend. */
const SINK = 0.02
/** Part de l'inclinaison du sol reprise par la plante. */
const SLOPE_LEAN = 0.5
const LEAN_JITTER = 0.22

interface FloraInstance {
  key: number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Semis déterministe.
 *
 * LCG déroulé en boucle explicite (mêmes tirages, même ordre) plutôt qu'une
 * closure `rand()` : react-hooks/purity interdit Math.random() pendant le
 * render, et react-hooks/immutability interdit de réassigner une variable
 * capturée. Même motif que DevonianForest.
 *
 * Deux étages : un point « graine » soumis aux règles d'habitat, puis une
 * touffe autour de lui. Les plantes primitives colonisaient en tapis le long
 * des berges, un semis point à point aurait la régularité d'un gazon semé.
 */
function buildFlora(count: number, seed: number, maxRadius: number): FloraInstance[] {
  let s = seed
  const next = (n: number) => (n * 9301 + 49297) % 233280

  const water = WATER_LEVEL()
  const minGround = water + WATER_MARGIN
  const minR2 = MIN_RADIUS * MIN_RADIUS
  const maxR2 = Math.max(minR2, maxRadius * maxRadius)

  const out: FloraInstance[] = []
  // Garde-fou : si l'habitat est trop étroit pour `count`, on rend ce qu'on a
  // plutôt que de boucler. Taux d'acceptation mesuré ≈ 40 % à r ≤ 45.
  const maxDraws = count * 40

  for (let draw = 0; draw < maxDraws && out.length < count; draw++) {
    s = next(s)
    const rAng = s / 233280
    s = next(s)
    const rRad = s / 233280
    s = next(s)
    const rAccept = s / 233280

    const ang = rAng * Math.PI * 2
    // sqrt : sans ça le tirage se tasse au centre au lieu d'être uniforme en
    // surface.
    const r = Math.sqrt(minR2 + rRad * (maxR2 - minR2))
    const cx = Math.cos(ang) * r
    const cz = Math.sin(ang) * r

    const ground = sampleTerrain(cx, cz)
    if (ground.height < minGround) continue
    if (ground.normal.y < MIN_NORMAL_Y) continue

    // Règle d'humidité partagée avec le lot mousse : 1 au niveau de l'eau,
    // 0 six unités plus haut, utilisée comme probabilité d'acceptation.
    const wetProximity = 1 - smoothstep(water, water + WET_FALLOFF, ground.height)
    if (rAccept > wetProximity) continue

    for (let k = 0; k < CLUMP_SIZE && out.length < count; k++) {
      s = next(s)
      const rOffAng = s / 233280
      s = next(s)
      const rOffRad = s / 233280
      s = next(s)
      const rScale = s / 233280
      s = next(s)
      const rSpin = s / 233280
      s = next(s)
      const rLeanX = s / 233280
      s = next(s)
      const rLeanZ = s / 233280
      s = next(s)
      const rTint = s / 233280

      const offAng = rOffAng * Math.PI * 2
      const offRad = k === 0 ? 0 : Math.sqrt(rOffRad) * CLUMP_RADIUS
      const px = cx + Math.cos(offAng) * offRad
      const pz = cz + Math.sin(offAng) * offRad

      // Les satellites repassent par les mêmes règles : une touffe posée sur
      // une berge ne doit pas déborder dans l'eau ni dans la zone centrale.
      const d2 = px * px + pz * pz
      if (d2 < minR2 || d2 > maxR2) continue
      const spot = k === 0 ? ground : sampleTerrain(px, pz)
      if (spot.height < minGround || spot.normal.y < MIN_NORMAL_Y) continue

      // Inclinaison : la plante suit à moitié la pente, plus un désordre.
      // Rotation d'axe X par θ : +Y → (0, cos θ, sin θ), d'où asin(normal.z).
      // Rotation d'axe Z par φ : +Y → (-sin φ, cos φ, 0), d'où -asin(normal.x).
      const leanX = Math.asin(clamp(spot.normal.z, -1, 1)) * SLOPE_LEAN
      const leanZ = -Math.asin(clamp(spot.normal.x, -1, 1)) * SLOPE_LEAN

      // Variation de teinte par instance : gratuite, drei écrit de toute façon
      // l'attribut instanceColor. Bornée à 1 pour rester un assombrissement.
      const v = 0.72 + rTint * 0.28
      const tint = new THREE.Color(v, v * 0.97 + 0.03, v * 0.9)

      out.push({
        key: out.length,
        position: [px, renderedGroundHeight(px, pz) - SINK, pz],
        rotation: [
          leanX + (rLeanX - 0.5) * LEAN_JITTER,
          rSpin * Math.PI * 2,
          leanZ + (rLeanZ - 0.5) * LEAN_JITTER,
        ],
        scale: MIN_SCALE + rScale * (MAX_SCALE - MIN_SCALE),
        color: `#${tint.getHexString()}`,
      })
    }
  }

  return out
}

// Mémoïsation module, comme la forêt : le semis échantillonne la heightmap
// (4 lectures par plante rien que pour la pose au sol) et ne dépend que des
// options, donc il ne doit être payé qu'une fois par session.
const floraCache = new Map<string, FloraInstance[]>()

function getFlora(count: number, seed: number, maxRadius: number): FloraInstance[] {
  const key = `${count}|${seed}|${maxRadius}`
  const cached = floraCache.get(key)
  if (cached) return cached
  const built = buildFlora(count, seed, maxRadius)
  floraCache.set(key, built)
  return built
}

/** Positions au sol (x, z) du semis, pour y accrocher d'autres éléments. */
export function getGroundFloraPositions(
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED,
  maxRadius = DEFAULT_MAX_RADIUS,
): [number, number][] {
  return getFlora(count, seed, maxRadius).map((p) => [p.position[0], p.position[2]])
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function GroundFlora({
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED,
  maxRadius = DEFAULT_MAX_RADIUS,
}: GroundFloraProps) {
  const geometry = useMemo(() => getPlantGeometry(), [])
  const plants = useMemo(() => getFlora(count, seed, maxRadius), [count, seed, maxRadius])

  if (plants.length === 0) return null

  return (
    // frames={1} : le semis est statique. Sans ça, drei recompose une matrice
    // par instance à chaque frame (~400 decompose/compose pour rien). Le
    // compteur interne de drei est remis à zéro à chaque render du composant,
    // donc les instances qui s'abonnent au montage sont bien prises en compte.
    // Contrepartie : les matrices sont figées relativement au parent — ne pas
    // animer la transformation d'un groupe ancêtre.
    //
    // frustumCulled={false} : le bounding sphere d'un InstancedMesh est calculé
    // une seule fois par three, et s'il tombe sur la frame où le compte est
    // encore à zéro il reste vide — toute la flore disparaîtrait sans erreur.
    // Le semis tient dans un disque de 45 autour de la caméra : le culling n'y
    // gagnerait rien de toute façon.
    <Instances
      limit={plants.length}
      range={plants.length}
      frames={1}
      frustumCulled={false}
    >
      <primitive object={geometry} attach="geometry" dispose={null} />
      {/* Vert-brun désaturé : ces axes sont plus proches du lichen que de la
          feuille. Pas de castShadow : à 0.3 unité l'ombre portée ne se lit pas
          et coûterait une passe de shadow map par plante. */}
      <meshStandardMaterial color="#6b7548" roughness={0.95} metalness={0} />
      {plants.map((p) => (
        <Instance
          key={p.key}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
          color={p.color}
        />
      ))}
    </Instances>
  )
}
