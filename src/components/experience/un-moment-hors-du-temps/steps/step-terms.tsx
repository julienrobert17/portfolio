'use client'

import { useEffect, useRef, useState } from 'react'
import PaperButton from '../ui/paper-button'
import styles from '../invitation.module.css'
import { COPY } from '../content'
import type { StepProps } from './step-props'

/** Le curseur de pression redescend, quoi qu'elle fasse. */
const DECAY_STEP = 2
const DECAY_MS = 40
/** Plancher de la probabilité : le slider ne descend pas plus bas. */
const PROBABILITY_FLOOR = 98
/** Durée de scroll avant que la case se coche d'elle-même. */
const TERMS_MS = 3000

export default function StepTerms({ machine }: StepProps) {
  const copy = COPY.step6
  const { answers, setAnswers } = machine

  const [pressure, setPressure] = useState(answers.pressure)
  const [probability, setProbability] = useState(answers.probability)
  const [refused, setRefused] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [autoChecked, setAutoChecked] = useState(false)
  /** La descente ne commence qu'une fois l'écran en place et visible. */
  const [armed, setArmed] = useState(false)
  const termsTimerRef = useRef<number | null>(null)

  // On attend la fin de l'animation d'entrée : sinon la descente se joue
  // pendant que l'écran arrive encore et personne ne la voit.
  useEffect(() => {
    const timer = window.setTimeout(() => setArmed(true), 720)
    return () => window.clearTimeout(timer)
  }, [])

  // Décroissance douce vers 0 : « aucune pression, promis ».
  useEffect(() => {
    if (!armed || pressure <= 0) return
    const timer = window.setTimeout(
      () => setPressure((current) => Math.max(0, current - DECAY_STEP)),
      DECAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [armed, pressure])

  useEffect(() => {
    if (!shaking) return
    const timer = window.setTimeout(() => setShaking(false), 400)
    return () => window.clearTimeout(timer)
  }, [shaking])

  useEffect(() => {
    return () => {
      if (termsTimerRef.current !== null) window.clearTimeout(termsTimerRef.current)
    }
  }, [])

  const onProbability = (raw: number) => {
    setRefused(raw < PROBABILITY_FLOOR)
    if (raw < PROBABILITY_FLOOR) {
      setShaking(true)
      setProbability(PROBABILITY_FLOOR)
      return
    }
    setProbability(raw)
  }

  /** Elle scrolle les CGU : au bout de 3 secondes, on coche pour elle. */
  const onTermsScroll = () => {
    if (answers.terms || termsTimerRef.current !== null) return
    termsTimerRef.current = window.setTimeout(() => {
      setAnswers({ terms: true })
      setAutoChecked(true)
      termsTimerRef.current = null
    }, TERMS_MS)
  }

  const goNext = () => {
    setAnswers({ pressure, probability })
    machine.next()
  }

  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>

      <div className={styles.gauge}>
        <div className={styles.gaugeHead}>
          <label className={styles.label} htmlFor="hdt-pressure">
            {copy.pressureLabel}
          </label>
          <span className={styles.gaugeValue}>{pressure}%</span>
        </div>
        <input
          id="hdt-pressure"
          type="range"
          className={styles.slider}
          min={0}
          max={100}
          value={pressure}
          aria-valuetext={`${pressure}%, ${copy.pressureReaction}`}
          onChange={(event) => setPressure(Number(event.target.value))}
        />
        <p className={styles.aside}>{copy.pressureReaction}</p>
      </div>

      <div className={`${styles.gauge} ${shaking ? styles.shake : ''}`}>
        <div className={styles.gaugeHead}>
          <label className={styles.label} htmlFor="hdt-probability">
            {copy.probabilityLabel}
          </label>
          <span className={styles.gaugeValue}>{probability}%</span>
        </div>
        <input
          id="hdt-probability"
          type="range"
          className={styles.slider}
          min={90}
          max={100}
          value={probability}
          aria-valuetext={`${probability}%`}
          onChange={(event) => onProbability(Number(event.target.value))}
        />
        <div aria-live="polite">
          {refused && <p className={styles.note}>{copy.probabilityRefusal}</p>}
        </div>
      </div>

      <div
        className={styles.terms}
        tabIndex={0}
        role="region"
        aria-label={copy.termsTitle}
        onScroll={onTermsScroll}
      >
        <p className={styles.termsTitle}>{copy.termsTitle}</p>
        <ol className={styles.clauses}>
          {copy.clauses.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={answers.terms}
        className={styles.checkButton}
        onClick={() => setAnswers({ terms: !answers.terms })}
      >
        <span className={styles.checkRow}>
          <span
            className={`${styles.checkBox} ${answers.terms ? styles.checkBoxOn : ''}`}
            aria-hidden="true"
          >
            {answers.terms ? '✓' : ''}
          </span>
          <span className={styles.checkLabel}>
            {copy.termsCheckbox}
            {autoChecked && (
              <>
                {' '}
                <em style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{copy.termsAuto}</em>
              </>
            )}
          </span>
        </span>
      </button>

      <div className={styles.footer}>
        <PaperButton disabled={!answers.terms} onClick={goNext}>
          {copy.cta}
        </PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
