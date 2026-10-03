import { useEffect, useRef, useState } from 'react'
import { useInstallProgress } from '../../hooks/useInstallProgress'
import type { ModuleDefinition } from '../../data/types'
import { navigate } from '../../router/hashRouter'
import { paths } from '../../router/paths'
import { CompletePanel } from './CompletePanel'
import styles from './Installer.module.css'
import { StepNav } from './StepNav'
import { StepPanel } from './StepPanel'

export const INSTALLER_ID = 'install'
const INSTALLER_TITLE_ID = 'install-title'

interface InstallerProps {
  module: ModuleDefinition
  /** Raw value of the ?step= query parameter, or null when it is absent. */
  stepParam: string | null
}

/** "3" opens the third step, "done" opens the completion screen. */
function parseStepParam(value: string | null, total: number): number | null {
  if (value === null) return null
  if (value === 'done') return total
  const step = Number(value)
  return Number.isInteger(step) && step >= 1 && step <= total ? step - 1 : null
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Scrolls to the installer and moves keyboard focus to its heading. */
export function scrollToInstaller(): void {
  document
    .getElementById(INSTALLER_ID)
    ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  document.getElementById(INSTALLER_TITLE_ID)?.focus({ preventScroll: true })
}

/**
 * The guided installer: one step on screen at a time, with a step list to
 * move around and a completion screen at the end.
 *
 * The open step lives in the URL (?step=3), so the browser Back button returns
 * to the previous step and a refresh keeps the reader's place. Which steps are
 * done is saved in the browser.
 */
export function Installer({ module, stepParam }: InstallerProps) {
  const { steps, slug, script } = module
  const total = steps.length
  const progress = useInstallProgress(slug)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousIndex = useRef<number | null>(null)

  const doneCount = steps.filter((step) => progress.isStepDone(step.id)).length
  const remaining = steps.filter((step) => !progress.isStepDone(step.id))

  // Without ?step= in the URL, open the first step that is not done yet.
  // Kept from the first render so ticking "Step done" does not jump ahead.
  const [resumeIndex] = useState(() => {
    const firstOpen = steps.findIndex((step) => !progress.isStepDone(step.id))
    return firstOpen === -1 ? total : firstOpen
  })
  const activeIndex = parseStepParam(stepParam, total) ?? resumeIndex

  // After a step change, bring the installer into view and move focus to the
  // new heading so keyboard and screen reader users land on the new step.
  useEffect(() => {
    const isFirstRender = previousIndex.current === null
    const changed = previousIndex.current !== activeIndex
    previousIndex.current = activeIndex
    if (stepParam === null || !changed) return

    document
      .getElementById(INSTALLER_ID)
      ?.scrollIntoView({ behavior: isFirstRender || prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    if (!isFirstRender) headingRef.current?.focus({ preventScroll: true })
  }, [activeIndex, stepParam])

  const openStep = (index: number) => navigate(paths.moduleStep(slug, index >= total ? 'done' : index + 1))

  const resetProgress = () => {
    progress.reset()
    openStep(0)
  }

  const activeStep = activeIndex < total ? steps[activeIndex] : null

  return (
    <section id={INSTALLER_ID} className={styles.installer} aria-labelledby={INSTALLER_TITLE_ID}>
      <div className={styles.head}>
        <h2 id={INSTALLER_TITLE_ID} tabIndex={-1} className={styles.title}>
          Installation
        </h2>
        <div className={styles.status}>
          <p className={styles.count} aria-live="polite">
            {doneCount} of {total} steps done
          </p>
          {doneCount > 0 && (
            <button type="button" className={styles.reset} onClick={resetProgress}>
              Start over
            </button>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        <StepNav slug={slug} steps={steps} activeIndex={activeIndex} isStepDone={progress.isStepDone} />

        {/* The key restarts the entry animation each time a different step opens. */}
        <div key={activeIndex} className={styles.stage}>
          {activeStep ? (
            <StepPanel
              slug={slug}
              step={activeStep}
              index={activeIndex}
              total={total}
              script={script}
              done={progress.isStepDone(activeStep.id)}
              onDoneChange={(done) => progress.setStepDone(activeStep.id, done)}
              onContinue={() => {
                progress.setStepDone(activeStep.id, true)
                openStep(activeIndex + 1)
              }}
              headingRef={headingRef}
            />
          ) : (
            <CompletePanel
              module={module}
              remaining={remaining}
              isChecked={progress.isChecked}
              onCheck={progress.setCheck}
              headingRef={headingRef}
            />
          )}
        </div>
      </div>
    </section>
  )
}
