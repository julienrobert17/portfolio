import { defineField, defineType } from 'sanity'
import { estNoteDeChantier } from '../../src/components/experience/groove-to-grave/lib/registre'

/**
 * Registre public (Phase 7.7) : le site n'affiche jamais une note de chantier. Une information
 * inconnue se tait, ou se dit « non retrouvé » — jamais « à vérifier », « à confirmer », « TODO »
 * ni « ? ». La règle et son expression vivent dans `lib/registre.ts`, côté site : cette validation
 * est la même barrière, posée à l'endroit où le label écrit.
 */

export function sansNoteDeChantier(valeur: unknown): true | string {
  if (!estNoteDeChantier(valeur)) return true
  return 'Cette formule est une note de chantier, et le site n’en affiche aucune. Laissez le champ vide si l’information n’est pas connue : la page s’en passera proprement.'
}

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
      validation: (r) => [r.required().min(3).error('Le texte alternatif est obligatoire.'), r.custom(sansNoteDeChantier)],
    }),
    defineField({
      name: 'credit',
      title: 'Crédit',
      type: 'string',
      description: 'Qui a fait l’image (illustrateur, graphiste, photographe). Obligatoire : l’œuvre est affichée telle quelle, jamais recadrée. Si vous ne savez pas, cochez « auteur non identifié ».',
      validation: (r) => r.custom(sansNoteDeChantier).custom((valeur, contexte) => (valeur || (contexte.parent as { auteurNonIdentifie?: boolean } | undefined)?.auteurNonIdentifie ? true : 'Le crédit est obligatoire, ou cochez « auteur non identifié ».')),
    }),
    defineField({
      name: 'auteurNonIdentifie',
      title: 'Auteur non identifié',
      type: 'boolean',
      description: 'Cochez si personne ne sait qui a fait l’image : le site affichera « visuel : auteur non identifié ».',
      initialValue: false,
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
    defineField({ name: 'corps', title: 'Texte', type: 'text', rows: 6, validation: (r) => r.custom(sansNoteDeChantier).required() }),
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
    defineField({ name: 'empreinte', title: 'Empreinte des fichiers traités', type: 'string', hidden: true, description: 'Référence des fichiers d’origine au dernier traitement : le pipeline retraite quand elle change.' }),
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
    defineField({ name: 'contrastePosterAccent', title: 'Contraste du texte clair sur l’accent', type: 'number' }),
  ],
})

/**
 * Images dérivées (AVIF et WebP sans recadrage, une série de largeurs pour le srcset du site,
 * chaque fichier sous 300 kB) produites par le pipeline, lecture seule. `avif` et `webp` sont
 * la plus grande largeur ; `tailles` la série complète.
 */
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
    defineField({
      name: 'tailles',
      title: 'Toutes les largeurs',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'taille',
          fields: [
            defineField({ name: 'largeur', title: 'Largeur', type: 'number' }),
            defineField({ name: 'hauteur', title: 'Hauteur', type: 'number' }),
            defineField({ name: 'avif', title: 'AVIF', type: 'file', options: { accept: 'image/avif' } }),
            defineField({ name: 'webp', title: 'WebP', type: 'file', options: { accept: 'image/webp' } }),
          ],
          preview: { select: { largeur: 'largeur', hauteur: 'hauteur' }, prepare: ({ largeur, hauteur }: { largeur?: number; hauteur?: number }) => ({ title: `${largeur ?? '?'} × ${hauteur ?? '?'} px` }) },
        },
      ],
    }),
  ],
})

export const typesCommuns = [imageCreditee, texte, lien, traitement, couleursExtraites, imagesDerivees]
