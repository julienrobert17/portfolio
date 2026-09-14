'use client'

import { useState } from 'react'
import styles from '../entre-nous.module.css'
import { UI } from '../content'
import type { Cote, Installation } from '../types'

interface CalibrationProps {
  noms: Record<Cote, string>
  onValider: (installation: Installation, noms: Record<Cote, string>) => void
}

/**
 * Premier écran, avant tout le reste. Aucun clavier : les prénoms viennent de
 * content.ts, on ne fait que les attribuer à une moitié.
 */
export default function Calibration({ noms, onValider }: CalibrationProps) {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [attribution, setAttribution] = useState<Record<Cote, string>>(noms)

  const inverser = () => setAttribution({ a: attribution.b, b: attribution.a })

  return (
    <div className={styles.plein}>
      <h1 className={styles.titre}>{UI.calibration.titre}</h1>
      <p className={styles.sous}>{UI.calibration.sous}</p>

      <div className={styles.options} role="radiogroup" aria-label={UI.calibration.titre}>
        <button
          type="button"
          role="radio"
          aria-checked={installation === 'face-a-face'}
          className={`${styles.btn} ${installation === 'face-a-face' ? styles.choixOn : ''}`}
          onClick={() => setInstallation('face-a-face')}
        >
          {UI.calibration.faceAFace}
          <span className={styles.sous} style={{ display: 'block', fontSize: 12 }}>
            {UI.calibration.faceAFaceAide}
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={installation === 'cote-a-cote'}
          className={`${styles.btn} ${installation === 'cote-a-cote' ? styles.choixOn : ''}`}
          onClick={() => setInstallation('cote-a-cote')}
        >
          {UI.calibration.coteACote}
          <span className={styles.sous} style={{ display: 'block', fontSize: 12 }}>
            {UI.calibration.coteACoteAide}
          </span>
        </button>
      </div>

      {installation !== null && (
        <>
          <p className={styles.sous}>
            <strong>{UI.calibration.qui}</strong>
            <br />
            {installation === 'face-a-face'
              ? `${attribution.a} en haut · ${attribution.b} en bas`
              : `${attribution.a} à gauche · ${attribution.b} à droite`}
          </p>
          <div className={styles.options}>
            <button type="button" className={styles.btn} onClick={inverser}>
              {UI.calibration.inverser}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFort}`}
              onClick={() => onValider(installation, attribution)}
            >
              {UI.calibration.commencer}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
