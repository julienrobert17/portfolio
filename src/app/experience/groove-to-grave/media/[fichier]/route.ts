import { type NextRequest } from 'next/server'

/** Préfixe des fichiers du CDN Sanity : seuls ceux-là sont relayés. */
const PROJET = process.env.SANITY_PROJECT_ID ?? 'da2plce8'
const DATASET = process.env.SANITY_DATASET ?? 'production'
const PREFIXE = `https://cdn.sanity.io/files/${PROJET}/${DATASET}/`
/** Les noms de fichiers de Sanity sont des empreintes hexadécimales : rien d'autre ne passe. */
const NOM = /^[0-9a-f]{8,}\.[a-z0-9]{2,5}$/
const ENTETES_RELAYEES = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']

/**
 * Relais des médias sur notre propre origine (option `G2G_MEDIAS_MEME_ORIGINE=1`, bloc 7.5b).
 * Il remplace la réécriture Next, qui ne permettait pas de maîtriser les en-têtes de cache : le
 * cache de périphérie gardait la **première** réponse d'une adresse, et comme iOS commence par
 * demander `bytes=0-1`, l'adresse restait figée sur deux octets — le lecteur calait sans erreur,
 * sans message, sans rien. Ici, une réponse partielle n'est **jamais** mise en cache, une réponse
 * complète l'est pour un an : la première sonde d'iOS ne peut plus empoisonner le fichier.
 * Par défaut le site ne passe pas par ici (le CDN sert directement) ; cette route existe pour le
 * jour où les médias devront venir du domaine du label.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ fichier: string }> }): Promise<Response> {
  const { fichier } = await params
  if (!NOM.test(fichier)) return new Response('nom de fichier refusé', { status: 400 })
  const plage = req.headers.get('range')
  const amont = await fetch(PREFIXE + fichier, { headers: plage ? { Range: plage } : {}, cache: 'no-store' })
  if (!amont.ok && amont.status !== 206) return new Response('fichier introuvable', { status: amont.status })
  const entetes = new Headers()
  for (const nom of ENTETES_RELAYEES) {
    const valeur = amont.headers.get(nom)
    if (valeur) entetes.set(nom, valeur)
  }
  // Seule une réponse complète est mise en cache : une partielle resservie à tous serait fatale.
  entetes.set('Cache-Control', amont.status === 206 ? 'no-store' : 'public, max-age=31536000, immutable')
  return new Response(amont.body, { status: amont.status, headers: entetes })
}
