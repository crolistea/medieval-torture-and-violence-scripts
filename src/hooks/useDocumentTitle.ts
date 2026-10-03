import { useEffect } from 'react'
import { site } from '../data/site'

/** Sets the browser tab title. Pass nothing for the plain site title. */
export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${site.title}` : site.title
  }, [pageTitle])
}
