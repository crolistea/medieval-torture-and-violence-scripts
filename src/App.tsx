import { useEffect, useRef, type MouseEvent } from 'react'
import styles from './App.module.css'
import { SiteFooter } from './components/layout/SiteFooter'
import { SiteHeader } from './components/layout/SiteHeader'
import { findModule } from './data/modules'
import { useTheme } from './hooks/useTheme'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { ModulePage } from './pages/ModulePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useHashPath } from './router/hashRouter'
import { moduleSlugFromPath, paths } from './router/paths'
import { DEFAULT_THEME } from './themes/themes'

export default function App() {
  const pathname = useHashPath()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)

  const moduleSlug = moduleSlugFromPath(pathname)
  const activeModule = moduleSlug ? findModule(moduleSlug) : undefined

  // A module page takes the module's accent. Everything else uses the home blue.
  const theme = activeModule?.theme ?? DEFAULT_THEME
  useTheme(theme)

  // On a page change, start at the top and move focus into the new page.
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    // The hash holds the route, so a normal "#main" link would navigate away.
    event.preventDefault()
    mainRef.current?.focus({ preventScroll: true })
  }

  let page
  if (pathname === paths.home) page = <HomePage />
  else if (pathname === paths.about) page = <AboutPage />
  else if (activeModule) page = <ModulePage module={activeModule} />
  else page = <NotFoundPage />

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip} onClick={skipToContent}>
        Skip to content
      </a>
      <SiteHeader pathname={pathname} theme={theme} />
      {/* The key replays the entry animation on every page change. */}
      <main id="main" ref={mainRef} tabIndex={-1} key={pathname} className={styles.main}>
        {page}
      </main>
      <SiteFooter />
    </div>
  )
}
