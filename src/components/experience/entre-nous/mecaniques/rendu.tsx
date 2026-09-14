'use client'

import styles from '../entre-nous.module.css'
import Bascule from './bascule'
import Curseur, { formulerPosition } from './curseur'
import Enchere, { uniteDe } from './enchere'
import LeMot from './le-mot'
import Classement from './classement'
import AVoixHaute from './a-voix-haute'
import TirALaCorde from './tir-a-la-corde'
import { UI } from '../content'
import type { Question, Reponse, Valeur } from '../types'

const CLASSES_RANG = {
  liste: styles.rangListe,
  carte: styles.rangCarte,
  carteActive: styles.rangCarteActive,
  poignee: styles.rangPoignee,
  rang: styles.rangNum,
  boutons: styles.rangBoutons,
  bouton: styles.rangBouton,
}

/** La valeur de départ d'un brouillon, selon la mécanique. */
export function valeurInitiale(question: Question): Valeur {
  switch (question.mecanique) {
    case 'curseur':
    case 'tir-a-la-corde':
      return 50
    case 'le-mot':
      return []
    case 'classement':
      return [...(question.options ?? [])]
    case 'enchere':
      return question.echelle?.min ?? 0
    case 'a-voix-haute':
      return 'dit'
    default:
      return null
  }
}

/** Le brouillon est-il complet ? */
export function estComplet(question: Question, valeur: Valeur): boolean {
  switch (question.mecanique) {
    case 'le-mot':
      return Array.isArray(valeur) && valeur.length === 3
    case 'classement':
      return Array.isArray(valeur) && valeur.length > 0
    case 'curseur':
    case 'tir-a-la-corde':
    case 'enchere':
    case 'a-voix-haute':
      return valeur !== null
    default:
      return valeur !== null && valeur !== ''
  }
}

/** Rend une valeur lisible, selon la mécanique. */
export function formater(question: Question, valeur: Valeur): string {
  if (valeur === null) return '—'
  if (Array.isArray(valeur)) return valeur.join(' · ')
  if (question.mecanique === 'enchere' && typeof valeur === 'number') {
    const e = question.echelle
    return e ? `${valeur} ${uniteDe(e, valeur)}` : String(valeur)
  }
  if (
    (question.mecanique === 'curseur' || question.mecanique === 'tir-a-la-corde') &&
    typeof valeur === 'number'
  ) {
    return formulerPosition(question.options ?? [], valeur)
  }
  if (question.mecanique === 'a-voix-haute') return UI.jeu.ditEnsemble
  return String(valeur)
}

interface SaisieProps {
  question: Question
  valeur: Valeur
  onChange: (valeur: Valeur) => void
  /** Vrai si cette moitié est pivotée à 180° : les gestes en ont besoin. */
  flipped: boolean
  reducedMotion: boolean
  /**
   * Déplacement relatif, pour le tir à la corde uniquement : sa valeur est
   * partagée entre les deux moitiés, donc elle ne se pose pas, elle se pousse.
   */
  onDelta?: (delta: number) => void
}

/** L'entrée de réponse, selon la mécanique déclarée par la question. */
export function Saisie({ question, valeur, onChange, flipped, reducedMotion, onDelta }: SaisieProps) {
  const options = question.options ?? []

  switch (question.mecanique) {
    case 'curseur':
      return (
        <Curseur poles={options} valeur={typeof valeur === 'number' ? valeur : 50} onChange={onChange} />
      )
    case 'enchere':
      return (
        <Enchere
          echelle={question.echelle ?? { min: 0, max: 10, pas: 1, unite: '' }}
          valeur={typeof valeur === 'number' ? valeur : 0}
          onChange={onChange}
        />
      )
    case 'tir-a-la-corde':
      return (
        <TirALaCorde
          poles={options}
          valeur={typeof valeur === 'number' ? valeur : 50}
          /* Sans `onDelta`, la corde serait inerte : mieux vaut ne rien faire
             que faire semblant. L'appelant en fournit toujours un. */
          onDelta={onDelta ?? (() => undefined)}
          flipped={flipped}
        />
      )
    case 'a-voix-haute':
      return <AVoixHaute />
    case 'le-mot':
      return <LeMot mots={options} choisis={Array.isArray(valeur) ? valeur : []} onChange={onChange} />
    case 'classement':
      return (
        <Classement
          ordre={Array.isArray(valeur) ? valeur : options}
          onChange={onChange}
          flipped={flipped}
          reducedMotion={reducedMotion}
          classes={CLASSES_RANG}
          ariaLabel={`Classe ces ${options.length} cartes`}
        />
      )
    default:
      return (
        <Bascule options={options} valeur={typeof valeur === 'string' ? valeur : null} onChange={onChange} />
      )
  }
}

interface RevelationProps {
  question: Question
  nomMoi: string
  nomAutre: string
  moi: Reponse
  autre: Reponse
  passeeLabel: string
}

/** Les deux réponses, ensemble. Rendu selon la mécanique. */
export function Revelation({ question, nomMoi, nomAutre, moi, autre, passeeLabel }: RevelationProps) {
  const dire = (r: Reponse) => (r.passe ? passeeLabel : formater(question, r.valeur))

  // « À voix haute » ne produit aucune donnée : la révélation ne peut que
  // constater. Afficher deux fois « dit » serait un écran creux.
  if (question.mecanique === 'a-voix-haute') {
    return (
      <div className={styles.rev}>
        <p className={styles.consigne}>
          {moi.passe && autre.passe ? passeeLabel : UI.jeu.ditEnsemble}
        </p>
      </div>
    )
  }

  // Le curseur superpose les deux positions sur le même axe. Le tir à la corde
  // aussi : la corde a beau être commune, chacun lâche quand il veut, et c'est
  // l'écart entre les deux lâchers qui se regarde.
  if (question.mecanique === 'curseur' || question.mecanique === 'tir-a-la-corde') {
    const vMoi = typeof moi.valeur === 'number' ? moi.valeur : 50
    const vAutre = typeof autre.valeur === 'number' ? autre.valeur : 50
    const options = question.options ?? []
    return (
      <div className={styles.rev}>
        <div className={styles.poles}>
          <span className={styles.pole}>{options[0]}</span>
          <span className={`${styles.pole} ${styles.poleD}`}>{options[1]}</span>
        </div>
        <div className={styles.revAxe}>
          {!moi.passe && <span className={`${styles.revDot} ${styles.revDotA}`} style={{ left: `${vMoi}%` }} />}
          {!autre.passe && (
            <span className={`${styles.revDot} ${styles.revDotB}`} style={{ left: `${vAutre}%` }} />
          )}
        </div>
        <div className={styles.revLigne}>
          <span className={styles.revNom}>{nomMoi}</span>
          <span className={styles.revNom}>{nomAutre}</span>
        </div>
      </div>
    )
  }

  // Le mot met en évidence ce qui est commun aux deux.
  if (question.mecanique === 'le-mot') {
    const mMoi = Array.isArray(moi.valeur) ? moi.valeur : []
    const mAutre = Array.isArray(autre.valeur) ? autre.valeur : []
    const rendre = (mots: readonly string[], face: readonly string[]) =>
      mots.map((mot, i) => (
        <span key={mot} className={face.includes(mot) ? styles.commun : undefined}>
          {mot}
          {i < mots.length - 1 ? ' · ' : ''}
        </span>
      ))
    return (
      <div className={styles.rev}>
        <div className={styles.revLigne}>
          <span className={styles.revNom}>{nomMoi}</span>
          <span className={styles.revVal}>{moi.passe ? passeeLabel : rendre(mMoi, mAutre)}</span>
        </div>
        <div className={styles.revLigne}>
          <span className={styles.revNom}>{nomAutre}</span>
          <span className={styles.revVal}>{autre.passe ? passeeLabel : rendre(mAutre, mMoi)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.rev}>
      <div className={styles.revLigne}>
        <span className={styles.revNom}>{nomMoi}</span>
        <span className={styles.revVal}>{dire(moi)}</span>
      </div>
      <div className={styles.revLigne}>
        <span className={styles.revNom}>{nomAutre}</span>
        <span className={styles.revVal}>{dire(autre)}</span>
      </div>
    </div>
  )
}

interface EcartPariProps {
  question: Question
  nomAutre: string
  moi: Reponse
  autre: Reponse
}

/**
 * Le cœur du dispositif : ce que tu as deviné face à ce qu'elle a répondu.
 * C'est cet écart-là qui fait parler, pas la réponse elle-même.
 */
export function EcartPari({ question, nomAutre, moi, autre }: EcartPariProps) {
  const devineParAutre = autre.pari
  const devineParMoi = moi.pari

  return (
    <div className={styles.rev}>
      {devineParMoi !== undefined && (
        <p className={styles.revEcart}>
          {UI.jeu.revTuAvais} : {formater(question, devineParMoi)}
        </p>
      )}
      {devineParAutre !== undefined && (
        <p className={styles.revEcart}>
          {UI.jeu.revDevine.replace('{nom}', nomAutre)} : {formater(question, devineParAutre)}
        </p>
      )}
    </div>
  )
}
