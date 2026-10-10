/**
 * Extraits provisoires de « Groove To Grave » : une boucle synthétique de 45 s par
 * sortie, distincte par BPM, motif de grosse caisse et ligne de basse, rendue en
 * TypeScript pur hors navigateur (recettes de docs/groove-to-grave/prototype-lecteur.html :
 * grosse caisse, charley, basse filtrée, souffle, pleurage au démarrage), écrite en WAV
 * puis encodée en MP3 192 kbps par ffmpeg avec fondus. Sans lien avec les vrais morceaux ;
 * attribuée à la seule piste A1 de chaque sortie par scripts/g2g-media.ts.
 *
 *   npx tsx scripts/g2g-extraits.ts
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import { CACHE, MEDIA, PUBLIC_AUDIO, dossier, dureeAudio, ecrireWav, ffmpeg, ffmpegDisponible } from './g2g-lib'

const SR = 44100
const DUREE = 45
const FONDU_ENTREE = 1
const FONDU_SORTIE = 2

interface Motif {
  /** Pas (sur 16) où frappe la grosse caisse. */
  kick: number[]
  /** Pas → fréquence de la basse en Hz. */
  basse: Record<number, number>
}

/** Motifs par sortie. Les quatre premiers viennent de la maquette, les autres sont écrits dans le même esprit. */
const MOTIFS: Record<string, Motif> = {
  gtgr01: { kick: [0, 4, 8, 12], basse: { 0: 43.65, 4: 43.65, 7: 51.91, 10: 43.65, 13: 38.89 } },
  gtgr02: { kick: [0, 4, 8, 12], basse: { 3: 49, 7: 49, 11: 58.27, 15: 49 } },
  gtgr03: { kick: [0, 6, 10, 13], basse: { 0: 36.71, 2: 36.71, 5: 73.42, 7: 36.71, 10: 55, 12: 36.71, 13: 43.65 } },
  gtgr04: { kick: [0, 4, 8, 12], basse: { 0: 41.2, 3: 41.2, 6: 82.4, 8: 41.2, 11: 61.74, 14: 55 } },
  gtgr05: { kick: [0, 4, 8, 12], basse: { 2: 55, 3: 55, 6: 65.41, 7: 55, 10: 49, 11: 55, 14: 82.41 } },
  gtgrva01: { kick: [0, 4, 8, 12], basse: { 2: 46.25, 6: 46.25, 9: 69.3, 12: 46.25, 14: 51.91 } },
  gtgrva02: { kick: [0, 4, 8, 11, 12], basse: { 1: 41.2, 5: 41.2, 8: 61.74, 11: 41.2, 14: 46.25 } },
}

// ─── Briques de synthèse ───

/** Filtre biquad (formules RBJ), identique en esprit au BiquadFilterNode de la maquette. */
class Biquad {
  private b0 = 1
  private b1 = 0
  private b2 = 0
  private a1 = 0
  private a2 = 0
  private x1 = 0
  private x2 = 0
  private y1 = 0
  private y2 = 0
  constructor(private readonly type: 'lowpass' | 'highpass' | 'bandpass', freq: number, private readonly q = 0.7071) {
    this.regler(freq)
  }
  regler(freq: number): void {
    const w0 = (2 * Math.PI * Math.min(freq, SR / 2 - 1)) / SR
    const cos = Math.cos(w0)
    const sin = Math.sin(w0)
    const alpha = sin / (2 * this.q)
    let b0: number
    let b1: number
    let b2: number
    if (this.type === 'lowpass') {
      b0 = (1 - cos) / 2
      b1 = 1 - cos
      b2 = b0
    } else if (this.type === 'highpass') {
      b0 = (1 + cos) / 2
      b1 = -(1 + cos)
      b2 = b0
    } else {
      b0 = alpha
      b1 = 0
      b2 = -alpha
    }
    const a0 = 1 + alpha
    this.b0 = b0 / a0
    this.b1 = b1 / a0
    this.b2 = b2 / a0
    this.a1 = (-2 * cos) / a0
    this.a2 = (1 - alpha) / a0
  }
  traiter(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1
    this.x1 = x
    this.y2 = this.y1
    this.y1 = y
    return y
  }
}

/** Enveloppe exponentielle de `a` vers 0,001 en `d` secondes (exponentialRampToValueAtTime). */
const env = (t: number, a: number, d: number) => (t < 0 || t > d ? 0 : a * Math.pow(0.001 / a, t / d))
/** Rampe exponentielle de fréquence entre deux valeurs. */
const rampe = (t: number, f0: number, f1: number, d: number) => (t >= d ? f1 : f0 * Math.pow(f1 / f0, t / d))
/** Pleurage au démarrage de bande : −500 cents qui remontent en 0,5 s. */
const pleurage = (t: number) => {
  const r = Math.min(1, t / 0.5)
  return -500 * (1 - r) * (1 - r)
}
const cents = (c: number) => Math.pow(2, c / 1200)

/** Bruit blanc déterministe (xorshift), pour un rendu identique d'une exécution à l'autre. */
function bruit(graine: number): () => number {
  let x = graine || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) / 4294967296) * 2 - 1
  }
}

function rendre(ref: string, bpm: number, motif: Motif): Float32Array {
  const n = SR * DUREE
  const sortie = new Float32Array(n)
  const alea = bruit(ref.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0)
  const ajouter = (debut: number, duree: number, voix: (t: number) => number) => {
    const i0 = Math.floor(debut * SR)
    const i1 = Math.min(n, Math.floor((debut + duree) * SR))
    for (let i = i0; i < i1; i++) sortie[i] += voix((i - i0) / SR)
  }

  const pas = 60 / bpm / 4
  for (let s = 0, t = 0; t < DUREE; s++, t += pas) {
    const etape = s % 16
    const wob = cents(pleurage(t))
    if (motif.kick.includes(etape)) {
      let phase = 0
      ajouter(t, 0.33, (tt) => {
        phase += (2 * Math.PI * rampe(tt, 150, 42, 0.12) * wob) / SR
        return Math.sin(phase) * env(tt, 0.9, 0.32)
      })
    }
    const v = etape % 4 === 2 ? 0.22 : etape % 2 === 1 ? 0.06 : 0
    if (v) {
      const hp = new Biquad('highpass', 7000)
      ajouter(t, 0.06, (tt) => hp.traiter(alea()) * env(tt, v, 0.05))
    }
    const f = motif.basse[etape]
    if (f) {
      const lp = new Biquad('lowpass', 320, 9)
      let phase = 0
      let k = 0
      ajouter(t, 0.21, (tt) => {
        if (k++ % 16 === 0) lp.regler(tt < 0.04 ? rampe(tt, 320, 1100, 0.04) : rampe(tt - 0.04, 1100, 260, 0.18))
        phase += (2 * Math.PI * f * wob * cents(Math.sin((t + tt) * 5) * 6)) / SR
        const saw = ((phase / Math.PI) % 2) - 1
        return lp.traiter(saw) * env(tt, 0.32, 0.2)
      })
    }
  }

  // Souffle de bande, très léger, passe-haut 5 kHz.
  const souffle = new Biquad('highpass', 5000)
  for (let i = 0; i < n; i++) sortie[i] += souffle.traiter(alea()) * 0.025

  // Gain général de la maquette, douce saturation, fondus.
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const fondu = Math.min(1, t / FONDU_ENTREE, (DUREE - t) / FONDU_SORTIE)
    sortie[i] = Math.tanh(sortie[i] * 0.42 * 1.6) * fondu
  }
  return sortie
}

if (!ffmpegDisponible()) {
  process.stderr.write('ffmpeg introuvable : installer ffmpeg (brew install ffmpeg) avant de lancer ce script.\n')
  process.exit(1)
}
dossier(join(CACHE, 'extraits'))
dossier(PUBLIC_AUDIO)
const provisoires: { track: string; file: string; bpm: number; duration: number }[] = []
// Toujours la première piste de la sortie : A1 d'un vinyle, piste 1 d'une compilation.
for (const s of sorties) {
  const motif = MOTIFS[s.ref]
  if (!motif) {
    process.stdout.write(`  ${s.ref} : pas de motif, pas d'extrait provisoire\n`)
    continue
  }
  const piste = s.tracks[0].id
  const wav = join(CACHE, 'extraits', `${piste}.wav`)
  const file = `${piste}-provisoire.mp3`
  ecrireWav(wav, rendre(s.ref, s.bpmProvisoire, motif), SR)
  ffmpeg(['-i', wav, '-codec:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100', '-ac', '1', join(PUBLIC_AUDIO, file)])
  const duration = dureeAudio(join(PUBLIC_AUDIO, file))
  provisoires.push({ track: piste, file, bpm: s.bpmProvisoire, duration })
  process.stdout.write(`  ${s.ref} ${s.bpmProvisoire} BPM → ${file} (${duration} s)\n`)
}
writeFileSync(join(MEDIA, 'provisoires.json'), JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), extraits: provisoires }, null, 2) + '\n')
process.stdout.write(`${provisoires.length} extrait(s) provisoire(s) écrits dans public/experience/groove-to-grave/audio/\n`)
