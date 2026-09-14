'use client'

import type React from 'react'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import { WATER_LEVEL } from './terrain'
import { REFLECTION_CUTOFF, aerialFactor } from './aerial'

// Plan large posé exactement au niveau d'eau : c'est le terrain qui émerge qui
// découpe les chenaux, on n'a pas à modéliser leur forme. 500 unités suffisent,
// le FogExp2 masque le reste bien avant le bord.
const WATER_SIZE = 500

interface DevonianWaterProps {
  /**
   * Force le reflet, quelle que soit l'altitude. Sert au banc de test ; en
   * temps normal c'est la hauteur de caméra qui décide.
   */
  forceReflections?: boolean
}

export default function DevonianWater({ forceReflections }: DevonianWaterProps) {
  const matRef = useRef<React.ComponentRef<typeof MeshReflectorMaterial>>(null)
  const level = WATER_LEVEL()

  // Il faut DÉMONTER MeshReflectorMaterial pour économiser quoi que ce soit :
  // son useFrame appelle gl.render(scene, virtualCamera) inconditionnellement,
  // sans regarder ni `mirror` ni `resolution`. L'ancien booléen `reflections`
  // ne touchait que ces deux props : il baissait la qualité du reflet sans
  // jamais supprimer la seconde traversée de la scène, qui est tout le coût.
  const [aerial, setAerial] = useState(false)
  const reflect = forceReflections ?? !aerial

  // Distorsion lentement animée : sans ça la surface est un miroir figé.
  useFrame((state) => {
    const m = matRef.current
    if (m) m.distortion = 0.22 + Math.sin(state.clock.elapsedTime * 0.18) * 0.06
    const next = aerialFactor(state.camera.position.y) >= REFLECTION_CUTOFF
    if (next !== aerial) setAerial(next)
  })

  return (
    <mesh position={[0, level, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE]} />
      {!reflect && (
        // Vue aérienne : la nappe est regardée de haut, le Fresnel y rend le
        // reflet quasi nul, et elle est aux trois quarts noyée de brume. On
        // garde exactement la même teinte et la même rugosité.
        <meshStandardMaterial
          color="#1b2a20"
          roughness={0.72}
          metalness={0.08}
          transparent
          opacity={0.92}
        />
      )}
      {reflect && (
      <MeshReflectorMaterial
        ref={matRef}
        resolution={512}
        mirror={0.62}
        mixStrength={1.5}
        mixBlur={0.8}
        blur={[220, 60]}
        depthScale={1.1}
        depthToBlurRatioBias={0.28}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        distortion={0.22}
        color="#1b2a20"
        roughness={0.72}
        metalness={0.08}
        transparent
        opacity={0.92}
      />
      )}
    </mesh>
  )
}
