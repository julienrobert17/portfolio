import { ImageResponse } from 'next/og'
import { geometrieMaquette, polygone, type TeinteFace } from '@/components/experience/la-coupe/canvas/maquette-faces'
import { site } from '@/components/experience/la-coupe/content/site'

/**
 * Image Open Graph de l'accueil, générée au build : titre en Instrument Sans,
 * ligne d'identité en Geist Mono, et la maquette du hero en axonométrie
 * (même géométrie que le SVG statique). Sans réseau au build, satori retombe
 * sur sa Geist Regular embarquée : l'image reste lisible, seule la graisse change.
 */
export const alt = `${site.nom} — ${site.hero.ligne}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Palette papier de la-coupe.css, en dur : satori ne résout pas les variables CSS. */
const PAPIER = '#f3f0ea'
const PAPIER_2 = '#e9e4dc'
const ENCRE = '#151412'
const ENCRE_2 = '#5c5853'
const FILET = '#c9c3b8'
const ACCENT = '#b5452d'

const FILLS: Record<TeinteFace, string> = { haut: PAPIER, est: PAPIER_2, sud: '#dcd5c9', ombre: FILET, coupe: '#b5452d' }

interface Police {
  name: string
  data: ArrayBuffer
  weight: 400 | 500
  style: 'normal'
}

/**
 * Récupère une police Google en TTF (satori ne lit pas le woff2) : l'API CSS v1
 * sans User-Agent renvoie des sources .ttf. Null si le réseau manque au build.
 */
async function policeGoogle(famille: string, poids: 400 | 500): Promise<Police | null> {
  try {
    const feuille = await fetch(`https://fonts.googleapis.com/css?family=${encodeURIComponent(famille)}:${poids}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!feuille.ok) return null
    const source = /src:\s*url\(([^)]+\.ttf)\)/.exec(await feuille.text())?.[1]
    if (!source) return null
    const fichier = await fetch(source, { signal: AbortSignal.timeout(8000) })
    if (!fichier.ok) return null
    return { name: famille, data: await fichier.arrayBuffer(), weight: poids, style: 'normal' }
  } catch {
    return null
  }
}

export default async function Image() {
  const polices = (await Promise.all([policeGoogle('Instrument Sans', 500), policeGoogle('Geist Mono', 400)])).filter(
    (p): p is Police => p !== null,
  )
  const { faces, viewBox, planCoupe } = geometrieMaquette()
  const largeurSvg = 470
  const hauteurSvg = Math.round((largeurSvg * viewBox.hauteur) / viewBox.largeur)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: PAPIER,
          color: ENCRE,
          padding: '56px 64px',
          fontFamily: "'Instrument Sans', geist, sans-serif",
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'flex', fontFamily: "'Geist Mono', geist, monospace", fontSize: 20, color: ENCRE_2, letterSpacing: 1 }}>
            {site.initiales} — {site.activite}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 76, fontWeight: 500, lineHeight: 1.04, letterSpacing: -1.5 }}>
            {site.hero.titre.map((ligne) => (
              <span key={ligne} style={{ whiteSpace: 'nowrap' }}>
                {ligne}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 96, height: 2, background: ACCENT, marginBottom: 20 }} />
            <div style={{ display: 'flex', fontFamily: "'Geist Mono', geist, monospace", fontSize: 23, color: ENCRE_2, letterSpacing: 1, whiteSpace: 'nowrap' }}>
              {site.hero.ligne}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: largeurSvg, marginLeft: 24 }}>
          <svg
            width={largeurSvg}
            height={hauteurSvg}
            viewBox={`${viewBox.minX.toFixed(2)} ${viewBox.minY.toFixed(2)} ${viewBox.largeur.toFixed(2)} ${viewBox.hauteur.toFixed(2)}`}
          >
            {faces.map((f, i) => (
              <polygon
                key={i}
                points={polygone(f.points)}
                fill={FILLS[f.teinte]}
                fillOpacity={f.teinte === 'ombre' ? 0.45 : 1}
                stroke={f.teinte === 'ombre' ? 'none' : ENCRE}
                strokeOpacity={0.7}
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            ))}
            {planCoupe ? <polygon points={polygone(planCoupe)} fill={ACCENT} fillOpacity={0.16} stroke={ACCENT} strokeWidth={1} /> : null}
          </svg>
        </div>
      </div>
    ),
    { ...size, fonts: polices },
  )
}
