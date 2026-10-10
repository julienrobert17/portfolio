/**
 * Médias publics de « Groove To Grave » : pochettes (Bandcamp, image originale) et
 * visuels de soirées (pages de billetterie publiques, balise og:image) vers
 * content/groove-to-grave/media/source/, avec content/groove-to-grave/sources.json
 * (URL d'origine, page, date, dimensions). Ce qui échoue est listé dans `echecs`
 * pour capture manuelle. Instagram n'est jamais consulté.
 *
 *   npx tsx scripts/g2g-fetch-media.ts            n'écrase pas ce qui existe
 *   npx tsx scripts/g2g-fetch-media.ts --forcer   retélécharge tout
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { soirees } from '../src/components/experience/groove-to-grave/content/events'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import { CONTENU, SOURCE, dossier, lireSources, telecharger, type EntreeSource, type SourcesJson } from './g2g-lib'

// Pas de top-level await : le dépôt compile les scripts en CommonJS (voir fetch-la-coupe-photos.ts).
async function main(): Promise<void> {
  const FORCER = process.argv.includes('--forcer')
  const INSTAGRAM = /instagram\.com|cdninstagram|fbcdn/i
  const IMAGE = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i

  dossier(SOURCE)
  const precedent = lireSources()
  const entrees = new Map(precedent.entrees.map((e) => [e.id, e]))
  const echecs: SourcesJson['echecs'] = []
  const maintenant = new Date().toISOString()

  async function enregistrer(id: string, kind: EntreeSource['kind'], url: string, page: string | undefined, credit: string | undefined): Promise<void> {
    const brut = await telecharger(url)
    const meta = await sharp(brut).metadata()
    if (!meta.width || !meta.height) throw new Error('image illisible')
    const ext = meta.format === 'png' ? 'png' : meta.format === 'webp' ? 'webp' : 'jpg'
    const file = `${id}.${ext}`
    writeFileSync(join(SOURCE, file), brut)
    entrees.set(id, { id, kind, file, url, page, fetchedAt: maintenant, width: meta.width, height: meta.height, bytes: brut.length, credit })
    process.stdout.write(`  ${id} ← ${url} (${meta.width}×${meta.height}, ${Math.round(brut.length / 1024)} kB)\n`)
  }

  function dejaLa(id: string): boolean {
    const e = entrees.get(id)
    return Boolean(e && !FORCER && existsSync(join(SOURCE, e.file)))
  }

  /** og:image (ou twitter:image) d'une page publique. */
  async function imageDePage(page: string): Promise<string> {
    const html = (await telecharger(page)).toString('utf8')
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ?? html.match(/content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i)
    if (!m) throw new Error('pas de og:image')
    return m[1].replace(/&amp;/g, '&')
  }

  process.stdout.write('Pochettes (Bandcamp)\n')
  for (const s of sorties) {
    if (dejaLa(s.ref)) continue
    // `_0` : l'image telle que déposée par le label, sans recadrage Bandcamp.
    const url = `https://f4.bcbits.com/img/a${s.bandcampArtId}_0.jpg`
    try {
      await enregistrer(s.ref, 'pochette', url, s.links.bandcamp, s.credits.artwork)
    } catch (e) {
      echecs.push({ id: s.ref, url, raison: String(e instanceof Error ? e.message : e) })
    }
  }

  process.stdout.write('Visuels de soirées\n')
  for (const ev of soirees) {
    if (dejaLa(ev.date)) continue
    const candidats = (ev.visuels ?? []).filter((u) => !INSTAGRAM.test(u))
    if (!candidats.length) {
      echecs.push({ id: ev.date, url: '', raison: 'aucun visuel public connu' })
      continue
    }
    let ok = false
    const raisons: string[] = []
    for (const u of candidats) {
      try {
        // D'abord comme image directe (les URL Cloudinary n'ont pas toujours d'extension), sinon comme page.
        try {
          await enregistrer(ev.date, 'flyer', u, undefined, ev.flyerCredit)
        } catch (e) {
          if (IMAGE.test(u)) throw e
          const img = await imageDePage(u)
          if (INSTAGRAM.test(img)) throw new Error('image hébergée par Instagram, ignorée')
          await enregistrer(ev.date, 'flyer', img, u, ev.flyerCredit)
        }
        ok = true
        break
      } catch (e) {
        raisons.push(`${u} : ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    if (!ok) echecs.push({ id: ev.date, url: candidats[0], raison: raisons.join(' ; ') })
  }

  const sources: SourcesJson = {
    releveLe: maintenant.slice(0, 10),
    entrees: [...entrees.values()].sort((a, b) => a.id.localeCompare(b.id)),
    echecs,
  }
  writeFileSync(join(CONTENU, 'sources.json'), JSON.stringify(sources, null, 2) + '\n')
  process.stdout.write(`\n${sources.entrees.length} média(s) en source/, ${echecs.length} échec(s) à capturer à la main :\n`)
  for (const e of echecs) process.stdout.write(`  ${e.id} : ${e.raison}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
