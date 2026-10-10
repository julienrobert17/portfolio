/**
 * Captures « avant / après » du bloc 6.1 (polices sous-ensemblées) : le premier écran de trois
 * pages, à 1440 et à 390 px, avant et après le changement de polices, puis la différence de
 * pixels entre les deux pour prouver que le rendu n'a pas bougé. Chrome headless, pilote partagé.
 *
 *   npx tsx scripts/g2g-captures-polices.ts --etape avant|apres [--url http://localhost:3000]
 *   npx tsx scripts/g2g-captures-polices.ts --etape diff
 * Les PNG servent au calcul de la différence et ne sont pas gardés dans le dépôt (seuls les JPEG le sont).
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { Devtools } from './g2g-devtools'
import { RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const ETAPE = arg('--etape', 'avant')
const BASE = '/experience/groove-to-grave'
const PAGES = [
  { nom: 'accueil', chemin: '' },
  { nom: 'sorties', chemin: '/sorties' },
  { nom: 'sortie-gtgr05', chemin: '/sorties/gtgr05' },
]
const FORMATS = [
  { largeur: 1440, hauteur: 900, echelle: 1 },
  { largeur: 390, hauteur: 844, echelle: 2 },
]
const SORTIE = dossier(join(RACINE, 'docs/groove-to-grave/planches/phase-6.1'))

async function capturer(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  for (const f of FORMATS) {
    for (const p of PAGES) {
      const { s, targetId } = await nav.page(`${URL}${BASE}${p.chemin}`, f.largeur, f.hauteur, f.echelle)
      // Le mur n'est pas comparé : canvas retiré, texture de repli dessous (identique avant et après).
      await nav.evaluer(s, `(() => { const c = document.querySelector('.g2g-mur-canvas'); if (c) c.remove(); return document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 600))) })()`)
      const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
      const png = Buffer.from(data, 'base64')
      writeFileSync(join(SORTIE, `${ETAPE}-${p.nom}-${f.largeur}.png`), png)
      await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(join(SORTIE, `${ETAPE}-${p.nom}-${f.largeur}.jpg`))
      process.stdout.write(`${ETAPE} ${p.nom} ${f.largeur}\n`)
      await nav.envoyer('Target.closeTarget', { targetId })
    }
  }
  nav.fermer()
}

/** Différence moyenne par canal (0 à 255) et part des pixels qui bougent de plus de 24 niveaux. */
async function diff(): Promise<void> {
  const lignes: string[] = []
  for (const f of FORMATS) {
    for (const p of PAGES) {
      const a = join(SORTIE, `avant-${p.nom}-${f.largeur}.png`)
      const b = join(SORTIE, `apres-${p.nom}-${f.largeur}.png`)
      if (!existsSync(a) || !existsSync(b)) continue
      const [ra, rb] = await Promise.all([sharp(a).raw().toBuffer({ resolveWithObject: true }), sharp(b).raw().toBuffer({ resolveWithObject: true })])
      const n = Math.min(ra.data.length, rb.data.length)
      let somme = 0
      let mobiles = 0
      const px = n / ra.info.channels
      for (let i = 0; i < n; i += ra.info.channels) {
        let d = 0
        for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(ra.data[i + c] - rb.data[i + c]))
        somme += d
        if (d > 24) mobiles++
      }
      lignes.push(`| ${p.nom} | ${f.largeur} | ${(somme / px).toFixed(2)} | ${((mobiles / px) * 100).toFixed(2)} % |`)
    }
  }
  process.stdout.write('| Page | Format | Écart moyen (0-255) | Pixels mobiles (> 24) |\n|---|---|---|---|\n' + lignes.join('\n') + '\n')
}

;(ETAPE === 'diff' ? diff() : capturer()).catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
