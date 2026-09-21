/**
 * Axonométrie commune au SVG statique et à la caméra orthographique : même
 * azimut, même plongée, pour que le fondu croisé SVG → canvas soit exact.
 * Repère maquette (x, y au sol, z vers le haut) → repère three (X = x, Y = z, Z = y).
 */
export const AZIMUT = 30
export const ELEVATION = 30

const a = (AZIMUT * Math.PI) / 180
const e = (ELEVATION * Math.PI) / 180

/** Direction cible → caméra, en repère three. */
export const DIRECTION_CAMERA: readonly [number, number, number] = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]

const droite = [Math.cos(a), 0, -Math.sin(a)]
const haut = [-Math.sin(a) * Math.sin(e), Math.cos(e), -Math.cos(a) * Math.sin(e)]

/** Projette un point maquette en coordonnées écran (y vers le bas), en mètres. */
export function projeter(x: number, y: number, z: number): [number, number] {
  const p = [x, z, y]
  const sx = p[0] * droite[0] + p[1] * droite[1] + p[2] * droite[2]
  const sy = -(p[0] * haut[0] + p[1] * haut[1] + p[2] * haut[2])
  return [sx, sy]
}

/** Profondeur vers la caméra : plus grand = plus proche. */
export function profondeur(x: number, y: number, z: number): number {
  return x * DIRECTION_CAMERA[0] + z * DIRECTION_CAMERA[1] + y * DIRECTION_CAMERA[2]
}
