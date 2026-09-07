'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SmokeProps {
  opacity?: number
  count?: number
  seed?: number
}

const ORIGIN: [number, number, number] = [-80, 0, -60]
const MAX_Y = 40
const SPREAD = 18

export default function Smoke({ opacity = 0, count = 40, seed = 11 }: SmokeProps) {
  const mat = useRef<THREE.PointsMaterial>(null)
  const geo = useRef<THREE.BufferGeometry>(null)

  // Positions initiales + vitesses, déterministes (Math.random() est
  // impur pendant le render)
  const { positions, speeds } = useMemo(() => {
    let st = seed
    const next = (n: number) => (n * 9301 + 49297) % 233280
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      st = next(st)
      const ox = (st / 233280 - 0.5) * SPREAD
      st = next(st)
      const oz = (st / 233280 - 0.5) * SPREAD
      st = next(st)
      const y = (st / 233280) * MAX_Y
      st = next(st)
      spd[i] = 0.6 + (st / 233280) * 1.4

      pos[i * 3] = ORIGIN[0] + ox
      pos[i * 3 + 1] = ORIGIN[1] + y
      pos[i * 3 + 2] = ORIGIN[2] + oz
    }
    return { positions: pos, speeds: spd }
  }, [count, seed])

  useEffect(() => {
    if (mat.current) mat.current.opacity = opacity
  }, [opacity])

  useFrame((_state, delta) => {
    const g = geo.current
    if (!g) return
    const attr = g.getAttribute('position')
    if (!(attr instanceof THREE.BufferAttribute)) return
    const arr = attr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const yi = i * 3 + 1
      arr[yi] += speeds[i] * delta
      // Reset au sol une fois passé le plafond
      if (arr[yi] > ORIGIN[1] + MAX_Y) arr[yi] = ORIGIN[1]
    }
    attr.needsUpdate = true
  })

  return (
    <points visible={opacity > 0}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        color="#9a9186"
        size={2.4}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  )
}
