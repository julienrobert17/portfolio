'use client'

import { useEffect, useRef } from 'react'

const LERP = 0.12
const SIZE_DEFAULT = 12
const SIZE_HOVER = 40

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: -200, y: -200 })
  const current = useRef({ x: -200, y: -200 })
  const hovering = useRef(false)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const cursor = cursorRef.current
    if (!cursor) return

    cursor.style.opacity = '1'

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      hovering.current = !!(e.target as Element).closest?.('a, button')
    }

    const tick = () => {
      current.current.x += (mouse.current.x - current.current.x) * LERP
      current.current.y += (mouse.current.y - current.current.y) * LERP

      const size = hovering.current ? SIZE_HOVER : SIZE_DEFAULT

      cursor.style.transform = `translate(${current.current.x - size / 2}px, ${current.current.y - size / 2}px)`
      cursor.style.width = `${size}px`
      cursor.style.height = `${size}px`
      cursor.style.backgroundColor = hovering.current ? '#fff' : '#534AB7'
      cursor.style.mixBlendMode = hovering.current ? 'difference' : 'normal'

      rafId.current = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMouseMove)
    rafId.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafId.current)
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
    />
  )
}
