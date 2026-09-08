'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleTerrain } from './terrain'

// Zone humide d'arrière-plan : les fossiles de Prototaxites proviennent de
// plaines fluviales et de zones humides côtières.
const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec3 pos = position;

    // Le plan vit dans XY (le mesh porte le rotateX) : ondulations sur Z.
    float ripple = sin(pos.x * 0.15 + uTime * 0.6) * 0.12
                 + sin(pos.y * 0.23 - uTime * 0.4) * 0.09
                 + sin((pos.x + pos.y) * 0.31 + uTime * 0.9) * 0.05;
    pos.z += ripple;

    // Normale perturbée par la pente des ondulations, calculée en espace
    // objet (hauteur sur Z) puis ramenée en monde pour le fresnel.
    float dx = cos(pos.x * 0.15 + uTime * 0.6) * 0.15 * 0.12
             + cos((pos.x + pos.y) * 0.31 + uTime * 0.9) * 0.31 * 0.05;
    float dy = cos(pos.y * 0.23 - uTime * 0.4) * 0.23 * 0.09
             + cos((pos.x + pos.y) * 0.31 + uTime * 0.9) * 0.31 * 0.05;
    vec3 objNormal = normalize(vec3(-dx, -dy, 1.0));
    vWorldNormal = normalize(mat3(modelMatrix) * objNormal);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec3 deepColor = vec3(0.08, 0.12, 0.10);
    vec3 skyColor  = vec3(0.28, 0.38, 0.45);

    // Fresnel : rasant vers l'horizon → reflet du ciel
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - clamp(dot(viewDir, normalize(vWorldNormal)), 0.0, 1.0), 3.0);

    vec3 color = mix(deepColor, skyColor, fresnel);
    gl_FragColor = vec4(color, 0.75);
  }
`

const CENTER_X = -25
const CENTER_Z = -55
const WIDTH = 160
const DEPTH = 60
// Fraction de l'emprise que l'on veut effectivement sous l'eau. Le terrain
// n'ayant pas de vraie cuvette (voir RAPPORT_GRAPHISME.md), le niveau est
// pris comme un percentile des hauteurs réelles sous l'emprise : la zone
// humide se lit alors comme des mares entre les bosses, et le niveau suit
// le relief si celui-ci change.
const SUBMERGED_FRACTION = 0.35

function computeWaterLevel(): number {
  const heights: number[] = []
  for (let i = 0; i <= 60; i++) {
    for (let j = 0; j <= 30; j++) {
      const x = CENTER_X - WIDTH / 2 + (i / 60) * WIDTH
      const z = CENTER_Z - DEPTH / 2 + (j / 30) * DEPTH
      heights.push(sampleTerrain(x, z).height)
    }
  }
  heights.sort((a, b) => a - b)
  const idx = Math.min(heights.length - 1, Math.floor(heights.length * SUBMERGED_FRACTION))
  return heights[idx]
}

let cachedLevel: number | null = null
function waterLevel(): number {
  if (cachedLevel === null) cachedLevel = computeWaterLevel()
  return cachedLevel
}

export default function DevonianWater() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const level = useMemo(() => waterLevel(), [])

  const uniforms = useMemo<Record<string, THREE.IUniform<number>>>(
    () => ({ uTime: { value: 0 } }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh position={[CENTER_X, level, CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[WIDTH, DEPTH]} />
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
