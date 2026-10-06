/* Scénarios de la garde d'intention. Exécution : npm run test:guard */
import { beginGesture, enterPanel, initialEdgeGuard, noteEdges, registerDelta, trackDelta, type EdgeGuardState, type EdgeSnapshot } from './panel-edge-guard'

const TOP: EdgeSnapshot = { atTop: true, atBottom: false }
const MID: EdgeSnapshot = { atTop: false, atBottom: false }
const FITS: EdgeSnapshot = { atTop: true, atBottom: true }

let failures = 0
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`)
  if (!ok) failures++
}

/** Rejoue une rafale de deltas à intervalle fixe ; renvoie l'état et le nombre de bascules. */
function burst(state: EdgeGuardState, deltas: number[], from: number, step: number, snap: EdgeSnapshot, source: 'wheel' | 'touch' = 'wheel') {
  let flips = 0
  let now = from
  for (const delta of deltas) {
    const r = registerDelta(state, snap, delta, now, source)
    state = r.state
    if (r.flip) flips++
    now += step
  }
  return { state, flips, now }
}

/** Queue d'inertie trackpad : deltas décroissants vers le haut, un événement toutes les 16 ms. */
const inertia = (count: number, start: number) => Array.from({ length: count }, (_, i) => -Math.max(1, start - i))

// (a) Arrivée en butée puis inertie décroissante pendant 1,5 s sans nouveau geste → aucune bascule
{
  let s = noteEdges(initialEdgeGuard, MID)
  let r = burst(s, inertia(20, 40), 1000, 16, MID)          // le geste remonte la grille
  s = noteEdges(r.state, TOP)                                // événement scroll : arrivée en butée
  r = burst(s, inertia(94, 30), r.now, 16, TOP)              // ~1,5 s d'inertie, toujours le même geste
  check('(a) inertie 1,5 s après l’arrivée : aucune bascule', r.flips === 0)
  s = r.state
  // puis silence 200 ms et swipe : bascule
  r = burst(s, Array(10).fill(-12), r.now + 200, 16, TOP)
  check('(a2) après la fin de l’inertie, un swipe bascule', r.flips === 1)
}

// (b) Arrivée, inertie, swipe relancé pendant l'inertie → bascule après 80 px du nouveau geste
{
  let s = noteEdges(initialEdgeGuard, MID)
  let r = burst(s, inertia(10, 40), 1000, 16, MID)
  s = noteEdges(r.state, TOP)
  r = burst(s, inertia(25, 25), r.now, 16, TOP)              // queue d'inertie : 25 → 1
  check('(b1) pendant l’inertie, rien', r.flips === 0)
  // ré-accélération : 30 px alors que le précédent était à 1 px et décroissant
  r = burst(r.state, [-30, -28, -26, -24], r.now, 16, TOP)   // 108 px cumulés
  check('(b) swipe relancé pendant l’inertie : bascule à 80 px', r.flips === 1)
}

// (c) Arrivée, silence 200 ms, swipe → bascule
{
  let s = noteEdges(initialEdgeGuard, MID)
  let r = burst(s, inertia(10, 20), 1000, 16, MID)
  s = noteEdges(r.state, TOP)
  r = burst(s, [-30, -30, -30], r.now + 200, 16, TOP)
  check('(c) silence 200 ms puis swipe : bascule', r.flips === 1)
}

// (d) Contenu qui ne déborde pas : arrivée par le geste précédent (affichage), inertie → rien ; nouveau geste → bascule
{
  let s = initialEdgeGuard
  let now = 1000
  for (const d of inertia(10, 40)) { s = trackDelta(s, d, now); now += 16 }   // le geste qui quitte le hero, suivi sans décision
  s = enterPanel(s, FITS)                                    // affichage du panneau, déjà en butée des deux côtés
  let r = burst(s, inertia(30, 30), now, 16, FITS)           // le même geste continue en inertie
  check('(d1) sans débordement, inertie du geste précédent : rien', r.flips === 0)
  r = burst(r.state, [-30, -30, -30], r.now + 200, 16, FITS)
  check('(d) nouveau geste : bascule', r.flips === 1)
}

// (e) Souris à molette : chaque cran est isolé par un silence → un cran en butée bascule
{
  let s = noteEdges(initialEdgeGuard, MID)
  let r = registerDelta(s, MID, -100, 1000)                  // le cran qui amène en butée
  s = noteEdges(r.state, TOP)
  r = registerDelta(s, TOP, -100, 1400)
  check('(e) molette : un cran en butée bascule', r.flip)
}

// (f) Cumul : remise à zéro au changement de sens et après 500 ms de silence
{
  const s = beginGesture(noteEdges(initialEdgeGuard, FITS))
  let r = registerDelta(s, FITS, -50, 1000)
  r = registerDelta(r.state, FITS, 50, 1016)
  r = registerDelta(r.state, FITS, -50, 1032)
  check('(f1) changement de sens : cumul repart à 50', !r.flip && r.state.cumul === 50)
  r = registerDelta(r.state, FITS, -50, 1700)
  check('(f2) 500 ms de silence : cumul repart à 50', !r.flip && r.state.cumul === 50)
  r = registerDelta(r.state, FITS, -30, 1716)
  check('(f3) puis 30 px : bascule', r.flip)
}

// (g) Hors butée, jamais de bascule
{
  const r = burst(noteEdges(initialEdgeGuard, MID), Array(30).fill(-20), 1000, 16, MID)
  check('(g) hors butée : aucune bascule', r.flips === 0)
}

// (h) Quitter la butée réarme le verrou : revenir en butée par un geste ne bascule pas sans nouveau geste
{
  let s = beginGesture(noteEdges(initialEdgeGuard, TOP))
  let r = burst(s, [20, 20], 1000, 16, MID)                  // on descend : plus en butée
  s = noteEdges(r.state, TOP)                                // on remonte : nouvelle arrivée, verrou posé
  r = burst(s, Array(10).fill(-20), r.now, 16, TOP)          // même geste (pas de silence)
  check('(h) nouvelle arrivée : verrou réarmé', r.flips === 0)
}

// (i) Tactile : le swipe qui amène en butée ne bascule pas, le touchstart suivant oui
{
  let s = noteEdges(initialEdgeGuard, MID)
  s = beginGesture(s)                                        // touchstart
  let r = burst(s, [-15, -15, -15], 1000, 16, MID, 'touch')
  s = noteEdges(r.state, TOP)                                // arrivée pendant ce swipe
  r = burst(s, Array(10).fill(-15), r.now, 16, TOP, 'touch') // le même doigt continue : ignoré
  check('(i1) tactile : le swipe d’arrivée est ignoré', r.flips === 0)
  s = beginGesture(r.state)                                  // nouveau touchstart
  r = burst(s, Array(6).fill(-15), r.now + 600, 16, TOP, 'touch')
  check('(i) tactile : nouveau swipe de 80 px bascule', r.flips === 1)
}

console.log(failures === 0 ? 'TOUS OK' : `${failures} échec(s)`)
if (failures > 0) process.exitCode = 1
