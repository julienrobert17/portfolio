import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { BASE } from '@/components/experience/groove-to-grave/lib/routes'

/** Sortie du mode brouillon : retire le cookie et revient sur le site publié. */
export async function GET(): Promise<NextResponse> {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL(BASE, process.env.G2G_URL_SITE ?? 'https://portfolio-eight-sable-66.vercel.app'))
}
