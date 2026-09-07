'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    // La géométrie n'est plus pré-tournée : le plan vit dans XY et le
    // displacement se fait sur Z, c'est le mesh qui porte le rotateX.
    float h = fbm(pos.xy * 0.04) * 4.0
            + fbm(pos.xy * 0.12) * 1.5
            + fbm(pos.xy * 0.35) * 0.5;

    float distFromCenter = length(pos.xy);
    float flatFactor = smoothstep(8.0, 18.0, distFromCenter);
    pos.z = h * flatFactor;

    vHeight = pos.z;

    float eps = 0.5;
    float hL = fbm((pos.xy - vec2(eps, 0.0)) * 0.04) * 4.0;
    float hR = fbm((pos.xy + vec2(eps, 0.0)) * 0.04) * 4.0;
    float hD = fbm((pos.xy - vec2(0.0, eps)) * 0.04) * 4.0;
    float hU = fbm((pos.xy + vec2(0.0, eps)) * 0.04) * 4.0;

    // Normale calculée en espace objet (hauteur sur Z), puis ramenée en
    // espace monde : le fragment shader éclaire avec une lightDir monde.
    vec3 objNormal = normalize(vec3(hL - hR, hD - hU, 2.0 * eps));
    vNormal = normalize(mat3(modelMatrix) * objNormal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    vec3 lowColor  = vec3(0.10, 0.12, 0.06);
    vec3 midColor  = vec3(0.28, 0.15, 0.07);
    vec3 highColor = vec3(0.42, 0.26, 0.10);

    float t = clamp(vHeight / 4.0, 0.0, 1.0);
    vec3 baseColor = mix(lowColor, mix(midColor, highColor, t * 1.5), t);

    // Biofilm dans les creux
    float biofilm = smoothstep(0.0, 0.8, 1.0 - t) * 0.4;
    baseColor = mix(baseColor, vec3(0.08, 0.14, 0.06), biofilm);

    vec3 lightDir = normalize(vec3(0.6, 1.0, 0.4));
    float diff = max(dot(normalize(vNormal), lightDir), 0.0);
    float ambient = 0.35;
    vec3 lit = baseColor * (ambient + diff * 0.65);

    float micro = fract(vUv.x * 80.0) * fract(vUv.y * 80.0);
    lit += vec3(micro * 0.02);

    gl_FragColor = vec4(lit, 1.0);
  }
`

export default function DevonianGround() {
  const uniforms = useMemo<Record<string, THREE.IUniform<number>>>(
    () => ({ uTime: { value: 0 } }),
    [],
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[800, 800, 200, 200]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}
