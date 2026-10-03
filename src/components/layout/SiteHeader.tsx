import { useEffect, useState } from 'react'
import { modules } from '../../data/modules'
import { site } from '../../data/site'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import type { ThemeId } from '../../themes/themes'
import { cx } from '../../utils/cx'
import { ArrowUpRightIcon, GithubLogoIcon, ListIcon, XIcon } from '../ui/icons'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  pathname: string
  theme: ThemeId
}

const MENU_ID = 'site-menu'

export function SiteHeader({ pathname, theme }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Module links come from the registry, so a new module appears here by itself.
  const items = [
    { to: paths.home, label: 'Home' },
    ...modules.map((module) => ({ to: paths.module(module.slug), label: module.name })),
    { to: paths.about, label: 'About' },
  ]

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={styles.header}>
      {/* Re-mounted on every theme change, which replays the sweep across the top edge. */}
      <span key={theme} className={styles.sweep} aria-hidden="true" />

      <div className={cx('container', styles.inner)}>
        <Link to={paths.home} className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandName}>{site.name}</span>
          <span className={styles.brandFor}>for {site.platform}</span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <ul role="list" className={styles.navList}>
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={styles.navLink}
                  aria-current={pathname === item.to ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a className={styles.repo} href={site.repoUrl} target="_blank" rel="noreferrer">
          <GithubLogoIcon aria-hidden="true" weight="fill" />
          GitHub
          <ArrowUpRightIcon aria-hidden="true" className={styles.repoArrow} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls={MENU_ID}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <XIcon aria-hidden="true" /> : <ListIcon aria-hidden="true" />}
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      <div id={MENU_ID} className={styles.menu} data-open={menuOpen}>
        <nav className="container" aria-label="Main, small screens">
          <ul role="list" className={styles.menuList}>
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={styles.menuLink}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                className={styles.menuLink}
                href={site.repoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={closeMenu}
              >
                GitHub repository
                <ArrowUpRightIcon aria-hidden="true" />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
