/**
 * Compare deux jeux de planches par page (dossiers `phase-A-<largeur>/` et `phase-B-<largeur>/`)
 * image par image : écart moyen par canal (0 à 255), part des pixels qui bougent de plus de 24
 * niveaux, et la bande verticale (en pixels CSS) où la différence commence et finit, pour
 * localiser ce qui a changé. Critère de non-régression de la Phase 7.3.
 *
 *   npx tsx scripts/g2g-diff-planches.ts --avant 6 --apres 7.3
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { RACINE } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const AVANT = arg('--avant', '6')
const APRES = arg('--apres', '7.3')
const PLANCHES = join(RACINE, 'docs/groove-to-grave/planches')

async function comparer(a: string, b: string, echelle: number): Promise<string> {
  const [ra, rb] = await Promise.all([sharp(a).raw().toBuffer({ resolveWithObject: true }), sharp(b).raw().toBuffer({ resolveWithObject: true })])
  if (ra.info.width !== rb.info.width) return `largeurs différentes (${ra.info.width} / ${rb.info.width})`
  const hauteur = Math.min(ra.info.height, rb.info.height)
  const c = ra.info.channels
  let somme = 0
  let mobiles = 0
  let premiere = -1
  let derniere = -1
  for (let y = 0; y < hauteur; y++) {
    let ligneBouge = false
    for (let x = 0; x < ra.info.width; x++) {
      const i = (y * ra.info.width + x) * c
      let d = 0
      for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(ra.data[i + k] - rb.data[i + k]))
      somme += d
      if (d > 24) {
        mobiles++
        ligneBouge = true
      }
    }
    if (ligneBouge) {
      if (premiere < 0) premiere = y
      derniere = y
    }
  }
  const px = hauteur * ra.info.width
  const hauteurs = ra.info.height === rb.info.height ? '' : ` ; hauteurs ${Math.round(ra.info.height / echelle)} → ${Math.round(rb.info.height / echelle)} px`
  const zone = premiere < 0 ? 'identique' : `de ${Math.round(premiere / echelle)} à ${Math.round(derniere / echelle)} px`
  return `${(somme / px).toFixed(2)} | ${((mobiles / px) * 100).toFixed(2)} % | ${zone}${hauteurs}`
}

async function main(): Promise<void> {
  const lignes = ['| Format | Page | Écart moyen | Pixels mobiles | Zone qui change |', '|---|---|---|---|---|']
  for (const [largeur, echelle] of [[1440, 1], [390, 2]] as const) {
    const da = join(PLANCHES, `phase-${AVANT}-${largeur}`)
    const db = join(PLANCHES, `phase-${APRES}-${largeur}`)
    for (const nom of readdirSync(db).filter((n) => n.endsWith('.jpg')).sort()) {
      const a = join(da, nom)
      lignes.push(`| ${largeur} | ${nom} | ${existsSync(a) ? await comparer(a, join(db, nom), echelle) : 'absente en ' + AVANT + ' | |'} |`)
    }
  }
  process.stdout.write(lignes.join('\n') + '\n')
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
