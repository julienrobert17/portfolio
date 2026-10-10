import type { Artiste } from './types'

const BC = 'https://groovetograve.bandcamp.com/album'

/**
 * Artistes du label : le crew, les artistes signés en solo, puis les invités des
 * compilations. Aucune biographie inventée : `presentation` reprend les textes
 * publics du label (langue d'origine) ; sans texte public, seul le nom et les
 * sorties sont affichés. Les villes ne sont données que si une source les donne.
 */
export const artistes: Artiste[] = [
  // ─── Le crew ───
  {
    slug: 'julius',
    name: 'Julius',
    role: 'A&R',
    presentation: {
      lang: 'fr',
      body: 'Crédité à l\'A&R des deux compilations Summer Hits. Membre du collectif avec LukasDarian et Gregs.',
      draft: true,
    },
    releases: ['gtgrva01', 'gtgrva02'],
    links: [],
    sources: [`${BC}/summer-hits-vol-1`, `${BC}/summer-hits-vol-2`, 'https://www.paris.fr/evenements/groove-to-grave-records-a-la-peniche-marcounet-65178'],
    verified: true,
  },
  {
    slug: 'lukasdarian',
    name: 'LukasDarian',
    role: 'Visuels et artwork des compilations',
    presentation: {
      lang: 'fr',
      body: "Auteur de « Common Speed EP » (GTGR01, 2022), première référence du label, et de l'artwork des deux compilations Summer Hits, sur lesquelles il signe aussi un titre. Membre du collectif avec Julius et Gregs.",
      draft: true,
    },
    releases: ['gtgr01', 'gtgrva01', 'gtgrva02'],
    links: [{ label: 'Common Speed EP sur Bandcamp', url: `${BC}/common-speed-ep` }],
    sources: [`${BC}/common-speed-ep`, `${BC}/summer-hits-vol-1`, `${BC}/summer-hits-vol-2`],
    verified: true,
  },
  {
    slug: 'gregs',
    name: 'Gregs',
    role: 'Mastering des compilations',
    presentation: {
      lang: 'fr',
      body: 'Crédité au mastering des deux compilations Summer Hits, sur lesquelles il signe aussi un titre. Membre du collectif avec Julius et LukasDarian.',
      draft: true,
    },
    releases: ['gtgrva01', 'gtgrva02'],
    links: [],
    sources: [`${BC}/summer-hits-vol-1`, `${BC}/summer-hits-vol-2`, 'https://www.paris.fr/evenements/groove-to-grave-records-a-la-peniche-marcounet-65178'],
    verified: true,
  },
  // ─── Sorties solo ───
  {
    slug: 'azbine',
    name: 'Azbine',
    city: 'Lyon',
    presentation: {
      lang: 'en',
      body: 'Azbine was created by 2 childhood friends in 2018. They take their influences from house and minimal through deeptech and they want to bring a retro has-been touch in their electronic universe.',
    },
    releases: ['gtgr02'],
    links: [
      { label: 'Spacy Taste EP sur Bandcamp', url: `${BC}/spacy-taste-ep` },
      { label: 'Azbine chez Yoyaku', url: 'https://yoyaku.io/artist/azbine/' },
    ],
    sources: [`${BC}/spacy-taste-ep`, 'https://yoyaku.io/artist/azbine/'],
    verified: true,
  },
  {
    slug: 'kitchen-plug',
    name: 'Kitchen Plug',
    city: 'Paris',
    presentation: {
      lang: 'en',
      body: 'From ghetto house to break and minimal these 3 silly boys love to produce tracks with nasty bass, metallic acid and raw drums.',
    },
    releases: ['gtgr03', 'gtgrva02'],
    links: [{ label: 'Cerberus EP sur Bandcamp', url: `${BC}/cerberus-ep` }],
    sources: [`${BC}/cerberus-ep`, `${BC}/summer-hits-vol-2`],
    verified: true,
  },
  {
    slug: 'emi-omar',
    name: 'Emi Ömar',
    presentation: {
      lang: 'en',
      body: 'Leading figure in electro-funk, Emi Ömar delves into uncharted music territories. Known for his sharp prestations, his blend of vocoder, bleepy/funky sounds, and deep/fat grooves captures the raw energy of live electronic music.',
    },
    releases: ['gtgr04', 'gtgrva01'],
    links: [{ label: 'Homo Musicus EP sur Bandcamp', url: `${BC}/homo-musicus-ep` }],
    sources: [`${BC}/homo-musicus-ep`, `${BC}/summer-hits-vol-1`],
    verified: true,
  },
  {
    slug: 'merov',
    name: "Merov'",
    presentation: {
      lang: 'en',
      body: "Step into our spaceship and head toward Merov' Galaxy, a universe where the funk, groove, and electro planets collide. Each track is built around sharp Rhodes and Clavinet keys, laying down cosmic, groove-heavy foundations.",
    },
    releases: ['gtgr05'],
    links: [{ label: 'Interdimensional Groove EP sur Bandcamp', url: `${BC}/interdimensional-groove-ep` }],
    sources: [`${BC}/interdimensional-groove-ep`],
    verified: true,
  },
  // ─── Invités des compilations et remix ───
  ...invites([
    ['karaba', 'Karaba', ['gtgr03'], 'cerberus-ep'],
    ['mamaaa', 'MAMAAA', ['gtgrva01'], 'summer-hits-vol-1'],
    ['local-dj', 'Local DJ', ['gtgrva01'], 'summer-hits-vol-1'],
    ['venetia', 'Venetia', ['gtgrva01'], 'summer-hits-vol-1'],
    ['loupiot', 'Loupiot', ['gtgrva01'], 'summer-hits-vol-1'],
    ['jad-sabbah', 'Jad Sabbah', ['gtgrva01'], 'summer-hits-vol-1'],
    ['lungo', 'Lungo', ['gtgrva02'], 'summer-hits-vol-2'],
    ['yotam-nadav', 'Yotam Nadav', ['gtgrva02'], 'summer-hits-vol-2'],
    ['l-abominable', "l'Abominable", ['gtgrva02'], 'summer-hits-vol-2'],
    ['crane-de-poule', 'Crâne De Poule', ['gtgrva02'], 'summer-hits-vol-2'],
    ['phyto', 'Phyto', ['gtgrva02'], 'summer-hits-vol-2'],
    ['atay', 'Atay', ['gtgrva02'], 'summer-hits-vol-2'],
  ]),
]

function invites(lignes: [string, string, string[], string][]): Artiste[] {
  return lignes.map(([slug, name, releases, album]) => ({
    slug,
    name,
    releases,
    links: [],
    sources: [`${BC}/${album}`],
    verified: true,
  }))
}

export function getArtiste(slug: string): Artiste | undefined {
  return artistes.find((a) => a.slug === slug)
}
