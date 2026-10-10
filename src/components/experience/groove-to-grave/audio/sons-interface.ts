import { dbVersGain } from './presets'

/**
 * Sons d'interface synthétisés en Web Audio, à partir des recettes de la maquette, poids nul.
 * Tous passent par le gain séparé `sortie`. Niveaux du brief §3.7 : clac −14 dB, avance rapide
 * et rembobinage −16 dB. Pas de son au survol ni sur les presets.
 */
export class SonsInterface {
  private bruit: AudioBuffer

  constructor(
    private readonly ctx: AudioContext,
    private readonly sortie: GainNode,
  ) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    this.bruit = b
  }

  private enveloppe(t: number, a: number, d: number): GainNode {
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(a, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + d)
    g.connect(this.sortie)
    return g
  }

  /** « Clac » mécanique : insertion, lecture, pause, stop. */
  clac(quand = this.ctx.currentTime): void {
    const t = quand
    const niveau = dbVersGain(-14)
    const o = this.ctx.createOscillator()
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(50, t + 0.06)
    o.connect(this.enveloppe(t, niveau * 2.5, 0.07))
    o.start(t)
    o.stop(t + 0.08)
    const s = this.ctx.createBufferSource()
    s.buffer = this.bruit
    const h = this.ctx.createBiquadFilter()
    h.type = 'bandpass'
    h.frequency.value = 1800
    s.connect(h)
    h.connect(this.enveloppe(t, niveau * 2, 0.025))
    s.start(t)
    s.stop(t + 0.03)
  }

  /** Avance rapide : sifflement de bande qui monte et souffle, puis clac. Durée 0,42 s. */
  avanceRapide(quand = this.ctx.currentTime): number {
    const t = quand
    const niveau = dbVersGain(-16)
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(300, t)
    o.frequency.exponentialRampToValueAtTime(2600, t + 0.38)
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1500
    f.Q.value = 2
    const a = this.ctx.createGain()
    a.gain.setValueAtTime(0, t)
    a.gain.linearRampToValueAtTime(niveau * 0.4, t + 0.05)
    a.gain.linearRampToValueAtTime(0, t + 0.4)
    o.connect(f)
    f.connect(a)
    a.connect(this.sortie)
    o.start(t)
    o.stop(t + 0.42)
    const s = this.ctx.createBufferSource()
    s.buffer = this.bruit
    s.connect(this.enveloppe(t, niveau * 0.7, 0.4))
    s.start(t)
    s.stop(t + 0.42)
    this.clac(t + 0.42)
    return 0.45
  }

  /** Rembobinage : sifflement qui descend, souffle, puis clac. Durée 0,7 s. */
  rembobinage(quand = this.ctx.currentTime): number {
    const t = quand
    const niveau = dbVersGain(-16)
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(2200, t)
    o.frequency.exponentialRampToValueAtTime(180, t + 0.6)
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1200
    f.Q.value = 2
    const a = this.ctx.createGain()
    a.gain.setValueAtTime(0, t)
    a.gain.linearRampToValueAtTime(niveau * 0.4, t + 0.05)
    a.gain.linearRampToValueAtTime(0, t + 0.62)
    o.connect(f)
    f.connect(a)
    a.connect(this.sortie)
    o.start(t)
    o.stop(t + 0.65)
    const s = this.ctx.createBufferSource()
    s.buffer = this.bruit
    s.connect(this.enveloppe(t, niveau * 0.6, 0.6))
    s.start(t)
    s.stop(t + 0.65)
    this.clac(t + 0.66)
    return 0.72
  }

  /** Souffle de bande très léger (−34 dB), connecté sur `cible`, démarré tout de suite ; à moduler par `cible.gain`. */
  souffle(cible: GainNode): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource()
    s.buffer = this.bruit
    s.loop = true
    const h = this.ctx.createBiquadFilter()
    h.type = 'highpass'
    h.frequency.value = 5000
    s.connect(h)
    h.connect(cible)
    s.start()
    return s
  }
}
