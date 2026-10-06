'use client'

import { useEffect, useRef } from 'react'
import { REPO_URL } from '@/lib/links'

const ASCII_JR = [
  '     ██ ██████  ',
  '     ██ ██   ██ ',
  '     ██ ██████  ',
  '██   ██ ██   ██ ',
  ' █████  ██   ██ ',
].join('\n')

const TITLE_HIDDEN = 'reviens.'
const TITLE_PLEASE = 'stp.'
const PLEASE_DELAY = 30_000

/** Monté une fois dans le layout racine. Ne rend rien. */
export default function EasterEggs() {
  const logged = useRef(false)

  // 1. Console, à chaque chargement complet (garde contre le double montage de strict mode)
  useEffect(() => {
    if (logged.current) return
    logged.current = true
    console.log(`%c${ASCII_JR}`, 'color: #4ade80; font-weight: bold; line-height: 1.1')
    console.log('Tu regardes sous le capot. Bon réflexe.')
    console.log('Le code de ce site est ici : ' + REPO_URL)
  }, [])

  // 2. Titre d'onglet quand la page est cachée
  useEffect(() => {
    let original: string | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    const restore = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (original !== null) {
        document.title = original
        original = null
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (original === null) original = document.title
        document.title = TITLE_HIDDEN
        timer = setTimeout(() => { document.title = TITLE_PLEASE }, PLEASE_DELAY)
      } else {
        restore()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      restore()
    }
  }, [])

  return null
}
