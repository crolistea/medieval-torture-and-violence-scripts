import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './Checkbox.module.css'
import { CheckIcon } from './icons'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  className?: string
}

/** Square checkbox built on a native input, so keyboard and screen readers work as usual. */
export function Checkbox({ checked, onChange, children, className }: CheckboxProps) {
  return (
    <label className={cx(styles.checkbox, checked && styles.checked, className)}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.box} aria-hidden="true">
        <CheckIcon weight="bold" />
      </span>
      <span className={styles.text}>{children}</span>
    </label>
  )
}
