/**
 * Polices auto-hébergées de « Groove To Grave » (bloc 6.1) : télécharge les fichiers latins de
 * Google Fonts (Archivo variable en largeur et graisse, Permanent Marker, VT323), dérive le jeu
 * de caractères du contenu et de l'interface, puis, avec fontTools (environnement Python hors
 * dépôt, `~/.cache/g2g-polices-venv`, fonttools + brotli), restreint Archivo aux plages d'axes
 * réellement utilisées (wdth 75 à 100, wght 400 à 900, `fontTools.varLib.instancer`) et
 * sous-ensemble les trois polices à ce jeu de caractères, chiffres tabulaires et crénage conservés.
 * Écrit les woff2 dans src/components/experience/groove-to-grave/polices/ (servis par
 * next/font/local) et polices/jeu.txt (le jeu de caractères, pour relecture).
 *
 *   npx tsx scripts/g2g-polices.ts
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CACHE, RACINE, dossier } from './g2g-lib'

const PYTHON = join(homedir(), '.cache/g2g-polices-venv/bin/python')
const SOURCES = dossier(join(CACHE, 'polices'))
const SORTIE = dossier(join(RACINE, 'src/components/experience/groove-to-grave/polices'))
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

/** Les trois familles, leur requête Google Fonts et leurs plages d'axes conservées (Archivo seulement). */
const POLICES = [
  { nom: 'archivo', requete: 'Archivo:wdth,wght@62..125,100..900', axes: { wdth: [75, 100], wght: [400, 900] } },
  { nom: 'permanent-marker', requete: 'Permanent+Marker', axes: null },
  { nom: 'vt323', requete: 'VT323', axes: null },
] as const

/** Dossiers dont les chaînes nourrissent le jeu de caractères : contenu typé et interface de l'expérience. */
const DOSSIERS_TEXTE = ['src/components/experience/groove-to-grave', 'src/app/experience/groove-to-grave']
/** Caractères garantis quoi qu'il en soit : ASCII imprimable, français, ponctuation typographique, ″ · Ö. */
const TOUJOURS = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), ...'àâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ', ...'’‘“”«»…–—•·″′€°¿¡  ']

function lire(dossierRelatif: string, acc: string[]): void {
  for (const nom of readdirSync(join(RACINE, dossierRelatif))) {
    const chemin = join(dossierRelatif, nom)
    if (statSync(join(RACINE, chemin)).isDirectory()) lire(chemin, acc)
    else if (/\.(ts|tsx|md)$/.test(nom)) acc.push(readFileSync(join(RACINE, chemin), 'utf8'))
  }
}

function jeuDeCaracteres(): string {
  const textes: string[] = []
  for (const d of DOSSIERS_TEXTE) lire(d, textes)
  const jeu = new Set<string>(TOUJOURS)
  // Chaînes littérales et texte JSX : tout caractère imprimable hors des tracés SVG et des hexadécimaux.
  for (const t of textes) for (const ch of t.replace(/d="[^"]*"/g, '').replace(/"d": "[^"]*"/g, '')) if (ch.codePointAt(0)! >= 32 && ch !== '\u007f') jeu.add(ch)
  return Array.from(jeu).sort().join('')
}

async function telecharger(nom: string, requete: string): Promise<string> {
  const chemin = join(SOURCES, `${nom}-latin.woff2`)
  if (existsSync(chemin)) return chemin
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${requete}&display=swap`, { headers: { 'User-Agent': UA } })).text()
  // Bloc « latin » (le dernier de chaque famille sur Google Fonts), son URL woff2.
  const blocs = css.split('/* ').filter((b) => b.startsWith('latin */'))
  const url = blocs[0]?.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
  if (!url) throw new Error(`${nom} : URL latin introuvable dans le CSS de Google Fonts`)
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(chemin, buf)
  return chemin
}

const SCRIPT_PYTHON = `
import json, sys
from io import BytesIO
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

source, cible, axes, jeu = sys.argv[1], sys.argv[2], json.loads(sys.argv[3]), open(sys.argv[4], encoding='utf-8').read()
font = TTFont(source)
if axes:
    # Plages réellement utilisées : la police reste variable à l'intérieur, le reste des deltas disparaît.
    font = instancer.instantiateVariableFont(font, {k: tuple(v) for k, v in axes.items()}, inplace=False, updateFontNames=False)
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.notdef_outline = True
opts.hinting = False
opts.desubroutinize = True
sub = subset.Subsetter(opts)
sub.populate(text=jeu)
sub.subset(font)
font.flavor = 'woff2'
font.save(cible)
print(json.dumps({'glyphes': len(font.getGlyphOrder()), 'axes': [a.axisTag + ' ' + str(a.minValue) + '..' + str(a.maxValue) for a in font['fvar'].axes] if 'fvar' in font else []}))
`

async function main(): Promise<void> {
  if (!existsSync(PYTHON)) throw new Error(`Python du venv absent : ${PYTHON} (python3 -m venv ~/.cache/g2g-polices-venv && pip install fonttools brotli)`)
  const jeu = jeuDeCaracteres()
  writeFileSync(join(SORTIE, 'jeu.txt'), jeu + '\n')
  const script = join(SOURCES, 'sousensemble.py')
  writeFileSync(script, SCRIPT_PYTHON)
  process.stdout.write(`jeu de caractères : ${jeu.length} caractères\n`)
  for (const p of POLICES) {
    const source = await telecharger(p.nom, p.requete)
    const cible = join(SORTIE, `${p.nom}.woff2`)
    const resultat = execFileSync(PYTHON, ['-I', script, source, cible, JSON.stringify(p.axes), join(SORTIE, 'jeu.txt')], { encoding: 'utf8' }).trim()
    const avant = statSync(source).size
    const apres = statSync(cible).size
    process.stdout.write(`${p.nom} : ${Math.round(avant / 1024)} kB → ${Math.round(apres / 1024)} kB · ${resultat}\n`)
  }
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
