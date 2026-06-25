'use client'

import { useState, useEffect, useRef } from 'react'

const NUM = 16
const CX = 160
const CY = 160
const RADIUS = 200
const W = 20
const H = 90

interface Props {
  isLeaving?: boolean
}

export default function RotatingStrokes({ isLeaving = false }: Props) {
  const [duration, setDuration] = useState(12)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (isLeaving) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev * 0.85
          if (next < 0.3) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            return 0.3
          }
          return next
        })
      }, 50)
    } else {
      setDuration(12)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLeaving])

  return (
    <svg
      width={320}
      height={320}
      viewBox="0 0 320 320"
      overflow="visible"
      style={{
        animationName: 'spin-ccw',
        animationDuration: `${duration}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      }}
    >
      {Array.from({ length: NUM }, (_, i) => {
        const angle = (i * 360) / NUM
        const rad = (angle * Math.PI) / 180
        const x = CX + Math.cos(rad) * RADIUS - W / 2
        const y = CY + Math.sin(rad) * RADIUS - H / 2
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={W}
            height={H}
            fill="#0d271e"
            transform={`rotate(${angle + 90}, ${CX + Math.cos(rad) * RADIUS}, ${CY + Math.sin(rad) * RADIUS})`}
          />
        )
      })}
    </svg>
  )
}
