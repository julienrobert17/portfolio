import { getOwidData } from './owid-data'

export type CountryData = {
  code: string
  name: string
  flag: string
  continent: string
  population: number
  area: number
  lat: number
  lng: number
  poverty: number | null
  lifeExpectancy: number
  meatSupply: number
  co2PerCapita: number
  fertilityRate: number
}

type RestCountry = {
  code: string
  name: string
  flag: string
  continent: string
  population: number
  area: number
  lat: number
  lng: number
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function getCountryleData(): Promise<CountryData[]> {
  const countriesRes = await fetch(`${BASE_URL}/api/countries`, {
    next: { revalidate: 86400 },
  })
  if (!countriesRes.ok) throw new Error('Failed to fetch /api/countries')
  const restCountries: RestCountry[] = await countriesRes.json()

  const names = restCountries.map((c) => c.name)
  const owidMap = await getOwidData(names)

  const result: CountryData[] = []

  for (const country of restCountries) {
    if (country.population <= 1_000_000) continue

    const owid = owidMap[country.name]
    if (!owid) continue

    const { poverty, lifeExpectancy, meatSupply, co2PerCapita, fertilityRate } = owid
    if (
      lifeExpectancy === null ||
      meatSupply === null ||
      co2PerCapita === null ||
      fertilityRate === null
    ) continue

    result.push({
      code: country.code,
      name: country.name,
      flag: country.flag,
      continent: country.continent,
      population: country.population,
      area: country.area,
      lat: country.lat,
      lng: country.lng,
      poverty,
      lifeExpectancy,
      meatSupply,
      co2PerCapita,
      fertilityRate,
    })
  }

  return result
}
