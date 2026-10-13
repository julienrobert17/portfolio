/**
 * Vérifie chaque paire texte/fond de tokens.ts : 7:1 pour ink sur le mur WebGL (wall, lambeaux,
 * grain le plus sombre du papier), 4,5:1 pour le texte courant, 3:1 pour le texte de 24 px et
 * plus et les éléments d'interface, 4,6:1 pour redInk sur wall. Les lambeaux ne mêlent jamais
 * plus de 35 % de red ou de green au wall.
 * Puis les dix-neuf affiches d'artistes réellement en service (Phase 7.7) : le papier de chaque
 * affiche prend la dominante relevée sur la pochette, et doit porter l'encre au même seuil que le
 * texte sur papier (4,5:1). Si une dominante n'y arrive pas, le site prend la couleur de palette
 * la plus proche qui tient, et le test le dit en clair.
 *   npm run test:g2g-tokens
 */
import { readFileSync } from 'node:fs'
import { afficheDeLArtiste, sortiesDeLArtiste } from './lib/artiste'
import { MINIMUM_AFFICHE, MINIMUM_AFFICHE_PETIT_TEXTE } from './lib/couleur-affiche'
import { adapterArtistes, adapterSorties } from './sanity/adaptateur'
import type { REQUETE_ARTISTES_RESULT, REQUETE_SORTIES_RESULT } from './sanity/types.generated'
import { MELANGE_LAMBEAU, MINIMUM_RED_INK_WALL, PAIRES, contraste, couleurs, melanger } from './tokens'

let echecs = 0
if (MELANGE_LAMBEAU > 0.35) {
  echecs++
  process.stdout.write(`KO  lambeaux mêlés à ${MELANGE_LAMBEAU * 100} % (maximum 35)\n`)
}
for (const [nom, base] of [['lambeauRouge', couleurs.red], ['lambeauVert', couleurs.green]] as const) {
  const attendu = melanger(couleurs.wall, base, MELANGE_LAMBEAU)
  if (couleurs[nom] !== attendu) {
    echecs++
    process.stdout.write(`KO  ${nom} vaut ${couleurs[nom]}, attendu ${attendu}\n`)
  }
}
for (const p of PAIRES) {
  const minimum = p.texte === 'redInk' && p.fond === 'wall' ? MINIMUM_RED_INK_WALL : p.minimum
  const valeur = contraste(couleurs[p.texte], couleurs[p.fond])
  const ok = valeur >= minimum
  if (!ok) echecs++
  process.stdout.write(`${ok ? 'ok ' : 'KO '} ${p.texte} sur ${p.fond} : ${valeur.toFixed(2)}:1 (minimum ${minimum}) · ${p.usage}\n`)
}
// Les couleurs d'aplat ne doivent pas servir de texte sur fond clair : on le rappelle en chiffres.
for (const t of ['red', 'green'] as const) for (const f of ['wall', 'poster'] as const) process.stdout.write(`    ${t} sur ${f} : ${contraste(couleurs[t], couleurs[f]).toFixed(2)}:1, interdit en texte\n`)

// Les dix-neuf affiches d'artistes, lues dans l'instantané du contenu publié.
const instantane = JSON.parse(readFileSync('src/components/experience/groove-to-grave/sanity/instantane.json', 'utf8')) as {
  priseLe: string
  sorties: REQUETE_SORTIES_RESULT
  artistes: REQUETE_ARTISTES_RESULT
}
const sorties = adapterSorties(instantane.sorties)
const artistes = adapterArtistes(instantane.artistes)
const compte = { dominante: 0, eclaircie: 0, palette: 0 }
let petits = 0
process.stdout.write(`\n    affiches d'artistes, instantané du ${instantane.priseLe.slice(0, 10)} (minimum ${MINIMUM_AFFICHE}:1 face à ink, texte d'affiche seulement)\n`)
for (const a of artistes) {
  const dominante = sortiesDeLArtiste(sorties, a.slug, a.releases).find((s) => s.couleurs)?.couleurs?.dominant
  const { couleur, rapport, origine } = afficheDeLArtiste(a, sorties)
  const ok = rapport >= MINIMUM_AFFICHE
  if (!ok) echecs++
  compte[origine]++
  if (rapport >= MINIMUM_AFFICHE_PETIT_TEXTE) petits++
  process.stdout.write(`${ok ? 'ok ' : 'KO '} ${a.slug.padEnd(16)} ${(dominante ?? 'sans pochette').padEnd(13)} → ${couleur} ${rapport.toFixed(2)}:1 (${origine})\n`)
}
// Le seuil de 4,5:1 ne vaut que pour le nom en grand. Si un texte courant se pose un jour sur
// l'affiche, c'est 7:1 qu'il faut : le contrôle de rendu de g2g-verif le fait échouer, et ce
// relevé dit d'avance combien de papiers tiendraient ce seuil-là.
process.stdout.write(`    ${petits} affiche(s) sur ${artistes.length} tiendraient ${MINIMUM_AFFICHE_PETIT_TEXTE}:1, le seuil exigé si un petit texte s'y posait\n`)
if (echecs) {
  process.stderr.write(`${echecs} paire(s) sous le minimum\n`)
  process.exit(1)
}
process.stdout.write(`${PAIRES.length} paires vérifiées, ${artistes.length} affiches d'artistes : ${compte.dominante} dominantes telles quelles, ${compte.eclaircie} éclaircies, ${compte.palette} de palette\n`)
