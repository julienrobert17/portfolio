/**
 * Effets canvas 2D purs, sans dépendance ni composant React.
 * L'appelant fournit le canvas, les couleurs et les emojis.
 * Ce module ne lit pas prefers-reduced-motion : c'est à l'appelant de décider.
 */

export interface BurstOptions {
  /** Couleurs CSS fournies par l'appelant. */
  colors: string[]
  /** Nombre de particules. Défaut raisonnable ~90. */
  count?: number
  /** Origine en fractions du canvas, 0→1. Défaut { x: 0.5, y: 0.35 }. */
  origin?: { x: number; y: number }
}

interface Stage {
  ctx: CanvasRenderingContext2D
  /** Dimensions en pixels CSS. */
  width: number
  height: number
  /** Force une nouvelle mesure (utile juste avant de faire naître les particules). */
  remeasure: () => void
  dispose: () => void
}

interface Confetto {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  rot: number
  vr: number
  color: string
  age: number
  ttl: number
}

interface EmojiParticle {
  x: number
  y: number
  vy: number
  vx: number
  size: number
  rot: number
  vr: number
  glyph: string
}

/** Gravité et friction, exprimées par frame de référence (60 fps). */
const GRAVITY = 0.32
const AIR_FRICTION = 0.985
const BURST_LIFETIME_MS = 3000
const EMOJI_DEFAULT_DURATION_MS = 2600

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Prépare le canvas : backing store en fonction du devicePixelRatio,
 * transformation pour dessiner en pixels CSS, et suivi des redimensionnements.
 *
 * Toutes les dimensions exposées (width/height) sont en PIXELS CSS.
 * On ne lit jamais canvas.width/height (pixels device) ni canvas.clientWidth/Height
 * (qui valent 300x150 par défaut tant que l'élément n'est pas mis en page).
 */
function createStage(canvas: HTMLCanvasElement): Stage | null {
  const ctx = canvas.getContext('2d')
  if (ctx === null) return null

  let width = 1
  let height = 1

  const measure = (): void => {
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1
    const rect = canvas.getBoundingClientRect()
    // Repli sur le viewport (canvas plein écran) et jamais sur la taille intrinsèque.
    const cssWidth = rect.width > 0 ? rect.width : window.innerWidth
    const cssHeight = rect.height > 0 ? rect.height : window.innerHeight

    width = Math.max(1, cssWidth)
    height = Math.max(1, cssHeight)

    const backingWidth = Math.max(1, Math.round(width * dpr))
    const backingHeight = Math.max(1, Math.round(height * dpr))

    // Réassigner width/height vide le canvas : on ne le fait qu'en cas de changement.
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth
      canvas.height = backingHeight
    }
    // Toujours après un redimensionnement : la réassignation réinitialise la transform.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  measure()
  window.addEventListener('resize', measure)

  // La mise en page peut arriver après l'appel (canvas monté par React) :
  // l'observer corrige les dimensions dès que la boîte réelle est connue.
  const observer =
    typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null
  observer?.observe(canvas)

  return {
    ctx,
    get width(): number {
      return width
    },
    get height(): number {
      return height
    },
    remeasure: measure,
    dispose: (): void => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    },
  }
}

/** Efface toute la surface, quel que soit le ratio courant. */
function clearStage(stage: Stage): void {
  stage.ctx.clearRect(0, 0, stage.width, stage.height)
}

/** Lance une salve. Retourne une fonction d'annulation idempotente. */
export function burstConfetti(canvas: HTMLCanvasElement, options: BurstOptions): () => void {
  const stage = createStage(canvas)
  if (stage === null) return (): void => {}

  const palette = options.colors.length > 0 ? options.colors : ['#ffffff']
  const count = options.count ?? 90
  const origin = options.origin ?? { x: 0.5, y: 0.35 }

  const particles: Confetto[] = []

  // Naissance différée à la première frame : la mise en page du canvas est alors
  // effective, donc l'origine est calculée sur les vraies dimensions CSS.
  const spawn = (): void => {
    stage.remeasure()
    const originX = stage.width * origin.x
    const originY = stage.height * origin.y
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(-Math.PI, 0) + randomBetween(-0.35, 0.35)
      const speed = randomBetween(5, 14)
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * randomBetween(0.6, 1.3),
        vy: Math.sin(angle) * speed,
        w: randomBetween(5, 11),
        h: randomBetween(7, 15),
        rot: randomBetween(0, Math.PI * 2),
        vr: randomBetween(-0.28, 0.28),
        color: palette[i % palette.length],
        age: 0,
        ttl: randomBetween(BURST_LIFETIME_MS * 0.65, BURST_LIFETIME_MS),
      })
    }
  }

  let frame = 0
  let stopped = false
  let last = 0

  const stop = (): void => {
    if (stopped) return
    stopped = true
    if (frame !== 0) window.cancelAnimationFrame(frame)
    frame = 0
    clearStage(stage)
    stage.dispose()
  }

  const tick = (now: number): void => {
    if (stopped) return
    if (last === 0) {
      last = now
      spawn()
    }
    // Pas de temps normalisé sur 60 fps, borné pour éviter les sauts d'onglet.
    const step = Math.min((now - last) / (1000 / 60), 3)
    const elapsed = now - last
    last = now

    clearStage(stage)
    let alive = 0

    for (const p of particles) {
      p.age += elapsed
      if (p.age >= p.ttl) continue

      p.vx *= Math.pow(AIR_FRICTION, step)
      p.vy = p.vy * Math.pow(AIR_FRICTION, step) + GRAVITY * step
      // Légère dérive horizontale, désynchronisée par particule.
      p.vx += Math.sin((p.age + p.ttl) / 260) * 0.06 * step
      p.x += p.vx * step
      p.y += p.vy * step
      p.rot += p.vr * step

      if (p.y - p.h > stage.height) continue
      alive += 1

      // Opacité décroissante sur le dernier tiers de vie.
      const remaining = 1 - p.age / p.ttl
      const alpha = remaining > 0.33 ? 1 : Math.max(0, remaining / 0.33)

      stage.ctx.save()
      stage.ctx.globalAlpha = alpha
      stage.ctx.translate(p.x, p.y)
      stage.ctx.rotate(p.rot)
      stage.ctx.fillStyle = p.color
      stage.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 0.6)))
      stage.ctx.restore()
    }

    if (alive === 0) {
      stop()
      return
    }
    frame = window.requestAnimationFrame(tick)
  }

  frame = window.requestAnimationFrame(tick)
  return stop
}

/** Pluie d'emojis (easter egg Konami). Retourne une fonction d'annulation idempotente. */
export function emojiRain(
  canvas: HTMLCanvasElement,
  emojis: string[],
  durationMs: number = EMOJI_DEFAULT_DURATION_MS,
): () => void {
  const stage = createStage(canvas)
  if (stage === null) return (): void => {}
  if (emojis.length === 0) {
    stage.dispose()
    return (): void => {}
  }

  const particles: EmojiParticle[] = []
  const total = 46

  // Naissance différée à la première frame, pour les mêmes raisons de mise en page.
  const spawn = (): void => {
    stage.remeasure()
    for (let i = 0; i < total; i += 1) {
      const size = randomBetween(18, 40)
      particles.push({
        x: randomBetween(0, stage.width),
        // Étalées au-dessus de l'écran pour un flux continu.
        y: randomBetween(-stage.height * 1.2, -size),
        vy: randomBetween(2.2, 6.2),
        vx: randomBetween(-0.6, 0.6),
        size,
        rot: randomBetween(-0.4, 0.4),
        vr: randomBetween(-0.02, 0.02),
        glyph: emojis[i % emojis.length],
      })
    }
  }

  let frame = 0
  let stopped = false
  let last = 0
  let elapsedTotal = 0

  const stop = (): void => {
    if (stopped) return
    stopped = true
    if (frame !== 0) window.cancelAnimationFrame(frame)
    frame = 0
    clearStage(stage)
    stage.dispose()
  }

  const tick = (now: number): void => {
    if (stopped) return
    if (last === 0) {
      last = now
      spawn()
    }
    const delta = now - last
    const step = Math.min(delta / (1000 / 60), 3)
    last = now
    elapsedTotal += delta

    clearStage(stage)
    let visible = 0

    for (const p of particles) {
      p.y += p.vy * step
      p.x += p.vx * step
      p.rot += p.vr * step

      // Après la durée demandée, on ne recycle plus : on laisse tomber.
      if (p.y - p.size > stage.height) {
        if (elapsedTotal < durationMs) {
          p.y = -p.size
          p.x = randomBetween(0, stage.width)
        } else {
          continue
        }
      }
      visible += 1

      stage.ctx.save()
      stage.ctx.translate(p.x, p.y)
      stage.ctx.rotate(p.rot)
      stage.ctx.font = `${p.size}px sans-serif`
      stage.ctx.textAlign = 'center'
      stage.ctx.textBaseline = 'middle'
      stage.ctx.fillText(p.glyph, 0, 0)
      stage.ctx.restore()
    }

    if (visible === 0 && elapsedTotal >= durationMs) {
      stop()
      return
    }
    frame = window.requestAnimationFrame(tick)
  }

  frame = window.requestAnimationFrame(tick)
  return stop
}
