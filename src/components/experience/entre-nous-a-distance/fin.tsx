'use client'

import { useEffect, useState } from 'react'
import styles from './salon.module.css'
import { TEXTES } from './content'
import { UI } from '../entre-nous/content'
import OrdreDuJour from '../entre-nous/ecrans/ordre-du-jour'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import type { Cote, Reponse, RunPlan } from '../entre-nous/types'
import type { Lien } from './use-lien'

/** Le temps que dure l'animation de couture avant que le bouton apparaisse. */
const COUTURE_MS = 3000
/** Le temps qu'on laisse à la dernière question avant l'extinction. */
const AVANT_EXTINCTION = 20000

/**
 * PREMIER TEMPS — la couture.
 *
 * La seule animation ample du mode. En présentiel, la ligne séparait deux
 * territoires et sa disparition était le geste ; ici elle n'a jamais séparé
 * personne, elle a dit l'état du lien. Sa sortie est donc l'inverse d'une
 * disparition : elle s'étale, s'éclaire, puis s'efface.
 *
 * Ce qu'elle annonce est vrai à l'instant où elle l'annonce — les deux écrans
 * viennent de devenir identiques. Pendant toute la partie, chacun voyait sa
 * propre version : son prénom marqué « toi », ses réponses en premier.
 */
function Couture({ onContinuer }: { onContinuer: () => void }) {
  const reduced = useReducedMotion()
  const [pose, setPose] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => setPose(true), COUTURE_MS)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <div className={styles.plein}>
      <div className={`${styles.ligne} ${reduced ? '' : styles.ligneCouture}`} />
      {pose && (
        <div className={reduced ? undefined : styles.coutureTexte}>
          <h1 className={styles.titre}>{TEXTES.couture.titre}</h1>
          <p className={styles.sous}>{TEXTES.couture.sous}</p>
          <div className={styles.options}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFort}`}
              onClick={onContinuer}
            >
              {TEXTES.couture.continuer}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * TROISIÈME TEMPS — la dernière question.
 *
 * « Posez les téléphones » ouvre ce temps-ci et pas la couture : l'ordre du
 * jour se lit à l'écran, et une consigne démentie trente secondes plus tard ne
 * vaut rien. Ici, plus rien n'attend un geste — pas de champ, pas de bouton,
 * pas de partage. L'écran s'éteint tout seul.
 */
function Derniere() {
  const [eteint, setEteint] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEteint(true), AVANT_EXTINCTION)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${styles.plein} ${eteint ? styles.eteint : ''}`}>
      <p className={styles.poser}>{TEXTES.derniere.poser}</p>
      <p className={styles.sous}>{TEXTES.derniere.consigne}</p>
      <p className={styles.derniereQuestion}>{UI.derniere.question}</p>
      <p className={styles.sous}>{UI.derniere.consigne}</p>
    </div>
  )
}

interface FinProps {
  lien: Lien
  run: RunPlan
  phase: 'couture' | 'ordre' | 'derniere'
}

export default function Fin({ lien, run, phase }: FinProps) {
  const { etat, revelations, rapatrierReponses } = lien

  /*
   * On rapatrie les réponses AVANT l'ordre du jour, jamais pendant : les
   * révélations reçues par le flux ne survivent pas à un rechargement, et
   * c'est précisément la fin de partie qu'on ne peut pas se permettre de
   * bâtir sur une mémoire trouée.
   */
  useEffect(() => {
    if (phase === 'couture') void rapatrierReponses()
  }, [phase, rapatrierReponses])

  if (!etat) return null

  if (phase === 'couture') {
    return <Couture onContinuer={() => void lien.agir('phase', { phase: 'ordre' })} />
  }

  if (phase === 'derniere') return <Derniere />

  // ── DEUXIÈME TEMPS — l'ordre du jour, tel quel depuis le présentiel ──
  const noms: Record<Cote, string> = {
    a: etat.places.find((p) => p.cote === 'a')?.nom ?? 'a',
    b: etat.places.find((p) => p.cote === 'b')?.nom ?? 'b',
  }
  const enReponse = (brut: unknown): Reponse | undefined => {
    if (brut === null || brut === undefined) return undefined
    const r = brut as { valeur?: unknown; pari?: unknown; passe?: unknown }
    return {
      valeur: (r.valeur ?? null) as Reponse['valeur'],
      ...(r.pari !== undefined && r.pari !== null ? { pari: r.pari as Reponse['valeur'] } : {}),
      passe: r.passe === true,
    }
  }
  const reponses: Record<string, Partial<Record<Cote, Reponse>>> = {}
  for (const [questionId, rev] of Object.entries(revelations)) {
    const a = enReponse(rev.a)
    const b = enReponse(rev.b)
    reponses[questionId] = { ...(a ? { a } : {}), ...(b ? { b } : {}) }
  }

  return (
    <OrdreDuJour
      run={run}
      noms={noms}
      reponses={reponses}
      onContinuer={() => void lien.agir('phase', { phase: 'derniere' })}
    />
  )
}
