import { flux } from '@/lib/entre-nous-a-distance/flux'
import { instantane, rejouer } from '@/lib/entre-nous-a-distance/evenements'
import { signeDeVie } from '@/lib/entre-nous-a-distance/salle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Déclaré explicitement plutôt que laissé au défaut de la plateforme.
 *
 * Le projet tourne sur Vercel Hobby avec Fluid Compute, dont le défaut mesuré
 * est de 300 s. L'écrire ici rend la valeur connaissable depuis le code, au
 * lieu d'un chiffre implicite qu'on redécouvre quand le flux se coupe.
 */
export const maxDuration = 300

/** On ferme nous-mêmes avant la limite, pour maîtriser la reprise. */
const MARGE_MS = 20_000

/**
 * Le flux d'événements d'une salle, en Server-Sent Events.
 *
 * Deux choses à savoir avant de toucher à ce fichier :
 *
 * · Le flux MEURT, toujours, au bout de quelques minutes — c'est la durée
 *   maximale d'une fonction serverless. La reconnexion n'est donc pas un cas
 *   d'erreur, c'est le fonctionnement normal. On ferme proprement un peu
 *   avant la limite, et on annonce l'échéance au client dès l'ouverture pour
 *   qu'il puisse se reconnecter avant d'être coupé.
 *
 * · Le champ `id:` d'un événement SSE devient le `Last-Event-ID` que le
 *   navigateur renverra tout seul à la reconnexion. Il ne doit donc porter
 *   que des identifiants réellement rejouables : un battement n'en a pas.
 */
export async function GET(requete: Request) {
  const url = new URL(requete.url)
  const code = (url.searchParams.get('salle') ?? '').trim().toUpperCase()
  const clientId = (url.searchParams.get('client') ?? '').trim()
  if (code === '' || clientId === '') {
    return new Response('salle ou client manquant', { status: 400 })
  }

  const etatInitial = await instantane(code)
  if (!etatInitial) return new Response('salle inconnue', { status: 404 })

  // Le navigateur renvoie l'en-tête tout seul ; le paramètre est le repli
  // pour un client qui reprend la main lui-même.
  const entete = requete.headers.get('last-event-id')
  const depuis = Number(entete ?? url.searchParams.get('depuis') ?? 0) || 0

  const ouvertureA = Date.now()
  const echeance = ouvertureA + maxDuration * 1000 - MARGE_MS
  const encodeur = new TextEncoder()

  const corps = new ReadableStream<Uint8Array>({
    async start(controleur) {
      let ferme = false
      const envoyer = (type: string, charge: unknown, id?: number) => {
        if (ferme) return
        const morceaux = [
          id !== undefined ? `id: ${id}\n` : '',
          `event: ${type}\n`,
          `data: ${JSON.stringify(charge)}\n\n`,
        ].join('')
        controleur.enqueue(encodeur.encode(morceaux))
      }

      requete.signal.addEventListener('abort', () => {
        ferme = true
      })

      envoyer('bienvenue', {
        transport: flux.nom,
        ouvertureA,
        echeance,
        dureeMaxMs: maxDuration * 1000,
        margeMs: MARGE_MS,
      })

      // ── Rattrapage : incrémental si on peut, instantané sinon ──
      let dernierId = depuis
      const rejeu = await rejouer(code, depuis)
      if (rejeu === null) {
        const etat = await instantane(code)
        envoyer('instantane', etat)
        const dernier = await rejouer(code, 0)
        dernierId = dernier && dernier.length > 0 ? dernier[dernier.length - 1].id : depuis
      } else {
        for (const e of rejeu) {
          envoyer(e.type, e.charge, e.id)
          dernierId = e.id
        }
        if (depuis === 0) envoyer('instantane', etatInitial)
      }

      // ── La boucle ──
      try {
        while (!ferme && !requete.signal.aborted && Date.now() < echeance) {
          await signeDeVie(code, clientId)
          const evenements = await flux.attendre(code, dernierId, requete.signal)
          if (evenements.length > 0) {
            for (const e of evenements) {
              envoyer(e.type, e.charge, e.id)
              dernierId = e.id
            }
          } else {
            // Pas d'`id` : un battement n'est pas rejouable.
            envoyer('battement', { a: Date.now(), resteMs: Math.max(0, echeance - Date.now()) })
          }
        }
        envoyer('fin', { raison: 'echeance', dernierId })
      } finally {
        ferme = true
        try {
          controleur.close()
        } catch {
          // Déjà fermé par l'abandon du client : rien à faire.
        }
      }
    },
  })

  return new Response(corps, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // Sans ça, certains intermédiaires tamponnent et le flux n'arrive
      // qu'à la fermeture — ce qui ressemble exactement à une panne.
      'x-accel-buffering': 'no',
    },
  })
}
