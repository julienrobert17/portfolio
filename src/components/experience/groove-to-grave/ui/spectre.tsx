'use client'

import { useEffect, useRef } from 'react'
import { moteur } from '../audio/moteur'
import { onTick } from '../lib/ticker'
import { useLecteur } from '../store/lecteur-store'

const COLONNES = 32
const INTERVALLE = 1000 / 30

/**
 * Le spectre en segments : 32 colonnes de 9 segments en DOM, seules des `transform` changent,
 * à 30 images par seconde au plus, arrêté quand rien ne joue (brief §3.5, §8). Décoratif.
 */
export default function Spectre() {
  const { statut } = useLecteur()
  const hote = useRef<HTMLDivElement>(null)
  const joue = statut === 'lecture'

  useEffect(() => {
    const colonnes = hote.current?.children
    if (!colonnes) return
    const niveaux = new Float32Array(COLONNES)
    if (!joue) {
      for (let i = 0; i < COLONNES; i++) (colonnes[i] as HTMLElement).style.transform = 'scaleY(0)'
      return
    }
    let dernier = 0
    return onTick((temps) => {
      const ms = temps * 1000
      if (ms - dernier < INTERVALLE) return
      dernier = ms
      if (!moteur().spectre(COLONNES, niveaux)) return
      for (let i = 0; i < COLONNES; i++) {
        // Quantifié sur 9 segments : la colonne ne bouge qu'au segment près.
        const v = Math.round(niveaux[i] * 9) / 9
        ;(colonnes[i] as HTMLElement).style.transform = `scaleY(${v})`
      }
    })
  }, [joue])

  return (
    <div ref={hote} className="g2g-spectre" aria-hidden="true">
      {Array.from({ length: COLONNES }, (_, i) => (
        <span key={i} className="g2g-spectre__colonne" />
      ))}
    </div>
  )
}
