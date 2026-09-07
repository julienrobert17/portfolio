'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import type { Beat } from '@/components/experience/prototaxites/constants/narrative'
import Arthropods from '@/components/experience/prototaxites/scene/Arthropods'
import CameraRig from '@/components/experience/prototaxites/scene/CameraRig'
import DevonianAtmosphere from '@/components/experience/prototaxites/scene/DevonianAtmosphere'
import DevonianForest from '@/components/experience/prototaxites/scene/DevonianForest'
import DevonianGround from '@/components/experience/prototaxites/scene/DevonianGround'
import DevonianWater from '@/components/experience/prototaxites/scene/DevonianWater'
import InternalStructure from '@/components/experience/prototaxites/scene/InternalStructure'
import PrototaxiteGroup from '@/components/experience/prototaxites/scene/PrototaxiteGroup'
import Smoke from '@/components/experience/prototaxites/scene/Smoke'
import { usePhaseVisibility } from '@/components/experience/prototaxites/scene/usePhaseVisibility'

type Phase = Beat['phase']

const PHASES: Phase[] = [
  'context',
  'presence',
  'interior',
  'ecosystem',
  'eclipse',
  'zoomout',
  'resonance',
]

interface LabSceneProps {
  phase?: Phase
  progress?: number
}

export default function LabScene({ phase = 'presence', progress = 0 }: LabSceneProps) {
  // Les props servent de valeurs initiales ; l'overlay de dev pilote ensuite.
  const [activePhase, setActivePhase] = useState<Phase>(phase)
  const [activeProgress, setActiveProgress] = useState(progress)

  const vis = usePhaseVisibility({ phase: activePhase, progress: activeProgress })

  return (
    <>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [10, 6, 14], fov: 55, near: 0.1, far: 800 }}
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

          <CameraRig phase={activePhase} progress={activeProgress} />
          <Stats />
        </Suspense>
      </Canvas>

      {/* Outil de dev — ne partira pas en production */}
      <div
        style={{
          position: 'fixed',
          left: 12,
          bottom: 12,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(10, 10, 10, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          font: '12px ui-monospace, SFMono-Regular, Menlo, monospace',
          color: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 420 }}>
          {PHASES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePhase(p)}
              style={{
                padding: '4px 9px',
                borderRadius: 5,
                cursor: 'pointer',
                font: 'inherit',
                color: p === activePhase ? '#0a0a0a' : 'rgba(255,255,255,0.88)',
                background: p === activePhase ? '#e8d5a0' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.7 }}>progress</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={activeProgress}
            onChange={(e) => setActiveProgress(e.target.valueAsNumber)}
            style={{ width: 180 }}
          />
          <span style={{ width: 34, textAlign: 'right' }}>{activeProgress.toFixed(2)}</span>
        </label>

        <div style={{ display: 'flex', gap: 12, opacity: 0.75 }}>
          <span>forest {vis.forest.toFixed(2)}</span>
          <span>proto {vis.prototaxites.toFixed(2)}</span>
          <span>arthro {vis.arthropods.toFixed(2)}</span>
          <span>smoke {vis.smoke.toFixed(2)}</span>
          <span>intern {vis.internal.toFixed(2)}</span>
        </div>
      </div>
    </>
  )
}
