/**
 * Mesures de niveau du lecteur, sur captures réelles du moteur dans Chrome (protocole DevTools,
 * MediaRecorder sur le flux de la sortie générale), analysées par ffmpeg ebur128. Objectifs du
 * bloc 3.1 : −16 LUFS intégrés ±1 sur TOUT au volume par défaut, moins de 1 LU d'écart entre
 * presets, crête vraie sous −1 dBTP ; clac 10 dB sous la musique, avance rapide 12 dB sous,
 * souffle presque inaudible. Écrit un tableau Markdown dans le cache et sur la sortie standard.
 *
 *   npx tsx scripts/g2g-mesures-audio.ts [--url http://localhost:3000]
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Devtools } from './g2g-devtools'
import { CACHE, dossier, sonie } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const PAGE = '/experience/groove-to-grave/sorties'
const PRESETS = ['tout', 'house', 'break', 'minimal', 'electro']

/** Sonie « momentanée » maximale (fenêtre de 400 ms) d'un fichier, pour les sons courts. */
function momentaneeMax(chemin: string): number {
  const brut = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i '${chemin}' -af ebur128 -f null - 2>&1 | grep -o 'M: *-\\?[0-9.]*' | sed 's/M: *//'`], { encoding: 'utf8' })
  return Math.max(...brut.split('\n').filter(Boolean).map(Number).filter((n) => Number.isFinite(n)))
}

async function main(): Promise<void> {
  const dos = dossier(join(CACHE, 'mesures'))
  const nav = new Devtools()
  await nav.demarrer()
  const { s } = await nav.page(`${URL}${PAGE}`, 1440, 900, 1)
  const ecrire = (nom: string, b64: string | null) => {
    if (!b64) throw new Error(`${nom} : pas de flux audio`)
    const f = join(dos, `${nom}.webm`)
    writeFileSync(f, Buffer.from(b64, 'base64'))
    return f
  }
  const lignes: string[] = ['| Mesure | Sonie | Crête vraie | Note |', '|---|---|---|---|']
  // Lecture au volume par défaut : pour chaque preset, l'extrait est relancé du début (stop puis écouter), 12 s mesurées après le démarrage.
  const parPreset: Record<string, { lufs: number; crete: number }> = {}
  for (const p of PRESETS) {
    await nav.cliquer(s, '[data-g2g="ecouter"]')
    await new Promise((r) => setTimeout(r, 300))
    await nav.cliquer(s, `[data-g2g="preset-${p}"]`)
    await nav.cliquer(s, '[data-g2g="stop"]')
    await nav.cliquer(s, '[data-g2g="ecouter"]')
    await new Promise((r) => setTimeout(r, 1500))
    const f = ecrire(`preset-${p}`, await nav.enregistrerSon(s, 12000))
    await nav.cliquer(s, '[data-g2g="stop"]')
    const m = sonie(f)
    parPreset[p] = m
    lignes.push(`| Lecture, preset ${p.toUpperCase()} | ${m.lufs.toFixed(1)} LUFS | ${m.crete.toFixed(1)} dBTP | 12 s, volume par défaut |`)
  }
  const sonies = PRESETS.map((p) => parPreset[p].lufs)
  const ecart = Math.max(...sonies) - Math.min(...sonies)
  lignes.push(`| Écart entre presets | ${ecart.toFixed(1)} LU | | objectif < 1 LU |`)
  // Sons d'interface seuls : musique coupée par le gain de normalisation, preset TOUT, lecture en cours pour que le souffle tourne.
  await nav.cliquer(s, '[data-g2g="preset-tout"]')
  await nav.cliquer(s, '[data-g2g="ecouter"]')
  await nav.evaluer(s, `window.__g2g.mesure('musique', false), 0`)
  await new Promise((r) => setTimeout(r, 400))
  const mesurerSeul = async (nom: string, quoi: string, ms: number) => {
    const promesse = nav.enregistrerSon(s, ms)
    await new Promise((r) => setTimeout(r, 300))
    await nav.evaluer(s, `window.__g2g.mesure('${quoi}'), 0`)
    const f = ecrire(nom, await promesse)
    return f
  }
  const clac = momentaneeMax(await mesurerSeul('clac', 'clac', 1500))
  const avance = momentaneeMax(await mesurerSeul('avance', 'avance', 2000))
  const musiqueM = momentaneeMax(join(dos, 'preset-tout.webm'))
  lignes.push(`| Clac seul (momentané max) | ${clac.toFixed(1)} LUFS | | ${(musiqueM - clac).toFixed(1)} dB sous la musique (${musiqueM.toFixed(1)} LUFS momentané), objectif 10 |`)
  lignes.push(`| Avance rapide seule (momentané max) | ${avance.toFixed(1)} LUFS | | ${(musiqueM - avance).toFixed(1)} dB sous la musique, objectif 12 |`)
  // Souffle seul : musique coupée, souffle forcé.
  await nav.evaluer(s, `window.__g2g.mesure('souffle', true), 0`)
  await new Promise((r) => setTimeout(r, 300))
  const souffle = sonie(ecrire('souffle', await nav.enregistrerSon(s, 3000)))
  lignes.push(`| Souffle seul | ${souffle.lufs.toFixed(1)} LUFS | ${souffle.crete.toFixed(1)} dBTP | ${(parPreset.tout.lufs - souffle.lufs).toFixed(1)} dB sous la musique |`)
  nav.fermer()
  const md = lignes.join('\n') + '\n'
  writeFileSync(join(dos, 'mesures.md'), md)
  process.stdout.write(md)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
