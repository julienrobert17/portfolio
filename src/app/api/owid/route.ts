import { NextResponse } from 'next/server'

export const revalidate = 86400

const SOURCES = [
  { key: 'poverty',        url: 'https://ourworldindata.org/grapher/share-of-population-in-extreme-poverty.csv', year: 2019 },
  { key: 'lifeExpectancy', url: 'https://ourworldindata.org/grapher/life-expectancy.csv',                  year: 2022 },
  { key: 'meatSupply',     url: 'https://ourworldindata.org/grapher/meat-supply-per-person.csv',           year: 2021 },
  { key: 'co2PerCapita',   url: 'https://ourworldindata.org/grapher/co2-emissions-per-capita.csv',         year: 2022 },
  { key: 'fertilityRate',  url: 'https://ourworldindata.org/grapher/fertility-rate-complete-gapminder.csv', year: 2022 },
] as const

type Indicator = (typeof SOURCES)[number]['key']

const AGGREGATE_RE = /world|income|region|countries|owid/i
const SKIP_COLS = new Set(['Entity', 'Code', 'Year'])

function splitLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseForYear(csv: string, targetYear: number): Map<string, number | null> {
  const lines = csv.replace(/\r/g, '').trim().split('\n')
  if (lines.length < 2) return new Map()

  const headers = splitLine(lines[0])
  const entityIdx = headers.indexOf('Entity')
  const yearIdx = headers.indexOf('Year')
  const dataIdx = headers.findIndex((h) => !SKIP_COLS.has(h))

  if (entityIdx === -1 || yearIdx === -1 || dataIdx === -1) return new Map()

  const result = new Map<string, number | null>()

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i])
    const entity = cols[entityIdx]
    if (!entity || AGGREGATE_RE.test(entity)) continue

    const year = parseInt(cols[yearIdx], 10)
    if (year !== targetYear) continue

    const raw = cols[dataIdx]
    const parsed = raw !== '' ? parseFloat(raw) : NaN
    result.set(entity, !isNaN(parsed) ? parsed : null)
  }

  return result
}

type OwidEntry = Record<Indicator, number | null>

type Stats = {
  total: number
  complete: number
  missingByIndicator: Record<Indicator, number>
}

export async function GET(req: Request) {
  try {
    const csvTexts = await Promise.all(
      SOURCES.map(({ url }) =>
        fetch(url, { next: { revalidate: 86400 } }).then((r) => {
          if (!r.ok) throw new Error(`Failed: ${url}`)
          return r.text()
        }),
      ),
    )

    const maps = new Map<Indicator, Map<string, number | null>>(
      SOURCES.map(({ key, year }, i) => [key, parseForYear(csvTexts[i], year)]),
    )

    const allCountries = new Set(
      [...maps.values()].flatMap((m) => [...m.keys()]),
    )

    const countries: Record<string, OwidEntry> = {}

    for (const country of allCountries) {
      const entry = {} as OwidEntry
      for (const { key } of SOURCES) {
        entry[key] = maps.get(key)?.get(country) ?? null
      }
      countries[country] = entry
    }

    const namesParam = new URL(req.url).searchParams.get('names')
    const allowList = namesParam
      ? new Set(namesParam.split(',').map((n) => n.trim()).filter(Boolean))
      : null

    const filtered = allowList
      ? Object.fromEntries(Object.entries(countries).filter(([name]) => allowList.has(name)))
      : countries

    const indicators = SOURCES.map((s) => s.key)
    const total = Object.keys(filtered).length
    const complete = Object.values(filtered).filter((e) =>
      indicators.every((k) => e[k] !== null),
    ).length

    const missingByIndicator = Object.fromEntries(
      indicators.map((k) => [
        k,
        Object.values(filtered).filter((e) => e[k] === null).length,
      ]),
    ) as Record<Indicator, number>

    const stats: Stats = { total, complete, missingByIndicator }

    return NextResponse.json({ countries: filtered, stats })
  } catch (err) {
    console.error('[owid]', err)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données OWID.' },
      { status: 502 },
    )
  }
}
