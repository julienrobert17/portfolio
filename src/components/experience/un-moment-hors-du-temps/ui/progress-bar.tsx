'use client'

import { PROGRESS } from '../content'
import styles from '../invitation.module.css'

interface ProgressBarProps {
  step: number
  /** Cinq tapes rapides ici déclenchent l'easter egg sur mobile. */
  onSecretTap: () => void
}

export default function ProgressBar({ step, onSecretTap }: ProgressBarProps) {
  const entry = PROGRESS[Math.min(Math.max(step, 0), PROGRESS.length - 1)]

  return (
    <div className={styles.progressWrap} onPointerDown={onSecretTap}>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={entry.value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du formulaire"
        aria-valuetext={`${entry.value}%${entry.note ? `, ${entry.note}` : ''}`}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${Math.min(entry.value, 100)}%` }}
        />
      </div>
      <div className={styles.progressMeta}>
        <span className={styles.progressNote}>{entry.note ?? ' '}</span>
        <span className={styles.progressValue}>{entry.value}%</span>
      </div>
    </div>
  )
}
