/**
 * Un seul pilote pour tout ce qui doit changer entre une vue au ras du sol et
 * une vue aérienne : la brume et le reflet de l'eau.
 *
 * Le pilote est l'ALTITUDE DE LA CAMÉRA, pas la phase. Trois raisons :
 * la valeur est continue, donc la transition de `zoomout` se fait toute seule
 * sans palier ; elle ne peut pas se désynchroniser de la caméra si un cadrage
 * est retouché plus tard ; et elle reste juste si une phase future regarde la
 * scène d'en haut sans s'appeler `resonance`.
 *
 * Les phases au sol tiennent entre 3.5 et 8 unités, `resonance` est à 45 : le
 * seuil est posé largement entre les deux, donc aucune phase au sol n'en
 * approche et il n'y a pas de va-et-vient à la frontière.
 */
const AERIAL_LOW = 14
const AERIAL_HIGH = 38

/** 0 au ras du sol, 1 en vue aérienne. */
export function aerialFactor(cameraY: number): number {
  const t = Math.min(1, Math.max(0, (cameraY - AERIAL_LOW) / (AERIAL_HIGH - AERIAL_LOW)))
  return t * t * (3 - 2 * t)
}

/**
 * Au-delà de ce facteur on coupe le reflet de l'eau. C'est un booléen et pas
 * un fondu : le reflet ne peut pas s'atténuer progressivement, la passe de
 * rendu a lieu ou n'a pas lieu. Le seuil est franchi une seule fois, au milieu
 * de `zoomout`, là où le reflet ne se lit déjà plus.
 */
export const REFLECTION_CUTOFF = 0.5

/**
 * Facteur appliqué à la densité de brume en vue aérienne.
 *
 * Mesuré sur le cadrage `resonance` (caméra [0, 45, 55]) : à 0.0065 la
 * transmittance tombait à 25 % dès 180 unités de distance, si bien que les
 * deux tiers hauts de l'image étaient un aplat sépia. À 0.80 elle remonte à
 * 42 % à 180 unités — le plan moyen retrouve du contraste — pendant que le
 * bord de la forêt, à 295 unités de la caméra, reste sous 10 % et donc noyé.
 */
export const AERIAL_FOG_SCALE = 0.8
