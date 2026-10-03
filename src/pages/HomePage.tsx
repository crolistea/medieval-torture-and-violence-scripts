import { useLayoutEffect, useRef } from 'react'
import { Catalogue } from '../components/home/Catalogue'
import { ScraperTeaser } from '../components/home/ScraperTeaser'
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

  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // The headline is sized to fit the hero, which needs its width in ems.
  // Measuring it here means the words can change without touching the CSS.
  useLayoutEffect(() => {
    const measure = () => {
      const hero = heroRef.current
      const title = titleRef.current
      if (!hero || !title) return
      const em = parseFloat(getComputedStyle(title).fontSize)
      if (em > 0) hero.style.setProperty('--len', (title.offsetWidth / em).toFixed(3))
    }

    measure()
    // The display font is wider than its fallback, so measure again once it arrives.
    document.fonts.addEventListener('loadingdone', measure)
    return () => document.fonts.removeEventListener('loadingdone', measure)
  }, [])

  return (
    <>
      <section ref={heroRef} className={styles.hero} aria-labelledby="home-title">
        <div className={cx('container', styles.inner)}>
          {/* Written in normal case for screen readers; the CSS sets it in capitals. */}
          <h1 ref={titleRef} id="home-title" className={styles.title}>
            <span className={styles.line}>Violence X</span> <span className={styles.line}>Brutality!</span>
          </h1>
        </div>
      </section>

      <Catalogue />

      <ScraperTeaser />

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
