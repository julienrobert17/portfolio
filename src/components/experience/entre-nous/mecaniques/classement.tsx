'use client'

import { useCallback, useEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from 'react'
import { versConteneur } from './espace-conteneur'

export interface ClassementProps {
  /** Les cartes, dans l'ordre courant. Composant contrôlé. */
  ordre: readonly string[]
  /** Appelé avec le nouvel ordre complet à chaque réordonnancement. */
  onChange: (ordre: string[]) => void
  /** Vrai si le conteneur parent est pivoté à 180°. */
  flipped: boolean
  /** Si vrai : pas de transition, réordonnancement instantané. */
  reducedMotion: boolean
  /** Classes fournies par l'appelant. Toutes optionnelles. */
  classes: {
    liste?: string
    carte?: string
    carteActive?: string
    poignee?: string
    rang?: string
    boutons?: string
    bouton?: string
  }
  /** Étiquette accessible de la liste, ex. « Classe ces 4 cartes ». */
  ariaLabel: string
}

/** Position d'une carte dans l'espace conteneur (non pivoté). */
interface Fente {
  haut: number
  hauteur: number
}

interface EtatGlisse {
  pointerId: number
  /** Carte saisie, identifiée par sa valeur (les cartes sont uniques). */
  id: string
  depuis: number
  cible: number
  /** Delta vertical DÉJÀ converti en espace conteneur. */
  dy: number
  departX: number
  departY: number
  fentes: readonly Fente[]
  /** Ordre au moment de la saisie, pour détecter un changement externe. */
  ids: readonly string[]
}

const DUREE = 180

function cx(...valeurs: readonly (string | false | undefined)[]): string | undefined {
  const s = valeurs.filter((v): v is string => typeof v === 'string' && v.length > 0).join(' ')
  return s.length > 0 ? s : undefined
}

/** Déplace un élément d'un index à un autre, sans muter l'entrée. */
function deplacerElement(liste: readonly string[], depuis: number, vers: number): string[] {
  const copie = [...liste]
  const [element] = copie.splice(depuis, 1)
  copie.splice(vers, 0, element)
  return copie
}

/**
 * Index visé par la carte saisie, en espace conteneur.
 * On compare le centre de la carte tirée aux centres des fentes voisines.
 */
function indexCible(fentes: readonly Fente[], depuis: number, dy: number): number {
  const n = fentes.length
  const centre = fentes[depuis].haut + fentes[depuis].hauteur / 2 + dy
  let cible = depuis
  while (cible < n - 1) {
    const suivante = fentes[cible + 1]
    if (centre <= suivante.haut + suivante.hauteur / 2) break
    cible += 1
  }
  while (cible > 0) {
    const precedente = fentes[cible - 1]
    if (centre >= precedente.haut + precedente.hauteur / 2) break
    cible -= 1
  }
  return cible
}

/**
 * Décalage à appliquer à chaque carte pour montrer l'emplacement visé.
 * On rejoue la mise en page dans l'ordre prévisualisé, gouttière comprise.
 */
function decalages(fentes: readonly Fente[], depuis: number, cible: number): number[] {
  const n = fentes.length
  const gouttiere = n > 1 ? fentes[1].haut - (fentes[0].haut + fentes[0].hauteur) : 0
  const indices = deplacerElement(
    fentes.map((_, i) => String(i)),
    depuis,
    cible,
  ).map(Number)
  const resultat = new Array<number>(n).fill(0)
  let y = fentes[0].haut
  for (const i of indices) {
    resultat[i] = y - fentes[i].haut
    y += fentes[i].hauteur + gouttiere
  }
  return resultat
}

export default function Classement({
  ordre,
  onChange,
  flipped,
  reducedMotion,
  classes,
  ariaLabel,
}: ClassementProps): JSX.Element {
  const [glisse, setGlisse] = useState<EtatGlisse | null>(null)
  const [sansAnim, setSansAnim] = useState(false)
  const [annonce, setAnnonce] = useState('')

  // Miroir synchrone de l'état de glisser : les événements pointeur peuvent
  // s'enchaîner avant un rendu, la ref reste toujours à jour.
  const glisseRef = useRef<EtatGlisse | null>(null)
  const cartesRef = useRef<Map<string, HTMLLIElement>>(new Map())
  const rafRef = useRef(0)
  const focusRef = useRef<{ id: string; sens: number } | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== 0) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Après un déplacement au clavier, on rend le focus au bouton équivalent.
  useEffect(() => {
    const vise = focusRef.current
    if (vise === null) return
    focusRef.current = null
    const carte = cartesRef.current.get(vise.id)
    if (!carte) return
    const boutons = carte.querySelectorAll('button')
    const prefere = vise.sens < 0 ? boutons[0] : boutons[1]
    const repli = vise.sens < 0 ? boutons[1] : boutons[0]
    const choisi = prefere && !prefere.disabled ? prefere : repli
    if (choisi && !choisi.disabled) choisi.focus()
  }, [ordre])

  const majGlisse = useCallback((valeur: EtatGlisse | null) => {
    glisseRef.current = valeur
    setGlisse(valeur)
  }, [])

  /**
   * Mesure les cartes en espace conteneur.
   * `offsetTop`/`offsetHeight` sont des valeurs de mise en page : contrairement
   * à `getBoundingClientRect()`, elles ignorent le `rotate(180deg)` du parent.
   * C'est exactement l'espace dans lequel on veut raisonner.
   */
  const mesurer = useCallback((): Fente[] => {
    const fentes: Fente[] = []
    for (const id of ordre) {
      const el = cartesRef.current.get(id)
      if (!el) return []
      fentes.push({ haut: el.offsetTop, hauteur: el.offsetHeight })
    }
    return fentes
  }, [ordre])

  const surSaisie = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>, carte: string, index: number) => {
      if (glisseRef.current !== null) return // un glisser est déjà en cours
      /*
       * Surtout PAS de garde `event.isPrimary` ici. L'appareil est unique et
       * les deux moitiés jouent en même temps : le second doigt posé sur
       * l'écran n'est jamais primaire, et cette garde aurait purement et
       * simplement annulé le glisser de la deuxième personne. La ligne
       * ci-dessus suffit — elle est locale à cette liste, donc chaque moitié
       * garde son propre glisser.
       */
      if (event.target instanceof Element && event.target.closest('button') !== null) return
      const fentes = mesurer()
      if (fentes.length !== ordre.length || fentes.length === 0) return
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointeur déjà relâché : on continue sans capture.
      }
      event.preventDefault()
      majGlisse({
        pointerId: event.pointerId,
        id: carte,
        depuis: index,
        cible: index,
        dy: 0,
        departX: event.clientX,
        departY: event.clientY,
        fentes,
        ids: [...ordre],
      })
    },
    [majGlisse, mesurer, ordre],
  )

  const surDeplacement = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      const actuel = glisseRef.current
      if (actuel === null || actuel.pointerId !== event.pointerId) return
      const { dy } = versConteneur(event.clientX - actuel.departX, event.clientY - actuel.departY, flipped)
      if (dy === actuel.dy) return
      majGlisse({ ...actuel, dy, cible: indexCible(actuel.fentes, actuel.depuis, dy) })
    },
    [flipped, majGlisse],
  )

  const surRelache = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      const actuel = glisseRef.current
      if (actuel === null || actuel.pointerId !== event.pointerId) return
      majGlisse(null)

      // Le décalage passe du transform à la mise en page : on saute une frame
      // d'animation pour éviter le double mouvement.
      if (!reducedMotion) {
        setSansAnim(true)
        if (rafRef.current !== 0) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0
          setSansAnim(false)
        })
      }

      if (actuel.cible === actuel.depuis) return
      // On repart de l'index courant : `ordre` a pu changer pendant le glisser.
      const depuis = ordre.indexOf(actuel.id)
      if (depuis === -1) return
      const cible = Math.min(Math.max(actuel.cible, 0), ordre.length - 1)
      if (cible === depuis) return
      onChange(deplacerElement(ordre, depuis, cible))
    },
    [majGlisse, onChange, ordre, reducedMotion],
  )

  const deplacer = useCallback(
    (index: number, sens: number) => {
      if (glisseRef.current !== null) return
      const cible = index + sens
      if (cible < 0 || cible >= ordre.length) return
      const carte = ordre[index]
      focusRef.current = { id: carte, sens }
      setAnnonce(`${carte}, position ${cible + 1} sur ${ordre.length}`)
      onChange(deplacerElement(ordre, index, cible))
    },
    [onChange, ordre],
  )

  // L'aperçu n'est valable que si l'ordre n'a pas bougé depuis la saisie.
  const coherent =
    glisse !== null && glisse.ids.length === ordre.length && glisse.ids.every((id, i) => id === ordre[i])
  const decals = coherent && glisse !== null ? decalages(glisse.fentes, glisse.depuis, glisse.cible) : null
  const transition = reducedMotion || sansAnim ? 'none' : `transform ${DUREE}ms ease`

  return (
    <>
      <ol className={classes.liste} aria-label={ariaLabel}>
        {ordre.map((carte, index) => {
          const actif = coherent && glisse !== null && glisse.depuis === index
          const dy = actif && glisse !== null ? glisse.dy : decals !== null ? decals[index] : 0
          return (
            <li
              key={carte}
              ref={(el) => {
                if (el) cartesRef.current.set(carte, el)
                else cartesRef.current.delete(carte)
              }}
              className={cx(classes.carte, actif && classes.carteActive)}
              style={{
                // Le navigateur ne doit pas confisquer le geste pour scroller.
                touchAction: 'none',
                position: 'relative',
                zIndex: actif ? 2 : 1,
                userSelect: glisse !== null ? 'none' : undefined,
                transform: dy !== 0 ? `translate3d(0, ${dy}px, 0)` : undefined,
                transition: actif ? 'none' : transition,
              }}
              onPointerDown={(event) => surSaisie(event, carte, index)}
              onPointerMove={surDeplacement}
              onPointerUp={surRelache}
              onPointerCancel={surRelache}
              onLostPointerCapture={surRelache}
            >
              <span className={classes.rang} aria-hidden="true">
                {index + 1}
              </span>
              <span className={classes.poignee} aria-hidden="true" />
              <span>{carte}</span>
              <span className={classes.boutons}>
                {/* Les glyphes pivotent avec le conteneur : ils restent justes
                    pour la personne d'en face, aucune inversion à faire ici. */}
                <button
                  type="button"
                  className={classes.bouton}
                  disabled={index === 0}
                  aria-label={`Monter ${carte}`}
                  onClick={() => deplacer(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={classes.bouton}
                  disabled={index === ordre.length - 1}
                  aria-label={`Descendre ${carte}`}
                  onClick={() => deplacer(index, 1)}
                >
                  ↓
                </button>
              </span>
            </li>
          )
        })}
      </ol>
      {/* Annonce clavier uniquement — pas de classe fournie pour ce masquage. */}
      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {annonce}
      </div>
    </>
  )
}
