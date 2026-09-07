'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PrototaxiteProps {
  position?: [number, number, number]
  height?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number // pilote l'uniform uOpacity
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 pos = position;
    float radialDisp = sin(pos.y * 3.0 + uv.x * 6.28318) * 0.08
                     + sin(pos.y * 7.0) * 0.04;
    vec2 xzDir = normalize(pos.xz + vec2(0.0001));
    pos.x += xzDir.x * radialDisp;
    pos.z += xzDir.y * radialDisp;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float stripe = sin(vUv.x * 20.0) * 0.5 + 0.5;
    vec3 baseColor = mix(vec3(0.23, 0.10, 0.03), vec3(0.35, 0.18, 0.06), stripe);
    vec3 lightDir = normalize(vec3(0.4, 0.6, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 lit = baseColor * (0.35 + diff * 0.85);
    float pulse = sin(uTime * 0.4) * 0.5 + 0.5;
    lit += vec3(0.10, 0.04, 0.01) * pulse * 0.06;
    gl_FragColor = vec4(lit, uOpacity);
  }
`

export default function Prototaxite({
  position = [0, 0, 0],
  height = 8,
  radiusTop = 0.6,
  radiusBottom = 1.1,
  opacity = 1,
}: PrototaxiteProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  // Créé une seule fois : muter les uniforms, jamais recréer l'objet,
  // sinon le shader repart de zéro à chaque frame.
  const uniforms = useMemo<Record<string, THREE.IUniform<number>>>(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    [],
  )

  useEffect(() => {
    const mat = matRef.current
    if (mat) mat.uniforms.uOpacity.value = opacity
  }, [opacity])

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  // Décalage interne de height/2 : la base repose sur Y=0 quand on passe
  // position={[x, 0, z]}
  const [x, y, z] = position

  return (
    <mesh position={[x, y + height / 2, z]}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 16, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}
