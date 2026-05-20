export const SOURCES = [
  { key: 'poverty',        url: 'https://ourworldindata.org/grapher/share-of-population-in-extreme-poverty.csv', year: 2019 },
  { key: 'lifeExpectancy', url: 'https://ourworldindata.org/grapher/life-expectancy.csv',                  year: 2022 },
  { key: 'meatSupply',     url: 'https://ourworldindata.org/grapher/meat-supply-per-person.csv',           year: 2021 },
  { key: 'co2PerCapita',   url: 'https://ourworldindata.org/grapher/co2-emissions-per-capita.csv',         year: 2022 },
  { key: 'fertilityRate',  url: 'https://ourworldindata.org/grapher/fertility-rate-complete-gapminder.csv', year: 2022 },
] as const

export type Indicator = (typeof SOURCES)[number]['key']
export type OwidEntry = Record<Indicator, number | null>

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

export async function getOwidData(names?: string[]): Promise<Record<string, OwidEntry>> {
  const allowList = names ? new Set(names) : null

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

  const countries: string[] = allowList
    ? [...allowList]
    : [...new Set([...maps.values()].flatMap((m) => [...m.keys()]))]

  const result: Record<string, OwidEntry> = {}

  for (const country of countries) {
    const entry = {} as OwidEntry
    for (const { key } of SOURCES) {
      entry[key] = maps.get(key)?.get(country) ?? null
    }
    result[country] = entry
  }

  return result
}
