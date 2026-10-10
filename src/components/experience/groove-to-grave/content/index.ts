import { artistes, getArtiste } from './artists'
import { couleurs } from './couleurs'
import { soirees } from './events'
import { extraits } from './extraits'
import { label, textes } from './label'
import { medias } from './medias'
import { sorties } from './releases'
import type { Genre, Preset, Sortie, Soiree } from './types'

export { artistes, couleurs, getArtiste, label, medias, soirees, sorties, textes }
export * from './types'

/** Sorties avec leurs extraits attachés aux pistes (fichiers générés). */
export function sortiesAvecExtraits(): Sortie[] {
  return sorties.map((s) => ({
    ...s,
    tracks: s.tracks.map((t) => (extraits[t.id] ? { ...t, extrait: extraits[t.id] } : t)),
  }))
}

export function getSortie(ref: string): Sortie | undefined {
  return sortiesAvecExtraits().find((s) => s.ref === ref)
}

export const PRESETS: Preset[] = ['tout', 'house', 'break', 'minimal', 'electro']

export function estPreset(valeur: string | undefined): valeur is Preset {
  return valeur !== undefined && (PRESETS as string[]).includes(valeur)
}

/** Filtre du mur : la série GTGR (vinyles et EP numérique ensemble) du plus récent au plus ancien, puis les compilations. */
export function filtrerSorties(preset: Preset, liste: Sortie[] = sortiesAvecExtraits()): Sortie[] {
  const garde = (s: Sortie) => preset === 'tout' || s.genres.includes(preset as Genre)
  const tri = (a: Sortie, b: Sortie) => b.releaseDate.localeCompare(a.releaseDate)
  return [...liste.filter((s) => s.kind !== 'compilation' && garde(s)).sort(tri), ...liste.filter((s) => s.kind === 'compilation' && garde(s)).sort(tri)]
}

export function soireesAVenir(aujourdhui = new Date().toISOString().slice(0, 10)): Soiree[] {
  return soirees.filter((s) => s.status === 'a-venir' && s.date >= aujourdhui).sort((a, b) => a.date.localeCompare(b.date))
}

export function soireesPassees(aujourdhui = new Date().toISOString().slice(0, 10)): Soiree[] {
  return soirees.filter((s) => s.status !== 'a-venir' || s.date < aujourdhui).sort((a, b) => b.date.localeCompare(a.date))
}
