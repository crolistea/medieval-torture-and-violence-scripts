import type { InstallStep } from '../../data/types'
import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import { CheckIcon, FlagCheckeredIcon } from '../ui/icons'
import styles from './StepNav.module.css'

interface StepNavProps {
  slug: string
  steps: InstallStep[]
  /** Index of the open step. Equal to steps.length on the completion screen. */
  activeIndex: number
  isStepDone: (id: string) => boolean
}

/**
 * The step list. On wide screens it is a vertical rail with titles. On small
 * screens it becomes a row of numbered squares that sticks under the header,
 * so progress stays visible while the reader scrolls a step.
 */
export function StepNav({ slug, steps, activeIndex, isStepDone }: StepNavProps) {
  const allDone = steps.every((step) => isStepDone(step.id))

  return (
    <nav className={styles.nav} aria-label="Installation steps">
      <ol role="list" className={styles.list}>
        {steps.map((step, index) => {
          const done = isStepDone(step.id)
          const active = index === activeIndex
          return (
            <li key={step.id} className={styles.item}>
              <a
                href={toHref(paths.moduleStep(slug, index + 1))}
                className={cx(styles.link, done && styles.done)}
                aria-current={active ? 'step' : undefined}
              >
                <span className={styles.box} aria-hidden="true">
                  {done && !active ? <CheckIcon weight="bold" /> : index + 1}
                </span>
                <span className={styles.title}>
                  <span className="visually-hidden">Step {index + 1}: </span>
                  {step.title}
                  {done && <span className="visually-hidden"> (done)</span>}
                </span>
              </a>
            </li>
          )
        })}
        <li className={styles.item}>
          <a
            href={toHref(paths.moduleStep(slug, 'done'))}
            className={cx(styles.link, allDone && styles.done)}
            aria-current={activeIndex === steps.length ? 'step' : undefined}
          >
            <span className={styles.box} aria-hidden="true">
              <FlagCheckeredIcon weight="bold" />
            </span>
            <span className={styles.title}>Installation complete</span>
          </a>
        </li>
      </ol>
    </nav>
  )
}
