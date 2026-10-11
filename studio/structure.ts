import type { StructureResolver } from 'sanity/structure'

/** Sections du Studio, dans l'ordre de travail du label. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Groove To Grave Records')
    .items([
      S.listItem().title('Sorties').schemaType('sortie').child(S.documentTypeList('sortie').title('Sorties').defaultOrdering([{ field: 'dateSortie', direction: 'desc' }])),
      S.listItem().title('Artistes').schemaType('artiste').child(S.documentTypeList('artiste').title('Artistes').defaultOrdering([{ field: 'ordre', direction: 'asc' }])),
      S.listItem().title('Soirées').schemaType('soiree').child(S.documentTypeList('soiree').title('Soirées').defaultOrdering([{ field: 'date', direction: 'desc' }])),
      S.divider(),
      S.listItem().title('Textes du label').id('textes').child(S.document().schemaType('textes').documentId('textes').title('Textes du label')),
      S.listItem().title('Réglages').id('reglages').child(S.document().schemaType('reglages').documentId('reglages').title('Réglages')),
    ])
