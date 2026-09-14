'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AERIAL_FOG_SCALE, aerialFactor } from './aerial'

/** Position par défaut du soleil : ancienne position du disque solaire. */
const DEFAULT_SUN_POSITION: [number, number, number] = [120, 200, 80]

/**
 * Demi-largeur du frustum d'ombre. Les objets de la scène (prototaxites, arbres,
 * arthropodes, eau) tiennent dans une boîte d'environ ±60 unités autour de
 * l'origine : cadrer la shadow camera dessus plutôt que sur les 800 unités du
 * terrain garde ~34 texels/unité en 2048² au lieu de ~2,5.
 */
const SHADOW_EXTENT = 60

/** Densité de brume au ras du sol. Calibrée sur les cadrages bas, elle est bonne. */
const FOG_DENSITY = 0.0065
/**
 * Teinte de la brume. Réchauffée d'un cran vers le vert-gris par rapport au
 * sépia d'origine (#c2a276) : à 60 % de brume, un sépia franc ne délavait pas
 * seulement le lointain, il l'ÉCLAIRCISSAIT, parce qu'il est bien plus lumineux
 * que le sol. Les verts du tapis et du feuillage disparaissaient sous l'orange.
 */
const FOG_COLOR = '#b0a083'

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Dégradé à trois arrêts (horizon chaud → bande médiane pâle → zénith bleu
 * profond) avec transitions en pow() : l'atmosphère dévonienne, plus dense et
 * plus riche en CO₂ que l'actuelle, diffuse davantage près de l'horizon.
 * Le halo solaire est calculé depuis l'angle fragment/soleil.
 */
const skyFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  varying vec3 vWorldPos;

  const vec3 HORIZON = vec3(0.72, 0.52, 0.30);
  const vec3 MIDBAND = vec3(0.45, 0.50, 0.58);
  const vec3 ZENITH  = vec3(0.11, 0.24, 0.55);
  const vec3 SUN_TINT = vec3(1.00, 0.90, 0.66);

  void main() {
    vec3 dir = normalize(vWorldPos);
    float up = clamp(dir.y, 0.0, 1.0);

    // pow < 1 : la couche basse s'épaissit, le bleu ne prend que haut dans le ciel.
    float zenithMix = pow(up, 0.55);
    vec3 col = mix(MIDBAND, ZENITH, zenithMix);

    // pow élevé : bande chaude serrée sur l'horizon, décroissance rapide.
    float horizonBand = pow(1.0 - up, 7.0);
    col = mix(col, HORIZON, horizonBand);

    // Halo solaire : coeur serré + diffusion large (atmosphère dense).
    float cosAngle = clamp(dot(dir, uSunDirection), 0.0, 1.0);
    float halo =
      pow(cosAngle, 220.0) * 1.60 +
      pow(cosAngle, 24.0)  * 0.34 +
      pow(cosAngle, 4.0)   * 0.10;
    col += SUN_TINT * halo;

    gl_FragColor = vec4(col, 1.0);
  }
`

type DevonianAtmosphereProps = {
  /** Source unique pour la lumière principale, le disque solaire et le halo. */
  sunPosition?: [number, number, number]
}

export default function DevonianAtmosphere({
  sunPosition = DEFAULT_SUN_POSITION,
}: DevonianAtmosphereProps) {
  const sunLightRef = useRef<THREE.DirectionalLight>(null)

  useFrame((state) => {
    const aerial = aerialFactor(state.camera.position.y)

    // Brume pilotée par l'altitude de la caméra. Ce n'est PAS un fog à densité
    // variable en altitude calculé par fragment : ce serait plus juste, mais il
    // faudrait réécrire le chunk fog_fragment de three GLOBALEMENT pour
    // atteindre aussi les matériaux venus du GLB des arbres. L'approximation
    // est exacte dans le cas qui pose problème — caméra haute regardant un
    // terrain bas — et ne coûte pas une ligne de GLSL.
    const fog = state.scene.fog
    if (fog instanceof THREE.FogExp2) {
      fog.density = FOG_DENSITY * (1 + (AERIAL_FOG_SCALE - 1) * aerial)
    }

    // Vue aérienne : on gèle la shadow map. Le frustum de la directionnelle ne
    // couvre que ±60 unités, soit le quart central d'une image qui porte à 240,
    // et à cette altitude ces ombres font quelques pixels. Elles étaient
    // pourtant redessinées à chaque frame.
    state.gl.shadowMap.autoUpdate = aerial < 1
  })

  const [sunX, sunY, sunZ] = sunPosition
  const sunDistance = Math.sqrt(sunX * sunX + sunY * sunY + sunZ * sunZ) || 1

  // Le frustum d'ombre doit englober la boîte ±SHADOW_EXTENT projetée sur l'axe
  // du soleil : la diagonale vaut au pire SHADOW_EXTENT * sqrt(3) ≈ 1.74.
  const shadowMargin = SHADOW_EXTENT * 1.8
  const shadowNear = Math.max(0.5, sunDistance - shadowMargin)
  const shadowFar = sunDistance + shadowMargin

  const skyUniforms = useMemo(
    () => ({
      uSunDirection: {
        value: new THREE.Vector3(
          sunX / sunDistance,
          sunY / sunDistance,
          sunZ / sunDistance,
        ),
      },
    }),
    [sunX, sunY, sunZ, sunDistance],
  )

  // three ne rafraîchit la projection de la shadow camera qu'à la création de la
  // shadow map : si sunPosition change ensuite, il faut la recalculer à la main.
  useEffect(() => {
    const light = sunLightRef.current
    if (!light) return
    light.shadow.camera.updateProjectionMatrix()
  }, [shadowNear, shadowFar])

  return (
    <>
      {/* Densité montée vs l'original pour masquer les bords du sol */}
      {/* Densité descendue de 0.012 : elle avait été montée pour masquer les bords
          d'un sol de 400 unités, qui en fait 800 depuis. À 0.0065 on lit encore les
          plans du relief vers 200-300 unités, et le bord du sol reste noyé. Teinte
          rapprochée de la bande d'horizon du shader de ciel. */}
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      <color attach="background" args={['#4a6fa0']} />

      {/* Lumière principale — alignée sur le disque solaire et le halo */}
      <directionalLight
        ref={sunLightRef}
        color="#e8d5a0"
        intensity={2.8}
        position={sunPosition}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={shadowNear}
        shadow-camera-far={shadowFar}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Fill + ambiance — valeurs inchangées */}
      <directionalLight color="#a0c8d0" intensity={0.6} position={[-20, 15, -10]} />
      <ambientLight color="#1a2e1a" intensity={1.2} />
      <hemisphereLight args={['#2d4a2d', '#1a0e08', 0.8]} />

      {/* Ciel */}
      <mesh>
        <sphereGeometry args={[400, 32, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={skyUniforms}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
        />
      </mesh>

      {/* Disque solaire — fog={false} sinon la brume le délave à ~247 unités */}
      <mesh position={sunPosition}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#fff5d0" fog={false} />
      </mesh>
    </>
  )
}
