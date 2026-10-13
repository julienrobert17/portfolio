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
  /** L'extrait n'a pas pu être lu : erreur de l'élément, lecture refusée, ou rien au bout de DELAI_ECHEC. */
  echec(raison: string): void
}

const CLE_REGLAGES = 'g2g-lecteur'
/**
 * Au-delà de ce délai sans une seule seconde jouée après le geste, l'extrait est déclaré
 * indisponible : le lecteur le dit au lieu de souffler dans le vide (bloc 7.5a).
 */
const DELAI_ECHEC = 3000
const PLEURAGE_DUREE = 0.5
export const VOLUME_DEFAUT = 0.85
/**
 * Le DynamicsCompressorNode applique un gain de compensation automatique qu'on ne peut pas
 * désactiver : ce trim le retire après le limiteur, calibré par mesure (brief §13.1) pour
 * −16 LUFS intégrés sur TOUT au volume par défaut.
 */
const TRIM_LIMITEUR_DB = -5

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
  private reglages: Reglages = { volume: VOLUME_DEFAUT, muet: false, muetUi: false }
  private pleurageDepart = 0
  private ecouteurs: EvenementsMoteur | null = null
  private enLecture = false
  private veille: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'none'
    this.audio.crossOrigin = 'anonymous'
    this.audio.preservesPitch = false
    this.reglages = this.lireReglages()
    this.audio.addEventListener('timeupdate', () => {
      // Une seconde jouée : l'extrait est bien arrivé, la veille d'échec n'a plus lieu d'être.
      if (this.audio.currentTime > 0.05) this.annulerVeille()
      this.ecouteurs?.position(this.audio.currentTime)
    })
    this.audio.addEventListener('playing', () => {
      if (this.audio.currentTime > 0.05) this.annulerVeille()
    })
    this.audio.addEventListener('error', () => {
      const e = this.audio.error
      const noms = ['', 'lecture interrompue', 'réseau', 'décodage', 'format ou adresse refusés']
      this.echouer(e ? `${noms[e.code] ?? 'erreur'}${e.message ? ` (${e.message})` : ''}` : 'erreur de l’élément audio')
    })
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
    this.analyseur.fftSize = 2048
    this.analyseur.smoothingTimeConstant = 0.5
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
    this.annulerVeille()
    this.veille = setTimeout(() => {
      if (this.enLecture && this.audio.currentTime <= 0.05) this.echouer(`rien n’est arrivé en ${DELAI_ECHEC / 1000} s`)
    }, DELAI_ECHEC)
    const promesse = this.audio.play()
    if (promesse) promesse.catch((e: unknown) => this.echouer(`lecture refusée (${e instanceof Error ? e.name : 'inconnu'})`))
  }

  private annulerVeille(): void {
    if (this.veille) clearTimeout(this.veille)
    this.veille = null
  }

  /** Coupe tout (lecture, souffle) et prévient le lecteur, qui affiche l'échec et propose Bandcamp. */
  private echouer(raison: string): void {
    this.annulerVeille()
    if (!this.enLecture && !this.audio.error) return
    this.enLecture = false
    try {
      this.audio.pause()
    } catch {
      // L'élément peut déjà être dans un état impossible : l'échec est signalé quand même.
    }
    if (this.ctx) this.gainSouffle?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
    this.ecouteurs?.echec(raison)
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
    this.annulerVeille()
    this.enLecture = false
    this.sons?.clac()
    this.audio.pause()
    this.gainSouffle?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
  }

  stop(): void {
    if (!this.ctx) return
    this.annulerVeille()
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

  /** État du contexte audio : 'absent' tant qu'aucun geste ne l'a créé, puis celui du navigateur. */
  get etatAudio(): string {
    return this.ctx?.state ?? 'absent'
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
    this.master.gain.setTargetAtTime(this.reglages.muet ? 0 : this.reglages.volume * dbVersGain(TRIM_LIMITEUR_DB), t, 0.03)
    this.gainUi.gain.setTargetAtTime(this.reglages.muetUi ? 0 : 1, t, 0.03)
  }

  private lireReglages(): Reglages {
    try {
      const brut = localStorage.getItem(CLE_REGLAGES)
      if (brut) {
        const r = JSON.parse(brut) as Partial<Reglages>
        return { volume: typeof r.volume === 'number' ? Math.min(1, Math.max(0, r.volume)) : VOLUME_DEFAUT, muet: Boolean(r.muet), muetUi: Boolean(r.muetUi) }
      }
    } catch {
      // Stockage indisponible ou valeur corrompue : réglages par défaut.
    }
    return { volume: VOLUME_DEFAUT, muet: false, muetUi: false }
  }

  /**
   * Niveaux du spectre, 0 à 1 par bande : 32 bandes réparties en fréquence logarithmique de
   * 40 Hz à 16 kHz, chacune moyennée sur ses cases d'analyseur. Faux avant le premier geste.
   */
  spectre(bandes: number, sortie: Float32Array): boolean {
    if (!this.ctx || !this.analyseur || !this.donnees) return false
    this.analyseur.getByteFrequencyData(this.donnees)
    const largeurCase = this.ctx.sampleRate / this.analyseur.fftSize
    const n = this.donnees.length
    const fMin = 40
    const fMax = 16000
    for (let i = 0; i < bandes; i++) {
      const f0 = fMin * Math.pow(fMax / fMin, i / bandes)
      const f1 = fMin * Math.pow(fMax / fMin, (i + 1) / bandes)
      const a = Math.min(n - 1, Math.floor(f0 / largeurCase))
      const b = Math.min(n, Math.max(a + 1, Math.ceil(f1 / largeurCase)))
      let somme = 0
      for (let k = a; k < b; k++) somme += this.donnees[k]
      sortie[i] = somme / (b - a) / 255
    }
    return true
  }

  /** Énergie des graves (40 à 160 Hz), 0 à 1, pour la respiration du mur. */
  graves(): number {
    if (!this.ctx || !this.analyseur || !this.donnees || !this.enLecture) return 0
    const largeurCase = this.ctx.sampleRate / this.analyseur.fftSize
    const a = Math.floor(40 / largeurCase)
    const b = Math.max(a + 1, Math.ceil(160 / largeurCase))
    let somme = 0
    for (let k = a; k < b; k++) somme += this.donnees[k]
    return somme / (b - a) / 255
  }

  /** Outils de mesure (scripts) : un son d'interface seul, le souffle seul, ou la musique coupée. */
  mesure(quoi: 'clac' | 'avance' | 'souffle' | 'musique', actif = true): void {
    if (!this.ctx || !this.sons || !this.normalisation || !this.gainSouffle) return
    const t = this.ctx.currentTime
    if (quoi === 'clac') this.sons.clac(t)
    else if (quoi === 'avance') this.sons.avanceRapide(t)
    else if (quoi === 'souffle') this.gainSouffle.gain.setTargetAtTime(actif ? dbVersGain(-34) : 0, t, 0.02)
    else this.normalisation.gain.setTargetAtTime(actif ? gainNormalisation(this.preset) : 0, t, 0.02)
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
    /** Outils de capture et de vérification (scripts/g2g-verif.ts, g2g-planche-captures.ts). */
    __g2g?: {
      flux: () => MediaStream | null
      mesure: (quoi: 'clac' | 'avance' | 'souffle' | 'musique', actif?: boolean) => void
      position: () => number
      /** État de l'AudioContext ('absent' avant le premier geste), pour les vérifications en production. */
      etatAudio: () => string
      /** Fige la transition de page (avance rapide du mur et balayage) à une progression de 0 à 1, null pour la libérer. */
      figerTransition: (p: number | null) => void
    }
  }
}

/** Le seul moteur de la page, créé à la demande côté client (jamais au rendu serveur). */
export function moteur(): Moteur {
  if (!instance) {
    instance = new Moteur()
    if (typeof window !== 'undefined') window.__g2g = { ...window.__g2g, flux: () => instance?.flux() ?? null, mesure: (quoi, actif) => instance?.mesure(quoi, actif), position: () => instance?.position ?? -1, etatAudio: () => instance?.etatAudio ?? 'absent', figerTransition: window.__g2g?.figerTransition ?? (() => undefined) }
  }
  return instance
}
