import type { Metadata } from 'next'
import { archivo, marker } from '@/components/experience/groove-to-grave/polices'
import { couleurs as tokens, variablesCss } from '@/components/experience/groove-to-grave/tokens'
import { CassetteSvg } from '@/components/experience/groove-to-grave/ui/cassette-svg'
import { couleursCassette } from '@/components/experience/groove-to-grave/ui/cassette'
import { chargerContenu, getSortie } from '@/components/experience/groove-to-grave/sanity/contenu'
import { Monogramme } from '@/components/experience/groove-to-grave/ui/logos/logo'
import '@/components/experience/groove-to-grave/styles/g2g.css'

export const metadata: Metadata = {
  title: 'Tuile Groove To Grave Records',
  robots: { index: false, follow: false },
}

/**
 * Page de rendu de la tuile du carrousel du portfolio, hors navigation (aucun lien n'y mène,
 * noindex) : la scène de 1000 × 1000 px (papier du mur, deux lambeaux, monogramme, cassette
 * GTGR05, sticker) avec les vraies polices, capturée en Chrome headless par
 * scripts/g2g-tuile.ts et exportée en AVIF et WebP. Remplace l'ancien SVG, qui ne pouvait pas
 * charger Permanent Marker une fois chargé comme image (bloc 7.1b). Hors du layout de
 * l'expérience : pas de lecteur ni de pied de page.
 */
export default async function TuilePage() {
  const { sorties } = await chargerContenu()
  const c = couleursCassette(getSortie(sorties, 'gtgr05')?.couleurs)
  return (
    <div className={`g2g ${archivo.variable} ${marker.variable}`} lang="fr" style={{ ...variablesCss(), minHeight: 0, overflow: 'hidden' }}>
      <div
        id="tuile"
        style={{ position: 'relative', width: 1000, height: 1000, overflow: 'hidden', backgroundImage: 'url(/experience/groove-to-grave/mur-1920.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', left: 610, top: 40, width: 300, height: 130, background: tokens.lambeauRouge, transform: 'rotate(-4deg)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: 40, top: 330, width: 220, height: 110, background: tokens.lambeauVert, transform: 'rotate(3deg)' }} />
        <Monogramme style={{ position: 'absolute', left: 70, top: 60, height: 150, width: 'auto', color: tokens.ink }} />
        <div className="g2g-cassette" style={{ position: 'absolute', left: 210, top: 230, width: 580, transform: 'rotate(-3deg)' }}>
          <CassetteSvg coque={c.coque} etiquette={tokens.poster} bande={c.bande} texteBande={c.texteBande} reference="GTGR05" ligne1="Groove To Grave" ligne2="du sillon à la tombe" />
        </div>
        <span className="g2g-sticker g2g-sticker--vert" aria-hidden="true" style={{ position: 'absolute', left: 620, top: 183, transform: 'rotate(8deg)', fontSize: 18, padding: '6px 16px' }}>
          no repress
        </span>
      </div>
    </div>
  )
}
