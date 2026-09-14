import { prisma } from '@/lib/prisma'
import type { FluxTransport } from './transport'
import type { Evenement, TypeEvenement } from './types'

/** Entre deux interrogations de la base. */
const PAS_MS = 700

/** Au-delà, on rend la main pour que l'appelant envoie un battement. */
const ATTENTE_MAX_MS = 15_000

function dormir(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resoudre) => {
    const t = setTimeout(fini, ms)
    function fini() {
      clearTimeout(t)
      signal.removeEventListener('abort', fini)
      resoudre()
    }
    signal.addEventListener('abort', fini, { once: true })
  })
}

/**
 * Le transport le plus simple qui marche : le serveur interroge la base en
 * boucle, le client reçoit du vrai push.
 *
 * C'est un mensonge utile — il n'y a pas de push jusqu'ici, seulement une
 * boucle. Mais le mensonge est entièrement contenu dans ce fichier, et le
 * remplacer par un pub/sub ne demandera de toucher à rien d'autre.
 *
 * Ce que ça coûte : la base reste réveillée tant qu'une salle est ouverte.
 * À l'échelle de deux personnes pendant vingt minutes, c'est sans importance ;
 * à plus grande échelle, c'est exactement la raison de passer au pub/sub.
 */
export const transportSondage: FluxTransport = {
  nom: 'sondage-base',

  async attendre(salleCode, depuis, signal) {
    const limite = Date.now() + ATTENTE_MAX_MS
    while (!signal.aborted && Date.now() < limite) {
      const lignes = await prisma.evenement.findMany({
        where: { salleCode, id: { gt: depuis } },
        orderBy: { id: 'asc' },
        take: 50,
      })
      if (lignes.length > 0) {
        return lignes.map(
          (l): Evenement => ({ id: l.id, type: l.type as TypeEvenement, charge: l.charge }),
        )
      }
      await dormir(PAS_MS, signal)
    }
    return []
  },

  async publier() {
    // Sans effet : le sondeur trouvera l'événement de lui-même. C'est
    // précisément ce que l'implémentation pub/sub remplira.
  },
}
