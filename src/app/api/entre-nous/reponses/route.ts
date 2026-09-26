import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Toutes les réponses révélées d'une salle.
 *
 * Les révélations reçues par le flux ne vivent qu'en mémoire du client : après
 * un rechargement — et iOS en provoque — elles sont perdues, et l'ordre du
 * jour final serait vide. C'est donc le serveur qui les rend.
 *
 * LA GARANTIE DE NON-FUITE TIENT ICI AUSSI : on ne rend que les questions où
 * les DEUX côtés ont répondu. Une question à laquelle un seul a validé reste
 * invisible, exactement comme dans le flux.
 */
export async function GET(requete: Request) {
  const code = (new URL(requete.url).searchParams.get('code') ?? '').trim().toUpperCase()
  if (code === '') return NextResponse.json({ message: 'Code manquant.' }, { status: 400 })

  const lignes = await prisma.reponse.findMany({ where: { salleCode: code } })
  const parQuestion = new Map<string, typeof lignes>()
  for (const l of lignes) {
    const deja = parQuestion.get(l.questionId) ?? []
    deja.push(l)
    parQuestion.set(l.questionId, deja)
  }

  const revelees: Record<string, { a: unknown; b: unknown }> = {}
  for (const [questionId, paire] of parQuestion) {
    if (paire.length < 2) continue
    const par = (cote: string) => {
      const r = paire.find((x) => x.cote === cote)
      return r ? { valeur: r.valeur, pari: r.pari, passe: r.passe } : null
    }
    revelees[questionId] = { a: par('a'), b: par('b') }
  }
  return NextResponse.json(revelees)
}
