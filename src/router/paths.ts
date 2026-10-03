/** Every route in the app is built here, so links never drift from the router. */
export const paths = {
  home: '/',
  about: '/about',
  module: (slug: string) => `/modules/${slug}`,
  /** `step` is 1-based. Pass "done" for the completion screen. */
  moduleStep: (slug: string, step: number | 'done') => `/modules/${slug}?step=${step}`,
} as const

const MODULE_PREFIX = '/modules/'

/** Returns the module slug when the path is a module page, otherwise null. */
export function moduleSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith(MODULE_PREFIX)) return null
  const slug = pathname.slice(MODULE_PREFIX.length)
  return slug && !slug.includes('/') ? slug : null
}
