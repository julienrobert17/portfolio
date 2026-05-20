import { NextResponse } from 'next/server'

export const revalidate = 86400

interface RawCountry {
  cca3: string
  name: { common: string }
  population: number
  area: number
  continents: string[]
  flags: { svg: string }
  latlng?: number[]
}

interface Country {
  code: string
  name: string
  population: number
  area: number
  continent: string
  flag: string
  lat: number
  lng: number
}

export async function GET() {
  const res = await fetch(
    'https://restcountries.com/v3.1/all?fields=name,population,area,continents,cca3,flags,latlng',
    { next: { revalidate: 86400 } },
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des pays.' }, { status: 502 })
  }

  const raw: RawCountry[] = await res.json()

  const countries: Country[] = raw
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

  return NextResponse.json(countries)
}
