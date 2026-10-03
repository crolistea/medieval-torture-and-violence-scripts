import { Button } from '../components/ui/Button'
import { ArrowRightIcon } from '../components/ui/icons'
import { modules } from '../data/modules'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { toHref } from '../router/hashRouter'
import { Link } from '../router/Link'
import { paths } from '../router/paths'
import { cx } from '../utils/cx'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <section className={cx('container', styles.page)} aria-labelledby="missing-title">
      <p className={cx('mono-label', styles.code)}>Error 404</p>
      <h1 id="missing-title" className={styles.title}>
        This page does not exist.
      </h1>
      <p className={styles.lead}>The link may be old or mistyped. The installers are still here:</p>
      <ul role="list" className={styles.links}>
        {modules.map((module) => (
          <li key={module.slug}>
            <Link to={paths.module(module.slug)} className="text-link">
              {module.name}
            </Link>
          </li>
        ))}
      </ul>
      <Button href={toHref(paths.home)} className={styles.home}>
        Go to the home page
        <ArrowRightIcon aria-hidden="true" weight="bold" />
      </Button>
    </section>
  )
}
