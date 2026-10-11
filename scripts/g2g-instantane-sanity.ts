/**
 * Phase 7.3 : instantané du contenu Sanity (résultats bruts des cinq requêtes du site), commité
 * dans src/components/experience/groove-to-grave/sanity/instantane.json. Le chargeur le sert
 * quand Sanity est injoignable ou le jeton absent (build compris) : les pages montrent la
 * dernière version connue. À relancer après un changement de contenu que l'on veut garder en
 * repli (par exemple avant une mise en production). Jeton lu dans .env.local (SANITY_LECTURE_TOKEN).
 *
 *   npx tsx scripts/g2g-instantane-sanity.ts
 */
import { createClient } from '@sanity/client'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REQUETE_ARTISTES, REQUETE_REGLAGES, REQUETE_SOIREES, REQUETE_SORTIES, REQUETE_TEXTES } from '../src/components/experience/groove-to-grave/sanity/requetes'
import { RACINE } from './g2g-lib'

const CIBLE = join(RACINE, 'src/components/experience/groove-to-grave/sanity/instantane.json')

function env(nom: string): string | undefined {
  if (process.env[nom]) return process.env[nom]
  const fichier = join(RACINE, '.env.local')
  if (!existsSync(fichier)) return undefined
  const ligne = readFileSync(fichier, 'utf8').split('\n').find((l) => l.startsWith(`${nom}=`))
  return ligne?.slice(nom.length + 1).trim()
}

async function main(): Promise<void> {
  const token = env('SANITY_LECTURE_TOKEN')
  if (!token) throw new Error('SANITY_LECTURE_TOKEN absent (.env.local)')
  const client = createClient({ projectId: env('SANITY_PROJECT_ID') ?? 'da2plce8', dataset: env('SANITY_DATASET') ?? 'production', apiVersion: '2025-01-01', useCdn: false, token, perspective: 'published' })
  const [sorties, artistes, soirees, textes, reglages] = await Promise.all([client.fetch(REQUETE_SORTIES), client.fetch(REQUETE_ARTISTES), client.fetch(REQUETE_SOIREES), client.fetch(REQUETE_TEXTES), client.fetch(REQUETE_REGLAGES)])
  const instantane = { priseLe: new Date().toISOString(), sorties, artistes, soirees, textes, reglages }
  writeFileSync(CIBLE, JSON.stringify(instantane, null, 2) + '\n')
  process.stdout.write(`${CIBLE.replace(RACINE + '/', '')} : ${sorties.length} sorties, ${artistes.length} artistes, ${soirees.length} soirées, textes ${textes ? 'ok' : 'absents'}, réglages ${reglages ? 'ok' : 'absents'}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`)
  process.exit(1)
})
