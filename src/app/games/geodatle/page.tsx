import type { Metadata } from 'next'
import { getGeoDateData } from '@/lib/geodatle-data'
import { getDailyCountry } from '@/lib/geodatle-game'
import GameBoard from '@/components/games/geodatle/game-board'

export const metadata: Metadata = {
  title: 'Geodatle — Devine le pays du jour',
  description: 'Un jeu de géographie basé sur les données mondiales. Trouvez le pays mystère en 8 tentatives.',
}

export default async function CountrylePage({
  searchParams,
}: {
  searchParams: Promise<{ debug?: string }>
}) {
  const { debug } = await searchParams
  const debugMode = debug === 'true'

  const countries = await getGeoDateData()
  const target = getDailyCountry(countries, debugMode)

  return (
    <main style={{ background: '#0f1117', minHeight: '100dvh' }}>
      <GameBoard countries={countries} target={target} debugMode={debugMode} />
    </main>
  )
}
