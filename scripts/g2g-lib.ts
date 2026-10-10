/**
 * Outils communs des scripts « Groove To Grave » (g2g-*.ts) : chemins, manifestes,
 * export d'images AVIF/WebP, écriture WAV, appels ffmpeg. Le bloc d'export d'images
 * est repris de scripts/fetch-la-coupe-photos.ts (traiter), sans recadrage ni rendu
 * commun : les œuvres du label ne sont jamais retouchées (brief §2.1 et §7).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

export const RACINE = process.cwd()
export const CONTENU = join(RACINE, 'content/groove-to-grave')
export const MEDIA = join(CONTENU, 'media')
export const SOURCE = join(MEDIA, 'source')
export const LABEL = join(MEDIA, 'label')
export const PUBLIC = join(RACINE, 'public/experience/groove-to-grave')
export const PUBLIC_IMG = join(PUBLIC, 'img')
export const PUBLIC_AUDIO = join(PUBLIC, 'audio')
export const CONTENU_TS = join(RACINE, 'src/components/experience/groove-to-grave/content')
/** Originaux et WAV intermédiaires, hors dépôt (.next est ignoré). */
export const CACHE = join(RACINE, '.next/cache/groove-to-grave')

export const INK = '#111111'
export const POSTER = '#f4efe2'

/** Largeurs servies en srcset : pochettes carrées de 1200 px au plus sur Bandcamp, flyers souvent plus grands. */
export const LARGEURS = [320, 480, 640, 960, 1200, 1600]
const POIDS_MAX = 300 * 1024
const QUALITE = { dense: { webp: 62, avif: 38 }, pleine: { webp: 74, avif: 44 } }

export interface EntreeSource {
  id: string
  kind: 'pochette' | 'flyer' | 'photo'
  file: string
  url: string
  page?: string
  fetchedAt: string
  width: number
  height: number
  bytes: number
  credit?: string
}

export interface SourcesJson {
  releveLe: string
  entrees: EntreeSource[]
  /** Visuels non récupérés, à capturer à la main. */
  echecs: { id: string; url: string; raison: string }[]
}

export interface ManifesteLabel {
  audio: { file: string; track: string; start?: number; duration?: number; unreleased?: boolean }[]
  images: { file: string; id: string; credit?: string }[]
}

export function lireJson<T>(chemin: string, defaut: T): T {
  return existsSync(chemin) ? (JSON.parse(readFileSync(chemin, 'utf8')) as T) : defaut
}

export function lireSources(): SourcesJson {
  return lireJson<SourcesJson>(join(CONTENU, 'sources.json'), { releveLe: '', entrees: [], echecs: [] })
}

export function lireManifeste(): ManifesteLabel {
  return lireJson<ManifesteLabel>(join(LABEL, 'manifest.json'), { audio: [], images: [] })
}

export function dossier(chemin: string): string {
  mkdirSync(chemin, { recursive: true })
  return chemin
}

export interface ImageExportee {
  width: number
  height: number
  largeurs: number[]
}

/**
 * Écrit `<id>-<largeur>.avif|webp` pour chaque largeur de LARGEURS que la source
 * permet, ratio conservé, sans recadrage ni correction, chacune sous 300 kB : la
 * qualité descend tant qu'il faut, et une largeur dont un format ne tient pas
 * arrête la série. Retourne les dimensions de la plus grande largeur gardée.
 */
export async function exporterImage(source: Buffer, id: string): Promise<ImageExportee> {
  dossier(PUBLIC_IMG)
  const meta = await sharp(source).rotate().metadata()
  const largeurSource = meta.width ?? 0
  const hauteurSource = meta.height ?? 0
  if (!largeurSource || !hauteurSource) throw new Error(`${id} : dimensions illisibles`)
  // Une source plus petite que 320 px est servie telle quelle, jamais agrandie.
  const largeurs = LARGEURS.filter((l) => l <= largeurSource)
  if (!largeurs.length) largeurs.push(largeurSource)
  const base = await sharp(source).rotate().toColourspace('srgb').png({ compressionLevel: 1 }).toBuffer()
  const ecrire = async (largeur: number): Promise<boolean> => {
    const reduit = largeur === largeurSource ? base : await sharp(base).resize(largeur).png({ compressionLevel: 1 }).toBuffer()
    const sorties: Array<[string, Buffer]> = []
    for (const format of ['webp', 'avif'] as const) {
      let qualite = QUALITE[largeur <= 640 ? 'dense' : 'pleine'][format]
      let sortie = await sharp(reduit)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      while (sortie.length > POIDS_MAX && qualite > 28) {
        qualite -= 6
        sortie = await sharp(reduit)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      }
      if (sortie.length <= POIDS_MAX) sorties.push([format, sortie])
    }
    if (sorties.length < 2) return false
    for (const [format, sortie] of sorties) writeFileSync(join(PUBLIC_IMG, `${id}-${largeur}.${format}`), sortie)
    return true
  }
  const gardees: number[] = []
  for (const largeur of largeurs) {
    if (!(await ecrire(largeur))) break
    gardees.push(largeur)
  }
  if (!gardees.length) throw new Error(`${id} : aucune largeur ne tient sous 300 kB`)
  const width = gardees[gardees.length - 1]
  return { width, height: Math.round((width * hauteurSource) / largeurSource), largeurs: gardees }
}

/** Télécharge une URL en Buffer, avec un User-Agent de navigateur ; erreur sur statut non 2xx. */
export async function telecharger(url: string): Promise<Buffer> {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', accept: '*/*' } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

/** Écrit un WAV PCM 16 bits à partir d'échantillons mono ou stéréo entrelacés dans [-1, 1]. */
export function ecrireWav(chemin: string, echantillons: Float32Array, sampleRate: number, canaux = 1): void {
  const octetsDonnees = echantillons.length * 2
  const buf = Buffer.alloc(44 + octetsDonnees)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + octetsDonnees, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(canaux, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * canaux * 2, 28)
  buf.writeUInt16LE(canaux * 2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(octetsDonnees, 40)
  for (let i = 0; i < echantillons.length; i++) {
    const v = Math.max(-1, Math.min(1, echantillons[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  writeFileSync(chemin, buf)
}

export function ffmpegDisponible(): boolean {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

/**
 * Normalisation à `cible` LUFS intégrés avec crête vraie sous −1 dBTP une fois décodé : gain
 * mesuré par ebur128 puis limiteur à −3 dBTP (le MP3 dépasse d'environ 1 à 2 dB sur des crêtes
 * limitées), répété tant que la sonie s'écarte de plus de 0,2 LU (le limiteur en retire un peu
 * à chaque passe), puis MP3 192 kbps. `filtresAvant` : filtres appliqués d'abord (découpe,
 * fondus). loudnorm n'est pas utilisé : en linéaire il n'atteint pas la cible à cause du facteur
 * de crête des boucles, en dynamique il la manque de 3 à 4 LU sur des fichiers courts.
 */
export function encoderMp3Normalise(entree: string, sortie: string, cible = -14, filtresAvant: string[] = [], argsEntree: string[] = []): void {
  const temp = join(dossier(join(CACHE, 'audio-temp')), `${Date.now()}-${Math.round(Math.random() * 1e6)}`)
  let courant = `${temp}-0.wav`
  ffmpeg([...argsEntree, '-i', entree, ...(filtresAvant.length ? ['-af', filtresAvant.join(',')] : []), '-ar', '44100', courant])
  for (let i = 1; i <= 6; i++) {
    const mesure = sonie(courant)
    const ecart = cible - mesure.lufs
    if (Math.abs(ecart) <= 0.2 && mesure.crete <= -2.9) break
    const suivant = `${temp}-${i}.wav`
    ffmpeg(['-i', courant, '-af', `volume=${ecart.toFixed(2)}dB,alimiter=limit=0.708:attack=1.5:release=60:level=false`, suivant])
    courant = suivant
  }
  ffmpeg(['-i', courant, '-codec:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100', sortie])
}

/** Sonie intégrée (LUFS) et crête vraie (dBTP) d'un fichier, par ebur128. */
export function sonie(chemin: string): { lufs: number; crete: number; lra: number } {
  const brut = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i '${chemin}' -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'`], { encoding: 'utf8' })
  const nombre = (re: RegExp) => Number(brut.match(re)?.[1] ?? NaN)
  return { lufs: nombre(/I:\s*(-?[\d.]+) LUFS/), lra: nombre(/LRA:\s*(-?[\d.]+) LU/), crete: nombre(/Peak:\s*(-?[\d.]+) dBFS/) }
}

/** Durée d'un fichier audio en secondes, par ffprobe. */
export function dureeAudio(chemin: string): number {
  const sortie = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', chemin], { encoding: 'utf8' })
  return Math.round(parseFloat(sortie) * 10) / 10
}

// ─── Couleurs ───

export function hex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

export function rgb(couleur: string): [number, number, number] {
  const h = couleur.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function luminance(couleur: string): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = rgb(couleur)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contraste WCAG entre deux couleurs, arrondi au centième. */
export function contraste(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100
}

/** Écrit un module TypeScript généré, avec en-tête d'avertissement. */
export function ecrireModule(nom: string, type: string, importType: string, constante: string, valeur: unknown, commentaire: string): void {
  const code = `import type { ${type} } from './types'

/**
 * ${commentaire}
 * GÉNÉRÉ par ${importType}, ne pas éditer.
 */
export const ${constante}: Record<string, ${type}> = ${JSON.stringify(valeur, null, 2)}
`
  writeFileSync(join(CONTENU_TS, nom), code)
}
