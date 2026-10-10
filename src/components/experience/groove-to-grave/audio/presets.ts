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

/** Marge de la normalisation, en dB : un preset ne paraît jamais « mieux » parce que plus fort. */
export const MARGE_DB = -6

/** Gain de normalisation d'un preset : on retire son plus fort relèvement, plus la marge. */
export function gainNormalisation(preset: Preset): number {
  const c = COURBES[preset]
  const boost = Math.max(0, c.graves, c.mediums, c.aigus)
  return dbVersGain(MARGE_DB - boost)
}

export function dbVersGain(db: number): number {
  return Math.pow(10, db / 20)
}
