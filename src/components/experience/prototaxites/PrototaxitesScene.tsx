'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import type { Beat } from './constants/narrative'

// ─── Props ───────────────────────────────────────────────────────────────────

interface PrototaxiteSceneProps {
  currentPhase: Beat['phase']
  progress: number
}

type Phase = Beat['phase']

// ─── Camera table ─────────────────────────────────────────────────────────────
// 'zoomout' is driven by progress in the animation loop, not by this table.

const CAM: Record<Exclude<Phase, 'zoomout'>, {
  p: [number, number, number]
  t: [number, number, number]
}> = {
  context:   { p: [8,   3,  12], t: [0, 4, 0] },
  presence:  { p: [8,   3,  12], t: [0, 4, 0] },
  interior:  { p: [0.8, 3.5, 0.8], t: [0, 4.5, 0] },
  ecosystem: { p: [18,  8,  22], t: [0, 2, 0] },
  eclipse:   { p: [14,  6,  18], t: [0, 4, 0] },
  resonance: { p: [0,  45,  55], t: [0, 8, 0] },
}

const ZOOM_P0: [number, number, number] = [14,  6, 18]
const ZOOM_P1: [number, number, number] = [ 0, 45, 55]
const ZOOM_T0: [number, number, number] = [ 0,  4,  0]
const ZOOM_T1: [number, number, number] = [ 0,  8,  0]

// ─── Component ───────────────────────────────────────────────────────────────

export default function PrototaxitesScene({ currentPhase, progress }: PrototaxiteSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Written each render so the animation loop always reads fresh values
  const phaseRef    = useRef<Phase>(currentPhase)
  const progressRef = useRef<number>(progress)
  phaseRef.current    = currentPhase
  progressRef.current = progress

  // Three.js objects exposed to both effects
  const rendererRef      = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef        = useRef<THREE.PerspectiveCamera | null>(null)
  const lookAtRef        = useRef<THREE.Vector3>(new THREE.Vector3(0, 4, 0))
  const protoShaderRef   = useRef<THREE.ShaderMaterial | null>(null)
  const internalRef      = useRef<THREE.Group | null>(null)
  const trunkMatRef      = useRef<THREE.MeshStandardMaterial | null>(null)
  const branchMatRef     = useRef<THREE.MeshStandardMaterial | null>(null)
  const arthMatRef           = useRef<THREE.MeshStandardMaterial | null>(null)
  const foliageMatRef        = useRef<THREE.MeshStandardMaterial | null>(null)
  const secondaryProtoMatRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const farTreeMatRef        = useRef<THREE.MeshStandardMaterial | null>(null)
  const smokeMatRef          = useRef<THREE.PointsMaterial | null>(null)
  const smokeBufRef      = useRef<THREE.BufferGeometry | null>(null)
  const smokeVelsRef     = useRef<Float32Array | null>(null)
  const arthropodsRef    = useRef<{
    group: THREE.Group
    speed: number
    dir: number
    nextTurn: number
  }[]>([])
  const rafRef  = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const prevPhaseRef = useRef<Phase>(currentPhase)

  // ── MAIN SETUP (mounts once) ──────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Scene + fog ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#4a6fa0')
    scene.fog = new THREE.FogExp2(0xb8956a, 0.008)

    // ── Camera ──────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      800,
    )
    camera.position.set(...CAM.context.p)
    camera.lookAt(lookAtRef.current)
    cameraRef.current = camera

    // ── Lights ──────────────────────────────────────────────────────────────
    const sun = new THREE.DirectionalLight('#e8d5a0', 2.8)
    sun.position.set(30, 40, 20)
    scene.add(sun)
    const fill = new THREE.DirectionalLight('#a0c8d0', 0.6)
    fill.position.set(-20, 15, -10)
    scene.add(fill)
    scene.add(new THREE.AmbientLight('#1a2e1a', 1.2))
    scene.add(new THREE.HemisphereLight('#2d4a2d', '#1a0e08', 0.8))

    // ── Sky (shader gradient, inside of sphere) ──────────────────────────────
    const skyGeo = new THREE.SphereGeometry(400, 32, 16)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float t = clamp((vWorldPos.y + 400.0) / 800.0, 0.0, 1.0);
          vec3 horizon = vec3(0.55, 0.42, 0.28);
          vec3 zenith  = vec3(0.28, 0.45, 0.72);
          gl_FragColor = vec4(mix(horizon, zenith, t), 1.0);
        }
      `,
    })
    scene.add(new THREE.Mesh(skyGeo, skyMat))

    // ── Sun — point light + visual disk ─────────────────────────────────────
    const sunLight = new THREE.PointLight('#fff5d0', 3.0, 0, 0)
    sunLight.position.set(120, 200, 80)
    scene.add(sunLight)
    // MeshBasicMaterial ignores lighting → always rendered at full brightness
    const sunDiskGeo = new THREE.SphereGeometry(8, 16, 16)
    const sunDiskMat = new THREE.MeshBasicMaterial({ color: '#fff5d0' })
    const sunDisk    = new THREE.Mesh(sunDiskGeo, sunDiskMat)
    sunDisk.position.set(120, 200, 80)
    scene.add(sunDisk)

    // ── Ground ───────────────────────────────────────────────────────────────
    // Compromise: vertex displacement done in JS (CPU) rather than GLSL for
    // reliability; visually equivalent for a 80×80 grid.
    const groundGeo = new THREE.PlaneGeometry(300, 300, 80, 80)
    groundGeo.rotateX(-Math.PI / 2)
    const gp = groundGeo.attributes.position.array as Float32Array
    for (let i = 0; i < gp.length; i += 3) {
      const x = gp[i], z = gp[i + 2]
      gp[i + 1] =
        Math.sin(x * 0.5) * Math.cos(z * 0.3) * 0.8 +
        Math.sin(x * 1.2 + z * 0.8) * 0.4 +
        Math.sin(x * 3.1 + z * 2.7) * 0.15 - 0.3
    }
    groundGeo.attributes.position.needsUpdate = true
    groundGeo.computeVertexNormals()
    const colors = new Float32Array(gp.length)
    for (let i = 0; i < gp.length; i += 3) {
      const h  = gp[i + 1]
      const ct = Math.max(0, Math.min(1, (h + 1.5) / 3.0))
      colors[i]     = 0.35 + ct * 0.15
      colors[i + 1] = 0.18 + ct * 0.08
      colors[i + 2] = 0.08 + ct * 0.04
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#5a3520',
      roughness: 0.82,
      metalness: 0,
      vertexColors: true,
    })
    scene.add(new THREE.Mesh(groundGeo, groundMat))

    // ── Cooksonia (80 primitive plants) ──────────────────────────────────────
    // Shared geometries — mesh.scale used per instance (no geometry cloning)
    const stemGeo  = new THREE.CylinderGeometry(0.03, 0.035, 1, 5)
    const sporeGeo = new THREE.SphereGeometry(0.06, 5, 4)
    const pMat0 = new THREE.MeshStandardMaterial({ color: '#5aaa5a', roughness: 0.9 })
    const pMat1 = new THREE.MeshStandardMaterial({ color: '#4a8a4a', roughness: 0.9 })
    const plantMats = [pMat0, pMat1]
    for (let i = 0; i < 80; i++) {
      let px: number, pz: number
      do {
        px = (Math.random() - 0.5) * 120
        pz = (Math.random() - 0.5) * 120
      } while (px * px + pz * pz < 64)
      const h   = 0.15 + Math.random() * 0.25
      const mat = plantMats[i & 1]
      const stem = new THREE.Mesh(stemGeo, mat)
      stem.scale.set(1, h, 1)
      stem.position.y = h * 0.5
      const spore = new THREE.Mesh(sporeGeo, mat)
      spore.position.y = h + 0.06
      const g = new THREE.Group()
      g.add(stem, spore)
      g.position.set(px, 0, pz)
      g.rotation.y = Math.random() * Math.PI * 2
      scene.add(g)
    }

    // ── Arthropods (12 simple creatures) ─────────────────────────────────────
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.08, 0.15)
    const legGeo  = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4)
    const arthMat = new THREE.MeshStandardMaterial({ color: '#1a0e08', roughness: 0.95, transparent: true, opacity: 0 })
    arthMatRef.current = arthMat
    const arthData: typeof arthropodsRef.current = []
    for (let i = 0; i < 12; i++) {
      const ag = new THREE.Group()
      ag.add(new THREE.Mesh(bodyGeo, arthMat))
      for (let j = 0; j < 4; j++) {
        const xo = (j / 3 - 0.5) * 0.22
        for (const s of [-1, 1] as const) {
          const leg = new THREE.Mesh(legGeo, arthMat)
          leg.position.set(xo, 0, s * 0.12)
          leg.rotation.z = s * 0.5
          ag.add(leg)
        }
      }
      const a = Math.random() * Math.PI * 2
      const r = 10 + Math.random() * 50
      ag.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r)
      scene.add(ag)
      arthData.push({
        group: ag,
        speed: 0.008 + Math.random() * 0.015,
        dir:   Math.random() * Math.PI * 2,
        nextTurn: 3 + Math.random() * 2,
      })
    }
    arthropodsRef.current = arthData

    // ── Prototaxite body ──────────────────────────────────────────────────────
    const protoGeo = new THREE.CylinderGeometry(0.6, 1.1, 8, 12, 40)
    const protoShader = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime:    { value: 0 },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
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
      `,
      fragmentShader: `
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
      `,
    })
    const protoMesh = new THREE.Mesh(protoGeo, protoShader)
    protoMesh.position.set(0, 4, 0)
    scene.add(protoMesh)
    protoShaderRef.current = protoShader

    // ── Secondary Prototaxites (5 instances — même géométrie, matériau simple) ─
    const protoSecMat = new THREE.MeshStandardMaterial({ color: '#1f1008', roughness: 0.94, metalness: 0.01, transparent: true, opacity: 1 })
    secondaryProtoMatRef.current = protoSecMat
    const secondaryProtos = [
      { x: -12, y: 3,   z:  -8, sx: 0.7,  sy: 0.75, sz: 0.7  },
      { x:  15, y: 2.4, z:  -5, sx: 0.6,  sy: 0.6,  sz: 0.6  },
      { x:  -6, y: 4,   z:  14, sx: 0.85, sy: 1.0,  sz: 0.85 },
      { x:  20, y: 2.2, z:   8, sx: 0.5,  sy: 0.55, sz: 0.5  },
      { x: -18, y: 4.4, z:   5, sx: 0.9,  sy: 1.1,  sz: 0.9  },
    ]
    secondaryProtos.forEach(({ x, y, z, sx, sy, sz }) => {
      const m = new THREE.Mesh(protoGeo, protoSecMat)
      m.scale.set(sx, sy, sz)
      m.position.set(x, y, z)
      scene.add(m)
    })

    // ── Internal structure (hidden; revealed in 'interior' phase) ─────────────
    const internalGroup = new THREE.Group()
    internalGroup.position.set(0, 4, 0)
    const tubeBaseGeo = new THREE.CylinderGeometry(1, 1, 7.5, 5)
    const spotBaseGeo = new THREE.SphereGeometry(0.08, 6, 4)
    const internalMats: THREE.MeshStandardMaterial[] = []
    const layers = [
      { r: 0.2,  n: 6,  tr: 0.015 },
      { r: 0.5,  n: 12, tr: 0.025 },
      { r: 0.85, n: 18, tr: 0.035 },
    ]
    layers.forEach(({ r, n, tr }) => {
      for (let i = 0; i < n; i++) {
        const a   = (i / n) * Math.PI * 2
        const m   = new THREE.MeshStandardMaterial({
          color: '#2a6a4a',
          emissive: '#2a6a4a',
          emissiveIntensity: 0,
          transparent: true,
          opacity: 0,
        })
        internalMats.push(m)
        const tube = new THREE.Mesh(tubeBaseGeo, m)
        tube.scale.set(tr, 1, tr)
        tube.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
        internalGroup.add(tube)
      }
    })
    for (let i = 0; i < 8; i++) {
      const m = new THREE.MeshStandardMaterial({
        color: '#3a8a5a',
        emissive: '#3a8a5a',
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      })
      internalMats.push(m)
      const spot = new THREE.Mesh(spotBaseGeo, m)
      spot.position.y = -3.5 + i * 1.0
      internalGroup.add(spot)
    }
    scene.add(internalGroup)
    internalRef.current = internalGroup

    // ── Trees (hidden; revealed during 'eclipse') ─────────────────────────────
    const trunkMat  = new THREE.MeshStandardMaterial({ color: '#1a0e06', roughness: 0.95, transparent: true, opacity: 0 })
    const branchMat = new THREE.MeshStandardMaterial({ color: '#2d3a1a', roughness: 0.95, transparent: true, opacity: 0 })
    trunkMatRef.current  = trunkMat
    branchMatRef.current = branchMat
    const trunkBaseGeo  = new THREE.CylinderGeometry(0.25, 0.35, 1, 6)
    const branchBaseGeo = new THREE.CylinderGeometry(0.05, 0.09, 1, 4)
    // Couronne de feuillage : sphère aplatie simulant les frondes dévoniennes
    const foliageGeo = new THREE.SphereGeometry(2.5, 6, 4)
    const foliageMat = new THREE.MeshStandardMaterial({ color: '#1a3a0e', roughness: 0.9, transparent: true, opacity: 0 })
    foliageMatRef.current = foliageMat
    const treesGroup    = new THREE.Group()
    for (let i = 0; i < 24; i++) {
      const ang  = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
      const dist = 15 + Math.random() * 20
      const h    = 5 + Math.random() * 7
      const tg   = new THREE.Group()
      tg.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist)
      const trunk = new THREE.Mesh(trunkBaseGeo, trunkMat)
      trunk.scale.y = h
      trunk.position.y = h * 0.5
      tg.add(trunk)
      for (let b = 0; b < 6; b++) {
        const ba  = (b / 6) * Math.PI * 2
        const bl  = 1.5 + Math.random()
        const br  = new THREE.Mesh(branchBaseGeo, branchMat)
        br.scale.y = bl
        br.position.set(Math.cos(ba) * 0.4, h * 0.7 + Math.random() * h * 0.2, Math.sin(ba) * 0.4)
        br.rotation.z = (Math.cos(ba) * Math.PI) / 5
        br.rotation.x = (Math.sin(ba) * Math.PI) / 5
        tg.add(br)
      }
      // Couronne ovale au sommet du tronc
      const crown = new THREE.Mesh(foliageGeo, foliageMat)
      crown.scale.set(1, 0.4, 1)
      crown.position.y = h
      tg.add(crown)
      treesGroup.add(tg)
    }
    scene.add(treesGroup)

    // ── Far trees — prolifération pendant 'zoomout' ───────────────────────────
    // Compromise : troncs uniquement (pas de branches ni feuillage) pour les
    // instances lointaines (r=35-80), pour limiter le nombre de draw calls.
    const farTreeMat = new THREE.MeshStandardMaterial({ color: '#1a0e06', roughness: 0.95, transparent: true, opacity: 0 })
    farTreeMatRef.current = farTreeMat
    const farTreesGroup = new THREE.Group()
    for (let i = 0; i < 40; i++) {
      const ang  = Math.random() * Math.PI * 2
      const dist = 35 + Math.random() * 45
      const h    = 6 + Math.random() * 8
      const tg   = new THREE.Group()
      tg.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist)
      const trunk = new THREE.Mesh(trunkBaseGeo, farTreeMat)
      trunk.scale.y = h
      trunk.position.y = h * 0.5
      tg.add(trunk)
      farTreesGroup.add(tg)
    }
    scene.add(farTreesGroup)

    // ── Smoke particles (visible at end of 'zoomout') ─────────────────────────
    const SMOKE_N = 40
    const smokePos  = new Float32Array(SMOKE_N * 3)
    const smokeVels = new Float32Array(SMOKE_N * 3)
    for (let i = 0; i < SMOKE_N; i++) {
      smokePos[i * 3]     = -80 + (Math.random() - 0.5) * 10
      smokePos[i * 3 + 1] = Math.random() * 20
      smokePos[i * 3 + 2] = -60 + (Math.random() - 0.5) * 10
      smokeVels[i * 3 + 1] = 0.02 + Math.random() * 0.02
    }
    const smokeBuf = new THREE.BufferGeometry()
    smokeBuf.setAttribute('position', new THREE.BufferAttribute(smokePos, 3))
    const smokeMat = new THREE.PointsMaterial({
      color: '#8a6a4a',
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    scene.add(new THREE.Points(smokeBuf, smokeMat))
    smokeMatRef.current  = smokeMat
    smokeBufRef.current  = smokeBuf
    smokeVelsRef.current = smokeVels

    // ── Animation loop ────────────────────────────────────────────────────────
    let last = performance.now()

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const now   = performance.now()
      const dt    = (now - last) / 1000
      last = now
      timeRef.current += dt

      const t     = timeRef.current
      const phase = phaseRef.current
      const prog  = progressRef.current

      // Prototaxite shader time (drives stripes + emission pulse in GLSL)
      if (protoShaderRef.current) {
        protoShaderRef.current.uniforms.uTime.value = t
      }

      // Internal tubes pulse (only during interior)
      if (phase === 'interior') {
        internalGroup.children.forEach((child, idx) => {
          if (child instanceof THREE.Mesh) {
            const m = child.material as THREE.MeshStandardMaterial
            m.emissiveIntensity = (Math.sin(t * 1.2 + idx * 0.3) * 0.5 + 0.5) * 0.4
          }
        })
      }

      // Arthropod movement
      const time = timeRef.current
      arthropodsRef.current.forEach((arth) => {
        if (time >= arth.nextTurn) {
          arth.dir      = Math.random() * Math.PI * 2
          arth.nextTurn = time + 3 + Math.random() * 2
        }
        arth.group.position.x += Math.cos(arth.dir) * arth.speed
        arth.group.position.z += Math.sin(arth.dir) * arth.speed
        arth.group.rotation.y  = -arth.dir + Math.PI * 0.5
        // Boundary: turn around if too far out
        const d2 = arth.group.position.x ** 2 + arth.group.position.z ** 2
        if (d2 > 3600) arth.dir += Math.PI + (Math.random() - 0.5) * 0.4
      })

      // Zoomout: camera driven by progress + far trees proliferate
      if (phase === 'zoomout') {
        camera.position.x = THREE.MathUtils.lerp(ZOOM_P0[0], ZOOM_P1[0], prog)
        camera.position.y = THREE.MathUtils.lerp(ZOOM_P0[1], ZOOM_P1[1], prog)
        camera.position.z = THREE.MathUtils.lerp(ZOOM_P0[2], ZOOM_P1[2], prog)
        lookAtRef.current.set(
          THREE.MathUtils.lerp(ZOOM_T0[0], ZOOM_T1[0], prog),
          THREE.MathUtils.lerp(ZOOM_T0[1], ZOOM_T1[1], prog),
          THREE.MathUtils.lerp(ZOOM_T0[2], ZOOM_T1[2], prog),
        )
        // Far trees visibles à 50 % du dézoom
        if (farTreeMatRef.current) {
          farTreeMatRef.current.opacity = THREE.MathUtils.clamp(prog * 2, 0, 1)
        }
      }

      // Eclipse: trees + foliage fade in; Prototaxites s'éteignent après 50%
      if (phase === 'eclipse') {
        const op = THREE.MathUtils.clamp(prog * 1.5, 0, 1)
        if (trunkMatRef.current)   trunkMatRef.current.opacity   = op
        if (branchMatRef.current)  branchMatRef.current.opacity  = op
        if (foliageMatRef.current) foliageMatRef.current.opacity = op
        if (prog > 0.5) {
          const fadeP = (prog - 0.5) / 0.5  // 0→1 entre 50 % et 100 %
          if (protoShaderRef.current) {
            protoShaderRef.current.uniforms.uOpacity.value = Math.max(0, 1 - fadeP)
          }
          if (secondaryProtoMatRef.current) {
            secondaryProtoMatRef.current.opacity = Math.max(0, 1 - fadeP)
          }
        }
      }

      // Smoke: appears when zoomout progress > 0.85
      if (phase === 'zoomout' && prog > 0.85 && smokeMatRef.current && smokeBufRef.current) {
        smokeMatRef.current.opacity = THREE.MathUtils.mapLinear(prog, 0.85, 1, 0, 0.6)
        const sp = smokeBufRef.current.attributes.position.array as Float32Array
        const sv = smokeVelsRef.current
        if (sv) {
          for (let i = 0; i < SMOKE_N; i++) {
            sp[i * 3 + 1] += sv[i * 3 + 1]
            if (sp[i * 3 + 1] > 40) sp[i * 3 + 1] = 0
          }
          smokeBufRef.current.attributes.position.needsUpdate = true
        }
      }

      camera.lookAt(lookAtRef.current)
      renderer.render(scene, camera)
    }

    tick()

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(container)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(lookAtRef.current)

      // Dispose shared geometries
      skyGeo.dispose()
      skyMat.dispose()
      sunDiskGeo.dispose()
      sunDiskMat.dispose()
      groundGeo.dispose()
      groundMat.dispose()
      stemGeo.dispose()
      sporeGeo.dispose()
      pMat0.dispose()
      pMat1.dispose()
      bodyGeo.dispose()
      legGeo.dispose()
      gsap.killTweensOf(arthMat)
      arthMat.dispose()
      protoGeo.dispose()
      protoShader.dispose()
      protoSecMat.dispose()
      protoShaderRef.current?.dispose()
      tubeBaseGeo.dispose()
      spotBaseGeo.dispose()
      internalMats.forEach(m => m.dispose())
      trunkBaseGeo.dispose()
      branchBaseGeo.dispose()
      foliageGeo.dispose()
      foliageMat.dispose()
      farTreeMat.dispose()
      trunkMat.dispose()
      branchMat.dispose()
      smokeBuf.dispose()
      smokeMat.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CAMERA + PHASE TRANSITIONS ────────────────────────────────────────────
  useEffect(() => {
    const camera = cameraRef.current
    const lookAt = lookAtRef.current
    if (!camera) return

    const prev = prevPhaseRef.current
    prevPhaseRef.current = currentPhase

    // Zoomout camera is driven by progress in the animation loop
    if (currentPhase === 'zoomout') {
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(lookAt)
    } else {
      const cp = CAM[currentPhase]
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(lookAt)
      gsap.to(camera.position, { x: cp.p[0], y: cp.p[1], z: cp.p[2], duration: 2.5, ease: 'power2.inOut' })
      gsap.to(lookAt,          { x: cp.t[0], y: cp.t[1], z: cp.t[2], duration: 2.5, ease: 'power2.inOut' })
    }

    // Arthropods — hidden until 'ecosystem'
    const arthMat = arthMatRef.current
    if (arthMat) {
      if (currentPhase === 'ecosystem') {
        gsap.to(arthMat, { opacity: 1, duration: 2.0, ease: 'power1.inOut' })
      } else if (currentPhase === 'presence' || currentPhase === 'interior') {
        gsap.killTweensOf(arthMat)
        arthMat.opacity = 0
      }
    }

    // Restaure l'opacité des Prototaxites si on quitte 'eclipse'
    if (prev === 'eclipse' && currentPhase !== 'eclipse') {
      if (protoShaderRef.current) protoShaderRef.current.uniforms.uOpacity.value = 1
      if (secondaryProtoMatRef.current) secondaryProtoMatRef.current.opacity = 1
    }

    // Entering 'interior' — reveal internal structure through translucent body
    // uOpacity uniform drives transparency; no material swap needed.
    if (currentPhase === 'interior') {
      const shader = protoShaderRef.current
      const ig     = internalRef.current
      if (shader) {
        shader.side = THREE.DoubleSide
        gsap.to(shader.uniforms.uOpacity, { value: 0.3, duration: 1.5, ease: 'power1.inOut' })
      }
      if (ig) {
        ig.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            const m = child.material as THREE.MeshStandardMaterial
            gsap.to(m, { opacity: 0.7, duration: 1.5, ease: 'power1.inOut' })
          }
        })
      }
    }

    // Leaving 'interior' — restore full opacity, hide internal structure
    if (prev === 'interior' && currentPhase !== 'interior') {
      const shader = protoShaderRef.current
      const ig     = internalRef.current
      if (shader) {
        gsap.to(shader.uniforms.uOpacity, {
          value: 1, duration: 1.0, ease: 'power1.inOut',
          onComplete: () => { shader.side = THREE.FrontSide },
        })
      }
      if (ig) {
        ig.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            const m = child.material as THREE.MeshStandardMaterial
            gsap.to(m, { opacity: 0, duration: 0.8 })
          }
        })
      }
    }
  }, [currentPhase])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, background: '#020a06' }}
    />
  )
}
