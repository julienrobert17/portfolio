'use client'

import { useEffect, useMemo, useState } from 'react'
import PaperButton from '../ui/paper-button'
import SincereModal from '../ui/sincere-modal'
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
/** Passé cette heure, « aujourd'hui » ne veut plus dire grand-chose. */
const LATE_HOUR = 22

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function countdownTo(target: Date, from: number): Countdown {
  const seconds = Math.max(0, Math.floor((target.getTime() - from) / 1000))
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
  const [now, setNow] = useState(() => Date.now())
  /** Index de l'escalade en cours, ou null si aucune confirmation ouverte. */
  const [confirming, setConfirming] = useState<{ iso: string; pass: number } | null>(null)

  // Le meilleur créneau, c'est maintenant : il est calculé, jamais écrit en dur.
  const { today, todayISO, otherDates, gridStart, isLate } = useMemo(() => {
    const base = startOfDay(new Date())
    return {
      today: base,
      todayISO: toISODate(base),
      otherDates: PERSO.creneauxOffsets.map((offset) => toISODate(addDays(base, offset))),
      gridStart: startOfWeek(base),
      isLate: new Date().getHours() >= LATE_HOUR,
    }
  }, [])

  const freeDates = useMemo(() => [todayISO, ...otherDates], [todayISO, otherDates])

  // Un seul battement de coeur pour tous les décomptes affichés.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const commit = (iso: string, reaction?: string) => {
    setAnswers({ dateISO: iso })
    setBubble(reaction ?? formatLong(fromISODate(iso)))
    setConfirming(null)
  }

  /** Toute date autre qu'aujourd'hui passe par l'escalade — qui finit toujours par céder. */
  const pick = (iso: string) => {
    if (iso === todayISO) {
      commit(iso, isLate ? copy.todayLateLabel : copy.todayLabel)
      return
    }
    setConfirming({ iso, pass: 0 })
  }

  const daysUntil = (iso: string) =>
    Math.max(0, Math.round((fromISODate(iso).getTime() - today.getTime()) / 86400000))

  const days = useMemo(() => {
    return Array.from({ length: WEEKS * 7 }, (_, index) => {
      const date = addDays(gridStart, index)
      const iso = toISODate(date)
      return {
        date,
        iso,
        isPast: date.getTime() < today.getTime(),
        isFree: freeDates.includes(iso),
        isToday: iso === todayISO,
        reason: copy.reasons[hashString(iso) % copy.reasons.length],
      }
    })
  }, [gridStart, today, todayISO, freeDates, copy.reasons])

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(today),
    [today],
  )

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
          {days.map(({ date, iso, isPast, isFree, isToday, reason }) => {
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
                  isToday ? styles.dayToday : '',
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
                aria-label={
                  isFree
                    ? `${label}${isToday ? `, ${copy.todayLabel}` : ''}, ${copy.legendFree}`
                    : `${label}, ${reason}`
                }
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
      </div>

      <p className={styles.bubble} aria-live="polite">
        {bubble}
      </p>

      {/* Les créneaux en clair : aujourd'hui d'abord, puis les autres et leur attente. */}
      <ul className={styles.slots}>
        <li>
          <button
            type="button"
            className={`${styles.slot} ${styles.slotToday} ${
              answers.dateISO === todayISO ? styles.slotOn : ''
            }`}
            aria-pressed={answers.dateISO === todayISO}
            onClick={() => pick(todayISO)}
          >
            <span className={styles.slotLabel}>{isLate ? copy.todayLateLabel : copy.todayLabel}</span>
            <span className={styles.slotDate}>{formatLong(today)}</span>
          </button>
        </li>
        {otherDates.map((iso) => {
          const left = countdownTo(fromISODate(iso), now)
          return (
            <li key={iso}>
              <button
                type="button"
                className={`${styles.slot} ${answers.dateISO === iso ? styles.slotOn : ''}`}
                aria-pressed={answers.dateISO === iso}
                onClick={() => pick(iso)}
              >
                <span className={styles.slotDate}>{formatLong(fromISODate(iso))}</span>
                <span className={styles.slotCount}>
                  {left.days}j {String(left.hours).padStart(2, '0')}h{' '}
                  {String(left.minutes).padStart(2, '0')}m{' '}
                  {String(left.seconds).padStart(2, '0')}s
                </span>
                <span className={styles.slotLong}>{copy.countdownSuffix}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.footer}>
        <PaperButton variant="ghost" onClick={() => commit(todayISO, copy.asapReaction)}>
          {copy.asap}
        </PaperButton>
        <PaperButton disabled={!answers.dateISO} onClick={machine.next}>
          {copy.cta}
        </PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>

      {confirming && (
        <SincereModal titleId="hdt-confirm-date" onClose={() => setConfirming(null)}>
          <h2 className={styles.modalTitle} id="hdt-confirm-date">
            {copy.confirmations[confirming.pass].replace(
              '{n}',
              String(daysUntil(confirming.iso)),
            )}
          </h2>
          <div className={styles.modalActions}>
            <PaperButton
              variant="ghost"
              onClick={() => {
                // Trois passes maximum : la dernière laisse toujours passer.
                if (confirming.pass >= copy.confirmations.length - 1) {
                  commit(confirming.iso)
                  return
                }
                setConfirming({ iso: confirming.iso, pass: confirming.pass + 1 })
              }}
            >
              {copy.confirmKeep}
            </PaperButton>
            <PaperButton onClick={() => commit(todayISO, isLate ? copy.todayLateLabel : copy.todayLabel)}>
              {copy.confirmToday}
            </PaperButton>
          </div>
        </SincereModal>
      )}
    </>
  )
}
