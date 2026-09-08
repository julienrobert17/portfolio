'use client'

import { useEffect, useRef, useState } from 'react'
import PaperButton from '../ui/paper-button'
import CatPhoto from '../ui/cat-photo'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import type { StepProps } from './step-props'

/** Vitesse de ré-écriture du prénom, par lettre. */
const RETYPE_MS = 55
/** Délai avant que la case « je ne suis pas un robot » se coche seule. */
const ROBOT_MS = 2000

export default function StepIdentity({ machine }: StepProps) {
  const { answers, setAnswers } = machine
  const copy = COPY.step1

  const [name, setName] = useState<string>(PERSO.elle)
  const [corrected, setCorrected] = useState(false)
  const [error, setError] = useState(false)
  const retypeRef = useRef<number | null>(null)
  const busyRef = useRef(false)

  // La case se coche toute seule : on a fait confiance.
  useEffect(() => {
    if (answers.robot) return
    const timer = window.setTimeout(() => setAnswers({ robot: true }), ROBOT_MS)
    return () => window.clearTimeout(timer)
  }, [answers.robot, setAnswers])

  useEffect(() => {
    return () => {
      if (retypeRef.current !== null) window.clearInterval(retypeRef.current)
    }
  }, [])

  /** Elle a touché au champ : on efface et on retape son prénom, lettre par lettre. */
  const startRetype = () => {
    if (busyRef.current) return
    busyRef.current = true
    setCorrected(true)
    setName('')
    let index = 0
    retypeRef.current = window.setInterval(() => {
      index += 1
      setName(PERSO.elle.slice(0, index))
      if (index >= PERSO.elle.length && retypeRef.current !== null) {
        window.clearInterval(retypeRef.current)
        retypeRef.current = null
        busyRef.current = false
      }
    }, RETYPE_MS)
  }

  const toggleTile = (index: number) => {
    setError(false)
    const selected = answers.captcha.includes(index)
      ? answers.captcha.filter((i) => i !== index)
      : [...answers.captcha, index]
    setAnswers({ captcha: selected })
  }

  const submit = () => {
    if (answers.captcha.length === 0) {
      setError(true)
      return
    }
    machine.next()
  }

  const solved = answers.captcha.length > 0

  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="hdt-name">
          {copy.nameLabel}
        </label>
        <input
          id="hdt-name"
          className={styles.input}
          value={name}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={corrected ? 'hdt-name-note' : undefined}
          onChange={startRetype}
        />
        {corrected && (
          <p className={styles.note} id="hdt-name-note">
            {copy.nameCorrection}
          </p>
        )}
      </div>

      <div className={styles.captchaBox}>
        <p className={styles.captchaHead} id="hdt-captcha">
          {copy.captchaPrompt}
        </p>
        <div className={styles.captcha} role="group" aria-labelledby="hdt-captcha">
          {COPY.captchaTiles.map((tile, index) => {
            const isSelected = answers.captcha.includes(index)
            return (
              <button
                key={tile.label}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${tile.label} — ${tile.caption}`}
                className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
                onClick={() => toggleTile(index)}
              >
                {isSelected && (
                  <span className={styles.tileTick} aria-hidden="true">
                    ✓
                  </span>
                )}
                {tile.art === 'photo' ? (
                  <span className={styles.tilePhoto}>
                    <CatPhoto alt={`${PERSO.chat.nom}, le chat de ${PERSO.elle}`} sizes="56px" />
                  </span>
                ) : (
                  <span className={styles.tileArt} aria-hidden="true">
                    {tile.art}
                  </span>
                )}
                <span className={styles.tileLabel}>{tile.label}</span>
                <span className={styles.tileCaption} aria-hidden="true">
                  {tile.caption}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div aria-live="polite">
        {error && <p className={styles.error}>{copy.captchaError}</p>}
        {!error && solved && <p className={styles.ok}>{copy.captchaSuccess}</p>}
      </div>

      <div className={styles.checkRow}>
        <span
          className={`${styles.checkBox} ${answers.robot ? styles.checkBoxOn : ''}`}
          aria-hidden="true"
        >
          {answers.robot ? '✓' : ''}
        </span>
        <span className={styles.checkLabel}>
          {copy.robotLabel}
          {answers.robot && (
            <>
              {' '}
              <em style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{copy.robotAuto}</em>
            </>
          )}
        </span>
      </div>

      <div className={styles.footer}>
        <PaperButton onClick={submit}>{copy.cta}</PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
