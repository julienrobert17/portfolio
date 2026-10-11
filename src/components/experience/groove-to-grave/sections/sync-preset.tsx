'use client'

import { useEffect } from 'react'
import type { Preset } from '../content/types'
import { definirPreset } from '../store/lecteur-store'

/** Pousse le preset lu par la page serveur (search param) dans le store du lecteur. Ne rend rien. */
export default function SyncPreset({ preset }: { preset: Preset }) {
  useEffect(() => {
    definirPreset(preset)
  }, [preset])
  return null
}
