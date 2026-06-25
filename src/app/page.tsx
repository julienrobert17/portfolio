import { getFeaturedProjects } from '@/lib/data'
import ScrollController from '@/components/home/scroll-controller'

export default async function HomePage() {
  const projects = await getFeaturedProjects()
  return (
    <main style={{
      backgroundColor: '#0d271e',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ScrollController projects={projects} />
    </main>
  )
}
