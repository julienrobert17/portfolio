/**
 * Tuile « Groove To Grave Records » du carrousel du portfolio (bloc 7.1b) : capture en Chrome
 * headless, à 1000 × 1000 px, de la page de rendu dédiée `/experience/groove-to-grave-tuile`
 * (vraies polices, cassette GTGR05, monogramme, lambeaux), puis export AVIF et WebP par le bloc
 * d'export existant (`exporterImage`, largeurs 320 à 960 dans public/experience/groove-to-grave/img/).
 * Le serveur doit tourner (`next start`). Remplace scripts/generate-g2g-tuile.ts et tuile.svg.
 *
 *   npx tsx scripts/g2g-tuile.ts [--url http://localhost:3000]
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Devtools } from './g2g-devtools'
import { CACHE, RACINE, dossier, exporterImage } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')

async function main(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  const { s, targetId } = await nav.page(`${URL}/experience/groove-to-grave-tuile`, 1000, 1000, 1)
  // Polices et texture de fond chargées avant la capture.
  await nav.evaluer(s, `document.fonts.ready.then(() => new Promise((r) => { const i = new Image(); i.onload = () => setTimeout(r, 300); i.onerror = () => r(); i.src = '/experience/groove-to-grave/mur-1920.webp' }))`)
  const polices = await nav.evaluer<string[]>(s, `Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family)`)
  const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1000, height: 1000, scale: 1 } }, s)
  await nav.envoyer('Target.closeTarget', { targetId })
  nav.fermer()
  const png = Buffer.from(data, 'base64')
  writeFileSync(join(dossier(CACHE), 'tuile.png'), png)
  const exportee = await exporterImage(png, 'tuile')
  process.stdout.write(`polices chargées : ${polices.join(', ')}\n`)
  process.stdout.write(`tuile exportée : ${exportee.largeurs.join(', ')} px, ${exportee.width}×${exportee.height} (public/experience/groove-to-grave/img/tuile-*.{avif,webp})\n`.replace(RACINE + '/', ''))
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
