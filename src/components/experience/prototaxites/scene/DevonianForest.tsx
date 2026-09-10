'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { WATER_LEVEL, sampleTerrain } from './terrain'

export interface ForestOptions {
  count?: number
  innerRadius?: number // distance mini au centre
  outerRadius?: number // distance maxi
  minHeight?: number
  maxHeight?: number
  seed?: number // pour un placement déterministe
}

interface DevonianForestProps extends ForestOptions {
  /** Colonisation du terrain, 0 → 1. Pilote la pousse arbre par arbre. */
  forestSpread: number
}

const DEFAULTS = {
  count: 1200,
  innerRadius: 14,
  outerRadius: 240,
  minHeight: 6,
  maxHeight: 11,
  seed: 1,
} as const

// ── Loi de densité ──────────────────────────────────────────────────────────
// Tirer le rayon uniformément donne une densité SURFACIQUE en 1/r : la surface
// croît en r² pendant que le nombre d'arbres reste constant, donc le lointain
// se vide. La réciproque de la CDF d'une densité σ(r) ∝ r^g est
//   r = (r0^k + u (r1^k − r0^k))^(1/k)  avec k = 2 + g.
// g = 0 donne une densité surfacique constante ; on va légèrement au-delà pour
// que l'horizon se referme plus vite que la perspective ne l'écarte.
const DENSITY_GRADIENT = 0.35

// Le premier plan est régi à part. Une loi unique sur [14, 240] affamerait le
// centre : l'anneau extérieur pèse 97 % de la surface, et monter le total pour
// boiser l'horizon y aurait ajouté une poignée d'arbres au mieux. La population
// du premier plan est donc fixée en ABSOLU — augmenter le total densifie le
// lointain sans jamais peupler la zone des Prototaxites.
const NEAR_COUNT = 55
const NEAR_OUTER = 70
// Les deux lois se recouvrent sur 15 unités : sans ce chevauchement, la
// jonction se lirait comme un anneau.
const FAR_INNER = 55

// Enfoncement du tronc dans le sol. Le sol rendu est linéaire par triangle
// alors que sampleTerrain interpole la heightmap en bilinéaire : un arbre posé
// à la hauteur bilinéaire exacte peut se retrouver au-dessus du triangle
// affiché (mesuré ~0.21 d'écart max sur l'anneau de placement). 0.30 couvre
// cet écart avec marge, et reste invisible : la base du tronc est large.
const TRUNK_SINK = 0.3

// normal.y (espace monde) en dessous duquel la pente est jugée trop raide.
const MIN_NORMAL_Y = 0.75

// Bornes d'itérations : si aucun point plat n'est trouvé, on garde le dernier
// candidat plutôt que de boucler indéfiniment.
const MAX_ATTEMPTS = 16

// Les premières tentatives balaient l'ANGLE à rayon constant. Redraw complet du
// rayon à chaque essai, comme avant, la loi de densité se serait fait réécrire
// par le terrain : les anneaux traversés par un chenal exportaient leurs
// rejets vers les anneaux secs, ce qui creusait un trou mesuré entre 25 et 60
// unités. Passé ce balayage, on tolère un décalage radial pour ne pas coincer
// un arbre dont tout l'anneau est sous l'eau.
const ANGLE_ATTEMPTS = 11
const RADIAL_NUDGE = 0.18

// Dernier filet : aucun arbre ne doit finir dans l'eau. Spirale déterministe
// vers le point sec le plus proche, même principe que PrototaxiteGroup.
const DRY_RINGS = 8
const DRY_STEP = 2.0

// Marge au-dessus du niveau d'eau : un arbre pile sur la berge aurait le pied
// dans l'eau dès la moindre ondulation de la nappe.
const BANK_MARGIN = 0.35

// Fenêtre angulaire initiale autour du secteur attribué à chaque arbre.
const ANGLE_SPREAD = 0.5

// Largeur de la rampe de pousse d'un arbre, en unités de forestSpread.
// Fenêtre de croissance individuelle. Élargie de 0.25 à 0.35 : la pousse de
// chaque arbre est plus douce et les paliers entre arbres se recouvrent.
// Fenêtre de croissance individuelle. À 0.30 avec des seuils étalés sur
// [0, 0.70], on a en permanence ~30 % d'arbres adultes, ~43 % en cours de
// pousse et ~27 % pas encore levés : c'est cette coexistence qui fait lire une
// colonisation plutôt qu'une poussée simultanée.
const GLB_URL = '/prehistoric_tree_01.glb'

// Objets de travail réutilisés : recomposer 300 matrices par frame ne doit pas
// allouer.
const SCRATCH_MATRIX = new THREE.Matrix4()
const SCRATCH_QUAT = new THREE.Quaternion()
const SCRATCH_POS = new THREE.Vector3()
const SCRATCH_SCALE = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

// Au-delà de ce rayon les arbres cessent de projeter une ombre : le frustum de
// la directionnelle ne couvre que ±60, ils alimentaient la shadow map sans rien
// pouvoir y inscrire.
const SHADOW_RADIUS = 60

// Paliers de détail. `until` est le rayon jusqu'auquel le palier s'applique,
// `keep` la fraction de triangles gardée sur le FEUILLAGE (8056 triangles
// contre 223 pour le tronc : c'est lui, et lui seul, qu'il faut alléger).
//
// Le tronc n'est jamais décimé, à aucune distance. Il ne pèse que 223
// triangles, et le décimer par paires perce le tube — un arbre à 200 unités
// reste haut d'une quarantaine de pixels, la brume l'estompe mais ne l'efface
// pas. Les 90 000 triangles que ça aurait rendus ne valaient pas ce risque.
//
// Quatre paliers plutôt que deux : le rapport du lot précédent signalait la
// frontière de LOD visible à 60 unités, où le feuillage tombait de 8056 à 2686
// d'un coup. Un facteur ~2.3 par palier au lieu d'un facteur 3 unique, réparti
// sur quatre distances, adoucit chaque marche.
const LOD_TIERS: readonly { until: number; keep: number }[] = [
  { until: SHADOW_RADIUS, keep: 1 },
  { until: 110, keep: 0.34 },
  { until: 170, keep: 0.17 },
  { until: Number.POSITIVE_INFINITY, keep: 0.08 },
]
const HEAVY_TRI_THRESHOLD = 1000

/** Décime une géométrie indexée par paires de triangles (les cartes de
 *  feuillage sont des quads : retirer un triangle sur deux les trouerait). */
function decimate(geometry: THREE.BufferGeometry, keep: number): THREE.BufferGeometry {
  const index = geometry.index
  if (!index) return geometry
  const pairs = Math.floor(index.count / 6)
  const stride = Math.max(1, Math.round(1 / keep))
  const kept: number[] = []
  for (let p = 0; p < pairs; p += stride) {
    for (let k = 0; k < 6; k++) kept.push(index.getX(p * 6 + k))
  }
  const out = geometry.clone()
  out.setIndex(kept)
  return out
}

const GROWTH_BAND = 0.3

// Amplitude du bruit ajouté au seuil, pour casser le front circulaire parfait.
// Élargi : le rang purement radial faisait apparaître les arbres par anneaux
// concentriques nettement visibles.
const THRESHOLD_JITTER = 0.22

interface ForestTree {
  key: number
  position: [number, number, number]
  height: number
  rotationY: number
  threshold: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/**
 * Rayon tiré pour que la densité surfacique suive r^DENSITY_GRADIENT sur
 * l'anneau [r0, r1]. Réciproque de la CDF ; g = 0 rendrait le classique
 * sqrt(u), qui donne une densité constante.
 */
function radiusFor(u: number, r0: number, r1: number): number {
  const k = 2 + DENSITY_GRADIENT
  const a = Math.pow(r0, k)
  const b = Math.pow(r1, k)
  return Math.pow(a + u * (b - a), 1 / k)
}

/**
 * Point sec le plus proche, par spirale déterministe. N'est atteint que si
 * MAX_ATTEMPTS tirages ont tous échoué — sans lui, un arbre finissait dans un
 * chenal, ce qui devient statistiquement certain à mille tirages.
 */
function dryNearby(x: number, z: number, minGround: number) {
  let best = { x, z, y: sampleTerrain(x, z).height }
  if (best.y >= minGround) return best
  for (let ring = 1; ring <= DRY_RINGS; ring++) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const nx = x + Math.cos(a) * ring * DRY_STEP
      const nz = z + Math.sin(a) * ring * DRY_STEP
      const h = sampleTerrain(nx, nz).height
      if (h > best.y) best = { x: nx, z: nz, y: h }
      if (h >= minGround) return best
    }
  }
  return best
}

/**
 * Génération déterministe de la forêt.
 *
 * LCG déroulé en boucle explicite (tirages dans un ordre fixe) plutôt qu'une
 * closure `rand()` : react-hooks/immutability interdit de réassigner une
 * variable capturée, et react-hooks/purity interdit Math.random() au render.
 */
function buildForest(opts: Required<ForestOptions>): ForestTree[] {
  const { count, innerRadius, outerRadius, minHeight, maxHeight, seed } = opts

  let s = seed
  const next = (state: number) => (state * 9301 + 49297) % 233280

  const placed: {
    key: number
    x: number
    z: number
    y: number
    height: number
    rotationY: number
    jitter: number
    dist: number
  }[] = []

  // Deux populations : le premier plan, dont l'effectif est fixe, et le reste
  // qui suit la loi de densité. Chacune répartit ses propres secteurs sur le
  // tour complet — indexer les angles sur le total tasserait les 55 arbres du
  // premier plan dans les vingt premiers degrés.
  const nearCount = Math.min(NEAR_COUNT, count)
  const farCount = Math.max(0, count - nearCount)

  for (let i = 0; i < count; i++) {
    let x = 0
    let z = 0
    let y = 0

    const isNear = i < nearCount
    const sector = isNear
      ? (i / Math.max(1, nearCount)) * Math.PI * 2
      : ((i - nearCount) / Math.max(1, farCount)) * Math.PI * 2

    // Le rayon cible est tiré UNE fois et tenu pendant tout le balayage
    // angulaire : c'est ce qui garde la loi de densité intacte face au terrain.
    s = next(s)
    const rTarget = s / 233280
    const targetDist = isNear
      ? innerRadius + rTarget * (NEAR_OUTER - innerRadius)
      : radiusFor(rTarget, FAR_INNER, outerRadius)

    // Deux rejets : pente trop forte, et pied sous le niveau d'eau (rien ne
    // doit pousser dans un chenal). On balaie l'angle, puis on tolère un
    // décalage radial, dans la limite de MAX_ATTEMPTS.
    const minGround = WATER_LEVEL() + BANK_MARGIN
    // Le plus au sec des candidats, point de départ de la spirale si tous
    // échouent. Sa hauteur est relue par dryNearby, inutile de la garder.
    let bestScore = -Infinity
    let bestX = 0
    let bestZ = 0

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      s = next(s)
      const rAng = s / 233280
      s = next(s)
      const rNudge = s / 233280

      // La fenêtre angulaire s'ÉLARGIT à chaque tentative. Avec une fenêtre
      // fixe de ±0.25 rad, un arbre dont le secteur tombe sur un chenal ne
      // pouvait pas s'en extraire et finissait dans l'eau. On part de la
      // répartition régulière en anneau, et on ne s'en éloigne qu'au besoin.
      const spread = ANGLE_SPREAD + (attempt / (MAX_ATTEMPTS - 1)) * (Math.PI * 2 - ANGLE_SPREAD)
      const ang = sector + (rAng - 0.5) * spread
      const dist =
        attempt < ANGLE_ATTEMPTS
          ? targetDist
          : targetDist * (1 + (rNudge - 0.5) * 2 * RADIAL_NUDGE)
      x = Math.cos(ang) * dist
      z = Math.sin(ang) * dist

      const ground = sampleTerrain(x, z)
      y = ground.height

      // Meilleur candidat = le plus au sec, gardé en repli si aucun ne passe
      if (y > bestScore) {
        bestScore = y
        bestX = x
        bestZ = z
      }

      if (ground.normal.y >= MIN_NORMAL_Y && y >= minGround) break
    }

    if (y < minGround) {
      // Le meilleur des tirages est encore mouillé : on marche vers le sec.
      const dry = dryNearby(bestX, bestZ, minGround)
      x = dry.x
      z = dry.z
      y = dry.y
    }

    s = next(s)
    const rHeight = s / 233280
    s = next(s)
    const rRot = s / 233280
    s = next(s)
    const rJitter = s / 233280

    placed.push({
      key: i,
      x,
      z,
      y,
      height: minHeight + rHeight * (maxHeight - minHeight),
      rotationY: rRot * Math.PI * 2,
      jitter: (rJitter - 0.5) * 2 * THRESHOLD_JITTER,
      // Rayon RETENU, pas rayon tiré : un arbre déplacé par le rejet ou par la
      // spirale sèche prenait jusqu'ici le rang de colonisation de sa position
      // d'origine, et pouvait donc lever hors de son tour.
      dist: Math.hypot(x, z),
    })
  }

  // Seuil de colonisation : rang de distance au centre, les proches d'abord.
  // Le rang est ramené dans [0, 1 - GROWTH_BAND] pour que même le dernier
  // arbre atteigne sa taille pleine à forestSpread = 1.
  const byDistance = [...placed].sort((a, b) => a.dist - b.dist)
  const rank = new Map<number, number>()
  byDistance.forEach((t, index) => rank.set(t.key, index))
  const lastRank = Math.max(1, placed.length - 1)

  // Le jitter puis le clamp tassaient les seuils : rien ne garantissait qu'un
  // arbre atteigne le seuil maximal, donc la colonisation se terminait avant la
  // fin de la phase. On renormalise la distribution jitterée pour qu'elle
  // occupe EXACTEMENT [0, 1 - GROWTH_BAND].
  const raw = placed.map((t) => (rank.get(t.key) ?? 0) / lastRank + t.jitter)
  const rawMin = Math.min(...raw)
  const rawMax = Math.max(...raw)
  const rawSpan = Math.max(1e-6, rawMax - rawMin)

  return placed.map((t, i) => {
    const threshold = ((raw[i] - rawMin) / rawSpan) * (1 - GROWTH_BAND)
    return {
      key: t.key,
      position: [t.x, t.y - TRUNK_SINK, t.z] as [number, number, number],
      height: t.height,
      rotationY: t.rotationY,
      threshold,
    }
  })
}

function resolve(opts?: ForestOptions): Required<ForestOptions> {
  return { ...DEFAULTS, ...opts }
}

// Mémoïsation au niveau module : la forêt est échantillonnée sur la heightmap
// (coûteux), et la fumée de la phase suivante lit les mêmes positions sans
// relancer la génération.
const forestCache = new Map<string, ForestTree[]>()

function getForest(opts: Required<ForestOptions>): ForestTree[] {
  const key = `${opts.count}|${opts.innerRadius}|${opts.outerRadius}|${opts.minHeight}|${opts.maxHeight}|${opts.seed}`
  const cached = forestCache.get(key)
  if (cached) return cached
  const built = buildForest(opts)
  forestCache.set(key, built)
  return built
}

/**
 * Positions au sol (x, z) des arbres générés, pour brancher d'autres éléments
 * de scène (foyers de fumée, faune…) sur la forêt réelle plutôt que sur des
 * coordonnées codées en dur. Mêmes options par défaut que <DevonianForest />.
 */
export function getForestPositions(opts?: ForestOptions): [number, number][] {
  return getForest(resolve(opts)).map((t) => [t.position[0], t.position[2]])
}

/** Seuils de colonisation, exposés pour vérification numérique. */
export function getForestThresholds(opts?: ForestOptions): number[] {
  return getForest(resolve(opts)).map((t) => t.threshold)
}

/** Largeur de la fenêtre de croissance individuelle. */
export const FOREST_GROWTH_BAND = GROWTH_BAND

export default function DevonianForest({
  count = DEFAULTS.count,
  innerRadius = DEFAULTS.innerRadius,
  outerRadius = DEFAULTS.outerRadius,
  minHeight = DEFAULTS.minHeight,
  maxHeight = DEFAULTS.maxHeight,
  seed = DEFAULTS.seed,
  forestSpread,
}: DevonianForestProps) {
  const { scene } = useGLTF(GLB_URL)
  const trees = getForest({ count, innerRadius, outerRadius, minHeight, maxHeight, seed })

  // Les 24 clones tenaient ; plusieurs centaines ne tiendraient pas. On extrait
  // les géométries du GLB une fois, matrice locale cuite dedans, et on les rend
  // en InstancedMesh — deux draw calls quel que soit le nombre d'arbres.
  const sources = useMemo(() => {
    scene.updateMatrixWorld(true)
    const out: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = []
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const geometry = mesh.geometry.clone()
      geometry.applyMatrix4(mesh.matrixWorld)
      out.push({
        geometry,
        material: Array.isArray(mesh.material) ? mesh.material[0] : mesh.material,
      })
    })
    return out
  }, [scene])

  // Normalisation reprise de l'ancien DevonianTree : la géométrie du GLB est
  // bakée loin de son origine, le recentrage X/Z est indispensable.
  const norm = useMemo(() => {
    const box = new THREE.Box3()
    for (const src of sources) {
      src.geometry.computeBoundingBox()
      const bb = src.geometry.boundingBox
      if (bb) box.union(bb)
    }
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return { sizeY: size.y || 1, cx: center.x, cz: center.z, minY: box.min.y }
  }, [sources])

  // Un jeu de géométries par palier de détail. Seul le feuillage est décimé.
  const tierSources = useMemo(
    () =>
      LOD_TIERS.map((tier) =>
        tier.keep >= 1
          ? sources
          : sources.map((src) => {
              const tris = src.geometry.index
                ? src.geometry.index.count / 3
                : src.geometry.attributes.position.count / 3
              return tris > HEAVY_TRI_THRESHOLD
                ? { ...src, geometry: decimate(src.geometry, tier.keep) }
                : src
            }),
      ),
    [sources],
  )

  const tiers = useMemo(() => {
    const out: number[][] = LOD_TIERS.map(() => [])
    trees.forEach((t, i) => {
      const r = Math.hypot(t.position[0], t.position[2])
      out[LOD_TIERS.findIndex((tier) => r <= tier.until)].push(i)
    })
    // Triés par seuil : les arbres déjà levés occupent toujours les premiers
    // slots, ce qui permet de ne dessiner qu'eux via InstancedMesh.count.
    for (const list of out) list.sort((a, b) => trees[a].threshold - trees[b].threshold)
    return out
  }, [trees])

  const tierRefs = useRef<(THREE.InstancedMesh | null)[][]>([])
  const lastSpread = useRef(-1)

  useFrame(() => {
    if (Math.abs(lastSpread.current - forestSpread) < 0.0005) return
    lastSpread.current = forestSpread

    const m = SCRATCH_MATRIX
    const q = SCRATCH_QUAT
    const pos = SCRATCH_POS
    const scl = SCRATCH_SCALE

    const write = (indices: number[], refs: (THREE.InstancedMesh | null)[]) => {
    let drawn = 0
    for (let slot = 0; slot < indices.length; slot++) {
      const t = trees[indices[slot]]
      const growth = smoothstep(t.threshold, t.threshold + GROWTH_BAND, forestSpread)
      const s = (t.height / norm.sizeY) * growth

      // T(position) · Ry(rotation) · T(offset · growth) · S(scale)
      // L'offset suit growth pour que la base reste collée au sol pendant la pousse.
      const ox = -norm.cx * s
      const oy = -norm.minY * s
      const oz = -norm.cz * s
      const cos = Math.cos(t.rotationY)
      const sin = Math.sin(t.rotationY)

      pos.set(
        t.position[0] + ox * cos + oz * sin,
        t.position[1] + oy,
        t.position[2] - ox * sin + oz * cos,
      )
      q.setFromAxisAngle(UP, t.rotationY)
      scl.setScalar(s)
      m.compose(pos, q, scl)

      // Les seuils sont triés : dès qu'un arbre n'est pas levé, aucun des
      // suivants ne l'est. Un InstancedMesh dessine TOUTES ses instances même à
      // échelle nulle — sans cette coupe, la forêt coûtait 1.9 M de triangles
      // en phase presence alors qu'aucun arbre n'est visible.
      if (growth < 0.004) break
      for (const ref of refs) ref?.setMatrixAt(drawn, m)
      drawn++
    }
    for (const ref of refs) {
      if (!ref) continue
      ref.count = drawn
      ref.instanceMatrix.needsUpdate = true
    }
    }

    for (let t = 0; t < tiers.length; t++) write(tiers[t], tierRefs.current[t] ?? [])
  })

  return (
    <>
      {tierSources.map((srcs, t) =>
        srcs.map((src, i) => (
          <instancedMesh
            key={`t${t}-${i}`}
            ref={(el) => {
              const list = tierRefs.current[t] ?? []
              list[i] = el
              tierRefs.current[t] = list
            }}
            args={[src.geometry, src.material, Math.max(1, tiers[t].length)]}
            // Le frustum de la directionnelle ne couvre que ±60 : au-delà, un
            // arbre alimente la shadow map sans rien pouvoir y inscrire.
            castShadow={LOD_TIERS[t].until <= SHADOW_RADIUS}
            // La bounding sphere d'un InstancedMesh est calculée sur la
            // géométrie source, pas sur les instances : le culling ferait
            // disparaître la forêt entière selon l'angle.
            frustumCulled={false}
          />
        )),
      )}
    </>
  )
}

useGLTF.preload(GLB_URL)
