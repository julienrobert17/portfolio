'use client'

import styles from '../entre-nous.module.css'
import { UI } from '../content'
import { distance, ecartPari } from '../distance'
import { formater } from '../mecaniques/rendu'
import type { Cote, Mecanique, Question, Reponse, RunPlan } from '../types'

interface Ligne {
  question: Question
  /** Deux à quatre phrases toutes faites, dans l'ordre d'affichage. */
  dits: readonly string[]
}

interface OrdreDuJourProps {
  run: RunPlan
  noms: Record<Cote, string>
  reponses: Record<string, Partial<Record<Cote, Reponse>>>
  onContinuer: () => void
}

/** Combien de lignes par section. Court : c'est une amorce, pas un bilan. */
const PAR_SECTION = 3
const PARIS = 2

/**
 * Départage les écarts égaux. Une bascule en désaccord vaut toujours 1 : sans
 * ce critère, trois oui/non opposés raflent la section et enterrent un vrai
 * fossé de curseur, qui donne pourtant beaucoup plus à se dire.
 */
const NUANCE: Record<Mecanique, number> = {
  curseur: 2,
  'tir-a-la-corde': 2,
  enchere: 2,
  classement: 2,
  'le-mot': 2,
  bascule: 1,
  'a-voix-haute': 0,
}

/**
 * Deuxième temps de la fin.
 *
 * Aucun score, aucun pourcentage, aucun verdict de compatibilité — et ce n'est
 * pas une pudeur, c'est le sujet : chiffrer un couple, c'est clore la
 * conversation qu'on essaie justement d'ouvrir. Les distances calculées ne
 * servent qu'à trier, elles ne s'affichent nulle part.
 */
export default function OrdreDuJour({ run, noms, reponses, onContinuer }: OrdreDuJourProps) {
  const mesure = (question: Question) => {
    const paire = reponses[question.id]
    const a = paire?.a
    const b = paire?.b
    if (!a || !b) return null
    return { a, b, d: distance(question, a, b) }
  }

  const dire = (question: Question, cote: Cote, r: Reponse) =>
    `${noms[cote]} — ${r.passe ? UI.jeu.passee : formater(question, r.valeur)}`

  const mesurables = run.questions
    .map((question) => ({ question, m: mesure(question) }))
    .filter((e): e is { question: Question; m: { a: Reponse; b: Reponse; d: number } } =>
      e.m !== null && e.m.d !== null,
    )

  const enLigne = (question: Question, a: Reponse, b: Reponse): Ligne => ({
    question,
    dits: [dire(question, 'a', a), dire(question, 'b', b)],
  })

  const loin = [...mesurables]
    .filter((e) => e.m.d > 0)
    .sort((x, y) => y.m.d - x.m.d || NUANCE[y.question.mecanique] - NUANCE[x.question.mecanique])
    .slice(0, PAR_SECTION)
    .map((e) => enLigne(e.question, e.m.a, e.m.b))

  const dejaVues = new Set(loin.map((l) => l.question.id))

  const proche = mesurables
    .filter((e) => e.m.d === 0 && !dejaVues.has(e.question.id))
    .slice(0, PAR_SECTION)
    .map((e) => {
      dejaVues.add(e.question.id)
      return enLigne(e.question, e.m.a, e.m.b)
    })

  /*
   * Le pari : on ne regarde plus l'écart entre deux réponses, mais l'écart
   * entre ce que l'un a cru de l'autre et ce que l'autre a répondu. C'est le
   * seul endroit où la surprise vient de soi.
   */
  interface Candidat {
    question: Question
    devineur: Cote
    cible: Cote
    /** Les deux réponses portées directement : plus aucune relecture ensuite. */
    duDevineur: Reponse
    deLaCible: Reponse
    e: number
  }

  const paris: Ligne[] = []
  const candidats: Candidat[] = []
  for (const question of run.questions) {
    if (!question.pari || dejaVues.has(question.id)) continue
    const paire = reponses[question.id]
    const ra = paire?.a
    const rb = paire?.b
    if (ra === undefined || rb === undefined) continue
    const sens: readonly Omit<Candidat, 'question' | 'e'>[] = [
      { devineur: 'a', cible: 'b', duDevineur: ra, deLaCible: rb },
      { devineur: 'b', cible: 'a', duDevineur: rb, deLaCible: ra },
    ]
    for (const s of sens) {
      const e = ecartPari(question, s.duDevineur, s.deLaCible)
      if (e !== null && e > 0) candidats.push({ question, ...s, e })
    }
  }
  candidats.sort((x, y) => y.e - x.e)
  for (const c of candidats) {
    if (paris.length >= PARIS) break
    // Une même question ne revient pas deux fois, même si les deux ont raté.
    if (dejaVues.has(c.question.id)) continue
    dejaVues.add(c.question.id)
    paris.push({
      question: c.question,
      dits: [
        UI.ordreDuJour.devineParInterp
          .replace('{nom}', noms[c.devineur])
          .replace('{valeur}', formater(c.question, c.duDevineur.pari ?? null)),
        UI.ordreDuJour.reponduParInterp
          .replace('{nom}', noms[c.cible])
          .replace('{valeur}', formater(c.question, c.deLaCible.valeur)),
      ],
    })
  }

  const sections: { cle: string; titre: string; lignes: readonly Ligne[] }[] = [
    { cle: 'loin', titre: UI.ordreDuJour.loin, lignes: loin },
    { cle: 'proche', titre: UI.ordreDuJour.proche, lignes: proche },
    { cle: 'pari', titre: UI.ordreDuJour.pari, lignes: paris },
  ].filter((s) => s.lignes.length > 0)

  return (
    <div className={`${styles.plein} ${styles.pleinLong}`}>
      <h1 className={styles.titre}>{UI.ordreDuJour.titre}</h1>
      <p className={styles.sous}>{UI.ordreDuJour.sous}</p>

      {/* Tout passer est une réponse : on le dit, on ne montre pas un écran vide. */}
      {sections.length === 0 && <p className={styles.sous}>{UI.ordreDuJour.vide}</p>}

      {sections.map((section) => (
        <section key={section.cle} className={styles.section}>
          <h2 className={styles.sectionTitre}>{section.titre}</h2>
          {section.lignes.map((ligne) => (
            <article key={ligne.question.id} className={styles.item}>
              <p className={styles.itemQuestion}>{ligne.question.texte}</p>
              {ligne.dits.map((dit, i) => (
                <p key={`${ligne.question.id}-${i}`} className={styles.itemDit}>
                  {dit}
                </p>
              ))}
            </article>
          ))}
        </section>
      ))}

      <button type="button" className={`${styles.btn} ${styles.btnFort}`} onClick={onContinuer}>
        {UI.ordreDuJour.continuer}
      </button>
    </div>
  )
}
