/**
 * Phase 7.3, preuve de la revalidation : modifie un texte publié (le champ `prix` d'une soirée
 * passée, inoffensif) directement dans le document publié de Sanity, ce qui déclenche le webhook
 * de publication exactement comme un clic « Publier » dans le Studio, puis interroge la page de
 * production jusqu'à voir la nouvelle valeur, et mesure le délai. Remet ensuite la valeur
 * d'origine (second webhook). Captures avant et après dans planches/phase-7.3-revalidation/.
 * Jeton d'écriture : session CLI (~/.config/sanity/config.json), jamais dans le dépôt.
 *
 *   npx tsx scripts/g2g-mesure-revalidation.ts [--url https://portfolio-eight-sable-66.vercel.app] [--id soiree-2024-06-28]
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { Devtools } from './g2g-devtools'
import { RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'https://portfolio-eight-sable-66.vercel.app').replace(/\/$/, '')
const ID = arg('--id', 'soiree-2024-06-28')
const PAGE = `${URL}/experience/groove-to-grave/soirees`
const SORTIE = dossier(join(RACINE, 'docs/groove-to-grave/planches/phase-7.3-revalidation'))
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function capturer(nav: Devtools, nom: string): Promise<void> {
  const { s, targetId } = await nav.page(PAGE, 1440, 900, 1)
  await nav.evaluer(s, `(() => { const el = Array.from(document.querySelectorAll('.g2g-flyer')).find((f) => f.textContent.includes('${ID.replace('soiree-', '')}'.split('-').reverse().join(' ')) || f.querySelector('time[datetime="${ID.replace('soiree-', '')}"]')); if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' }); return true })()`)
  await attendre(800)
  const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
  await sharp(Buffer.from(data, 'base64')).jpeg({ quality: 85, mozjpeg: true }).toFile(join(SORTIE, `${nom}.jpg`))
  await nav.envoyer('Target.closeTarget', { targetId })
}

async function main(): Promise<void> {
  const token = JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8')).authToken as string
  const client = createClient({ projectId: 'da2plce8', dataset: 'production', apiVersion: '2025-01-01', token, useCdn: false })
  const doc = await client.getDocument<{ prix?: string; date: string }>(ID)
  if (!doc) throw new Error(`${ID} introuvable`)
  const origine = doc.prix ?? ''
  const marque = `${origine ? origine + ' · ' : ''}revalidation ${new Date().toISOString().slice(11, 19)} UTC`
  const nav = new Devtools()
  await nav.demarrer()
  await capturer(nav, '1-avant')
  const avantHtml = await (await fetch(PAGE, { cache: 'no-store' })).text()
  process.stdout.write(`avant : la page contient-elle déjà la marque ? ${avantHtml.includes(marque)}\n`)
  const t0 = Date.now()
  await client.patch(ID).set({ prix: marque }).commit()
  process.stdout.write(`publié à ${new Date(t0).toISOString()} : prix = « ${marque} »\n`)
  let vu = 0
  let essais = 0
  while (Date.now() - t0 < 180000) {
    essais++
    const html = await (await fetch(PAGE, { cache: 'no-store' })).text()
    if (html.includes(marque)) {
      vu = Date.now() - t0
      break
    }
    await attendre(2000)
  }
  process.stdout.write(vu ? `visible en production après ${(vu / 1000).toFixed(1)} s (${essais} requêtes)\n` : `NON visible après 180 s (${essais} requêtes)\n`)
  await capturer(nav, '2-apres')
  // Retour à la valeur d'origine (second webhook).
  const t1 = Date.now()
  await (origine ? client.patch(ID).set({ prix: origine }) : client.patch(ID).unset(['prix'])).commit()
  let retour = 0
  while (Date.now() - t1 < 180000) {
    const html = await (await fetch(PAGE, { cache: 'no-store' })).text()
    if (!html.includes(marque)) {
      retour = Date.now() - t1
      break
    }
    await attendre(2000)
  }
  process.stdout.write(retour ? `retour à l'origine visible après ${(retour / 1000).toFixed(1)} s\n` : 'retour NON visible après 180 s\n')
  await capturer(nav, '3-retour')
  nav.fermer()
  if (!vu) process.exit(1)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
