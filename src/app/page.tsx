import { getFeaturedProjects, getLatestExperiences } from '@/lib/data'
import HeroSection from '@/components/home/hero-section'
import FeaturedProjects from '@/components/home/featured-projects'
import ExperiencesSection from '@/components/home/experiences-section'

export default async function HomePage() {
  const [projects, experiences] = await Promise.all([
    getFeaturedProjects(),
    getLatestExperiences(),
  ])

  return (
    <main>
      <HeroSection />
      <FeaturedProjects projects={projects} />
      <ExperiencesSection experiences={experiences} />
    </main>
  )
}
