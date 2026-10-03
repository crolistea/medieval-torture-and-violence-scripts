import { useCopyToClipboard, type CopyState } from '../../hooks/useCopyToClipboard'
import { cx } from '../../utils/cx'
import styles from './CopyButton.module.css'
import { CheckIcon, CopyIcon, WarningIcon } from './icons'

interface CopyButtonProps {
  /** The text placed on the clipboard. */
  value: string
  /** Button text, for example "Copy code". */
  label?: string
  /** What is being copied, for screen readers: "Script code", "Test message". */
  subject: string
  size?: 'compact' | 'large'
  className?: string
}

const STATES: CopyState[] = ['idle', 'copied', 'failed']

/**
 * Copies text with the Clipboard API and confirms it on the button itself.
 * It is a real <button>, so Tab, Enter and Space all work.
 */
export function CopyButton({ value, label = 'Copy', subject, size = 'compact', className }: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard()

  const labels: Record<CopyState, string> = { idle: label, copied: 'Copied', failed: 'Copy failed' }
  const announcement =
    state === 'copied'
      ? `${subject} copied to clipboard.`
      : state === 'failed'
        ? `Could not copy ${subject.toLowerCase()}. Select the text and copy it by hand.`
        : ''

  return (
    <>
      <button
        type="button"
        className={cx(styles.button, styles[size], state !== 'idle' && styles[state], className)}
        onClick={() => void copy(value)}
        aria-label={state === 'idle' ? `${label}: ${subject}` : undefined}
      >
        <span className={styles.icon} aria-hidden="true">
          {state === 'copied' ? (
            <CheckIcon weight="bold" />
          ) : state === 'failed' ? (
            <WarningIcon weight="bold" />
          ) : (
            <CopyIcon weight="bold" />
          )}
        </span>
        {/* Every label is stacked in one cell so the button never changes width. */}
        <span className={styles.labels}>
          {STATES.map((key) => (
            <span key={key} className={cx(key !== state && styles.hidden)}>
              {labels[key]}
            </span>
          ))}
        </span>
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  )
}
