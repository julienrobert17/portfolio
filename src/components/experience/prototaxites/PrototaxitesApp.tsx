'use client'

import { useNarrativeEngine } from './useNarrativeEngine'
import PrototaxitesScene from './PrototaxitesScene'
import NarrativeOverlay from './NarrativeOverlay'

// Orchestrateur client : appelle le hook une seule fois et distribue
// les valeurs à la scène Three.js et à l'overlay UI.
export default function PrototaxitesApp() {
  const engine = useNarrativeEngine()

  return (
    <>
      <PrototaxitesScene
        currentPhase={engine.currentBeat.phase}
        progress={engine.progress}
      />
      <NarrativeOverlay {...engine} />
    </>
  )
}
