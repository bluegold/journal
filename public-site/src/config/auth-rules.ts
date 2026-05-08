import siteConfig from './site-config.json'
import projects from './projects.json'

type ProjectConfig = (typeof projects)[number]

const protectedProjectSlugs = new Set(
  projects.filter((project) => project.requireAuth).map((project) => project.slug),
)

export function isSiteProtected() {
  return Boolean(siteConfig.requireAuthAll)
}

export function isProjectProtected(project: ProjectConfig) {
  return isSiteProtected() || Boolean(project.requireAuth)
}

export function shouldRequireAuthForPathname(pathname: string) {
  if (isSiteProtected()) {
    return true
  }

  const projectSlug = pathname.split('/').filter(Boolean)[0]
  if (!projectSlug) {
    return false
  }

  return protectedProjectSlugs.has(projectSlug)
}
