import { ModuleDoors } from '../components/home/ModuleDoors'
import { ArrowRightIcon } from '../components/ui/icons'
import { modules } from '../data/modules'
import { site } from '../data/site'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Link } from '../router/Link'
import { paths } from '../router/paths'
import { cx } from '../utils/cx'
import styles from './HomePage.module.css'

const SEQUENCE = [
  {
    title: 'You send a message',
    body: 'Nothing changes about how you chat. There is nothing extra to type or switch on.',
  },
  {
    title: 'The script reads the scene',
    body: 'It looks at the last few messages for signs that its subject is relevant right now.',
  },
  {
    title: 'It adds a short note, or nothing',
    body: "A relevant scene gets a few lines of background in the character's scenario. A calm scene gets none.",
  },
  {
    title: 'Your character replies',
    body: 'The reply is written with that background available. Personality and motives still come from the card.',
  },
]

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
        <p className={cx('mono-label', styles.eyebrow)}>{site.platform} script modules</p>
        <h1 id="home-title" className={styles.title}>
          Brief your character before every reply.
        </h1>
        <p className={styles.lead}>
          Each module is a {site.platform} script that adds a short, relevant note to your character's context.
          Pick one to install.
        </p>

        <div className={styles.chooser}>
          <h2 className="visually-hidden">Choose a module</h2>
          <ModuleDoors />
        </div>
      </section>

      <section className={cx('container', styles.section)} aria-labelledby="home-how">
        <h2 id="home-how" className={styles.heading}>
          What a script does
        </h2>
        <p className={styles.sub}>
          {site.platform} runs a script each time your character is about to reply. The modules here use that moment
          to hand the character some background.
        </p>
        <ol role="list" className={styles.sequence}>
          {SEQUENCE.map((item, index) => (
            <li key={item.title} className={styles.beat}>
              <span className={styles.beatNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.beatTitle}>{item.title}</h3>
              <p className={styles.beatBody}>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={cx('container', styles.section, styles.promise)} aria-labelledby="home-card">
        <div className={styles.promiseLead}>
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

      <section className={cx('container', styles.section)} aria-labelledby="home-start">
        <div className={styles.start}>
          <div className={styles.startText}>
            <h2 id="home-start" className={styles.heading}>
              Ready when you are
            </h2>
            <p className={styles.sub}>
              You need a {site.platform} account, a character you created, and about five minutes. No coding.
            </p>
          </div>
          <ul role="list" className={styles.startLinks}>
            {modules.map((module) => (
              <li key={module.slug} data-theme={module.theme}>
                <Link to={paths.module(module.slug)} className={styles.startLink}>
                  <span className={styles.startSwatch} aria-hidden="true" />
                  <span className={styles.startName}>{module.name}</span>
                  <ArrowRightIcon aria-hidden="true" weight="bold" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
