import logo from '../../assets/main-logo.png'
import { site } from '../../data/site'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import { ArrowUpRightIcon, GithubLogoIcon } from '../ui/icons'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  pathname: string
}

/*
 * A red bar with everything on it in black: the logo, About and the
 * repository, and nothing else. Scripts are reached from the catalogue on the
 * home page, so the bar stays the same size however many are added.
 */
export function SiteHeader({ pathname }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={cx('container', styles.inner)}>
        <Link to={paths.home} className={styles.brand}>
          <span className={styles.logo}>
            <img src={logo} alt="" />
          </span>
          <span className={styles.brandName}>{site.name}</span>
          <span className={styles.brandFor}>for {site.platform}</span>
        </Link>

        <nav aria-label="Main">
          <Link
            to={paths.about}
            className={styles.navLink}
            aria-current={pathname === paths.about ? 'page' : undefined}
          >
            About
          </Link>
        </nav>

        <a className={styles.repo} href={site.repoUrl} target="_blank" rel="noreferrer">
          <GithubLogoIcon aria-hidden="true" weight="fill" />
          <span className={styles.repoLabel}>GitHub</span>
          <ArrowUpRightIcon aria-hidden="true" weight="bold" className={styles.repoArrow} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
    </header>
  )
}
