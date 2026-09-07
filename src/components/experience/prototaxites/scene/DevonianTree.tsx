'use client'

import { useGLTF, Clone } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface DevonianTreeProps {
  position?: [number, number, number]
  targetHeight?: number // hauteur voulue en unités de scène
  rotationY?: number
  opacity?: number
}

export default function DevonianTree({
  position = [0, 0, 0],
  targetHeight = 8,
  rotationY = 0,
  opacity = 1,
}: DevonianTreeProps) {
  const { scene } = useGLTF('/prehistoric_tree_01.glb')
  const cloneRef = useRef<THREE.Group>(null)

  // Calcule scale et offset une seule fois, sur la scène source.
  // La géométrie de ce GLB est bakée loin de son origine locale (~-1613 en X,
  // ~172 en Z) : il faut donc recentrer X/Z en plus de poser le modèle au sol,
  // sinon il part à ~343 unités de l'origine une fois mis à l'échelle.
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = targetHeight / size.y
    // X/Z centrés sur l'origine du groupe, min.y posé sur le sol
    const offset: [number, number, number] = [
      -center.x * s,
      -box.min.y * s,
      -center.z * s,
    ]
    return { scale: s, offset }
  }, [scene, targetHeight])

  useEffect(() => {
    const root = cloneRef.current
    if (!root) return
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        // `transparent` change le programme compilé : ne le marquer qu'au
        // moment où il bascule réellement.
        if (!m.transparent) {
          m.transparent = true
          m.needsUpdate = true
        }
        m.opacity = opacity
      }
    })
  }, [opacity])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone ref={cloneRef} object={scene} scale={scale} position={offset} />
    </group>
  )
}

useGLTF.preload('/prehistoric_tree_01.glb')
