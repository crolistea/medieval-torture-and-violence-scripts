import { site } from '../../data/site'
import type { ScriptSource } from '../../data/types'
import { formatSize } from '../../utils/scriptSource'
import styles from './CodeBlock.module.css'
import { CopyButton } from './CopyButton'
import { ArrowUpRightIcon, FileJsIcon } from './icons'

/**
 * Shows a script from the repository with one prominent copy button.
 * The code scrolls inside its own box, so long lines never widen the page.
 */
export function CodeBlock({ script }: { script: ScriptSource }) {
  return (
    <figure className={styles.block}>
      <figcaption className={styles.bar}>
        <div className={styles.file}>
          <FileJsIcon aria-hidden="true" className={styles.fileIcon} />
          <div className={styles.fileText}>
            <span className={styles.filename}>{script.filename}</span>
            <span className={styles.meta}>
              {script.lineCount} lines, {formatSize(script.byteSize)}
            </span>
          </div>
        </div>
        <CopyButton
          value={script.code}
          label="Copy code"
          subject={`${script.filename} code`}
          size="large"
          className={styles.copy}
        />
      </figcaption>
      <pre className={styles.pre} tabIndex={0} role="region" aria-label={`${script.filename} source code`}>
        <code>{script.code}</code>
      </pre>
      <div className={styles.foot}>
        <span>The button copies all {script.lineCount} lines, not only what is visible.</span>
        <a className="text-link" href={site.fileUrl(script.filename)} target="_blank" rel="noreferrer">
          View file on GitHub
          <ArrowUpRightIcon aria-hidden="true" className={styles.external} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
    </figure>
  )
}
