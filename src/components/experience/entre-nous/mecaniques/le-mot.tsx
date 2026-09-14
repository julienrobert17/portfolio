'use client'

import styles from '../entre-nous.module.css'

/** Le nombre de mots demandé quand la grille est complète. */
const MAX = 3

/**
 * Combien de mots il faut choisir dans une grille de `n`.
 *
 * Le seuil s'abaisse au nombre de mots disponibles plutôt que de rester à
 * trois : une grille écrite à la main peut en compter moins, et exiger trois
 * mots parmi deux rendait la question définitivement invalidable — le bouton
 * restait grisé pour toujours et seul « passer » répondait.
 *
 * Exporté pour que `estComplet` applique exactement la même règle : deux
 * définitions du même seuil finiraient par diverger.
 */
export function motsRequis(disponibles: number): number {
  return Math.min(MAX, Math.max(0, disponibles))
}

interface LeMotProps {
  mots: readonly string[]
  choisis: readonly string[]
  onChange: (mots: string[]) => void
}

/** Trois mots à choisir dans une grille de douze. */
export default function LeMot({ mots, choisis, onChange }: LeMotProps) {
  const requis = motsRequis(mots.length)

  const basculer = (mot: string) => {
    if (choisis.includes(mot)) {
      onChange(choisis.filter((m) => m !== mot))
      return
    }
    if (choisis.length >= requis) return
    onChange([...choisis, mot])
  }

  return (
    <>
      <div className={styles.grille} role="group" aria-label={`Choisis ${requis} mots`}>
        {mots.map((mot) => {
          const actif = choisis.includes(mot)
          return (
            <button
              key={mot}
              type="button"
              role="checkbox"
              aria-checked={actif}
              disabled={!actif && choisis.length >= requis}
              className={`${styles.mot} ${actif ? styles.motOn : ''}`}
              onClick={() => basculer(mot)}
            >
              {mot}
            </button>
          )
        })}
      </div>
      <p className={styles.compteur} aria-live="polite">
        {choisis.length} / {requis}
      </p>
    </>
  )
}
