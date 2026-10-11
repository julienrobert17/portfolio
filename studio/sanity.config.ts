import { frFRLocale } from '@sanity/locale-fr-fr'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes, typesUniques } from './schemas'
import { structure } from './structure'

/**
 * Studio de Groove To Grave Records (Phase 7.2) : interface en français, sections Sorties,
 * Artistes, Soirées, Textes du label, Réglages. Les types uniques (textes, réglages) ne se
 * créent pas depuis le bouton « Nouveau ». Hébergé sur groove-to-grave.sanity.studio, hors du
 * site et de ses dépendances.
 */
export default defineConfig({
  name: 'groove-to-grave',
  title: 'Groove To Grave Records',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure }), visionTool(), frFRLocale()],
  schema: {
    types: schemaTypes,
    templates: (modeles) => modeles.filter((m) => !typesUniques.includes(m.schemaType)),
  },
  document: {
    newDocumentOptions: (options, { creationContext }) => (creationContext.type === 'global' ? options.filter((o) => !typesUniques.includes(o.templateId)) : options),
    actions: (actions, { schemaType }) => (typesUniques.includes(schemaType) ? actions.filter((a) => !['delete', 'duplicate', 'unpublish'].includes(a.action ?? '')) : actions),
  },
})
