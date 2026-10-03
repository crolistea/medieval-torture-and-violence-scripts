import { useMemo, useSyncExternalStore } from 'react'

/*
 * Minimal hash router.
 *
 * GitHub Pages cannot rewrite unknown paths to index.html, so a refresh on a
 * real path such as /modules/foo would 404. Keeping the route after the "#"
 * means the server only ever sees the site root, and refreshes always work.
 *
 * Links are plain <a href="#/..."> elements, so new-tab, middle-click and the
 * browser Back button behave natively with no click handlers.
 */

export interface HashRoute {
  /** Route path, always starting with "/" and without a trailing slash. */
  pathname: string
  /** Query parameters that follow the path inside the hash. */
  search: URLSearchParams
}

function readHash(): string {
  const raw = window.location.hash.slice(1)
  // Anything that is not a route (an empty hash, a stray anchor) is the home page.
  return raw.startsWith('/') ? raw : '/'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function parseHash(hash: string): HashRoute {
  const queryStart = hash.indexOf('?')
  const path = queryStart === -1 ? hash : hash.slice(0, queryStart)
  const query = queryStart === -1 ? '' : hash.slice(queryStart + 1)
  const pathname = path.replace(/\/+$/, '') || '/'
  return { pathname, search: new URLSearchParams(query) }
}

export function useHashRoute(): HashRoute {
  const hash = useSyncExternalStore(subscribe, readHash, () => '/')
  return useMemo(() => parseHash(hash), [hash])
}

/** Turns a route path into an href for an anchor. */
export function toHref(to: string): string {
  return `#${to}`
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  if (options.replace) {
    const url = new URL(window.location.href)
    url.hash = to
    window.location.replace(url)
    return
  }
  window.location.hash = to
}
