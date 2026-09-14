import { prisma } from '@/lib/prisma'
import { flux } from './flux'
import { BAIL_MS, FENETRE_REJEU } from './types'
import type { Cote, EtatSalle, Evenement, Phase, TypeEvenement } from './types'

/**
 * Écrit un événement ET incrémente la version de la salle, dans la même
 * transaction.
 *
 * Les deux sont indissociables : la version sert à refuser les écritures
 * périmées, donc elle ne doit jamais avancer sans qu'un événement le dise, ni
 * l'inverse. Les séparer, c'est laisser un client se croire à jour alors
 * qu'il a manqué quelque chose.
 */
export async function emettre(
  salleCode: string,
  type: TypeEvenement,
  charge: object,
): Promise<{ id: number; version: number }> {
  const resultat = await prisma.$transaction(async (tx) => {
    const salle = await tx.salle.update({
      where: { code: salleCode },
      data: { version: { increment: 1 } },
      select: { version: true },
    })
    const evenement = await tx.evenement.create({
      data: { salleCode, type, charge: charge as never },
      select: { id: true },
    })
    return { id: evenement.id, version: salle.version }
  })
  await flux.publier(salleCode, resultat.id)
  return resultat
}

/** L'état complet d'une salle : ce qu'on envoie quand on ne peut pas rejouer. */
export async function instantane(salleCode: string): Promise<EtatSalle | null> {
  const salle = await prisma.salle.findUnique({
    where: { code: salleCode },
    include: { participants: { orderBy: { cote: 'asc' } } },
  })
  if (!salle) return null
  const maintenant = Date.now()
  return {
    code: salle.code,
    graine: salle.graine,
    phase: salle.phase as Phase,
    index: salle.index,
    version: salle.version,
    places: salle.participants.map((p) => ({
      cote: p.cote as Cote,
      nom: p.nom,
      present: maintenant - p.vuA.getTime() < BAIL_MS,
    })),
  }
}

/**
 * Les événements postérieurs à `depuis`, ou `null` si on ne sait plus rejouer
 * — auquel cas l'appelant doit envoyer un instantané complet.
 *
 * Savoir dire « je ne sais pas » est la moitié du travail : un rattrapage
 * incomplet est pire qu'un instantané, parce qu'il a l'air d'avoir marché.
 */
export async function rejouer(
  salleCode: string,
  depuis: number,
): Promise<Evenement[] | null> {
  const plusAncien = await prisma.evenement.findFirst({
    where: { salleCode },
    orderBy: { id: 'asc' },
    select: { id: true },
  })
  // Rien n'a jamais été émis : il n'y a rien à rattraper, et c'est normal.
  if (!plusAncien) return []
  // Le client réclame une suite qu'on a déjà purgée.
  if (depuis > 0 && depuis < plusAncien.id - 1) return null

  const lignes = await prisma.evenement.findMany({
    where: { salleCode, id: { gt: depuis } },
    orderBy: { id: 'asc' },
    take: FENETRE_REJEU + 1,
  })
  // Trop de retard : un instantané coûtera moins cher et sera plus sûr.
  if (lignes.length > FENETRE_REJEU) return null
  return lignes.map((l) => ({ id: l.id, type: l.type as TypeEvenement, charge: l.charge }))
}
