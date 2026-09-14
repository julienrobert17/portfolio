'use client'

import styles from '../entre-nous.module.css'

interface BasculeProps {
  options: readonly string[]
  valeur: string | null
  onChange: (valeur: string) => void
  /** Désactivé une fois la réponse validée. */
  fige?: boolean
}

/** Deux options, on choisit d'un geste. */
export default function Bascule({ options, valeur, onChange, fige = false }: BasculeProps) {
  return (
    <div className={styles.choix} role="radiogroup">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={valeur === option}
          disabled={fige}
          className={`${styles.btn} ${valeur === option ? styles.choixOn : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
