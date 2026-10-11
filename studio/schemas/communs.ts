import { defineField, defineType } from 'sanity'

/** Genres des presets du lecteur : la seule liste autorisée. */
export const GENRES = [
  { title: 'House', value: 'house' },
  { title: 'Break', value: 'break' },
  { title: 'Minimal', value: 'minimal' },
  { title: 'Electro', value: 'electro' },
]

/** Image avec texte alternatif et crédit obligatoires (pochettes, flyers, portraits). */
export const imageCreditee = defineType({
  name: 'imageCreditee',
  title: 'Image créditée',
  type: 'image',
  options: { hotspot: false },
  fields: [
    defineField({
      name: 'alt',
      title: 'Texte alternatif',
      type: 'string',
      description: 'Ce que montre l’image, en une phrase, pour les personnes qui ne la voient pas. Obligatoire.',
      validation: (r) => r.required().min(3).error('Le texte alternatif est obligatoire.'),
    }),
    defineField({
      name: 'credit',
      title: 'Crédit',
      type: 'string',
      description: 'Qui a fait l’image (illustrateur, graphiste, photographe). Obligatoire : l’œuvre est affichée telle quelle, jamais recadrée.',
      validation: (r) => r.required().error('Le crédit est obligatoire.'),
    }),
  ],
})

/** Texte avec sa langue et son état de validation par le label. */
export const texte = defineType({
  name: 'texte',
  title: 'Texte',
  type: 'object',
  fields: [
    defineField({ name: 'langue', title: 'Langue', type: 'string', options: { list: [{ title: 'Français', value: 'fr' }, { title: 'Anglais', value: 'en' }], layout: 'radio' }, initialValue: 'fr', validation: (r) => r.required() }),
    defineField({ name: 'corps', title: 'Texte', type: 'text', rows: 6, validation: (r) => r.required() }),
    defineField({
      name: 'aValiderParLeLabel',
      title: 'À valider par le label',
      type: 'boolean',
      description: 'Coché : le texte a été écrit pour le site et attend votre relecture ; il est marqué « brouillon » sur le site. Décochez-le une fois relu.',
      initialValue: false,
    }),
  ],
  preview: { select: { title: 'corps', subtitle: 'langue' }, prepare: ({ title, subtitle }) => ({ title: (title ?? '').slice(0, 60), subtitle: subtitle === 'en' ? 'anglais' : 'français' }) },
})

/** Lien nommé. */
export const lien = defineType({
  name: 'lien',
  title: 'Lien',
  type: 'object',
  fields: [
    defineField({ name: 'libelle', title: 'Libellé', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'url', title: 'Adresse', type: 'url', validation: (r) => r.required().uri({ scheme: ['http', 'https', 'mailto'] }) }),
  ],
  preview: { select: { title: 'libelle', subtitle: 'url' } },
})

/**
 * État du traitement automatique d'un document (pipeline médias de la Phase 7.4) : rempli par
 * le pipeline, en lecture seule pour les éditeurs.
 */
export const traitement = defineType({
  name: 'traitement',
  title: 'Traitement automatique',
  type: 'object',
  readOnly: true,
  description: 'Rempli automatiquement quand vous ajoutez ou changez un fichier : extraits, images optimisées, couleurs. Vous n’avez rien à faire ici.',
  fields: [
    defineField({
      name: 'etat',
      title: 'État',
      type: 'string',
      options: { list: [{ title: 'En attente', value: 'en-attente' }, { title: 'En cours', value: 'en-cours' }, { title: 'Prêt', value: 'pret' }, { title: 'Refusé', value: 'refuse' }] },
      initialValue: 'en-attente',
    }),
    defineField({ name: 'raison', title: 'Raison du refus', type: 'string', description: 'Pourquoi un fichier n’a pas été accepté (par exemple un extrait d’un morceau pas encore sorti).' }),
    defineField({ name: 'misAJour', title: 'Dernier traitement', type: 'datetime' }),
  ],
})

/** Couleurs extraites d'une pochette et contrastes vérifiés (pipeline), lecture seule. */
export const couleursExtraites = defineType({
  name: 'couleursExtraites',
  title: 'Couleurs de la cassette',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({ name: 'dominante', title: 'Dominante (coque)', type: 'string' }),
    defineField({ name: 'accent', title: 'Accent (bande)', type: 'string' }),
    defineField({ name: 'contrasteInkDominante', title: 'Contraste du texte sombre sur la dominante', type: 'number' }),
    defineField({ name: 'contrasteInkAccent', title: 'Contraste du texte sombre sur l’accent', type: 'number' }),
    defineField({ name: 'contrastePosterDominante', title: 'Contraste du texte clair sur la dominante', type: 'number' }),
  ],
})

/** Images dérivées (AVIF et WebP sans recadrage) produites par le pipeline, lecture seule. */
export const imagesDerivees = defineType({
  name: 'imagesDerivees',
  title: 'Images optimisées',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({ name: 'avif', title: 'AVIF', type: 'file', options: { accept: 'image/avif' } }),
    defineField({ name: 'webp', title: 'WebP', type: 'file', options: { accept: 'image/webp' } }),
    defineField({ name: 'largeur', title: 'Largeur', type: 'number' }),
    defineField({ name: 'hauteur', title: 'Hauteur', type: 'number' }),
  ],
})

export const typesCommuns = [imageCreditee, texte, lien, traitement, couleursExtraites, imagesDerivees]
