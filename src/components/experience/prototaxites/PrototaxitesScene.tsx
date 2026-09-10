'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { Beat } from './constants/narrative'
import Arthropods from './scene/Arthropods'
import CameraRig from './scene/CameraRig'
import DevonianAtmosphere from './scene/DevonianAtmosphere'
import DevonianForest, { getForestPositions } from './scene/DevonianForest'
import DevonianGround from './scene/DevonianGround'
import DevonianWater from './scene/DevonianWater'
import GroundFlora from './scene/GroundFlora'
import InternalStructure from './scene/InternalStructure'
import PrototaxiteGroup from './scene/PrototaxiteGroup'
import Smoke from './scene/Smoke'
import { usePhaseVisibility } from './scene/usePhaseVisibility'

interface PrototaxiteSceneProps {
  currentPhase: Beat['phase']
  progress: number
}

export default function PrototaxitesScene({ currentPhase, progress }: PrototaxiteSceneProps) {
  const vis = usePhaseVisibility({ phase: currentPhase, progress })

  // Les foyers naissent dans la forêt : on reprend des positions d'arbres
  // réellement générées, pas des coordonnées codées en dur.
  const smokeOrigins = useMemo(() => {
    const all = getForestPositions()
    return [0, 6, 12, 18].map((i) => all[i % all.length])
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020a06' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [8, 5, 14], fov: 55, near: 0.1, far: 800 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        shadows="soft"
      >
        <Suspense fallback={null}>
          <DevonianAtmosphere />

          <DevonianGround />
          <DevonianWater />
          <GroundFlora />

          <DevonianForest forestSpread={vis.forestSpread} />

          <PrototaxiteGroup opacity={vis.prototaxites} />
          <InternalStructure opacity={vis.internal} />

          <Arthropods opacity={vis.arthropods} />
          <Smoke opacity={vis.smoke} origins={smokeOrigins} />

          <CameraRig phase={currentPhase} progress={progress} />

          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.5} mipmapBlur />
            <Vignette offset={0.32} darkness={0.42} blendFunction={BlendFunction.NORMAL} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
