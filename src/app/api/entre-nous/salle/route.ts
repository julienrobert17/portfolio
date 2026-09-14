import { NextResponse } from 'next/server'
import { ErreurSalle, creerSalle, rejoindre } from '@/lib/entre-nous-a-distance/salle'
import { instantane } from '@/lib/entre-nous-a-distance/evenements'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Corps {
  nom?: unknown
  code?: unknown
  clientId?: unknown
}

function lire(corps: Corps): { nom: string; clientId: string; code?: string } | null {
  const nom = typeof corps.nom === 'string' ? corps.nom.trim() : ''
  const clientId = typeof corps.clientId === 'string' ? corps.clientId.trim() : ''
  if (nom === '' || clientId === '') return null
  const code = typeof corps.code === 'string' ? corps.code.trim().toUpperCase() : undefined
  return { nom, clientId, ...(code ? { code } : {}) }
}

const MESSAGES: Record<string, { statut: number; message: string }> = {
  inconnue: { statut: 404, message: 'Ce code ne correspond à aucune salle.' },
  expiree: { statut: 410, message: 'Cette salle a expiré.' },
  complete: { statut: 409, message: 'Cette salle est complète. Elle a deux places.' },
}

/**
 * L'état courant d'une salle.
 *
 * Le flux suffit au fonctionnement normal ; cette route est le chemin de
 * rattrapage, quand un client préfère redemander la vérité plutôt que de la
 * recomposer à partir d'événements. Recomposer est toujours plus rapide et
 * toujours plus facile à faire dériver.
 */
export async function GET(requete: Request) {
  const code = (new URL(requete.url).searchParams.get('code') ?? '').trim().toUpperCase()
  if (code === '') return NextResponse.json({ message: 'Code manquant.' }, { status: 400 })
  const etat = await instantane(code)
  if (!etat) return NextResponse.json({ message: 'Salle inconnue.' }, { status: 404 })
  return NextResponse.json(etat)
}

/** Créer une salle. */
export async function POST(requete: Request) {
  const corps = lire((await requete.json().catch(() => ({}))) as Corps)
  if (!corps) return NextResponse.json({ message: 'Nom ou client manquant.' }, { status: 400 })
  const etat = await creerSalle(corps.nom, corps.clientId)
  return NextResponse.json({ etat, cote: 'a' })
}

/** Rejoindre une salle existante. */
export async function PUT(requete: Request) {
  const corps = lire((await requete.json().catch(() => ({}))) as Corps)
  if (!corps?.code) return NextResponse.json({ message: 'Code manquant.' }, { status: 400 })
  try {
    const { etat, cote, repriseDeBail } = await rejoindre(corps.code, corps.nom, corps.clientId)
    return NextResponse.json({ etat, cote, repriseDeBail })
  } catch (erreur) {
    if (erreur instanceof ErreurSalle) {
      const m = MESSAGES[erreur.raison]
      return NextResponse.json({ message: m.message, raison: erreur.raison }, { status: m.statut })
    }
    throw erreur
  }
}
