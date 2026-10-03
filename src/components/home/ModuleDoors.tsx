import { modules } from '../../data/modules'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import { ArrowRightIcon } from '../ui/icons'
import styles from './ModuleDoors.module.css'

/**
 * The module list on the home page: one large panel per module.
 * Each panel is scoped to its module's theme, so hovering it previews the
 * colour of the section the reader is about to enter.
 */
export function ModuleDoors() {
  return (
    <ul role="list" className={styles.doors}>
      {modules.map((module) => (
        <li key={module.slug} className={styles.door} data-theme={module.theme}>
          <p className={styles.kind}>
            <span className={styles.swatch} aria-hidden="true" />
            {module.kind}
          </p>

          <h2 className={styles.name}>
            {/* The link's hit area is stretched over the whole panel in CSS. */}
            <Link to={paths.module(module.slug)} className={styles.link}>
              {module.name}
            </Link>
          </h2>

          <p className={styles.tagline}>{module.tagline}</p>

          <p className={styles.cta} aria-hidden="true">
            Open installer
            <ArrowRightIcon weight="bold" />
          </p>
        </li>
      ))}
    </ul>
  )
}
