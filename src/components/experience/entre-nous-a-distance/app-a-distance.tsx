'use client'

import { useState } from 'react'
import styles from './salon.module.css'
import PanneauDebug from './debug/panneau'
import { useLien } from './use-lien'
import { NOMS } from '../entre-nous/content'

/**
 * Ce que l'utilisateur lit quand le lien est en peine.
 *
 * Trois seuils, parce qu'une coupure d'une seconde ne mérite pas un mot et
 * qu'une coupure de trente en mérite un clair. En dessous de trois secondes on
 * ne dit RIEN : la plupart des coupures durent ça, et les annoncer
 * transformerait un réseau normal en expérience anxieuse.
 */
function motDuLien(etat: string, panneDepuisMs: number | null): string {
  if (etat === 'ouvert' || panneDepuisMs === null) return ''
  if (panneDepuisMs < 3000) return ''
  if (panneDepuisMs < 15000) return 'La ligne est coupée. Ça revient tout seul.'
  return 'Toujours pas de lien. Regarde le wifi — rien n’est perdu.'
}

export default function AppADistance() {
  const lien = useLien()
  const { etat, cote, lien: info } = lien
  const [nom, setNom] = useState<string>(NOMS.a)
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  /*
   * `?debug=1` comme ailleurs dans le dépôt, `?salle=KRTB` pré-remplit le
   * code — le lien partageable n'est que ce sucre-là, l'appairage reste le
   * code à quatre lettres.
   *
   * Lu dans un initialiseur paresseux et non dans un effet : le composant est
   * rendu sans SSR, l'URL est donc disponible au premier rendu, et un
   * `setState` dans un effet déclencherait un second rendu pour rien.
   */
  const [debug] = useState(() => new URLSearchParams(window.location.search).get('debug') === '1')
  const [code, setCode] = useState(() =>
    (new URLSearchParams(window.location.search).get('salle') ?? '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4),
  )

  const entrer = async (avecCode?: string) => {
    setErreur(null)
    setOccupe(true)
    const r = await lien.entrer(nom, avecCode)
    setOccupe(false)
    if ('erreur' in r && r.erreur) setErreur(r.erreur)
  }

  const note = motDuLien(info.etat, info.panneDepuisMs)

  // ── Le salon : on n'a pas encore de salle ──
  if (!etat) {
    return (
      <>
        <div className={styles.plein}>
          <h1 className={styles.titre}>Chacun son téléphone.</h1>
          <p className={styles.sous}>
            L’un ouvre une salle, l’autre entre le code. Vous pouvez être dans la même pièce
            ou pas.
          </p>

          <div className={styles.options}>
            {(['a', 'b'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.btn} ${nom === NOMS[c] ? styles.choisi : ''}`}
                onClick={() => setNom(NOMS[c])}
              >
                je suis {NOMS[c]}
              </button>
            ))}
          </div>

          <div className={styles.options}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFort}`}
              disabled={occupe}
              onClick={() => void entrer()}
            >
              Ouvrir une salle
            </button>
          </div>

          <p className={styles.sous}>ou</p>

          <input
            className={styles.code}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            placeholder="CODE"
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Code de la salle, quatre lettres"
          />
          <div className={styles.options}>
            <button
              type="button"
              className={styles.btn}
              disabled={code.length !== 4 || occupe}
              onClick={() => void entrer(code)}
            >
              Rejoindre
            </button>
          </div>

          {erreur !== null && <p className={styles.erreur}>{erreur}</p>}
        </div>
        {debug && <PanneauDebug lien={lien} />}
      </>
    )
  }

  // ── La salle : l'écran nu de la première tranche ──
  const lienEnPeine = info.etat !== 'ouvert'
  return (
    <>
      <div className={styles.plein}>
        <p className={styles.sous}>votre code</p>
        <p className={styles.codeGrand}>{etat.code}</p>

        <div className={`${styles.ligne} ${lienEnPeine ? styles.ligneCoupee : ''}`} />
        <p className={styles.note}>{note}</p>

        <div className={styles.places}>
          {(['a', 'b'] as const).map((c) => {
            const place = etat.places.find((p) => p.cote === c)
            return (
              <span key={c} className={styles.place}>
                <span className={`${styles.pastille} ${place?.present ? styles.present : ''}`} />
                <span className={styles.nomPlace}>
                  {place ? place.nom : 'libre'}
                  {c === cote ? ' · toi' : ''}
                </span>
              </span>
            )
          })}
        </div>

        <p className={styles.sous}>
          phase « {etat.phase} » · version {etat.version}
        </p>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnFort}`}
            onClick={() => void lien.agir('phase', { phase: etat.phase === 'lobby' ? 'jeu' : 'couture' })}
          >
            Faire avancer la phase
          </button>
        </div>
        <p className={styles.sous}>
          Touche ce bouton d’un téléphone : l’autre doit bouger sans rien faire.
        </p>
      </div>
      {debug && <PanneauDebug lien={lien} />}
    </>
  )
}
