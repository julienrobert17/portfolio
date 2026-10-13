/**
 * Archive de fin de phase (bloc 7.4c) : rassemble le compte-rendu, les planches, les vidéos et les
 * rapports d'une phase dans `~/Desktop/g2g-phase-<N>.zip`, **toujours par copie dans un dossier
 * temporaire hors du dépôt** — rien n'est déplacé, rien n'est supprimé dans `docs/`. Les chemins
 * donnés sont relatifs à la racine du worktree, ou absolus pour les sorties de revue hors dépôt ;
 * ceux qui n'existent pas sont signalés et ignorés.
 *
 *   npx tsx scripts/g2g-archive-phase.ts --phase 7.8 docs/groove-to-grave/historique.md ~/Desktop/g2g-sorties/planches
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { RACINE, dossier } from './g2g-lib'

const ARGS = process.argv.slice(2)
const I = ARGS.indexOf('--phase')
const PHASE = I > -1 ? (ARGS[I + 1] ?? '') : ''
const CHEMINS = ARGS.filter((a, n) => n !== I && n !== I + 1 && !a.startsWith('--'))
const CIBLE = join(homedir(), 'Desktop', `g2g-phase-${PHASE.replace(/\./g, '-')}.zip`)

function main(): void {
  if (!PHASE) throw new Error('--phase manquant')
  if (!CHEMINS.length) throw new Error('aucun chemin à archiver')
  const temp = mkdtempSync(join(tmpdir(), 'g2g-archive-'))
  try {
    let fichiers = 0
    for (const chemin of CHEMINS) {
      // Les chemins du dépôt sont relatifs à sa racine ; les sorties de revue (planches, rapports)
      // vivent hors du dépôt depuis la Phase 7.8 et s'archivent par chemin absolu, à plat.
      const source = chemin.startsWith('/') ? chemin : resolve(RACINE, chemin)
      if (!existsSync(source)) {
        process.stdout.write(`  absent, ignoré : ${chemin}\n`)
        continue
      }
      const destination = join(temp, source.startsWith(RACINE) ? relative(RACINE, source) : basename(source))
      dossier(dirname(destination))
      // Copie seulement : l'original n'est jamais déplacé ni supprimé.
      cpSync(source, destination, { recursive: true })
      fichiers += statSync(source).isDirectory() ? Number(execFileSync('sh', ['-c', `find '${source}' -type f | wc -l`], { encoding: 'utf8' }).trim()) : 1
    }
    rmSync(CIBLE, { force: true })
    execFileSync('zip', ['-r', '-q', CIBLE, '.', '-x', '*.DS_Store'], { cwd: temp })
    const taille = Math.round(statSync(CIBLE).size / 1048576)
    process.stdout.write(`${CIBLE} · ${fichiers} fichiers · ${taille} Mo\n`)
    execFileSync('open', ['-R', CIBLE])
  } finally {
    // Le dossier temporaire est hors du dépôt : rien du dépôt ne peut être atteint par ce nettoyage.
    rmSync(temp, { recursive: true, force: true })
  }
}

main()
