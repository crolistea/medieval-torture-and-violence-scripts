import { scraper } from '../../data/scraper'
import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'
import { ArrowRightIcon } from '../ui/icons'
import styles from './ScraperTeaser.module.css'

/** The scraper on the home page: its name, one sentence, and the way in. */
export function ScraperTeaser() {
  return (
    <section className={cx('container', styles.teaser)} aria-labelledby="scraper-title">
      <div className={styles.panel}>
        <h2 id="scraper-title" className={styles.title}>
          {scraper.name}
        </h2>
        <div className={styles.side}>
          <p className={styles.blurb}>{scraper.blurb}</p>
          <Button href={toHref(paths.scraper)} size="lg" className={styles.cta}>
            Read more
            <ArrowRightIcon aria-hidden="true" weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  )
}
