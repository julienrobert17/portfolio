'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PrototaxiteProps {
  position?: [number, number, number]
  height?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
}

// Même motif que DevonianGround : on part d'un MeshStandardMaterial et on
// n'injecte que le displacement radial et la couleur, au lieu de recalculer
// l'éclairage avec une lightDir en dur. Le tronc reçoit ainsi les lumières,
// les ombres, le fog et le tone mapping de la scène (défaut D4).
function patch(src: string, token: string, repl: string): string {
  if (!src.includes(token)) throw new Error(`[Prototaxite] chunk absent : ${token}`)
  return src.replace(token, repl)
}

const VERT_HEAD = /* glsl */ `
varying vec2 vProtoUv;
`

const BEGIN_VERTEX = /* glsl */ `
#include <begin_vertex>

  float radialDisp = sin(transformed.y * 3.0 + uv.x * 6.28318) * 0.08
                   + sin(transformed.y * 7.0) * 0.04;
  vec2 xzDir = normalize(transformed.xz + vec2(0.0001));
  transformed.x += xzDir.x * radialDisp;
  transformed.z += xzDir.y * radialDisp;

  vProtoUv = uv;
`

const FRAG_HEAD = /* glsl */ `
uniform float uTime;
varying vec2 vProtoUv;
`

const COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>

  float stripe = sin(vProtoUv.x * 20.0) * 0.5 + 0.5;
  vec3 protoColor = mix(vec3(0.23, 0.10, 0.03), vec3(0.35, 0.18, 0.06), stripe);

  // Stries verticales fines : donne de la matière de près
  float grain = sin(vProtoUv.y * 220.0 + stripe * 6.0) * 0.5 + 0.5;
  protoColor *= 0.92 + grain * 0.16;

  float pulse = sin(uTime * 0.4) * 0.5 + 0.5;
  protoColor += vec3(0.10, 0.04, 0.01) * pulse * 0.06;

  diffuseColor.rgb *= protoColor;
`

export default function Prototaxite({
  position = [0, 0, 0],
  height = 8,
  radiusTop = 0.6,
  radiusBottom = 1.1,
  opacity = 1,
}: PrototaxiteProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const timeRef = useRef<THREE.IUniform<number>>({ value: 0 })

  useEffect(() => {
    const m = matRef.current
    if (m) m.opacity = opacity
  }, [opacity])

  useFrame((state) => {
    timeRef.current.value = state.clock.elapsedTime
  })

  const [x, y, z] = position

  return (
    <mesh position={[x, y + height / 2, z]} castShadow receiveShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 16, 48]} />
      <meshStandardMaterial
        ref={matRef}
        transparent
        opacity={opacity}
        roughness={0.88}
        metalness={0}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = timeRef.current
          shader.vertexShader = patch(
            VERT_HEAD + shader.vertexShader,
            '#include <begin_vertex>',
            BEGIN_VERTEX,
          )
          shader.fragmentShader = patch(
            FRAG_HEAD + shader.fragmentShader,
            '#include <color_fragment>',
            COLOR_FRAGMENT,
          )
        }}
      />
    </mesh>
  )
}
