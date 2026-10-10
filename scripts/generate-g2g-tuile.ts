/**
 * Génère l'image de la tuile « Groove To Grave » du carrousel du portfolio, dans l'esprit de
 * generate-la-coupe-tuile.ts : le monogramme G2G (tracé provisoire, ui/logos/traces.ts) et une
 * cassette aux couleurs de la dernière sortie, sur le papier du mur, palette du site
 * (tokens.ts). Format carré : la carte du carrousel fait 380 px de haut pour 300 à 600 px de
 * large et s'affiche en cover, donc tout tient dans 62 % de la largeur et dans la moitié haute,
 * au-dessus du dégradé qui porte le texte. Aucune œuvre du label n'est reprise.
 *   npx tsx scripts/generate-g2g-tuile.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { couleurs as pochettes } from '../src/components/experience/groove-to-grave/content/couleurs'
import { traces } from '../src/components/experience/groove-to-grave/ui/logos/traces'
import { couleurs } from '../src/components/experience/groove-to-grave/tokens'

const LARGEUR = 1000
const HAUTEUR = 1000
const derniere = pochettes.gtgr05
const coque = derniere?.dominant ?? couleurs.chrome
const bande = derniere?.accent ?? couleurs.red
const texteBande = (derniere?.contrasteInk.accent ?? 1) >= 3 ? couleurs.ink : couleurs.poster

// Cassette : les proportions du composant (200 × 128), à l'échelle 2,9, centrée, tournée de −3°.
const cassette = `<g transform="translate(210 230) rotate(-3) scale(2.9)">
  <rect x="2" y="2" width="196" height="124" rx="8" fill="${coque}" stroke="${couleurs.ink}" stroke-width="2.5"/>
  ${[11, 189].flatMap((cx) => [11, 117].map((cy) => `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${couleurs.ink}"/>`)).join('')}
  <rect x="16" y="10" width="168" height="68" rx="3" fill="${couleurs.poster}" stroke="${couleurs.ink}" stroke-width="1.2"/>
  <rect x="16" y="10" width="168" height="13" fill="${bande}"/>
  <text x="22" y="20.5" font-size="10" font-weight="800" fill="${texteBande}" font-family="Archivo, Helvetica Neue, Arial, sans-serif" letter-spacing="0.3">GTGR05</text>
  <text x="178" y="20.5" text-anchor="end" font-size="10" font-weight="800" fill="${texteBande}" font-family="Archivo, Helvetica Neue, Arial, sans-serif">A</text>
  <text x="22" y="40" font-size="13" fill="${couleurs.ink}" font-family="Permanent Marker, Marker Felt, cursive">Groove To Grave</text>
  <text x="22" y="53" font-size="10" fill="${couleurs.ink}" font-family="Permanent Marker, Marker Felt, cursive">du sillon à la tombe</text>
  <rect x="52" y="56" width="96" height="18" rx="9" fill="${couleurs.ink}"/>
  ${[72, 128].map((cx) => `<circle cx="${cx}" cy="65" r="7" fill="${couleurs.poster}"/><path d="M${cx} 58.5v13M${cx - 5.6} 61.8l11.2 6.4M${cx - 5.6} 68.2l11.2-6.4" stroke="${couleurs.ink}" stroke-width="1.6"/>`).join('')}
  <polygon points="42,126 54,96 146,96 158,126" fill="${coque}" stroke="${couleurs.ink}" stroke-width="1.5"/>
  <circle cx="72" cy="112" r="4" fill="${couleurs.ink}"/><circle cx="128" cy="112" r="4" fill="${couleurs.ink}"/>
</g>`

// Monogramme en haut à gauche, 150 px de haut, et un sticker « no repress » posé sur la cassette.
const mono = traces.monogramme
const [, , mw, mh] = mono.viewBox.split(' ').map(Number)
const echelleMono = 150 / mh
const monogramme = `<g transform="translate(70 60) scale(${echelleMono.toFixed(4)})"><g transform="${mono.transform}"><path d="${mono.d}" fill="${couleurs.ink}"/></g></g>`
const sticker = `<g transform="translate(690 205) rotate(8)"><rect x="-70" y="-22" width="140" height="44" rx="3" fill="${couleurs.greenDeep}" stroke="${couleurs.ink}" stroke-width="2"/><text x="0" y="7" text-anchor="middle" font-size="18" font-weight="800" letter-spacing="0.6" fill="${couleurs.poster}" font-family="Archivo, Helvetica Neue, Arial, sans-serif">NO REPRESS</text></g>`
// Lambeaux pâles du mur, abstraits, comme dans le shader.
const lambeaux = `<rect x="610" y="40" width="300" height="130" fill="${couleurs.lambeauRouge}" transform="rotate(-4 760 105)"/><rect x="40" y="330" width="220" height="110" fill="${couleurs.lambeauVert}" transform="rotate(3 150 385)"/>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">
<rect width="${LARGEUR}" height="${HAUTEUR}" fill="${couleurs.wall}"/>
${lambeaux}
${monogramme}
${cassette}
${sticker}
</svg>`

const dossier = join(process.cwd(), 'public/experience/groove-to-grave')
mkdirSync(dossier, { recursive: true })
writeFileSync(join(dossier, 'tuile.svg'), svg)
process.stdout.write(`tuile.svg écrite (${svg.length} octets, monogramme ${mw}×${mh})\n`)
