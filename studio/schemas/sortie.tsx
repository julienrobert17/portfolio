import { defineArrayMember, defineField, defineType } from 'sanity'
import { ApercuCassette } from '../composants/apercu-cassette'
import { GENRES } from './communs'

/** Vrai si la date de sortie du document est passée (ou aujourd'hui). */
function estParue(document: { dateSortie?: string } | undefined): boolean {
  const d = document?.dateSortie
  return Boolean(d) && new Date(String(d)).getTime() <= Date.now()
}

/** Une piste d'une sortie : position, titre, durée, extrait brut (fichier du label) et extrait traité. */
export const piste = defineType({
  name: 'piste',
  title: 'Piste',
  type: 'object',
  fields: [
    defineField({ name: 'position', title: 'Position', type: 'string', description: 'Telle qu’imprimée : A1, B2… pour un vinyle, 1 à 8 pour une compilation.', validation: (r) => r.required() }),
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'artiste', title: 'Artiste de la piste', type: 'string', description: 'Seulement pour une compilation (nom d’artiste, jamais un nom civil).' }),
    defineField({ name: 'duree', title: 'Durée (secondes)', type: 'number', description: 'Durée du morceau complet, en secondes.', validation: (r) => r.required().integer().positive() }),
    defineField({ name: 'bonusNumerique', title: 'Bonus numérique', type: 'boolean', description: 'Absent du vinyle.', initialValue: false }),
    defineField({
      name: 'extraitBrut',
      title: 'Extrait (fichier audio)',
      type: 'file',
      options: { accept: 'audio/*' },
      description: 'Déposez le morceau ou un extrait (WAV, AIFF, FLAC ou MP3). Le site en tire automatiquement 60 secondes au bon niveau, avec fondus. Un seul fichier par piste, et seulement pour une sortie déjà parue : les inédits sont refusés.',
      validation: (r) =>
        r.custom((fichier, contexte) => {
          if (!fichier) return true
          return estParue(contexte.document as { dateSortie?: string }) ? true : 'Un extrait n’est accepté que pour une sortie déjà parue (la date de sortie est dans le futur ou manquante).'
        }),
    }),
    defineField({ name: 'extraitTraite', title: 'Extrait traité (60 s, niveau normalisé)', type: 'file', readOnly: true, description: 'Produit automatiquement à partir de l’extrait déposé.' }),
    defineField({ name: 'bpm', title: 'BPM', type: 'number', readOnly: true, description: 'Mesuré automatiquement ; fait tourner les bobines à la bonne vitesse.' }),
    defineField({ name: 'traitement', title: 'Traitement automatique', type: 'traitement' }),
  ],
  preview: {
    select: { position: 'position', titre: 'titre', artiste: 'artiste', extrait: 'extraitTraite.asset._ref', brut: 'extraitBrut.asset._ref' },
    prepare: ({ position, titre, artiste, extrait, brut }) => ({ title: `${position ?? ''} ${titre ?? ''}`.trim(), subtitle: [artiste, extrait ? 'extrait prêt' : brut ? 'extrait à traiter' : 'sans extrait'].filter(Boolean).join(' · ') }),
  },
})

export const sortie = defineType({
  name: 'sortie',
  title: 'Sortie',
  type: 'document',
  groups: [
    { name: 'principal', title: 'Sortie', default: true },
    { name: 'pistes', title: 'Pistes' },
    { name: 'textes', title: 'Texte et crédits' },
    { name: 'liens', title: 'Liens' },
    { name: 'automatique', title: 'Automatique' },
  ],
  fields: [
    defineField({ name: 'catalogue', title: 'Référence de catalogue', type: 'string', description: 'Telle qu’imprimée : GTGR05, GTGRVA02.', group: 'principal', validation: (r) => r.required().regex(/^GTGR(VA)?\d{2}$/, { name: 'référence GTGR' }).error('Référence au format GTGR05 ou GTGRVA02.') }),
    defineField({ name: 'slug', title: 'Adresse de la page', type: 'slug', description: 'Généré depuis la référence (gtgr05). Ne change pas après publication.', group: 'principal', options: { source: 'catalogue', slugify: (s: string) => s.toLowerCase() }, validation: (r) => r.required() }),
    defineField({ name: 'titre', title: 'Titre', type: 'string', group: 'principal', validation: (r) => r.required() }),
    defineField({
      name: 'genre',
      title: 'Type de sortie',
      type: 'string',
      group: 'principal',
      options: { list: [{ title: 'Vinyle 12″', value: 'vinyle' }, { title: 'EP numérique', value: 'ep-numerique' }, { title: 'Compilation numérique', value: 'compilation' }], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'artiste', title: 'Artiste', type: 'reference', to: [{ type: 'artiste' }], group: 'principal', description: 'Pour une sortie solo. Laissez vide pour une compilation (« Various Artists »).', validation: (r) => r.custom((ref, ctx) => (!ref && (ctx.document as { genre?: string })?.genre !== 'compilation' ? 'Une sortie qui n’est pas une compilation a un artiste.' : true)) }),
    defineField({ name: 'nomArtiste', title: 'Nom affiché de l’artiste', type: 'string', group: 'principal', description: '« Various Artists » pour une compilation ; sinon le nom de l’artiste.', validation: (r) => r.required() }),
    defineField({ name: 'dateSortie', title: 'Date de sortie', type: 'date', group: 'principal', validation: (r) => r.required() }),
    defineField({
      name: 'statut',
      title: 'Disponibilité',
      type: 'string',
      group: 'principal',
      options: { list: [{ title: 'Disponible', value: 'disponible' }, { title: 'Vinyle épuisé', value: 'epuise' }, { title: 'Numérique', value: 'numerique' }], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'sansRepress', title: 'Pressage limité, sans repress', type: 'boolean', group: 'principal', initialValue: false }),
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'principal',
      options: { list: GENRES, layout: 'grid' },
      description: 'Ceux des presets du lecteur : ils filtrent le mur de cassettes.',
      validation: (r) => r.required().min(1).unique().error('Au moins un genre, parmi House, Break, Minimal, Electro.'),
    }),
    defineField({ name: 'genresValides', title: 'Genres validés par le label', type: 'boolean', group: 'principal', initialValue: false, description: 'Décoché tant que les genres sont ceux déduits des textes publics.' }),
    defineField({ name: 'pochette', title: 'Pochette', type: 'imageCreditee', group: 'principal', description: 'L’image d’origine, jamais recadrée : le site la montre intacte.', validation: (r) => r.required() }),
    defineField({ name: 'pistes', title: 'Pistes', type: 'array', of: [defineArrayMember({ type: 'piste' })], group: 'pistes', validation: (r) => r.required().min(1) }),
    defineField({ name: 'texte', title: 'Texte de sortie', type: 'texte', group: 'textes', description: 'Dans sa langue d’origine (Bandcamp).' }),
    defineField({
      name: 'credits',
      title: 'Crédits',
      type: 'object',
      group: 'textes',
      fields: [
        defineField({ name: 'artwork', title: 'Artwork', type: 'string', validation: (r) => r.required().error('Le crédit de l’artwork est obligatoire.') }),
        defineField({ name: 'mastering', title: 'Mastering', type: 'string' }),
        defineField({ name: 'distribution', title: 'Distribution', type: 'string' }),
        defineField({ name: 'ar', title: 'A&R', type: 'string' }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'aVerifier', title: 'Points à vérifier', type: 'array', of: [{ type: 'string' }], group: 'textes', description: 'Informations lues sur un support peu lisible (étiquette), à confirmer.', readOnly: true }),
    defineField({ name: 'bandcamp', title: 'Bandcamp', type: 'url', group: 'liens', validation: (r) => r.required() }),
    defineField({ name: 'boutiques', title: 'Autres boutiques', type: 'array', of: [defineArrayMember({ type: 'lien' })], group: 'liens', description: 'Yoyaku, Subwax, deejay.de, Redeye, Discogs…' }),
    defineField({ name: 'traitement', title: 'Traitement automatique', type: 'traitement', group: 'automatique' }),
    defineField({ name: 'couleurs', title: 'Couleurs de la cassette', type: 'couleursExtraites', group: 'automatique' }),
    defineField({ name: 'pochetteOptimisee', title: 'Pochette optimisée', type: 'imagesDerivees', group: 'automatique' }),
    defineField({ name: 'sources', title: 'Sources', type: 'array', of: [{ type: 'url' }], group: 'automatique', readOnly: true, description: 'Pages publiques d’où les faits ont été relevés.' }),
  ],
  orderings: [{ title: 'Date de sortie, récente d’abord', name: 'dateDesc', by: [{ field: 'dateSortie', direction: 'desc' }] }],
  preview: {
    select: { catalogue: 'catalogue', titre: 'titre', artiste: 'nomArtiste', dominante: 'couleurs.dominante', accent: 'couleurs.accent', statut: 'statut', pochette: 'pochette' },
    prepare: ({ catalogue, titre, artiste, dominante, accent, statut }) => ({
      title: `${catalogue} · ${artiste} · ${titre}`,
      subtitle: statut === 'epuise' ? 'vinyle épuisé' : statut === 'numerique' ? 'numérique' : 'disponible',
      media: <ApercuCassette coque={dominante} bande={accent} reference={catalogue} />,
    }),
  },
})
