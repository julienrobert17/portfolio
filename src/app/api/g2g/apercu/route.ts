import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/components/experience/groove-to-grave/sanity/client'

/**
 * Entrée du mode brouillon (Phase 7.3), appelée par l'outil Aperçu (Presentation) du Studio avec
 * un secret à usage unique que next-sanity vérifie auprès de Sanity avec le jeton de lecture :
 * seules les personnes connectées au Studio y accèdent. Le mode brouillon pose un cookie ; les
 * pages lisent alors les brouillons sans cache. Le site reste en noindex.
 */
export const { GET } = defineEnableDraftMode({ client })
