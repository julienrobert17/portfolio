import 'server-only'
import { createClient } from 'next-sanity'

/** Identifiants publics du projet ; le jeton de lecture, lui, ne vit que dans les variables d'environnement. */
export const PROJET = process.env.SANITY_PROJECT_ID ?? 'da2plce8'
export const DATASET = process.env.SANITY_DATASET ?? 'production'
export const VERSION_API = '2025-01-01'

/**
 * Client Sanity du site (Phase 7.3), serveur seulement : le dataset est privé, chaque requête
 * porte le jeton de lecture `SANITY_LECTURE_TOKEN` (rôle viewer). Pas de CDN : le cache est
 * celui de Next (tags), revalidé par le webhook. Sans jeton (variable absente), le client
 * existe mais chaque requête échouera : le chargeur bascule alors sur l'instantané.
 */
export const client = createClient({
  projectId: PROJET,
  dataset: DATASET,
  apiVersion: VERSION_API,
  useCdn: false,
  token: process.env.SANITY_LECTURE_TOKEN,
  perspective: 'published',
  stega: false,
})

export const jetonPresent = Boolean(process.env.SANITY_LECTURE_TOKEN)
