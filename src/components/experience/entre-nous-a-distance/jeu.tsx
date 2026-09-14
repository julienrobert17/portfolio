'use client'

import { useState } from 'react'
import styles from './salon.module.css'
import {
  EcartPari,
  Revelation,
  Saisie,
  estComplet,
  valeurInitiale,
} from '../entre-nous/mecaniques/rendu'
import { UI } from '../entre-nous/content'
import { TEXTES } from './content'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import type { Question, Reponse, Valeur } from '../entre-nous/types'
import type { Lien } from './use-lien'

/**
 * Une question, sur un écran entier.
 *
 * Les mécaniques sont celles de l'expérience d'origine, réutilisées telles
 * quelles : `Saisie` et `Revelation` ne connaissent ni les moitiés ni la
 * rotation, ils prennent une valeur et rendent un composant. Ce qui change à
 * distance, c'est tout ce qui les entourait — plus de pivot, plus de paliers
 * de densité, et 390×844 pour une seule personne au lieu de 390×419.
 *
 * `flipped` vaut donc toujours `false`, et il n'y a pas de `onDelta` : le tir
 * à la corde est rabattu sur un curseur en amont, dans `buildRun`.
 */
function QuestionEnCours({
  lien,
  question,
  index,
}: {
  lien: Lien
  question: Question
  index: number
}) {
  const reduced = useReducedMotion()
  const { cote, etatQuestion, revelations } = lien
  /*
   * LE PARI EST LE SEUL ENDROIT OÙ UN CÔTÉ ENVOIE DEUX VALEURS.
   *
   * Deux brouillons indépendants, deux temps de saisie, et UNE SEULE écriture
   * à la fin. Envoyer la première valeur dès le premier temps paraîtrait plus
   * naturel, et serait un bug : le serveur compte les réponses pour décider
   * de révéler, donc une réponse à moitié écrite déclencherait la révélation
   * avant que le pari existe. Une question, une écriture.
   */
  const [pourSoi, setPourSoi] = useState<Valeur>(() => valeurInitiale(question))
  const [pourAutre, setPourAutre] = useState<Valeur>(() => valeurInitiale(question))
  const [etape, setEtape] = useState<'soi' | 'autre'>('soi')
  const [refus, setRefus] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const phase = etatQuestion(question.id)
  const revelation = revelations[question.id]
  const brouillon = etape === 'soi' ? pourSoi : pourAutre
  const setBrouillon = etape === 'soi' ? setPourSoi : setPourAutre
  const complet = estComplet(question, brouillon)
  const voixHaute = question.mecanique === 'a-voix-haute'

  const envoyer = async (valeur: Valeur, passe: boolean, pari?: Valeur) => {
    setRefus(null)
    setEnvoi(true)
    const r = await lien.repondre(question.id, valeur, index, passe, pari)
    setEnvoi(false)
    // Une réponse perdue se dit. L'avaler en silence est le bug que
    // l'utilisateur ne comprendra jamais.
    if ('refus' in (r as object)) {
      setRefus(TEXTES.jeu.questionPassee)
    }
  }

  const nomDe = (c: 'a' | 'b') => lien.etat?.places.find((p) => p.cote === c)?.nom ?? c
  const autre: 'a' | 'b' = cote === 'a' ? 'b' : 'a'
  const enReponse = (brut: unknown): Reponse => {
    const r = (brut ?? {}) as { valeur?: unknown; pari?: unknown; passe?: unknown }
    return {
      valeur: (r.valeur ?? null) as Valeur,
      ...(r.pari !== undefined && r.pari !== null ? { pari: r.pari as Valeur } : {}),
      passe: r.passe === true,
    }
  }

  return (
    <>
      <p className={styles.sous}>{TEXTES.jeu.question.replace('{n}', String(index + 1))}</p>
      <p className={styles.question}>{question.texte}</p>

      {phase === 'saisie' && (
        <>
          {question.pari === true && (
            <p className={styles.etapePari}>
              {etape === 'soi'
                ? UI.jeu.pariSoi
                : UI.jeu.pariAutre.replace('{nom}', nomDe(autre))}
            </p>
          )}
          {voixHaute ? (
            /*
             * On ne passe pas par `Saisie` ici : la mécanique « à voix haute »
             * n'a rien à saisir, elle n'affiche qu'une consigne — et c'est
             * précisément cette consigne qui doit changer quand la voix passe
             * par un appel plutôt que par la table.
             */
            <p className={styles.consigneDistance}>{TEXTES.jeu.aVoixHaute}</p>
          ) : (
            <Saisie
              /* La clé sépare les deux brouillons : passer au second temps remet
                 la mécanique à zéro plutôt que de traîner sa propre réponse. */
              key={etape}
              question={question}
              valeur={brouillon}
              onChange={setBrouillon}
              flipped={false}
              reducedMotion={reduced}
            />
          )}
          <div className={styles.options}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFort}`}
              disabled={!complet || envoi}
              onClick={() => {
                if (question.pari === true && etape === 'soi') {
                  setEtape('autre')
                  return
                }
                void envoyer(
                  pourSoi,
                  false,
                  question.pari === true ? pourAutre : undefined,
                )
              }}
            >
              {question.pari === true && etape === 'soi'
                ? UI.jeu.pariSuivant
                : voixHaute
                  ? TEXTES.jeu.cestDit
                  : UI.jeu.valider}
            </button>
          </div>
          <button
            type="button"
            className={styles.passer}
            disabled={envoi}
            onClick={() => void envoyer(null, true)}
          >
            {UI.jeu.passer}
          </button>
        </>
      )}

      {phase === 'attente' && <p className={styles.attente}>{UI.jeu.attente}</p>}

      {/* En vol : la ligne s'éclaire, et on n'écrit rien. */}
      {phase === 'en-vol' && <p className={styles.sous}>&nbsp;</p>}

      {phase === 'revelee' && revelation && cote && (
        <div className={styles.rev}>
          <Revelation
            question={question}
            nomMoi={nomDe(cote)}
            nomAutre={nomDe(autre)}
            moi={enReponse(cote === 'a' ? revelation.a : revelation.b)}
            autre={enReponse(cote === 'a' ? revelation.b : revelation.a)}
            passeeLabel={UI.jeu.passee}
          />
          {question.pari === true && (
            <EcartPari
              question={question}
              nomAutre={nomDe(autre)}
              moi={enReponse(cote === 'a' ? revelation.a : revelation.b)}
              autre={enReponse(cote === 'a' ? revelation.b : revelation.a)}
            />
          )}
        </div>
      )}

      {refus !== null && <p className={styles.passee}>{refus}</p>}
    </>
  )
}

export default function Jeu({ lien, question }: { lien: Lien; question: Question }) {
  const { etat } = lien
  if (!etat) return null
  // La clé remet le brouillon à zéro entre deux questions.
  return <QuestionEnCours key={question.id} lien={lien} question={question} index={etat.index} />
}
