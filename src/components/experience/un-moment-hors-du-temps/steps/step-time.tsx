'use client'

import { useRef, useState } from 'react'
import PaperButton from '../ui/paper-button'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import { formatMinutes } from '../dates'
import type { StepProps } from './step-props'

const DAY_MINUTES = 1439
/** Rayon d'accroche autour de l'heure recommandée, en minutes. */
const MAGNET_RADIUS = 25
/** Au bout de 3 tentatives de sortie, le magnétisme lâche pour de bon. */
const MAGNET_PATIENCE = 3
/** Bornes du segment doré affiché sous le curseur. */
const GOLD_FROM = 18 * 60
const GOLD_TO = 21 * 60

function zoneLabel(minutes: number): string {
  const zone = COPY.step4.zones.find((candidate) => minutes < candidate.until)
  return zone ? zone.label : COPY.step4.zones[COPY.step4.zones.length - 1].label
}

export default function StepTime({ machine }: StepProps) {
  const copy = COPY.step4
  const { answers, setAnswers } = machine
  const value = answers.minutes ?? PERSO.heureRecommandee
  const [magnetOn, setMagnetOn] = useState(true)
  const [released, setReleased] = useState(false)
  const escapesRef = useRef(0)

  const onChange = (raw: number) => {
    if (!magnetOn) {
      setAnswers({ minutes: raw })
      return
    }
    const distance = Math.abs(raw - PERSO.heureRecommandee)
    if (distance <= MAGNET_RADIUS) {
      // Ça accroche — mais ça n'enferme pas : sortir du rayon suffit.
      setAnswers({ minutes: PERSO.heureRecommandee })
      return
    }
    if (value === PERSO.heureRecommandee) {
      escapesRef.current += 1
      if (escapesRef.current >= MAGNET_PATIENCE) {
        setMagnetOn(false)
        setReleased(true)
      }
    }
    setAnswers({ minutes: raw })
  }

  const label = zoneLabel(value)
  const isRecommended = value >= GOLD_FROM && value < GOLD_TO

  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>

      <div className={styles.sliderBlock}>
        <p className={styles.bigTime}>{formatMinutes(value)}</p>
        <p className={styles.zoneLabel} aria-live="polite">
          {released && !isRecommended ? copy.magnetReleased : label}
        </p>

        <div className={styles.sliderRail}>
          <span
            className={styles.sliderGold}
            aria-hidden="true"
            style={{
              left: `${(GOLD_FROM / DAY_MINUTES) * 100}%`,
              width: `${((GOLD_TO - GOLD_FROM) / DAY_MINUTES) * 100}%`,
            }}
          />
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={DAY_MINUTES}
            step={5}
            value={value}
            aria-label={copy.sliderLabel}
            aria-valuetext={`${formatMinutes(value)}, ${label}`}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <div className={styles.scaleRow} aria-hidden="true">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <PaperButton
          onClick={() => {
            setAnswers({ minutes: value })
            machine.next()
          }}
        >
          {copy.cta}
        </PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
