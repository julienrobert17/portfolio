'use client'

import type React from 'react'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import { WATER_LEVEL } from './terrain'

// Plan large posé exactement au niveau d'eau : c'est le terrain qui émerge qui
// découpe les chenaux, on n'a pas à modéliser leur forme. 500 unités suffisent,
// le FogExp2 masque le reste bien avant le bord.
const WATER_SIZE = 500

interface DevonianWaterProps {
  /** Permet de couper le reflet si le coût devient un problème. */
  reflections?: boolean
}

export default function DevonianWater({ reflections = true }: DevonianWaterProps) {
  const matRef = useRef<React.ComponentRef<typeof MeshReflectorMaterial>>(null)
  const level = WATER_LEVEL()

  // Distorsion lentement animée : sans ça la surface est un miroir figé.
  useFrame((state) => {
    const m = matRef.current
    if (m) m.distortion = 0.22 + Math.sin(state.clock.elapsedTime * 0.18) * 0.06
  })

  return (
    <mesh position={[0, level, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE]} />
      <MeshReflectorMaterial
        ref={matRef}
        resolution={reflections ? 512 : 128}
        mirror={reflections ? 0.62 : 0}
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
    </mesh>
  )
}
