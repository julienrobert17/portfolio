'use client'

import type { CSSProperties } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { label } from '../content/label'
import { bpmCourant, useLecteur } from '../store/lecteur-store'

export const TEXTE_REPOS = 'GROOVE TO GRAVE RECORDS · PARIS · INSÈRE UNE CASSETTE · DU SILLON À LA TOMBE'

/** Texte de la bande : ce qui joue, puis le label. Partagé avec la région annoncée. */
export function texteBande(etat: ReturnType<typeof useLecteur>, prochaine?: string): string {
  const p = etat.piste
  if (!p) return `${TEXTE_REPOS}${prochaine ? ` · ${prochaine}` : ''}`
  const marque = etat.statut === 'lecture' ? '▶' : etat.statut === 'pause' ? 'Ⅱ' : '■'
  const origine = p.origine === 'provisoire' ? ' · EXTRAIT PROVISOIRE' : ''
  return `${marque} ${p.catalog} · ${p.artiste.toUpperCase()} · ${p.position} ${p.titre.toUpperCase()}${origine} · ${p.format.toUpperCase()} · DISPO SUR BANDCAMP · ${label.nom.toUpperCase()} · PARIS${prochaine ? ` · ${prochaine}` : ''}`
}

/**
 * La bande défilante de l'afficheur, en VT323, à une vitesse proportionnelle au BPM ; elle
 * s'arrête quand la lecture s'arrête, se met en pause au survol et au focus. aria-hidden : son
 * contenu est annoncé par la région aria-live du lecteur. Mouvement réduit : statique, tronquée.
 */
export default function BandeDefilante({ prochaine }: { prochaine?: string }) {
  const etat = useLecteur()
  const reduit = useReducedMotion()
  const texte = texteBande(etat, prochaine)
  const joue = etat.statut === 'lecture'
  if (reduit || !joue) {
    return (
      <div className="g2g-bande g2g-bande--statique g2g-lcd-texte" aria-hidden="true" title={texte}>
        {texte}
      </div>
    )
  }
  const duree = (60 / bpmCourant()) * 40
  return (
    <div className="g2g-bande g2g-lcd-texte" aria-hidden="true" style={{ '--duree': `${duree.toFixed(1)}s` } as CSSProperties}>
      <div className="g2g-bande__piste">
        <span>{texte} ··· </span>
        <span>{texte} ··· </span>
      </div>
    </div>
  )
}
