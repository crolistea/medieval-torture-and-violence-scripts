import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'
import { ArrowRightIcon } from '../ui/icons'
import styles from './CalculatorTeaser.module.css'

export function CalculatorTeaser() {
  return (
    <section className={cx('container', styles.wrap)} aria-labelledby="calculator-teaser-title">
      <div className={styles.panel}>
        <div>
          <h2 id="calculator-teaser-title" className={styles.title}>SCRIPT IMPACT CALCULATOR</h2>
        </div>
        <div >
          <p className={styles.blurb}>
            Choose scripts, set ur context window & generation settings, then estimate what the it costs before you use it.
          </p>
          <Button href={toHref(paths.calculator)} size="lg" className={styles.cta}>
            CALCULATE
            <ArrowRightIcon aria-hidden="true" weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  )
}
