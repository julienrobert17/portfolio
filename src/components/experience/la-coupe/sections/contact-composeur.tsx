'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { site } from '../content/site'
import styles from './contact-composeur.module.css'

type Copie = 'repos' | 'copie' | 'echec'

/** Durée d'affichage du retour de copie, en millisecondes. */
const RETOUR = 2400
/** Révélation verticale du sujet ; doit valoir la durée de l'animation CSS. */
const DEFILE = 300
/** Le champ suit la saisie, entre ces bornes (en ch). */
const NOM_MIN = 9
const NOM_MAX = 22

const { email, composeur } = site.contact
const TYPES = composeur.types

/** Corps du message : la phrase telle qu'elle est lue, signée si le nom est donné. */
function corpsDe(objet: string, nom: string): string {
  const signature = nom.trim()
  if (!signature) return composeur.phraseSansNom.replace('{objet}', objet)
  return `${composeur.phrase.debut}${signature}${composeur.phrase.milieu}${objet}${composeur.phrase.fin}`
}

/** Lien mailto (RFC 6068 : fins de ligne CRLF). */
const versMailto = (sujet: string, corps: string) =>
  `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`

/**
 * La phrase est le message : « Bonjour, je m’appelle [nom] et je vous écris au
 * sujet d’[une maison]. » Le nom est un champ en ligne dont la largeur suit la
 * saisie ; le sujet est un bouton qui fait défiler les quatre valeurs, à la
 * souris comme aux flèches haut et bas, avec une révélation verticale de
 * 300 ms. Le lien mailto se reconstruit à chaque frappe. Le HTML servi porte
 * déjà la phrase et son lien : sans JavaScript, le bouton cède la place au
 * sujet par défaut en texte, et le mailto fonctionne tel quel.
 */
export default function ContactComposeur() {
  const [index, setIndex] = useState(0)
  /** Valeur qui s'en va, le temps de la révélation, avec le sens du défilement. */
  const [sortante, setSortante] = useState<{ objet: string; sens: 1 | -1 } | null>(null)
  const [nom, setNom] = useState('')
  const [copie, setCopie] = useState<Copie>('repos')
  const minuteurCopie = useRef<number | null>(null)
  const minuteurDefile = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (minuteurCopie.current !== null) window.clearTimeout(minuteurCopie.current)
      if (minuteurDefile.current !== null) window.clearTimeout(minuteurDefile.current)
    },
    [],
  )

  const type = TYPES[index]
  const corps = corpsDe(type.objet, nom)
  const href = versMailto(type.sujet, corps)

  const defiler = (sens: 1 | -1) => {
    setSortante({ objet: type.objet, sens })
    setIndex((i) => (i + sens + TYPES.length) % TYPES.length)
    if (minuteurDefile.current !== null) window.clearTimeout(minuteurDefile.current)
    minuteurDefile.current = window.setTimeout(() => setSortante(null), DEFILE)
  }

  const auClavier = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    defiler(e.key === 'ArrowDown' ? 1 : -1)
  }

  const copier = async () => {
    let resultat: Copie = 'copie'
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      resultat = 'echec'
    }
    setCopie(resultat)
    if (minuteurCopie.current !== null) window.clearTimeout(minuteurCopie.current)
    minuteurCopie.current = window.setTimeout(() => setCopie('repos'), RETOUR)
  }

  /** Entrée dans le champ nom : ouvre le message, comme le lien. */
  const envoyer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.location.href = href
  }

  const largeur = Math.min(NOM_MAX, Math.max(NOM_MIN, nom.length + 1))

  return (
    <form className={styles.composeur} onSubmit={envoyer}>
      <p className={`lc-display ${styles.phrase}`}>
        {composeur.phrase.debut}
        <span className={styles.champ}>
          <label htmlFor="lc-nom" className="lc-visually-hidden">
            {composeur.nom}
          </label>
          <input
            id="lc-nom"
            name="nom"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder={composeur.placeholder}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            style={{ width: `${largeur}ch` }}
            className={styles.saisie}
          />
        </span>
        {composeur.phrase.milieu}
        <button
          type="button"
          className={styles.sujet}
          aria-label={composeur.changerSujet}
          onClick={() => defiler(1)}
          onKeyDown={auClavier}
          data-js-seul
        >
          {/* Hauteur d'une ligne, débord masqué : l'ancienne valeur sort, la nouvelle entre. */}
          <span className={styles.fenetre}>
            <span className={styles.valeur} data-sens={sortante?.sens} key={type.objet}>
              {type.objet}
            </span>
            {sortante && (
              <span className={`${styles.valeur} ${styles.sortante}`} data-sens={sortante.sens} aria-hidden="true">
                {sortante.objet}
              </span>
            )}
          </span>
        </button>
        {/* Sans JavaScript, le bouton ne servirait à rien : la feuille du <noscript> l'échange contre ce texte. */}
        <span className={`${styles.sujet} ${styles.sujetStatique}`} data-sans-js>
          {TYPES[0].objet}
        </span>
        {composeur.phrase.fin}
      </p>
      <p role="status" aria-live="polite" className="lc-visually-hidden">
        {composeur.sujetCourant.replace('{objet}', type.objet)}
      </p>

      <div className={styles.actions}>
        <a href={href} className={`lc-mono ${styles.ouvrir}`} data-magnetique>
          {composeur.ouvrir}
          <span aria-hidden="true"> →</span>
        </a>
        <button type="button" onClick={copier} className={`lc-mono ${styles.copier}`} data-etat={copie} data-js-seul>
          {composeur.copier}
        </button>
        <p role="status" aria-live="polite" className={`lc-mono ${styles.retour}`} data-etat={copie}>
          {copie === 'copie' ? composeur.copie : copie === 'echec' ? composeur.echec : ''}
        </p>
      </div>
      <p className={`lc-mono lc-muted ${styles.intro}`}>{composeur.intro}</p>
    </form>
  )
}
