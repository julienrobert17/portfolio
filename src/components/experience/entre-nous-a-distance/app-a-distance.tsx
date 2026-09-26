'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './salon.module.css'
import PanneauDebug from './debug/panneau'
import Jeu from './jeu'
import Fin from './fin'
import { useLien } from './use-lien'
import { NOMS } from '../entre-nous/content'
import { BANQUE } from '../entre-nous/questions/pool'
import { PERSO } from '../entre-nous/questions/perso'
import { buildRun } from '../entre-nous/build-run'
import { BUILD, empreinteDuDeroule } from './empreinte'
import { TEXTES } from './content'

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
  if (panneDepuisMs < 15000) return TEXTES.lien.coupe
  return TEXTES.lien.coupeLongtemps
}

/**
 * Ce que le mode à distance retire. Le tir à la corde suppose deux mains sur
 * le même écran : à distance, la question est rabattue sur un curseur et
 * reformulée, pas supprimée.
 */
const A_DISTANCE = { aDistance: true } as const

export default function AppADistance() {
  const lien = useLien()
  const { etat, cote, lien: info } = lien
  const [nom, setNom] = useState<string>(NOMS.a)
  const [erreur, setErreur] = useState<string | null>(null)
  const [desaccord, setDesaccord] = useState<{
    jeSuisEnRetard: boolean | null
  } | null>(null)
  const [occupe, setOccupe] = useState(false)
  /** Levier de debug : fausse volontairement l'empreinte envoyée. */
  const [fausserEmpreinte, setFausserEmpreinte] = useState(false)

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

  /*
   * L'empreinte est calculée sur une graine FIXE, pas sur celle de la salle :
   * au moment de rejoindre on ne la connaît pas encore, et on veut de toute
   * façon comparer les codes, pas les tirages. Deux clients identiques
   * produisent la même empreinte ; deux clients différents non, quelle que
   * soit la salle.
   */
  const monEmpreinte = useMemo(() => {
    const temoin = buildRun(BANQUE, PERSO.questions, 'témoin', A_DISTANCE)
    return empreinteDuDeroule(temoin)
  }, [])

  /*
   * Reprise automatique après un rechargement.
   *
   * Ce n'est pas un confort : iOS peut évincer la page pendant une veille
   * longue, et se retrouver devant un champ « CODE » au milieu d'une partie
   * parce qu'on a posé son téléphone — ce que l'expérience demande — serait
   * le contraire d'un chemin nominal. On revient à sa place tout seul, la
   * place étant un bail attaché au client.
   */
  const repriseTentee = useRef(false)
  useEffect(() => {
    if (repriseTentee.current || etat !== null || lien.salleMemorisee === null) return
    repriseTentee.current = true
    // Le prénom vient de la mémoire, pas du salon : sinon on revient à sa
    // place sous le nom par défaut, c'est-à-dire sous celui de l'autre.
    void lien.entrer(lien.salleMemorisee.nom, lien.salleMemorisee.code, monEmpreinte, BUILD)
  }, [etat, lien, monEmpreinte])

  const entrer = async (avecCode?: string) => {
    setErreur(null)
    setDesaccord(null)
    setOccupe(true)
    const envoyee = fausserEmpreinte ? `${monEmpreinte}-FAUSSE` : monEmpreinte
    const r = await lien.entrer(nom, avecCode, envoyee, BUILD)
    setOccupe(false)
    if ('erreur' in r && r.erreur) {
      setErreur(r.erreur)
      if ('desaccord' in r && r.desaccord) setDesaccord(r.desaccord)
    }
  }

  const note = motDuLien(info.etat, info.panneDepuisMs)

  /*
   * Le déroulé est calculé ICI, une seule fois, à partir de la graine de la
   * salle. Le serveur ne transmet jamais les questions — les deux clients les
   * recalculent, ce qui suppose qu'ils font tourner le même code.
   */
  const run = useMemo(
    () => (etat ? buildRun(BANQUE, PERSO.questions, etat.graine, A_DISTANCE) : null),
    [etat],
  )
  const question = run && etat ? (run.questions[etat.index] ?? null) : null

  // ── Le salon : on n'a pas encore de salle ──
  if (!etat) {
    return (
      <>
        <div className={styles.plein}>
          <h1 className={styles.titre}>{TEXTES.salon.titre}</h1>
          <p className={styles.sous}>{TEXTES.salon.sous}</p>

          <div className={styles.options}>
            {(['a', 'b'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.btn} ${nom === NOMS[c] ? styles.choisi : ''}`}
                onClick={() => setNom(NOMS[c])}
              >
                {TEXTES.salon.jeSuis.replace('{nom}', NOMS[c])}
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
              {TEXTES.salon.ouvrir}
            </button>
          </div>

          <p className={styles.sous}>{TEXTES.salon.ou}</p>

          <input
            className={styles.code}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            placeholder={TEXTES.salon.codePlaceholder}
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label={TEXTES.salon.codeAide}
          />
          <div className={styles.options}>
            <button
              type="button"
              className={styles.btn}
              disabled={code.length !== 4 || occupe}
              onClick={() => void entrer(code)}
            >
              {TEXTES.salon.rejoindre}
            </button>
          </div>

          {erreur !== null && (
            <>
              <p className={styles.erreur}>{erreur}</p>
              {desaccord !== null && (
                <p className={styles.sous}>
                  {desaccord.jeSuisEnRetard === true
                    ? TEXTES.empreinte.jeSuisEnRetard
                    : desaccord.jeSuisEnRetard === false
                      ? TEXTES.empreinte.autreEnRetard
                      : TEXTES.empreinte.indecidable}
                </p>
              )}
              {desaccord !== null && (
                <div className={styles.options}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnFort}`}
                    onClick={() => window.location.reload()}
                  >
                    {TEXTES.empreinte.recharger}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {debug && (
          <PanneauDebug
            lien={lien}
            empreinte={monEmpreinte}
            fausse={fausserEmpreinte}
            setFausse={setFausserEmpreinte}
          />
        )}
      </>
    )
  }

  // ── L'intercalaire du retour, s'il y a quelque chose à raconter ──
  if (lien.retour !== null && etat.phase !== 'lobby') {
    const questionABouge = lien.retour.index !== etat.index
    return (
      <>
        <div className={styles.plein}>
          <h1 className={styles.titre}>{TEXTES.retour.titre}</h1>
          <p className={styles.sous}>
            {questionABouge ? TEXTES.retour.questionChangee : TEXTES.retour.phaseChangee}
          </p>
          <div className={styles.options}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFort}`}
              onClick={lien.oublierRetour}
            >
              {TEXTES.retour.reprendre}
            </button>
          </div>
        </div>
        {debug && (
          <PanneauDebug
            lien={lien}
            empreinte={monEmpreinte}
            fausse={fausserEmpreinte}
            setFausse={setFausserEmpreinte}
          />
        )}
      </>
    )
  }

  // ── La fin, en trois temps : elle prend l'écran entier ──
  if (etat.phase === 'couture' || etat.phase === 'ordre' || etat.phase === 'derniere') {
    return (
      <>
        {run !== null && <Fin lien={lien} run={run} phase={etat.phase} />}
        {debug && (
          <PanneauDebug
            lien={lien}
            empreinte={monEmpreinte}
            fausse={fausserEmpreinte}
            setFausse={setFausserEmpreinte}
          />
        )}
      </>
    )
  }

  // ── La salle ──
  const lienEnPeine = info.etat !== 'ouvert'
  const enJeu = etat.phase === 'jeu'
  /*
   * La ligne dit trois choses avec une seule forme : pleine quand tout va
   * bien, amincie et respirante quand le lien tombe, vive et courte quand la
   * révélation est en vol. Un seul objet, trois lectures — c'est la seule
   * chose qui traverse toute l'expérience, autant qu'elle porte l'information.
   */
  const revelationEnVol =
    enJeu && question !== null && lien.etatQuestion(question.id) === 'en-vol'
  /* Pendant une question parlée, poser son téléphone est ce qu'on demande. */
  const questionParlee = enJeu && question?.mecanique === 'a-voix-haute'
  /* Après la dernière, « suivante » n'a plus de sens : on entre dans la fin. */
  const derniereQuestion =
    question === null || run === null || etat.index + 1 >= run.questions.length

  return (
    <>
      <div className={styles.plein}>
        {!enJeu && (
          <>
            <p className={styles.sous}>{TEXTES.salon.votreCode}</p>
            <p className={styles.codeGrand}>{etat.code}</p>
          </>
        )}

        <div
          className={`${styles.ligne} ${lienEnPeine ? styles.ligneCoupee : ''} ${
            revelationEnVol ? styles.ligneVive : ''
          }`}
        />
        <p className={styles.note}>{note}</p>

        {/*
         * LA PRÉSENCE, ET POURQUOI ELLE EN DIT MOINS ICI QU'EN PRÉSENTIEL.
         *
         * En face à face, l'indicateur apporte une information qu'on n'a pas :
         * on voit la personne, pas sa moitié d'écran. En appel c'est l'inverse
         * — on l'ENTEND. Le canal de présence est déjà saturé par la voix, et
         * une phrase du genre « Mathilde s'est absentée » risquerait de
         * contredire ce qu'on entend à l'instant même. Un indicateur qui ment
         * de façon immédiatement vérifiable n'abîme pas que lui-même.
         *
         * D'où : une pastille qui s'éteint, aucune phrase, jamais. Sa seule
         * utilité réelle est d'expliquer pourquoi une révélation ne vient pas,
         * et pour ça un point terne suffit.
         *
         * Et rien du tout pendant une question parlée : l'écran éteint y est
         * l'état recherché, le signaler comme un problème serait à contresens.
         */}
        <div className={styles.places}>
          {(['a', 'b'] as const).map((c) => {
            const place = etat.places.find((p) => p.cote === c)
            const terne = !questionParlee && place?.present === false
            return (
              <span key={c} className={styles.place}>
                <span
                  className={`${styles.pastille} ${place && !terne ? styles.present : ''}`}
                />
                <span className={styles.nomPlace}>
                  {place ? place.nom : 'libre'}
                  {c === cote ? ' · toi' : ''}
                </span>
              </span>
            )
          })}
        </div>

        {enJeu ? (
          <>
            {question ? (
              <Jeu lien={lien} question={question} />
            ) : (
              <p className={styles.sous}>{TEXTES.jeu.finDuDeroule}</p>
            )}
            <div className={styles.options}>
              <button
                type="button"
                className={styles.btn}
                onClick={() =>
                  void (derniereQuestion
                    ? lien.agir('phase', { phase: 'couture' })
                    : lien.agir('index', { index: etat.index + 1 }))
                }
              >
                {derniereQuestion ? TEXTES.jeu.versLaFin : TEXTES.jeu.suivante}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.sous}>
              phase « {etat.phase} » · version {etat.version}
            </p>
            <div className={styles.options}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnFort}`}
                disabled={etat.places.length < 2}
                onClick={() => void lien.agir('phase', { phase: 'jeu' })}
              >
                {etat.places.length < 2 ? TEXTES.attente.bouton : TEXTES.attente.commencer}
              </button>
            </div>
            {/* Le seul instant où personne n'est pressé : on attend l'autre. */}
            <p className={styles.appelez}>{TEXTES.attente.appelez}</p>
          </>
        )}
      </div>
      {debug && (
        <PanneauDebug
          lien={lien}
          empreinte={monEmpreinte}
          fausse={fausserEmpreinte}
          setFausse={setFausserEmpreinte}
        />
      )}
    </>
  )
}
