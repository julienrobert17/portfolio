'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { sampleTerrain } from './terrain'

interface ArthropodsProps {
  opacity?: number
  count?: number
  seed?: number
}

const BOUNDARY = 60
const LEGS_PER_BODY = 8
// Le corps fait 0.08 de haut : on le pose légèrement au-dessus du sol
const BODY_CLEARANCE = 0.04

interface ArthState {
  x: number
  z: number
  dir: number
  speed: number
  nextTurn: number
}

// Décalages locaux des 4 paires de pattes
const LEG_OFFSETS: { x: number; z: number; rotZ: number }[] = []
for (let j = 0; j < 4; j++) {
  const xo = (j / 3 - 0.5) * 0.22
  for (const s of [-1, 1]) {
    LEG_OFFSETS.push({ x: xo, z: s * 0.12, rotZ: s * 0.5 })
  }
}

export default function Arthropods({ opacity = 0, count = 12, seed = 7 }: ArthropodsProps) {
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null)
  const legMat = useRef<THREE.MeshStandardMaterial>(null)
  const bodies = useRef<(THREE.Object3D | null)[]>([])
  const legs = useRef<(THREE.Object3D | null)[]>([])
  const state = useRef<ArthState[]>([])

  // Placement initial déterministe (LCG) : Math.random() est impur et
  // interdit pendant le render.
  const initial = useMemo(() => {
    let st = seed
    const next = (n: number) => (n * 9301 + 49297) % 233280
    const out: { x: number; z: number; dir: number; speed: number }[] = []
    for (let i = 0; i < count; i++) {
      st = next(st)
      const a = (st / 233280) * Math.PI * 2
      st = next(st)
      const r = 10 + (st / 233280) * 50
      st = next(st)
      const dir = (st / 233280) * Math.PI * 2
      st = next(st)
      const speed = 0.008 + (st / 233280) * 0.015
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, dir, speed })
    }
    return out
  }, [count, seed])

  useEffect(() => {
    if (bodyMat.current) bodyMat.current.opacity = opacity
    if (legMat.current) legMat.current.opacity = opacity
  }, [opacity])

  useFrame((frame, delta) => {
    const time = frame.clock.elapsedTime

    if (state.current.length !== initial.length) {
      state.current = initial.map((l) => ({
        x: l.x,
        z: l.z,
        dir: l.dir,
        speed: l.speed,
        nextTurn: time + 3 + Math.random() * 2,
      }))
    }

    for (let i = 0; i < state.current.length; i++) {
      const s = state.current[i]

      // Changement de cap toutes les 3 à 5 secondes
      if (time >= s.nextTurn) {
        s.dir = Math.random() * Math.PI * 2
        s.nextTurn = time + 3 + Math.random() * 2
      }

      // delta * 60 : garde la vitesse de l'original (réglée par frame à
      // 60 fps) tout en restant indépendant du framerate
      const step = s.speed * delta * 60
      s.x += Math.cos(s.dir) * step
      s.z += Math.sin(s.dir) * step

      // Demi-tour si on s'éloigne trop du centre
      if (s.x * s.x + s.z * s.z > BOUNDARY * BOUNDARY) {
        s.dir += Math.PI + (Math.random() - 0.5) * 0.4
      }

      const yaw = -s.dir + Math.PI * 0.5
      // Resample à chaque pas : sans ça les arthropodes traversent le relief
      const ground = sampleTerrain(s.x, s.z).height
      const body = bodies.current[i]
      if (body) {
        body.position.set(s.x, ground + BODY_CLEARANCE, s.z)
        body.rotation.set(0, yaw, 0)
      }

      // Pattes : offset local tourné par le lacet du corps
      const cos = Math.cos(yaw)
      const sin = Math.sin(yaw)
      for (let j = 0; j < LEGS_PER_BODY; j++) {
        const leg = legs.current[i * LEGS_PER_BODY + j]
        if (!leg) continue
        const o = LEG_OFFSETS[j]
        const lx = s.x + o.x * cos + o.z * sin
        const lz = s.z - o.x * sin + o.z * cos
        leg.position.set(lx, sampleTerrain(lx, lz).height + BODY_CLEARANCE, lz)
        leg.rotation.set(0, yaw, o.rotZ)
      }
    }
  })

  return (
    <group visible={opacity > 0}>
      <Instances limit={count} range={count}>
        <boxGeometry args={[0.3, 0.08, 0.15]} />
        <meshStandardMaterial ref={bodyMat} color="#1a0e08" roughness={0.95} transparent opacity={0} />
        {initial.map((_, i) => (
          <Instance
            key={i}
            ref={(el: THREE.Object3D | null) => {
              bodies.current[i] = el
            }}
          />
        ))}
      </Instances>

      <Instances limit={count * LEGS_PER_BODY} range={count * LEGS_PER_BODY}>
        <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
        <meshStandardMaterial ref={legMat} color="#1a0e08" roughness={0.95} transparent opacity={0} />
        {initial.flatMap((_, i) =>
          LEG_OFFSETS.map((_o, j) => (
            <Instance
              key={`${i}-${j}`}
              ref={(el: THREE.Object3D | null) => {
                legs.current[i * LEGS_PER_BODY + j] = el
              }}
            />
          )),
        )}
      </Instances>
    </group>
  )
}
