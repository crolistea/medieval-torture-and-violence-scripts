import { ModuleDoors } from '../components/home/ModuleDoors'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx } from '../utils/cx'
import styles from './HomePage.module.css'

const PROMISES = [
  {
    term: 'Supplements, never replaces',
    detail: "Each script only adds text to the character's scenario. Nothing on the card is overwritten.",
  },
  {
    term: 'Quiet in calm scenes',
    detail: 'Ordinary conversation activates neither module. No note, no extra tokens.',
  },
  {
    term: 'No invented motives',
    detail: 'A module never makes a character cruel or aggressive. It only informs a scene that is already there.',
  },
  {
    term: 'Independent',
    detail: 'Install one module or both. Neither depends on the other.',
  },
]

export function HomePage() {
  useDocumentTitle()

  return (
    <>
      <section className={cx('container', styles.hero)} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.title}>
          Module list
        </h1>
        <ModuleDoors />
      </section>

      <section className={cx('container', styles.promise)} aria-labelledby="home-card">
        <div>
          <h2 id="home-card" className={styles.heading}>
            The character card stays in charge.
          </h2>
          <p className={styles.sub}>
            These scripts give a character knowledge and options. What the character wants, and how far they go,
            is still decided by the card you wrote.
          </p>
        </div>
        <dl className={styles.promiseList}>
          {PROMISES.map((item) => (
            <div key={item.term} className={styles.promiseRow}>
              <dt>{item.term}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
