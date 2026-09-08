'use client'

import { useEffect, useState } from 'react'
import PaperButton from '../ui/paper-button'
import CatPhoto from '../ui/cat-photo'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import { encodeState } from '../use-invitation-machine'
import { useCelebration } from '../celebration-context'
import { activityLabel, confirmationRef, dateLabel, timeLabel, whatsappLink } from '../share'
import type { StepProps } from './step-props'

export default function StepConfirm({ machine }: StepProps) {
  const copy = COPY.step7
  const { answers } = machine
  const { celebrate } = useCelebration()
  const [index, setIndex] = useState(0)
  const [sent, setSent] = useState(false)

  // La barre d'envoi : elle avance, recule, puis se rend. ~3 secondes.
  useEffect(() => {
    if (sent) return
    const stage = copy.sending[index]
    const timer = window.setTimeout(() => {
      if (index + 1 >= copy.sending.length) {
        setSent(true)
        celebrate()
        return
      }
      setIndex(index + 1)
    }, stage.hold)
    return () => window.clearTimeout(timer)
  }, [index, sent, copy.sending, celebrate])

  // Une fois envoyé, l'URL porte l'état complet : le lien devient partageable.
  useEffect(() => {
    if (!sent) return
    const encoded = encodeState({
      screen: 7,
      answers: machine.answers,
      direction: 1,
    })
    window.history.replaceState({ screen: 7 }, '', `#/s/${encoded}`)
  }, [sent, machine.answers])

  if (!sent) {
    const stage = copy.sending[index]
    return (
      <div className={styles.sendBlock} aria-live="polite">
        <p className={styles.sendLabel}>{stage.label}</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${stage.value}%` }} />
        </div>
        <p className={styles.progressValue}>{stage.value}%</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.ticket}>
        <p className={styles.ticketHead}>{copy.ticketTitle}</p>
        <p className={styles.ticketSub}>{copy.ticketSubtitle}</p>

        <div className={styles.ticketRow}>
          <span className={styles.ticketKey}>{copy.fields.name}</span>
          <span className={styles.ticketValue}>{PERSO.elle}</span>
        </div>
        <div className={styles.ticketRow}>
          <span className={styles.ticketKey}>{copy.fields.date}</span>
          <span className={styles.ticketValue}>{dateLabel(answers)}</span>
        </div>
        <div className={styles.ticketRow}>
          <span className={styles.ticketKey}>{copy.fields.time}</span>
          <span className={styles.ticketValue}>{timeLabel(answers)}</span>
        </div>
        <div className={styles.ticketRow}>
          <span className={styles.ticketKey}>{copy.fields.activity}</span>
          <span className={styles.ticketValue}>{activityLabel(answers)}</span>
        </div>

        <div className={styles.perf} aria-hidden="true" />

        <div className={styles.ticketRow}>
          <span className={styles.ticketKey}>{copy.fields.ref}</span>
          <span className={`${styles.ticketValue} ${styles.ticketRef}`}>
            {confirmationRef(answers)}
          </span>
        </div>

        <span className={styles.stamp} aria-hidden="true">
          <span className={styles.stampPhoto}>
            <CatPhoto alt="" sizes="84px" />
          </span>
          <span className={styles.stampText}>{copy.stamp}</span>
        </span>
      </div>

      <div className={styles.actions}>
        <PaperButton
          onClick={() => window.open(whatsappLink(answers), '_blank', 'noopener')}
        >
          {copy.actions.share}
        </PaperButton>
      </div>
    </>
  )
}
