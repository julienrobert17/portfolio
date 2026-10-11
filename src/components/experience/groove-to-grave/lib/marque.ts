/**
 * Constantes de marque, hors contenu éditable : le nom du label et ses écritures. Utilisées par
 * les composants client (lecteur, bande défilante), qui ne lisent pas Sanity.
 */
export const MARQUE = {
  nom: 'Groove To Grave Records',
  court: 'G2G',
  prefixeCatalogue: 'GTGR',
  /** Lien Bandcamp du label, repli de la barre statique sans JavaScript. */
  bandcamp: 'https://groovetograve.bandcamp.com/music',
} as const
