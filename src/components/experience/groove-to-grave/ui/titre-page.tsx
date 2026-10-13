import type { CSSProperties, ReactNode } from 'react'
import { rotation } from '../lib/desordre'

interface TitrePageProps {
  children: ReactNode
  /** Texte brut du titre, pour décider de la rotation (une ligne seulement). */
  texte: string
  teinte?: 'poster' | 'rouge' | 'vert'
  /** Couleur du papier, quand elle vient du contenu (dominante d'un artiste, Phase 7.7). */
  couleur?: string
  /** Couleur du texte posé dessus : l'encre sur un papier clair, le papier sur un fond sombre (7.10). */
  encre?: string
  id?: string
  as?: 'h1' | 'h2'
}

/** Au-delà de cette longueur, le titre passe sur deux lignes à 1440 px : il ne tourne pas. */
const UNE_LIGNE = 11

/**
 * Titre de page sur une bande de papier collée au scotch : Archivo condensé 900, capitales,
 * clamp(64px, 11vw, 168px), rotation déterministe de 1,5° au plus seulement s'il tient sur une
 * ligne (brief, passe de direction 2.1).
 */
export default function TitrePage({ children, texte, teinte = 'poster', couleur, encre, id, as = 'h1' }: TitrePageProps) {
  const Balise = as
  const rot = texte.length <= UNE_LIGNE ? rotation(texte, 1.5) : 0
  const classe = `g2g-bande-titre${teinte === 'rouge' ? ' g2g-bande-titre--rouge' : teinte === 'vert' ? ' g2g-bande-titre--vert' : ''}`
  return (
    <Balise id={id} className="g2g-affiche g2g-titre-page">
      <span className={classe} style={{ '--rot-base': `${rot}deg`, ...(couleur ? { '--papier-affiche': couleur } : {}),
          ...(encre ? { '--encre-affiche': encre } : {}) } as CSSProperties}>
        {children}
      </span>
    </Balise>
  )
}
