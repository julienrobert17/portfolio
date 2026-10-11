/**
 * Écrit (ou met à jour) la seule ligne `groove-to-grave` de la table Project, pour la tuile du
 * carrousel de la home. N'utilise pas `prisma db seed`, qui réécrirait tous les projets. Base
 * partagée avec la production : à lancer une seule fois, avec le `.env` de production, après la
 * fusion sur main et la vérification de la production (bloc 7.1, accord explicite du 11 octobre
 * 2026).
 *
 * Contrôles : avant, compte des lignes de Project, liste des slugs (aucun conflit avec un autre
 * slug), affichage de la ligne qui va être écrite ; après, recompte (une de plus exactement sur
 * une création), aucune autre ligne modifiée (updatedAt identiques), affichage de la ligne écrite.
 *
 *   npx tsx scripts/g2g-upsert-projet.ts            : contrôles seulement, n'écrit rien
 *   npx tsx scripts/g2g-upsert-projet.ts --ecrire   : contrôles, écriture, contrôles
 *
 * Retour arrière : `npx tsx scripts/g2g-upsert-projet.ts --supprimer` retire cette seule ligne.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const SLUG = 'groove-to-grave'
const LIGNE = {
  slug: SLUG,
  title: 'Groove To Grave Records',
  description: "Plateforme du label parisien : on insère les sorties comme des cassettes dans un lecteur persistant, sur un mur d'affiches qui respire au son.",
  tags: ['musique', 'label', 'audio', 'WebGL', 'Next.js'],
  liveUrl: '/experience/groove-to-grave',
  imageUrl: '/experience/groove-to-grave/tuile.svg',
  featured: true,
  /** Même catégorie que la-coupe : projets perso. */
  category: 'perso',
  publishedAt: new Date('2026-10-11'),
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL absent')
  const ecrire = process.argv.includes('--ecrire')
  const supprimer = process.argv.includes('--supprimer')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  const etat = async () => prisma.project.findMany({ select: { slug: true, updatedAt: true, category: true, featured: true, title: true }, orderBy: { slug: 'asc' } })

  const avant = await etat()
  const coupe = avant.find((p) => p.slug === 'la-coupe')
  const existante = avant.find((p) => p.slug === SLUG)
  const conflits = avant.filter((p) => p.slug !== SLUG && (p.slug.includes('groove') || p.title.toLowerCase().includes('groove')))
  process.stdout.write(`Avant : ${avant.length} lignes dans Project.\n`)
  for (const p of avant) process.stdout.write(`  ${p.slug.padEnd(28)} ${p.category.padEnd(11)} featured ${String(p.featured).padEnd(5)} updatedAt ${p.updatedAt.toISOString()}\n`)
  process.stdout.write(`Catégorie de la-coupe : ${coupe?.category ?? 'introuvable'} (la ligne reprend « ${LIGNE.category} »).\n`)
  process.stdout.write(`Conflits de slug ou de titre : ${conflits.length ? conflits.map((c) => c.slug).join(', ') : 'aucun'}.\n`)
  process.stdout.write(`Ligne ${SLUG} : ${existante ? 'déjà présente, sera mise à jour' : 'absente, sera créée'}.\n`)
  if (coupe && coupe.category !== LIGNE.category) throw new Error('la catégorie de la-coupe ne correspond pas : rien n’est écrit')
  if (conflits.length) throw new Error('conflit de slug ou de titre : rien n’est écrit')

  if (supprimer) {
    if (!existante) throw new Error('rien à supprimer')
    await prisma.project.delete({ where: { slug: SLUG } })
    process.stdout.write(`Ligne ${SLUG} supprimée. Après : ${(await etat()).length} lignes.\n`)
    await prisma.$disconnect()
    return
  }

  process.stdout.write('Ligne qui va être écrite :\n' + JSON.stringify(LIGNE, null, 2) + '\n')
  if (!ecrire) {
    process.stdout.write('Contrôles seulement (--ecrire pour écrire).\n')
    await prisma.$disconnect()
    return
  }

  const { slug, ...reste } = LIGNE
  const ecrite = await prisma.project.upsert({ where: { slug }, update: reste, create: LIGNE })
  const apres = await etat()
  const attendu = avant.length + (existante ? 0 : 1)
  const autresModifiees = apres.filter((p) => p.slug !== SLUG && avant.find((a) => a.slug === p.slug)?.updatedAt.getTime() !== p.updatedAt.getTime()).map((p) => p.slug)
  const disparues = avant.filter((a) => !apres.find((p) => p.slug === a.slug)).map((a) => a.slug)
  process.stdout.write(`Après : ${apres.length} lignes (attendu ${attendu}) ; autres lignes modifiées : ${autresModifiees.length ? autresModifiees.join(', ') : 'aucune'} ; lignes disparues : ${disparues.length ? disparues.join(', ') : 'aucune'}.\n`)
  process.stdout.write('Ligne écrite :\n' + JSON.stringify(ecrite, null, 2) + '\n')
  if (apres.length !== attendu || autresModifiees.length || disparues.length) throw new Error('contrôle après écriture en échec')
  await prisma.$disconnect()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`)
  process.exit(1)
})
