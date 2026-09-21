'use client'

import { useEffect, useMemo } from 'react'
import {
  AlwaysStencilFunc,
  BackSide,
  type BufferGeometry,
  DecrementWrapStencilOp,
  FrontSide,
  IncrementWrapStencilOp,
  type Mesh,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  type Plane,
  PlaneGeometry,
  ReplaceStencilOp,
  type WebGLRenderer,
} from 'three'
import type { RefObject } from 'react'

interface CoupeProps {
  geometrie: BufferGeometry
  plan: Plane
  /** Centre horizontal et emprise du quad de capping, en repère three (X, Z). */
  centre: [number, number]
  emprise: [number, number]
  /** Le quad, dont la hauteur est posée à chaque frame par la scène. */
  quadRef: RefObject<Mesh | null>
}

const ACCENT = '#b5452d'

/**
 * Face coupée par stencil, sur le modèle de webgl_clipping_stencil : les
 * faces arrière du solide clippé incrémentent, les faces avant décrémentent ;
 * là où le compte n'est pas nul, le plan traverse de la matière, et le quad
 * couleur terre cuite se dessine. Seule surface colorée de l'écran.
 */
export default function Coupe({ geometrie, plan, centre, emprise, quadRef }: CoupeProps) {
  const materiaux = useMemo(() => {
    const base = {
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: AlwaysStencilFunc,
      clippingPlanes: [plan],
    }
    const dos = new MeshBasicMaterial({
      ...base,
      side: BackSide,
      stencilFail: IncrementWrapStencilOp,
      stencilZFail: IncrementWrapStencilOp,
      stencilZPass: IncrementWrapStencilOp,
    })
    const face = new MeshBasicMaterial({
      ...base,
      side: FrontSide,
      stencilFail: DecrementWrapStencilOp,
      stencilZFail: DecrementWrapStencilOp,
      stencilZPass: DecrementWrapStencilOp,
    })
    const cap = new MeshBasicMaterial({
      color: ACCENT,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: NotEqualStencilFunc,
      stencilFail: ReplaceStencilOp,
      stencilZFail: ReplaceStencilOp,
      stencilZPass: ReplaceStencilOp,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    return { dos, face, cap }
  }, [plan])

  const quad = useMemo(() => new PlaneGeometry(emprise[0] + 4, emprise[1] + 4), [emprise])

  useEffect(() => {
    return () => {
      materiaux.dos.dispose()
      materiaux.face.dispose()
      materiaux.cap.dispose()
      quad.dispose()
    }
  }, [materiaux, quad])

  return (
    <>
      <mesh geometry={geometrie} material={materiaux.dos} renderOrder={1} frustumCulled={false} />
      <mesh geometry={geometrie} material={materiaux.face} renderOrder={1} frustumCulled={false} />
      <mesh
        ref={quadRef}
        geometry={quad}
        material={materiaux.cap}
        renderOrder={1.1}
        position={[centre[0], 0, centre[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        onAfterRender={(gl: WebGLRenderer) => gl.clearStencil()}
      />
    </>
  )
}
