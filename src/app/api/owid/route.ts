import { NextResponse } from 'next/server'
import { getOwidData, SOURCES, type Indicator } from '@/lib/owid-data'

export const revalidate = 86400

type Stats = {
  total: number
  complete: number
  missingByIndicator: Record<Indicator, number>
}

export async function GET() {
  try {
    const countries = await getOwidData()

    const indicators = SOURCES.map((s) => s.key)
    const total = Object.keys(countries).length
    const complete = Object.values(countries).filter((e) =>
      indicators.every((k) => e[k] !== null),
    ).length

    const missingByIndicator = Object.fromEntries(
      indicators.map((k) => [
        k,
        Object.values(countries).filter((e) => e[k] === null).length,
      ]),
    ) as Record<Indicator, number>

    const stats: Stats = { total, complete, missingByIndicator }

    return NextResponse.json({ countries, stats })
  } catch (err) {
    console.error('[owid]', err)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données OWID.' },
      { status: 502 },
    )
  }
}
