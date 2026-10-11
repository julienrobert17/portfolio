import type { SVGProps } from 'react'
import { traces, type Trace } from './traces'

/**
 * Les deux marques du label en SVG en ligne, une couleur en currentColor : le monogramme G2G
 * et le crâne coiffé d'un vinyle. Tracés provisoires PLACEHOLDER-TRACE (voir traces.ts), à
 * remplacer par les fichiers du label sans changer ce composant. Décoratif par défaut
 * (`aria-hidden`) ; passer `titre` pour un nom accessible.
 */
interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill'> {
  marque: keyof typeof traces
  titre?: string
}

function Marque({ marque, titre, ...props }: LogoProps) {
  const t: Trace = traces[marque]
  return (
    <svg viewBox={t.viewBox} fill="currentColor" role={titre ? 'img' : undefined} aria-label={titre} aria-hidden={titre ? undefined : true} {...props}>
      <g transform={t.transform}>
        <path d={t.d} />
      </g>
    </svg>
  )
}

export function Monogramme(props: Omit<LogoProps, 'marque'>) {
  return <Marque marque="monogramme" {...props} />
}

export function Crane(props: Omit<LogoProps, 'marque'>) {
  return <Marque marque="crane" {...props} />
}
