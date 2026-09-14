'use client'

import styles from '../entre-nous.module.css'
import type { Echelle } from '../types'

/** « 1 jour » et non « 1 jours ». Certaines unités sont invariables. */
export function uniteDe(echelle: Echelle, valeur: number): string {
  return Math.abs(valeur) <= 1 ? (echelle.uniteSing ?? echelle.unite) : echelle.unite
}

interface EnchereProps {
  echelle: Echelle
  valeur: number
  onChange: (valeur: number) => void
}

/** Un nombre qu'on monte ou qu'on descend. Pas de clavier. */
export default function Enchere({ echelle, valeur, onChange }: EnchereProps) {
  const borner = (v: number) => Math.min(echelle.max, Math.max(echelle.min, v))

  return (
    <div className={styles.enchere}>
      <button
        type="button"
        className={styles.enchereBtn}
        aria-label={`Moins ${echelle.pas}`}
        disabled={valeur <= echelle.min}
        onClick={() => onChange(borner(valeur - echelle.pas))}
      >
        −
      </button>
      <span className={styles.enchereVal} aria-live="polite">
        <span className={styles.enchereNombre}>{valeur}</span>
        <span className={styles.enchereUnite}>{uniteDe(echelle, valeur)}</span>
      </span>
      <button
        type="button"
        className={styles.enchereBtn}
        aria-label={`Plus ${echelle.pas}`}
        disabled={valeur >= echelle.max}
        onClick={() => onChange(borner(valeur + echelle.pas))}
      >
        +
      </button>
    </div>
  )
}
