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
  count: 300,
  innerRadius: 14,
  outerRadius: 180,
  minHeight: 6,
  maxHeight: 11,
  seed: 1,
} as const

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

// Au-delà de ce rayon les arbres passent en géométrie allégée et cessent de
// projeter une ombre : le frustum de la directionnelle ne couvre que ±60, ils
// alimentaient la shadow map sans rien pouvoir y inscrire.
const LOD_RADIUS = 60
// Fraction de triangles conservée sur le feuillage lointain. Le feuillage fait
// 8056 triangles contre 223 pour le tronc : c'est lui, et lui seul, qu'il faut
// alléger.
const FAR_KEEP = 0.34
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

  for (let i = 0; i < count; i++) {
    let x = 0
    let z = 0
    let y = 0
    let dist = 0

    // Deux rejets : pente trop forte, et pied sous le niveau d'eau (rien ne
    // doit pousser dans un chenal). On retire angle + distance, dans la limite
    // de MAX_ATTEMPTS ; le dernier candidat est conservé sinon.
    const minGround = WATER_LEVEL() + BANK_MARGIN
    let bestScore = -Infinity
    let bestX = 0
    let bestZ = 0
    let bestY = 0

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      s = next(s)
      const rAng = s / 233280
      s = next(s)
      const rDist = s / 233280

      // La fenêtre angulaire s'ÉLARGIT à chaque tentative. Avec une fenêtre
      // fixe de ±0.25 rad, un arbre dont le secteur tombe sur un chenal ne
      // pouvait pas s'en extraire et finissait dans l'eau. On part de la
      // répartition régulière en anneau, et on ne s'en éloigne qu'au besoin.
      const spread = ANGLE_SPREAD + (attempt / (MAX_ATTEMPTS - 1)) * (Math.PI * 2 - ANGLE_SPREAD)
      const ang = (i / count) * Math.PI * 2 + (rAng - 0.5) * spread
      dist = innerRadius + rDist * (outerRadius - innerRadius)
      x = Math.cos(ang) * dist
      z = Math.sin(ang) * dist

      const ground = sampleTerrain(x, z)
      y = ground.height

      // Meilleur candidat = le plus au sec, gardé en repli si aucun ne passe
      if (y > bestScore) {
        bestScore = y
        bestX = x
        bestZ = z
        bestY = y
      }

      if (ground.normal.y >= MIN_NORMAL_Y && y >= minGround) break
    }

    if (bestScore > -Infinity && (y < minGround)) {
      x = bestX
      z = bestZ
      y = bestY
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
      dist,
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

  // Géométries allégées pour le lointain
  const farSources = useMemo(
    () =>
      sources.map((src) => {
        const tris = src.geometry.index
          ? src.geometry.index.count / 3
          : src.geometry.attributes.position.count / 3
        return tris > HEAVY_TRI_THRESHOLD
          ? { ...src, geometry: decimate(src.geometry, FAR_KEEP) }
          : src
      }),
    [sources],
  )

  const split = useMemo(() => {
    const near: number[] = []
    const far: number[] = []
    trees.forEach((t, i) => {
      const r = Math.hypot(t.position[0], t.position[2])
      ;(r <= LOD_RADIUS ? near : far).push(i)
    })
    // Triés par seuil : les arbres déjà levés occupent toujours les premiers
    // slots, ce qui permet de ne dessiner qu'eux via InstancedMesh.count.
    const byThreshold = (a: number, b: number) => trees[a].threshold - trees[b].threshold
    near.sort(byThreshold)
    far.sort(byThreshold)
    return { near, far }
  }, [trees])

  const nearRefs = useRef<(THREE.InstancedMesh | null)[]>([])
  const farRefs = useRef<(THREE.InstancedMesh | null)[]>([])
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

    write(split.near, nearRefs.current)
    write(split.far, farRefs.current)
  })

  return (
    <>
      {sources.map((src, i) => (
        <instancedMesh
          key={`near-${i}`}
          ref={(el) => {
            nearRefs.current[i] = el
          }}
          args={[src.geometry, src.material, Math.max(1, split.near.length)]}
          castShadow
          // La bounding sphere d'un InstancedMesh est calculée sur la géométrie
          // source, pas sur les instances : le culling ferait disparaître la
          // forêt entière selon l'angle.
          frustumCulled={false}
        />
      ))}
      {farSources.map((src, i) => (
        <instancedMesh
          key={`far-${i}`}
          ref={(el) => {
            farRefs.current[i] = el
          }}
          args={[src.geometry, src.material, Math.max(1, split.far.length)]}
          frustumCulled={false}
        />
      ))}
    </>
  )
}

useGLTF.preload(GLB_URL)
