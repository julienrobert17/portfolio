'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const isDark = pathname === '/' || pathname === '/contact' || pathname.startsWith('/games')
  const color = isDark ? '#d0f0d2' : '#171717'

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(48px, 6vw, 100px)',
    }}>
      <Link href="/" style={{
        color,
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textDecoration: 'none',
      }}>
        JR
      </Link>

      <Link href="/contact" style={{
        color,
        fontSize: '14px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        textDecoration: 'none',
      }}>
        Contact
      </Link>
    </header>
  )
}
