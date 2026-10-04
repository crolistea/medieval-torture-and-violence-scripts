import { useId, useState } from 'react'
import { Button } from '../components/ui/Button'
import { ArrowUpRightIcon, WarningIcon } from '../components/ui/icons'
import { RichText } from '../components/ui/RichText'
import { ripper } from '../data/ripper'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { rip, RipError, type RipEntry, type RipResult } from '../ripper/index.ts'
import { cx } from '../utils/cx'
import styles from './RipperPage.module.css'

type Outcome = { ok: true; result: RipResult } | { ok: false; error: RipError }

/** Long lists are shown a page at a time so a big lorebook does not stall the tab. */
const PREVIEW_STEP = 40

function run(input: string): Outcome {
  try {
    return { ok: true, result: rip(input) }
  } catch (error) {
    if (error instanceof RipError) return { ok: false, error }
    // Anything else is a bug in the ripper, not in the input. Say so plainly.
    const detail = error instanceof Error ? error.message : String(error)
    return { ok: false, error: new RipError('no-entries', `The ripper failed while reading this: ${detail}`) }
  }
}

/** The facts about one entry that are worth a glance, in the order they are shown. */
function facts(entry: RipEntry): string[] {
  const list: string[] = []
  if (entry.category !== null) list.push(`category ${entry.category}${entry.inferred.includes('category') ? ' (inferred)' : ''}`)
  if (entry.order !== null) list.push(`order ${entry.order}`)
  if (entry.priority !== null) list.push(`priority ${entry.priority}`)
  if (entry.enabled === false) list.push('disabled')
  if (entry.constant) list.push('constant')
  for (const [field, value] of Object.entries(entry.insertion)) list.push(`${field} ${String(value)}`)
  const extra = Object.keys(entry.extra)
  if (extra.length) list.push(`also kept: ${extra.join(', ')}`)
  return list
}

function EntryCard({ entry }: { entry: RipEntry }) {
  const meta = facts(entry)
  return (
    <li className={styles.entry}>
      <div className={styles.entryHead}>
        <span className={styles.entryIndex}>{String(entry.index).padStart(2, '0')}</span>
        <h3 className={cx(styles.entryName, entry.name === null && styles.unnamed)}>{entry.name ?? entry.comment ?? 'No name'}</h3>
      </div>

      {(entry.keys.length > 0 || entry.secondaryKeys.length > 0) && (
        <ul role="list" className={styles.keys} aria-label="Keys">
          {entry.keys.map((key) => (
            <li key={`k-${key}`}>{key}</li>
          ))}
          {entry.secondaryKeys.map((key) => (
            <li key={`s-${key}`} className={styles.secondary}>
              {key}
            </li>
          ))}
        </ul>
      )}

      {entry.content ? <p className={styles.entryContent}>{entry.content}</p> : <p className={styles.empty}>No content.</p>}

      {entry.name !== null && entry.comment !== null && <p className={styles.entryMeta}>comment: {entry.comment}</p>}
      {meta.length > 0 && <p className={styles.entryMeta}>{meta.join(' · ')}</p>}
    </li>
  )
}

/** Paste something in, see what the ripper found. */
export function RipperPage() {
  useDocumentTitle(ripper.name)

  const inputId = useId()
  const [input, setInput] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [shown, setShown] = useState(PREVIEW_STEP)

  const read = (text: string) => {
    setOutcome(run(text))
    setShown(PREVIEW_STEP)
  }

  const change = (text: string) => {
    setInput(text)
    // The old result no longer matches what is in the box.
    setOutcome(null)
  }

  const loadExample = () => {
    setInput(ripper.example)
    read(ripper.example)
  }

  const clear = () => {
    setInput('')
    setOutcome(null)
  }

  const result = outcome?.ok ? outcome.result : null
  const error = outcome && !outcome.ok ? outcome.error : null

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{ripper.name}</h1>
        <p className={styles.lead}>{ripper.blurb}</p>
        <a className={styles.source} href={ripper.folderUrl} target="_blank" rel="noreferrer">
          View the code on GitHub
          <ArrowUpRightIcon aria-hidden="true" weight="bold" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
          <div className={styles.bar}>
            <h2 id={`${inputId}-title`} className={styles.barTitle}>
              Input
            </h2>
            <button type="button" className={styles.barAction} onClick={loadExample}>
              Try an example
            </button>
          </div>

          <label htmlFor={inputId} className="visually-hidden">
            Text to rip
          </label>
          <textarea
            id={inputId}
            className={styles.input}
            value={input}
            onChange={(event) => change(event.target.value)}
            placeholder="Paste JSON, JavaScript or plain text here."
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />

          <div className={styles.actions}>
            <Button size="lg" onClick={() => read(input)} disabled={!input.trim()} fullWidthOnMobile>
              Rip it
            </Button>
            <Button variant="secondary" size="lg" onClick={clear} disabled={!input && !outcome} fullWidthOnMobile>
              Clear
            </Button>
          </div>

          <p className={styles.privacy}>{ripper.privacy}</p>
        </section>

        <section className={styles.output} aria-labelledby={`${inputId}-result`} aria-live="polite">
          <h2 id={`${inputId}-result`} className="visually-hidden">
            Result
          </h2>

          {!outcome && (
            <dl className={styles.accepts}>
              {ripper.accepts.map((item) => (
                <div key={item.term} className={styles.accept}>
                  <dt>{item.term}</dt>
                  <dd>
                    <RichText text={item.detail} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {error && (
            <div className={styles.error} role="alert">
              <WarningIcon aria-hidden="true" weight="bold" className={styles.errorIcon} />
              <div>
                <p className={styles.errorTitle}>{error.message}</p>
                {error.hint && <p className={styles.errorHint}>{error.hint}</p>}
              </div>
            </div>
          )}

          {result && (
            <>
              <div className={styles.summary}>
                <p className={styles.count}>
                  {result.entries.length} {result.entries.length === 1 ? 'entry' : 'entries'}
                </p>
                <p className={styles.format}>Read as: {result.formatLabel}</p>
              </div>

              {result.warnings.length > 0 && (
                <ul role="list" className={styles.warnings}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}

              <ol role="list" className={styles.entries}>
                {result.entries.slice(0, shown).map((entry) => (
                  <EntryCard key={entry.index} entry={entry} />
                ))}
              </ol>

              {result.entries.length > shown && (
                <Button variant="secondary" onClick={() => setShown(shown + PREVIEW_STEP)}>
                  Show {Math.min(PREVIEW_STEP, result.entries.length - shown)} more
                </Button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
