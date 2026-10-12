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
export const PUBLIC = join(RACINE, 'public/experience/groove-to-grave')
export const PUBLIC_IMG = join(PUBLIC, 'img')
/** Originaux et WAV intermédiaires, hors dépôt (.next est ignoré). */
export const CACHE = join(RACINE, '.next/cache/groove-to-grave')

export const INK = '#111111'
export const POSTER = '#f4efe2'

/** Largeurs servies en srcset : pochettes carrées de 1200 px au plus sur Bandcamp, flyers souvent plus grands. */
export const LARGEURS = [320, 480, 640, 960, 1200, 1600]
const POIDS_MAX = 300 * 1024
const QUALITE = { dense: { webp: 62, avif: 38 }, pleine: { webp: 74, avif: 44 } }

export function lireJson<T>(chemin: string, defaut: T): T {
  return existsSync(chemin) ? (JSON.parse(readFileSync(chemin, 'utf8')) as T) : defaut
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

/** Une largeur dérivée d'une image : les deux formats en mémoire. */
export interface TailleDerivee {
  largeur: number
  hauteur: number
  webp: Buffer
  avif: Buffer
}

export interface ImageDerivee {
  width: number
  height: number
  tailles: TailleDerivee[]
}

/**
 * Dérive une image en AVIF et WebP pour chaque largeur de LARGEURS que la source permet, ratio
 * conservé, sans recadrage ni correction, chaque fichier sous 300 kB : la qualité descend tant
 * qu'il faut, et une largeur dont un format ne tient pas arrête la série. En mémoire : le
 * pipeline Sanity (Phase 7.4) téléverse les résultats, `exporterImage` les écrit sur disque.
 */
export async function deriverImage(source: Buffer, id: string): Promise<ImageDerivee> {
  const meta = await sharp(source).rotate().metadata()
  const largeurSource = meta.width ?? 0
  const hauteurSource = meta.height ?? 0
  if (!largeurSource || !hauteurSource) throw new Error(`${id} : dimensions illisibles`)
  // Une source plus petite que 320 px est servie telle quelle, jamais agrandie.
  const largeurs = LARGEURS.filter((l) => l <= largeurSource)
  if (!largeurs.length) largeurs.push(largeurSource)
  const base = await sharp(source).rotate().toColourspace('srgb').png({ compressionLevel: 1 }).toBuffer()
  const deriver = async (largeur: number): Promise<TailleDerivee | null> => {
    const reduit = largeur === largeurSource ? base : await sharp(base).resize(largeur).png({ compressionLevel: 1 }).toBuffer()
    const sorties: Partial<Record<'webp' | 'avif', Buffer>> = {}
    for (const format of ['webp', 'avif'] as const) {
      let qualite = QUALITE[largeur <= 640 ? 'dense' : 'pleine'][format]
      let sortie = await sharp(reduit)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      while (sortie.length > POIDS_MAX && qualite > 28) {
        qualite -= 6
        sortie = await sharp(reduit)[format]({ quality: qualite, effort: format === 'webp' ? 5 : 6 }).toBuffer()
      }
      if (sortie.length <= POIDS_MAX) sorties[format] = sortie
    }
    if (!sorties.webp || !sorties.avif) return null
    return { largeur, hauteur: Math.round((largeur * hauteurSource) / largeurSource), webp: sorties.webp, avif: sorties.avif }
  }
  const tailles: TailleDerivee[] = []
  for (const largeur of largeurs) {
    const t = await deriver(largeur)
    if (!t) break
    tailles.push(t)
  }
  if (!tailles.length) throw new Error(`${id} : aucune largeur ne tient sous 300 kB`)
  const grande = tailles[tailles.length - 1]
  return { width: grande.largeur, height: grande.hauteur, tailles }
}

/**
 * Écrit `<id>-<largeur>.avif|webp` dans public/experience/groove-to-grave/img/ (dérivation par
 * `deriverImage`). Retourne les dimensions de la plus grande largeur gardée.
 */
export async function exporterImage(source: Buffer, id: string): Promise<ImageExportee> {
  dossier(PUBLIC_IMG)
  const d = await deriverImage(source, id)
  for (const t of d.tailles) {
    writeFileSync(join(PUBLIC_IMG, `${id}-${t.largeur}.webp`), t.webp)
    writeFileSync(join(PUBLIC_IMG, `${id}-${t.largeur}.avif`), t.avif)
  }
  return { width: d.width, height: d.height, largeurs: d.tailles.map((t) => t.largeur) }
}

/** Écrit un WAV PCM 16 bits à partir d'échantillons mono ou stéréo entrelacés dans [-1, 1]. */
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

/**
 * Estimation du tempo d'un fichier audio, en BPM : décodage mono à 11 025 Hz par ffmpeg, enveloppe
 * d'attaques (variation positive d'énergie par trames de 256 échantillons, environ 43 par seconde),
 * autocorrélation de l'enveloppe entre 70 et 180 BPM, le retard le plus corrélé l'emporte, avec une
 * préférence pour la plage 100 à 150 BPM quand un multiple ou un sous-multiple est aussi fort
 * (musiques de club du label). Suffisant pour la vitesse des bobines ; ce n'est pas une mesure
 * de référence.
 */
export function estimerBpm(chemin: string): number {
  const TAUX = 11025
  const TRAME = 256
  const brut = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', chemin, '-ac', '1', '-ar', String(TAUX), '-f', 'f32le', '-'], { maxBuffer: 256 * 1024 * 1024 })
  const pcm = new Float32Array(brut.buffer, brut.byteOffset, Math.floor(brut.byteLength / 4))
  const nTrames = Math.floor(pcm.length / TRAME)
  const energie = new Float32Array(nTrames)
  for (let t = 0; t < nTrames; t++) {
    let e = 0
    for (let i = t * TRAME; i < (t + 1) * TRAME; i++) e += pcm[i] * pcm[i]
    energie[t] = Math.sqrt(e / TRAME)
  }
  const attaques = new Float32Array(nTrames)
  for (let t = 1; t < nTrames; t++) attaques[t] = Math.max(0, energie[t] - energie[t - 1])
  const parSeconde = TAUX / TRAME
  const retardMin = Math.floor((60 / 180) * parSeconde)
  const retardMax = Math.ceil((60 / 70) * parSeconde)
  const scores = new Map<number, number>()
  for (let retard = retardMin; retard <= retardMax; retard++) {
    let somme = 0
    for (let t = retard; t < nTrames; t++) somme += attaques[t] * attaques[t - retard]
    scores.set(retard, somme / (nTrames - retard))
  }
  let meilleur = retardMin
  let max = -1
  for (const [retard, score] of scores) {
    const bpm = (60 * parSeconde) / retard
    const bonus = bpm >= 100 && bpm <= 150 ? 1.15 : 1
    if (score * bonus > max) {
      max = score * bonus
      meilleur = retard
    }
  }
  // Le retard est entier (une trame = 23 ms, soit 3 % à 126 BPM) : interpolation parabolique du pic entre ses voisins.
  const y0 = scores.get(meilleur - 1) ?? 0
  const y1 = scores.get(meilleur) ?? 0
  const y2 = scores.get(meilleur + 1) ?? 0
  const denominateur = y0 - 2 * y1 + y2
  const decalage = denominateur === 0 ? 0 : Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / denominateur))
  return Math.round((60 * parSeconde) / (meilleur + decalage))
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

/** Couleurs d'une pochette pour la cassette et les contrastes vérifiés (même forme que content/types.ts). */
export interface CouleursExtraites {
  dominant: string
  accent: string
  contrasteInk: { dominant: number; accent: number }
  contrastePoster: { dominant: number; accent: number }
}

function hsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6
    else if (max === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h, s, l }
}

const distance = (a: [number, number, number], b: [number, number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * Dominante et accent lus dans le disque inscrit de l'image (rayon 48 %), jamais dans les
 * coins : les pochettes vinyle publiées par le label sont l'étiquette ronde sur fond noir,
 * et ce fond n'est pas l'œuvre. Les pixels sont réduits à 4 bits par canal sur une vignette
 * de 96 px ; la dominante est le seau le plus peuplé, l'accent le seau le plus saturé et
 * assez éloigné de la dominante, pondéré par sa surface. Une image presque monochrome donne
 * un accent dérivé de la dominante (plus clair ou plus sombre). Source : chemin ou Buffer.
 */
export async function extraireCouleurs(source: string | Buffer): Promise<CouleursExtraites> {
  const TAILLE = 96
  const { data, info } = await sharp(source).rotate().resize(TAILLE, TAILLE, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const centre = (TAILLE - 1) / 2
  const rayon = TAILLE * 0.48
  const seaux = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (let y = 0; y < TAILLE; y++) {
    for (let x = 0; x < TAILLE; x++) {
      if (Math.hypot(x - centre, y - centre) > rayon) continue
      const i = (y * TAILLE + x) * info.channels
      const cle = `${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`
      const s = seaux.get(cle) ?? { n: 0, r: 0, g: 0, b: 0 }
      s.n++
      s.r += data[i]
      s.g += data[i + 1]
      s.b += data[i + 2]
      seaux.set(cle, s)
    }
  }
  const moyenne = (s: { n: number; r: number; g: number; b: number }): [number, number, number] => [s.r / s.n, s.g / s.n, s.b / s.n]
  let plusPeuple = { n: 0, r: 0, g: 0, b: 0 }
  for (const s of seaux.values()) if (s.n > plusPeuple.n) plusPeuple = s
  const domRgb = moyenne(plusPeuple)
  const dom = hex(...domRgb)
  let meilleur: { score: number; c: string } | null = null
  for (const s of seaux.values()) {
    const c = moyenne(s)
    const { s: sat, l } = hsl(c[0], c[1], c[2])
    const dist = distance(c, domRgb)
    if (dist < 70 || l < 0.12 || l > 0.9) continue
    const score = Math.sqrt(s.n) * (0.25 + sat) * Math.min(1, dist / 140)
    if (!meilleur || score > meilleur.score) meilleur = { score, c: hex(...c) }
  }
  let accent = meilleur?.c
  if (!accent) {
    const [r, g, b] = rgb(dom)
    const { l } = hsl(r, g, b)
    accent = l > 0.5 ? hex(r * 0.6, g * 0.6, b * 0.6) : hex(r + (255 - r) * 0.5, g + (255 - g) * 0.5, b + (255 - b) * 0.5)
  }
  return {
    dominant: dom,
    accent,
    contrasteInk: { dominant: contraste(INK, dom), accent: contraste(INK, accent) },
    contrastePoster: { dominant: contraste(POSTER, dom), accent: contraste(POSTER, accent) },
  }
}
