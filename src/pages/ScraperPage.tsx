import { CopyField } from '../components/ui/CopyField'
import { ArrowUpRightIcon } from '../components/ui/icons'
import { RichText } from '../components/ui/RichText'
import { scraper } from '../data/scraper'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx } from '../utils/cx'
import styles from './ScraperPage.module.css'

/** How to use the scraper: one short step after another, each with the text to copy. */
export function ScraperPage() {
  useDocumentTitle(scraper.name)

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{scraper.name}</h1>
        <p className={styles.lead}>{scraper.blurb}</p>
        <a className={styles.source} href={scraper.folderUrl} target="_blank" rel="noreferrer">
          View the code on GitHub
          <ArrowUpRightIcon aria-hidden="true" weight="bold" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </header>

      <ol role="list" className={styles.steps}>
        {scraper.steps.map((step) => (
          <li key={step.title} className={styles.step}>
            <h2 className={styles.heading}>
              {step.title}
              {step.optional && <span className={styles.optional}>Optional</span>}
            </h2>
            <div className={styles.content}>
              <p>
                <RichText text={step.text} />
              </p>
              {step.copy?.map((field) => <CopyField key={field.label} {...field} />)}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
