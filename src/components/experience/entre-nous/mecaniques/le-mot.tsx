'use client'

import styles from '../entre-nous.module.css'

const MAX = 3

interface LeMotProps {
  mots: readonly string[]
  choisis: readonly string[]
  onChange: (mots: string[]) => void
}

/** Trois mots à choisir dans une grille de douze. */
export default function LeMot({ mots, choisis, onChange }: LeMotProps) {
  const basculer = (mot: string) => {
    if (choisis.includes(mot)) {
      onChange(choisis.filter((m) => m !== mot))
      return
    }
    if (choisis.length >= MAX) return
    onChange([...choisis, mot])
  }

  return (
    <>
      <div className={styles.grille} role="group" aria-label={`Choisis ${MAX} mots`}>
        {mots.map((mot) => {
          const actif = choisis.includes(mot)
          return (
            <button
              key={mot}
              type="button"
              role="checkbox"
              aria-checked={actif}
              disabled={!actif && choisis.length >= MAX}
              className={`${styles.mot} ${actif ? styles.motOn : ''}`}
              onClick={() => basculer(mot)}
            >
              {mot}
            </button>
          )
        })}
      </div>
      <p className={styles.compteur} aria-live="polite">
        {choisis.length} / {MAX}
      </p>
    </>
  )
}
