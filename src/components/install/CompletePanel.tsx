import type { Ref } from 'react'
import { modules } from '../../data/modules'
import type { InstallStep, ModuleDefinition } from '../../data/types'
import { toHref } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { ArrowLeftIcon, ArrowRightIcon } from '../ui/icons'
import { RichText } from '../ui/RichText'
import styles from './CompletePanel.module.css'

interface CompletePanelProps {
  module: ModuleDefinition
  /** Steps the reader has not marked as done yet. */
  remaining: InstallStep[]
  isChecked: (id: string) => boolean
  onCheck: (id: string, checked: boolean) => void
  headingRef: Ref<HTMLHeadingElement>
}

/** The last screen of the installer: confirmation, final checks and how to test. */
export function CompletePanel({ module, remaining, isChecked, onCheck, headingRef }: CompletePanelProps) {
  const { completion, steps, slug } = module
  const finished = remaining.length === 0
  const checkedCount = completion.checklist.filter((item) => isChecked(item.id)).length
  const otherModules = modules.filter((other) => other.slug !== slug)

  return (
    <article className={styles.panel} aria-labelledby="complete-title">
      {finished ? (
        <header className={styles.banner}>
          <p className={styles.bannerKicker}>All {steps.length} steps done</p>
          <h3 id="complete-title" ref={headingRef} tabIndex={-1} className={styles.bannerTitle}>
            Installation complete
          </h3>
        </header>
      ) : (
        <header className={styles.pending}>
          <h3 id="complete-title" ref={headingRef} tabIndex={-1} className={styles.pendingTitle}>
            A few steps are still open
          </h3>
          <p className={styles.pendingText}>Finish these before you run the final checks.</p>
          <ul role="list" className={styles.pendingList}>
            {remaining.map((step) => (
              <li key={step.id}>
                <a className="text-link" href={toHref(paths.moduleStep(slug, steps.indexOf(step) + 1))}>
                  Step {steps.indexOf(step) + 1}: {step.title}
                </a>
              </li>
            ))}
          </ul>
        </header>
      )}

      {finished && <p className={styles.intro}>{completion.intro}</p>}

      <section className={styles.section} aria-labelledby="complete-checks">
        <div className={styles.sectionHead}>
          <h4 id="complete-checks" className={styles.heading}>
            Final verification checklist
          </h4>
          <p className={styles.count} aria-live="polite">
            {checkedCount} of {completion.checklist.length} confirmed
          </p>
        </div>
        <ul role="list" className={styles.checklist}>
          {completion.checklist.map((item) => (
            <li key={item.id}>
              <Checkbox checked={isChecked(item.id)} onChange={(checked) => onCheck(item.id, checked)}>
                <RichText text={item.label} />
              </Checkbox>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="complete-test">
        <h4 id="complete-test" className={styles.heading}>
          How to test it in real chats
        </h4>
        <ul role="list" className={styles.ideas}>
          {completion.testIdeas.map((idea) => (
            <li key={idea.title} className={styles.idea}>
              <p className={styles.ideaTitle}>{idea.title}</p>
              <p className={styles.ideaBody}>{idea.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="complete-trouble">
        <h4 id="complete-trouble" className={styles.heading}>
          If something is off
        </h4>
        <div className={styles.troubles}>
          {completion.troubleshooting.map((entry) => (
            <details key={entry.problem} className={styles.trouble}>
              <summary>{entry.problem}</summary>
              <p>
                <RichText text={entry.fix} />
              </p>
            </details>
          ))}
        </div>
      </section>

      <footer className={styles.foot}>
        <Button variant="secondary" href={toHref(paths.moduleStep(slug, steps.length))}>
          <ArrowLeftIcon aria-hidden="true" weight="bold" />
          Back
        </Button>
        <div className={styles.nextLinks}>
          {otherModules.map((other) => (
            <Button key={other.slug} variant="primary" href={toHref(paths.module(other.slug))} className={styles.next}>
              Install {other.name}
              <ArrowRightIcon aria-hidden="true" weight="bold" />
            </Button>
          ))}
        </div>
      </footer>
    </article>
  )
}
