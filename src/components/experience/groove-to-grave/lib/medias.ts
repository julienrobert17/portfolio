/**
 * Origine des fichiers médias. Depuis le bloc 7.5a, **les médias passent par notre propre origine**
 * (réécriture Next `/experience/groove-to-grave/media/<fichier>` → CDN Sanity, voir
 * `next.config.ts`) : le navigateur n'a plus qu'une origine à ouvrir, et surtout l'audio analysé
 * par Web Audio n'est plus une ressource d'une autre origine. Raison : sur iPhone (WebKit), aucun
 * extrait ne démarre alors que le moteur tourne ; le CDN sert pourtant correctement le CORS et les
 * requêtes Range (vérifié), donc la cause n'est pas prouvée, mais la livraison par une autre origine
 * est le seul candidat que nous pouvons retirer sans rien coûter (mesuré sans perte au bloc 7.4b).
 * `G2G_MEDIAS_MEME_ORIGINE=0` remet la livraison directe par le CDN, pour comparer.
 */
const PROJET = process.env.SANITY_PROJECT_ID ?? 'da2plce8'
const DATASET = process.env.SANITY_DATASET ?? 'production'

export const PREFIXE_CDN = `https://cdn.sanity.io/files/${PROJET}/${DATASET}/`
export const PREFIXE_LOCAL = '/experience/groove-to-grave/media/'
export const MEME_ORIGINE = process.env.G2G_MEDIAS_MEME_ORIGINE !== '0'

/** URL servie au navigateur pour un fichier du CDN : telle quelle, ou réécrite sur notre origine. */
export function urlMedia(url: string): string {
  if (!MEME_ORIGINE || !url.startsWith(PREFIXE_CDN)) return url
  return PREFIXE_LOCAL + url.slice(PREFIXE_CDN.length)
}
