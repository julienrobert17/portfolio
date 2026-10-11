import { medias } from '../content/medias'
import type { Sortie } from '../content/types'
import type { PisteJouable } from '../store/lecteur-store'
import { couleursCassette } from '../ui/cassette'

/**
 * Les pistes jouables du site, dans l'ordre du mur, sérialisées pour le lecteur : seules les
 * pistes qui ont un extrait (fichier du label ou provisoire) y figurent. Construit côté serveur
 * dans le layout, passé en props au composant client.
 */
export function catalogueLecteur(sorties: Sortie[]): PisteJouable[] {
  const pistes: PisteJouable[] = []
  for (const s of sorties) {
    const c = couleursCassette(s.ref)
    for (const t of s.tracks) {
      if (!t.extrait) continue
      pistes.push({
        id: t.id,
        sortieRef: s.ref,
        catalog: s.catalog,
        artiste: t.artist ?? s.artistName,
        titre: t.title,
        position: t.position,
        format: s.format,
        src: t.extrait.src,
        duration: t.extrait.duration,
        bpm: t.extrait.bpm ?? s.bpmProvisoire,
        origine: t.extrait.origine,
        genres: s.genres,
        bandcamp: s.links.bandcamp,
        coque: c.coque,
        bande: c.bande,
        texteBande: c.texteBande,
        pochette: medias[s.ref] ? s.ref : undefined,
      })
    }
  }
  return pistes
}
