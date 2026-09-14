import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.project.upsert({
    where: { slug: 'portfolio-ia' },
    update: {},
    create: {
      slug: 'portfolio-ia',
      title: 'Portfolio IA',
      description: 'Portfolio personnel généré avec Next.js 14, Prisma et une touche d\'IA pour la génération de contenu.',
      tags: ['Next.js', 'TypeScript', 'Prisma', 'Tailwind CSS'],
      githubUrl: 'https://github.com/julienrobert17/portfolio',
      featured: true,
      publishedAt: new Date('2026-05-19'),
    },
  })

  await prisma.project.upsert({
    where: { slug: 'task-manager-app' },
    update: {},
    create: {
      slug: 'task-manager-app',
      title: 'Task Manager App',
      description: 'Application de gestion de tâches en temps réel avec authentification, tableaux Kanban et notifications.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'WebSocket'],
      githubUrl: 'https://github.com/julienrobert17/task-manager',
      featured: true,
      publishedAt: new Date('2026-05-19'),
    },
  })

  await prisma.project.upsert({
    where: { slug: 'geodatle' },
    update: {
      liveUrl: '/games/geodatle',
      title: 'Geodatle',
      description: 'Jeu de géographie quotidien inspiré de Wordle. Devinez le pays mystère en 8 tentatives grâce à des données réelles (OWID, REST Countries).',
      tags: ['Next.js', 'TypeScript', 'React', 'Data', 'Game', 'OWID'],
      imageUrl: '/GEODATLE.png',
    },
    create: {
      slug: 'geodatle',
      title: 'Geodatle',
      description: 'Jeu de géographie quotidien inspiré de Wordle. Devinez le pays mystère en 8 tentatives grâce à des données réelles (OWID, REST Countries).',
      tags: ['Next.js', 'TypeScript', 'React', 'Data', 'Game', 'OWID'],
      liveUrl: '/games/geodatle',
      featured: true,
      publishedAt: new Date(),
    },
  })

  await prisma.project.upsert({
    where: { slug: 'prototaxites' },
    update: {
      liveUrl: '/experience/prototaxites',
      tags: ['Three.js', 'React Three Fiber', 'WebGL'],
    },
    create: {
      slug: 'prototaxites',
      title: 'Prototaxites',
      description: "Une expérience immersive autour du premier être vivant à dominer les terres émergées. 420 millions d'années avant nous.",
      tags: ['Three.js', 'React Three Fiber', 'WebGL'],
      liveUrl: '/experience/prototaxites',
      featured: true,
      publishedAt: new Date('2026-06-29'),
    },
  })

  await prisma.project.upsert({
    where: { slug: 'un-moment-hors-du-temps' },
    update: {
      liveUrl: '/experience/un-moment-hors-du-temps',
    },
    create: {
      slug: 'un-moment-hors-du-temps',
      title: 'Un moment hors du temps',
      description: "Un formulaire d'invitation en huit écrans, où chaque champ cache un gag et une mécanique inattendue.",
      tags: ['Next.js', 'TypeScript', 'Interaction', 'CSS'],
      liveUrl: '/experience/un-moment-hors-du-temps',
      featured: true,
      publishedAt: new Date('2026-09-08'),
    },
  })

  await prisma.project.upsert({
    where: { slug: 'entre-nous' },
    update: {
      liveUrl: '/experience/entre-nous',
    },
    create: {
      slug: 'entre-nous',
      title: 'Entre nous',
      description:
        "Un téléphone posé entre deux personnes, l'écran coupé en deux. Chacun répond de son côté, et rien ne se révèle tant que les deux n'ont pas validé.",
      tags: ['Next.js', 'TypeScript', 'Multi-touch', 'Interaction'],
      liveUrl: '/experience/entre-nous',
      featured: true,
      publishedAt: new Date('2026-09-14'),
    },
  })

  await prisma.experience.upsert({
    where: { id: 'exp-current' },
    update: {},
    create: {
      id: 'exp-current',
      company: 'Freelance',
      role: 'Développeur Full Stack',
      description: 'Conception et développement d\'applications web sur mesure pour des clients variés. Accompagnement de bout en bout, du cahier des charges au déploiement.',
      startDate: new Date('2024-01-01'),
      current: true,
      skills: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    },
  })

  await prisma.experience.upsert({
    where: { id: 'exp-previous' },
    update: {},
    create: {
      id: 'exp-previous',
      company: 'Agence Web Créative',
      role: 'Développeur Front-end',
      description: 'Intégration d\'interfaces responsive et développement de composants React réutilisables pour des projets clients e-commerce et institutionnels.',
      startDate: new Date('2022-03-01'),
      endDate: new Date('2023-12-31'),
      current: false,
      skills: ['React', 'JavaScript', 'Sass', 'Figma'],
    },
  })

  console.log('Seed terminé.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
