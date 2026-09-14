'use client'

import { useState } from 'react'
import styles from '../entre-nous.module.css'
import { EcartPari, Revelation, Saisie, estComplet, valeurInitiale } from '../mecaniques/rendu'
import { UI } from '../content'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import type { Question, Reponse, Valeur } from '../types'

/** Renseigné uniquement quand la question vient du fichier perso. */
export interface InfoPerso {
  auteur: string
  /** Le mot de l'auteur, révélé sous les deux réponses. */
  mot?: string
}

interface HalfPanelProps {
  nom: string
  nomAutre: string
  perso?: InfoPerso
  /** Vrai si cette moitié est pivotée à 180° (mode face à face). */
  flipped: boolean
  question: Question
  /** Ma réponse, une fois validée. */
  maReponse?: Reponse
  /**
   * La réponse de l'autre. L'appelant ne la transmet QUE lorsque les deux
   * côtés ont validé : tant que ce n'est pas le cas, elle vaut `undefined` et
   * n'existe donc nulle part dans le DOM.
   */
  reponseAutre?: Reponse
  /**
   * Le tir à la corde est la seule mécanique où les deux moitiés agissent sur
   * le même objet : sa valeur ne peut pas vivre ici, elle est hissée au-dessus
   * des deux panneaux et redescend par ces deux props.
   */
  partage?: number
  onPartageDelta?: (delta: number) => void
  onValider: (reponse: Reponse) => void
  onPasser: () => void
  /**
   * Passer à la suite. Rendu dans CHAQUE moitié, à l'endroit pour celle qui le
   * lit : un bouton unique posé sur la ligne serait à l'envers pour l'une des
   * deux personnes. Les deux mènent au même endroit, la première main gagne.
   */
  onContinuer: () => void
}

export default function HalfPanel({
  nom,
  nomAutre,
  perso,
  flipped,
  question,
  maReponse,
  reponseAutre,
  partage,
  onPartageDelta,
  onValider,
  onPasser,
  onContinuer,
}: HalfPanelProps) {
  const reduced = useReducedMotion()
  const [pourSoi, setPourSoi] = useState<Valeur>(() => valeurInitiale(question))
  const [pourAutre, setPourAutre] = useState<Valeur>(() => valeurInitiale(question))
  /** Sur une question en mode pari, on répond deux fois : soi, puis l'autre. */
  const [etape, setEtape] = useState<'soi' | 'autre'>('soi')

  const valide = maReponse !== undefined
  const corde =
    question.mecanique === 'tir-a-la-corde' && partage !== undefined && onPartageDelta !== undefined
  const voixHaute = question.mecanique === 'a-voix-haute'

  const courant: Valeur = corde ? partage : etape === 'soi' ? pourSoi : pourAutre
  const complet = estComplet(question, courant)

  // Le marqueur dépend du côté : l'auteur ne lit pas « pour toi ».
  const marqueur = !perso
    ? null
    : perso.auteur === nom
      ? UI.perso.auteur
      : perso.auteur === nomAutre
        ? UI.perso.pour.replace('{auteur}', perso.auteur)
        : UI.perso.neutre.replace('{auteur}', perso.auteur)

  const avancer = () => {
    if (question.pari && etape === 'soi') {
      setEtape('autre')
      return
    }
    // La corde n'est jamais en mode pari : deviner une valeur qu'on tient
    // soi-même dans la main n'aurait aucun sens.
    const valeur = corde ? partage : pourSoi
    onValider(question.pari ? { valeur, pari: pourAutre } : { valeur })
  }

  const libelle = question.pari && etape === 'soi'
    ? UI.jeu.pariSuivant
    : voixHaute
      ? UI.jeu.cestDit
      : corde
        ? UI.jeu.lacher
        : UI.jeu.valider

  return (
    <>
      <p className={styles.nom}>{nom}</p>
      {marqueur !== null && <p className={styles.persoTag}>{marqueur}</p>}
      <p className={styles.question}>{question.texte}</p>

      {!valide && (
        <>
          {question.pari && (
            <p className={styles.etape}>
              {etape === 'soi'
                ? UI.jeu.pariSoi
                : UI.jeu.pariAutre.replace('{nom}', nomAutre)}
            </p>
          )}
          <Saisie
            /* La clé sépare les deux brouillons : changer d'étape remet la
               mécanique à zéro plutôt que de traîner la réponse précédente. */
            key={etape}
            question={question}
            valeur={courant}
            onChange={etape === 'soi' ? setPourSoi : setPourAutre}
            onDelta={onPartageDelta}
            flipped={flipped}
            reducedMotion={reduced}
          />
          {/* Les deux commandes sont groupées : dans une moitié basse, elles
              passent sur une seule ligne et rendent une cinquantaine de
              pixels à la question. */}
          <div className={styles.actions}>
            <button
              type="button"
              /* Le seul minuteur de l'expérience, et il est invisible : sur une
                 question à voix haute le bouton arrive en fondu sur cinq
                 secondes. Il reste cliquable et focusable pendant tout le fondu,
                 donc il ne retient personne — il retient juste le réflexe. */
              className={`${styles.btn} ${styles.btnFort} ${voixHaute ? styles.btnRetenu : ''}`}
              disabled={!complet}
              onClick={avancer}
            >
              {libelle}
            </button>
            <button type="button" className={styles.passer} onClick={onPasser}>
              {UI.jeu.passer}
            </button>
          </div>
        </>
      )}

      {valide && reponseAutre === undefined && <p className={styles.attente}>{UI.jeu.attente}</p>}

      {valide && reponseAutre !== undefined && maReponse !== undefined && (
        <>
          <Revelation
            question={question}
            nomMoi={nom}
            nomAutre={nomAutre}
            moi={maReponse}
            autre={reponseAutre}
            passeeLabel={UI.jeu.passee}
          />
          {question.pari && (
            <EcartPari
              question={question}
              nomAutre={nomAutre}
              moi={maReponse}
              autre={reponseAutre}
            />
          )}
          {perso?.mot !== undefined && (
            <p className={styles.motAuteur}>
              {perso.mot}
              <span className={styles.motSignature}>
                {UI.perso.signature.replace('{auteur}', perso.auteur)}
              </span>
            </p>
          )}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnFort}`}
            onClick={onContinuer}
          >
            {UI.jeu.continuer}
          </button>
        </>
      )}
    </>
  )
}
