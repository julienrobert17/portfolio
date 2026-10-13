import { defineArrayMember, defineField, defineType } from 'sanity'
import { sansNoteDeChantier } from './communs'

export const artiste = defineType({
  name: 'artiste',
  title: 'Artiste',
  type: 'document',
  fields: [
    defineField({ name: 'nom', title: 'Nom d’artiste', type: 'string', description: 'Le nom de scène, jamais un nom civil.', validation: (r) => r.custom(sansNoteDeChantier).required() }),
    defineField({ name: 'slug', title: 'Adresse de la page', type: 'slug', options: { source: 'nom' }, validation: (r) => r.required() }),
    defineField({ name: 'ville', title: 'Ville', type: 'string', description: 'Seulement si l’artiste la communique.', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'role', title: 'Rôle dans le collectif', type: 'string', description: 'Pour les membres du crew : A&R, mastering, visuels…', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'portrait', title: 'Portrait', type: 'imageCreditee', description: 'Facultatif.' }),
    defineField({ name: 'traitement', title: 'Traitement automatique', type: 'traitement' }),
    defineField({ name: 'portraitOptimise', title: 'Portrait optimisé', type: 'imagesDerivees' }),
    defineField({ name: 'presentation', title: 'Présentation', type: 'texte', description: 'Factuelle, dans sa langue d’origine. Rien d’inventé : sans texte, le site montre seulement le nom et les sorties.' }),
    defineField({ name: 'sorties', title: 'Sorties sur le label', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'sortie' }] })], description: 'Sorties solo et compilations où l’artiste signe un morceau.', validation: (r) => r.unique() }),
    defineField({ name: 'liens', title: 'Liens publics', type: 'array', of: [defineArrayMember({ type: 'lien' })] }),
    defineField({ name: 'ordre', title: 'Ordre sur la page Artistes', type: 'number', description: 'Le crew d’abord, puis les artistes signés, puis les invités. Les plus petits nombres en premier.', validation: (r) => r.required().integer().min(0) }),
    defineField({ name: 'sources', title: 'Sources', type: 'array', of: [{ type: 'url' }], readOnly: true }),
  ],
  orderings: [
    { title: 'Ordre de la page', name: 'ordre', by: [{ field: 'ordre', direction: 'asc' }] },
    { title: 'Nom', name: 'nom', by: [{ field: 'nom', direction: 'asc' }] },
  ],
  preview: { select: { title: 'nom', subtitle: 'role', ville: 'ville', media: 'portrait' }, prepare: ({ title, subtitle, ville, media }) => ({ title, subtitle: subtitle ?? ville, media }) },
})
