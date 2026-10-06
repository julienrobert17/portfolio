/** Routes plein écran sans header ni footer. */
export const IMMERSIVE_PREFIXES = ['/games', '/experience'] as const

export function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
