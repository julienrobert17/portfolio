import { EdgesGeometry, type Group, LineBasicMaterial, type Mesh, MeshStandardMaterial, type OrthographicCamera, Plane, Vector3 } from 'three'
import { hero, setCanvasPret, setModeHero } from '../lib/hero-store'
import type { MaquetteConstruite } from './geometrie'
import { HAUTEUR_COUPE } from './maquette'
import { DIRECTION_CAMERA } from './projection'

const ROTATION_SCROLL = (20 * Math.PI) / 180
const PARALLAXE = (4 * Math.PI) / 180
const LERP_SOURIS = 0.08
const RECUL = 0.15
const DISTANCE_CAMERA = 80
/** Marge du SVG statique autour de la projection : 12 px à 24 px/m de chaque côté. */
const MARGE_SVG_M = 1
/** Au-dessus du faîtage à progression 0 : rien n'est coupé. */
const MARGE_COUPE = 0.05
const MARGE_COUPE_SOL = 0.03
/** Un tour en 40 s dans le menu. */
const VITESSE_MENU = (Math.PI * 2) / 40

const DIRECTION = new Vector3(...DIRECTION_CAMERA)
const HAUT_MONDE = new Vector3(0, 1, 0)
const DROITE = new Vector3().crossVectors(HAUT_MONDE, DIRECTION).normalize()
const HAUT = new Vector3().crossVectors(DIRECTION, DROITE).normalize()

interface Taille {
  width: number
  height: number
}

export interface OptionsFrame {
  mode: 'hero' | 'menu'
  /** Secondes depuis la frame précédente. */
  delta: number
  /** Faux sous mouvement réduit : la maquette du menu reste immobile. */
  tourne: boolean
}

/**
 * Tout l'impératif de la scène, hors React : plan de coupe, matériaux,
 * caméra, parallaxe. `frame()` est appelé par useFrame à chaque advance().
 */
export class RigHero {
  readonly planLocal = new Plane(new Vector3(0, -1, 0), HAUTEUR_COUPE + MARGE_COUPE)
  /** Le plan que voient les matériaux, en repère monde, suit la rotation du groupe. */
  readonly plan = new Plane(new Vector3(0, -1, 0), HAUTEUR_COUPE + MARGE_COUPE)
  readonly materiau: MeshStandardMaterial
  readonly materiauAretes: LineBasicMaterial
  readonly aretes: EdgesGeometry
  /** Point du monde dont la projection tombe au centre du SVG statique. */
  readonly cible: Vector3
  readonly largeurProjetee: number
  readonly hauteurProjetee: number
  private souris = { x: 0, y: 0 }
  private frames = 0
  private angleMenu = 0
  private modeCourant: 'hero' | 'menu' = 'hero'

  constructor(private maquette: MaquetteConstruite) {
    this.materiau = new MeshStandardMaterial({
      color: '#f6f3ed',
      roughness: 0.95,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      clippingPlanes: [this.plan],
    })
    // Les contours sont clippés aussi, sinon ils flottent au-dessus de la coupe.
    this.materiauAretes = new LineBasicMaterial({ color: '#151412', transparent: true, opacity: 0.35, clippingPlanes: [this.plan] })
    this.aretes = new EdgesGeometry(maquette.geometrie, 15)
    const { bornes } = maquette
    const cx = (bornes.minX + bornes.maxX) / 2
    const cy = (bornes.minY + bornes.maxY) / 2
    this.cible = new Vector3().addScaledVector(DROITE, cx).addScaledVector(HAUT, -cy)
    this.largeurProjetee = bornes.maxX - bornes.minX + MARGE_SVG_M
    this.hauteurProjetee = bornes.maxY - bornes.minY
  }

  /** Bascule des matériaux : plâtre et coupe pour le hero, fil de fer papier à 40 % pour le menu. */
  private appliquerMode(mode: 'hero' | 'menu'): void {
    if (mode === this.modeCourant) return
    this.modeCourant = mode
    const menu = mode === 'menu'
    this.materiau.visible = !menu
    this.materiauAretes.color.set(menu ? '#f3f0ea' : '#151412')
    this.materiauAretes.opacity = menu ? 0.4 : 0.35
    this.materiauAretes.clippingPlanes = menu ? [] : [this.plan]
    this.materiauAretes.needsUpdate = true
    hero.sale = true
  }

  /** Menu : rotation lente continue, cadrage centré, sans coupe. */
  private frameMenu(camera: OrthographicCamera, taille: Taille, groupe: Group, options: OptionsFrame): void {
    if (options.tourne) {
      this.angleMenu += options.delta * VITESSE_MENU
      hero.sale = true
    }
    groupe.rotation.set(0, this.angleMenu, 0)
    groupe.updateMatrixWorld(true)
    camera.zoom = Math.min((taille.height * 0.45) / this.hauteurProjetee, (taille.width * 0.5) / this.largeurProjetee)
    camera.position.copy(this.cible).addScaledVector(DIRECTION, DISTANCE_CAMERA)
    camera.up.copy(HAUT_MONDE)
    camera.lookAt(this.cible)
    // Centrée à 42 % de la largeur : entre les pages à gauche et la liste des projets à droite.
    camera.setViewOffset(taille.width, taille.height, -(taille.width * 0.42 - taille.width / 2), 0, taille.width, taille.height)
    camera.updateProjectionMatrix()
  }

  frame(camera: OrthographicCamera, taille: Taille, groupe: Group | null, quad: Mesh | null, options: OptionsFrame): void {
    if (!groupe) return
    this.appliquerMode(options.mode)
    if (options.mode === 'menu') {
      this.frameMenu(camera, taille, groupe, options)
      return
    }
    const p = hero.progression

    // Les deux premières frames rendues : le canvas est prêt, le SVG peut s'effacer.
    if (this.frames < 3) {
      this.frames++
      hero.sale = true
      if (this.frames === 2) {
        setCanvasPret(true)
        setModeHero('canvas')
      }
    }

    // Parallaxe souris, lissée ; tant qu'elle converge, on redessine.
    const s = this.souris
    s.x += (hero.souris.x - s.x) * LERP_SOURIS
    s.y += (hero.souris.y - s.y) * LERP_SOURIS
    if (Math.abs(hero.souris.x - s.x) > 0.001 || Math.abs(hero.souris.y - s.y) > 0.001) hero.sale = true

    groupe.rotation.y = ROTATION_SCROLL * p + PARALLAXE * s.x
    groupe.rotation.x = PARALLAXE * s.y
    groupe.updateMatrixWorld(true)

    // Coupe : du faîtage (p = 0) au sol (p = 1), dans le repère de la maquette.
    // À l'arrivée le plan entre de 3 cm dans la dalle du rez-de-chaussée : jamais
    // coplanaire avec sa face supérieure, sinon le stencil scintille.
    const hauteur = (HAUTEUR_COUPE + MARGE_COUPE) * (1 - p) - MARGE_COUPE_SOL * p
    this.planLocal.constant = hauteur
    this.plan.copy(this.planLocal).applyMatrix4(groupe.matrixWorld)
    if (quad) quad.position.y = hauteur

    // Caméra : zoom depuis la largeur du SVG, décentrage vers son centre.
    const cadre = hero.cadre
    const zoomBase = cadre ? cadre.largeur / this.largeurProjetee : taille.height / 30
    camera.zoom = zoomBase * (1 - RECUL * p)
    camera.position.copy(this.cible).addScaledVector(DIRECTION, DISTANCE_CAMERA)
    camera.up.copy(HAUT_MONDE)
    camera.lookAt(this.cible)
    if (cadre) {
      camera.setViewOffset(taille.width, taille.height, -(cadre.cx - taille.width / 2), -(cadre.cy - taille.height / 2), taille.width, taille.height)
    } else {
      camera.clearViewOffset()
    }
    camera.updateProjectionMatrix()
  }

  dispose(): void {
    this.maquette.geometrie.dispose()
    this.aretes.dispose()
    this.materiau.dispose()
    this.materiauAretes.dispose()
  }
}
