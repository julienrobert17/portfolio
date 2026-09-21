'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { Group, Mesh, OrthographicCamera } from 'three'
import { hero } from '../lib/hero-store'
import { abonnerMenu, lireMenu, lireMenuServeur } from '../lib/navigation-store'
import Coupe from './coupe'
import { construireMaquette } from './geometrie'
import { MAQUETTE } from './maquette'
import { RigHero } from './rig'

export interface SceneProps {
  /** Mode initial ; le menu ouvert bascule en fil de fer tournant. */
  mode: 'hero' | 'menu'
}

/**
 * La maquette : matériau plâtre, contours fins, coupe par stencil, caméra
 * orthographique cadrée sur le repère du SVG statique pour un fondu croisé
 * exact. Tout l'impératif vit dans RigHero ; ici, seulement l'arbre.
 */
export default function Scene({ mode }: SceneProps) {
  const racine = useRef<Group>(null)
  const quad = useRef<Mesh>(null)
  const size = useThree((s) => s.size)
  const menu = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  const maquette = useMemo(() => construireMaquette(), [])
  const rig = useMemo(() => new RigHero(maquette), [maquette])

  useEffect(() => () => rig.dispose(), [rig])

  // Une frame à rendre dès le montage et à chaque redimensionnement.
  useEffect(() => {
    hero.sale = true
  }, [size])

  useFrame(({ camera, size: taille }, delta) =>
    rig.frame(camera as OrthographicCamera, taille, racine.current, quad.current, {
      mode: menu ? 'menu' : mode,
      delta: Math.min(delta, 0.1),
      tourne: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    }),
  )

  const [cx, cz] = maquette.centre

  return (
    <>
      <directionalLight position={[-8, 14, 10]} intensity={1.7} color="#fff8ee" />
      <hemisphereLight args={['#f3f0ea', '#5c5853', 1.2]} />
      <group ref={racine} position={[cx, 0, cz]}>
        <group position={[-cx, 0, -cz]}>
          <mesh geometry={maquette.geometrie} material={rig.materiau} renderOrder={2} />
          <lineSegments geometry={rig.aretes} material={rig.materiauAretes} renderOrder={3} />
          <group visible={!menu}>
            <Coupe geometrie={maquette.geometrie} plan={rig.plan} centre={maquette.centre} emprise={[MAQUETTE.socle.l, MAQUETTE.socle.p]} quadRef={quad} />
          </group>
        </group>
      </group>
    </>
  )
}
