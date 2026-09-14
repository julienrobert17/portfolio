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

// Colonisation atteinte à la fin d'eclipse : la Terre n'est pas encore
// couverte, le dézoom achève le basculement.
const ECOSYSTEM_SPREAD_END = 0.12
const ECLIPSE_SPREAD_END = 0.55

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

  // La colonisation NE s'arrête PAS à la fin d'eclipse : elle se poursuit
  // pendant zoomout, précisément la phase où le spectateur prend du recul et
  // doit constater l'ampleur du changement. Une forêt figée pendant le dézoom
  // racontait un basculement déjà terminé.
  // Les premiers arbres lèvent pendant ecosystem, alors que les Prototaxites
  // sont encore à pleine opacité : c'est le fait historique (arbres vers 390 Ma,
  // extinction vers 375 Ma, une quinzaine de millions d'années de coexistence)
  // et c'est ce croisement des deux règnes qui porte le propos.
  // Le facteur 1.5 de l'ancienne rampe la saturait dès p = 0.667, laissant une
  // demi-phase d'eclipse sans aucune progression visible.
  let forestSpread: number
  if (step < ORDER.ecosystem) forestSpread = 0
  else if (phase === 'ecosystem')
    forestSpread = easeInOutCubic(clamp01((p - 0.7) / 0.3)) * ECOSYSTEM_SPREAD_END
  else if (phase === 'eclipse')
    forestSpread =
      ECOSYSTEM_SPREAD_END + (ECLIPSE_SPREAD_END - ECOSYSTEM_SPREAD_END) * easeInOutCubic(p)
  else if (phase === 'zoomout')
    forestSpread = ECLIPSE_SPREAD_END + (1 - ECLIPSE_SPREAD_END) * easeInOutCubic(p)
  else forestSpread = 1

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
