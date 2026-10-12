'use client'

import { useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'

interface RacineProps {
  className: string
  style: CSSProperties
  children: ReactNode
}

const abonner = () => () => {}

/**
 * Racine `.g2g` de l'expérience. `data-js` n'est posé que par React une fois le composant monté
 * dans le navigateur (useSyncExternalStore : `false` au rendu serveur et à l'hydratation, `true`
 * dès que le client rend), donc par tout chemin d'arrivée (URL directe, tuile du portfolio,
 * navigation interne, retour et avance) : le CSS montre alors les commandes du lecteur. Sans
 * JavaScript, rien ne monte et la barre statique du lecteur, dans un `<noscript>`, est rendue par le
 * navigateur lui-même. Aucun script en ligne : une balise `<script>` rendue par React au cours d'une
 * navigation côté client n'est pas exécutée (bloc 7.3b). La classe du document réserve la place du
 * skin collant au focus (scroll-padding) tant que l'expérience est montée.
 */
export default function Racine({ className, style, children }: RacineProps) {
  const monte = useSyncExternalStore(
    abonner,
    () => true,
    () => false,
  )

  useEffect(() => {
    document.documentElement.classList.add('g2g-document')
    return () => {
      document.documentElement.classList.remove('g2g-document')
    }
  }, [])

  return (
    <div className={className} lang="fr" id="haut" tabIndex={-1} style={style} data-js={monte ? '' : undefined}>
      {children}
    </div>
  )
}
