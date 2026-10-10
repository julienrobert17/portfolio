'use client'

import type { ReactNode } from 'react'
import { basculer, useLecteur, type PisteJouable } from '../store/lecteur-store'
import IconePlay from './icone-play'

interface TuileProps {
  sortieRef: string
  children: ReactNode
}

/** Enveloppe d'une cassette du mur : porte `data-joue` quand sa sortie est en lecture (bobines). */
export function TuileJouable({ sortieRef, children }: TuileProps) {
  const { piste, statut } = useLecteur()
  const joue = statut === 'lecture' && piste?.sortieRef === sortieRef
  return (
    <div className="g2g-tuile" data-joue={joue || undefined} style={piste && joue ? { '--bpm': piste.bpm } as React.CSSProperties : undefined}>
      {children}
    </div>
  )
}

/**
 * Le bouton rond « écouter » posé sur une cassette : seconde cible, distincte du lien, rendu
 * seulement si JavaScript est actif (composant client caché sans JS par le CSS) et si la sortie
 * a un extrait. Le premier clic crée le moteur et lance la lecture dans le même geste.
 */
export default function BoutonEcouter({ piste }: { piste: PisteJouable }) {
  const etat = useLecteur()
  const courante = etat.piste?.id === piste.id
  const joue = courante && etat.statut === 'lecture'
  return (
    <button type="button" className="g2g-ecouter g2g-js" data-g2g="ecouter" aria-pressed={joue} aria-label={`${joue ? 'Pause' : 'Écouter'} ${piste.catalog}, ${piste.artiste}, ${piste.titre}`} onClick={() => basculer(piste)}>
      <IconePlay pause={joue} />
    </button>
  )
}
