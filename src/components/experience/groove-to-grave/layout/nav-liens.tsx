'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from '../lib/routes'

const ICONES: Record<(typeof NAV)[number]['icone'], string> = {
  disque: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  artistes: 'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6H2Zm12.5 0c0-2.3-.8-4.3-2.2-5.8A5 5 0 0 1 22 20h-7.5Z',
  soirees: 'M4 10v4h3l7 5V5l-7 5H4Zm12.5-1.5a4 4 0 0 1 0 7v-7Zm0-4a8 8 0 0 1 0 15v-2a6 6 0 0 0 0-11v-2Z',
  label: 'M12 2a8 8 0 0 0-8 8c0 3 1.6 5.4 4 6.8V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.2c2.4-1.4 4-3.8 4-6.8a8 8 0 0 0-8-8ZM9 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z',
  contact: 'M3 5h18v14H3V5Zm2 2v.5l7 4.5 7-4.5V7H5Zm0 3v7h14v-7l-7 4.5L5 10Z',
}

/** Liens de la barre de menu : page courante en aria-current. Icône et libellé texte pour chaque entrée. */
export default function NavLiens() {
  const pathname = usePathname()
  return (
    <>
      {NAV.map((item) => {
        const courant = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link key={item.href} href={item.href} aria-current={courant ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={ICONES[item.icone]} fill="currentColor" />
            </svg>
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
