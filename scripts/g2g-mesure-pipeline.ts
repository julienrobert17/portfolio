/**
 * Bloc 7.4b, preuve de bout en bout du pipeline médias : dépose un fichier audio d'origine sur une
 * piste publiée (ce que fait le label en déposant un fichier dans le Studio et en publiant), puis
 * mesure chaque étape jusqu'à ce que la production serve l'extrait traité :
 *   1. dépôt du fichier et patch du document      → t0
 *   2. webhook Sanity « fichier d'origine changé » → route /api/g2g/medias (journal des tentatives)
 *   3. repository_dispatch → Action GitHub (file d'attente, installation, pipeline)
 *   4. le pipeline patche le document → webhook de publication → revalidation
 *   5. la page de production affiche le nouvel extrait → t_final
 * Sans jeton GitHub dans les variables Vercel, la route répond 503 : `--relais-local` envoie
 * alors le `repository_dispatch` depuis cette machine (jeton du trousseau git), ce que la route
 * fera elle-même une fois le jeton posé ; l'étape 3 est mesurée à l'identique.
 * Remet tout en état à la fin (champs vidés, fichiers supprimés), sauf avec `--garder`.
 *
 *   npx tsx scripts/g2g-mesure-pipeline.ts [--url https://…] [--piste gtgr01-b1] [--ref main] [--relais-local] [--garder]
 */
import { createClient } from '@sanity/client'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CACHE, dossier, ffmpeg } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL_SITE = arg('--url', 'https://portfolio-eight-sable-66.vercel.app').replace(/\/$/, '')
const PISTE = arg('--piste', 'gtgr01-b1')
const REF = arg('--ref', 'main')
const RELAIS_LOCAL = process.argv.includes('--relais-local')
const GARDER = process.argv.includes('--garder')
const DEPOT = 'julienrobert17/portfolio'
const PROJET = 'da2plce8'
const HOOK_MEDIAS = 'BqaNGJpVk9d5YZyz'
const BPM_TEST = 126

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jetonSanity = () => (JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8')) as { authToken: string }).authToken
const jetonGithub = () =>
  execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' })
    .split('\n')
    .find((l) => l.startsWith('password='))!
    .slice('password='.length)

const secondes = (a: number, b: number) => `${((b - a) / 1000).toFixed(1)} s`

async function jsonSanity<T>(chemin: string): Promise<T> {
  const r = await fetch(`https://api.sanity.io/v2021-10-04/${chemin}`, { headers: { Authorization: `Bearer ${jetonSanity()}` } })
  return (await r.json()) as T
}

/** Morceau de synthèse de 3 minutes à 126 BPM : aucun droit en jeu, mais un vrai fichier à traiter. */
function fichierTest(): string {
  const chemin = join(dossier(join(CACHE, 'pipeline')), 'mesure-brut.wav')
  if (!existsSync(chemin)) {
    const periode = (60 / BPM_TEST).toFixed(6)
    ffmpeg(['-f', 'lavfi', '-i', `aevalsrc=0.9*sin(2*PI*55*t)*exp(-28*mod(t\\,${periode}))+0.12*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.1*t))+0.05*random(0):s=44100:d=180`, '-ac', '2', '-ar', '44100', '-af', 'volume=-6dB', chemin])
  }
  return chemin
}

/** URL des extraits traités présents sur la page, pour repérer l'apparition du nouveau. */
async function extraitsDeLaPage(url: string): Promise<Set<string>> {
  const html = await (await fetch(url, { cache: 'no-store' })).text()
  return new Set(html.match(/https:\/\/cdn\.sanity\.io\/files\/[^"\\ ]+\.mp3/g) ?? [])
}

async function main(): Promise<void> {
  const client = createClient({ projectId: PROJET, dataset: 'production', apiVersion: '2025-01-01', token: jetonSanity(), useCdn: false, perspective: 'raw' })
  const ref = PISTE.split('-')[0]
  const position = PISTE.slice(ref.length + 1)
  const doc = await client.fetch<{ _id: string; pistes: { _key: string; position: string }[] }>(`*[_id=="sortie-${ref}"][0]{_id, pistes[]{_key, position}}`)
  const piste = doc?.pistes?.find((p) => p.position.toLowerCase() === position)
  if (!piste) throw new Error(`piste ${PISTE} introuvable`)
  const chemin = `pistes[_key=="${piste._key}"]`
  const page = `${URL_SITE}/experience/groove-to-grave/sorties/${ref}`
  const avant = await extraitsDeLaPage(page)
  const tentativesAvant = (await jsonSanity<unknown[]>(`hooks/projects/${PROJET}/${HOOK_MEDIAS}/attempts`)).length
  const github = jetonGithub()
  const runsAvant = (await (await fetch(`https://api.github.com/repos/${DEPOT}/actions/workflows/g2g-pipeline-medias.yml/runs?per_page=1`, { headers: { Authorization: `Bearer ${github}` } })).json()) as { workflow_runs: { id: number }[] }
  const dernierRun = runsAvant.workflow_runs[0]?.id ?? 0

  process.stdout.write(`Dépôt du fichier d'origine sur ${PISTE} (${page})\n`)
  const asset = await client.assets.upload('file', readFileSync(fichierTest()), { filename: 'mesure-pipeline.wav', contentType: 'audio/wav' })
  const t0 = Date.now()
  await client.patch(doc._id).set({ [`${chemin}.extraitBrut`]: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } } }).unset([`${chemin}.traitement.empreinte`]).commit()
  process.stdout.write(`t0 ${new Date(t0).toISOString()} : fichier déposé et document publié\n`)

  // 2. Webhook Sanity → route du site.
  let tWebhook = 0
  let codeWebhook = ''
  while (Date.now() - t0 < 120000) {
    const tentatives = await jsonSanity<{ createdAt?: string; resultCode?: number; failureCount?: number }[]>(`hooks/projects/${PROJET}/${HOOK_MEDIAS}/attempts`)
    if (tentatives.length > tentativesAvant) {
      const t = tentatives[0]
      tWebhook = t.createdAt ? Date.parse(t.createdAt) : Date.now()
      codeWebhook = String(t.resultCode ?? '?')
      break
    }
    await attendre(2000)
  }
  process.stdout.write(tWebhook ? `  webhook médias appelé après ${secondes(t0, tWebhook)} (réponse ${codeWebhook})\n` : '  webhook médias : aucune tentative vue en 120 s\n')

  // 3. repository_dispatch (la route le fait en production dès que G2G_GITHUB_TOKEN est posé).
  let tDispatch = Date.now()
  if (RELAIS_LOCAL) {
    // `repository_dispatch` lance toujours le workflow de la branche par défaut : pour mesurer une
    // version encore sur une branche, on passe par `workflow_dispatch` avec sa référence.
    const relais =
      REF === 'main'
        ? { url: `https://api.github.com/repos/${DEPOT}/dispatches`, corps: { event_type: 'g2g-medias', client_payload: { mesure: true } } }
        : { url: `https://api.github.com/repos/${DEPOT}/actions/workflows/g2g-pipeline-medias.yml/dispatches`, corps: { ref: REF } }
    await fetch(relais.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${github}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(relais.corps),
    })
    tDispatch = Date.now()
    process.stdout.write(`  relais local : repository_dispatch envoyé après ${secondes(t0, tDispatch)}\n`)
  }

  // 4. Action GitHub.
  let run: { id: number; created_at: string; updated_at: string; status: string; conclusion: string | null } | undefined
  while (Date.now() - t0 < 900000) {
    const d = (await (await fetch(`https://api.github.com/repos/${DEPOT}/actions/workflows/g2g-pipeline-medias.yml/runs?per_page=3`, { headers: { Authorization: `Bearer ${github}` } })).json()) as {
      workflow_runs: { id: number; created_at: string; updated_at: string; status: string; conclusion: string | null }[]
    }
    const nouveau = d.workflow_runs.find((r) => r.id !== dernierRun)
    if (nouveau) {
      run = nouveau
      if (nouveau.status === 'completed') break
    }
    await attendre(5000)
  }
  if (run) process.stdout.write(`  Action ${run.id} : lancée à ${run.created_at}, terminée à ${run.updated_at} (${run.conclusion}), soit ${secondes(Date.parse(run.created_at), Date.parse(run.updated_at))} de bout en bout\n`)

  // 5. La production sert le nouvel extrait.
  let tSite = 0
  let requetes = 0
  while (Date.now() - t0 < 900000) {
    requetes++
    const maintenant = await extraitsDeLaPage(page)
    const nouveau = [...maintenant].find((u) => !avant.has(u))
    if (nouveau) {
      tSite = Date.now()
      process.stdout.write(`  nouvel extrait servi : ${nouveau}\n`)
      break
    }
    await attendre(2000)
  }

  process.stdout.write('\n| Étape | Délai depuis le dépôt |\n|---|---|\n')
  if (tWebhook) process.stdout.write(`| Webhook Sanity reçu par le site | ${secondes(t0, tWebhook)} |\n`)
  if (RELAIS_LOCAL) process.stdout.write(`| repository_dispatch envoyé | ${secondes(t0, tDispatch)} |\n`)
  if (run) process.stdout.write(`| Action terminée | ${secondes(t0, Date.parse(run.updated_at))} |\n`)
  process.stdout.write(tSite ? `| **Extrait visible en production** | **${secondes(t0, tSite)}** (${requetes} requêtes) |\n` : '| Extrait visible en production | NON vu en 15 min |\n')

  if (!GARDER) {
    const apres = await client.fetch<{ extraitTraite?: { asset?: { _ref: string } } }>(`*[_id=="${doc._id}"][0].pistes[_key=="${piste._key}"]{extraitTraite{asset{_ref}}}`)
    await client
      .patch(doc._id)
      .unset([`${chemin}.extraitBrut`, `${chemin}.extraitTraite`, `${chemin}.extraitDuree`, `${chemin}.sonie`, `${chemin}.bpm`, `${chemin}.extraitProvisoire`, `${chemin}.traitement`])
      .commit()
    for (const id of [asset._id, apres?.extraitTraite?.asset?._ref]) if (id) await client.delete(id).catch(() => undefined)
    process.stdout.write('\nPiste remise en état (champs vidés, fichiers supprimés).\n')
  }
  if (!tSite) process.exit(1)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
