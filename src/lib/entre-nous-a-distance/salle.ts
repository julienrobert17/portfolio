import { prisma } from '@/lib/prisma'
import { emettre, instantane } from './evenements'
import { BAIL_MS, SALLE_MS } from './types'
import type { Cote, EtatSalle } from './types'

/**
 * Sans I, L, O ni chiffres : un code se dicte à voix haute par-dessus une
 * table, et « un-i-elle-zéro » n'est pas un code, c'est une dispute.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const LONGUEUR = 4

function codeAuHasard(): string {
  let code = ''
  for (let i = 0; i < LONGUEUR; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export type Echec = 'inconnue' | 'complete' | 'expiree'

export class ErreurSalle extends Error {
  constructor(readonly raison: Echec) {
    super(raison)
  }
}

/** Crée une salle et y installe son premier occupant, côté `a`. */
export async function creerSalle(nom: string, clientId: string): Promise<EtatSalle> {
  for (let essai = 0; essai < 8; essai += 1) {
    const code = codeAuHasard()
    const existe = await prisma.salle.findUnique({ where: { code }, select: { code: true } })
    if (existe) continue
    await prisma.salle.create({
      data: {
        code,
        graine: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
        expireA: new Date(Date.now() + SALLE_MS),
        participants: { create: { cote: 'a', nom, clientId } },
      },
    })
    await emettre(code, 'participant', { cote: 'a', nom, arrive: true })
    const etat = await instantane(code)
    if (etat) return etat
  }
  throw new ErreurSalle('inconnue')
}

/**
 * Prend une place dans une salle.
 *
 * Une place est un BAIL, pas une propriété. Quatre cas, dans cet ordre :
 *
 *   1. C'est ma place — je reviens, je la reprends, quel que soit le temps
 *      écoulé. Un rafraîchissement ne doit jamais coûter sa place.
 *   2. Il reste une place libre — je la prends.
 *   3. Les deux places sont prises mais l'une est silencieuse depuis plus que
 *      la durée du bail — je la reprends. C'est ce qui permet de revenir
 *      depuis un autre appareil, ou après avoir vidé son navigateur.
 *   4. Sinon la salle est complète, et c'est un refus net : elle a deux
 *      places, pas deux places et un strapontin.
 */
export async function rejoindre(
  code: string,
  nom: string,
  clientId: string,
): Promise<{ etat: EtatSalle; cote: Cote; repriseDeBail: boolean }> {
  const resultat = await prisma.$transaction(async (tx) => {
    const salle = await tx.salle.findUnique({
      where: { code },
      include: { participants: true },
    })
    if (!salle) throw new ErreurSalle('inconnue')
    if (salle.expireA.getTime() < Date.now()) throw new ErreurSalle('expiree')

    const mienne = salle.participants.find((p) => p.clientId === clientId)
    if (mienne) {
      await tx.participant.update({ where: { id: mienne.id }, data: { nom, vuA: new Date() } })
      return { cote: mienne.cote as Cote, repriseDeBail: false, nouveau: false }
    }

    const prises = new Set(salle.participants.map((p) => p.cote))
    const libre = (['a', 'b'] as const).find((c) => !prises.has(c))
    if (libre) {
      await tx.participant.create({ data: { salleCode: code, cote: libre, nom, clientId } })
      return { cote: libre, repriseDeBail: false, nouveau: true }
    }

    const perimee = salle.participants.find((p) => Date.now() - p.vuA.getTime() > BAIL_MS)
    if (perimee) {
      await tx.participant.update({
        where: { id: perimee.id },
        data: { nom, clientId, vuA: new Date() },
      })
      return { cote: perimee.cote as Cote, repriseDeBail: true, nouveau: false }
    }

    throw new ErreurSalle('complete')
  })

  if (resultat.nouveau || resultat.repriseDeBail) {
    await emettre(code, 'participant', {
      cote: resultat.cote,
      nom,
      arrive: true,
      repriseDeBail: resultat.repriseDeBail,
    })
  }
  const etat = await instantane(code)
  if (!etat) throw new ErreurSalle('inconnue')
  return { etat, cote: resultat.cote, repriseDeBail: resultat.repriseDeBail }
}

/**
 * Renouvelle un bail. Appelé à chaque battement du flux.
 *
 * Rend `true` si la place était considérée comme absente : l'appelant émet
 * alors un événement, pour que l'autre côté voie le retour.
 */
export async function signeDeVie(code: string, clientId: string): Promise<boolean> {
  const p = await prisma.participant.findFirst({
    where: { salleCode: code, clientId },
    select: { id: true, cote: true, nom: true, vuA: true },
  })
  if (!p) return false
  const etaitAbsent = Date.now() - p.vuA.getTime() > BAIL_MS
  await prisma.participant.update({ where: { id: p.id }, data: { vuA: new Date() } })
  if (etaitAbsent) {
    await emettre(code, 'participant', { cote: p.cote, nom: p.nom, arrive: true, retour: true })
  }
  return etaitAbsent
}
