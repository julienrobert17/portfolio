/**
 * Audits Lighthouse de « Groove To Grave » sur un build de production local (`next build` puis
 * `next start`), lancés par `npx lighthouse` (rien n'est ajouté au dépôt), mobile simulé puis
 * desktop, strictement l'un après l'autre, trois passages par page et médiane retenue (le
 * passage de performance médiane ; son rapport HTML est gardé). Chrome headless sans
 * SwiftShader : le GPU de la machine rend le mur, comme un appareil réel.
 *
 *   npx tsx scripts/g2g-lighthouse.ts [--url http://localhost:3000] [--passages 3] [--pages accueil,sorties]
 *
 * Sort une table Markdown (scores, LCP, CLS, TBT) et un code de retour non nul si un critère
 * bloquant manque : 95 sur les quatre axes, LCP mobile < 2,5 s, CLS < 0,02, TBT < 150 ms.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CACHE, RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const PASSAGES = Number(arg('--passages', '3'))
const BASE = '/experience/groove-to-grave'
const VERSION = '13.5.0'
const PAGES_TOUTES: { nom: string; chemin: string }[] = [
  { nom: 'accueil', chemin: '' },
  { nom: 'sorties', chemin: '/sorties' },
  { nom: 'sortie-gtgr05', chemin: '/sorties/gtgr05' },
  { nom: 'soirees', chemin: '/soirees' },
]
const filtre = arg('--pages', '')
const PAGES = filtre ? PAGES_TOUTES.filter((p) => filtre.split(',').includes(p.nom)) : PAGES_TOUTES
const FORMATS = ['mobile', 'desktop'] as const
const AXES = ['performance', 'accessibility', 'best-practices', 'seo'] as const
const SORTIE = dossier(join(RACINE, 'docs/groove-to-grave/lighthouse/phase-6'))

interface Resultat {
  json: string
  scores: Record<string, number>
  lcp: number
  cls: number
  tbt: number
  fcp: number
  js: number
}

interface Rapport {
  categories: Record<string, { score: number }>
  audits: Record<string, { numericValue?: number; details?: { items?: { resourceType?: string; transferSize?: number }[] } }>
}

function lancer(url: string, format: (typeof FORMATS)[number], base: string): Resultat {
  const args = ['--yes', `lighthouse@${VERSION}`, url, '--output=json', '--output=html', `--output-path=${base}`, '--quiet', '--chrome-flags=--headless=new']
  if (format === 'desktop') args.push('--preset=desktop')
  execFileSync('npx', args, { stdio: ['ignore', 'ignore', 'inherit'], timeout: 300000 })
  const r = JSON.parse(readFileSync(`${base}.report.json`, 'utf8')) as Rapport
  const scores: Record<string, number> = {}
  for (const axe of AXES) scores[axe] = Math.round(r.categories[axe].score * 100)
  let js = 0
  for (const i of r.audits['network-requests'].details?.items ?? []) if (i.resourceType === 'Script') js += i.transferSize ?? 0
  return { json: `${base}.report.json`, scores, lcp: r.audits['largest-contentful-paint'].numericValue ?? 0, cls: r.audits['cumulative-layout-shift'].numericValue ?? 0, tbt: r.audits['total-blocking-time'].numericValue ?? 0, fcp: r.audits['first-contentful-paint'].numericValue ?? 0, js }
}

function main(): void {
  const brut = dossier(join(CACHE, 'lighthouse'))
  const lignes: string[] = []
  let echecs = 0
  for (const format of FORMATS) {
    for (const p of PAGES) {
      const passages: Resultat[] = []
      for (let k = 0; k < PASSAGES; k++) {
        const base = join(brut, `${p.nom}-${format}-${k}`)
        process.stderr.write(`  ${format} ${p.nom} passage ${k + 1}/${PASSAGES}\n`)
        passages.push(lancer(`${URL}${BASE}${p.chemin}`, format, base))
      }
      // Médiane par la performance (à égalité, le LCP le plus proche de la médiane).
      const tri = [...passages].sort((a, b) => a.scores.performance - b.scores.performance || a.lcp - b.lcp)
      const med = tri[Math.floor(tri.length / 2)]
      const html = med.json.replace(/\.report\.json$/, '.report.html')
      if (existsSync(html)) copyFileSync(html, join(SORTIE, `${p.nom}-${format}.html`))
      const ok = AXES.every((a) => med.scores[a] >= 95) && med.cls < 0.02 && med.tbt < 150 && (format === 'desktop' || med.lcp < 2500)
      if (!ok) echecs++
      const s = med.scores
      lignes.push(`| ${format} | ${p.nom} | ${s.performance} | ${s.accessibility} | ${s['best-practices']} | ${s.seo} | ${(med.lcp / 1000).toFixed(2).replace('.', ',')} s | ${med.cls.toFixed(3).replace('.', ',')} | ${Math.round(med.tbt)} ms | ${Math.round(med.js / 1024)} kB | ${ok ? 'ok' : 'KO'} (${passages.map((x) => x.scores.performance).join('/')}) |`)
      process.stderr.write(`${lignes[lignes.length - 1]}\n`)
    }
  }
  mkdirSync(SORTIE, { recursive: true })
  process.stdout.write('| Format | Page | Perf | Access. | Bonnes pratiques | SEO | LCP | CLS | TBT | JS | Médiane (3 perf) |\n|---|---|---|---|---|---|---|---|---|---|---|\n')
  process.stdout.write(lignes.join('\n') + '\n')
  if (echecs) {
    process.stderr.write(`${echecs} page(s) sous les critères bloquants\n`)
    process.exit(1)
  }
}

main()
