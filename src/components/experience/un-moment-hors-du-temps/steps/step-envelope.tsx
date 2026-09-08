'use client'

import { useState } from 'react'
import PaperButton from '../ui/paper-button'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import { useCelebration } from '../celebration-context'
import type { StepProps } from './step-props'

export default function StepEnvelope({ machine }: StepProps) {
  const [opened, setOpened] = useState(false)
  const [cookiesAnswered, setCookiesAnswered] = useState(false)
  const { celebrate } = useCelebration()
  const copy = COPY.step0

  const open = () => {
    if (opened) return
    setOpened(true)
    celebrate()
  }

  const acceptCookies = () => {
    if (cookiesAnswered) return
    setCookiesAnswered(true)
  }

  return (
    <>
      <div className={styles.center}>
        <div className={styles.envelopeWrap}>
          <button
            type="button"
            className={`${styles.envelope} ${opened ? styles.isOpen : ''}`}
            aria-expanded={opened}
            aria-label={opened ? 'Enveloppe ouverte' : 'Ouvrir l’enveloppe'}
            onClick={open}
          >
            <span className={styles.envBack} aria-hidden="true" />
            <span className={styles.envLetter} aria-hidden="true">
              {copy.letter}
            </span>
            <span className={styles.envFront} aria-hidden="true" />
            <span className={styles.envFlap} aria-hidden="true" />
            <span className={styles.envSeal} aria-hidden="true">
              {PERSO.sonSurnomPourLui.charAt(0)}
            </span>
          </button>
        </div>

        {!opened && <p className={styles.aside}>{copy.hint}</p>}

        <div aria-live="polite">
          {opened && (
            <>
              <h1 className={styles.title}>{copy.title}</h1>
              <p className={styles.subtitle} style={{ marginTop: 10 }}>
                {copy.from}
              </p>
            </>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        {opened && <PaperButton onClick={machine.next}>{copy.cta}</PaperButton>}

        {!cookiesAnswered && (
          <div className={styles.cookieBar}>
            <p className={styles.cookieText}>{copy.cookies.text}</p>
            <PaperButton variant="ghost" className={styles.cookieBtn} onClick={acceptCookies}>
              {copy.cookies.accept}
            </PaperButton>
          </div>
        )}
      </div>
    </>
  )
}
