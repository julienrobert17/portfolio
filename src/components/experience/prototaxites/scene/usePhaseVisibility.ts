import type { Beat } from '../constants/narrative'

type Phase = Beat['phase']

export interface PhaseVisibility {
  forest: number
  /** Colonisation de la forêt (0→1), pilote la croissance arbre par arbre */
  forestSpread: number
  prototaxites: number
  arthropods: number
  smoke: number
  internal: number
}

interface PhaseVisibilityInput {
  phase: Phase
  progress: number
}

// Ordre narratif — sert à comparer les phases entre elles ("avant eclipse", …)
const ORDER: Record<Phase, number> = {
  context: 0,
  presence: 1,
  interior: 2,
  ecosystem: 3,
  eclipse: 4,
  zoomout: 5,
  resonance: 6,
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// Adoucit les rampes : les bornes 0 et 1 et les seuils de déclenchement sont
// inchangés, seule la courbe entre les deux l'est.
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Opacités de chaque groupe en fonction de la phase et de sa progression.
 * Volontairement pur : aucune dépendance à Three.js, uniquement des maths,
 * donc lisible et testable isolément.
 */
export function usePhaseVisibility({ phase, progress }: PhaseVisibilityInput): PhaseVisibility {
  const step = ORDER[phase]
  const p = clamp01(progress)

  // Forêt : absente avant l'éclipse, elle envahit pendant, puis reste là
  let forest: number
  if (step < ORDER.eclipse) forest = 0
  else if (phase === 'eclipse') forest = easeInOutCubic(clamp01(p * 1.5))
  else forest = 1

  // La colonisation suit la même rampe que la forêt, mais pilote la
  // croissance par arbre plutôt qu'une opacité globale.
  const forestSpread = forest

  // Prototaxites : présents jusqu'à l'éclipse, s'effacent sur sa 2ᵉ moitié.
  // Pendant 'interior' le tronc devient translucide pour que la structure
  // interne se lise comme un intérieur et non en rayons X par-dessus.
  let prototaxites: number
  if (phase === 'interior') prototaxites = 0.3
  else if (step < ORDER.eclipse) prototaxites = 1
  else if (phase === 'eclipse')
    prototaxites = p > 0.5 ? 1 - easeInOutCubic((p - 0.5) / 0.5) : 1
  else prototaxites = 0

  // Arthropodes : apparaissent avec l'écosystème.
  // Pas de rampe de progress ici : l'easing n'a rien à adoucir (voir rapport).
  const arthropods = step < ORDER.ecosystem ? 0 : 1

  // Fumée : uniquement en toute fin de zoomout
  const smoke =
    phase === 'zoomout' ? easeInOutCubic(clamp01((p - 0.85) / 0.15)) * 0.6 : 0

  // Structure interne : révélée uniquement pendant 'interior'
  const internal = phase === 'interior' ? 1 : 0

  return { forest, forestSpread, prototaxites, arthropods, smoke, internal }
}
