'use client'

import { useRef, useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { GuessResult } from '@/lib/geodatle-game'
import type { CountryData } from '@/lib/geodatle-data'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const GEO_TO_COUNTRY: Record<string, string> = {
  'United States of America': 'United States',
  'United Republic of Tanzania': 'Tanzania',
  "Côte d'Ivoire": 'Ivory Coast',
  'Democratic Republic of the Congo': 'DR Congo',
  'Republic of Congo': 'Republic of the Congo',
  'Bolivia': 'Bolivia',
  'Venezuela': 'Venezuela',
  'Russia': 'Russia',
  'South Korea': 'South Korea',
  'North Korea': 'North Korea',
  'Syria': 'Syrian Arab Republic',
}

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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 400 })

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height
      setDims({ width: entry.contentRect.width, height: h })
    })
    obs.observe(wrapperRef.current!)
    return () => obs.disconnect()
  }, [])

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
    const ourName = (GEO_TO_COUNTRY[geoName] ?? geoName).toLowerCase()
    if (targetName && ourName === targetName) return COLOR.target
    if (correctContNames.has(ourName)) return COLOR.correctCont
    if (wrongContNames.has(ourName)) return COLOR.wrongCont
    return COLOR.default
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <ComposableMap
        projection="geoNaturalEarth1"
        width={dims.width}
        height={dims.height}
        style={{ width: '100%', height: '100%' }}
        projectionConfig={{ scale: dims.height * 0.38, center: [0, 10] }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: { rsmKey: string; properties: { name?: string }; [key: string]: unknown }[] }) =>
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
