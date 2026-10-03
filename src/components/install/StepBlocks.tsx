import type { ActionItem, ScriptSource, StepBlock } from '../../data/types'
import { CodeBlock } from '../ui/CodeBlock'
import { CopyField } from '../ui/CopyField'
import { CheckIcon, SealQuestionIcon } from '../ui/icons'
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
    case 'actions':
      return (
        <ul role="list" className={styles.actions}>
          {block.items.map(toAction).map((action, index) => (
            <li key={index} className={styles.action}>
              <p>
                <RichText text={action.text} />
              </p>
              {action.copy && <CopyField {...action.copy} />}
            </li>
          ))}
        </ul>
      )

    case 'script':
      return <CodeBlock script={script} />

    case 'result':
      return (
        <p className={styles.result}>
          <CheckIcon weight="bold" aria-hidden="true" />
          <span>
            <RichText text={block.text} />
          </span>
        </p>
      )

    case 'note':
      return (
        <p className={styles.note}>
          {block.unconfirmed && <SealQuestionIcon aria-hidden="true" />}
          <span>
            {block.unconfirmed && <strong className={styles.tag}>Unconfirmed: </strong>}
            <RichText text={block.text} />
          </span>
        </p>
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
