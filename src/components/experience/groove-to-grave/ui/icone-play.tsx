/** Icônes du transport, traits ink, à plat. */
export default function IconePlay({ pause = false }: { pause?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {pause ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /> : <path d="M7 4l13 8-13 8z" fill="currentColor" />}
    </svg>
  )
}

export const ICONES_TRANSPORT = {
  precedent: 'M6 4h2v16H6zM20 4v16L8 12z',
  suivant: 'M16 4h2v16h-2zM4 4v16l12-8z',
  stop: 'M5 5h14v14H5z',
  volume: 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a3.5 3.5 0 0 0-2-3.2v6.4a3.5 3.5 0 0 0 2-3.2z',
  muet: 'M4 9v6h4l5 4V5L8 9H4zm12 0l4 6m0-6-4 6',
  mini: 'M4 14h6v6M20 10h-6V4',
  agrandir: 'M4 10V4h6M20 14v6h-6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  fermer: 'M5 5l14 14M19 5 5 19',
  deplier: 'M6 15l6-6 6 6',
  replier: 'M6 9l6 6 6-6',
} as const

export function Icone({ nom, className }: { nom: keyof typeof ICONES_TRANSPORT; className?: string }) {
  const trait = nom === 'muet' || nom === 'mini' || nom === 'agrandir' || nom === 'menu' || nom === 'fermer' || nom === 'deplier' || nom === 'replier'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path d={ICONES_TRANSPORT[nom]} fill={trait ? 'none' : 'currentColor'} stroke={trait ? 'currentColor' : 'none'} strokeWidth={trait ? 2.4 : 0} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
