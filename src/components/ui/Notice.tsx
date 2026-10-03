import type { ReactNode } from 'react'
import type { NoticeTone } from '../../data/types'
import { cx } from '../../utils/cx'
import { InfoIcon, SealQuestionIcon, WarningIcon } from './icons'
import styles from './Notice.module.css'

const TONES: Record<NoticeTone, { tag: string; icon: ReactNode }> = {
  info: { tag: 'Good to know', icon: <InfoIcon aria-hidden="true" /> },
  warning: { tag: 'Important', icon: <WarningIcon aria-hidden="true" /> },
  verify: { tag: 'Unconfirmed', icon: <SealQuestionIcon aria-hidden="true" /> },
}

interface NoticeProps {
  tone: NoticeTone
  title: string
  children: ReactNode
}

/**
 * A short aside inside a step. The "verify" tone marks anything we could not
 * confirm against JanitorAI's documentation, and is drawn with a dashed edge
 * so it reads as provisional.
 */
export function Notice({ tone, title, children }: NoticeProps) {
  const { tag, icon } = TONES[tone]
  return (
    <aside className={cx(styles.notice, styles[tone])}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.body}>
        <p className={styles.tag}>{tag}</p>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{children}</p>
      </div>
    </aside>
  )
}
