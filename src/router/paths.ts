/** Every route in the app is built here, so links never drift from the router. */
export const paths = {
  home: '/',
  about: '/about',
  scraper: '/scraper',
  ripper: '/ripper',
  calculator: '/calculator',
  catalogue: '/catalogue',
  module: (slug: string) => `/modules/${slug}`,
} as const

const MODULE_PREFIX = '/modules/'

/** Returns the module slug when the path is a module page, otherwise null. */
export function moduleSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith(MODULE_PREFIX)) return null
  const slug = pathname.slice(MODULE_PREFIX.length)
  return slug && !slug.includes('/') ? slug : null
}
