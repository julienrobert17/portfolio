'use client'

import { useCallback, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import styles from '../entre-nous.module.css'
import { UI } from '../content'
import { formulerPosition } from './curseur'
import { versConteneur } from './espace-conteneur'

/** Un pas de clavier, en points de pourcentage. */
const PAS_CLAVIER = 3

interface TirALaCordeProps {
  /** Les deux formulations opposées. */
  poles: readonly string[]
  /** La position courante, 0 à 100. Elle est PARTAGÉE par les deux moitiés. */
  valeur: number
  /**
   * Applique un déplacement relatif, en points de pourcentage.
   *
   * L'API est volontairement en delta et non en valeur absolue : c'est la
   * seule mécanique où deux mains agissent sur le même objet en même temps.
   * Un « va à 62 » calculé depuis la position lue au début du geste écraserait
   * ce que l'autre est en train de faire ; un « pousse de +3 » s'additionne.
   * Deux doigts qui tirent à force égale en sens opposé s'annulent, ce qui est
   * exactement ce qu'on veut d'un tir à la corde.
   */
  onDelta: (delta: number) => void
  /** Vrai si cette moitié est pivotée à 180°. */
  flipped: boolean
}

/**
 * Une corde, deux mains. Un seul curseur, tiré des deux côtés à la fois.
 *
 * Aucune garde `isPrimary` ici, et c'est délibéré : sur un téléphone unique
 * posé entre deux personnes, le second doigt posé sur l'écran n'est jamais le
 * pointeur primaire. Une telle garde annulerait purement et simplement le
 * geste de la deuxième personne — soit précisément la mécanique. Chaque
 * pointeur est donc suivi individuellement dans `pointeurs`.
 */
export default function TirALaCorde({ poles, valeur, onDelta, flipped }: TirALaCordeProps) {
  const pisteRef = useRef<HTMLDivElement>(null)
  /** Dernière position connue de chaque doigt encore posé, en espace écran. */
  const pointeurs = useRef<Map<number, { x: number; y: number }>>(new Map())

  const surSaisie = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointeur déjà relâché : on suit le geste sans capture.
    }
    pointeurs.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.preventDefault()
  }, [])

  const surDeplacement = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const precedent = pointeurs.current.get(event.pointerId)
      if (precedent === undefined) return
      const piste = pisteRef.current
      // `offsetWidth` est une valeur de mise en page : contrairement à
      // `getBoundingClientRect()`, elle ignore le `rotate(180deg)` du parent.
      if (piste === null || piste.offsetWidth === 0) return

      const { dx } = versConteneur(
        event.clientX - precedent.x,
        event.clientY - precedent.y,
        flipped,
      )
      pointeurs.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (dx === 0) return
      onDelta((dx / piste.offsetWidth) * 100)
    },
    [flipped, onDelta],
  )

  const surRelache = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointeurs.current.delete(event.pointerId)
  }, [])

  const surTouche = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Au clavier on n'est pas assis en face : aucune inversion à appliquer.
      const pas =
        event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -PAS_CLAVIER
          : event.key === 'ArrowRight' || event.key === 'ArrowUp'
            ? PAS_CLAVIER
            : event.key === 'Home'
              ? -100
              : event.key === 'End'
                ? 100
                : 0
      if (pas === 0) return
      event.preventDefault()
      onDelta(pas)
    },
    [onDelta],
  )

  const [gauche, droite] = poles

  return (
    <div className={styles.curseurWrap}>
      <div className={styles.poles}>
        <span className={styles.pole}>{gauche}</span>
        <span className={`${styles.pole} ${styles.poleD}`}>{droite}</span>
      </div>
      <div
        ref={pisteRef}
        className={styles.corde}
        role="slider"
        tabIndex={0}
        aria-label={`${gauche} — ${droite}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(valeur)}
        aria-valuetext={formulerPosition(poles, valeur)}
        onPointerDown={surSaisie}
        onPointerMove={surDeplacement}
        onPointerUp={surRelache}
        onPointerCancel={surRelache}
        onLostPointerCapture={surRelache}
        onKeyDown={surTouche}
      >
        <span className={styles.cordeFil} aria-hidden="true" />
        <span className={styles.cordeNoeud} style={{ left: `${valeur}%` }} aria-hidden="true" />
      </div>
      <p className={styles.consigne}>{UI.jeu.tirer}</p>
    </div>
  )
}
