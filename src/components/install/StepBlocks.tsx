import type { CSSProperties } from 'react'
import type { ActionItem, ScriptSource, StepBlock } from '../../data/types'
import { CodeBlock } from '../ui/CodeBlock'
import { CopyField } from '../ui/CopyField'
import { CheckIcon } from '../ui/icons'
import { Notice } from '../ui/Notice'
import { RichText } from '../ui/RichText'
import styles from './StepBlocks.module.css'

interface StepBlocksProps {
  blocks: StepBlock[]
  /** The module's script, used by the "script" block. */
  script: ScriptSource
}

function toAction(item: string | ActionItem): ActionItem {
  return typeof item === 'string' ? { text: item } : item
}

function Block({ block, script }: { block: StepBlock; script: ScriptSource }) {
  switch (block.kind) {
    case 'text':
      return (
        <p className={styles.text}>
          <RichText text={block.body} />
        </p>
      )

    case 'actions': {
      const start = block.start ?? 1
      // The visible numbers are drawn with a CSS counter so they can be boxed.
      const counter = { counterReset: `action ${start - 1}` } as CSSProperties
      return (
        <ol role="list" start={start} className={styles.actions} style={counter}>
          {block.items.map(toAction).map((action, index) => (
            <li key={index} className={styles.action}>
              <div className={styles.actionBody}>
                <p>
                  <RichText text={action.text} />
                </p>
                {action.copy && <CopyField {...action.copy} />}
              </div>
            </li>
          ))}
        </ol>
      )
    }

    case 'script':
      return <CodeBlock script={script} />

    case 'expect':
      return (
        <div className={styles.expect}>
          <p className={styles.expectTag}>You should see</p>
          <p className={styles.expectTitle}>{block.title}</p>
          <ul role="list" className={styles.expectLines}>
            {block.lines.map((line, index) => (
              <li key={index}>
                <CheckIcon weight="bold" aria-hidden="true" />
                <span>
                  <RichText text={line} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'notice':
      return (
        <Notice tone={block.tone} title={block.title}>
          <RichText text={block.body} />
        </Notice>
      )

    case 'details':
      return (
        <details className={styles.details}>
          <summary>{block.summary}</summary>
          <div className={styles.detailsBody}>
            <StepBlocks blocks={block.blocks} script={script} />
          </div>
        </details>
      )
  }
}

/** Renders the content blocks of one install step. */
export function StepBlocks({ blocks, script }: StepBlocksProps) {
  return (
    <div className={styles.blocks}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} script={script} />
      ))}
    </div>
  )
}
