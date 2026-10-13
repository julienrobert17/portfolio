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
import { dominanteDeLArtiste, tonsDeLArtiste } from './lib/artiste'
import { LUMINANCE_BASCULE, MINIMUM_AFFICHE, MINIMUM_AFFICHE_PETIT_TEXTE } from './lib/couleur-affiche'
import { adapterArtistes, adapterSorties } from './sanity/adaptateur'
import type { REQUETE_ARTISTES_RESULT, REQUETE_SORTIES_RESULT } from './sanity/types.generated'
import { MELANGE_LAMBEAU, MINIMUM_RED_INK_WALL, PAIRES, contraste, couleurs, luminance, melanger } from './tokens'

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
// Les deux tons de chaque artiste, tirés de la même dominante : l'affiche de sa page (titre
// énorme, 4,5:1) et la tuile du mur (nom plus ligne de rôle en 13 px, donc 7:1). Le seuil de
// l'affiche ne vaut que pour le grand texte : si un petit texte s'y posait, c'est 7:1 qu'il
// faudrait, et le contrôle de rendu de g2g-verif le fait échouer à cet instant-là.
const compte: Record<string, number> = { dominante: 0, eclaircie: 0, assombrie: 0, palette: 0 }
let sombres = 0
process.stdout.write(
  `\n    teintes d'artistes, instantané du ${instantane.priseLe.slice(0, 10)} : affiche à ${MINIMUM_AFFICHE}:1, tuile du mur à ${MINIMUM_AFFICHE_PETIT_TEXTE}:1, bascule de traitement à ${LUMINANCE_BASCULE.toFixed(3)} de luminance\n`,
)
for (const a of artistes) {
  const dominante = dominanteDeLArtiste(a, sorties)
  const { affiche, tuile } = tonsDeLArtiste(a, sorties)
  const lum = dominante ? luminance(dominante) : luminance(couleurs.poster)
  const ok = affiche.rapport >= MINIMUM_AFFICHE && tuile.rapport >= MINIMUM_AFFICHE_PETIT_TEXTE
  if (!ok) echecs++
  compte[tuile.origine] = (compte[tuile.origine] ?? 0) + 1
  if (lum < LUMINANCE_BASCULE) sombres++
  const texte = (t: typeof tuile) => (t.encre === couleurs.ink ? 'encre' : 'papier')
  process.stdout.write(
    `${ok ? 'ok ' : 'KO '} ${a.slug.padEnd(16)} ${(dominante ?? 'sans pochette').padEnd(13)} lum ${lum.toFixed(3)} ${lum < LUMINANCE_BASCULE ? 'sombre ' : 'claire '} → affiche ${affiche.couleur} ${texte(affiche)} ${affiche.rapport.toFixed(2)}:1 (${affiche.origine}) · tuile ${tuile.couleur} ${texte(tuile)} ${tuile.rapport.toFixed(2)}:1 (${tuile.origine})\n`,
  )
}
// Une dominante qui frôle la bascule peut changer de traitement au prochain « Publier » du label,
// sans que personne ne regarde : on le dit d'avance, avec le nombre de pages concernées. Ce n'est
// pas un échec — c'est un événement à voir venir.
const MARGE_BASCULE = 0.1
const parDominante = new Map<string, number>()
for (const a of artistes) {
  const d = dominanteDeLArtiste(a, sorties)
  if (d) parDominante.set(d, (parDominante.get(d) ?? 0) + 1)
}
for (const [d, n] of [...parDominante].sort((x, y) => y[1] - x[1])) {
  const ecart = (luminance(d) - LUMINANCE_BASCULE) / LUMINANCE_BASCULE
  if (Math.abs(ecart) >= MARGE_BASCULE) continue
  process.stdout.write(
    `    ⚠ ${d} est à ${(ecart * 100).toFixed(1)} % de la bascule (${luminance(d).toFixed(3)} contre ${LUMINANCE_BASCULE.toFixed(3)}) et commande ${n} ${n > 1 ? 'tuiles' : 'tuile'} : une nouvelle pochette peut les faire changer de traitement d'un seul « Publier »\n`,
  )
}

if (echecs) {
  process.stderr.write(`${echecs} paire(s) sous le minimum\n`)
  process.exit(1)
}
process.stdout.write(
  `${PAIRES.length} paires vérifiées, ${artistes.length} artistes en deux tons : ${sombres} dominantes sombres (texte papier) et ${artistes.length - sombres} claires (texte encre) ; tuiles : ${compte.dominante} telles quelles, ${compte.eclaircie} éclaircies, ${compte.assombrie} assombries, ${compte.palette} de palette\n`,
)
