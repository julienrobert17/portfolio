import localFont from 'next/font/local'

// Polices auto-hébergées, sous-ensemblées par scripts/g2g-polices.ts (bloc 6.1) : Archivo
// variable restreinte aux largeurs 75 à 100 % et graisses 400 à 900, les trois au jeu de
// caractères du site. Seule Archivo est préchargée ; les deux autres arrivent après coup.
export const archivo = localFont({
  src: './archivo.woff2',
  weight: '400 900',
  variable: '--g2g-font-archivo',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 100%' }],
})

export const marker = localFont({
  src: './permanent-marker.woff2',
  weight: '400',
  variable: '--g2g-font-marker',
  display: 'swap',
  preload: false,
})

// VT323 n'est pas déclarée ici : `next/font` envoie un en-tête `Link: rel=preload` pour toute
// police d'une route, même avec `preload: false`, ce qui la mettait sur le chemin critique. Elle
// est déclarée à la main dans g2g.css (@font-face « G2G LCD », fichier copié dans public/ par
// scripts/g2g-polices.ts) et n'est appliquée que sous `[data-js]` : le navigateur ne la demande
// qu'après l'hydratation, donc après le LCP (bloc 7.4c).
