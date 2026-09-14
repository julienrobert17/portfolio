import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emettre, instantane } from '@/lib/entre-nous-a-distance/evenements'
import type { ConflitVersion, Phase } from '@/lib/entre-nous-a-distance/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PHASES: readonly Phase[] = ['lobby', 'jeu', 'couture', 'ordre', 'derniere', 'close']

interface Corps {
  code?: unknown
  clientId?: unknown
  version?: unknown
  action?: unknown
  charge?: unknown
}

/**
 * Toute écriture passe ici, et toute écriture porte la version sur laquelle
 * le client croit agir.
 *
 * C'est du contrôle de concurrence optimiste : si la version a bougé entre le
 * moment où le client a décidé et celui où il écrit, on refuse en 409 **avec
 * l'état courant**, pour qu'il puisse se remettre d'aplomb sans un second
 * aller-retour. Répondre juste « conflit » obligerait à redemander l'état,
 * c'est-à-dire à ajouter une latence au moment précis où on est déjà en retard.
 */
export async function POST(requete: Request) {
  const brut = (await requete.json().catch(() => ({}))) as Corps
  const code = typeof brut.code === 'string' ? brut.code.trim().toUpperCase() : ''
  const clientId = typeof brut.clientId === 'string' ? brut.clientId.trim() : ''
  const version = typeof brut.version === 'number' ? brut.version : NaN
  const action = typeof brut.action === 'string' ? brut.action : ''
  if (code === '' || clientId === '' || Number.isNaN(version) || action === '') {
    return NextResponse.json({ message: 'Requête incomplète.' }, { status: 400 })
  }

  const salle = await prisma.salle.findUnique({
    where: { code },
    include: { participants: true },
  })
  if (!salle) return NextResponse.json({ message: 'Salle inconnue.' }, { status: 404 })

  const moi = salle.participants.find((p) => p.clientId === clientId)
  if (!moi) return NextResponse.json({ message: 'Vous n’avez pas de place ici.' }, { status: 403 })

  // ── Le contrôle de version ──
  if (version !== salle.version) {
    const etat = await instantane(code)
    if (!etat) return NextResponse.json({ message: 'Salle inconnue.' }, { status: 404 })
    const conflit: ConflitVersion = {
      conflit: true,
      attendue: version,
      courante: salle.version,
      etat,
    }
    return NextResponse.json(conflit, { status: 409 })
  }

  switch (action) {
    case 'phase': {
      const voulue = (brut.charge as { phase?: unknown } | undefined)?.phase
      if (typeof voulue !== 'string' || !PHASES.includes(voulue as Phase)) {
        return NextResponse.json({ message: 'Phase inconnue.' }, { status: 400 })
      }
      // Les phases n'avancent que dans un sens : une demande de retour en
      // arrière n'est pas une erreur, c'est un client en retard. On l'ignore.
      const depuis = PHASES.indexOf(salle.phase as Phase)
      const vers = PHASES.indexOf(voulue as Phase)
      if (vers <= depuis) {
        const etat = await instantane(code)
        return NextResponse.json({ ignore: 'phase-en-arriere', etat })
      }
      await prisma.salle.update({ where: { code }, data: { phase: voulue } })
      await emettre(code, 'phase', { phase: voulue })
      break
    }
    case 'ping': {
      // Sert au panneau de debug à mesurer un aller-retour réel, et à
      // provoquer un conflit de version volontaire.
      await emettre(code, 'battement', { origine: moi.cote })
      break
    }
    default:
      return NextResponse.json({ message: 'Action inconnue.' }, { status: 400 })
  }

  const etat = await instantane(code)
  return NextResponse.json({ etat })
}
