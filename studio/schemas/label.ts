import { defineArrayMember, defineField, defineType } from 'sanity'

/** Textes du label : un seul document (`textes`), édité depuis la section « Textes du label ». */
export const textes = defineType({
  name: 'textes',
  title: 'Textes du label',
  type: 'document',
  fields: [
    defineField({ name: 'presentation', title: 'Présentation du label', type: 'texte', description: 'En tête de la page « Le label » et sur l’accueil.', validation: (r) => r.required() }),
    defineField({ name: 'phrase', title: 'Phrase du label', type: 'texte', description: 'Au marqueur sur l’accueil (« Du sillon à la tombe. »).' }),
    defineField({ name: 'pourquoi', title: 'Pourquoi', type: 'texte', description: 'Section « Pourquoi » de la page « Le label ».' }),
    defineField({ name: 'demo', title: 'Proposer une démo', type: 'texte', description: 'La procédure : lien d’écoute privé, nombre de titres, délai de réponse.' }),
    defineField({ name: 'soireesVide', title: 'Aucune soirée annoncée', type: 'texte', description: 'Affiché quand aucune date n’est à venir.' }),
    defineField({ name: 'newsletter', title: 'Message après inscription', type: 'texte' }),
    defineField({ name: 'droits', title: 'Droits des œuvres', type: 'texte', description: 'Pied de page : à qui appartiennent pochettes, flyers et textes.' }),
  ],
  preview: { prepare: () => ({ title: 'Textes du label' }) },
})

/** Réglages : contact, newsletter, réseaux, disquaires. Un seul document (`reglages`). */
export const reglages = defineType({
  name: 'reglages',
  title: 'Réglages',
  type: 'document',
  fields: [
    defineField({ name: 'nom', title: 'Nom du label', type: 'string', initialValue: 'Groove To Grave Records', validation: (r) => r.required() }),
    defineField({ name: 'ville', title: 'Ville', type: 'string', initialValue: 'Paris' }),
    defineField({ name: 'depuis', title: 'Depuis (année)', type: 'number' }),
    defineField({ name: 'distribution', title: 'Distribution', type: 'string' }),
    defineField({ name: 'contact', title: 'Adresse e-mail de contact', type: 'string', description: 'Affichée sur la page contact. Vide : le site renvoie vers Instagram.', validation: (r) => r.email() }),
    defineField({ name: 'contactDemo', title: 'Adresse pour les démos', type: 'string', validation: (r) => r.email() }),
    defineField({
      name: 'newsletter',
      title: 'Newsletter',
      type: 'object',
      fields: [
        defineField({ name: 'active', title: 'Formulaire actif', type: 'boolean', initialValue: false, description: 'Décoché : le formulaire vérifie l’adresse mais n’enregistre rien, et le dit.' }),
        defineField({ name: 'fournisseur', title: 'Fournisseur', type: 'string', description: 'Outil choisi (Mailchimp, Brevo…). Les clés restent dans les variables d’environnement du site.' }),
      ],
    }),
    defineField({ name: 'crew', title: 'Le crew', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'artiste' }] })], description: 'Les membres du collectif, dans l’ordre d’affichage sur la page « Le label ».', validation: (r) => r.unique() }),
    defineField({ name: 'reseaux', title: 'Réseaux', type: 'array', of: [defineArrayMember({ type: 'lien' })], description: 'Bandcamp en premier.' }),
    defineField({ name: 'disquaires', title: 'Disquaires', type: 'array', of: [defineArrayMember({ type: 'lien' })] }),
  ],
  preview: { prepare: () => ({ title: 'Réglages' }) },
})
