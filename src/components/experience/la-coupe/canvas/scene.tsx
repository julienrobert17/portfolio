'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { EdgesGeometry, Group, LineBasicMaterial, MeshStandardMaterial, OrthographicCamera, Vector3 } from 'three'
import { hero } from '../lib/hero-store'
import { construireMaquette } from './geometrie'
import { DIRECTION_CAMERA, projeter } from './projection'

export interface SceneProps {
  /** `menu` : fil de fer tournant derrière le menu (Phase 4, non implémenté). */
  mode: 'hero' | 'menu'
}

const ROTATION_SCROLL = (20 * Math.PI) / 180
const PARALLAXE = (4 * Math.PI) / 180
const LERP_SOURIS = 0.08
const RECUL = 0.15
const DISTANCE_CAMERA = 80
/** Marge du SVG statique autour de la projection : 12 px à 24 px/m de chaque côté. */
const MARGE_SVG_M = 1

const DIRECTION = new Vector3(...DIRECTION_CAMERA)
const HAUT_MONDE = new Vector3(0, 1, 0)
const DROITE = new Vector3().crossVectors(HAUT_MONDE, DIRECTION).normalize()
const HAUT = new Vector3().crossVectors(DIRECTION, DROITE).normalize()

/**
 * La maquette : matériau plâtre, contours fins, caméra orthographique cadrée
 * sur le repère du SVG statique pour un fondu croisé exact. Tout ce qui bouge
 * lit le store du hero à chaque frame, sans setState.
 */
export default function Scene({ mode }: SceneProps) {
  const racine = useRef<Group>(null)
  const souris = useRef({ x: 0, y: 0 })

  const maquette = useMemo(() => construireMaquette(), [])
  const aretes = useMemo(() => new EdgesGeometry(maquette.geometrie, 15), [maquette])
  const materiau = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#f6f3ed',
        roughness: 0.95,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [],
  )
  const materiauAretes = useMemo(() => new LineBasicMaterial({ color: '#151412', transparent: true, opacity: 0.35 }), [])

  useEffect(() => {
    return () => {
      maquette.geometrie.dispose()
      aretes.dispose()
      materiau.dispose()
      materiauAretes.dispose()
    }
  }, [maquette, aretes, materiau, materiauAretes])

  /** Point du monde dont la projection tombe au centre du SVG. */
  const cible = useMemo(() => {
    const { bornes } = maquette
    const cx = (bornes.minX + bornes.maxX) / 2
    const cy = (bornes.minY + bornes.maxY) / 2
    return new Vector3().addScaledVector(DROITE, cx).addScaledVector(HAUT, -cy)
  }, [maquette])
  const largeurProjetee = maquette.bornes.maxX - maquette.bornes.minX + MARGE_SVG_M

  useFrame(({ camera: cameraDefaut, size }) => {
    const groupe = racine.current
    if (!groupe) return
    const camera = cameraDefaut as OrthographicCamera
    const p = hero.progression

    // Parallaxe souris, lissée ; tant qu'elle converge, on redessine.
    const s = souris.current
    s.x += (hero.souris.x - s.x) * LERP_SOURIS
    s.y += (hero.souris.y - s.y) * LERP_SOURIS
    if (Math.abs(hero.souris.x - s.x) > 0.001 || Math.abs(hero.souris.y - s.y) > 0.001) hero.sale = true

    groupe.rotation.y = ROTATION_SCROLL * p + PARALLAXE * s.x
    groupe.rotation.x = PARALLAXE * s.y

    // Caméra : zoom depuis la largeur du SVG, décentrage vers son centre.
    const cadre = hero.cadre
    const zoomBase = cadre ? cadre.largeur / largeurProjetee : size.height / 30
    camera.zoom = zoomBase * (1 - RECUL * p)
    camera.position.copy(cible).addScaledVector(DIRECTION, DISTANCE_CAMERA)
    camera.up.copy(HAUT_MONDE)
    camera.lookAt(cible)
    if (cadre) {
      camera.setViewOffset(size.width, size.height, -(cadre.cx - size.width / 2), -(cadre.cy - size.height / 2), size.width, size.height)
    } else {
      camera.clearViewOffset()
    }
    camera.updateProjectionMatrix()
  })

  const [cx, cz] = maquette.centre
  void mode
  void projeter

  return (
    <>
      <directionalLight position={[-8, 14, 10]} intensity={2.4} color="#fff8ee" />
      <hemisphereLight args={['#f3f0ea', '#5c5853', 1.1]} />
      <group ref={racine} position={[cx, 0, cz]}>
        <group position={[-cx, 0, -cz]}>
          <mesh geometry={maquette.geometrie} material={materiau} renderOrder={2} />
          <lineSegments geometry={aretes} material={materiauAretes} renderOrder={3} />
        </group>
      </group>
    </>
  )
}
