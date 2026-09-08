'use client'

import { useEffect, useRef, useState } from 'react'
import PaperButton from '../ui/paper-button'
import Vessel from '../ui/vessel'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import type { StepProps } from './step-props'

/** Vitesse de ré-écriture du prénom, par lettre. */
const RETYPE_MS = 55
/** Délai avant que la case « je ne suis pas un robot » se coche seule. */
const ROBOT_MS = 2000
/** Après deux échecs, on abandonne le gag et tout le monde passe. */
const MAX_ATTEMPTS = 2

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function StepIdentity({ machine }: StepProps) {
  const { answers, setAnswers } = machine
  const copy = COPY.step1

  const [name, setName] = useState<string>(PERSO.elle)
  const [corrected, setCorrected] = useState(false)
  const retypeRef = useRef<number | null>(null)
  const busyRef = useRef(false)

  // Le CAPTCHA : deux échecs programmés, puis la version pour de vrai.
  const [attempt, setAttempt] = useState(0)
  const [vessels, setVessels] = useState<string[]>(() => [...COPY.captchaVessels])
  const [taunt, setTaunt] = useState('')
  const [solved, setSolved] = useState(false)
  const givenUp = attempt >= MAX_ATTEMPTS

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

  const toggle = (index: number) => {
    setAnswers({
      captcha: answers.captcha.includes(index)
        ? answers.captcha.filter((i) => i !== index)
        : [...answers.captcha, index],
    })
  }

  /**
   * Les deux premiers essais échouent quoi qu'elle coche — rien ne distingue
   * vraiment un seau d'un vase, c'est le principe. Le troisième passe toujours.
   */
  const verify = () => {
    if (givenUp || solved) {
      setSolved(true)
      machine.next()
      return
    }
    setTaunt(copy.captchaTaunts[attempt] ?? copy.captchaTaunts[0])
    setAnswers({ captcha: [] })
    setVessels(shuffled(COPY.captchaVessels))
    setAttempt(attempt + 1)
  }

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
          {givenUp ? copy.captchaSimplePrompt : copy.captchaPrompt}
        </p>

        {givenUp ? (
          <div className={styles.captchaSimple}>
            <button
              type="button"
              className={`${styles.bigVessel} ${solved ? styles.bigVesselOn : ''}`}
              aria-label="Le seau"
              aria-pressed={solved}
              onClick={() => setSolved(true)}
            >
              <Vessel kind="seau" size={104} />
            </button>
            <p className={styles.aside}>{copy.captchaSimpleNote}</p>
          </div>
        ) : (
          <div className={styles.captcha} role="group" aria-labelledby="hdt-captcha">
            {vessels.map((kind, index) => {
              const isSelected = answers.captcha.includes(index)
              return (
                <button
                  /* La clé inclut l'essai : la grille est bien remontée à chaque échec. */
                  key={`${attempt}-${index}`}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  /* Libellé neutre : un lecteur d'écran ne doit pas vendre la mèche. */
                  aria-label={`Contenant ${index + 1}`}
                  className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
                  onClick={() => toggle(index)}
                >
                  {isSelected && (
                    <span className={styles.tileTick} aria-hidden="true">
                      ✓
                    </span>
                  )}
                  <Vessel kind={kind} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div aria-live="polite">
        {taunt && !givenUp && <p className={styles.error}>{taunt}</p>}
        {solved && <p className={styles.ok}>{copy.captchaSuccess}</p>}
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
        <PaperButton onClick={verify}>{copy.cta}</PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
