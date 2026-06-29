'use client'

import { useState, useEffect, useRef } from 'react'
import { useNarrativeEngine } from './useNarrativeEngine'

// Typage dérivé du hook pour rester automatiquement en sync
type NarrativeOverlayProps = ReturnType<typeof useNarrativeEngine>

export default function NarrativeOverlay(props: NarrativeOverlayProps) {
  const { currentBeatIndex, currentBeat, geologicalDate, isPaused, lang, setLang } = props

  // ── 1. Date géologique ────────────────────────────────────────────────────
  // isGeoActive est un booléen primitif → useEffect ne se déclenche que lors
  // des transitions null ↔ non-null, jamais à chaque frame du beat 'zoomout'
  const isGeoActive = geologicalDate !== null

  const [geoRendered, setGeoRendered] = useState(false)
  const [geoVisible,  setGeoVisible]  = useState(false)
  // Ref pour conserver la dernière valeur pendant le fadeOut
  const displayedGeoRef = useRef<number>(420)
  if (geologicalDate !== null) {
    displayedGeoRef.current = Math.abs(Math.round(geologicalDate))
  }

  useEffect(() => {
    if (isGeoActive) {
      setGeoRendered(true)
      // Un frame garantit que l'élément est dans le DOM avant la transition
      const frame = requestAnimationFrame(() => setGeoVisible(true))
      return () => cancelAnimationFrame(frame)
    } else {
      setGeoVisible(false)
      const t = setTimeout(() => setGeoRendered(false), 900)
      return () => clearTimeout(t)
    }
  }, [isGeoActive])

  // ── 2. Texte narratif ─────────────────────────────────────────────────────
  const [textVisible,        setTextVisible]        = useState(false)
  const [resonanceLineCount, setResonanceLineCount] = useState(0)

  useEffect(() => {
    // Reset immédiat à chaque changement de beat ou de langue
    setTextVisible(false)
    setResonanceLineCount(0)

    const text = currentBeat.text[lang]
    if (text === null) return

    const timers: ReturnType<typeof setTimeout>[] = []

    if (currentBeat.phase === 'resonance') {
      // Chaque ligne apparaît séquentiellement, 2500ms d'écart
      text.split('\n').forEach((_, i) => {
        timers.push(
          setTimeout(() => setResonanceLineCount(i + 1), 800 + i * 2500),
        )
      })
    } else {
      timers.push(setTimeout(() => setTextVisible(true), 1500))
    }

    return () => timers.forEach(clearTimeout)
  }, [currentBeatIndex, lang, currentBeat])

  // ── 4. Hint keybinds ──────────────────────────────────────────────────────
  const [hintRendered, setHintRendered] = useState(false)
  const [hintFading,   setHintFading]   = useState(false)
  const hintDismissedRef                = useRef(false)

  useEffect(() => {
    if (currentBeatIndex !== 1 || hintDismissedRef.current) return

    setHintFading(false)
    setHintRendered(true)

    // Début du fadeOut à 5 s, suppression du DOM à 5,8 s
    const fadeId   = setTimeout(() => setHintFading(true), 5000)
    const removeId = setTimeout(() => {
      setHintRendered(false)
      hintDismissedRef.current = true
    }, 5800)

    return () => {
      clearTimeout(fadeId)
      clearTimeout(removeId)
    }
  }, [currentBeatIndex])

  // ── Dérivés utiles ────────────────────────────────────────────────────────
  const isResonance = currentBeat.phase === 'resonance'
  const isInterior  = currentBeat.phase === 'interior'
  const hasText     = currentBeat.text[lang] !== null

  const HINT: Record<'en' | 'fr', string> = {
    en: 'space  →  continue   ·   f  →  fast forward   ·   esc  →  pause',
    fr: 'espace  →  continuer   ·   f  →  accélérer   ·   échap  →  pause',
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* 1. DATE GÉOLOGIQUE */}
      {geoRendered && (
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: geoVisible ? 0.6 : 0,
            transition: 'opacity 900ms ease',
            fontFamily: 'monospace',
            fontSize: '14px',
            letterSpacing: '0.25em',
            color: 'white',
          }}
        >
          — {displayedGeoRef.current} Ma —
        </div>
      )}

      {/* 2. TEXTE NARRATIF */}
      {hasText && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 48px',
          }}
        >
          {isResonance ? (
            /* Lignes séquentielles pour le beat 'resonance' */
            <div style={{ maxWidth: 520, textAlign: 'center' }}>
              {currentBeat.text[lang]?.split('\n').map((line, i) => (
                <p
                  key={i}
                  style={{
                    margin: '0 0 10px',
                    opacity: resonanceLineCount > i ? 0.88 : 0,
                    transition: 'opacity 1200ms ease',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '18px',
                    lineHeight: 1.7,
                    color: 'white',
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            /* Fade global pour tous les autres beats */
            <p
              style={{
                maxWidth: 520,
                textAlign: 'center',
                margin: 0,
                opacity: textVisible ? 0.88 : 0,
                transition: 'opacity 1200ms ease',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: 1.7,
                color: 'white',
                fontStyle: isInterior ? 'italic' : 'normal',
              }}
            >
              {currentBeat.text[lang]}
            </p>
          )}
        </div>
      )}

      {/* 3. SÉLECTEUR DE LANGUE */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={() => setLang('en')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '0.1em',
            opacity: lang === 'en' ? 1 : 0.35,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
          }}
        >
          EN
        </button>
        <span
          style={{
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'monospace',
            fontSize: '12px',
            userSelect: 'none',
          }}
        >
          /
        </span>
        <button
          onClick={() => setLang('fr')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '0.1em',
            opacity: lang === 'fr' ? 1 : 0.35,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
          }}
        >
          FR
        </button>
      </div>

      {/* 4. HINT KEYBINDS */}
      {hintRendered && (
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.04em',
            color: 'white',
            opacity: hintFading ? 0 : 0.4,
            transition: hintFading ? 'opacity 800ms ease' : 'opacity 1200ms ease',
          }}
        >
          {HINT[lang]}
        </div>
      )}

      {/* 5. INDICATEUR DE PAUSE */}
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '0.1em',
            color: 'white',
            opacity: 0.5,
          }}
        >
          {lang === 'en' ? 'PAUSED' : 'EN PAUSE'}
        </div>
      )}
    </div>
  )
}
