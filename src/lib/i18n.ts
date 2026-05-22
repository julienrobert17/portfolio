export type Lang = 'fr' | 'en'

export const translations = {
  fr: {
    title: 'Geodatle',
    subtitle: 'Devinez le pays du jour',
    searchPlaceholder: 'Chercher un pays…',
    attempts: 'Tentatives',
    headers: {
      country: 'Pays',
      continent: 'Continent',
      population: 'Population',
      area: 'Superficie (km²)',
      poverty: 'Pauvreté ext. (%)',
      lifeExpectancy: 'Espérance (ans)',
      meatSupply: 'Viande (kg/an)',
      co2PerCapita: 'CO₂ (t/an)',
      fertilityRate: 'Taux fertilité',
    },
    legend: {
      similar: 'Très proche',
      close: 'Proche',
      far: 'Loin',
      wrong: 'Faux',
    },
    results: {
      won: (n: number) => `🎉 Trouvé en ${n} tentative${n > 1 ? 's' : ''} !`,
      lost: '😞 Perdu !',
      nextCountry: 'Prochain pays dans',
      share: 'Partager',
      copied: 'Copié !',
      back: '← Retour au portfolio',
      owid: 'Découvrir les données sur Our World in Data →',
    },
    rules: {
      title: 'Comment jouer',
      cta: "C'est parti !",
      items: [
        'Un pays mystère est choisi chaque jour',
        'Tu as 8 tentatives pour le trouver',
        'Chaque guess révèle des indices sur 7 indicateurs',
        'Les couleurs indiquent à quel point tu es proche',
      ],
      colors: {
        similar: '≈ Très proche (moins de 15%)',
        close: '↑ Dans la bonne direction (moins de 25%)',
        far: '↑↑ Encore loin (plus de 25%)',
        wrong: '✗ Mauvais',
        na: '— Données non disponibles',
      },
    },
  },
  en: {
    title: 'Geodatle',
    subtitle: 'Guess the country of the day',
    searchPlaceholder: 'Search a country…',
    attempts: 'Attempts',
    headers: {
      country: 'Country',
      continent: 'Continent',
      population: 'Population',
      area: 'Area (km²)',
      poverty: 'Ext. poverty (%)',
      lifeExpectancy: 'Life exp. (yrs)',
      meatSupply: 'Meat (kg/yr)',
      co2PerCapita: 'CO₂ (t/yr)',
      fertilityRate: 'Fertility rate',
    },
    legend: {
      similar: 'Very close',
      close: 'Getting closer',
      far: 'Far away',
      wrong: 'Wrong',
    },
    results: {
      won: (n: number) => `🎉 Found in ${n} attempt${n > 1 ? 's' : ''} !`,
      lost: '😞 Lost!',
      nextCountry: 'Next country in',
      share: 'Share',
      copied: 'Copied!',
      back: '← Back to portfolio',
      owid: 'Explore data on Our World in Data →',
    },
    rules: {
      title: 'How to play',
      cta: "Let's go!",
      items: [
        'A mystery country is chosen every day',
        'You have 8 attempts to find it',
        'Each guess reveals clues on 7 indicators',
        'Colors show how close you are',
      ],
      colors: {
        similar: '≈ Very close (less than 15%)',
        close: '↑ Getting closer (less than 25%)',
        far: '↑↑ Far away (more than 25%)',
        wrong: '✗ Wrong',
        na: '— Data not available',
      },
    },
  },
} as const

export type Translations = typeof translations[Lang]
