/**
 * Écrit (ou met à jour) la seule entrée `groove-to-grave` de la table Project, pour la tuile du
 * carrousel de la home. NON EXÉCUTÉ : la base est partagée avec la production, l'écriture attend
 * l'accord écrit du label (brief §9, §10), comme la fusion de la branche sur main. Même contenu
 * que le bloc préparé dans prisma/seed.ts, sans toucher aux autres projets.
 *
 *   npx tsx scripts/g2g-upsert-projet.ts          (depuis la racine, avec DATABASE_URL dans .env)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL absent')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  const projet = await prisma.project.upsert({
    where: { slug: 'groove-to-grave' },
    update: {
      liveUrl: '/experience/groove-to-grave',
      imageUrl: '/experience/groove-to-grave/tuile.svg',
    },
    create: {
      slug: 'groove-to-grave',
      title: 'Groove To Grave',
      description: "Le site concept d'un label house parisien : un mur de cassettes, un lecteur persistant qui ne s'arrête jamais, du sillon à la tombe.",
      tags: ['Next.js', 'Web Audio', 'WebGL2', 'GSAP'],
      liveUrl: '/experience/groove-to-grave',
      imageUrl: '/experience/groove-to-grave/tuile.svg',
      featured: true,
      publishedAt: new Date('2026-10-10'),
    },
  })
  process.stdout.write(`${projet.slug} écrit (id ${projet.id})\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`)
  process.exit(1)
})
