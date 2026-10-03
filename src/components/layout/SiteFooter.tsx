import { modules } from '../../data/modules'
import { site } from '../../data/site'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.inner)}>
        <div className={styles.about}>
          <p className={styles.name}>{site.name}</p>
          <p className={styles.note}>
            Scripts for the {site.platform} Scripts feature, with guided installation. An unofficial community
            project, not affiliated with or endorsed by {site.platform}.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul role="list" className={styles.links}>
            {modules.map((module) => (
              <li key={module.slug}>
                <Link to={paths.module(module.slug)} className={styles.link}>
                  {module.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to={paths.about} className={styles.link}>
                About and documentation
              </Link>
            </li>
            <li>
              <a className={styles.link} href={site.repoUrl} target="_blank" rel="noreferrer">
                GitHub repository
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
