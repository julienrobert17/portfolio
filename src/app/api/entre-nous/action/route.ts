import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emettre, instantane } from '@/lib/entre-nous-a-distance/evenements'
import { repondre } from '@/lib/entre-nous-a-distance/reponses'
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

  /*
   * ── Le contrôle de version, et ce à quoi il NE s'applique pas ──
   *
   * Une réponse est une écriture COMMUTATIVE : chaque côté écrit sa propre
   * ligne, identifiée par (salle, question, côté). Deux réponses n'entrent
   * jamais en conflit, et les soumettre au contrôle de version produit un
   * refus dans le cas le plus courant qui soit — A valide, la version bouge,
   * et la réponse de B rebondit alors qu'elle ne gênait personne.
   *
   * Le contrôle sert à ORDONNER la navigation (phase, index), où deux clients
   * peuvent vraiment se marcher dessus. Ce qui menace une réponse n'est pas
   * la version mais la question : si la salle est passée à la suivante
   * pendant qu'on répondait, la réponse n'a plus d'objet. C'est `repondre`
   * qui vérifie ça, sur l'index, et qui le dit clairement.
   */
  if (action !== 'repondre' && version !== salle.version) {
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
    case 'repondre': {
      const c = brut.charge as
        | { questionId?: unknown; valeur?: unknown; pari?: unknown; passe?: unknown }
        | undefined
      const questionId = typeof c?.questionId === 'string' ? c.questionId : ''
      if (questionId === '') {
        return NextResponse.json({ message: 'Question manquante.' }, { status: 400 })
      }
      const indexClient = typeof (c as { index?: unknown })?.index === 'number'
        ? (c as { index: number }).index
        : null
      if (indexClient !== null && indexClient !== salle.index) {
        const etatPasse = await instantane(code)
        return NextResponse.json(
          {
            refus: 'question-passee',
            indexClient,
            indexSalle: salle.index,
            etat: etatPasse,
          },
          { status: 409 },
        )
      }
      const r = await repondre(code, moi.cote as 'a' | 'b', {
        questionId,
        valeur: c?.valeur,
        pari: c?.pari,
        passe: c?.passe === true,
      })
      const etatApres = await instantane(code)
      return NextResponse.json({ etat: etatApres, revele: r.revele, comptes: r.comptes })
    }
    case 'index': {
      const vers = (brut.charge as { index?: unknown } | undefined)?.index
      if (typeof vers !== 'number' || !Number.isInteger(vers) || vers < 0) {
        return NextResponse.json({ message: 'Index invalide.' }, { status: 400 })
      }
      // Comme les phases : on n'avance jamais à reculons. Deux clients qui
      // touchent « Continuer » en même temps ne sautent pas deux questions.
      if (vers <= salle.index) {
        const etatIgnore = await instantane(code)
        return NextResponse.json({ ignore: 'index-en-arriere', etat: etatIgnore })
      }
      await prisma.salle.update({ where: { code }, data: { index: vers } })
      await emettre(code, 'index', { index: vers })
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
