import { artistes } from '../content/artists'
import { soirees } from '../content/events'
import { label } from '../content/label'
import { sorties } from '../content/releases'
import { dateLongue } from './format'

export type TypeSource = 'Bandcamp' | 'Disquaires' | 'Billetteries et annonces' | 'Archives'

export interface SourceSite {
  type: TypeSource
  titre: string
  url: string
  domaine: string
}

const DISQUAIRES = /yoyaku|deejay\.de|redeye|subwax/i

function domaineDe(url: string): string {
  const u = url.startsWith('https://web.archive.org/web/') ? url.replace(/^https:\/\/web\.archive\.org\/web\/\d+\//, '') : url
  return u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
}

function typeDe(url: string): TypeSource {
  if (url.includes('web.archive.org')) return 'Archives'
  if (url.includes('bandcamp.com')) return 'Bandcamp'
  if (DISQUAIRES.test(url)) return 'Disquaires'
  return 'Billetteries et annonces'
}

/**
 * Toutes les sources du contenu, dédoublonnées, avec un titre lisible et le domaine plutôt que
 * l'URL brute, groupées par type pour la page /sources.
 */
export function sourcesDuSite(): Record<TypeSource, SourceSite[]> {
  const vues = new Map<string, SourceSite>()
  const ajouter = (url: string, titre: string) => {
    if (!vues.has(url)) vues.set(url, { type: typeDe(url), titre, url, domaine: domaineDe(url) })
  }
  for (const s of sorties) {
    ajouter(s.links.bandcamp, `${s.catalog} · ${s.artistName}, ${s.title}`)
    for (const [k, u] of Object.entries(s.links)) if (k !== 'bandcamp') ajouter(u, `${s.catalog} chez ${k === 'deejay' ? 'deejay.de' : k[0].toUpperCase() + k.slice(1)}`)
    for (const u of s.sources) ajouter(u, `${s.catalog} · ${s.artistName}, ${s.title}`)
  }
  for (const a of artistes) {
    for (const l of a.links) ajouter(l.url, l.label)
    for (const u of a.sources) ajouter(u, a.name)
  }
  for (const ev of soirees) {
    const nom = `${ev.name ?? 'Groove To Grave Records'}, ${dateLongue(ev.date)}`
    if (ev.ticketing) ajouter(ev.ticketing, nom)
    for (const u of ev.sources) ajouter(u, u.includes('web.archive.org') ? `${nom} (capture)` : nom)
  }
  for (const l of [...label.reseaux, ...label.disquaires]) ajouter(l.url, `${label.nom} sur ${l.label}`)
  for (const u of label.sources) ajouter(u, label.nom)
  const groupes: Record<TypeSource, SourceSite[]> = { Bandcamp: [], Disquaires: [], 'Billetteries et annonces': [], Archives: [] }
  for (const s of vues.values()) groupes[s.type].push(s)
  for (const liste of Object.values(groupes)) liste.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
  return groupes
}
