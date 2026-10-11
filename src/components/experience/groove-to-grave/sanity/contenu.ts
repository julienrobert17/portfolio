import 'server-only'
import { draftMode } from 'next/headers'
import { extraits } from '../content/extraits'
import type { Artiste, Genre, Preset, Soiree, Sortie } from '../content/types'
import { adapterArtistes, adapterLabel, adapterSoirees, adapterSorties, type Label, type Textes, adapterTextes } from './adaptateur'
import { client, jetonPresent } from './client'
import instantane from './instantane.json'
import { REQUETE_ARTISTES, REQUETE_REGLAGES, REQUETE_SOIREES, REQUETE_SORTIES, REQUETE_TEXTES } from './requetes'
import type { REQUETE_ARTISTES_RESULT, REQUETE_REGLAGES_RESULT, REQUETE_SOIREES_RESULT, REQUETE_SORTIES_RESULT, REQUETE_TEXTES_RESULT } from './types.generated'

/**
 * Chargeur du contenu (Phase 7.3). Chaque type de document est une requête GROQ serveur mise en
 * cache par Next avec ses tags (`g2g`, `g2g:sortie`, `g2g:sortie:gtgr05`…), revalidée par le
 * webhook (/api/g2g/revalidation). En mode brouillon (Presentation du Studio), les requêtes
 * lisent la perspective `drafts` sans cache. Si Sanity est injoignable ou le jeton absent, le
 * chargeur sert l'instantané commité (`instantane.json`, régénéré par
 * scripts/g2g-instantane-sanity.ts) : le build ne casse pas, les pages servent la dernière
 * version connue. Les composants reçoivent les types du site (content/types.ts).
 */

export interface Contenu {
  sorties: Sortie[]
  artistes: Artiste[]
  soirees: Soiree[]
  label: Label
  textes: Textes
  /** Vrai si tout vient de Sanity ; faux si au moins un type vient de l'instantané. */
  enDirect: boolean
}

interface Brut {
  sorties: REQUETE_SORTIES_RESULT
  artistes: REQUETE_ARTISTES_RESULT
  soirees: REQUETE_SOIREES_RESULT
  textes: REQUETE_TEXTES_RESULT
  reglages: REQUETE_REGLAGES_RESULT
}

const INSTANTANE = instantane as unknown as Brut

export const TAGS = {
  tout: 'g2g',
  sortie: 'g2g:sortie',
  artiste: 'g2g:artiste',
  soiree: 'g2g:soiree',
  textes: 'g2g:textes',
  reglages: 'g2g:reglages',
} as const

async function enBrouillon(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    // Hors d'une requête (génération des paramètres statiques, scripts) : publié.
    return false
  }
}

async function requete<T>(query: string, tag: string, repli: T): Promise<{ valeur: T; direct: boolean }> {
  const brouillon = await enBrouillon()
  if (!jetonPresent) return { valeur: repli, direct: false }
  try {
    const valeur = await client.fetch<T>(query, {}, brouillon ? { perspective: 'drafts', cache: 'no-store' } : { cache: 'force-cache', next: { tags: [TAGS.tout, tag] } })
    return { valeur, direct: true }
  } catch (e) {
    console.error(`[groove-to-grave] Sanity injoignable pour ${tag}, instantané servi : ${e instanceof Error ? e.message : String(e)}`)
    return { valeur: repli, direct: false }
  }
}

/** Tout le contenu du site, en un appel (chaque type est caché et revalidé séparément). */
export async function chargerContenu(): Promise<Contenu> {
  const [sorties, artistes, soirees, textes, reglages] = await Promise.all([
    requete<REQUETE_SORTIES_RESULT>(REQUETE_SORTIES, TAGS.sortie, INSTANTANE.sorties),
    requete<REQUETE_ARTISTES_RESULT>(REQUETE_ARTISTES, TAGS.artiste, INSTANTANE.artistes),
    requete<REQUETE_SOIREES_RESULT>(REQUETE_SOIREES, TAGS.soiree, INSTANTANE.soirees),
    requete<REQUETE_TEXTES_RESULT>(REQUETE_TEXTES, TAGS.textes, INSTANTANE.textes),
    requete<REQUETE_REGLAGES_RESULT>(REQUETE_REGLAGES, TAGS.reglages, INSTANTANE.reglages),
  ])
  return {
    sorties: adapterSorties(sorties.valeur),
    artistes: adapterArtistes(artistes.valeur),
    soirees: adapterSoirees(soirees.valeur),
    label: adapterLabel(reglages.valeur, textes.valeur),
    textes: adapterTextes(textes.valeur),
    enDirect: [sorties, artistes, soirees, textes, reglages].every((r) => r.direct),
  }
}

/* Les fonctions de sélection, pures, reprises de content/index.ts. */

export function filtrerSorties(preset: Preset, liste: Sortie[]): Sortie[] {
  const garde = (s: Sortie) => preset === 'tout' || s.genres.includes(preset as Genre)
  const tri = (a: Sortie, b: Sortie) => b.releaseDate.localeCompare(a.releaseDate)
  return [...liste.filter((s) => s.kind !== 'compilation' && garde(s)).sort(tri), ...liste.filter((s) => s.kind === 'compilation' && garde(s)).sort(tri)]
}

export function soireesAVenir(liste: Soiree[], aujourdhui = new Date().toISOString().slice(0, 10)): Soiree[] {
  return liste.filter((s) => s.status === 'a-venir' && s.date >= aujourdhui).sort((a, b) => a.date.localeCompare(b.date))
}

export function soireesPassees(liste: Soiree[], aujourdhui = new Date().toISOString().slice(0, 10)): Soiree[] {
  return liste.filter((s) => s.status !== 'a-venir' || s.date < aujourdhui).sort((a, b) => b.date.localeCompare(a.date))
}

export function getSortie(liste: Sortie[], ref: string): Sortie | undefined {
  return liste.find((s) => s.ref === ref)
}

export function getArtiste(liste: Artiste[], slug: string): Artiste | undefined {
  return liste.find((a) => a.slug === slug)
}

/** Vrai si une piste a un extrait (les extraits restent générés localement en 7.3). */
export const aExtrait = (id: string): boolean => Boolean(extraits[id])
