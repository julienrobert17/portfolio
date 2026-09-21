/**
 * Photos de « la Coupe » : cherche, télécharge, recadre et exporte une photo
 * libre de droits par image déclarée dans content/projets.ts et content/site.ts.
 *
 *   PEXELS_API_KEY=… npx tsx scripts/fetch-la-coupe-photos.ts
 *   UNSPLASH_ACCESS_KEY=… npx tsx scripts/fetch-la-coupe-photos.ts
 *   … --remplacer maison-des-vignes-03=pexels:1234567   épingle une autre photo
 *   … --seulement halle-saint-ouen                      limite à un préfixe de clé
 *
 * Les deux sites exigent une clé d'API (gratuite) : la recherche anonyme est
 * refusée. Licences : Pexels License et Unsplash License, usage libre, crédit
 * recommandé (il est affiché dans le footer).
 *
 * 1. Sélection : scripts/la-coupe-photos.manifest.json épingle la photo choisie
 *    pour chaque clé ; seules les clés absentes déclenchent une recherche. Le
 *    fichier est versionné : relancer le script redonne les mêmes images.
 * 2. Traitement (sharp) : recadrage au ratio déclaré centré sur la zone
 *    d'attention, 1920 px au plus, export WebP et AVIF ≤ 300 kB chacun.
 * 3. Écrit content/credits.ts (dimensions, couleur dominante, crédits).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { projets } from '../src/components/experience/la-coupe/content/projets'
import { imagesAtelier } from '../src/components/experience/la-coupe/content/site'
import type { Ratio } from '../src/components/experience/la-coupe/content/types'
import { DIMENSIONS, cleAtelier, cleProjet } from '../src/components/experience/la-coupe/lib/images'

const POIDS_MAX = 300 * 1024
const DOSSIER = join(process.cwd(), 'public/experience/la-coupe/img')
const MANIFESTE = join(process.cwd(), 'scripts/la-coupe-photos.manifest.json')
const CREDITS = join(process.cwd(), 'src/components/experience/la-coupe/content/credits.ts')

/** Requêtes de recherche, en anglais, dans l'ordre des images de chaque projet. */
const REQUETES: Record<string, string[]> = {
  'maison-des-vignes': [
    'modern stone house wood upper floor countryside', 'wooden staircase skylight minimal interior', 'house in vineyard hillside dusk',
    'kitchen stone countertop oak joinery', 'zinc roof edge detail architecture', 'attic bedroom roof window wood',
    'limestone wall detail garden', 'covered terrace view village countryside',
  ],
  'halle-saint-ouen': [
    'covered market hall steel structure skylights', 'riveted steel column industrial heritage', 'reclaimed brick facade workshop',
    'renovated industrial hall exterior street', 'steel beam rivet detail', 'polished concrete floor market stalls', 'industrial nave north light interior',
  ],
  'mediatheque-des-tanneurs': [
    'timber slat facade public building', 'library reading room timber roof daylight', 'wooden bookshelves library architecture',
    'large sliding door wood facade square', 'public building hall open to plaza evening', 'wooden staircase library interior',
    'modern wooden building street view', 'children library space wood', 'timber post beam joint detail',
  ],
  'les-terrasses-du-canal': [
    'brick apartment building canal waterfront', 'apartment balconies terraces brick facade', 'exterior gallery walkway brick housing',
    'brick wall joint detail', 'living room raw concrete ceiling wood windows', 'planted courtyard housing after rain',
    'open staircase residential building', 'ground floor shop brick building high ceiling',
  ],
  'extension-aux-lilas': [
    'timber house extension old brick house', 'kitchen large glass door garden', 'larch wood cladding slats detail',
    'home office under sloped roof wood', 'exposed brick wall interior renovation', 'timber frame construction site house',
  ],
  'ecole-des-hauts-champs': [
    'architecture model school buildings courtyard', 'rammed earth brick wall construction site', 'timber canopy covered walkway school',
    'compressed earth blocks samples', 'classroom wooden ceiling daylight', 'axonometric architecture drawing model',
  ],
  'lumiere-fossile': [
    'dark museum exhibition room black steel tables', 'narrow doorway between exhibition rooms dark', 'exhibition gallery overview museum interior',
    'miner lamp museum display case', 'tinted wood fibre panels raking light', 'exhibition installation workers assembling',
  ],
  'belvedere-du-vercors': [
    'cantilevered viewpoint cabin cliff mountains', 'architecture study model wood stilts', 'architect sketch terrace landscape',
    'limestone rocks pine trees mountain', 'architecture elevation drawing cabin', 'mountain trail cliffs vercors landscape',
  ],
}

const REQUETES_ATELIER: Record<string, string> = {
  atelier: 'architecture studio workspace models table',
  portrait: 'woman architect portrait studio natural light',
  'equipe-01': 'woman portrait neutral background professional',
  'equipe-02': 'man portrait neutral background professional',
  'equipe-03': 'young woman portrait neutral background',
  'equipe-04': 'man portrait neutral background casual',
  'equipe-05': 'woman portrait neutral background casual',
  'equipe-06': 'man portrait neutral background glasses',
  ecouter: 'architect site survey notebook measuring tape',
  dessiner: 'tracing paper architectural drawings desk',
  construire: 'timber frame construction crane building site',
}

interface Selection {
  source: 'Pexels' | 'Unsplash'
  id: string
  auteur: string
  auteurUrl: string
  pageUrl: string
  /** URL de téléchargement de l'original. */
  original: string
}

interface Entree {
  cle: string
  ratio: Ratio
  requete: string
}

const orientation = (r: Ratio) => (r === '4:5' ? 'portrait' : r === '1:1' ? 'square' : 'landscape')

function entrees(): Entree[] {
  const liste: Entree[] = []
  for (const p of projets) {
    p.images.forEach((img, i) => {
      const requete = REQUETES[p.slug]?.[i]
      if (!requete) throw new Error(`Pas de requête pour ${cleProjet(p.slug, i)}`)
      liste.push({ cle: cleProjet(p.slug, i), ratio: img.ratio, requete })
    })
  }
  for (const [id, img] of Object.entries(imagesAtelier)) {
    const requete = REQUETES_ATELIER[id]
    if (!requete) throw new Error(`Pas de requête pour ${cleAtelier(id)}`)
    liste.push({ cle: cleAtelier(id), ratio: img.ratio, requete })
  }
  return liste
}

async function chercherPexels(e: Entree, cleApi: string, pris: Set<string>): Promise<Selection | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(e.requete)}&orientation=${orientation(e.ratio)}&size=large&per_page=15`
  const r = await fetch(url, { headers: { Authorization: cleApi } })
  if (!r.ok) throw new Error(`Pexels ${r.status} pour « ${e.requete} »`)
  const data = (await r.json()) as { photos: Array<{ id: number; width: number; url: string; photographer: string; photographer_url: string; src: { original: string } }> }
  const photo = data.photos.find((p) => p.width >= 1920 && !pris.has(`pexels:${p.id}`))
  if (!photo) return null
  return { source: 'Pexels', id: `pexels:${photo.id}`, auteur: photo.photographer, auteurUrl: photo.photographer_url, pageUrl: photo.url, original: photo.src.original }
}

async function chercherUnsplash(e: Entree, cleApi: string, pris: Set<string>): Promise<Selection | null> {
  const o = orientation(e.ratio) === 'square' ? 'squarish' : orientation(e.ratio)
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(e.requete)}&orientation=${o}&per_page=15&content_filter=high`
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${cleApi}` } })
  if (!r.ok) throw new Error(`Unsplash ${r.status} pour « ${e.requete} »`)
  const data = (await r.json()) as { results: Array<{ id: string; width: number; premium?: boolean; plus?: boolean; links: { html: string; download_location: string }; urls: { raw: string }; user: { name: string; links: { html: string } } }> }
  const photo = data.results.find((p) => !p.premium && !p.plus && p.width >= 1920 && !pris.has(`unsplash:${p.id}`))
  if (!photo) return null
  // Exigence de l'API Unsplash : signaler le téléchargement.
  await fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${cleApi}` } }).catch(() => undefined)
  return { source: 'Unsplash', id: `unsplash:${photo.id}`, auteur: photo.user.name, auteurUrl: photo.user.links.html, pageUrl: photo.links.html, original: `${photo.urls.raw}&w=2400&q=90&fm=jpg` }
}

/** Recadre au ratio, puis baisse la qualité jusqu'à tenir sous 300 kB. */
export async function traiter(source: Buffer, ratio: Ratio, cle: string): Promise<{ width: number; height: number; couleur: string }> {
  const { width, height } = DIMENSIONS[ratio]
  const base = await sharp(source).rotate().resize(width, height, { fit: 'cover', position: sharp.strategy.attention }).toBuffer()
  for (const format of ['webp', 'avif'] as const) {
    let qualite = format === 'webp' ? 78 : 58
    let sortie = await sharp(base)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
    while (sortie.length > POIDS_MAX && qualite > 30) {
      qualite -= 6
      sortie = await sharp(base)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
    }
    if (sortie.length > POIDS_MAX) throw new Error(`${cle}.${format} : ${Math.round(sortie.length / 1024)} kB même à qualité ${qualite}`)
    writeFileSync(join(DOSSIER, `${cle}.${format}`), sortie)
  }
  const { dominant } = await sharp(base).stats()
  const hex = (v: number) => v.toString(16).padStart(2, '0')
  return { width, height, couleur: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` }
}

function ecrireCredits(manifeste: Record<string, Selection>, metas: Record<string, { width: number; height: number; couleur: string }>) {
  const parAuteur = new Map<string, { auteur: string; source: string; url: string; photos: string[] }>()
  for (const cle of Object.keys(metas).sort()) {
    const s = manifeste[cle]
    const c = parAuteur.get(s.auteurUrl) ?? { auteur: s.auteur, source: s.source, url: s.auteurUrl, photos: [] }
    c.photos.push(s.pageUrl)
    parAuteur.set(s.auteurUrl, c)
  }
  const credits = [...parAuteur.values()].sort((a, b) => a.auteur.localeCompare(b.auteur, 'fr'))
  const actuel = readFileSync(CREDITS, 'utf8')
  const entete = actuel.slice(0, actuel.indexOf('export const photos'))
  const triees = Object.fromEntries(Object.keys(metas).sort().map((k) => [k, metas[k]]))
  writeFileSync(CREDITS, `${entete}export const photos: Record<string, PhotoGeneree> = ${JSON.stringify(triees, null, 2)}\n\nexport const credits: Credit[] = ${JSON.stringify(credits, null, 2)}\n`)
}

async function main() {
  const args = process.argv.slice(2)
  const valeur = (nom: string) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined }
  const seulement = valeur('--seulement')
  const pexels = process.env.PEXELS_API_KEY
  const unsplash = process.env.UNSPLASH_ACCESS_KEY
  const manifeste: Record<string, Selection> = existsSync(MANIFESTE) ? JSON.parse(readFileSync(MANIFESTE, 'utf8')) : {}
  const pris = new Set(Object.values(manifeste).map((s) => s.id))
  mkdirSync(DOSSIER, { recursive: true })

  const remplacer = valeur('--remplacer')
  if (remplacer) {
    const [cle] = remplacer.split('=')
    delete manifeste[cle]
    process.stdout.write(`${cle} : sélection effacée, nouvelle recherche (la photo précédente reste exclue)\n`)
  }

  const liste = entrees().filter((e) => !seulement || e.cle.startsWith(seulement))
  const aChercher = liste.filter((e) => !manifeste[e.cle])
  if (aChercher.length && !pexels && !unsplash) {
    throw new Error(`${aChercher.length} photos à chercher, mais ni PEXELS_API_KEY ni UNSPLASH_ACCESS_KEY dans l'environnement (clés gratuites : pexels.com/api, unsplash.com/developers).`)
  }
  for (const e of aChercher) {
    const s = pexels ? await chercherPexels(e, pexels, pris) : await chercherUnsplash(e, unsplash as string, pris)
    if (!s) {
      process.stdout.write(`${e.cle} : aucun résultat pour « ${e.requete} », placeholder conservé\n`)
      continue
    }
    manifeste[e.cle] = s
    pris.add(s.id)
    writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)
  }

  const metas: Record<string, { width: number; height: number; couleur: string }> = {}
  for (const e of entrees()) {
    const s = manifeste[e.cle]
    if (!s) continue
    const dejaLa = existsSync(join(DOSSIER, `${e.cle}.webp`)) && existsSync(join(DOSSIER, `${e.cle}.avif`))
    if (dejaLa && !(remplacer && remplacer.startsWith(e.cle))) {
      const m = await sharp(join(DOSSIER, `${e.cle}.webp`)).metadata()
      const { dominant } = await sharp(join(DOSSIER, `${e.cle}.webp`)).stats()
      const hex = (v: number) => v.toString(16).padStart(2, '0')
      metas[e.cle] = { width: m.width ?? 0, height: m.height ?? 0, couleur: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` }
      continue
    }
    const r = await fetch(s.original)
    if (!r.ok) throw new Error(`Téléchargement ${r.status} : ${s.pageUrl}`)
    try {
      metas[e.cle] = await traiter(Buffer.from(await r.arrayBuffer()), e.ratio, e.cle)
      process.stdout.write(`${e.cle} ← ${s.auteur} (${s.source})\n`)
    } catch (err) {
      // Photo incompressible sous 300 kB : on garde le placeholder et on le dit, sans arrêter le lot.
      process.stdout.write(`${e.cle} : ${err instanceof Error ? err.message : String(err)} — placeholder conservé, essayer --remplacer ${e.cle}=\n`)
    }
  }
  ecrireCredits(manifeste, metas)
  process.stdout.write(`${Object.keys(metas).length} photos sur ${entrees().length}, crédits écrits dans content/credits.ts\n`)
}

if (process.argv[1]?.endsWith('fetch-la-coupe-photos.ts')) {
  main().catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  })
}
