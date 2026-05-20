'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { GuessResult } from '@/lib/countryle-game'
import type { CountryData } from '@/lib/countryle'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const COLOR = {
  target:      '#16a34a',
  correctCont: '#ca8a04',
  wrongCont:   '#ea580c',
  default:     '#1e2435',
}

interface WorldMapProps {
  guesses: GuessResult[]
  target: CountryData | null
}

export default function WorldMap({ guesses, target }: WorldMapProps) {
  const correctContNames = new Set(
    guesses
      .filter((g) => g.results.continent === 'correct')
      .map((g) => g.name.toLowerCase()),
  )
  const wrongContNames = new Set(
    guesses
      .filter((g) => g.results.continent !== 'correct')
      .map((g) => g.name.toLowerCase()),
  )
  const targetName = target?.name.toLowerCase()

  function getFill(geoName: string): string {
    const name = geoName.toLowerCase()
    if (targetName && name === targetName) return COLOR.target
    if (correctContNames.has(name)) return COLOR.correctCont
    if (wrongContNames.has(name)) return COLOR.wrongCont
    return COLOR.default
  }

  return (
    <div style={{ height: 'clamp(400px, 60vh, 600px)', overflow: 'hidden', width: '100%' }}>
    <ComposableMap
      width={800}
      height={400}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      projectionConfig={{ scale: 140 }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name: string = geo.properties.name ?? ''
            const fill = getFill(name)
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fill}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none', opacity: 0.85 },
                  pressed: { outline: 'none' },
                }}
              >
                <title>{name}</title>
              </Geography>
            )
          })
        }
      </Geographies>
    </ComposableMap>
    </div>
  )
}
