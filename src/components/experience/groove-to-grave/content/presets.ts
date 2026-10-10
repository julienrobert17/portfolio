import type { Preset } from './types'

/** Presets du lecteur, dans l'ordre de l'afficheur ; module minuscule pour les composants client (le reste du contenu reste côté serveur). */
export const PRESETS: Preset[] = ['tout', 'house', 'break', 'minimal', 'electro']

export function estPreset(valeur: string | undefined): valeur is Preset {
  return valeur !== undefined && (PRESETS as string[]).includes(valeur)
}
