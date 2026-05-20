'use client'

import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { CountryData } from '@/lib/countryle'
import type { GuessResult } from '@/lib/countryle-game'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface ResultScreenProps {
  status: 'won' | 'lost'
  target: CountryData
  guessCount: number
  guesses: GuessResult[]
  onClose?: () => void
}

const RESULT_KEYS = [
  'continent', 'population', 'area', 'poverty',
  'lifeExpectancy', 'meatSupply', 'co2PerCapita', 'fertilityRate',
] as const satisfies ReadonlyArray<keyof GuessResult['results']>

function toEmoji(value: string): string {
  if (value === 'correct') return '🟩'
  if (value === 'wrong')   return '🟥'
  return '🟧'
}

function buildShareText(
  guesses: GuessResult[],
  guessCount: number,
  status: 'won' | 'lost',
): string {
  const date = new Date().toLocaleDateString('en-CA')
  const score = status === 'won' ? `${guessCount}/8` : 'X/8'
  const rows = guesses
    .map((g) => RESULT_KEYS.map((k) => toEmoji(g.results[k])).join(''))
    .join('\n')
  return `Geodatle ${date} ${score}\n${rows}`
}

export default function ResultScreen({
  status,
  target,
  guessCount,
  guesses,
  onClose,
}: ResultScreenProps) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(t)
  }, [])

  async function handleShare() {
    await navigator.clipboard.writeText(buildShareText(guesses, guessCount, status))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#1a1d27',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '480px',
          width: '90%',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
          color: 'white',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '18px',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        )}

        <button
          onClick={() => { window.location.href = '/' }}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            transition: 'color 0.2s ease',
            padding: '4px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          ← Retour au portfolio
        </button>

        <h2 className="text-2xl font-semibold">
          {status === 'won'
            ? `🎉 Trouvé en ${guessCount} tentative${guessCount > 1 ? 's' : ''} !`
            : '😞 Perdu !'}
        </h2>

        <div className="flex flex-col items-center gap-3">
          <img
            src={target.flag}
            alt={`Drapeau ${target.name}`}
            className="h-20 w-32 object-cover rounded-lg shadow-sm"
          />
          <p className="text-3xl font-bold">{target.name}</p>
        </div>

        <div style={{ height: '240px', overflow: 'hidden', borderRadius: '8px', background: '#0a0d12', width: '100%' }}>
          <ComposableMap
            width={800}
            height={400}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            projectionConfig={{ center: [target.lng, target.lat], scale: 800 }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties.name ?? ''
                  const nameLower = name.toLowerCase()
                  const isTarget = nameLower === target.name.toLowerCase()
                  const guess = guesses.find((g) => g.name.toLowerCase() === nameLower)
                  const fill = isTarget
                    ? '#16a34a'
                    : guess
                      ? guess.results.continent === 'correct' ? '#ca8a04' : '#ea580c'
                      : '#1e2435'
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '999px', padding: '4px 12px', fontSize: '13px' }}>
            {target.continent}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '999px', padding: '4px 12px', fontSize: '13px' }}>
            {(target.population / 1_000_000).toFixed(1)}M hab.
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '999px', padding: '4px 12px', fontSize: '13px' }}>
            Espérance {target.lifeExpectancy.toFixed(1)} ans
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '999px', padding: '4px 12px', fontSize: '13px' }}>
            Pauvreté {target.poverty.toFixed(1)}%
          </span>
        </div>

        <button
          onClick={handleShare}
          className="rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-[#1a1a1a] px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
        >
          {copied ? 'Copié !' : 'Partager'}
        </button>

        <a
          href="https://ourworldindata.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            transition: 'color 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          Découvrir les données sur Our World in Data →
        </a>
      </div>
    </div>
  )
}
