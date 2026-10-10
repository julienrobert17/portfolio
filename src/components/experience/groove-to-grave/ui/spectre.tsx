'use client'

import { useEffect, useRef } from 'react'
import { moteur } from '../audio/moteur'
import { onTick } from '../lib/ticker'
import { useLecteur } from '../store/lecteur-store'

const COLONNES = 32
const INTERVALLE = 1000 / 30
const SEGMENTS = 6
/** Descente lissée : une colonne met environ 300 ms à retomber de pleine échelle à zéro. */
const DESCENTE_PAR_MS = 1 / 300

/**
 * Le spectre en segments : 32 bandes logarithmiques de 40 Hz à 16 kHz, 6 segments dans 30 px,
 * en DOM, seules des `transform` changent, à 30 images par seconde au plus, montée franche et
 * descente lissée d'environ 300 ms, arrêté quand rien ne joue (brief §3.5, §8). Les 32 colonnes
 * restent visibles en segments lcdOff, éteintes comprises. Décoratif.
 */
export default function Spectre() {
  const { statut } = useLecteur()
  const hote = useRef<HTMLDivElement>(null)
  const joue = statut === 'lecture'

  useEffect(() => {
    const hoteEl = hote.current
    if (!hoteEl) return
    // Chaque colonne garde ses segments éteints en lcdOff ; seul le niveau, enfant, change d'échelle.
    const colonnes = Array.from(hoteEl.children, (c) => c.firstElementChild as HTMLElement)
    const niveaux = new Float32Array(COLONNES)
    if (!joue) {
      for (let i = 0; i < COLONNES; i++) colonnes[i].style.transform = 'scaleY(0)'
      return
    }
    const affiches = new Float32Array(COLONNES)
    let dernier = 0
    return onTick((temps) => {
      const ms = temps * 1000
      if (ms - dernier < INTERVALLE) return
      const dt = dernier ? ms - dernier : INTERVALLE
      dernier = ms
      if (!moteur().spectre(COLONNES, niveaux)) return
      for (let i = 0; i < COLONNES; i++) {
        affiches[i] = Math.max(niveaux[i], affiches[i] - dt * DESCENTE_PAR_MS)
        // Quantifié au segment près.
        const v = Math.round(affiches[i] * SEGMENTS) / SEGMENTS
        colonnes[i].style.transform = `scaleY(${v})`
      }
    })
  }, [joue])

  return (
    <div ref={hote} className="g2g-spectre" aria-hidden="true">
      {Array.from({ length: COLONNES }, (_, i) => (
        <span key={i} className="g2g-spectre__colonne">
          <span className="g2g-spectre__niveau" />
        </span>
      ))}
    </div>
  )
}
