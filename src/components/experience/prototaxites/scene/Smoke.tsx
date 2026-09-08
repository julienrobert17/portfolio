'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleTerrain } from './terrain'

interface SmokeProps {
  opacity?: number
  origins?: [number, number][] // positions AU SOL (x, z) des foyers
  seed?: number
}

// Foyers par défaut : posés dans l'anneau de la forêt (rayon 14 → 34 dans
// DevonianForest) pour que la fumée se lise comme des feux entre les arbres.
// Constante au niveau module : une littérale par défaut dans la destructuration
// changerait d'identité à chaque render et invaliderait le useMemo.
const DEFAULT_ORIGINS: [number, number][] = [
  [-18, -13],
  [15, -23],
  [27, 9],
  [-10, 22],
]

const PER_COLUMN = 90 // particules par colonne
const COLUMN_HEIGHT = 19 // hauteur de montée de référence (unités monde)
const BASE_RADIUS = 0.8 // rayon du foyer au sol
const SPREAD = 5.2 // élargissement du cône au sommet
const WIND: [number, number] = [2.6, -1.4] // dérive globale, appliquée en life²

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelScale;
  uniform float uHeight;
  uniform float uBaseRadius;
  uniform float uSpread;
  uniform vec2  uWind;

  // x: phase, y: vitesse, z: facteur de dispersion, w: aléa de taille
  attribute vec4 aSeed;
  // x: angle de base, y: échelle de hauteur de la colonne, z: index de colonne
  attribute vec3 aOrbit;

  varying float vLife;
  varying float vFade;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  void main() {
    float phase = aSeed.x;
    float speed = aSeed.y;
    float spread = aSeed.z;
    float sizeRand = aSeed.w;

    float angle0 = aOrbit.x;
    float heightScale = aOrbit.y;
    float columnId = aOrbit.z;

    // Montée dans le shader : t croît linéairement, la partie entière compte
    // les cycles et la partie fractionnaire est la vie de la particule.
    float t = phase + uTime * speed;
    float cycle = floor(t);
    float life = t - cycle;

    // Réinitialisation à chaque passage au sol : l'aléa dépend du numéro de
    // cycle, donc la particule ne rejoue jamais deux fois la même trajectoire.
    float r = hash11(cycle * 17.13 + phase * 91.7 + columnId * 3.7);

    // Cône : le rayon s'élargit avec l'altitude au lieu d'un cylindre.
    float ang = angle0 + r * 6.2831853 + life * 0.9;
    float radius = spread * (uBaseRadius + pow(life, 0.7) * uSpread);

    // Ondulation sinusoïdale déphasée par particule et par cycle.
    float w = uTime * 0.5 + phase * 6.2831853 + columnId * 2.3 + r * 4.0;
    float amp = 0.35 + life * 1.9;
    float swayX = sin(w + life * 3.4) * amp;
    float swayZ = cos(w * 0.83 + life * 2.7) * amp;

    vec3 p = position;
    p.x += cos(ang) * radius + swayX + life * life * uWind.x;
    p.z += sin(ang) * radius + swayZ + life * life * uWind.y;
    p.y += life * uHeight * heightScale;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = max(-mv.z, 0.1);

    vLife = life;
    // Apparition rapide au ras du sol, dilution progressive en altitude.
    vFade = smoothstep(0.0, 0.10, life) * pow(1.0 - life, 1.35);

    // sizeAttenuation manuel : taille croissante avec l'altitude, divisée par
    // la distance en espace vue.
    float size = uSize * (0.4 + life * 2.2) * (0.7 + sizeRand * 0.7);
    gl_PointSize = min(size * uPixelScale / dist, 260.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying float vLife;
  varying float vFade;

  void main() {
    // Disque à bord doux : sans ça les points sont des carrés nets.
    float d = length(gl_PointCoord - vec2(0.5));
    float disc = smoothstep(0.5, 0.08, d);
    disc *= disc;
    if (disc < 0.002) discard;

    // Gris-brun chaud près du foyer → gris froid en altitude.
    vec3 warm = vec3(0.34, 0.27, 0.21);
    vec3 cool = vec3(0.60, 0.62, 0.66);
    vec3 col = mix(warm, cool, smoothstep(0.05, 0.7, vLife));

    gl_FragColor = vec4(col, disc * vFade * uOpacity * 0.55);
  }
`

export default function Smoke({
  opacity = 0,
  origins = DEFAULT_ORIGINS,
  seed = 11,
}: SmokeProps) {
  // Uniforms dans une ref : seul conteneur mutable autorisé (react-hooks
  // interdit de muter une valeur issue de useMemo).
  const uniforms = useRef({
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uSize: { value: 1.5 },
    uPixelScale: { value: 500 },
    uHeight: { value: COLUMN_HEIGHT },
    uBaseRadius: { value: BASE_RADIUS },
    uSpread: { value: SPREAD },
    uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) },
  })

  // Attributs déterministes (LCG seedé : Math.random() est impur au render).
  const { positions, seeds, orbits, key } = useMemo(() => {
    const columns = origins.length > 0 ? origins : DEFAULT_ORIGINS
    const total = columns.length * PER_COLUMN

    const pos = new Float32Array(total * 3)
    const sds = new Float32Array(total * 4)
    const orb = new Float32Array(total * 3)

    let s = seed
    const next = (state: number) => (state * 9301 + 49297) % 233280
    const rand = () => {
      s = next(s)
      return s / 233280
    }

    let i = 0
    for (let c = 0; c < columns.length; c++) {
      const [ox, oz] = columns[c]
      const heightScale = 0.8 + rand() * 0.5

      for (let k = 0; k < PER_COLUMN; k++, i++) {
        const angle = rand() * Math.PI * 2
        const footR = Math.sqrt(rand()) * BASE_RADIUS
        const bx = ox + Math.cos(angle) * footR
        const bz = oz + Math.sin(angle) * footR

        // Pied de la colonne posé sur le relief réel.
        pos[i * 3] = bx
        pos[i * 3 + 1] = sampleTerrain(bx, bz).height
        pos[i * 3 + 2] = bz

        sds[i * 4] = rand() // phase → répartit les particules sur la colonne
        sds[i * 4 + 1] = 0.035 + rand() * 0.035 // vitesse (cycles / seconde)
        sds[i * 4 + 2] = 0.25 + Math.sqrt(rand()) * 0.75 // dispersion latérale
        sds[i * 4 + 3] = rand() // aléa de taille

        orb[i * 3] = angle
        orb[i * 3 + 1] = heightScale
        orb[i * 3 + 2] = c
      }
    }

    return {
      positions: pos,
      seeds: sds,
      orbits: orb,
      // Force la reconstruction de la géométrie quand le nombre de foyers change.
      key: `${columns.length}-${seed}`,
    }
  }, [origins, seed])

  useFrame((state, delta) => {
    const u = uniforms.current
    u.uTime.value += delta
    u.uOpacity.value = opacity

    // Échelle pixel pour l'atténuation manuelle : hauteur du drawing buffer
    // ramenée au demi-champ vertical de la caméra.
    const cam = state.camera
    if (cam instanceof THREE.PerspectiveCamera) {
      const h = state.size.height * state.viewport.dpr
      u.uPixelScale.value = (h * 0.5) / Math.tan((cam.fov * Math.PI) / 360)
    }
  })

  return (
    <points key={key} visible={opacity > 0} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
        <bufferAttribute attach="attributes-aOrbit" args={[orbits, 3]} />
      </bufferGeometry>
      {/* Blending normal : la fumée absorbe la lumière, elle n'en émet pas.
          Le FogExp2 de la scène n'est pas appliqué (ShaderMaterial ne l'intègre
          pas par défaut) — assumé ici, la dilution en altitude joue ce rôle. */}
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
