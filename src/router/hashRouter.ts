import { useSyncExternalStore } from 'react'

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

/** Route path, always starting with "/" and without a trailing slash or query. */
export function parseHash(hash: string): string {
  const raw = hash.replace(/^#/, '')
  // Anything that is not a route (an empty hash, a stray anchor) is the home page.
  if (!raw.startsWith('/')) return '/'
  return raw.split('?')[0].replace(/\/+$/, '') || '/'
}

function readPath(): string {
  return parseHash(window.location.hash)
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** The current route path. Re-renders the caller whenever the hash changes. */
export function useHashPath(): string {
  return useSyncExternalStore(subscribe, readPath, () => '/')
}

/** Turns a route path into an href for an anchor. */
export function toHref(to: string): string {
  return `#${to}`
}
