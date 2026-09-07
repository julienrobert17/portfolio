'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'

interface InternalStructureProps {
  opacity?: number
}

// 3 couches concentriques — reprises de l'ancienne scène impérative
const LAYERS = [
  { r: 0.2, n: 6, tr: 0.015 },
  { r: 0.5, n: 12, tr: 0.025 },
  { r: 0.85, n: 18, tr: 0.035 },
] as const

const SPOT_COUNT = 8

export default function InternalStructure({ opacity = 0 }: InternalStructureProps) {
  // Matériaux déclarés en JSX et récupérés par ref : un seul objet par
  // famille, partagé par toutes les instances. Les taches doivent partager
  // le leur, sinon seules certaines recevraient l'opacité et la pulsation.
  const tubeMat = useRef<THREE.MeshStandardMaterial>(null)
  const spotMat = useRef<THREE.MeshStandardMaterial>(null)

  const tubes = useMemo(() => {
    const out: {
      key: string
      position: [number, number, number]
      scale: [number, number, number]
    }[] = []
    for (const { r, n, tr } of LAYERS) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        out.push({
          key: `${r}-${i}`,
          position: [Math.cos(a) * r, 0, Math.sin(a) * r],
          scale: [tr, 1, tr],
        })
      }
    }
    return out
  }, [])

  const spots = useMemo(() => Array.from({ length: SPOT_COUNT }, (_, i) => -3.5 + i * 1.0), [])

  useEffect(() => {
    if (tubeMat.current) tubeMat.current.opacity = opacity
    if (spotMat.current) spotMat.current.opacity = opacity
  }, [opacity])

  useFrame((state) => {
    // Pulsation lente de l'émissif
    const pulse = (Math.sin(state.clock.elapsedTime * 1.2) * 0.5 + 0.5) * 0.4
    if (tubeMat.current) tubeMat.current.emissiveIntensity = pulse
    if (spotMat.current) spotMat.current.emissiveIntensity = pulse
  })

  return (
    <group position={[0, 4, 0]} visible={opacity > 0}>
      {/* 36 tubes en un seul draw call */}
      <Instances limit={tubes.length} range={tubes.length}>
        <cylinderGeometry args={[1, 1, 7.5, 5]} />
        <meshStandardMaterial
          ref={tubeMat}
          color="#2a6a4a"
          emissive="#2a6a4a"
          emissiveIntensity={0}
          transparent
          opacity={0}
        />
        {tubes.map((t) => (
          <Instance key={t.key} position={t.position} scale={t.scale} />
        ))}
      </Instances>

      {/* Taches médullaires */}
      <Instances limit={SPOT_COUNT} range={SPOT_COUNT}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshStandardMaterial
          ref={spotMat}
          color="#3a8a5a"
          emissive="#3a8a5a"
          emissiveIntensity={0}
          transparent
          opacity={0}
        />
        {spots.map((y, i) => (
          <Instance key={i} position={[0, y, 0]} />
        ))}
      </Instances>
    </group>
  )
}
