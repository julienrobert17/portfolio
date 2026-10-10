import { useSyncExternalStore } from 'react'
import type { Preset } from '../content/types'
import { moteur } from '../audio/moteur'

/** Piste jouable, telle que le layout la sérialise pour le lecteur (données plates, pas de fonctions). */
export interface PisteJouable {
  id: string
  sortieRef: string
  catalog: string
  artiste: string
  titre: string
  position: string
  format: string
  src: string
  duration: number
  bpm: number
  origine: 'label' | 'public' | 'provisoire'
  genres: string[]
  bandcamp: string
  /** Couleurs de la cassette dans la fenêtre du lecteur. */
  coque: string
  bande: string
  texteBande: string
  /** Identifiant de pochette pour la Media Session, s'il y a une image. */
  pochette?: string
}

export type Statut = 'vide' | 'lecture' | 'pause' | 'arret'

export interface EtatLecteur {
  /** Le moteur a été créé par un geste. */
  pret: boolean
  statut: Statut
  piste: PisteJouable | null
  position: number
  preset: Preset
  volume: number
  muet: boolean
  muetUi: boolean
  mini: boolean
  feuille: boolean
  menu: boolean
  /** Message pour la région aria-live. */
  annonce: string
}

const BPM_DEFAUT = 124

let etat: EtatLecteur = {
  pret: false,
  statut: 'vide',
  piste: null,
  position: 0,
  preset: 'tout',
  volume: 0.7,
  muet: false,
  muetUi: false,
  mini: false,
  feuille: false,
  menu: false,
  annonce: '',
}

const ETAT_SERVEUR: EtatLecteur = etat
let catalogue: PisteJouable[] = []
const ecouteurs = new Set<() => void>()

function notifier(): void {
  for (const fn of ecouteurs) fn()
}

function poser(partiel: Partial<EtatLecteur>): void {
  etat = { ...etat, ...partiel }
  notifier()
}

export function abonner(fn: () => void): () => void {
  ecouteurs.add(fn)
  return () => {
    ecouteurs.delete(fn)
  }
}

export const lireEtat = (): EtatLecteur => etat
export const lireEtatServeur = (): EtatLecteur => ETAT_SERVEUR

export function useLecteur(): EtatLecteur {
  return useSyncExternalStore(abonner, lireEtat, lireEtatServeur)
}

/** Pistes jouables connues, posées par le lecteur au montage. */
export function definirCatalogue(pistes: PisteJouable[]): void {
  catalogue = pistes
  // Réglages persistés lus par le moteur (sans créer de contexte audio).
  const r = moteur().reglagesActuels
  if (etat.volume !== r.volume || etat.muet !== r.muet || etat.muetUi !== r.muetUi) poser({ volume: r.volume, muet: r.muet, muetUi: r.muetUi })
}

export function lireCatalogue(): PisteJouable[] {
  return catalogue
}

/** Pistes du filtre courant, dans l'ordre du mur (série puis compilations, du plus récent au plus ancien). */
export function pistesFiltrees(preset: Preset = etat.preset): PisteJouable[] {
  return catalogue.filter((p) => preset === 'tout' || p.genres.includes(preset))
}

/** Nombre de sorties du filtre, compteur SORTIES. */
export function compteSorties(preset: Preset = etat.preset): number {
  return new Set(pistesFiltrees(preset).map((p) => p.sortieRef)).size
}

let brancheMoteur = false

function brancher(): void {
  if (brancheMoteur) return
  brancheMoteur = true
  moteur().ecouter({
    position: (s) => {
      if (Math.abs(s - etat.position) >= 0.25) poser({ position: s })
    },
    termine: () => {
      // Fin de l'extrait : la piste suivante du filtre, sinon retour au début.
      const liste = pistesFiltrees()
      const i = liste.findIndex((p) => p.id === etat.piste?.id)
      if (i > -1 && i < liste.length - 1) lire(liste[i + 1])
      else poser({ statut: 'arret', position: 0, annonce: 'Fin de bande' })
    },
    interrompu: () => {
      if (etat.statut === 'lecture') poser({ statut: 'pause', annonce: `Pause : ${etat.piste?.catalog ?? ''}` })
    },
    pret: () => poser({ pret: true }),
  })
}

function mediaSession(piste: PisteJouable): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  ms.metadata = new MediaMetadata({
    title: `${piste.titre} (${piste.position})`,
    artist: piste.artiste,
    album: `${piste.catalog} · Groove To Grave Records`,
    artwork: piste.pochette ? [{ src: `/experience/groove-to-grave/img/${piste.pochette}-320.webp`, sizes: '320x320', type: 'image/webp' }] : [],
  })
  ms.setActionHandler('play', () => reprendre())
  ms.setActionHandler('pause', () => pause())
  ms.setActionHandler('previoustrack', () => precedent())
  ms.setActionHandler('nexttrack', () => suivant())
  ms.setActionHandler('stop', () => stop())
}

/** Lance une piste (geste utilisateur) : insertion, clac, démarrage de bande. */
export function lire(piste: PisteJouable): void {
  brancher()
  moteur().lire(piste.src)
  mediaSession(piste)
  poser({ pret: true, statut: 'lecture', piste, position: 0, annonce: `Lecture : ${piste.catalog}, ${piste.artiste}, ${piste.titre}` })
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
}

export function reprendre(): void {
  if (!etat.piste) {
    const premiere = pistesFiltrees()[0] ?? catalogue[0]
    if (premiere) lire(premiere)
    return
  }
  brancher()
  moteur().reprendre()
  poser({ pret: true, statut: 'lecture', annonce: `Lecture : ${etat.piste.catalog}` })
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
}

export function pause(): void {
  if (etat.statut !== 'lecture') return
  moteur().pause()
  poser({ statut: 'pause', annonce: `Pause : ${etat.piste?.catalog ?? ''}` })
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
}

export function stop(): void {
  if (etat.statut === 'vide') return
  moteur().stop()
  poser({ statut: 'arret', position: 0, annonce: 'Stop' })
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
}

/** Lecture ou pause selon l'état ; depuis la cassette d'une sortie, relance si c'est une autre piste. */
export function basculer(piste?: PisteJouable): void {
  if (piste && piste.id !== etat.piste?.id) {
    lire(piste)
    return
  }
  if (etat.statut === 'lecture') pause()
  else reprendre()
}

export function suivant(): void {
  const liste = pistesFiltrees()
  if (!liste.length) return
  const i = liste.findIndex((p) => p.id === etat.piste?.id)
  lire(liste[(i + 1) % liste.length])
}

export function precedent(): void {
  const liste = pistesFiltrees()
  if (!liste.length) return
  const i = liste.findIndex((p) => p.id === etat.piste?.id)
  lire(liste[(i - 1 + liste.length) % liste.length])
}

export function chercher(secondes: number): void {
  moteur().chercher(secondes)
  poser({ position: secondes })
}

/** Preset : un seul état partagé par le lecteur et la page sorties (filtre, son, URL). */
export function definirPreset(preset: Preset): void {
  if (etat.preset === preset) return
  moteur().appliquerPreset(preset)
  poser({ preset, annonce: `${compteSorties(preset)} sorties pour ${preset === 'tout' ? 'tous les genres' : preset}` })
}

export function regler(partiel: { volume?: number; muet?: boolean; muetUi?: boolean }): void {
  moteur().regler(partiel)
  poser(partiel)
}

export function definirMini(mini: boolean): void {
  poser({ mini })
}

export function definirFeuille(feuille: boolean): void {
  poser({ feuille, menu: feuille ? false : etat.menu })
}

export function definirMenu(menu: boolean): void {
  poser({ menu, feuille: menu ? false : etat.feuille })
}

/** Changement de page : avance rapide sonore si le moteur existe. */
export function avanceRapide(): void {
  if (etat.pret) moteur().avanceRapide()
}

export function rembobiner(): void {
  if (etat.pret) moteur().rembobiner()
}

export function bpmCourant(): number {
  return etat.piste?.bpm ?? BPM_DEFAUT
}
