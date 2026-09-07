'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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

export default function DevonianWater() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo<Record<string, THREE.IUniform<number>>>(
    () => ({ uTime: { value: 0 } }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh position={[-25, 2.0, -55]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[160, 60]} />
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
