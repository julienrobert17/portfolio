interface RawCountry {
  cca3: string
  name: { common: string }
  population: number
  area: number
  continents: string[]
  flags: { svg: string }
  latlng?: number[]
}

export interface RestCountry {
  code: string
  name: string
  population: number
  area: number
  continent: string
  flag: string
  lat: number
  lng: number
}

export async function getCountriesData(): Promise<RestCountry[]> {
  const res = await fetch(
    'https://restcountries.com/v3.1/all?fields=name,population,area,continents,cca3,flags,latlng',
    { next: { revalidate: 86400 } },
  )

  if (!res.ok) throw new Error('Failed to fetch REST Countries')

  const raw: RawCountry[] = await res.json()

  return raw
    .filter((c) => c.population > 1_000_000)
    .map((c) => ({
      code: c.cca3,
      name: c.name.common,
      population: Math.round(c.population / 1000) * 1000,
      area: Math.round(c.area),
      continent: c.continents[0],
      flag: c.flags.svg,
      lat: c.latlng?.[0] ?? 0,
      lng: c.latlng?.[1] ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
