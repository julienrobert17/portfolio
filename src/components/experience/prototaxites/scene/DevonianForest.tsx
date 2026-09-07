'use client'

import { useMemo } from 'react'
import DevonianTree from './DevonianTree'

interface DevonianForestProps {
  count?: number
  innerRadius?: number // distance mini au centre
  outerRadius?: number // distance maxi
  minHeight?: number
  maxHeight?: number
  seed?: number // pour un placement déterministe
  opacity?: number
}

export default function DevonianForest({
  count = 24,
  innerRadius = 14,
  outerRadius = 34,
  minHeight = 6,
  maxHeight = 11,
  seed = 1,
  opacity = 1,
}: DevonianForestProps) {
  // Placement déterministe : évite que les arbres sautent à chaque render.
  // LCG déroulé en boucle explicite (4 tirages par arbre, dans l'ordre
  // angle → distance → hauteur → rotation) plutôt qu'une closure `rand()` :
  // react-hooks/immutability interdit de réassigner une variable capturée.
  const trees = useMemo(() => {
    let s = seed
    const next = (state: number) => (state * 9301 + 49297) % 233280
    const out: {
      key: number
      position: [number, number, number]
      height: number
      rotationY: number
    }[] = []

    for (let i = 0; i < count; i++) {
      s = next(s)
      const rAng = s / 233280
      s = next(s)
      const rDist = s / 233280
      s = next(s)
      const rHeight = s / 233280
      s = next(s)
      const rRot = s / 233280

      const ang = (i / count) * Math.PI * 2 + (rAng - 0.5) * 0.5
      const dist = innerRadius + rDist * (outerRadius - innerRadius)
      out.push({
        key: i,
        position: [Math.cos(ang) * dist, 0, Math.sin(ang) * dist],
        height: minHeight + rHeight * (maxHeight - minHeight),
        rotationY: rRot * Math.PI * 2,
      })
    }
    return out
  }, [count, innerRadius, outerRadius, minHeight, maxHeight, seed])

  return (
    <>
      {trees.map((t) => (
        <DevonianTree
          key={t.key}
          position={t.position}
          targetHeight={t.height}
          rotationY={t.rotationY}
          opacity={opacity}
        />
      ))}
    </>
  )
}
