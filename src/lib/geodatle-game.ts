import type { CountryData } from './geodatle-data'

export type NumericResult = 'similar' | 'close' | 'far'
export type Direction = 'up' | 'down' | 'none'

export type NumericCell = { result: NumericResult; direction: Direction }

export type GuessResult = {
  name: string
  flag: string
  values: {
    continent: string
    population: number
    area: number
    poverty: number | null
    lifeExpectancy: number
    meatSupply: number
    co2PerCapita: number
    fertilityRate: number
  }
  results: {
    continent: 'correct' | 'wrong'
    population: NumericCell
    area: NumericCell
    poverty: NumericCell | 'unknown'
    lifeExpectancy: NumericCell
    meatSupply: NumericCell
    co2PerCapita: NumericCell
    fertilityRate: NumericCell
  }
}

export type GameStatus = 'playing' | 'won' | 'lost'

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i)
  }
  return hash
}

export function getDailyCountry(countries: CountryData[], debugMode?: boolean): CountryData {
  if (debugMode) return countries[Math.floor(Math.random() * countries.length)]
  const seed = new Date().toISOString().slice(0, 10)
  const index = hashCode(seed) % countries.length
  return countries[index]
}

const THRESHOLDS = {
  population:     { similar: 0.15, close: 0.25 },
  area:           { similar: 0.15, close: 0.25 },
  lifeExpectancy: { similar: 3,    close: 8    },
  poverty:        { similar: 5,    close: 15   },
  meatSupply:     { similar: 0.15, close: 0.25 },
  co2PerCapita:   { similar: 0.15, close: 0.25 },
  fertilityRate:  { similar: 0.3,  close: 0.8  },
}

type IndicatorKey = keyof typeof THRESHOLDS
type DiffMode = 'percent' | 'absolute'

const DIFF_MODE: Record<IndicatorKey, DiffMode> = {
  population:     'percent',
  area:           'percent',
  lifeExpectancy: 'absolute',
  poverty:        'absolute',
  meatSupply:     'percent',
  co2PerCapita:   'percent',
  fertilityRate:  'absolute',
}

function compareIndicator(guess: number, target: number, key: IndicatorKey): NumericCell {
  const { similar, close } = THRESHOLDS[key]
  const diff = DIFF_MODE[key] === 'percent'
    ? Math.abs(guess - target) / target
    : Math.abs(guess - target)

  const result: NumericResult = diff <= similar ? 'similar' : diff <= close ? 'close' : 'far'
  const direction: Direction = guess === target ? 'none' : guess < target ? 'up' : 'down'

  return { result, direction }
}

export function evaluateGuess(guess: CountryData, target: CountryData): GuessResult {
  return {
    name: guess.name,
    flag: guess.flag,
    values: {
      continent: guess.continent,
      population: guess.population,
      area: guess.area,
      poverty: guess.poverty,
      lifeExpectancy: guess.lifeExpectancy,
      meatSupply: guess.meatSupply,
      co2PerCapita: guess.co2PerCapita,
      fertilityRate: guess.fertilityRate,
    },
    results: {
      continent: guess.continent === target.continent ? 'correct' : 'wrong',
      population: compareIndicator(guess.population, target.population, 'population'),
      area: compareIndicator(guess.area, target.area, 'area'),
      poverty: guess.poverty === null || target.poverty === null
        ? 'unknown'
        : compareIndicator(guess.poverty, target.poverty, 'poverty'),
      lifeExpectancy: compareIndicator(guess.lifeExpectancy, target.lifeExpectancy, 'lifeExpectancy'),
      meatSupply: compareIndicator(guess.meatSupply, target.meatSupply, 'meatSupply'),
      co2PerCapita: compareIndicator(guess.co2PerCapita, target.co2PerCapita, 'co2PerCapita'),
      fertilityRate: compareIndicator(guess.fertilityRate, target.fertilityRate, 'fertilityRate'),
    },
  }
}

export function isWin(result: GuessResult): boolean {
  const r = result.results
  if (r.continent !== 'correct') return false
  const numerics: (NumericCell | 'unknown')[] = [
    r.population, r.area, r.lifeExpectancy, r.meatSupply, r.co2PerCapita, r.fertilityRate,
  ]
  if (r.poverty !== 'unknown') numerics.push(r.poverty)
  return numerics.every((c) => c !== 'unknown' && (c as NumericCell).result === 'similar')
}
