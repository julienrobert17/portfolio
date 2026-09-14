'use client'

import styles from '../entre-nous.module.css'

interface CurseurProps {
  /** Les deux formulations opposées. Jamais de chiffres affichés. */
  poles: readonly string[]
  valeur: number
  onChange: (valeur: number) => void
}

/**
 * Traduit une position en mots. La valeur chiffrée ne regarde personne : ni
 * l'écran, ni le lecteur d'écran, ni la révélation. Partagé avec le tir à la
 * corde et la révélation, pour que les seuils ne divergent jamais.
 */
export function formulerPosition(poles: readonly string[], valeur: number): string {
  const [gauche, droite] = poles
  if (valeur < 20) return gauche ?? ''
  if (valeur < 45) return `plutôt ${gauche ?? ''}`
  if (valeur < 56) return 'entre les deux'
  if (valeur < 81) return `plutôt ${droite ?? ''}`
  return droite ?? ''
}

/** Un axe continu entre deux formulations opposées. */
export default function Curseur({ poles, valeur, onChange }: CurseurProps) {
  const [gauche, droite] = poles

  return (
    <div className={styles.curseurWrap}>
      <div className={styles.poles}>
        <span className={styles.pole}>{gauche}</span>
        <span className={`${styles.pole} ${styles.poleD}`}>{droite}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        step={1}
        value={valeur}
        aria-label={`${gauche} — ${droite}`}
        aria-valuetext={formulerPosition(poles, valeur)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
