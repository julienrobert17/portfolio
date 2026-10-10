'use client'

import { useLecteur } from '../store/lecteur-store'
import { couleurs as tokens } from '../tokens'
import { CassetteSvg } from './cassette'

/**
 * La fenêtre cassette du skin : la cassette chargée, bobines qui tournent à la vitesse du BPM
 * pendant la lecture, fixes sinon et en mouvement réduit (CSS). Vide tant que rien n'est inséré.
 */
export default function FenetreCassette({ className = '' }: { className?: string }) {
  const { piste, statut } = useLecteur()
  return (
    <div className={`g2g-fenetre ${className}`} data-joue={statut === 'lecture' || undefined} style={piste ? { '--bpm': piste.bpm } as React.CSSProperties : undefined}>
      {piste ? (
        <CassetteSvg coque={piste.coque} etiquette={tokens.poster} bande={piste.bande} texteBande={piste.texteBande} reference={piste.catalog} face={piste.position} ligne1={piste.artiste} ligne2={piste.titre} />
      ) : (
        <span className="g2g-fenetre__vide" aria-hidden="true" />
      )}
    </div>
  )
}
