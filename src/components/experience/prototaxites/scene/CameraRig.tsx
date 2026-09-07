'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Beat } from '../constants/narrative'

type Phase = Beat['phase']

// Repris de l'ancienne scène impérative.
// 'zoomout' n'est pas dans la table : il est piloté par progress.
const CAM: Record<
  Exclude<Phase, 'zoomout'>,
  { p: [number, number, number]; t: [number, number, number] }
> = {
  context: { p: [8, 5, 14], t: [0, 4, 0] },
  presence: { p: [8, 5, 14], t: [0, 4, 0] },
  interior: { p: [0.8, 3.5, 0.8], t: [0, 4.5, 0] },
  ecosystem: { p: [18, 8, 22], t: [0, 2, 0] },
  eclipse: { p: [14, 6, 18], t: [0, 4, 0] },
  resonance: { p: [0, 45, 55], t: [0, 8, 0] },
}

const ZOOM_P0: [number, number, number] = [14, 6, 18]
const ZOOM_P1: [number, number, number] = [0, 45, 55]
const ZOOM_T0: [number, number, number] = [0, 4, 0]
const ZOOM_T1: [number, number, number] = [0, 8, 0]

interface CameraRigProps {
  phase: Beat['phase']
  progress: number
}

export default function CameraRig({ phase, progress }: CameraRigProps) {
  const { camera } = useThree()

  // Le lookAt courant est amorti lui aussi : la caméra ne doit pas
  // sauter d'une cible à l'autre au changement de phase.
  const lookAt = useRef(new THREE.Vector3(0, 4, 0))
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())

  useFrame((_state, delta) => {
    if (phase === 'zoomout') {
      const p = THREE.MathUtils.clamp(progress, 0, 1)
      targetPos.current.set(
        THREE.MathUtils.lerp(ZOOM_P0[0], ZOOM_P1[0], p),
        THREE.MathUtils.lerp(ZOOM_P0[1], ZOOM_P1[1], p),
        THREE.MathUtils.lerp(ZOOM_P0[2], ZOOM_P1[2], p),
      )
      targetLook.current.set(
        THREE.MathUtils.lerp(ZOOM_T0[0], ZOOM_T1[0], p),
        THREE.MathUtils.lerp(ZOOM_T0[1], ZOOM_T1[1], p),
        THREE.MathUtils.lerp(ZOOM_T0[2], ZOOM_T1[2], p),
      )
    } else {
      const cam = CAM[phase]
      targetPos.current.set(cam.p[0], cam.p[1], cam.p[2])
      targetLook.current.set(cam.t[0], cam.t[1], cam.t[2])
    }

    // Amortissement indépendant du framerate
    const alpha = 1 - Math.pow(0.001, delta)
    camera.position.lerp(targetPos.current, alpha)
    lookAt.current.lerp(targetLook.current, alpha)
    camera.lookAt(lookAt.current)
  })

  return null
}
