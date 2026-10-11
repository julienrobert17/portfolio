/**
 * Aperçu de cassette dans la liste des sorties : coque et bande aux couleurs extraites de la
 * pochette (gris tant que le pipeline n'a pas tourné), référence sur la bande. Même dessin que
 * le composant du site, réduit.
 */
export function ApercuCassette({ coque, bande, reference }: { coque?: string; bande?: string; reference?: string }) {
  const c = coque ?? '#e4dccb'
  const b = bande ?? '#111111'
  return (
    <svg viewBox="0 0 200 128" width="100%" height="100%" aria-hidden="true">
      <rect x="2" y="2" width="196" height="124" rx="8" fill={c} stroke="#111111" strokeWidth="4" />
      <rect x="16" y="10" width="168" height="68" rx="3" fill="#faf4e6" stroke="#111111" strokeWidth="2" />
      <rect x="16" y="10" width="168" height="18" fill={b} />
      <text x="22" y="24" fontSize="14" fontWeight="800" fill="#faf4e6" fontFamily="system-ui, sans-serif">
        {reference ?? ''}
      </text>
      <rect x="52" y="52" width="96" height="20" rx="10" fill="#111111" />
      <circle cx="72" cy="62" r="7" fill="#faf4e6" />
      <circle cx="128" cy="62" r="7" fill="#faf4e6" />
      <polygon points="42,126 54,96 146,96 158,126" fill={c} stroke="#111111" strokeWidth="3" />
    </svg>
  )
}
