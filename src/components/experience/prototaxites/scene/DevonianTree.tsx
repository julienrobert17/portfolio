'use client'

import { useGLTF, Clone } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface DevonianTreeProps {
  position?: [number, number, number]
  targetHeight?: number // hauteur voulue en unités de scène, à pousse complète
  rotationY?: number
  /** Avancement de la pousse, 0 → 1. Appliqué en scale, pas en opacité. */
  growth: number
}

// En dessous de ce seuil l'arbre n'est pas encore sorti de terre : on ne rend
// rien du tout, plutôt qu'un modèle microscopique qui coûterait ses draw calls.
const MIN_VISIBLE_GROWTH = 0.01

export default function DevonianTree({
  position = [0, 0, 0],
  targetHeight = 8,
  rotationY = 0,
  growth,
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

  const visible = growth >= MIN_VISIBLE_GROWTH

  useEffect(() => {
    const root = cloneRef.current
    if (!root) return
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true
    })
  }, [scene, visible])

  if (!visible) return null

  // `growth` se compose avec le scale validé : le recentrage X/Z et la pose au
  // sol sont exprimés dans la même unité, ils suivent donc le même facteur.
  // Nouveau tableau plutôt qu'une mutation de `offset` (react-hooks/immutability).
  const grownScale = scale * growth
  const grownOffset: [number, number, number] = [
    offset[0] * growth,
    offset[1] * growth,
    offset[2] * growth,
  ]

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone ref={cloneRef} object={scene} scale={grownScale} position={grownOffset} />
    </group>
  )
}

useGLTF.preload('/prehistoric_tree_01.glb')
