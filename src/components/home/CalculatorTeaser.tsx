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
          <p className={styles.kicker}>STACK ANALYSIS / CONTEXT PRESSURE</p>
          <h2 id="calculator-teaser-title" className={styles.title}>How much shit can your context take?</h2>
        </div>
        <div className={styles.side}>
          <p className={styles.blurb}>
            Stack catalogue scripts, set your context window and generation settings, then estimate what the stack costs before you install it.
          </p>
          <Button href={toHref(paths.calculator)} size="lg" className={styles.cta}>
            Calculate your stack
            <ArrowRightIcon aria-hidden="true" weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  )
}
