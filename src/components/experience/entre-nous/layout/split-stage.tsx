'use client'

import type { ReactNode } from 'react'
import styles from '../entre-nous.module.css'
import Seam from './seam'
import type { Acte, Installation } from '../types'

interface SplitStageProps {
  installation: Installation
  acte: Acte
  coutureEnCours?: boolean
  moitieA: ReactNode
  moitieB: ReactNode
}

/**
 * Les deux moitiés et la ligne. En face à face, la moitié A est pivotée à
 * 180° : elle se lit depuis l'autre côté du téléphone posé à plat.
 */
export default function SplitStage({
  installation,
  acte,
  coutureEnCours = false,
  moitieA,
  moitieB,
}: SplitStageProps) {
  const faceAFace = installation === 'face-a-face'

  return (
    <div
      className={`${styles.stage} ${faceAFace ? styles.faceAFace : styles.coteACote} ${
        coutureEnCours ? styles.coutureEnCours : ''
      }`}
    >
      <div
        className={`${styles.half} ${styles.halfA} ${
          /* À la couture on ne retire pas la classe, on la remplace : une
             rotation vers `none` ne s'anime pas de façon fiable, une rotation
             vers 0deg si. */
          faceAFace ? (coutureEnCours ? styles.deroule : styles.flipped) : ''
        }`}
      >
        {/* Une requête de conteneur ne peut pas styler son propre conteneur :
            la colonne vit donc dans `.corps`, à l'intérieur de `.half`, pour
            que les paliers de densité puissent l'atteindre. */}
        <div className={styles.corps}>{moitieA}</div>
      </div>
      <Seam acte={acte} installation={installation} partie={coutureEnCours} />
      <div className={`${styles.half} ${styles.halfB}`}>
        <div className={styles.corps}>{moitieB}</div>
      </div>
    </div>
  )
}
