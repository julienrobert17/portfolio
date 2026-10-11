/**
 * Résolution des médias de « Groove To Grave » selon la priorité du brief (§7) :
 * fichier fourni par le label, sinon fichier public récupéré par g2g-fetch-media.ts,
 * sinon provisoire. Génère les images AVIF/WebP (jamais recadrées ni retouchées) et les
 * extraits du label (60 s, départ à 30 %, fondus de 2 s, MP3 192 kbps à −14 LUFS ; refus
 * des inédits et des sorties à venir), puis écrit content/medias.ts, content/extraits.ts
 * et content/groove-to-grave/media/rapport.md avec la source retenue par emplacement.
 *
 *   npx tsx scripts/g2g-media.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { artistes } from '../src/components/experience/groove-to-grave/content/artists'
import { soirees } from '../src/components/experience/groove-to-grave/content/events'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import type { Extrait, ImageMedia, OrigineMedia } from '../src/components/experience/groove-to-grave/content/types'
import { CACHE, LABEL, MEDIA, PUBLIC_AUDIO, SOURCE, dossier, dureeAudio, ecrireModule, encoderMp3Normalise, exporterImage, ffmpegDisponible, lireJson, lireManifeste, lireSources } from './g2g-lib'

// Pas de top-level await : le dépôt compile les scripts en CommonJS (voir fetch-la-coupe-photos.ts).
async function main(): Promise<void> {
  const AUJOURDHUI = new Date().toISOString().slice(0, 10)
  const manifeste = lireManifeste()
  const sources = lireSources()
  const provisoires = lireJson<{ extraits: { track: string; file: string; bpm: number; duration: number }[] }>(join(MEDIA, 'provisoires.json'), { extraits: [] })

  interface Ligne {
    emplacement: string
    id: string
    origine: OrigineMedia | 'absent' | 'refusé'
    detail: string
  }
  const rapport: Ligne[] = []
  const medias: Record<string, ImageMedia> = {}
  const extraits: Record<string, Extrait> = {}

  // ─── Images ───

  interface Candidat {
    chemin: string
    origine: OrigineMedia
    credit?: string
    sourceUrl?: string
  }

  function candidatImage(id: string, kind: 'pochette' | 'flyer' | 'photo'): Candidat | null {
    const duLabel = manifeste.images.find((i) => i.id === id)
    if (duLabel) {
      const chemin = join(LABEL, 'images', duLabel.file)
      if (existsSync(chemin)) return { chemin, origine: 'label', credit: duLabel.credit }
      rapport.push({ emplacement: kind, id, origine: 'absent', detail: `manifeste : fichier ${duLabel.file} introuvable, on passe au public` })
    }
    const publique = sources.entrees.find((e) => e.id === id && e.kind === kind)
    if (publique && existsSync(join(SOURCE, publique.file))) return { chemin: join(SOURCE, publique.file), origine: 'public', credit: publique.credit, sourceUrl: publique.page ?? publique.url }
    return null
  }

  /** Pochette provisoire : aplat neutre avec la référence, le temps qu'une vraie image arrive. */
  function pochetteProvisoire(ref: string, catalog: string): Buffer {
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#d8d3c4"/><rect x="60" y="60" width="1080" height="1080" fill="none" stroke="#111111" stroke-width="12"/><text x="600" y="640" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="150" fill="#111111">${catalog}</text><text x="600" y="760" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="48" fill="#111111">pochette provisoire · ${ref}</text></svg>`,
    )
  }

  async function traiterImage(id: string, kind: 'pochette' | 'flyer' | 'photo', candidat: Candidat | null, provisoire?: () => Buffer): Promise<void> {
    if (!candidat && !provisoire) {
      rapport.push({ emplacement: kind, id, origine: 'absent', detail: 'ni fichier du label ni visuel public' })
      return
    }
    const brut = candidat ? readFileSync(candidat.chemin) : provisoire!()
    const origine: OrigineMedia = candidat?.origine ?? 'provisoire'
    const exporte = await exporterImage(brut, id)
    medias[id] = { id, origine, ...exporte, credit: candidat?.credit, sourceUrl: candidat?.sourceUrl }
    rapport.push({ emplacement: kind, id, origine, detail: candidat ? `${candidat.chemin.replace(process.cwd() + '/', '')} → ${exporte.width}×${exporte.height}, largeurs ${exporte.largeurs.join('/')}` : 'aplat généré' })
  }

  process.stdout.write('Images\n')
  for (const s of sorties) await traiterImage(s.ref, 'pochette', candidatImage(s.ref, 'pochette'), () => pochetteProvisoire(s.ref, s.catalog))
  for (const ev of soirees) await traiterImage(ev.date, 'flyer', candidatImage(ev.date, 'flyer'))
  for (const a of artistes) {
    const c = candidatImage(a.slug, 'photo')
    if (c) await traiterImage(a.slug, 'photo', c)
  }

  // ─── Audio ───

  process.stdout.write('Audio\n')
  const pistes = sorties.flatMap((s) => s.tracks.map((t) => ({ sortie: s, piste: t })))
  if (!ffmpegDisponible() && manifeste.audio.length) process.stderr.write('ffmpeg introuvable : les extraits du label ne seront pas traités.\n')
  dossier(PUBLIC_AUDIO)
  dossier(join(CACHE, 'label'))

  for (const { sortie, piste } of pistes) {
    const duLabel = manifeste.audio.find((a) => a.track === piste.id)
    if (duLabel && ffmpegDisponible()) {
      const chemin = join(LABEL, 'audio', duLabel.file)
      if (!existsSync(chemin)) rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'absent', detail: `manifeste : fichier ${duLabel.file} introuvable` })
      else if (duLabel.unreleased) rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'refusé', detail: 'marqué inédit dans le manifeste' })
      else if (sortie.releaseDate > AUJOURDHUI) rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'refusé', detail: `sortie ${sortie.catalog} datée du ${sortie.releaseDate}, pas encore sortie` })
      else {
        const total = dureeAudio(chemin)
        const duree = Math.min(duLabel.duration ?? 60, total)
        const depart = Math.max(0, Math.min(duLabel.start ?? total * 0.3, total - duree))
        const file = `${piste.id}.mp3`
        // Fondus de 2 s aux deux bouts, puis normalisation en deux passes (cible −14 LUFS, crête −1 dBTP).
        encoderMp3Normalise(chemin, join(PUBLIC_AUDIO, file), -14, [`afade=t=in:d=2`, `afade=t=out:st=${Math.max(0, duree - 2)}:d=2`], ['-ss', String(depart), '-t', String(duree)])
        extraits[piste.id] = { src: `/experience/groove-to-grave/audio/${file}`, duration: dureeAudio(join(PUBLIC_AUDIO, file)), origine: 'label' }
        rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'label', detail: `${duLabel.file}, départ ${Math.round(depart)} s, ${Math.round(duree)} s` })
        continue
      }
    }
    const prov = provisoires.extraits.find((p) => p.track === piste.id)
    if (prov && existsSync(join(PUBLIC_AUDIO, prov.file))) {
      extraits[piste.id] = { src: `/experience/groove-to-grave/audio/${prov.file}`, duration: prov.duration, origine: 'provisoire', bpm: prov.bpm }
      rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'provisoire', detail: `boucle synthétique ${prov.bpm} BPM, ${prov.duration} s` })
    } else {
      rapport.push({ emplacement: 'extrait', id: piste.id, origine: 'absent', detail: 'pas de bouton écouter' })
    }
  }

  // ─── Écritures ───

  ecrireModule('medias.ts', 'ImageMedia', 'scripts/g2g-media.ts', 'medias', medias, 'Images traitées par identifiant (ref de sortie, date ISO de soirée, slug d\'artiste), servies depuis public/experience/groove-to-grave/img/.')
  ecrireModule('extraits.ts', 'Extrait', 'scripts/g2g-media.ts', 'extraits', extraits, 'Extraits audio par identifiant de piste, selon la priorité label / public / provisoire et les règles du §7 du brief.')

  const compte = (o: Ligne['origine']) => rapport.filter((l) => l.origine === o).length
  const md = [
    '# Médias — rapport de résolution',
    '',
    `Généré le ${AUJOURDHUI} par \`scripts/g2g-media.ts\`. Priorité par emplacement : fichier du label, sinon fichier public, sinon provisoire.`,
    '',
    `Label : ${compte('label')} · public : ${compte('public')} · provisoire : ${compte('provisoire')} · absent : ${compte('absent')} · refusé : ${compte('refusé')}`,
    '',
    '| Emplacement | Identifiant | Source retenue | Détail |',
    '|---|---|---|---|',
    ...rapport.map((l) => `| ${l.emplacement} | \`${l.id}\` | ${l.origine} | ${l.detail} |`),
    '',
  ].join('\n')
  writeFileSync(join(MEDIA, 'rapport.md'), md)
  process.stdout.write(`medias.ts (${Object.keys(medias).length}), extraits.ts (${Object.keys(extraits).length}), rapport.md écrits\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
