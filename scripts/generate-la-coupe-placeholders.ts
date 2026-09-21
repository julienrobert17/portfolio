/**
 * Génère les images placeholder de « la Coupe » dans public/experience/la-coupe/img.
 *   npx tsx scripts/generate-la-coupe-placeholders.ts
 * À relancer quand content/projets.ts ou content/site.ts change.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { projets } from '../src/components/experience/la-coupe/content/projets'
import { imagesAtelier } from '../src/components/experience/la-coupe/content/site'
import { imageAtelier, imageProjet, nomFichier } from '../src/components/experience/la-coupe/lib/images'
import { placeholderSvg } from '../src/components/experience/la-coupe/lib/placeholder-svg'

const dossier = join(process.cwd(), 'public/experience/la-coupe/img')
mkdirSync(dossier, { recursive: true })
let n = 0

for (const projet of projets) {
  projet.images.forEach((_, i) => {
    const image = imageProjet(projet, i)
    writeFileSync(join(dossier, nomFichier(image.src)), placeholderSvg({ ...image, teinte: projet.teinte, variante: i }))
    n++
  })
}

Object.entries(imagesAtelier).forEach(([id, contenu], i) => {
  const image = imageAtelier(id, contenu)
  writeFileSync(join(dossier, nomFichier(image.src)), placeholderSvg({ ...image, teinte: 28, variante: i }))
  n++
})

process.stdout.write(`${n} placeholders écrits dans ${dossier}\n`)
