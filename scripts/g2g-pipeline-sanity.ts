/**
 * Pipeline médias de « Groove To Grave » depuis Sanity (Phase 7.4). Pour chaque document publié
 * dont un fichier d'origine a changé depuis le dernier traitement (empreinte = référence de
 * l'asset), le pipeline applique les règles du brief (§6 et §7) et écrit les champs en lecture
 * seule des documents :
 *   - pochettes, flyers, portraits : AVIF et WebP sans recadrage pour chaque largeur de 320 à
 *     1600 px, chaque fichier sous 300 kB (`deriverImage`), téléversés comme fichiers Sanity ;
 *     pour une pochette, les couleurs de cassette extraites et les contrastes vérifiés ;
 *   - extraits bruts des pistes : refus si la sortie n'est pas parue, sinon 60 s à partir de
 *     30 % du morceau, fondus de 2 s, MP3 192 kbps à −14 LUFS (`encoderMp3Normalise`), sonie
 *     mesurée, durée, BPM estimé ;
 *   - état du traitement (en cours, prêt, refusé avec raison, date, empreinte) sur le document
 *     ou la piste. Les anciens fichiers dérivés sont supprimés.
 * Les boucles synthétiques provisoires (pistes sans fichier du label, marquées « extrait
 * provisoire ») ont été posées une fois le 12 octobre 2026 ; un fichier déposé les remplace.
 * `--tout` retraite tout. `--sec` ne modifie rien.
 * Jeton d'écriture (rôle editor) : SANITY_PIPELINE_TOKEN (variable d'environnement, Action
 * GitHub ou .env.local), sinon la session de la CLI Sanity en local. Jamais dans le dépôt.
 * ffmpeg et ffprobe doivent être installés (runner GitHub : présents).
 *
 *   npx tsx scripts/g2g-pipeline-sanity.ts [--tout] [--sec] [--rapport fichier.md]
 */
import { createClient, type SanityClient } from '@sanity/client'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CACHE, RACINE, deriverImage, dossier, dureeAudio, encoderMp3Normalise, estimerBpm, extraireCouleurs, ffmpegDisponible, sonie } from './g2g-lib'

const TOUT = process.argv.includes('--tout')
const SEC = process.argv.includes('--sec')
const arg = (nom: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined
}
const RAPPORT = arg('--rapport')
const AUJOURDHUI = new Date().toISOString().slice(0, 10)
const DUREE_EXTRAIT = 60
const CIBLE_LUFS = -14

function env(nom: string): string | undefined {
  if (process.env[nom]) return process.env[nom]
  const fichier = join(RACINE, '.env.local')
  if (!existsSync(fichier)) return undefined
  const ligne = readFileSync(fichier, 'utf8').split('\n').find((l) => l.startsWith(`${nom}=`))
  return ligne?.slice(nom.length + 1).trim()
}

function jeton(): string {
  const direct = env('SANITY_PIPELINE_TOKEN')
  if (direct) return direct
  const session = join(homedir(), '.config/sanity/config.json')
  if (existsSync(session)) {
    const t = (JSON.parse(readFileSync(session, 'utf8')) as { authToken?: string }).authToken
    if (t) return t
  }
  throw new Error('Aucun jeton : SANITY_PIPELINE_TOKEN absent et pas de session CLI Sanity')
}

interface Asset {
  _id: string
  url: string
  extension: string
  originalFilename?: string
}

interface Traitement {
  etat?: string
  empreinte?: string
}

interface Taille {
  _key: string
  largeur: number
  hauteur: number
  avif: { _type: 'file'; asset: { _type: 'reference'; _ref: string } }
  webp: { _type: 'file'; asset: { _type: 'reference'; _ref: string } }
}

interface Derives {
  largeur?: number
  hauteur?: number
  avif?: { asset?: { _ref: string } }
  webp?: { asset?: { _ref: string } }
  tailles?: { avif?: { asset?: { _ref: string } }; webp?: { asset?: { _ref: string } } }[]
}

interface DocImage {
  _id: string
  _type: 'sortie' | 'soiree' | 'artiste'
  cle: string
  dateSortie?: string
  image: Asset | null
  derives: Derives | null
  traitement: Traitement | null
}

interface PisteBrute {
  _key: string
  position: string
  extraitBrut: Asset | null
  extraitTraite: { asset?: { _ref: string } } | null
  traitement: Traitement | null
  extraitProvisoire: boolean | null
}

interface DocAudio {
  _id: string
  ref: string
  catalogue: string
  dateSortie: string
  pistes: PisteBrute[]
}

const CHAMPS: Record<DocImage['_type'], { source: string; derives: string; cle: string }> = {
  sortie: { source: 'pochette', derives: 'pochetteOptimisee', cle: 'slug.current' },
  soiree: { source: 'flyer', derives: 'flyerOptimise', cle: 'date' },
  artiste: { source: 'portrait', derives: 'portraitOptimise', cle: 'slug.current' },
}

const lignes: string[] = []
function noter(type: string, id: string, action: string, detail = ''): void {
  lignes.push(`| ${type} | ${id} | ${action} | ${detail} |`)
  process.stdout.write(`  ${type} ${id} : ${action}${detail ? ` · ${detail}` : ''}\n`)
}

const ko = (n: number) => `${Math.round(n / 1024)} kB`

async function telecharger(url: string): Promise<Buffer> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} : ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

const refFichier = (id: string) => ({ _type: 'file' as const, asset: { _type: 'reference' as const, _ref: id } })

/** Applique un patch au document publié et, s'il existe, à son brouillon (pour que la publication suivante garde les champs dérivés). */
async function patcher(client: SanityClient, id: string, set: Record<string, unknown>, unset: string[] = []): Promise<void> {
  if (SEC) return
  const brouillon = `drafts.${id}`
  const existe = await client.fetch<string[]>('*[_id in $ids]._id', { ids: [id, brouillon] })
  for (const cible of existe) {
    let p = client.patch(cible).set(set)
    if (unset.length) p = p.unset(unset)
    await p.commit({ autoGenerateArrayKeys: true })
  }
}

async function supprimerAssets(client: SanityClient, ids: (string | undefined)[]): Promise<void> {
  if (SEC) return
  for (const id of ids) {
    if (!id) continue
    try {
      await client.delete(id)
    } catch {
      // Déjà supprimé ou encore référencé ailleurs : sans conséquence.
    }
  }
}

async function traiterImages(client: SanityClient): Promise<void> {
  const docs = await client.fetch<DocImage[]>(`*[_type in ["sortie", "soiree", "artiste"] && !(_id in path("drafts.**"))] {
    _id, _type,
    "cle": coalesce(slug.current, date),
    dateSortie,
    "image": coalesce(pochette.asset->, flyer.asset->, portrait.asset->) { _id, url, extension, originalFilename },
    "derives": coalesce(pochetteOptimisee, flyerOptimise, portraitOptimise) { largeur, hauteur, avif { asset { _ref } }, webp { asset { _ref } }, tailles[] { avif { asset { _ref } }, webp { asset { _ref } } } },
    traitement { etat, empreinte }
  }`)
  for (const d of docs) {
    const champs = CHAMPS[d._type]
    if (!d.image) continue
    const empreinte = `image:${d.image._id}`
    if (!TOUT && d.traitement?.etat === 'pret' && d.traitement.empreinte === empreinte) continue
    const t0 = Date.now()
    try {
      await patcher(client, d._id, { traitement: { etat: 'en-cours', empreinte: d.traitement?.empreinte ?? null } })
      const source = await telecharger(d.image.url)
      const derive = await deriverImage(source, d.cle)
      const tailles: Taille[] = []
      let poids = 0
      for (const t of derive.tailles) {
        const base = `${d.cle}-${t.largeur}`
        const [avif, webp] = SEC
          ? [{ _id: 'sec' }, { _id: 'sec' }]
          : await Promise.all([
              client.assets.upload('file', t.avif, { filename: `${base}.avif`, contentType: 'image/avif' }),
              client.assets.upload('file', t.webp, { filename: `${base}.webp`, contentType: 'image/webp' }),
            ])
        poids += t.avif.length + t.webp.length
        tailles.push({ _key: `t${t.largeur}`, largeur: t.largeur, hauteur: t.hauteur, avif: refFichier(avif._id), webp: refFichier(webp._id) })
      }
      const grande = tailles[tailles.length - 1]
      const set: Record<string, unknown> = {
        [champs.derives]: { largeur: derive.width, hauteur: derive.height, avif: grande.avif, webp: grande.webp, tailles },
        traitement: { etat: 'pret', misAJour: new Date().toISOString(), empreinte },
      }
      let detailCouleurs = ''
      if (d._type === 'sortie') {
        const c = await extraireCouleurs(source)
        set.couleurs = {
          dominante: c.dominant,
          accent: c.accent,
          contrasteInkDominante: c.contrasteInk.dominant,
          contrasteInkAccent: c.contrasteInk.accent,
          contrastePosterDominante: c.contrastePoster.dominant,
          contrastePosterAccent: c.contrastePoster.accent,
        }
        detailCouleurs = ` · ${c.dominant} / ${c.accent} (ink ${c.contrasteInk.dominant}:1, ${c.contrasteInk.accent}:1)`
      }
      await patcher(client, d._id, set, ['traitement.raison'])
      const anciens = [d.derives?.avif?.asset?._ref, d.derives?.webp?.asset?._ref, ...(d.derives?.tailles ?? []).flatMap((t) => [t.avif?.asset?._ref, t.webp?.asset?._ref])]
      await supprimerAssets(client, anciens.filter((a) => !tailles.some((t) => t.avif.asset._ref === a || t.webp.asset._ref === a)))
      noter(d._type, d.cle, 'prêt', `${d.image.originalFilename ?? d.image.extension} → ${tailles.length} largeurs (${tailles.map((t) => t.largeur).join(', ')}), ${ko(poids)} en tout${detailCouleurs}, ${((Date.now() - t0) / 1000).toFixed(1)} s`)
    } catch (e) {
      const raison = e instanceof Error ? e.message : String(e)
      await patcher(client, d._id, { traitement: { etat: 'refuse', raison, misAJour: new Date().toISOString(), empreinte } })
      noter(d._type, d.cle, 'refusé', raison)
    }
  }
}

async function traiterAudio(client: SanityClient): Promise<void> {
  const docs = await client.fetch<DocAudio[]>(`*[_type == "sortie" && !(_id in path("drafts.**"))] {
    _id, "ref": slug.current, catalogue, dateSortie,
    pistes[] { _key, position, "extraitBrut": extraitBrut.asset-> { _id, url, extension, originalFilename }, extraitTraite { asset { _ref } }, traitement { etat, empreinte }, extraitProvisoire }
  }`)
  const temp = dossier(join(CACHE, 'pipeline'))
  for (const s of docs) {
    for (const p of s.pistes ?? []) {
      if (!p.extraitBrut) continue
      const id = `${s.ref}-${p.position.toLowerCase()}`
      const chemin = `pistes[_key=="${p._key}"]`
      const empreinte = `audio:${p.extraitBrut._id}`
      if (!TOUT && p.traitement?.etat === 'pret' && p.traitement.empreinte === empreinte) continue
      if (!TOUT && p.traitement?.etat === 'refuse' && p.traitement.empreinte === empreinte && s.dateSortie > AUJOURDHUI) continue
      const t0 = Date.now()
      try {
        if (s.dateSortie > AUJOURDHUI) throw new Error(`sortie ${s.catalogue} datée du ${s.dateSortie}, pas encore parue : extrait refusé jusqu'à cette date`)
        await patcher(client, s._id, { [`${chemin}.traitement`]: { etat: 'en-cours', empreinte: p.traitement?.empreinte ?? null } })
        const brut = join(temp, `${id}-brut.${p.extraitBrut.extension}`)
        writeFileSync(brut, await telecharger(p.extraitBrut.url))
        const total = dureeAudio(brut)
        const duree = Math.min(DUREE_EXTRAIT, total)
        const depart = Math.max(0, Math.min(total * 0.3, total - duree))
        const mp3 = join(temp, `${id}.mp3`)
        encoderMp3Normalise(brut, mp3, CIBLE_LUFS, ['afade=t=in:d=2', `afade=t=out:st=${Math.max(0, duree - 2)}:d=2`], ['-ss', depart.toFixed(2), '-t', duree.toFixed(2)])
        const mesure = sonie(mp3)
        const dureeFinale = dureeAudio(mp3)
        const bpm = estimerBpm(mp3)
        const fichier = readFileSync(mp3)
        const asset = SEC ? { _id: 'sec' } : await client.assets.upload('file', fichier, { filename: `${id}.mp3`, contentType: 'audio/mpeg' })
        await patcher(
          client,
          s._id,
          {
            [`${chemin}.extraitTraite`]: refFichier(asset._id),
            [`${chemin}.extraitDuree`]: dureeFinale,
            [`${chemin}.sonie`]: Math.round(mesure.lufs * 10) / 10,
            [`${chemin}.bpm`]: bpm,
            [`${chemin}.extraitProvisoire`]: false,
            [`${chemin}.traitement`]: { etat: 'pret', misAJour: new Date().toISOString(), empreinte },
          },
          [`${chemin}.traitement.raison`],
        )
        const ancien = p.extraitTraite?.asset?._ref
        if (ancien && ancien !== asset._id) await supprimerAssets(client, [ancien])
        noter('piste', id, 'prêt', `${p.extraitBrut.originalFilename ?? p.extraitBrut.extension} (${total.toFixed(0)} s) → ${dureeFinale} s dès ${depart.toFixed(0)} s, ${mesure.lufs.toFixed(1)} LUFS, crête ${mesure.crete.toFixed(1)} dBTP, ${bpm} BPM estimés, ${ko(fichier.length)}, ${((Date.now() - t0) / 1000).toFixed(1)} s`)
      } catch (e) {
        const raison = e instanceof Error ? e.message : String(e)
        await patcher(client, s._id, { [`${chemin}.traitement`]: { etat: 'refuse', raison, misAJour: new Date().toISOString(), empreinte } })
        noter('piste', id, 'refusé', raison)
      }
    }
  }
}

async function main(): Promise<void> {
  if (!ffmpegDisponible()) throw new Error('ffmpeg introuvable')
  const client = createClient({ projectId: env('SANITY_PROJECT_ID') ?? 'da2plce8', dataset: env('SANITY_DATASET') ?? 'production', apiVersion: '2025-01-01', useCdn: false, token: jeton(), perspective: 'raw' })
  process.stdout.write(`Pipeline médias Sanity${SEC ? ' (à sec)' : ''}${TOUT ? ', tout retraiter' : ''}\n`)
  await traiterImages(client)
  await traiterAudio(client)
  const rapport = ['| Type | Identifiant | Action | Détail |', '|---|---|---|---|', ...lignes]
  if (RAPPORT) writeFileSync(RAPPORT, `${rapport.join('\n')}\n`)
  process.stdout.write(lignes.length ? `${lignes.length} traitement(s)\n` : 'rien à traiter\n')
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
