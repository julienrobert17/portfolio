'use client'

import * as THREE from 'three'

// Repris de l'ancienne scène impérative : dégradé horizon chaud → zénith bleu,
// rendu sur la face interne d'une sphère de rayon 400.
const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    float t = clamp((vWorldPos.y + 400.0) / 800.0, 0.0, 1.0);
    vec3 horizon = vec3(0.55, 0.42, 0.28);
    vec3 zenith  = vec3(0.28, 0.45, 0.72);
    gl_FragColor = vec4(mix(horizon, zenith, t), 1.0);
  }
`

export default function DevonianAtmosphere() {
  return (
    <>
      {/* Densité montée vs l'original pour masquer les bords du sol */}
      <fogExp2 attach="fog" args={['#b8956a', 0.012]} />
      <color attach="background" args={['#4a6fa0']} />

      {/* Lumières — valeurs reprises de l'ancienne scène impérative */}
      <directionalLight color="#e8d5a0" intensity={2.8} position={[30, 40, 20]} />
      <directionalLight color="#a0c8d0" intensity={0.6} position={[-20, 15, -10]} />
      <ambientLight color="#1a2e1a" intensity={1.2} />
      <hemisphereLight args={['#2d4a2d', '#1a0e08', 0.8]} />

      {/* Ciel */}
      <mesh>
        <sphereGeometry args={[400, 32, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
        />
      </mesh>

      {/* Disque solaire */}
      <mesh position={[120, 200, 80]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#fff5d0" fog={false} />
      </mesh>
    </>
  )
}
