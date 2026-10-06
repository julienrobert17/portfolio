import { getFeaturedProjects } from '@/lib/data'
import ScrollController from '@/components/home/scroll-controller'
import { listCaseStudySlugs } from '@/lib/case-studies'

export default async function HomePage() {
  const allProjects = await getFeaturedProjects()
  const caseStudies = listCaseStudySlugs()
  return (
    <main style={{
      backgroundColor: '#0d271e',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ScrollController projects={allProjects} caseStudies={caseStudies} />
    </main>
  )
}
