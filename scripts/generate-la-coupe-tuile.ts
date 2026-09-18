/**
 * Génère l'image de la tuile « La Coupe » du carrousel du portfolio :
 * la maquette axonométrique blanche sur papier, tranchée à mi-hauteur par la
 * face de coupe terre cuite. Même géométrie que le SVG du hero et l'image
 * Open Graph (canvas/maquette-faces.ts). Format 3:2, cadré pour une carte
 * de 380 px de haut affichée en cover.
 *   npx tsx scripts/generate-la-coupe-tuile.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { geometrieMaquette, polygone } from '../src/components/experience/la-coupe/canvas/maquette-faces'

const LARGEUR = 1200
const HAUTEUR = 800
const FILLS = { haut: '#f3f0ea', est: '#e9e4dc', sud: '#dcd5c9', ombre: '#c9c3b8', coupe: '#b5452d' } as const

// Tranchée à 4,4 m : le rez-de-chaussée entier, l'étage coupé à mi-hauteur, le toit parti.
const g = geometrieMaquette({ coupe: 4.4 })
// La maquette occupe 70 % de la largeur, centrée, légèrement remontée pour laisser le dégradé de la carte en bas.
const echelle = (LARGEUR * 0.7) / g.viewBox.largeur
const tx = (LARGEUR - g.viewBox.largeur * echelle) / 2 - g.viewBox.minX * echelle
const ty = (HAUTEUR * 0.9 - g.viewBox.hauteur * echelle) / 2 - g.viewBox.minY * echelle

const faces = g.faces
  .map(
    (f) =>
      `<polygon points="${polygone(f.points)}" fill="${FILLS[f.teinte]}"${f.teinte === 'ombre' ? ' fill-opacity="0.45"' : f.teinte === 'coupe' ? ' stroke="#8e3421" stroke-width="0.8" stroke-linejoin="round"' : ' stroke="#151412" stroke-opacity="0.7" stroke-width="0.8" stroke-linejoin="round"'}/>`,
  )
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">
<rect width="${LARGEUR}" height="${HAUTEUR}" fill="#f3f0ea"/>
<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${echelle.toFixed(4)})" vector-effect="non-scaling-stroke">${faces}</g>
</svg>`

const dossier = join(process.cwd(), 'public/experience/la-coupe')
mkdirSync(dossier, { recursive: true })
writeFileSync(join(dossier, 'tuile.svg'), svg)
process.stdout.write(`tuile.svg écrite (${svg.length} octets)\n`)
