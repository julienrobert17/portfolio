'use client'

import { useEffect, useMemo, useState } from 'react'
import PaperButton from '../ui/paper-button'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import {
  addDays,
  formatLong,
  fromISODate,
  hashString,
  startOfDay,
  startOfWeek,
  toISODate,
} from '../dates'
import type { StepProps } from './step-props'

const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const WEEKS = 5

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function computeCountdown(target: Date): Countdown {
  const delta = Math.max(0, target.getTime() - Date.now())
  const seconds = Math.floor(delta / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}

export default function StepDate({ machine }: StepProps) {
  const copy = COPY.step3
  const { answers, setAnswers } = machine
  const [bubble, setBubble] = useState('')
  const [usedAsap, setUsedAsap] = useState(false)

  // Les créneaux sont relatifs à aujourd'hui : le lien ne périme jamais.
  const { today, freeDates, gridStart } = useMemo(() => {
    const base = startOfDay(new Date())
    return {
      today: base,
      freeDates: PERSO.creneauxOffsets.map((offset) => toISODate(addDays(base, offset))),
      gridStart: startOfWeek(base),
    }
  }, [])

  const farthest = freeDates[freeDates.length - 1]
  const nearest = freeDates[0]
  const isFarthest = answers.dateISO === farthest

  const [countdown, setCountdown] = useState<Countdown | null>(null)

  // Compte à rebours dramatique, uniquement sur la date la plus lointaine.
  useEffect(() => {
    if (!isFarthest || !answers.dateISO) return
    const target = fromISODate(answers.dateISO)
    const tick = () => setCountdown(computeCountdown(target))
    const timer = window.setInterval(tick, 1000)
    tick()
    return () => window.clearInterval(timer)
  }, [isFarthest, answers.dateISO])

  const pick = (iso: string, viaAsap = false) => {
    setAnswers({ dateISO: iso })
    setUsedAsap(viaAsap)
    setBubble(viaAsap ? copy.asapReaction : formatLong(fromISODate(iso)))
  }

  const days = useMemo(() => {
    return Array.from({ length: WEEKS * 7 }, (_, index) => {
      const date = addDays(gridStart, index)
      const iso = toISODate(date)
      const isPast = date.getTime() < today.getTime()
      const isFree = freeDates.includes(iso)
      const reason = copy.reasons[hashString(iso) % copy.reasons.length]
      return { date, iso, isPast, isFree, reason }
    })
  }, [gridStart, today, freeDates, copy.reasons])

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    return formatter.format(today)
  }, [today])

  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>

      <div className={styles.calendar}>
        <p className={styles.calMonth}>{monthLabel}</p>
        <div className={styles.calGrid} role="group" aria-label="Choix de la date">
          {WEEKDAYS.map((day) => (
            <div key={day} className={styles.calHead} aria-hidden="true">
              {day}
            </div>
          ))}
          {days.map(({ date, iso, isPast, isFree, reason }) => {
            const selected = answers.dateISO === iso
            const label = formatLong(date)
            return (
              <button
                key={iso}
                type="button"
                className={[
                  styles.day,
                  isPast ? styles.dayOut : '',
                  !isPast && !isFree ? styles.dayBusy : '',
                  isFree ? styles.dayFree : '',
                  selected ? styles.daySelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                /*
                 * aria-disabled plutôt que disabled : les jours pris restent
                 * focusables et tapables, sinon leurs excuses absurdes
                 * seraient inaccessibles au doigt comme au clavier.
                 */
                aria-disabled={!isFree || undefined}
                aria-pressed={isFree ? selected : undefined}
                aria-label={isFree ? `${label}, ${copy.legendFree}` : `${label}, ${reason}`}
                tabIndex={isPast ? -1 : 0}
                onMouseEnter={() => !isFree && !isPast && setBubble(reason)}
                onClick={() => {
                  if (isPast) return
                  if (isFree) pick(iso)
                  else setBubble(reason)
                }}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
        <div className={styles.legendRow} aria-hidden="true">
          <span>
            <i className={styles.legendDot} style={{ background: 'var(--gold)' }} />
            {copy.legendFree}
          </span>
          <span>
            <i
              className={styles.legendDot}
              style={{ background: 'var(--paper-deep)', border: '1px solid var(--line)' }}
            />
            {copy.legendBusy}
          </span>
        </div>
      </div>

      <p className={styles.bubble} aria-live="polite">
        {usedAsap && answers.dateISO === nearest ? copy.asapReaction : bubble}
      </p>

      {isFarthest && countdown && (
        <div aria-live="off">
          <div className={styles.countdown}>
            {[
              { value: countdown.days, label: 'jours' },
              { value: countdown.hours, label: 'heures' },
              { value: countdown.minutes, label: 'min' },
              { value: countdown.seconds, label: 'sec' },
            ].map((unit) => (
              <span key={unit.label} className={styles.countUnit}>
                <span className={styles.countValue}>{unit.value}</span>
                <span className={styles.countLabel}>{unit.label}</span>
              </span>
            ))}
          </div>
          <p className={styles.bubble}>{copy.farReaction}</p>
        </div>
      )}

      <div className={styles.footer}>
        <PaperButton variant="ghost" onClick={() => pick(nearest, true)}>
          {copy.asap}
        </PaperButton>
        <PaperButton disabled={!answers.dateISO} onClick={machine.next}>
          {copy.cta}
        </PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
