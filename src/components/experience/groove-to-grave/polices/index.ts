import localFont from 'next/font/local'

// Polices auto-hébergées, sous-ensemblées par scripts/g2g-polices.ts (bloc 6.1) : Archivo
// variable restreinte aux largeurs 75 à 100 % et graisses 400 à 900, les trois au jeu de
// caractères du site. Seule Archivo est préchargée ; les deux autres arrivent en swap.
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

export const lcd = localFont({
  src: './vt323.woff2',
  weight: '400',
  variable: '--g2g-font-lcd',
  display: 'swap',
  preload: false,
})
