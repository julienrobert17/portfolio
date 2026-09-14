import { createRandom, hashSeed, shuffleSeeded } from '@/lib/seeded-random'
import type { Acte, Mecanique, Question, QuestionPerso, RunPlan } from './types'

/**
 * Tailles visées : acte 1 = 8, acte 2 = 11, acte 3 = 9, soit 28 questions.
 *
 * Les cibles dépassent la banque (8/8/7) : c'est volontaire. Les questions
 * perso S'AJOUTENT au lieu de remplacer, tant qu'elles tiennent dans la marge
 * — trois en acte 2, deux en acte 3. La règle du remplacement datait du moment
 * où les perso étaient censées être invisibles : il fallait alors garder la
 * durée constante pour ne pas trahir leur présence. Elles s'annoncent
 * désormais, et remplacer voudrait dire qu'écrire une question en supprime une
 * autre, arbitrée. Au-delà de la marge, l'élagage reprend.
 */
const TAILLE_CIBLE: Record<Acte, number> = { 1: 8, 2: 11, 3: 9 }

/** Une question du déroulé, avec son origine gardée à l'écart de `Question`. */
interface Entree {
  question: Question
  /** Jamais recopié dans `Question` : l'UI ne doit pas pouvoir le lire. */
  estPerso: boolean
}

/** Entrée perso nettoyée, avant qu'on lui connaisse son acte définitif. */
interface PersoPreparee {
  id: string
  texte: string
  mecanique: Mecanique
  options?: readonly string[]
  /** Déjà normalisé : 2, 3, ou absent. L'acte 1 déclaré est reclassé en 2. */
  acteDeclare?: Acte
  pari?: boolean
  mot?: string
}

function estActe(valeur: unknown): valeur is Acte {
  return valeur === 1 || valeur === 2 || valeur === 3
}

/**
 * Mécanique déduite du nombre d'options quand l'auteur n'en déclare pas.
 * `a-voix-haute` n'est jamais un défaut : elle se choisit, elle ne se subit pas.
 */
function mecaniqueParDefaut(options: readonly string[] | undefined): Mecanique {
  const n = options ? options.length : 0
  if (n === 2) return 'bascule'
  if (n === 4 || n === 5) return 'classement'
  if (n === 12) return 'le-mot'
  return 'curseur'
}

/** Construit la `Question` jouée. Le `mot` n'y entre jamais. */
function versQuestion(p: PersoPreparee, acte: Acte): Question {
  const q: Question = { id: p.id, texte: p.texte, mecanique: p.mecanique, acte }
  if (p.options && p.options.length > 0) q.options = p.options
  // Le pari n'a aucun sens sur ces deux-là : on l'ignore plutôt que de rendre
  // un écran de saisie en deux temps dont le second temps serait vide.
  if (p.pari === true && p.mecanique !== 'a-voix-haute' && p.mecanique !== 'tir-a-la-corde') {
    q.pari = true
  }
  return q
}

/**
 * Nettoie le fichier perso : textes vides écartés, actes hors {1,2,3} traités
 * comme absents, acte 1 reclassé en 2, ids stables dérivés du texte.
 */
function preparerPerso(perso: readonly QuestionPerso[]): PersoPreparee[] {
  const out: PersoPreparee[] = []
  const vus = new Map<string, number>()
  for (const brute of perso) {
    // Le fichier perso est édité à la main : on se protège des champs manquants.
    const p: Partial<QuestionPerso> | undefined = brute
    const texte = typeof p?.texte === 'string' ? p.texte.trim() : ''
    if (texte.length === 0) continue

    const base = `perso-${hashSeed(texte).toString(36)}`
    const rang = vus.get(base) ?? 0
    vus.set(base, rang + 1)

    const options =
      Array.isArray(p.options) && p.options.length > 0 ? p.options.slice() : undefined
    const declare = estActe(p.acte) ? p.acte : undefined
    const prepare: PersoPreparee = {
      // Même texte deux fois : suffixe déterministe, l'id reste unique.
      id: rang === 0 ? base : `${base}-${rang + 1}`,
      texte,
      mecanique: p.mecanique ?? mecaniqueParDefaut(options),
      // Règle 4 : l'échauffement reste neutre, une perso d'acte 1 passe en 2.
      acteDeclare: declare === 1 ? 2 : declare,
    }
    if (p.pari === true) prepare.pari = true
    if (options) prepare.options = options
    if (typeof p.mot === 'string' && p.mot.length > 0) prepare.mot = p.mot
    out.push(prepare)
  }
  return out
}

/** Range la banque par acte, en ignorant les entrées inexploitables. */
function banqueParActe(banque: readonly Question[]): Record<Acte, Question[]> {
  const parActe: Record<Acte, Question[]> = { 1: [], 2: [], 3: [] }
  for (const brute of banque) {
    const q: Partial<Question> | undefined = brute
    if (!q || typeof q.id !== 'string' || typeof q.texte !== 'string') continue
    parActe[estActe(q.acte) ? q.acte : 1].push(brute)
  }
  return parActe
}

/**
 * Retire de la banque d'un acte les questions surnuméraires, quand les perso
 * réclament la place. L'ORDRE D'AUTEUR EST PRÉSERVÉ : on choisit lesquelles
 * partent, jamais dans quel ordre les autres passent. À nombre égal
 * d'adjacences créées, on sacrifie plutôt une mécanique déjà portée par les
 * perso de l'acte, et la graine tranche les ex æquo.
 *
 * Les questions marquées `garde` sont hors d'atteinte : elles portent la fin
 * de l'acte 3, et rien ne justifie de les sacrifier à du remplissage. Si elles
 * suffisent à elles seules à remplir l'acte, on s'arrête là plutôt que d'en
 * retirer une.
 */
function selectionnerBanque(
  pool: readonly Question[],
  n: number,
  mecasPerso: readonly Mecanique[],
  random: () => number,
): Question[] {
  if (n >= pool.length) return pool.slice()

  const freqPerso = new Map<Mecanique, number>()
  for (const m of mecasPerso) freqPerso.set(m, (freqPerso.get(m) ?? 0) + 1)
  const poids = new Map<string, number>()
  for (const q of pool) poids.set(q.id, random())

  const restant = pool.slice()
  while (restant.length > n) {
    let choix = -1
    let meilleur: [number, number, number] = [
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ]
    for (let i = 0; i < restant.length; i += 1) {
      if (restant[i].garde === true) continue
      const avant = i > 0 ? restant[i - 1].mecanique : null
      const ici = restant[i].mecanique
      const apres = i + 1 < restant.length ? restant[i + 1].mecanique : null
      // Ce que le retrait coûte : la jointure qu'il crée moins celles qu'il défait.
      let delta = 0
      if (avant !== null && apres !== null && avant === apres) delta += 1
      if (avant !== null && avant === ici) delta -= 1
      if (apres !== null && ici === apres) delta -= 1
      const cle: [number, number, number] = [
        delta,
        -(freqPerso.get(ici) ?? 0),
        poids.get(restant[i].id) ?? 0,
      ]
      if (
        cle[0] < meilleur[0] ||
        (cle[0] === meilleur[0] && cle[1] < meilleur[1]) ||
        (cle[0] === meilleur[0] && cle[1] === meilleur[1] && cle[2] < meilleur[2])
      ) {
        meilleur = cle
        choix = i
      }
    }
    // Il ne reste que des questions gardées : on garde l'acte plus long plutôt
    // que d'amputer sa fin. Sortir ici est aussi ce qui empêche la boucle de
    // tourner indéfiniment.
    if (choix === -1) break
    restant.splice(choix, 1)
  }
  return restant
}

/**
 * Compose un acte : la banque défile dans son ordre d'auteur, les perso se
 * glissent dans les trous entre deux questions.
 *
 * `margeFinale` est le nombre de positions de fin d'acte qui doivent rester de
 * la banque — 1 pour l'acte 2 (pas de perso à la couture avec l'acte 3), 2 pour
 * l'acte 3 (la descente finale de la banque ne se fait pas interrompre).
 *
 * Comme l'ordre de la banque est figé, le seul levier contre deux mécaniques
 * identiques d'affilée est le choix du trou : chaque perso va là où elle ne
 * jouxte pas sa propre mécanique, et de préférence là où elle casse une
 * répétition déjà présente dans la banque.
 */
function composerActe(
  banque: readonly Entree[],
  persos: readonly Entree[],
  trouInitial: boolean,
  margeFinale: number,
  mecaGauche: Mecanique | null,
  random: () => number,
): Entree[] {
  if (persos.length === 0) return banque.slice()

  const n = banque.length
  const mecaBanque = (i: number): Mecanique | null =>
    i >= 0 && i < n ? banque[i].question.mecanique : null

  const cout = (e: Entree, g: number): number => {
    const m = e.question.mecanique
    const gauche = g > 0 ? mecaBanque(g - 1) : mecaGauche
    const droite = mecaBanque(g)
    let c = 0
    if (gauche !== null && gauche === m) c += 1
    if (droite !== null && droite === m) c += 1
    // S'insérer entre deux mécaniques identiques, c'est défaire leur collision.
    if (gauche !== null && droite !== null && gauche === droite) c -= 1
    return c
  }

  const trous: number[] = []
  for (let g = trouInitial ? 0 : 1; g <= n - margeFinale; g += 1) trous.push(g)
  // La graine décide de l'emplacement, à coût de mécanique égal.
  const dispo = shuffleSeeded(trous, random)

  const parTrou = new Map<number, Entree[]>()
  const poser = (g: number, e: Entree): void => {
    const liste = parTrou.get(g)
    if (liste) liste.push(e)
    else parTrou.set(g, [e])
  }

  const pris = new Set<number>()
  const surplus: Entree[] = []
  for (const p of persos) {
    let meilleur = -1
    let score = Number.POSITIVE_INFINITY
    for (const g of dispo) {
      if (pris.has(g)) continue
      const c = cout(p, g)
      if (c < score) {
        score = c
        meilleur = g
        if (c <= -1) break
      }
    }
    if (meilleur < 0) surplus.push(p)
    else {
      pris.add(meilleur)
      poser(meilleur, p)
    }
  }
  // Plus de perso que de trous légaux : on les double plutôt que d'en perdre
  // une (règle 1) ou de jeter. La règle 2 cède, elle seule.
  if (surplus.length > 0) {
    const repli = dispo.length > 0 ? dispo : [n]
    surplus.forEach((p, k) => poser(repli[k % repli.length], p))
  }

  const out: Entree[] = []
  for (let g = 0; g <= n; g += 1) {
    const liste = parTrou.get(g)
    if (liste) out.push(...liste)
    if (g < n) out.push(banque[g])
  }
  return out
}

function compterCollisions(entrees: readonly Entree[]): number {
  let n = 0
  for (let i = 1; i < entrees.length; i += 1) {
    if (entrees[i].question.mecanique === entrees[i - 1].question.mecanique) n += 1
  }
  return n
}

/**
 * Deux perso du même acte peuvent permuter : ça revient à échanger leurs trous,
 * donc toutes les règles de placement restent vraies. La banque, elle, ne bouge
 * JAMAIS — son ordre est celui de l'auteur.
 */
function echangeable(a: Entree, b: Entree): boolean {
  return a.estPerso && b.estPerso && a.question.acte === b.question.acte
}

function permuter(entrees: Entree[], i: number, j: number): void {
  const tmp = entrees[i]
  entrees[i] = entrees[j]
  entrees[j] = tmp
}

/** Collisions sur les seules jointures que l'échange (i, j) peut changer. */
function coutLocal(entrees: readonly Entree[], i: number, j: number): number {
  const jointures = new Set<number>()
  for (const k of [i, i + 1, j, j + 1]) {
    if (k >= 1 && k < entrees.length) jointures.add(k)
  }
  let n = 0
  for (const k of jointures) {
    if (entrees[k].question.mecanique === entrees[k - 1].question.mecanique) n += 1
  }
  return n
}

/**
 * Dernier passage sur les mécaniques restées collées, jonctions d'actes
 * comprises : recherche locale par permutation de perso, avec paliers et liste
 * tabou. Ne peut plus rien contre une répétition interne à la banque — celle-là
 * se corrige en écrivant la banque. Si rien ne s'améliore, on garde le meilleur
 * état vu ; jamais d'exception.
 */
function reparerMecaniques(entrees: Entree[], random: () => number): void {
  let collisions = compterCollisions(entrees)
  if (collisions === 0) return

  const ordre = shuffleSeeded(
    entrees.map((_, i) => i),
    random,
  )
  let meilleure = entrees.slice()
  let meilleurCout = collisions
  const tabou = new Map<string, number>()

  for (let tour = 0; tour < 240 && collisions > 0; tour += 1) {
    let choixI = -1
    let choixJ = -1
    let choixDelta = 1
    for (const i of ordre) {
      for (const j of ordre) {
        if (j <= i || !echangeable(entrees[i], entrees[j])) continue
        const avant = coutLocal(entrees, i, j)
        permuter(entrees, i, j)
        const delta = coutLocal(entrees, i, j) - avant
        permuter(entrees, i, j)
        if (delta > 0) continue
        const bloque =
          (tabou.get(`${i}:${j}`) ?? -1) > tour && collisions + delta >= meilleurCout
        if (bloque) continue
        if (delta < choixDelta) {
          choixDelta = delta
          choixI = i
          choixJ = j
        }
        if (choixDelta < 0) break
      }
      if (choixDelta < 0) break
    }
    if (choixI < 0) break

    permuter(entrees, choixI, choixJ)
    collisions += choixDelta
    tabou.set(`${choixI}:${choixJ}`, tour + 7)
    if (collisions < meilleurCout) {
      meilleurCout = collisions
      meilleure = entrees.slice()
    }
  }

  if (collisions > meilleurCout) {
    for (let i = 0; i < entrees.length; i += 1) entrees[i] = meilleure[i]
  }
}

/**
 * Assemble le déroulé d'une partie : trois actes, toutes les questions perso
 * incluses, banque dans son ordre d'auteur, tirage déterminé par `seed`.
 */
export function buildRun(
  banque: readonly Question[],
  perso: readonly QuestionPerso[],
  seed: string,
): RunPlan {
  const graine = typeof seed === 'string' ? seed : ''
  // Flux séparés : un changement de banque ne rebat pas les cartes des perso.
  const rndPerso = createRandom(hashSeed(`${graine}|perso`))
  const rndRetraits = createRandom(hashSeed(`${graine}|retraits`))
  const rndTrous = createRandom(hashSeed(`${graine}|trous`))
  const rndMeca = createRandom(hashSeed(`${graine}|meca`))

  const preparees = preparerPerso(Array.isArray(perso) ? perso : [])
  const parActe = banqueParActe(Array.isArray(banque) ? banque : [])

  // Répartition des perso entre actes 2 et 3 : déclarations d'abord, puis les
  // libres au prorata des tailles visées (11 contre 8).
  const declare2: PersoPreparee[] = []
  const declare3: PersoPreparee[] = []
  const libres: PersoPreparee[] = []
  for (const p of preparees) {
    if (p.acteDeclare === 2) declare2.push(p)
    else if (p.acteDeclare === 3) declare3.push(p)
    else libres.push(p)
  }
  const cible2 = Math.round(
    (preparees.length * TAILLE_CIBLE[2]) / (TAILLE_CIBLE[2] + TAILLE_CIBLE[3]),
  )
  const melangees = shuffleSeeded(libres, rndPerso)
  const coupe = Math.max(0, Math.min(melangees.length, cible2 - declare2.length))
  const perso2 = shuffleSeeded(declare2.concat(melangees.slice(0, coupe)), rndPerso)
  const perso3 = shuffleSeeded(declare3.concat(melangees.slice(coupe)), rndPerso)

  // Capacités réelles : l'acte 2 offre un trou par question de banque, l'acte 3
  // un de moins — ses deux dernières places lui sont réservées. Le prorata seul
  // peut saturer un acte pendant que l'autre respire, d'où ce rééquilibrage.
  const capacite2 = parActe[2].length
  const capacite3 = Math.max(0, parActe[3].length - 1)
  const deplacer = (de: PersoPreparee[], vers: PersoPreparee[]): void => {
    if (de.length === 0) return
    // On déplace d'abord celles qui n'avaient pas choisi leur acte.
    const libre = de.findIndex((p) => p.acteDeclare === undefined)
    const [p] = de.splice(libre < 0 ? de.length - 1 : libre, 1)
    vers.push(p)
  }
  while (perso3.length > capacite3 && perso2.length < capacite2) deplacer(perso3, perso2)
  while (perso2.length > capacite2 && perso3.length < capacite3) deplacer(perso2, perso3)

  // Combien de banque garder : la taille visée moins les perso (règle 1), mais
  // jamais moins qu'il n'en faut de trous pour les intercaler (règle 2). L'acte
  // 3 en réclame une de plus : ses deux dernières places lui sont réservées.
  const garde1 = Math.min(TAILLE_CIBLE[1], parActe[1].length)
  const garde2 = Math.min(
    Math.max(TAILLE_CIBLE[2] - perso2.length, perso2.length),
    parActe[2].length,
  )
  const garde3 = Math.min(
    Math.max(TAILLE_CIBLE[3] - perso3.length, perso3.length + 1),
    parActe[3].length,
  )

  const record: Record<string, { mot?: string }> = {}
  const enEntrees = (liste: readonly PersoPreparee[], acte: Acte): Entree[] =>
    liste.map((p) => {
      // Toute perso a son entrée, même sans mot : `{}` reste une trace.
      record[p.id] = typeof p.mot === 'string' ? { mot: p.mot } : {}
      return { question: versQuestion(p, acte), estPerso: true }
    })
  const deBanque = (q: Question): Entree => ({ question: q, estPerso: false })

  const banque1 = selectionnerBanque(parActe[1], garde1, [], rndRetraits).map(deBanque)
  const banque2 = selectionnerBanque(
    parActe[2],
    garde2,
    perso2.map((p) => p.mecanique),
    rndRetraits,
  ).map(deBanque)
  const banque3 = selectionnerBanque(
    parActe[3],
    garde3,
    perso3.map((p) => p.mecanique),
    rndRetraits,
  ).map(deBanque)

  const derniere = (liste: readonly Entree[]): Mecanique | null =>
    liste.length > 0 ? liste[liste.length - 1].question.mecanique : null

  // L'acte 1 n'accueille aucune perso (règle 4) : la rampe reste neutre.
  const acte1 = banque1.slice()
  // Marge finale de 1 sur l'acte 2 : la couture avec l'acte 3 se fait entre
  // deux questions de banque, donc jamais deux perso de part et d'autre.
  const acte2 = composerActe(
    banque2,
    enEntrees(perso2, 2),
    acte1.length > 0,
    1,
    derniere(acte1),
    rndTrous,
  )
  // Marge finale de 2 sur l'acte 3 : rien de perso dans les deux dernières
  // positions, la descente vers la séquence de fin reste d'un seul tenant.
  const acte3 = composerActe(
    banque3,
    enEntrees(perso3, 3),
    acte1.length > 0 || acte2.length > 0,
    2,
    derniere(acte2),
    rndTrous,
  )

  const entrees = [...acte1, ...acte2, ...acte3]
  reparerMecaniques(entrees, rndMeca)

  return { questions: entrees.map((e) => e.question), perso: record }
}
