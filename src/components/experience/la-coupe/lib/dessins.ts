import type { Dessin, DescripteurCoupe, DescripteurPlan } from '../content/types'

/**
 * Transforme un descripteur (en mètres) en géométrie SVG (en pixels).
 * Les épaisseurs de trait sont symboliques : le composant leur donne une
 * largeur en pixels indépendante de l'échelle (vector-effect).
 */
export type Epaisseur = 'fort' | 'moyen' | 'fin'

export interface Trait {
  d: string
  epaisseur: Epaisseur
  /** Tracé en dernier au scroll (Phase 3) : cotes et annotations. */
  tardif?: boolean
}

export interface Cote {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  orientation: 'horizontale' | 'verticale'
}

export interface DessinRendu {
  largeur: number
  hauteur: number
  viewBox: string
  traits: Trait[]
  cotes: Cote[]
  legende: string
  type: Dessin['type']
}

const MARGE = 2.4 // mètres autour du dessin, pour les cotes

function metres(v: number): string {
  return `${v.toFixed(2).replace('.', ',')} m`
}

function rect(x: number, y: number, l: number, h: number): string {
  return `M${x} ${y}h${l}v${h}h${-l}Z`
}

export function rendrePlan(p: DescripteurPlan, echelle: number): DessinRendu {
  const s = (v: number) => +(v * echelle).toFixed(2)
  const ox = MARGE
  const oy = MARGE
  const traits: Trait[] = []
  traits.push({ d: rect(s(ox), s(oy), s(p.largeur), s(p.profondeur)), epaisseur: 'fort' })
  // Épaisseur du mur extérieur : un second contour, 0,3 m à l'intérieur.
  traits.push({ d: rect(s(ox + 0.3), s(oy + 0.3), s(p.largeur - 0.6), s(p.profondeur - 0.6)), epaisseur: 'fin' })
  for (const [x1, y1, x2, y2] of p.murs) {
    traits.push({ d: `M${s(ox + x1)} ${s(oy + y1)}L${s(ox + x2)} ${s(oy + y2)}`, epaisseur: 'moyen' })
  }
  for (const [a, b] of p.ouvertures ?? []) {
    const y = oy + p.profondeur - 0.15
    traits.push({ d: `M${s(ox + a)} ${s(y)}H${s(ox + b)}M${s(ox + a)} ${s(y - 0.15)}H${s(ox + b)}`, epaisseur: 'fin', tardif: true })
  }
  // Nord : une flèche fine en haut à droite.
  const nx = ox + p.largeur + 1.2
  traits.push({
    d: `M${s(nx)} ${s(oy + 1.6)}V${s(oy)}M${s(nx - 0.3)} ${s(oy + 0.4)}L${s(nx)} ${s(oy)}L${s(nx + 0.3)} ${s(oy + 0.4)}`,
    epaisseur: 'fin',
    tardif: true,
  })
  const cotes: Cote[] = [
    {
      x1: s(ox),
      y1: s(oy + p.profondeur + 1.4),
      x2: s(ox + p.largeur),
      y2: s(oy + p.profondeur + 1.4),
      label: metres(p.largeur),
      orientation: 'horizontale',
    },
    {
      x1: s(ox + p.largeur + 1.4),
      y1: s(oy + p.profondeur),
      x2: s(ox + p.largeur + 1.4),
      y2: s(oy),
      label: metres(p.profondeur),
      orientation: 'verticale',
    },
  ]
  const largeur = s(p.largeur + MARGE * 2)
  const hauteur = s(p.profondeur + MARGE * 2)
  return { largeur, hauteur, viewBox: `0 0 ${largeur} ${hauteur}`, traits, cotes, legende: p.legende, type: 'plan' }
}

export function rendreCoupe(c: DescripteurCoupe, echelle: number): DessinRendu {
  const s = (v: number) => +(v * echelle).toFixed(2)
  const dalle = 0.25
  const mur = 0.3
  const enterre = c.enterre ?? 0
  const hauteurNiveaux = c.niveaux.reduce((a, b) => a + b + dalle, 0)
  const hauteurToit = c.toit === 'plat' ? dalle : c.toit === 'mono' ? Math.min(c.largeur * 0.12, 2.2) : Math.min(c.largeur * 0.28, 4)
  const hauteurTotale = hauteurNiveaux + hauteurToit
  const ox = MARGE + 1.5
  // Le sol est à y = oyBas ; on dessine vers le haut (y décroissant).
  const oySol = MARGE + hauteurTotale
  const traits: Trait[] = []
  const y = (z: number) => s(oySol - z)
  const x = (m: number) => s(ox + m)

  // Sous-sol.
  if (enterre > 0) {
    traits.push({ d: rect(x(0), y(0), s(c.largeur), s(enterre)), epaisseur: 'moyen' })
  }
  // Murs extérieurs, du sol au dernier plancher haut.
  traits.push({ d: `M${x(0)} ${y(0)}V${y(hauteurNiveaux)}`, epaisseur: 'fort' })
  traits.push({ d: `M${x(mur)} ${y(0)}V${y(hauteurNiveaux)}`, epaisseur: 'fin' })
  traits.push({ d: `M${x(c.largeur)} ${y(0)}V${y(hauteurNiveaux)}`, epaisseur: 'fort' })
  traits.push({ d: `M${x(c.largeur - mur)} ${y(0)}V${y(hauteurNiveaux)}`, epaisseur: 'fin' })
  // Planchers : dalle au sol puis au-dessus de chaque niveau, avec le vide.
  let z = 0
  const planchers = [0, ...c.niveaux.map((h) => (z += h + dalle))]
  planchers.forEach((zp, i) => {
    const haut = y(zp + dalle)
    const estIntermediaire = i > 0 && i < planchers.length - 1
    if (c.vide && estIntermediaire) {
      const [a, b] = c.vide
      traits.push({ d: `${rect(x(0), haut, s(a), s(dalle))}${rect(x(b), haut, s(c.largeur - b), s(dalle))}`, epaisseur: 'moyen' })
    } else {
      traits.push({ d: rect(x(0), haut, s(c.largeur), s(dalle)), epaisseur: 'moyen' })
    }
  })
  // Toiture.
  const zt = hauteurNiveaux
  if (c.toit === 'plat') {
    traits.push({ d: `M${x(-0.4)} ${y(zt)}H${x(c.largeur + 0.4)}`, epaisseur: 'fort' })
  } else if (c.toit === 'mono') {
    traits.push({
      d: `M${x(-0.6)} ${y(zt + hauteurToit)}L${x(c.largeur + 0.6)} ${y(zt)}M${x(0)} ${y(zt)}V${y(zt + hauteurToit)}`,
      epaisseur: 'fort',
    })
  } else {
    traits.push({
      d: `M${x(-0.6)} ${y(zt)}L${x(c.largeur / 2)} ${y(zt + hauteurToit)}L${x(c.largeur + 0.6)} ${y(zt)}`,
      epaisseur: 'fort',
    })
  }
  // Ligne de sol, prolongée, avec hachures dessous.
  const solD = [`M${x(-MARGE)} ${y(0)}H${x(c.largeur + MARGE)}`]
  const hachures: string[] = []
  for (let m = -MARGE + 0.4; m < c.largeur + MARGE; m += 0.7) {
    if (enterre > 0 && m > 0 && m < c.largeur) continue
    hachures.push(`M${x(m)} ${y(0)}l${s(-0.45)} ${s(0.45)}`)
  }
  traits.push({ d: solD.join(''), epaisseur: 'fort' })
  traits.push({ d: hachures.join(''), epaisseur: 'fin', tardif: true })
  // Petit escalier symbolique dans le premier niveau.
  if (c.niveaux.length > 1) {
    const marches: string[] = []
    const n = 8
    const dx = 0.27
    const dz = (c.niveaux[0] + dalle) / n
    const x0 = c.vide ? c.vide[0] : c.largeur * 0.55
    for (let i = 0; i < n; i++) {
      marches.push(`M${x(x0 + i * dx)} ${y(i * dz)}V${y((i + 1) * dz)}H${x(x0 + (i + 1) * dx)}`)
    }
    traits.push({ d: marches.join(''), epaisseur: 'fin', tardif: true })
  }
  const cotes: Cote[] = [
    {
      x1: x(c.largeur + 1.4),
      y1: y(0),
      x2: x(c.largeur + 1.4),
      y2: y(hauteurTotale),
      label: `+${metres(hauteurTotale)}`,
      orientation: 'verticale',
    },
    {
      x1: x(0),
      y1: y(-(enterre + 1.4)),
      x2: x(c.largeur),
      y2: y(-(enterre + 1.4)),
      label: metres(c.largeur),
      orientation: 'horizontale',
    },
  ]
  const largeur = s(c.largeur + MARGE * 2 + 3)
  const hauteur = s(hauteurTotale + enterre + MARGE * 2)
  return { largeur, hauteur, viewBox: `0 0 ${largeur} ${hauteur}`, traits, cotes, legende: c.legende, type: 'coupe' }
}

/** Échelle en px par mètre, pour que le dessin tienne dans ~1000 px. */
export function rendreDessin(d: Dessin, largeurCible = 1000): DessinRendu {
  const largeurM = d.largeur + MARGE * 2 + (d.type === 'coupe' ? 3 : 0)
  const echelle = +(largeurCible / largeurM).toFixed(3)
  return d.type === 'plan' ? rendrePlan(d, echelle) : rendreCoupe(d, echelle)
}
