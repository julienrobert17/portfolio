'use client'

import { useMemo, useState } from 'react'
import styles from './entre-nous.module.css'
import SplitStage from './layout/split-stage'
import HalfPanel from './layout/half-panel'
import Calibration from './ecrans/calibration'
import Couture from './ecrans/couture'
import OrdreDuJour from './ecrans/ordre-du-jour'
import Derniere from './ecrans/derniere'
import { NOMS, UI } from './content'
import { BANQUE } from './questions/pool'
import { PERSO } from './questions/perso'
import type { InfoPerso } from './layout/half-panel'
import { buildRun } from './build-run'
import { lireOuCreerGraine } from './graine'
import { useDuoMachine } from './use-duo-machine'
import type { RunPlan } from './types'

export default function EntreNousApp() {
  // Le déroulé est figé au premier rendu : la graine vit dans sessionStorage,
  // donc un refresh ne rebat jamais les cartes.
  const run = useMemo<RunPlan>(() => buildRun(BANQUE, PERSO.questions, lireOuCreerGraine()), [])
  const m = useDuoMachine(run, NOMS)

  /*
   * Le tir à la corde est la seule mécanique dont la valeur n'appartient à
   * personne : elle est hissée ici, au-dessus des deux moitiés. Elle est
   * étiquetée par l'id de la question plutôt que remise à zéro dans un effet —
   * changer de question suffit alors à repartir du milieu, sans rendu
   * intermédiaire ni `setState` dans un effet.
   */
  const [corde, setCorde] = useState<{ qid: string; valeur: number } | null>(null)

  if (m.phase === 'calibration') {
    return <Calibration noms={m.noms} onValider={m.calibrer} />
  }

  if (m.phase === 'reprise') {
    return (
      <div className={styles.plein}>
        <h1 className={styles.titre}>{UI.reprise.titre}</h1>
        <p className={styles.sous}>{UI.reprise.sous}</p>
        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnFort}`}
            onClick={() => m.allerA('jeu')}
          >
            {UI.reprise.reprendre}
          </button>
          <button type="button" className={styles.btn} onClick={m.recommencer}>
            {UI.reprise.recommencer}
          </button>
        </div>
      </div>
    )
  }

  if (m.phase === 'interlude') {
    // L'acte visé est celui de la question sur laquelle on vient d'arriver.
    const acte = m.question?.acte
    const texte = acte === 2 || acte === 3 ? UI.interludes[acte] : null
    return (
      <div className={styles.plein}>
        <h1 className={styles.titre}>{texte?.titre ?? ''}</h1>
        {texte !== null && <p className={styles.sous}>{texte.sous}</p>}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnFort}`}
          onClick={() => m.allerA('jeu')}
        >
          {UI.jeu.continuer}
        </button>
      </div>
    )
  }

  if (m.phase === 'couture') {
    return (
      <Couture
        installation={m.installation}
        noms={m.noms}
        onContinuer={() => m.allerA('ordre-du-jour')}
      />
    )
  }

  if (m.phase === 'ordre-du-jour') {
    return (
      <OrdreDuJour
        run={run}
        noms={m.noms}
        reponses={m.reponses}
        onContinuer={() => m.allerA('derniere')}
      />
    )
  }

  if (m.phase === 'derniere') return <Derniere />

  // Plus de question à jouer : la banque est vide ou l'index est hors bornes.
  if (m.question === null) {
    return (
      <Couture
        installation={m.installation}
        noms={m.noms}
        onContinuer={() => m.allerA('ordre-du-jour')}
      />
    )
  }

  const question = m.question
  const valeurCorde = corde !== null && corde.qid === question.id ? corde.valeur : 50
  /*
   * Un déplacement RELATIF, jamais une valeur absolue : deux doigts peuvent
   * être sur la corde en même temps, et la forme fonctionnelle du `setState`
   * garantit que le second geste s'ajoute au premier au lieu de l'écraser.
   */
  const tirer = (delta: number) =>
    setCorde((precedent) => {
      const base = precedent !== null && precedent.qid === question.id ? precedent.valeur : 50
      return { qid: question.id, valeur: Math.min(100, Math.max(0, base + delta)) }
    })
  const { a, b } = m.reponsesCourantes
  // Les questions perso s'annoncent désormais : plus de camouflage à tenir.
  const infoPerso: InfoPerso | undefined =
    question.id in run.perso ? { auteur: PERSO.auteur, ...run.perso[question.id] } : undefined

  return (
    <>
      <SplitStage
        installation={m.installation}
        acte={question.acte}
        moitieA={
          <HalfPanel
            key={question.id}
            nom={m.noms.a}
            nomAutre={m.noms.b}
            perso={infoPerso}
            flipped={m.installation === 'face-a-face'}
            question={question}
            maReponse={a}
            /* La réponse adverse n'est transmise qu'une fois les deux validées. */
            reponseAutre={m.revele ? b : undefined}
            partage={valeurCorde}
            onPartageDelta={tirer}
            onValider={(r) => m.repondre('a', r)}
            onPasser={() => m.passer('a')}
            onContinuer={m.suivant}
          />
        }
        moitieB={
          <HalfPanel
            key={question.id}
            nom={m.noms.b}
            nomAutre={m.noms.a}
            perso={infoPerso}
            flipped={false}
            question={question}
            maReponse={b}
            reponseAutre={m.revele ? a : undefined}
            partage={valeurCorde}
            onPartageDelta={tirer}
            onValider={(r) => m.repondre('b', r)}
            onPasser={() => m.passer('b')}
            onContinuer={m.suivant}
          />
        }
      />
    </>
  )
}
