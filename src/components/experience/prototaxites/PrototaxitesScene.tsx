'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Beat } from './constants/narrative'
import Arthropods from './scene/Arthropods'
import CameraRig from './scene/CameraRig'
import DevonianAtmosphere from './scene/DevonianAtmosphere'
import DevonianForest from './scene/DevonianForest'
import DevonianGround from './scene/DevonianGround'
import DevonianWater from './scene/DevonianWater'
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020a06' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [8, 5, 14], fov: 55, near: 0.1, far: 800 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <DevonianAtmosphere />

          <DevonianGround />
          <DevonianWater />

          <DevonianForest count={24} opacity={vis.forest} />

          <PrototaxiteGroup opacity={vis.prototaxites} />
          <InternalStructure opacity={vis.internal} />

          <Arthropods opacity={vis.arthropods} />
          <Smoke opacity={vis.smoke} />

          <CameraRig phase={currentPhase} progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  )
}
