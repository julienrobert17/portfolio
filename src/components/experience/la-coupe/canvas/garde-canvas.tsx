'use client'

import { Component, type ReactNode } from 'react'
import { setModeHero } from '../lib/hero-store'

interface GardeCanvasProps {
  children: ReactNode
}

interface GardeCanvasState {
  erreur: boolean
}

/**
 * Si la scène plante (géométrie, contexte WebGL perdu, shader refusé), on
 * bascule en repli statique au lieu de faire tomber la page.
 */
export default class GardeCanvas extends Component<GardeCanvasProps, GardeCanvasState> {
  state: GardeCanvasState = { erreur: false }

  static getDerivedStateFromError(): GardeCanvasState {
    return { erreur: true }
  }

  componentDidCatch(): void {
    setModeHero('statique')
  }

  render(): ReactNode {
    return this.state.erreur ? null : this.props.children
  }
}
