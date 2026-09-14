'use client'

import styles from '../entre-nous.module.css'
import type { Acte, Installation } from '../types'

/**
 * La ligne de séparation. Ce n'est pas une bordure : c'est le fil visuel de
 * l'expérience. Elle est franche au premier acte, s'amincit à chaque acte
 * franchi, et disparaît à la couture finale.
 */
const EPAISSEUR: Record<Acte, number> = { 1: 6, 2: 3, 3: 1.5 }

interface SeamProps {
  acte: Acte
  installation: Installation
  /** Vrai à la couture : la ligne s'efface pour de bon. */
  partie?: boolean
}

export default function Seam({ acte, installation, partie = false }: SeamProps) {
  const horizontale = installation === 'face-a-face'
  const epaisseur = partie ? 0 : EPAISSEUR[acte]

  return (
    <div
      aria-hidden="true"
      className={`${styles.seam} ${horizontale ? styles.seamH : styles.seamV} ${
        partie ? styles.seamGone : ''
      }`}
      style={{ flexBasis: `${epaisseur}px` }}
    />
  )
}
