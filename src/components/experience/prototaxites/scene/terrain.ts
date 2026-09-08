import * as THREE from 'three'

// ─── Source unique de vérité du relief ───────────────────────────────────────
// Le relief était calculé uniquement en GLSL : aucun code JS ne pouvait
// connaître la hauteur du sol en un point. On génère donc la heightmap une
// fois en JS et on la consomme des deux côtés (placement JS + displacement
// GPU), plutôt que de maintenir deux implémentations du fbm qui divergeraient.

export const TERRAIN_SIZE = 800
export const TERRAIN_RES = 512 // 1.56 unité/texel
export const MAX_HEIGHT = 6 // borne de normalisation du canal A

const HALF = TERRAIN_SIZE / 2

// ─── Bruit (portage exact du GLSL d'origine) ─────────────────────────────────

function hash(x: number, y: number): number {
  const d = x * 127.1 + y * 311.7
  const s = Math.sin(d) * 43758.5453
  return s - Math.floor(s)
}

function noise(px: number, py: number): number {
  const ix = Math.floor(px)
  const iy = Math.floor(py)
  const fx = px - ix
  const fy = py - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)

  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)

  return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy
}

// 5 octaves, lacunarité 2.1, gain 0.5, offset (1.7, 9.2)
function fbm(px: number, py: number): number {
  let v = 0
  let a = 0.5
  let x = px
  let y = py
  for (let i = 0; i < 5; i++) {
    v += a * noise(x, y)
    const nx = x * 2.1 + 1.7
    const ny = y * 2.1 + 9.2
    x = nx
    y = ny
    a *= 0.5
  }
  return v
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Hauteur analytique du terrain au point monde (x, z).
 * Reprend la composition du shader d'origine.
 */
export function terrainHeight(x: number, z: number): number {
  const h =
    fbm(x * 0.04, z * 0.04) * 4.0 +
    fbm(x * 0.12, z * 0.12) * 1.5 +
    fbm(x * 0.35, z * 0.35) * 0.5
  const flatFactor = smoothstep(8, 18, Math.hypot(x, z))
  return h * flatFactor
}

// ─── Heightmap ───────────────────────────────────────────────────────────────

let cachedTexture: THREE.DataTexture | null = null
let cachedData: Float32Array | null = null

function texelToWorld(i: number): number {
  // i ∈ [0, TERRAIN_RES-1] → [-HALF, +HALF]
  return -HALF + (i / (TERRAIN_RES - 1)) * TERRAIN_SIZE
}

function buildData(): Float32Array {
  const data = new Float32Array(TERRAIN_RES * TERRAIN_RES * 4)
  const heights = new Float32Array(TERRAIN_RES * TERRAIN_RES)

  for (let j = 0; j < TERRAIN_RES; j++) {
    const z = texelToWorld(j)
    for (let i = 0; i < TERRAIN_RES; i++) {
      heights[j * TERRAIN_RES + i] = terrainHeight(texelToWorld(i), z)
    }
  }

  // Normale par différences finies sur la grille elle-même : la normale
  // décrite par la texture correspond ainsi exactement au relief échantillonné.
  const step = TERRAIN_SIZE / (TERRAIN_RES - 1)
  const at = (i: number, j: number) => {
    const ci = Math.min(TERRAIN_RES - 1, Math.max(0, i))
    const cj = Math.min(TERRAIN_RES - 1, Math.max(0, j))
    return heights[cj * TERRAIN_RES + ci]
  }

  for (let j = 0; j < TERRAIN_RES; j++) {
    for (let i = 0; i < TERRAIN_RES; i++) {
      const hL = at(i - 1, j)
      const hR = at(i + 1, j)
      const hD = at(i, j - 1)
      const hU = at(i, j + 1)

      // Le plan vit dans XY et la hauteur est portée par Z en espace objet :
      // la normale objet est donc (-dh/dx, -dh/dy, 1).
      const nx = hL - hR
      const ny = hD - hU
      const nz = 2 * step
      const len = Math.hypot(nx, ny, nz) || 1

      const o = (j * TERRAIN_RES + i) * 4
      data[o] = nx / len
      data[o + 1] = ny / len
      data[o + 2] = nz / len
      data[o + 3] = heights[j * TERRAIN_RES + i] / MAX_HEIGHT
    }
  }

  return data
}

function ensureData(): Float32Array {
  if (!cachedData) cachedData = buildData()
  return cachedData
}

/**
 * DataTexture RGBA Float32 512×512 sur [-400, 400]².
 * RGB = normale du terrain (espace objet), A = hauteur / MAX_HEIGHT.
 * Mémoïsée au niveau module : construite une fois par session.
 */
export function buildHeightmap(): THREE.DataTexture {
  if (cachedTexture) return cachedTexture

  const tex = new THREE.DataTexture(
    ensureData(),
    TERRAIN_RES,
    TERRAIN_RES,
    THREE.RGBAFormat,
    THREE.FloatType,
  )
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.needsUpdate = true

  cachedTexture = tex
  return tex
}

/**
 * Échantillonnage bilinéaire de la MÊME heightmap que celle envoyée au GPU,
 * pour que placement JS et displacement GPU voient exactement le même sol.
 */
export function sampleTerrain(x: number, z: number): { height: number; normal: THREE.Vector3 } {
  const data = ensureData()

  // Coordonnées texel continues
  const u = ((x + HALF) / TERRAIN_SIZE) * (TERRAIN_RES - 1)
  const v = ((z + HALF) / TERRAIN_SIZE) * (TERRAIN_RES - 1)

  const cu = Math.min(TERRAIN_RES - 1, Math.max(0, u))
  const cv = Math.min(TERRAIN_RES - 1, Math.max(0, v))

  const i0 = Math.floor(cu)
  const j0 = Math.floor(cv)
  const i1 = Math.min(TERRAIN_RES - 1, i0 + 1)
  const j1 = Math.min(TERRAIN_RES - 1, j0 + 1)
  const fx = cu - i0
  const fy = cv - j0

  const read = (i: number, j: number, c: number) => data[(j * TERRAIN_RES + i) * 4 + c]
  const bilerp = (c: number) => {
    const a = read(i0, j0, c)
    const b = read(i1, j0, c)
    const cc = read(i0, j1, c)
    const d = read(i1, j1, c)
    return (a + (b - a) * fx) + ((cc + (d - cc) * fx) - (a + (b - a) * fx)) * fy
  }

  const height = bilerp(3) * MAX_HEIGHT

  // La normale stockée est en espace objet du plan (hauteur sur Z).
  // On la retourne en espace monde (Y vers le haut), cohérent avec le
  // rotateX(-PI/2) porté par le mesh : (ox, oy, oz) → (ox, oz, -oy).
  const ox = bilerp(0)
  const oy = bilerp(1)
  const oz = bilerp(2)
  const normal = new THREE.Vector3(ox, oz, -oy).normalize()

  return { height, normal }
}
