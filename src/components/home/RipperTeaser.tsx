import { ripper } from '../../data/ripper'
import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'
import { ArrowRightIcon } from '../ui/icons'
// The ripper sits under the scraper and uses the same panel, so it shares its styles.
import styles from './ScraperTeaser.module.css'

/** The ripper on the home page: its name, one sentence, and the way in. */
export function RipperTeaser() {
  return (
    <section className={cx('container', styles.teaser)} aria-labelledby="ripper-title">
      <div className={styles.panel}>
        <h2 id="ripper-title" className={styles.title}>
          {ripper.name}
        </h2>
        <div className={styles.side}>
          <p className={styles.blurb}>{ripper.blurb}</p>
          <Button href={toHref(paths.ripper)} size="lg" className={styles.cta}>
            Open it
            <ArrowRightIcon aria-hidden="true" weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  )
}
