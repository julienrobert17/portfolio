/**
 * Origine des fichiers médias (bloc 7.4b). Par défaut le site sert les images et les extraits
 * directement depuis le CDN Sanity. Avec `G2G_MEDIAS_MEME_ORIGINE=1`, les mêmes fichiers passent
 * par une réécriture Next (`/experience/groove-to-grave/media/<fichier>` → CDN, voir
 * `next.config.ts`) : une seule origine pour le document et ses médias, donc pas de connexion
 * supplémentaire à ouvrir avant l'image LCP, et plus besoin de déclarer d'origine dans les CORS
 * Sanity pour l'audio analysé. Variante mesurée au bloc 7.4b, gardée paramétrable.
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
