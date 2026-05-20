'use client'

import { useState } from 'react'
import type { CountryData } from '@/lib/countryle'
import type { GameStatus } from '@/lib/countryle-game'
import { evaluateGuess, isWin } from '@/lib/countryle-game'
import GuessRow from '@/components/games/countryle/guess-row'
import WorldMap from '@/components/games/countryle/world-map'
import ResultScreen from '@/components/games/countryle/result-screen'

const MAX_GUESSES = 8

const HEADERS: { label: string; year?: string }[] = [
  { label: 'Pays' },
  { label: 'Continent' },
  { label: 'Population' },
  { label: 'Superficie (km²)' },
  { label: 'Pauvreté ext. (%)', year: '2019' },
  { label: 'Espérance (ans)',   year: '2022' },
  { label: 'Viande (kg/an)',    year: '2021' },
  { label: 'CO₂ (t/an)',        year: '2022' },
  { label: 'Taux fertilité',    year: '2022' },
]

const LEGEND = [
  { icon: '✓', label: 'Exact',  bg: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
  { icon: '↑↓', label: 'Proche', bg: 'rgba(234,88,12,0.2)',  color: '#ea580c' },
  { icon: '✗', label: 'Faux',   bg: 'rgba(220,38,38,0.2)',  color: '#dc2626' },
]

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

export default function GameBoard({ countries, target, debugMode }: GameBoardProps) {
  const [currentTarget, setCurrentTarget] = useState<CountryData>(target)
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [status, setStatus] = useState<GameStatus>('playing')
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')

  function nextDebugCountry() {
    setCurrentTarget(countries[Math.floor(Math.random() * countries.length)])
    setGuesses([])
    setStatus('playing')
    setModalOpen(false)
    setInput('')
  }

  const guessedNames = new Set(guesses.map((g) => g.name))

  const suggestions = input.trim().length > 0
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(input.toLowerCase()) &&
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
            <div>
              <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Geodatle</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                Devinez le pays du jour
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
              Tentatives : {guesses.length}/{MAX_GUESSES}
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
              placeholder="Chercher un pays…"
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
                      {c.name}
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
                {HEADERS.map(({ label, year }, i) => (
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
                <GuessRow key={guess.name} guess={guess} index={i} />
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
