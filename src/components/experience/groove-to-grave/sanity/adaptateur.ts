import { extraits } from '../content/extraits'
import type { Artiste, Credits, FormatSortie, Genre, Lien, Piste, Soiree, Sortie, Texte } from '../content/types'
import { MARQUE } from '../lib/marque'
import type { REQUETE_ARTISTES_RESULT, REQUETE_REGLAGES_RESULT, REQUETE_SOIREES_RESULT, REQUETE_SORTIES_RESULT, REQUETE_TEXTES_RESULT } from './types.generated'

/**
 * Adaptateur (Phase 7.3) : des documents Sanity (types générés) vers les types du site
 * (content/types.ts), que tous les composants et pages continuent d'utiliser tels quels. Les
 * images et les extraits ne sont pas lus dans Sanity : ils restent sous
 * public/experience/groove-to-grave/, retrouvés par la clé stable (ref, date, slug).
 */

type TexteSanity = { langue: 'fr' | 'en' | string | null; corps: string | null; aValiderParLeLabel: boolean | null } | null

function texte(t: TexteSanity | undefined): Texte | undefined {
  if (!t?.corps) return undefined
  return { lang: t.langue === 'en' ? 'en' : 'fr', body: t.corps, ...(t.aValiderParLeLabel ? { draft: true as const } : {}) }
}

function liens(l: { libelle: string | null; url: string | null }[] | null | undefined): Lien[] {
  return (l ?? []).filter((x): x is { libelle: string; url: string } => Boolean(x.libelle && x.url)).map((x) => ({ label: x.libelle, url: x.url }))
}

const FORMATS: Record<string, FormatSortie> = { vinyle: '12″ vinyle', 'ep-numerique': 'EP numérique', compilation: 'compilation numérique' }
const GENRES: Genre[] = ['house', 'break', 'minimal', 'electro']
const BPM_PROVISOIRE = 124

export function adapterSorties(docs: REQUETE_SORTIES_RESULT): Sortie[] {
  const sorties: Sortie[] = []
  for (const d of docs) {
    if (!d.ref || !d.catalogue || !d.titre || !d.dateSortie) continue
    const ref = d.ref
    const kind = (d.genre ?? 'vinyle') as Sortie['kind']
    const tracks: Piste[] = (d.pistes ?? [])
      .filter((p) => p.position && p.titre)
      .map((p) => {
        const id = `${ref}-${String(p.position).toLowerCase()}`
        const piste: Piste = { id, position: String(p.position), title: String(p.titre), duration: p.duree ?? 0 }
        if (p.artiste) piste.artist = p.artiste
        if (p.bonusNumerique) piste.digitalOnly = true
        if (extraits[id]) piste.extrait = extraits[id]
        return piste
      })
    const links: Sortie['links'] = { bandcamp: d.bandcamp ?? MARQUE.bandcamp }
    for (const b of d.boutiques ?? []) if (b.libelle && b.url) links[b.libelle.toLowerCase().replace(/\.de$/, '')] = b.url
    const credits: Credits = {}
    if (d.credits?.artwork) credits.artwork = d.credits.artwork
    if (d.credits?.mastering) credits.mastering = d.credits.mastering
    if (d.credits?.distribution) credits.distribution = d.credits.distribution
    if (d.credits?.ar) credits.ar = d.credits.ar
    const sortie: Sortie = {
      ref,
      catalog: d.catalogue,
      kind,
      format: FORMATS[kind] ?? '12″ vinyle',
      artistName: d.nomArtiste ?? 'Various Artists',
      title: d.titre,
      releaseDate: d.dateSortie,
      status: (d.statut ?? 'disponible') as Sortie['status'],
      noRepress: Boolean(d.sansRepress),
      genres: (d.genres ?? []).filter((g): g is Genre => GENRES.includes(g as Genre)),
      genresVerified: false,
      credits,
      links,
      bandcampArtId: 0,
      bpmProvisoire: BPM_PROVISOIRE,
      tracks,
      sources: (d.sources ?? []).filter((s): s is string => Boolean(s)),
      verified: true,
    }
    if (d.artisteSlug) sortie.artistSlug = d.artisteSlug
    const t = texte(d.texte)
    if (t) sortie.text = t
    if (d.aVerifier?.length) sortie.aVerifier = d.aVerifier.filter((a): a is string => Boolean(a))
    sorties.push(sortie)
  }
  return sorties
}

export function adapterArtistes(docs: REQUETE_ARTISTES_RESULT): Artiste[] {
  const artistes: Artiste[] = []
  for (const d of docs) {
    if (!d.slug || !d.nom) continue
    const a: Artiste = {
      slug: d.slug,
      name: d.nom,
      releases: (d.sorties ?? []).filter((s): s is string => Boolean(s)),
      links: liens(d.liens),
      sources: (d.sources ?? []).filter((s): s is string => Boolean(s)),
      verified: true,
    }
    if (d.ville) a.city = d.ville
    if (d.role) a.role = d.role
    const p = texte(d.presentation)
    if (p) a.presentation = p
    artistes.push(a)
  }
  return artistes
}

export function adapterSoirees(docs: REQUETE_SOIREES_RESULT): Soiree[] {
  const soirees: Soiree[] = []
  for (const d of docs) {
    if (!d.date || !d.lieu) continue
    const s: Soiree = {
      date: d.date,
      venue: d.lieu,
      city: d.ville ?? 'Paris',
      lineup: (d.lineup ?? []).filter((l): l is string => Boolean(l)),
      status: (d.statut ?? 'passee') as Soiree['status'],
      sources: (d.sources ?? []).filter((x): x is string => Boolean(x)),
      verified: d.verifiee !== false,
    }
    if (d.nom) s.name = d.nom
    if (d.adresse) s.address = d.adresse
    if (d.horaires) s.hours = d.horaires
    if (d.prix) s.price = d.prix
    if (d.billetterie) s.ticketing = d.billetterie
    const desc = texte(d.description)
    if (desc) s.description = desc
    // Crédit du flyer : celui du label, ou « auteur non identifié » quand la case est cochée (bloc 7.2b).
    if (d.flyer?.credit) s.flyerCredit = d.flyer.credit
    else if (d.flyer?.auteurNonIdentifie) s.flyerCredit = 'auteur non identifié'
    soirees.push(s)
  }
  return soirees
}

/** Textes du site, même forme que `textes` de content/label.ts. */
export interface Textes {
  phrase: Texte
  pourquoi: Texte
  demo: Texte
  soireesVide: Texte
  newsletter: Texte
  credits: Texte
  droits: Texte
}

/** Identité du label, même forme que `label` de content/label.ts. */
export interface Label {
  nom: string
  court: string
  prefixeCatalogue: string
  ville: string
  depuis: number
  bio: Texte
  presentation: Texte
  crew: string[]
  distribution: string
  disquaires: Lien[]
  reseaux: Lien[]
  contact: string | null
  contactDemo: string | null
  newsletterActive: boolean
}

const VIDE: Texte = { lang: 'fr', body: '' }

export function adapterTextes(t: REQUETE_TEXTES_RESULT): Textes {
  return {
    phrase: texte(t?.phrase) ?? VIDE,
    pourquoi: texte(t?.pourquoi) ?? VIDE,
    demo: texte(t?.demo) ?? VIDE,
    soireesVide: texte(t?.soireesVide) ?? VIDE,
    newsletter: texte(t?.newsletter) ?? VIDE,
    credits: { lang: 'fr', body: 'Site réalisé par Julien Robert pour Groove To Grave Records.' },
    droits: texte(t?.droits) ?? VIDE,
  }
}

export function adapterLabel(r: REQUETE_REGLAGES_RESULT, t: REQUETE_TEXTES_RESULT): Label {
  return {
    nom: r?.nom ?? MARQUE.nom,
    court: MARQUE.court,
    prefixeCatalogue: MARQUE.prefixeCatalogue,
    ville: r?.ville ?? 'Paris',
    depuis: r?.depuis ?? 2022,
    bio: { lang: 'en', body: 'Paris based record label' },
    presentation: texte(t?.presentation) ?? VIDE,
    crew: (r?.crew ?? []).filter((c): c is string => Boolean(c)),
    distribution: r?.distribution ?? '',
    disquaires: liens(r?.disquaires),
    reseaux: liens(r?.reseaux),
    contact: r?.contact ?? null,
    contactDemo: r?.contactDemo ?? null,
    newsletterActive: Boolean(r?.newsletter?.active),
  }
}
