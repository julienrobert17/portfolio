/**
 * Photos de « la Coupe » : cherche sur Pexels, télécharge, recadre, harmonise
 * et exporte une photo libre de droits par image déclarée dans
 * content/projets.ts et content/site.ts.
 *
 *   npx tsx --env-file=<fichier .env avec PEXELS_API_KEY> scripts/fetch-la-coupe-photos.ts
 *   … --remplacer cle1,cle2            nouvelle recherche pour ces clés (l'ancienne photo est exclue)
 *   … --remplacer cle=pexels:1234567   épingle une photo précise
 *   … --retraiter                      ré-exporte tout depuis les originaux (après un changement de rendu)
 *   … --reselectionner                 re-cherche les clés dont la photo épinglée est bannie ou peu pertinente
 *   … --planche <slug|atelier> [--suite N] [--cles a,b]  planche de relecture : cinq candidats par image
 *
 * Licence Pexels : usage libre, crédit apprécié (affiché dans le footer).
 * Unsplash n'est pas utilisé : son API impose le hotlink des images.
 *
 * 1. Sélection : scripts/la-coupe-photos.manifest.json épingle la photo de
 *    chaque clé et garde la liste des photos écartées. Versionné : relancer
 *    le script redonne les mêmes images.
 * 2. Traitement (sharp) : recadrage au ratio déclaré centré sur la zone
 *    d'attention, 1920 px au plus, puis un rendu commun qui unifie des photos
 *    d'origines différentes (saturation 0,85, contraste adouci, dominante
 *    chaude vers --paper, sans grain). Export WebP et AVIF ≤ 300 kB chacun.
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
/** Originaux téléchargés, hors dépôt (.next est ignoré) : évite de re-télécharger pour retraiter. */
const CACHE = join(process.cwd(), '.next/cache/la-coupe-photos')
const MANIFESTE = join(process.cwd(), 'scripts/la-coupe-photos.manifest.json')
const CREDITS = join(process.cwd(), 'src/components/experience/la-coupe/content/credits.ts')

/** Rendu commun : contraste 0,94 avec noirs relevés, rouge +2 %, bleu −5 % (vers le papier chaud). */
const RENDU = { saturation: 0.85, pente: [0.959, 0.94, 0.893], decalage: [9, 8, 6] }

/**
 * Requêtes en anglais, dans l'ordre des images de chaque projet. Elles nomment
 * la matière du projet et une lumière naturelle, pour qu'une fiche ressemble à
 * un seul bâtiment ; pas de rendu 3D ni d'intérieur de magazine.
 */
export const REQUETES: Record<string, string[]> = {
  'maison-des-vignes': ['modern stone house', 'wooden staircase interior', 'stone house vineyard', 'kitchen wood stone', 'metal roof', 'attic bedroom wood', 'stone wall', 'stone terrace view'],
  'halle-saint-ouen': ['market hall interior', 'steel structure industrial', 'brick industrial building', 'old factory exterior', 'steel beam detail', 'empty warehouse interior', 'industrial skylight roof'],
  'mediatheque-des-tanneurs': ['wooden facade architecture', 'modern library interior wood', 'library shelves', 'wooden door modern', 'modern wooden building', 'wooden stairs modern', 'timber architecture', 'reading room library', 'wood beam detail'],
  'les-terrasses-du-canal': ['brick apartment building', 'balconies brick building', 'apartment building corridor exterior', 'brick texture', 'concrete ceiling interior', 'courtyard garden apartment', 'exterior staircase building', 'brick building shop street'],
  'extension-aux-lilas': ['wooden house modern', 'kitchen glass door garden', 'wood cladding facade', 'attic office', 'brick wall interior', 'wooden frame construction'],
  'ecole-des-hauts-champs': ['architecture model', 'rammed earth wall', 'wooden pergola', 'earth bricks', 'classroom interior', 'architectural model wood'],
  'lumiere-fossile': ['museum dark interior', 'dark corridor', 'exhibition space dark', 'oil lamp', 'dark wood wall', 'museum installation'],
  'belvedere-du-vercors': ['cabin mountain cliff', 'architecture model', 'architect sketch', 'limestone cliff forest', 'architectural drawing', 'mountain trail cliff'],
}

/** Atelier et équipe : des mains au travail, des maquettes, des outils ; aucun visage en gros plan. */
export const REQUETES_ATELIER: Record<string, string> = {
  atelier: 'architecture studio desk',
  portrait: 'architect hands drawing',
  'equipe-01': 'hands sketching pencil',
  'equipe-02': 'blueprints construction table',
  'equipe-03': 'cutting cardboard model',
  'equipe-04': 'architecture model cardboard',
  'equipe-05': 'drawing tools ruler',
  'equipe-06': 'calculator plans desk',
  ecouter: 'measuring tape notebook',
  dessiner: 'tracing paper drawing',
  construire: 'timber frame construction site',
}

interface Selection {
  id: string
  auteur: string
  auteurUrl: string
  pageUrl: string
  /** URL de téléchargement de l'original. */
  original: string
  /** Description fournie par Pexels, pour la relecture. */
  description: string
}

interface Manifeste {
  selections: Record<string, Selection>
  /** Photos écartées à la relecture : jamais reproposées. */
  exclus: string[]
}

interface Entree {
  cle: string
  ratio: Ratio
  requete: string
}

interface PhotoPexels {
  id: number
  width: number
  height: number
  url: string
  alt: string
  photographer: string
  photographer_url: string
  src: { original: string }
}

/** Écartés d'office : personnes, noir et blanc, rendus, nourriture, texte et enseignes. */
const BANNIS = /black and white|black-and-white|monochrome|grayscale|woman|women|\bman\b|\bmen\b|people|person|portrait|couple|girl|\bboy|child|kids|tourist|pedestrian|worker|pizza|food|wine|container|\b3d\b|render|logo|\bsign\b|neon|poster|flag|christmas|snow/i
// Le format carré de Pexels dérive vers la macro et l'objet : les 1:1 se cherchent en paysage, puis se recadrent.
const orientation = (r: Ratio) => (r === '4:5' ? 'portrait' : 'landscape')

export function entrees(): Entree[] {
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

const versSelection = (p: PhotoPexels): Selection => ({
  id: `pexels:${p.id}`,
  auteur: p.photographer,
  auteurUrl: p.photographer_url,
  pageUrl: p.url,
  original: `${p.src.original}?auto=compress&cs=tinysrgb&w=2600`,
  description: p.alt,
})

let quota = '?'

async function pexels<T>(chemin: string, cleApi: string): Promise<T> {
  const r = await fetch(`https://api.pexels.com/v1/${chemin}`, { headers: { Authorization: cleApi } })
  quota = r.headers.get('x-ratelimit-remaining') ?? quota
  if (!r.ok) throw new Error(`Pexels ${r.status} sur ${chemin.split('?')[0]}`)
  return (await r.json()) as T
}

/** Candidats valides, dans l'ordre de Pexels ; la pertinence se juge à l'œil sur la planche. */
async function candidats(e: Entree, cleApi: string, pris: Set<string>): Promise<PhotoPexels[]> {
  const data = await pexels<{ photos: PhotoPexels[] }>(`search?query=${encodeURIComponent(e.requete)}&orientation=${orientation(e.ratio)}&size=large&per_page=40`, cleApi)
  return data.photos
    .filter((p) => Math.max(p.width, p.height) >= 1920 && !pris.has(`pexels:${p.id}`) && !BANNIS.test(p.alt))
}

async function chercher(e: Entree, cleApi: string, pris: Set<string>): Promise<Selection | null> {
  const [photo] = await candidats(e, cleApi, pris)
  return photo ? versSelection(photo) : null
}

/** Planche de relecture d'un projet : une rangée de cinq candidats par image, identifiant sous chacun. */
async function plancheProjet(prefixe: string, cleApi: string, pris: Set<string>, decalage: number, cles?: string[]): Promise<string> {
  const L = 250
  const COLS = 5
  const elements: sharp.OverlayOptions[] = []
  let y = 0
  for (const e of entrees().filter((x) => x.cle.startsWith(prefixe) && (!cles || cles.includes(x.cle)))) {
    const liste = (await candidats(e, cleApi, pris)).slice(decalage, decalage + COLS)
    const H = Math.round((L * DIMENSIONS[e.ratio].height) / DIMENSIONS[e.ratio].width)
    const titre = (t: string, w: number, fond: string, encre: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20"><rect width="${w}" height="20" fill="${fond}"/><text x="4" y="14" font-family="Menlo, monospace" font-size="12" fill="${encre}">${t}</text></svg>`)
    elements.push({ input: titre(`${e.cle}  [${e.ratio}]  « ${e.requete} »`, COLS * (L + 6), '#f3f0ea', '#151412'), left: 0, top: y })
    y += 20
    for (const [k, p] of liste.entries()) {
      const r = await fetch(`${p.src.original}?auto=compress&cs=tinysrgb&w=500`)
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(L, H, { fit: 'cover', position: sharp.strategy.attention }).toBuffer()
      elements.push({ input: img, left: k * (L + 6), top: y }, { input: titre(String(p.id), L, '#151412', '#f3f0ea'), left: k * (L + 6), top: y + H })
    }
    y += H + 28
  }
  const fichier = join(CACHE, `planche-${prefixe || 'selection'}.jpg`)
  await sharp({ create: { width: COLS * (L + 6), height: Math.max(y, 1), channels: 3, background: '#f3f0ea' } }).composite(elements).jpeg({ quality: 78 }).toFile(fichier)
  return fichier
}

/**
 * Recadre au ratio, applique le rendu commun, puis tient sous 300 kB : la
 * qualité descend d'abord, et si une photo très détaillée résiste, la
 * largeur passe à 85 % puis 70 % (les dimensions réelles vont dans credits.ts).
 */
export async function traiter(source: Buffer, ratio: Ratio, cle: string): Promise<{ width: number; height: number; couleur: string }> {
  const cible = DIMENSIONS[ratio]
  for (const echelle of [1, 0.85, 0.7]) {
    const width = Math.round(cible.width * echelle)
    const height = Math.round(cible.height * echelle)
    const base = await sharp(source)
      .rotate()
      .resize(width, height, { fit: 'cover', position: sharp.strategy.attention })
      .modulate({ saturation: RENDU.saturation })
      .linear(RENDU.pente, RENDU.decalage)
      .toColourspace('srgb')
      .png({ compressionLevel: 1 })
      .toBuffer()
    const sorties: Array<[string, Buffer]> = []
    for (const format of ['webp', 'avif'] as const) {
      let qualite = format === 'webp' ? 78 : 58
      let sortie = await sharp(base)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      while (sortie.length > POIDS_MAX && qualite > 42) {
        qualite -= 6
        sortie = await sharp(base)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      }
      if (sortie.length <= POIDS_MAX) sorties.push([format, sortie])
    }
    if (sorties.length < 2) continue
    for (const [format, sortie] of sorties) writeFileSync(join(DOSSIER, `${cle}.${format}`), sortie)
    const { dominant } = await sharp(base).stats()
    const hex = (v: number) => v.toString(16).padStart(2, '0')
    return { width, height, couleur: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` }
  }
  throw new Error(`${cle} : plus de 300 kB même à 70 % de la largeur`)
}

function ecrireCredits(manifeste: Manifeste, metas: Record<string, { width: number; height: number; couleur: string }>) {
  const parAuteur = new Map<string, { auteur: string; source: 'Pexels'; url: string; photos: string[] }>()
  for (const cle of Object.keys(metas).sort()) {
    const s = manifeste.selections[cle]
    const c = parAuteur.get(s.auteurUrl) ?? { auteur: s.auteur, source: 'Pexels' as const, url: s.auteurUrl, photos: [] }
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
  const retraiter = args.includes('--retraiter')
  const cleApi = process.env.PEXELS_API_KEY
  if (!cleApi) throw new Error("PEXELS_API_KEY absente de l'environnement (clé gratuite : pexels.com/api ; la passer avec --env-file).")
  const manifeste: Manifeste = existsSync(MANIFESTE) ? JSON.parse(readFileSync(MANIFESTE, 'utf8')) : { selections: {}, exclus: [] }
  mkdirSync(DOSSIER, { recursive: true })
  mkdirSync(CACHE, { recursive: true })
  const sauver = () => writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)

  const aRefaire = new Set<string>()
  for (const item of (valeur('--remplacer') ?? '').split(',').filter(Boolean)) {
    const [cle, id] = item.split('=')
    const ancienne = manifeste.selections[cle]
    if (ancienne && !manifeste.exclus.includes(ancienne.id)) manifeste.exclus.push(ancienne.id)
    delete manifeste.selections[cle]
    aRefaire.add(cle)
    if (id?.startsWith('pexels:')) manifeste.selections[cle] = versSelection(await pexels<PhotoPexels>(`photos/${id.slice(7)}`, cleApi))
  }

  if (args.includes('--reselectionner')) {
    for (const e of entrees()) {
      const sel = manifeste.selections[e.cle]
      if (sel && BANNIS.test(sel.description)) {
        manifeste.exclus.push(sel.id)
        delete manifeste.selections[e.cle]
        aRefaire.add(e.cle)
      }
    }
  }

  const pris = new Set([...Object.values(manifeste.selections).map((s) => s.id), ...manifeste.exclus])
  const planche = valeur('--planche')
  if (planche !== undefined) {
    process.stdout.write(`${await plancheProjet(planche, cleApi, new Set(manifeste.exclus), Number(valeur('--suite') ?? 0) * 5, valeur('--cles')?.split(','))}\n`)
    process.stdout.write(`quota Pexels restant : ${quota}\n`)
    return
  }

  for (const e of entrees()) {
    if (manifeste.selections[e.cle]) continue
    const s = await chercher(e, cleApi, pris)
    if (!s) {
      process.stdout.write(`${e.cle} : aucun résultat pour « ${e.requete} », placeholder conservé\n`)
      continue
    }
    manifeste.selections[e.cle] = s
    pris.add(s.id)
    sauver()
  }
  sauver()

  const metas: Record<string, { width: number; height: number; couleur: string }> = {}
  for (const e of entrees()) {
    const s = manifeste.selections[e.cle]
    if (!s) continue
    const dejaLa = existsSync(join(DOSSIER, `${e.cle}.webp`)) && existsSync(join(DOSSIER, `${e.cle}.avif`))
    if (dejaLa && !retraiter && !aRefaire.has(e.cle)) {
      const m = await sharp(join(DOSSIER, `${e.cle}.webp`)).metadata()
      const { dominant } = await sharp(join(DOSSIER, `${e.cle}.webp`)).stats()
      const hex = (v: number) => v.toString(16).padStart(2, '0')
      metas[e.cle] = { width: m.width ?? 0, height: m.height ?? 0, couleur: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` }
      continue
    }
    const cache = join(CACHE, `${s.id.replace(':', '-')}.jpg`)
    if (!existsSync(cache)) {
      const r = await fetch(s.original)
      if (!r.ok) throw new Error(`Téléchargement ${r.status} : ${s.pageUrl}`)
      writeFileSync(cache, Buffer.from(await r.arrayBuffer()))
    }
    try {
      metas[e.cle] = await traiter(readFileSync(cache), e.ratio, e.cle)
      process.stdout.write(`${e.cle} ← ${s.auteur} : ${s.description.slice(0, 70)}\n`)
    } catch (err) {
      // Photo incompressible sous 300 kB : placeholder conservé, on le dit, sans arrêter le lot.
      process.stdout.write(`${e.cle} : ${err instanceof Error ? err.message : String(err)} — placeholder conservé, essayer --remplacer ${e.cle}\n`)
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
