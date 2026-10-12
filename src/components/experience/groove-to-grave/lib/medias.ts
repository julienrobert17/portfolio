/**
 * Origine des fichiers médias. **Par défaut, le CDN Sanity sert directement les images et les
 * extraits** : c'est la seule livraison validée sur iPhone (essais F, G et K du bloc 7.5b, sur
 * appareil réel). `G2G_MEDIAS_MEME_ORIGINE=1` fait passer les mêmes fichiers par une réécriture
 * Next (`/experience/groove-to-grave/media/<fichier>`, voir `next.config.ts`) : une seule origine
 * pour le document et ses médias, et plus de CORS à déclarer pour l'audio analysé. Cette option a
 * été le défaut pendant le bloc 7.5a et a été retirée : le cache de périphérie de Vercel mémorise
 * la **première** réponse d'une adresse, or la première requête d'iOS sur un média est une requête
 * de plage `bytes=0-1` ; l'adresse restait figée sur deux octets et le lecteur calait sans erreur.
 * `next.config.ts` interdit désormais la mise en cache de ce chemin, ce qui ferme le piège, mais
 * l'option reste à vérifier sur appareil avant d'être reprise (le jour du domaine du label).
 */

const PROJET = process.env.SANITY_PROJECT_ID ?? 'da2plce8'
const DATASET = process.env.SANITY_DATASET ?? 'production'

export const PREFIXE_CDN = `https://cdn.sanity.io/files/${PROJET}/${DATASET}/`
export const PREFIXE_LOCAL = '/experience/groove-to-grave/media/'
export const MEME_ORIGINE = process.env.G2G_MEDIAS_MEME_ORIGINE === '1'

/** URL servie au navigateur pour un fichier du CDN : telle quelle, ou réécrite sur notre origine. */
export function urlMedia(url: string): string {
  if (!MEME_ORIGINE || !url.startsWith(PREFIXE_CDN)) return url
  return PREFIXE_LOCAL + url.slice(PREFIXE_CDN.length)
}
