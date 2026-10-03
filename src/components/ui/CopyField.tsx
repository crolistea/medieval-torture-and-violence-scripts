import type { CopyField as CopyFieldData } from '../../data/types'
import { CopyButton } from './CopyButton'
import styles from './CopyField.module.css'

/** A short piece of text to copy: a script name, a test message. */
export function CopyField({ label, value }: CopyFieldData) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <code className={styles.value}>{value}</code>
        <CopyButton value={value} subject={label} className={styles.button} />
      </div>
    </div>
  )
}
