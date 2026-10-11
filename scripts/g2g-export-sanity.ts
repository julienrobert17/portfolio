/**
 * Phase 7.2 : transforme le contenu TypeScript actuel (sorties, artistes, soirées, textes,
 * réglages) en ndjson pour `sanity dataset import`, avec les originaux d'images de
 * content/groove-to-grave/media/source/ référencés en `_sanityAsset` (téléversés par l'import).
 * Identifiants stables : `sortie-gtgr05`, `artiste-kitchen-plug`, `soiree-2026-10-11`, `textes`,
 * `reglages`. Les textes écrits pour le site (`draft`) gardent « à valider par le label ».
 * Le fichier est écrit hors dépôt (.next/cache/groove-to-grave/sanity/import.ndjson).
 *
 *   npx tsx scripts/g2g-export-sanity.ts
 *   cd studio && npx sanity dataset import ../.next/cache/groove-to-grave/sanity/import.ndjson production --replace
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { artistes } from '../src/components/experience/groove-to-grave/content/artists'
import { soirees } from '../src/components/experience/groove-to-grave/content/events'
import { label, textes } from '../src/components/experience/groove-to-grave/content/label'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import type { Texte } from '../src/components/experience/groove-to-grave/content/types'
import { CACHE, SOURCE, dossier } from './g2g-lib'

const SORTIE = join(dossier(join(CACHE, 'sanity')), 'import.ndjson')
const FORMATS = ['jpg', 'png', 'jpeg', 'webp']

function image(id: string, alt: string, credit: string | undefined): Record<string, unknown> | undefined {
  const fichier = FORMATS.map((f) => join(SOURCE, `${id}.${f}`)).find((p) => existsSync(p))
  if (!fichier) return undefined
  return { _type: 'imageCreditee', _sanityAsset: `image@file://${fichier}`, alt, credit: credit ?? '' }
}

function texte(t: Texte | undefined): Record<string, unknown> | undefined {
  if (!t) return undefined
  return { _type: 'texte', langue: t.lang, corps: t.body, aValiderParLeLabel: Boolean(t.draft) }
}

const lien = (libelle: string, url: string, i: number) => ({ _type: 'lien', _key: `l${i}`, libelle, url })
const refs = (ids: string[]) => ids.map((id, i) => ({ _type: 'reference', _ref: id, _key: `r${i}` }))
const nettoyer = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)))

function main(): void {
  const docs: Record<string, unknown>[] = []
  const avertissements: string[] = []

  for (const s of sorties) {
    const pochette = image(s.ref, `Pochette de ${s.title} par ${s.artistName}`, s.credits.artwork)
    if (!pochette) avertissements.push(`${s.catalog} : pochette absente de media/source`)
    if (!s.credits.artwork) avertissements.push(`${s.catalog} : crédit artwork manquant`)
    docs.push(nettoyer({
      _id: `sortie-${s.ref}`,
      _type: 'sortie',
      catalogue: s.catalog,
      slug: { _type: 'slug', current: s.ref },
      titre: s.title,
      genre: s.kind,
      artiste: s.artistSlug ? { _type: 'reference', _ref: `artiste-${s.artistSlug}` } : undefined,
      nomArtiste: s.artistName,
      dateSortie: s.releaseDate,
      statut: s.status,
      sansRepress: s.noRepress,
      genres: s.genres,
      genresValides: false,
      pochette,
      pistes: s.tracks.map((t) => nettoyer({ _type: 'piste', _key: t.id, position: t.position, titre: t.title, artiste: t.artist, duree: t.duration, bonusNumerique: Boolean(t.digitalOnly), traitement: { _type: 'traitement', etat: 'en-attente' } })),
      texte: texte(s.text),
      credits: nettoyer({ artwork: s.credits.artwork, mastering: s.credits.mastering, distribution: s.credits.distribution, ar: s.credits.ar }),
      aVerifier: s.aVerifier,
      bandcamp: s.links.bandcamp,
      boutiques: Object.entries(s.links).filter(([k]) => k !== 'bandcamp').map(([k, url], i) => lien(k === 'deejay' ? 'deejay.de' : k[0].toUpperCase() + k.slice(1), url, i)),
      traitement: { _type: 'traitement', etat: 'en-attente' },
      sources: s.sources,
    }))
  }

  for (const a of artistes) {
    docs.push(nettoyer({
      _id: `artiste-${a.slug}`,
      _type: 'artiste',
      nom: a.name,
      slug: { _type: 'slug', current: a.slug },
      ville: a.city,
      role: a.role,
      presentation: texte(a.presentation),
      sorties: refs(a.releases.map((r) => `sortie-${r}`)),
      liens: a.links.map((l, i) => lien(l.label, l.url, i)),
      sources: a.sources,
    }))
  }

  for (const e of soirees) {
    const flyer = image(e.date, `Flyer de la soirée ${e.name ?? 'Groove To Grave Records'} du ${e.date} au ${e.venue}`, e.flyerCredit)
    if (flyer && !e.flyerCredit) avertissements.push(`soirée ${e.date} : crédit du flyer manquant (validation en attente du label)`)
    if (!e.verified) avertissements.push(`soirée ${e.date} : date ou lieu non vérifiés`)
    docs.push(nettoyer({
      _id: `soiree-${e.date}`,
      _type: 'soiree',
      date: e.date,
      nom: e.name,
      lieu: e.venue,
      adresse: e.address,
      ville: e.city,
      horaires: e.hours,
      lineup: e.lineup,
      statut: e.status,
      prix: e.price,
      billetterie: e.ticketing,
      flyer,
      description: texte(e.description),
      traitement: { _type: 'traitement', etat: 'en-attente' },
      sources: e.sources,
      verifiee: e.verified,
    }))
  }

  docs.push(nettoyer({
    _id: 'textes',
    _type: 'textes',
    presentation: texte(label.presentation),
    phrase: texte(textes.phrase),
    pourquoi: texte(textes.pourquoi),
    demo: texte(textes.demo),
    soireesVide: texte(textes.soireesVide),
    newsletter: texte(textes.newsletter),
    droits: texte(textes.droits),
  }))
  docs.push(nettoyer({
    _id: 'reglages',
    _type: 'reglages',
    nom: label.nom,
    ville: label.ville,
    depuis: label.depuis,
    distribution: label.distribution,
    contact: label.contact ?? undefined,
    newsletter: { active: false },
    reseaux: label.reseaux.map((l, i) => lien(l.label, l.url, i)),
    disquaires: label.disquaires.map((l, i) => lien(l.label, l.url, i)),
  }))

  writeFileSync(SORTIE, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
  const parType = docs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [String(d._type)]: (acc[String(d._type)] ?? 0) + 1 }), {})
  process.stdout.write(`${SORTIE}\n${Object.entries(parType).map(([t, n]) => `${t} ${n}`).join(', ')}\n`)
  process.stdout.write(`images référencées : ${docs.filter((d) => d.pochette || d.flyer).length}\n`)
  if (avertissements.length) process.stdout.write(`avertissements (${avertissements.length}) :\n  ${avertissements.join('\n  ')}\n`)
}

main()
