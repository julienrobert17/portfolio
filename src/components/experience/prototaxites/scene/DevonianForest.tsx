'use client'

import { useMemo } from 'react'
import DevonianTree from './DevonianTree'
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
  count: 24,
  innerRadius: 14,
  outerRadius: 34,
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
const GROWTH_BAND = 0.35

// Amplitude du bruit ajouté au seuil, pour casser le front circulaire parfait.
const THRESHOLD_JITTER = 0.15

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
  const trees = useMemo(
    () => getForest({ count, innerRadius, outerRadius, minHeight, maxHeight, seed }),
    [count, innerRadius, outerRadius, minHeight, maxHeight, seed],
  )

  return (
    <>
      {trees.map((t) => (
        <DevonianTree
          key={t.key}
          position={t.position}
          targetHeight={t.height}
          rotationY={t.rotationY}
          growth={smoothstep(t.threshold, t.threshold + GROWTH_BAND, forestSpread)}
        />
      ))}
    </>
  )
}
