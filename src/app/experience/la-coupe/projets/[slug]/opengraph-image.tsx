import { ImageResponse } from 'next/og'
import { getProjet, numeroProjet, projets } from '@/components/experience/la-coupe/content'
import { site } from '@/components/experience/la-coupe/content/site'

/**
 * Image Open Graph d'une fiche projet, générée au build pour chaque slug :
 * titre, programme, lieu et année, avec un aplat dans la teinte du projet
 * (même formule que les placeholders SVG). Les photos placeholder étant des
 * SVG, elles ne peuvent pas servir d'og:image : les crawleurs ne les rendent pas.
 */
/** Alt commun aux fiches : l'export doit être statique, le titre du projet est dans og:title. */
export const alt = `Fiche projet — ${site.nom}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return projets.map((p) => ({ slug: p.slug }))
}

/** Palette papier de la-coupe.css, en dur : satori ne résout pas les variables CSS. */
const PAPIER = '#f3f0ea'
const ENCRE = '#151412'
const ENCRE_2 = '#5c5853'
const FILET = '#c9c3b8'
const ACCENT = '#b5452d'

interface Police {
  name: string
  data: ArrayBuffer
  weight: 400 | 500
  style: 'normal'
}

/**
 * Récupère une police Google en TTF (satori ne lit pas le woff2) : l'API CSS v1
 * sans User-Agent renvoie des sources .ttf. Null si le réseau manque au build ;
 * satori retombe alors sur sa Geist Regular embarquée. Même fonction que dans
 * l'image de l'accueil (../../opengraph-image.tsx).
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

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const projet = getProjet(slug)
  if (!projet) return new Response('Projet introuvable', { status: 404 })
  const polices = (await Promise.all([policeGoogle('Instrument Sans', 500), policeGoogle('Geist Mono', 400)])).filter(
    (p): p is Police => p !== null,
  )
  const clair = `hsl(${projet.teinte} 24% 82%)`
  const sombre = `hsl(${(projet.teinte + 22) % 360} 18% 60%)`

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
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingRight: 48 }}>
          <div style={{ display: 'flex', fontFamily: "'Geist Mono', geist, monospace", fontSize: 20, color: ENCRE_2, letterSpacing: 1 }}>
            {site.nom} — {numeroProjet(projet.slug)}
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 500, lineHeight: 1.04, letterSpacing: -1.5 }}>{projet.titre}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 96, height: 2, background: ACCENT, marginBottom: 20 }} />
            <div style={{ display: 'flex', fontFamily: "'Geist Mono', geist, monospace", fontSize: 22, lineHeight: 1.4, color: ENCRE_2, letterSpacing: 1 }}>
              {projet.programme} — {projet.lieu} — {projet.annee}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 400,
            height: 518,
            border: `1px solid ${FILET}`,
            backgroundImage: `linear-gradient(135deg, ${clair}, ${sombre})`,
          }}
        />
      </div>
    ),
    { ...size, fonts: polices },
  )
}
