import type { Project } from '@prisma/client'
import { getFeaturedProjects } from '@/lib/data'
import ScrollController from '@/components/home/scroll-controller'

// Entrée statique hors-DB — l'expérience Prototaxites n'est pas en base Prisma.
// Elle est injectée après le fetch pour conserver le même type Project[].
const PROTOTAXITES_CARD: Project = {
  id:          'prototaxites-static',
  slug:        'prototaxites',
  title:       'Prototaxites',
  description: "Une expérience immersive autour du premier être vivant à dominer les terres émergées. 420 millions d'années avant nous.",
  content:     null,
  tags:        ['Three.js', 'WebGL', 'GSAP'],
  githubUrl:   null,
  liveUrl:     '/experience/prototaxites',
  imageUrl:    null,
  featured:    true,
  publishedAt: null,
  createdAt:   new Date(0),
  updatedAt:   new Date(0),
}

export default async function HomePage() {
  const projects = await getFeaturedProjects()
  const allProjects = [...projects, PROTOTAXITES_CARD]
  return (
    <main style={{
      backgroundColor: '#0d271e',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ScrollController projects={allProjects} />
    </main>
  )
}
