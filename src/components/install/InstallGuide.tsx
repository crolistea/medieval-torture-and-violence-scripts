import type { ModuleDefinition } from '../../data/types'
import { RichText } from '../ui/RichText'
import styles from './InstallGuide.module.css'
import { StepBlocks } from './StepBlocks'

/**
 * The whole installation on one page: every step in order, top to bottom,
 * ending with the "Installation complete" block. Nothing to click through.
 */
export function InstallGuide({ module }: { module: ModuleDefinition }) {
  return (
    <div className={styles.guide}>
      <ol role="list" className={styles.steps}>
        {module.steps.map((step, index) => (
          <li key={step.id} className={styles.step}>
            <div className={styles.head}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <h2 className={styles.title}>
                <span className="visually-hidden">Step {index + 1}: </span>
                {step.title}
              </h2>
            </div>
            <div className={styles.content}>
              <StepBlocks blocks={step.blocks} script={module.script} />
            </div>
          </li>
        ))}
      </ol>

      <section className={styles.complete} aria-labelledby="complete-title">
        <h2 id="complete-title" className={styles.banner}>
          Installation complete
        </h2>
        <p>
          {module.name} now runs before every reply. {module.completeNote}
        </p>
        <p>
          <RichText text='Nothing appeared in the test? Check that the script is assigned to this character, that the first line is `"use worker";`, and that the whole file was pasted.' />
        </p>
      </section>
    </div>
  )
}
