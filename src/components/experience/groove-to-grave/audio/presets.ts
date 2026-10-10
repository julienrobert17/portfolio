import type { Preset } from '../content/types'

/** Courbe d'égalisation d'un preset : graves (110 Hz), médiums (1,2 kHz), aigus (6 kHz) en dB, passe-haut en Hz. Brief §5.3. */
export interface CourbeEq {
  graves: number
  mediums: number
  aigus: number
  passeHaut: number
}

export const COURBES: Record<Preset, CourbeEq> = {
  tout: { graves: 0, mediums: 0, aigus: 0, passeHaut: 20 },
  house: { graves: 7, mediums: -1, aigus: -1, passeHaut: 20 },
  break: { graves: 2, mediums: 6, aigus: 2, passeHaut: 20 },
  minimal: { graves: -6, mediums: -2, aigus: 4, passeHaut: 180 },
  electro: { graves: 3, mediums: -4, aigus: 7, passeHaut: 20 },
}

/**
 * Normalisation mesurée, en dB : ce que chaque courbe ajoute ou retire de sonie intégrée sur
 * les extraits (moyenne de trois extraits provisoires, ffmpeg ebur128, 10 octobre 2026). Un
 * relèvement de 7 dB sur les graves n'ajoute que 3,6 LU : compenser le relèvement nominal
 * surcorrigeait. À remesurer avec les vrais extraits du label (scripts/g2g-mesures-audio.ts).
 */
export const NORMALISATION_DB: Record<Preset, number> = {
  tout: 0,
  house: -3.6,
  break: -1.5,
  minimal: 3.0,
  electro: -2.9,
}

/** Gain de normalisation d'un preset : aucun preset ne paraît « mieux » parce que plus fort. Le limiteur reste en bout de chaîne. */
export function gainNormalisation(preset: Preset): number {
  return dbVersGain(NORMALISATION_DB[preset])
}

export function dbVersGain(db: number): number {
  return Math.pow(10, db / 20)
}
