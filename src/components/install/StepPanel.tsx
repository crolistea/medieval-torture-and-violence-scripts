import type { Ref } from 'react'
import type { InstallStep, ScriptSource } from '../../data/types'
import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { ArrowLeftIcon, ArrowRightIcon } from '../ui/icons'
import { StepBlocks } from './StepBlocks'
import styles from './StepPanel.module.css'

interface StepPanelProps {
  slug: string
  step: InstallStep
  index: number
  total: number
  script: ScriptSource
  done: boolean
  onDoneChange: (done: boolean) => void
  /** Marks the step done and opens the next one. */
  onContinue: () => void
  headingRef: Ref<HTMLHeadingElement>
}

/** One install step: what to do, and the controls to move on. */
export function StepPanel({
  slug,
  step,
  index,
  total,
  script,
  done,
  onDoneChange,
  onContinue,
  headingRef,
}: StepPanelProps) {
  const isLast = index === total - 1
  const headingId = `step-${step.id}-title`

  return (
    <article className={styles.panel} aria-labelledby={headingId}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.kicker}>
            Step {index + 1} of {total}
          </p>
          <h3 id={headingId} ref={headingRef} tabIndex={-1} className={styles.title}>
            {step.title}
          </h3>
          <p className={styles.summary}>{step.summary}</p>
        </div>
        <Checkbox checked={done} onChange={onDoneChange} className={styles.doneToggle}>
          Step done
        </Checkbox>
      </header>

      <div className={styles.body}>
        <StepBlocks blocks={step.blocks} script={script} />
      </div>

      <footer className={styles.foot}>
        {index > 0 ? (
          <Button variant="secondary" href={toHref(paths.moduleStep(slug, index))} className={styles.back}>
            <ArrowLeftIcon aria-hidden="true" weight="bold" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" onClick={onContinue} className={styles.next}>
          {isLast ? 'Finish installation' : 'Done, next step'}
          <ArrowRightIcon aria-hidden="true" weight="bold" />
        </Button>
      </footer>
    </article>
  )
}
