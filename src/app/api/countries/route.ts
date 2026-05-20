import { NextResponse } from 'next/server'
import { getCountriesData } from '@/lib/countries-data'

export const revalidate = 86400

export async function GET() {
  try {
    const countries = await getCountriesData()
    return NextResponse.json(countries)
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pays.' },
      { status: 502 },
    )
  }
}
