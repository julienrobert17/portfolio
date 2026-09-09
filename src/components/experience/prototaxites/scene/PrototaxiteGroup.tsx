'use client'

import Prototaxite from './Prototaxite'
import { WATER_LEVEL, sampleTerrain } from './terrain'

// Repris de secondaryProtos de l'ancienne scène impérative.
// L'original scalait un mesh unique (géométrie 0.6 / 1.1 / 8) : ici la
// géométrie est construite à la bonne taille, donc les scales deviennent
// des dimensions réelles — height = 8 * sy, rayons = base * sx.
const SECONDARY = [
  { x: -12, z: -8, sx: 0.7, sy: 0.75 },
  { x: 15, z: -5, sx: 0.6, sy: 0.6 },
  { x: -6, z: 14, sx: 0.85, sy: 1.0 },
  { x: 20, z: 8, sx: 0.5, sy: 0.55 },
  { x: -18, z: 5, sx: 0.9, sy: 1.1 },
] as const

// Même enfoncement que les arbres : couvre l'écart mesuré (0.2246) entre
// sampleTerrain (bilinéaire) et la surface rendue (linéaire par triangle).
const SINK = 0.3

// Les positions des Prototaxites sont composées, pas tirées au sort : plutôt
// que de les rejeter, on décale au point sec le plus proche par une spirale
// courte, ce qui préserve la composition d'origine.
const BANK_MARGIN = 0.4
const SEARCH_STEP = 1.5
const SEARCH_RINGS = 6

function dryPosition(x: number, z: number): [number, number, number] {
  const minGround = WATER_LEVEL() + BANK_MARGIN
  const here = sampleTerrain(x, z).height
  if (here >= minGround) return [x, here, z]

  let best: [number, number, number] = [x, here, z]
  for (let ring = 1; ring <= SEARCH_RINGS; ring++) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const nx = x + Math.cos(a) * ring * SEARCH_STEP
      const nz = z + Math.sin(a) * ring * SEARCH_STEP
      const h = sampleTerrain(nx, nz).height
      if (h > best[1]) best = [nx, h, nz]
      if (h >= minGround) return [nx, h, nz]
    }
  }
  return best
}

const BASE_HEIGHT = 8
const BASE_RADIUS_TOP = 0.6
const BASE_RADIUS_BOTTOM = 1.1

interface PrototaxiteGroupProps {
  opacity?: number
}

export default function PrototaxiteGroup({ opacity = 1 }: PrototaxiteGroupProps) {
  return (
    <>
      {/* Prototaxite principal */}
      <Prototaxite
        position={(() => {
          const [dx, dy, dz] = dryPosition(0, 0)
          return [dx, dy - SINK, dz]
        })()}
        height={BASE_HEIGHT}
        opacity={opacity}
      />

      {/* 5 secondaires, chacun reposant au sol */}
      {SECONDARY.map(({ x, z, sx, sy }, i) => (
        <Prototaxite
          key={i}
          position={(() => {
            const [dx, dy, dz] = dryPosition(x, z)
            return [dx, dy - SINK, dz]
          })()}
          height={BASE_HEIGHT * sy}
          radiusTop={BASE_RADIUS_TOP * sx}
          radiusBottom={BASE_RADIUS_BOTTOM * sx}
          opacity={opacity}
        />
      ))}
    </>
  )
}
