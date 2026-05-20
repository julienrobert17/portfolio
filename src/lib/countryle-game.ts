import type { CountryData } from './countryle'

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
    population: 'correct' | 'higher' | 'lower'
    area: 'correct' | 'higher' | 'lower'
    poverty: 'correct' | 'higher' | 'lower' | 'unknown'
    lifeExpectancy: 'correct' | 'higher' | 'lower'
    meatSupply: 'correct' | 'higher' | 'lower'
    co2PerCapita: 'correct' | 'higher' | 'lower'
    fertilityRate: 'correct' | 'higher' | 'lower'
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
  // const seed = new Date().toLocaleDateString('en-CA')
  // const index = hashCode(seed) % countries.length
  const index = 42
  return countries[index]
}

type NumericResult = 'correct' | 'higher' | 'lower'

function compareNumeric(guess: number, target: number): NumericResult {
  if (Math.abs(guess - target) / target < 0.1) return 'correct'
  return target > guess ? 'higher' : 'lower'
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
      population: compareNumeric(guess.population, target.population),
      area: compareNumeric(guess.area, target.area),
      poverty: guess.poverty === null || target.poverty === null
        ? 'unknown'
        : compareNumeric(guess.poverty, target.poverty),
      lifeExpectancy: compareNumeric(guess.lifeExpectancy, target.lifeExpectancy),
      meatSupply: compareNumeric(guess.meatSupply, target.meatSupply),
      co2PerCapita: compareNumeric(guess.co2PerCapita, target.co2PerCapita),
      fertilityRate: compareNumeric(guess.fertilityRate, target.fertilityRate),
    },
  }
}

export function isWin(result: GuessResult): boolean {
  return Object.values(result.results).every((v) => v === 'correct')
}
