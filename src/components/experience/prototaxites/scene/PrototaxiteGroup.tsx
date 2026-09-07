'use client'

import Prototaxite from './Prototaxite'

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
      <Prototaxite position={[0, 0, 0]} height={BASE_HEIGHT} opacity={opacity} />

      {/* 5 secondaires, chacun reposant au sol */}
      {SECONDARY.map(({ x, z, sx, sy }, i) => (
        <Prototaxite
          key={i}
          position={[x, 0, z]}
          height={BASE_HEIGHT * sy}
          radiusTop={BASE_RADIUS_TOP * sx}
          radiusBottom={BASE_RADIUS_BOTTOM * sx}
          opacity={opacity}
        />
      ))}
    </>
  )
}
