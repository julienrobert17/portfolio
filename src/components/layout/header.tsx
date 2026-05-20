'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const nav = [
  { label: 'Projets', href: '/projects' },
  { label: 'Contact', href: '/contact' },
]

export default function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const isGame = pathname.startsWith('/games')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerClass = isGame
    ? 'bg-transparent border-b border-transparent'
    : scrolled
      ? 'bg-white border-b border-border'
      : 'bg-transparent border-b border-transparent'

  return (
    <header
      style={{
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        ...(isGame ? { background: 'transparent', borderColor: 'transparent' } : {}),
      }}
      className={`sticky top-0 z-50 flex items-center justify-between px-6 h-14 ${headerClass}`}
    >
      <Link
        href="/"
        className="text-sm font-semibold tracking-widest transition-colors"
        style={{ color: isGame ? 'rgba(255,255,255,0.7)' : '#534AB7' }}
      >
        JR
      </Link>

      <nav className="flex items-center gap-6">
        {nav.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors ${
              isGame
                ? 'hover:text-white'
                : pathname === href
                  ? 'text-[#534AB7]'
                  : 'text-zinc-600 hover:text-zinc-900'
            }`}
            style={isGame ? { color: 'rgba(255,255,255,0.7)' } : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
