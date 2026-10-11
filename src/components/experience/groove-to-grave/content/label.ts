import type { Lien, Texte } from './types'

/**
 * Identité du label et textes du site. Les faits viennent des pages publiques citées ;
 * tout ce qui est de notre main est `draft: true` et doit être validé par le label.
 */
export const label = {
  nom: 'Groove To Grave Records',
  /** Écritures : titrage, registre familier, références de catalogue. */
  court: 'G2G',
  prefixeCatalogue: 'GTGR',
  ville: 'Paris',
  /** Première référence (GTGR01) le 22 juillet 2022. */
  depuis: 2022,
  /** Bio Bandcamp, telle quelle. */
  bio: { lang: 'en', body: 'Paris based record label' } satisfies Texte,
  /** Présentation publique du collectif (Ville de Paris, juillet 2024), telle quelle. */
  presentation: {
    lang: 'fr',
    body: "Ce jeune et fougueux label de diggers parisiens vogue en quête d'artistes émergents, propageant joie de vivre et musique au travers de leurs sorties vinyles. Le collectif assume pleinement ses influences groovy avec des riffs puissants, des synthés stellaires et des basslines grasses. Tantôt Breakbeat, parfois Minimal, la House persiste et signe toutefois comme fer-de-lance du crew G2G.",
  } satisfies Texte,
  crew: ['julius', 'lukasdarian', 'gregs'],
  distribution: 'Subwax',
  disquaires: [
    { label: 'Subwax', url: 'https://subwax.es/brands/groove-to-grave-records/' },
    { label: 'deejay.de', url: 'https://www.deejay.de/Groove_To_Grave_Records__L297054' },
    { label: 'Redeye', url: 'https://www.redeyerecords.co.uk/vinyl/192460-gtgr05-merov-interdimensional-groove-ep' },
    { label: 'Yoyaku', url: 'https://www.yoyaku.io/release/gtgr02/' },
  ] satisfies Lien[],
  reseaux: [
    { label: 'Bandcamp', url: 'https://groovetograve.bandcamp.com/music' },
    { label: 'SoundCloud', url: 'https://soundcloud.com/groovetograve' },
    { label: 'Instagram', url: 'https://www.instagram.com/groovetograve/' },
    { label: 'Linktree', url: 'https://linktr.ee/groovetograve' },
  ] satisfies Lien[],
  /** Adresse de contact à obtenir du label ; en attendant, le lien Instagram sert de contact. */
  contact: null as string | null,
  sources: [
    'https://groovetograve.bandcamp.com/music',
    'https://www.paris.fr/evenements/groove-to-grave-records-a-la-peniche-marcounet-65178',
    'https://linktr.ee/groovetograve',
  ],
  verified: true,
} as const

/** Textes de notre main, dans le ton du label, à faire valider. */
export const textes = {
  phrase: { lang: 'fr', body: 'Du sillon à la tombe.', draft: true },
  pourquoi: {
    lang: 'fr',
    body: "Trois diggers, des vinyles en pressage limité, souvent sans repress, et une compilation chaque été pour inviter les copains. On ne fait pas de la house pour les playlists, on en fait pour les disquaires et les pistes de danse.",
    draft: true,
  },
  demo: {
    lang: 'fr',
    body: 'Envoie un lien d\'écoute privé (SoundCloud ou équivalent), pas de fichier joint. Deux ou trois titres suffisent. Le délai de réponse reste à préciser avec le label.',
    draft: true,
  },
  soireesVide: { lang: 'fr', body: 'Aucune date annoncée, reste branché.', draft: true },
  newsletter: {
    lang: 'fr',
    body: "Merci. Rien n'est encore enregistré : la newsletter attend que le label choisisse son outil. En attendant, suis le label sur Bandcamp.",
    draft: true,
  },
  /** Crédit du site, pied de page (bloc 7.0 : plateforme officielle, carte blanche du label). */
  credits: {
    lang: 'fr',
    body: 'Site réalisé par Julien Robert pour Groove To Grave Records.',
  },
  droits: {
    lang: 'fr',
    body: 'Pochettes, flyers, illustrations et textes de sortie appartiennent à Groove To Grave Records et à leurs auteurs : JeunePenard, LukasDarian, Cbrgraphics.',
  },
} satisfies Record<string, Texte>
