/**
 * Tirage aléatoire déterministe — version CANONIQUE du repo.
 *
 * Dette connue, non résorbée aujourd'hui : quatre implémentations ad hoc
 * coexistent déjà et vivent leur vie.
 *   - `hashCode` dans `src/lib/geodatle-game.ts`
 *   - `hashString` dans `src/components/experience/un-moment-hors-du-temps/dates.ts`
 *   - un générateur congruentiel inline dans
 *     `src/components/experience/prototaxites/scene/Arthropods.tsx`
 *   - un second, presque identique, dans `.../scene/DevonianForest.tsx`
 *
 * AUCUNE de ces quatre n'est migrée ici : elles produisent des suites qui leur
 * sont propres (seed quotidien Geodatle, placements de la forêt dévonienne) et
 * les remplacer changerait des rendus existants. Ce fichier est un point de
 * départ pour le nouveau code, pas un remplacement : il ne doit rien casser.
 * La migration se fera plus tard, une implémentation à la fois.
 */

/** Chaîne → graine entière 32 bits, stable d'une exécution à l'autre. */
export function hashSeed(input: string): number {
  // FNV-1a 32 bits : pas de dépendance à l'environnement, pas de flottants.
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Générateur déterministe dans [0, 1). Implémente mulberry32. */
export function createRandom(seed: number): () => number {
  // État sur 32 bits non signés : même suite pour une même graine, à travers
  // les rechargements de page comme d'un moteur JS à l'autre.
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Copie mélangée (Fisher-Yates), sans muter l'entrée. */
export function shuffleSeeded<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/** Entier dans [min, max] inclus. */
export function randomInt(random: () => number, min: number, max: number): number {
  // Bornes inversées : on rend `min` plutôt que NaN.
  if (max <= min) return min
  return min + Math.floor(random() * (max - min + 1))
}
