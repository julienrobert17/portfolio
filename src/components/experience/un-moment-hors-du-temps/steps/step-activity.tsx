'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PaperButton from '../ui/paper-button'
import CatPhoto from '../ui/cat-photo'
import styles from '../invitation.module.css'
import { COPY, PERSO } from '../content'
import type { StepProps } from './step-props'

/** Délai avant que la 5e carte se décoche toute seule. */
const TRAP_MS = 1000

export default function StepActivity({ machine }: StepProps) {
  const copy = COPY.step5
  const { answers, setAnswers } = machine
  const [trapMessage, setTrapMessage] = useState('')
  const [query, setQuery] = useState(answers.activityOther)
  const trapTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (trapTimerRef.current !== null) window.clearTimeout(trapTimerRef.current)
    }
  }, [])

  const choose = (id: string) => {
    setTrapMessage('')
    setAnswers({ activity: answers.activity === id ? null : id })
  }

  /** La 5e carte : elle a l'air normale, puis renonce d'elle-même. */
  const chooseTrap = () => {
    if (trapTimerRef.current !== null) return
    setTrapMessage('')
    setAnswers({ activity: copy.trap.id })
    trapTimerRef.current = window.setTimeout(() => {
      setAnswers({ activity: null })
      setTrapMessage(copy.trap.message)
      trapTimerRef.current = null
    }, TRAP_MS)
  }

  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length === 0) return []
    const matches = copy.suggestions.filter((item) => item.toLowerCase().includes(trimmed))
    // Dès la première lettre, on propose quelque chose, même hors sujet.
    return (matches.length > 0 ? matches : copy.suggestions).slice(0, 4)
  }, [query, copy.suggestions])

  const realActivity =
    answers.activity !== null && answers.activity !== copy.trap.id ? answers.activity : null
  const hasOther = query.trim().length > 0

  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>

      <div className={styles.cards} role="group" aria-label={copy.title}>
        {copy.options.map((option) => {
          const selected = answers.activity === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              className={`${styles.optCard} ${selected ? styles.optSelected : ''}`}
              onClick={() => choose(option.id)}
            >
              <span className={styles.optArt} aria-hidden="true">
                {option.art}
              </span>
              <span className={styles.optLabel}>{option.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          role="checkbox"
          aria-checked={answers.activity === copy.trap.id}
          className={`${styles.optCard} ${styles.optCardRow} ${styles.card2} ${
            answers.activity === copy.trap.id ? styles.optSelected : ''
          }`}
          onClick={chooseTrap}
        >
          <span className={styles.optArt} aria-hidden="true">
            {copy.trap.art}
          </span>
          <span className={styles.optLabel}>{copy.trap.label}</span>
        </button>
      </div>

      <div aria-live="polite">
        {trapMessage && <p className={styles.note}>{trapMessage}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="hdt-other">
          {copy.otherLabel}
        </label>
        <div className={styles.suggestBox}>
          <input
            id="hdt-other"
            className={styles.input}
            value={query}
            placeholder={copy.otherPlaceholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="hdt-suggest"
            onChange={(event) => {
              setQuery(event.target.value)
              setAnswers({ activityOther: event.target.value })
            }}
          />
          {suggestions.length > 0 && (
            <ul className={styles.suggestList} id="hdt-suggest" role="listbox">
              {suggestions.map((suggestion) => (
                <li key={suggestion} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={query === suggestion}
                    className={styles.suggestItem}
                    onClick={() => {
                      setQuery(suggestion)
                      setAnswers({ activityOther: suggestion })
                    }}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {realActivity && (
        <div className={styles.catBanner}>
          <span className={styles.catAvatar}>
            <CatPhoto alt={`${PERSO.chat.nom}, resté à ${PERSO.trajet.depuis}`} sizes="64px" />
          </span>
          <span className={styles.dashLine} aria-hidden="true" />
          <p className={styles.catText}>
            {copy.catBanner.text.replace('{nom}', PERSO.chat.nom)}
            <em className={styles.catPunch}>{copy.catBanner.punch}</em>
          </p>
        </div>
      )}

      <div className={styles.footer}>
        <PaperButton disabled={!realActivity && !hasOther} onClick={machine.next}>
          {copy.cta}
        </PaperButton>
        <PaperButton variant="quiet" onClick={machine.back}>
          {COPY.back}
        </PaperButton>
      </div>
    </>
  )
}
