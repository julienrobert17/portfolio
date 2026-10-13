import { defineArrayMember, defineField, defineType } from 'sanity'
import { sansNoteDeChantier } from './communs'

export const soiree = defineType({
  name: 'soiree',
  title: 'Soirée',
  type: 'document',
  fields: [
    defineField({ name: 'date', title: 'Date', type: 'date', description: 'Une soirée passe en archive le lendemain, toute seule.', validation: (r) => r.required() }),
    defineField({ name: 'nom', title: 'Nom de la soirée', type: 'string', description: 'S’il y en a un (« Danza To The Grave »). Sinon le site affiche le nom du label.', validation: (r) => r.custom(sansNoteDeChantier) }),
    // Laissé facultatif à dessein : un lieu non retrouvé vaut mieux vide qu'annoté (Phase 7.7).
    defineField({ name: 'lieu', title: 'Lieu', type: 'string', description: 'Laissez vide si le lieu n’est pas retrouvé : le site l’écrira « lieu non retrouvé » plutôt que d’afficher une note.', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'adresse', title: 'Adresse', type: 'string', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'ville', title: 'Ville', type: 'string', initialValue: 'Paris', validation: (r) => r.custom(sansNoteDeChantier).required() }),
    defineField({ name: 'horaires', title: 'Horaires', type: 'string', description: 'Par exemple « 23h – 6h ».', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'lineup', title: 'Line-up', type: 'array', of: [{ type: 'string' }], description: 'Un nom par ligne, dans l’ordre d’affichage.' }),
    defineField({
      name: 'statut',
      title: 'Statut',
      type: 'string',
      options: { list: [{ title: 'À venir', value: 'a-venir' }, { title: 'Passée', value: 'passee' }, { title: 'Annulée', value: 'annulee' }, { title: 'Reportée', value: 'reportee' }], layout: 'radio' },
      initialValue: 'a-venir',
      validation: (r) => r.required(),
      description: '« À venir » et « Passée » se déduisent de la date ; « Annulée » et « Reportée » s’affichent en mention sur le flyer.',
    }),
    defineField({ name: 'prix', title: 'Prix', type: 'string', description: 'Par exemple « 10 € en prévente ».', validation: (r) => r.custom(sansNoteDeChantier) }),
    defineField({ name: 'billetterie', title: 'Billetterie', type: 'url', description: 'Lien Shotgun, RA ou autre.' }),
    defineField({ name: 'flyer', title: 'Flyer', type: 'imageCreditee', description: 'Le visuel d’origine, jamais recadré. Sans flyer, le site affiche la date en grand.' }),
    defineField({ name: 'description', title: 'Description', type: 'texte' }),
    defineField({ name: 'traitement', title: 'Traitement automatique', type: 'traitement' }),
    defineField({ name: 'flyerOptimise', title: 'Flyer optimisé', type: 'imagesDerivees' }),
    defineField({ name: 'sources', title: 'Sources', type: 'array', of: [defineArrayMember({ type: 'url' })], readOnly: true }),
    defineField({ name: 'verifiee', title: 'Date et lieu vérifiés', type: 'boolean', initialValue: true, description: 'Décoché : le site affiche « Date à confirmer par le label ».' }),
  ],
  orderings: [{ title: 'Date, récente d’abord', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { date: 'date', nom: 'nom', lieu: 'lieu', statut: 'statut', media: 'flyer' },
    prepare: ({ date, nom, lieu, statut, media }) => ({ title: `${date ?? ''} · ${nom ?? 'Groove To Grave Records'}`, subtitle: `${lieu ?? ''}${statut === 'annulee' ? ' · annulée' : statut === 'reportee' ? ' · reportée' : ''}`, media }),
  },
})
