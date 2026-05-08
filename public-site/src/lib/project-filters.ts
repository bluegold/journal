import projects from '../config/projects.json'

export type ProjectTagFilters = {
  slug: string
  tags: string[]
  excludeTags?: string[]
}

export const getProjectExcludeTags = (project?: ProjectTagFilters): string[] => {
  if (!project) {
    return []
  }

  if (project.excludeTags && project.excludeTags.length > 0) {
    return project.excludeTags
  }

  if (project.slug !== 'other') {
    return []
  }

  return [...new Set(projects.flatMap((current) => (current.slug === 'other' ? [] : current.tags)))]
}
