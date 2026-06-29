export type Lang = 'en' | 'fr'

export interface Beat {
  id: string
  duration: number        // durée en ms avant passage auto au beat suivant
  text: Record<Lang, string | null>  // null = pas de texte overlay
  phase: 'context' | 'presence' | 'interior' | 'ecosystem' |
         'eclipse' | 'zoomout' | 'resonance'
}

export const BEATS: Beat[] = [
  {
    id: 'context',
    duration: 4000,
    phase: 'context',
    text: {
      en: null,
      fr: null,
    },
  },
  {
    id: 'presence',
    duration: 20000,
    phase: 'presence',
    text: {
      en: null,
      fr: null,
    },
  },
  {
    id: 'interior',
    duration: 18000,
    phase: 'interior',
    text: {
      en: '"Structurally distinct from all known fungi. No extant group exhibits all three defining features." — Hueber, 2001',
      fr: '"Structurellement distinct de tous les champignons connus. Aucun groupe existant ne présente les trois caractéristiques définissantes." — Hueber, 2001',
    },
  },
  {
    id: 'ecosystem',
    duration: 16000,
    phase: 'ecosystem',
    text: {
      en: 'For 50 million years, it fed the first arthropods. It built the soil. It made land habitable.',
      fr: 'Pendant 50 millions d\'années, il a nourri les premiers arthropodes. Il a construit les sols. Il a rendu la terre habitable.',
    },
  },
  {
    id: 'eclipse',
    duration: 18000,
    phase: 'eclipse',
    text: {
      en: 'The forests changed the atmosphere. The world it had built no longer existed.',
      fr: 'Les forêts ont changé l\'atmosphère. Le monde qu\'il avait bâti n\'existait plus.',
    },
  },
  {
    id: 'zoomout',
    duration: 22000,
    phase: 'zoomout',
    // NarrativeOverlay ne supporte pas de texte conditionnel sur progress —
    // ce texte apparaît à 1500ms après le début du beat comme les autres.
    text: {
      en: 'Something learned to keep a flame alive.',
      fr: 'Quelque chose a appris à garder une flamme en vie.',
    },
  },
  {
    id: 'resonance',
    duration: 0,
    phase: 'resonance',
    text: {
      en: 'Prototaxites ruled the land for 50 million years.\nIt belongs to no known kingdom of life.\nWe still don\'t know what it was.\nWe will never know what we lost.',
      fr: 'Prototaxites a dominé les terres émergées pendant 50 millions d\'années.\nIl n\'appartient à aucun règne connu du vivant.\nNous ne savons toujours pas ce qu\'il était.\nNous ne saurons jamais ce que nous avons perdu.',
    },
  },
]
