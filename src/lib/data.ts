import { prisma } from './prisma'
import type { Project, Experience } from '@prisma/client'

export async function getFeaturedProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    where: { featured: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })
}

export async function getLatestExperiences(): Promise<Experience[]> {
  return prisma.experience.findMany({
    orderBy: { startDate: 'desc' },
    take: 3,
  })
}

export async function getProjects(tag?: string): Promise<Project[]> {
  return prisma.project.findMany({
    where: {
      publishedAt: { not: null },
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
  })
}

export async function getDistinctTags(): Promise<string[]> {
  const rows = await prisma.project.findMany({
    where: { publishedAt: { not: null } },
    select: { tags: true },
  })
  return [...new Set(rows.flatMap((p) => p.tags))].sort()
}
