'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const LERP = 0.12
const SIZE_DEFAULT = 12
const SIZE_HOVER   = 40
const EMOJI_SIZE   = 20

export default function CustomCursor() {
  const pathname   = usePathname()
  const cursorRef  = useRef<HTMLDivElement>(null)
  const emojiRef   = useRef<HTMLSpanElement>(null)
  const mouse      = useRef({ x: -200, y: -200 })
  const current    = useRef({ x: -200, y: -200 })
  const hovering   = useRef(false)
  const rafId      = useRef<number>(0)
  const isGamesRef = useRef(pathname.startsWith('/games'))

  useEffect(() => {
    isGamesRef.current = pathname.startsWith('/games')
  }, [pathname])

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const cursor = cursorRef.current
    if (!cursor) return

    cursor.style.opacity = '1'

    const onMouseMove = (e: MouseEvent) => {
      mouse.current    = { x: e.clientX, y: e.clientY }
      hovering.current = !!(e.target as Element).closest?.('a, button')
    }

    const tick = () => {
      current.current.x += (mouse.current.x - current.current.x) * LERP
      current.current.y += (mouse.current.y - current.current.y) * LERP

      const games = isGamesRef.current

      if (games) {
        cursor.style.transform       = `translate(${current.current.x - EMOJI_SIZE / 2}px, ${current.current.y - EMOJI_SIZE / 2}px)`
        cursor.style.width           = `${EMOJI_SIZE}px`
        cursor.style.height          = `${EMOJI_SIZE}px`
        cursor.style.backgroundColor = 'transparent'
        cursor.style.borderRadius    = '0'
        cursor.style.mixBlendMode    = 'normal'
      } else {
        const size  = hovering.current ? SIZE_HOVER : SIZE_DEFAULT
        const color = hovering.current ? '#fff' : '#534AB7'

        cursor.style.transform       = `translate(${current.current.x - size / 2}px, ${current.current.y - size / 2}px)`
        cursor.style.width           = `${size}px`
        cursor.style.height          = `${size}px`
        cursor.style.backgroundColor = color
        cursor.style.borderRadius    = '50%'
        cursor.style.mixBlendMode    = hovering.current ? 'difference' : 'normal'
      }

      if (emojiRef.current) {
        emojiRef.current.style.display = games ? 'block' : 'none'
      }

      rafId.current = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMouseMove)
    rafId.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafId.current)
      document.body.style.cursor = ''
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE_DEFAULT,
        height: SIZE_DEFAULT,
        borderRadius: '50%',
        backgroundColor: '#534AB7',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        willChange: 'transform',
        transition: 'width 0.2s ease, height 0.2s ease, background-color 0.2s ease',
      }}
    >
      <span
        ref={emojiRef}
        style={{
          display: 'none',
          fontSize: `${EMOJI_SIZE}px`,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        🌍
      </span>
    </div>
  )
}
