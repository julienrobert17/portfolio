import { getCountriesData } from './countries-data'
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

export async function getGeoDateData(): Promise<CountryData[]> {
  const restCountries = await getCountriesData()
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
