import { prisma } from '@/lib/prisma'
import { emettreDans } from './evenements'
import { flux } from './flux'
import type { Cote } from './types'

export interface ReponseEntrante {
  questionId: string
  valeur?: unknown
  pari?: unknown
  passe?: boolean
}

export interface ResultatReponse {
  /** Vrai si cette écriture était la seconde : la révélation part avec. */
  revele: boolean
  /** Combien de côtés ont répondu à cette question, après l'écriture. */
  comptes: number
}

/**
 * Enregistre la réponse d'un côté, et décide — ou non — de révéler.
 *
 * TOUT SE JOUE DANS UNE SEULE TRANSACTION, et l'ordre compte :
 *
 *   1. `emettreDans` commence par un UPDATE sur la salle, qui prend un verrou
 *      de ligne. À partir de là, aucune autre écriture de cette salle ne peut
 *      s'intercaler.
 *   2. On écrit la réponse, en `upsert` : une écriture rejouée après une
 *      coupure ne crée pas de doublon et ne déclenche pas deux révélations.
 *   3. On compte. Comme on tient le verrou, le compte est vrai au moment où on
 *      le lit et le restera jusqu'au commit.
 *
 * Sans ce verrou, deux validations simultanées liraient toutes les deux « 2 »
 * et émettraient chacune une révélation. Le client ne peut pas arbitrer ça :
 * il ne conclut jamais « on a tous les deux validé », il l'APPREND.
 *
 * L'événement `reponse` ne porte PAS la valeur — seulement le côté. C'est la
 * garantie de non-fuite, et elle est ici structurelle : la réponse de l'autre
 * ne quitte le serveur qu'au moment où les deux existent.
 */
export async function repondre(
  salleCode: string,
  cote: Cote,
  entrante: ReponseEntrante,
): Promise<ResultatReponse> {
  const resultat = await prisma.$transaction(async (tx) => {
    const donnees = {
      valeur: (entrante.valeur ?? null) as never,
      pari: (entrante.pari ?? null) as never,
      passe: entrante.passe === true,
    }
    await emettreDans(tx, salleCode, 'reponse', { cote, questionId: entrante.questionId })
    await tx.reponse.upsert({
      where: {
        salleCode_questionId_cote: { salleCode, questionId: entrante.questionId, cote },
      },
      create: { salleCode, questionId: entrante.questionId, cote, ...donnees },
      update: donnees,
    })

    const toutes = await tx.reponse.findMany({
      where: { salleCode, questionId: entrante.questionId },
    })
    if (toutes.length < 2) return { revele: false, comptes: toutes.length, dernierId: 0 }

    /*
     * Une réponse peut être réécrite — un POST rejoué après une coupure, ou
     * quelqu'un qui corrige. La révélation, elle, ne se produit qu'une fois :
     * la rejouer ferait réapparaître l'écran de révélation chez les deux,
     * comme un hoquet. On tient toujours le verrou, donc cette lecture est
     * sûre.
     */
    const dejaRevelee = await tx.evenement.findFirst({
      where: {
        salleCode,
        type: 'revelation',
        charge: { path: ['questionId'], equals: entrante.questionId },
      },
      select: { id: true },
    })
    if (dejaRevelee) return { revele: true, comptes: toutes.length, dernierId: 0 }

    const par = (c: Cote) => {
      const r = toutes.find((x) => x.cote === c)
      return r ? { valeur: r.valeur, pari: r.pari, passe: r.passe } : null
    }
    const dernierId = await emettreDans(tx, salleCode, 'revelation', {
      questionId: entrante.questionId,
      a: par('a'),
      b: par('b'),
    })
    return { revele: true, comptes: toutes.length, dernierId }
  })

  await flux.publier(salleCode, resultat.dernierId)
  return { revele: resultat.revele, comptes: resultat.comptes }
}

/** Les réponses d'une question, pour reconstruire un état après reconnexion. */
export async function reponsesDe(salleCode: string, questionId: string) {
  const lignes = await prisma.reponse.findMany({ where: { salleCode, questionId } })
  if (lignes.length < 2) return null
  const par = (c: Cote) => {
    const r = lignes.find((x) => x.cote === c)
    return r ? { valeur: r.valeur, pari: r.pari, passe: r.passe } : null
  }
  return { questionId, a: par('a'), b: par('b') }
}
