'use client'

import { Canvas } from '@react-three/fiber'
import Scene from './scene'

/**
 * Le seul <Canvas> de l'expérience. frameloop="never" : c'est le ticker GSAP
 * qui appelle advance(). Fond transparent, le papier de la page fait le fond.
 * Chargé en import dynamique par CanvasHost, jamais dans le chemin critique.
 */
export default function SceneCanvas() {
  const tactile = window.matchMedia('(pointer: coarse)').matches
  return (
    <Canvas
      orthographic
      frameloop="never"
      flat
      dpr={[1, tactile ? 1.5 : 2]}
      gl={{ alpha: true, antialias: true, stencil: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
        gl.setClearColor(0x000000, 0)
      }}
      style={{ pointerEvents: 'none' }}
    >
      <Scene mode="hero" />
    </Canvas>
  )
}
