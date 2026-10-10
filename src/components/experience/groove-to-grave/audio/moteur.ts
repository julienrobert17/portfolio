import type { Preset } from '../content/types'
import { COURBES, dbVersGain, gainNormalisation } from './presets'
import { SonsInterface } from './sons-interface'

/**
 * Le moteur audio : un singleton de module, hors React, qui possède le seul HTMLAudioElement,
 * l'AudioContext et le graphe (le MediaElementAudioSourceNode ne se crée qu'une fois par
 * élément). Rien n'est créé avant `demarrer()`, appelé dans un gestionnaire de clic : ce
 * premier geste crée le contexte, le reprend et lance la lecture de façon synchrone (iOS).
 *
 * Chaîne : élément → graves (lowshelf 110) → médiums (peaking 1,2 k) → aigus (highshelf 6 k)
 * → passe-haut → normalisation (marge −6 dB) → analyseur → limiteur → gain général → sortie.
 * Les sons d'interface et le souffle ont leurs gains séparés vers le limiteur.
 */
export interface Reglages {
  volume: number
  muet: boolean
  muetUi: boolean
}

export interface EvenementsMoteur {
  position(secondes: number): void
  termine(): void
  interrompu(): void
  pret(): void
}

const CLE_REGLAGES = 'g2g-lecteur'
const PLEURAGE_DUREE = 0.5

export class Moteur {
  readonly audio: HTMLAudioElement
  private ctx: AudioContext | null = null
  private analyseur: AnalyserNode | null = null
  private donnees: Uint8Array<ArrayBuffer> | null = null
  private eq: { graves: BiquadFilterNode; mediums: BiquadFilterNode; aigus: BiquadFilterNode; passeHaut: BiquadFilterNode } | null = null
  private normalisation: GainNode | null = null
  private master: GainNode | null = null
  private gainUi: GainNode | null = null
  private gainSouffle: GainNode | null = null
  private sons: SonsInterface | null = null
  private preset: Preset = 'tout'
  private reglages: Reglages = { volume: 0.7, muet: false, muetUi: false }
  private pleurageDepart = 0
  private ecouteurs: EvenementsMoteur | null = null
  private enLecture = false

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'none'
    this.audio.crossOrigin = 'anonymous'
    this.audio.preservesPitch = false
    this.reglages = this.lireReglages()
    this.audio.addEventListener('timeupdate', () => this.ecouteurs?.position(this.audio.currentTime))
    this.audio.addEventListener('ended', () => {
      this.enLecture = false
      this.ecouteurs?.termine()
    })
    this.audio.addEventListener('pause', () => {
      // Pause venue d'ailleurs (Media Session, interruption système) : l'état doit la refléter.
      if (this.enLecture && !this.audio.ended) {
        this.enLecture = false
        this.ecouteurs?.interrompu()
      }
    })
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        // iOS : la lecture au travers du graphe s'arrête au verrouillage ; on passe honnêtement en pause.
        if (document.visibilityState === 'hidden' && this.enLecture) this.pause()
      })
    }
  }

  get pret(): boolean {
    return this.ctx !== null
  }

  get reglagesActuels(): Reglages {
    return this.reglages
  }

  ecouter(ecouteurs: EvenementsMoteur): void {
    this.ecouteurs = ecouteurs
  }

  /** Crée le contexte et le graphe au premier geste ; reprend le contexte s'il est suspendu. Synchrone. */
  demarrer(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state !== 'running') void this.ctx.resume()
      return this.ctx
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    const source = ctx.createMediaElementSource(this.audio)
    const graves = ctx.createBiquadFilter()
    graves.type = 'lowshelf'
    graves.frequency.value = 110
    const mediums = ctx.createBiquadFilter()
    mediums.type = 'peaking'
    mediums.frequency.value = 1200
    mediums.Q.value = 1
    const aigus = ctx.createBiquadFilter()
    aigus.type = 'highshelf'
    aigus.frequency.value = 6000
    const passeHaut = ctx.createBiquadFilter()
    passeHaut.type = 'highpass'
    passeHaut.frequency.value = 20
    this.eq = { graves, mediums, aigus, passeHaut }
    this.normalisation = ctx.createGain()
    this.analyseur = ctx.createAnalyser()
    this.analyseur.fftSize = 256
    this.analyseur.smoothingTimeConstant = 0.75
    this.donnees = new Uint8Array(this.analyseur.frequencyBinCount)
    const limiteur = ctx.createDynamicsCompressor()
    limiteur.threshold.value = -3
    limiteur.knee.value = 0
    limiteur.ratio.value = 20
    limiteur.attack.value = 0.003
    limiteur.release.value = 0.1
    this.master = ctx.createGain()
    this.gainUi = ctx.createGain()
    this.gainSouffle = ctx.createGain()
    this.gainSouffle.gain.value = 0
    source.connect(graves)
    graves.connect(mediums)
    mediums.connect(aigus)
    aigus.connect(passeHaut)
    passeHaut.connect(this.normalisation)
    this.normalisation.connect(this.analyseur)
    this.analyseur.connect(limiteur)
    this.gainUi.connect(limiteur)
    this.gainSouffle.connect(limiteur)
    limiteur.connect(this.master)
    this.master.connect(ctx.destination)
    this.sons = new SonsInterface(ctx, this.gainUi)
    this.sons.souffle(this.gainSouffle)
    this.appliquerReglages()
    this.appliquerPreset(this.preset, true)
    ctx.addEventListener('statechange', () => {
      // Contexte suspendu ou interrompu (iOS) pendant la lecture : l'état passe en pause, la reprise attend un geste.
      if (ctx.state !== 'running' && this.enLecture) {
        this.audio.pause()
        this.enLecture = false
        this.ecouteurs?.interrompu()
      }
    })
    if (ctx.state !== 'running') void ctx.resume()
    this.ecouteurs?.pret()
    return ctx
  }

  /** Charge un extrait et lance la lecture avec le clac et le pleurage de démarrage. À appeler dans un geste. */
  lire(src: string): void {
    const ctx = this.demarrer()
    if (this.audio.src !== new URL(src, location.href).href) {
      this.audio.src = src
      this.audio.load()
    }
    this.sons?.clac()
    this.lancer(ctx)
  }

  /** Reprend la lecture courante (après pause), avec un clac. */
  reprendre(): void {
    if (!this.audio.src) return
    const ctx = this.demarrer()
    this.sons?.clac()
    this.lancer(ctx)
  }

  private lancer(ctx: AudioContext): void {
    this.enLecture = true
    this.pleurageDepart = ctx.currentTime + 0.1
    this.audio.playbackRate = 0.72
    this.gainSouffle?.gain.setTargetAtTime(dbVersGain(-34), ctx.currentTime, 0.1)
    const promesse = this.audio.play()
    if (promesse) promesse.catch(() => {
      this.enLecture = false
      this.ecouteurs?.interrompu()
    })
  }

  /** Pleurage de démarrage de bande : à appeler à chaque frame tant que la vitesse n'est pas revenue à 1. Vrai tant que ça pleure. */
  pleurer(): boolean {
    if (!this.ctx || !this.enLecture) return false
    const r = Math.min(1, Math.max(0, (this.ctx.currentTime - this.pleurageDepart) / PLEURAGE_DUREE))
    const taux = 0.72 + 0.28 * (1 - (1 - r) * (1 - r))
    this.audio.playbackRate = r >= 1 ? 1 : taux
    return r < 1
  }

  pause(): void {
    if (!this.ctx) return
    this.enLecture = false
    this.sons?.clac()
    this.audio.pause()
    this.gainSouffle?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
  }

  stop(): void {
    if (!this.ctx) return
    this.enLecture = false
    this.sons?.clac()
    this.audio.pause()
    this.audio.currentTime = 0
    this.gainSouffle?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
  }

  chercher(secondes: number): void {
    if (!this.audio.src) return
    this.audio.currentTime = secondes
  }

  get position(): number {
    return this.audio.currentTime
  }

  get duree(): number {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0
  }

  get joue(): boolean {
    return this.enLecture
  }

  /** Preset : courbe d'égalisation et normalisation, en 80 ms. Sans son d'interface. */
  appliquerPreset(preset: Preset, immediat = false): void {
    this.preset = preset
    if (!this.ctx || !this.eq || !this.normalisation) return
    const c = COURBES[preset]
    const t = this.ctx.currentTime
    const cst = immediat ? 0 : 0.08
    this.eq.graves.gain.setTargetAtTime(c.graves, t, cst)
    this.eq.mediums.gain.setTargetAtTime(c.mediums, t, cst)
    this.eq.aigus.gain.setTargetAtTime(c.aigus, t, cst)
    this.eq.passeHaut.frequency.setTargetAtTime(c.passeHaut, t, cst)
    this.normalisation.gain.setTargetAtTime(gainNormalisation(preset), t, cst)
  }

  /** Changement de page : avance rapide, musique abaissée puis remontée, jamais coupée. */
  avanceRapide(): void {
    if (!this.ctx || !this.sons || !this.normalisation) return
    const t = this.ctx.currentTime
    const duree = this.sons.avanceRapide(t)
    const base = gainNormalisation(this.preset)
    this.normalisation.gain.cancelScheduledValues(t)
    this.normalisation.gain.setValueAtTime(base, t)
    this.normalisation.gain.linearRampToValueAtTime(base * 0.25, t + 0.05)
    this.normalisation.gain.linearRampToValueAtTime(base, t + duree)
  }

  /** Retour au début de page : rembobinage. */
  rembobiner(): void {
    if (!this.ctx || !this.sons) return
    this.sons.rembobinage()
  }

  regler(partiel: Partial<Reglages>): void {
    this.reglages = { ...this.reglages, ...partiel }
    this.appliquerReglages()
    try {
      localStorage.setItem(CLE_REGLAGES, JSON.stringify(this.reglages))
    } catch {
      // Stockage indisponible : les réglages vivent le temps de la page.
    }
  }

  private appliquerReglages(): void {
    if (!this.ctx || !this.master || !this.gainUi) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(this.reglages.muet ? 0 : this.reglages.volume * 0.85, t, 0.03)
    this.gainUi.gain.setTargetAtTime(this.reglages.muetUi ? 0 : 1, t, 0.03)
  }

  private lireReglages(): Reglages {
    try {
      const brut = localStorage.getItem(CLE_REGLAGES)
      if (brut) {
        const r = JSON.parse(brut) as Partial<Reglages>
        return { volume: typeof r.volume === 'number' ? Math.min(1, Math.max(0, r.volume)) : 0.7, muet: Boolean(r.muet), muetUi: Boolean(r.muetUi) }
      }
    } catch {
      // Stockage indisponible ou valeur corrompue : réglages par défaut.
    }
    return { volume: 0.7, muet: false, muetUi: false }
  }

  /** Niveaux du spectre, 0 à 1 par colonne, depuis l'analyseur ; tableau vide avant le premier geste. */
  spectre(colonnes: number, sortie: Float32Array): boolean {
    if (!this.analyseur || !this.donnees) return false
    this.analyseur.getByteFrequencyData(this.donnees)
    const n = this.donnees.length
    for (let i = 0; i < colonnes; i++) {
      // Répartition logarithmique approchée : les graves occupent plus de colonnes.
      const a = Math.floor(Math.pow(i / colonnes, 1.6) * n * 0.55)
      const b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / colonnes, 1.6) * n * 0.55))
      let max = 0
      for (let k = a; k < b && k < n; k++) if (this.donnees[k] > max) max = this.donnees[k]
      sortie[i] = max / 255
    }
    return true
  }

  /** Flux audio de la sortie générale, pour l'enregistrement d'écran avec le son (scripts de captures). */
  flux(): MediaStream | null {
    if (!this.ctx || !this.master) return null
    const dest = this.ctx.createMediaStreamDestination()
    this.master.connect(dest)
    return dest.stream
  }
}

let instance: Moteur | null = null

declare global {
  interface Window {
    /** Outil de capture (scripts/g2g-video.ts) : flux audio de la sortie générale. */
    __g2g?: { flux: () => MediaStream | null }
  }
}

/** Le seul moteur de la page, créé à la demande côté client (jamais au rendu serveur). */
export function moteur(): Moteur {
  if (!instance) {
    instance = new Moteur()
    if (typeof window !== 'undefined') window.__g2g = { flux: () => instance?.flux() ?? null }
  }
  return instance
}
