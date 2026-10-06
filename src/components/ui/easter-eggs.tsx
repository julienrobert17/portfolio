'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { REPO_URL } from '@/lib/links'

export const TOAST_TEXT = 'Tu as trouvé le premier. Il en reste deux.'

const CONSOLE_KEY = 'jr-egg-console'
const SELECTION_KEY = 'jr-egg-selection'
const TARGET = 'julien robert'

const ASCII_JR = [
  '     ██ ██████  ',
  '     ██ ██   ██ ',
  '     ██ ██████  ',
  '██   ██ ██   ██ ',
  ' █████  ██   ██ ',
].join('\n')

function onceInSession(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return true
  }
}

/** Monté une fois dans le layout racine. Ne rend rien, sauf le toast. */
export default function EasterEggs() {
  const pathname = usePathname()
  const logged = useRef(false)
  const [toastVisible, setToastVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Console, une fois par session (garde contre le double montage de strict mode)
  useEffect(() => {
    if (logged.current) return
    logged.current = true
    if (!onceInSession(CONSOLE_KEY)) return
    console.log(`%c${ASCII_JR}`, 'color: #4ade80; font-weight: bold; line-height: 1.1')
    console.log('Tu regardes sous le capot. Bon réflexe.')
    console.log('Le code de ce site est ici : ' + REPO_URL)
    console.log('%cEt si tu sélectionnes mon nom sur la page d’accueil, il se passe quelque chose.', 'color: #888')
  }, [])

  // 2. Sélection de "julien robert" sur la home
  useEffect(() => {
    if (pathname !== '/') return

    const hide = () => setToastVisible(false)
    const onSelectionChange = () => {
      const text = document.getSelection()?.toString().trim().toLowerCase()
      if (text !== TARGET) return
      if (!onceInSession(SELECTION_KEY)) return
      setToastVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(hide, 4000)
    }

    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname])

  if (!toastVisible) return null

  return (
    <button
      type="button"
      role="status"
      onClick={() => setToastVisible(false)}
      className="egg-toast"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 70,
        padding: '8px 14px',
        borderRadius: 9999,
        backgroundColor: 'rgba(4,18,11,0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid color-mix(in oklch, var(--accent) 25%, transparent)',
        color: 'var(--accent)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.03em',
        cursor: 'pointer',
      }}
    >
      {TOAST_TEXT}
    </button>
  )
}
