'use client'

import { useState, useEffect } from 'react'
import type { CountryData } from '@/lib/geodatle-data'
import type { GuessResult, GameStatus } from '@/lib/geodatle-game'
import { evaluateGuess, isWin } from '@/lib/geodatle-game'
import GuessRow from '@/components/games/geodatle/guess-row'
import WorldMap from '@/components/games/geodatle/world-map'
import ResultScreen from '@/components/games/geodatle/result-screen'
import RulesModal from '@/components/games/geodatle/rules-modal'
import { LangProvider, useLang } from '@/components/games/geodatle/lang-context'

const MAX_GUESSES = 8

const centred: React.CSSProperties = {
  maxWidth: '896px',
  margin: '0 auto',
  padding: '0 clamp(16px, 4vw, 48px)',
}

interface GameBoardProps {
  countries: CountryData[]
  target: CountryData
  debugMode?: boolean
}

function GameBoardInner({ countries, target, debugMode }: GameBoardProps) {
  const { lang, setLang, t } = useLang()

  const [currentTarget, setCurrentTarget] = useState<CountryData>(target)
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [status, setStatus] = useState<GameStatus>('playing')
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('geodatle-rules-seen')) setShowRules(true)
  }, [])

  function handleCloseRules() {
    setShowRules(false)
    localStorage.setItem('geodatle-rules-seen', 'true')
  }

  function nextDebugCountry() {
    setCurrentTarget(countries[Math.floor(Math.random() * countries.length)])
    setGuesses([])
    setStatus('playing')
    setModalOpen(false)
    setInput('')
  }

  const displayName = (c: CountryData) => lang === 'fr' ? c.nameFr : c.name
  const guessedNames = new Set(guesses.map((g) => g.name))

  function normalize(str: string) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  }

  const suggestions = input.trim().length > 0
    ? countries.filter(
        (c) =>
          normalize(displayName(c)).includes(normalize(input)) &&
          !guessedNames.has(c.name),
      )
    : []

  function submitGuess(country: CountryData) {
    const result = evaluateGuess(country, currentTarget)
    const next = [...guesses, result]
    setGuesses(next)
    setInput('')

    if (isWin(result)) {
      setStatus('won')
      setModalOpen(true)
    } else if (next.length >= MAX_GUESSES) {
      setStatus('lost')
      setModalOpen(true)
    }
  }

  const unavailableIndicators = new Set(
    Object.entries(currentTarget)
      .filter(([_, v]) => v === null)
      .map(([k]) => k)
  )

  const HEADERS: { label: string; year?: string; key?: string }[] = [
    { label: t.headers.country },
    { label: t.headers.continent,      key: 'continent'       },
    { label: t.headers.population,     key: 'population'      },
    { label: t.headers.area,           key: 'area'            },
    { label: t.headers.poverty,        key: 'poverty',        year: '2019' },
    { label: t.headers.lifeExpectancy, key: 'lifeExpectancy', year: '2022' },
    { label: t.headers.meatSupply,     key: 'meatSupply',     year: '2021' },
    { label: t.headers.co2PerCapita,   key: 'co2PerCapita',   year: '2022' },
    { label: t.headers.fertilityRate,  key: 'fertilityRate',  year: '2022' },
  ]

  const LEGEND = [
    { icon: '≈',  label: t.legend.similar, bg: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
    { icon: '↑',  label: t.legend.close,   bg: 'rgba(202,138,4,0.2)',  color: '#ca8a04' },
    { icon: '↑↑', label: t.legend.far,     bg: 'rgba(194,65,12,0.2)',  color: '#c2410c' },
    { icon: '✗',  label: t.legend.wrong,   bg: 'rgba(185,28,28,0.2)',  color: '#b91c1c' },
  ]

  const flagBtnStyle = (active: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    lineHeight: 1,
    opacity: active ? 1 : 0.3,
    padding: '2px',
    transition: 'opacity 0.15s ease',
    color: 'white',
  })

  return (
    <>
    <div className="flex flex-col gap-4" style={{ paddingBottom: '48px' }}>

      {/* Header — sticky */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(15,17,23,0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRules(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '999px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '15px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ?
            </button>
            <div>
              <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>{t.title}</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {t.subtitle}
              </p>
            </div>
            {debugMode && (
              <span style={{
                background: 'rgba(234,88,12,0.2)',
                border: '1px solid rgba(234,88,12,0.4)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#ea580c',
              }}>
                Mode debug
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {debugMode && (
              <button
                onClick={nextDebugCountry}
                style={{
                  background: 'rgba(234,88,12,0.15)',
                  border: '1px solid rgba(234,88,12,0.3)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ea580c',
                  cursor: 'pointer',
                }}
              >
                → Pays suivant
              </button>
            )}
            <button onClick={() => setLang('fr')} style={{ ...flagBtnStyle(lang === 'fr'), fontSize: '12px', fontWeight: 600 }}>FR</button>
            <button onClick={() => setLang('en')} style={{ ...flagBtnStyle(lang === 'en'), fontSize: '12px', fontWeight: 600 }}>EN</button>
            <span
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {t.attempts} : {guesses.length}/{MAX_GUESSES}
            </span>
          </div>
        </div>
      </div>

      {/* Map — full width */}
      <div style={{ width: '100%', background: '#0a0d12', overflow: 'hidden', height: 'clamp(400px, 60vh, 600px)' }}>
        <WorldMap guesses={guesses} target={status !== 'playing' ? currentTarget : null} />
      </div>

      {/* Rest — centred */}
      <div style={{ ...centred, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Search */}
        {status === 'playing' && (
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                color: 'white',
                outline: 'none',
              }}
              className="placeholder:text-[rgba(255,255,255,0.3)]"
            />
            {suggestions.length > 0 && (
              <ul
                className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto"
                style={{
                  background: '#1a1d27',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                {suggestions.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => submitGuess(c)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors"
                      style={{ color: 'rgba(255,255,255,0.85)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <img src={c.flag} alt="" className="h-4 w-6 object-cover rounded-sm shrink-0" />
                      {displayName(c)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Grid */}
        {guesses.length > 0 && (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {HEADERS
                  .filter(h => !h.key || !unavailableIndicators.has(h.key))
                  .map(({ label, year }, i) => (
                    <th
                      key={label}
                      style={{
                        width: i === 0 ? '120px' : undefined,
                        padding: '6px 4px',
                        textAlign: i === 0 ? 'left' : 'center',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.35)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                      {year && (
                        <span style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                          {year}
                        </span>
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess, i) => (
                <GuessRow key={guess.name} guess={guess} index={i} unavailableIndicators={unavailableIndicators} />
              ))}
            </tbody>
          </table>
        )}

        {/* Legend */}
        <div className="flex gap-2 flex-wrap">
          {LEGEND.map(({ icon, label, bg, color }) => (
            <span
              key={label}
              style={{
                background: bg,
                color,
                border: `1px solid ${color}40`,
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Sources */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
          Données :{' '}
          <a
            href="https://ourworldindata.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            Our World in Data
          </a>
          {' · REST Countries API'}
        </p>

      </div>
    </div>

    {showRules && <RulesModal onClose={handleCloseRules} />}

    {modalOpen && status !== 'playing' && (
      <ResultScreen
        status={status}
        target={currentTarget}
        guessCount={guesses.length}
        guesses={guesses}
        onClose={() => setModalOpen(false)}
      />
    )}
    </>
  )
}

export default function GameBoard(props: GameBoardProps) {
  return (
    <LangProvider>
      <GameBoardInner {...props} />
    </LangProvider>
  )
}
