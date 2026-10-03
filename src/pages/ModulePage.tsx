import { Installer, scrollToInstaller } from '../components/install/Installer'
import { Button } from '../components/ui/Button'
import { ArrowDownIcon, CheckIcon, XIcon } from '../components/ui/icons'
import { site } from '../data/site'
import type { ModuleDefinition } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx } from '../utils/cx'
import styles from './ModulePage.module.css'

interface ModulePageProps {
  module: ModuleDefinition
  /** Raw value of the ?step= query parameter, or null. */
  stepParam: string | null
}

const REQUIREMENTS = [
  `A ${site.platform} account you are logged in to`,
  'A character you created',
  'About five minutes',
]

export function ModulePage({ module, stepParam }: ModulePageProps) {
  useDocumentTitle(`Install ${module.name}`)

  return (
    <>
      <section className={cx('container', styles.hero)} aria-labelledby="module-title">
        <div className={styles.intro}>
          <p className={cx('mono-label', styles.kind)}>{module.kind} module</p>
          <h1 id="module-title" className={styles.title}>
            {module.name}
          </h1>
          {module.alias && <p className={styles.alias}>Also known as the {module.alias}</p>}
          <p className={styles.lead}>{module.tagline}</p>
          <div className={styles.actions}>
            <Button size="lg" fullWidthOnMobile onClick={scrollToInstaller} className={styles.startButton}>
              Start installation
              <ArrowDownIcon aria-hidden="true" weight="bold" />
            </Button>
          </div>
        </div>

        <dl className={styles.facts}>
          {module.facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cx('container', styles.about)} aria-labelledby="module-what">
        <div className={styles.aboutLead}>
          <h2 id="module-what" className={styles.heading}>
            What it does
          </h2>
          <p className={styles.description}>{module.description}</p>
        </div>

        <div className={styles.lists}>
          <div className={styles.listBlock}>
            <h3 className={styles.listTitle}>It will</h3>
            <ul role="list" className={styles.list}>
              {module.does.map((item) => (
                <li key={item}>
                  <CheckIcon aria-hidden="true" weight="bold" className={styles.yes} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.listBlock}>
            <h3 className={styles.listTitle}>It will not</h3>
            <ul role="list" className={styles.list}>
              {module.doesNot.map((item) => (
                <li key={item}>
                  <XIcon aria-hidden="true" weight="bold" className={styles.no} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={cx('container', styles.needs)} aria-labelledby="module-needs">
        <h2 id="module-needs" className={styles.needsTitle}>
          Before you start, you need
        </h2>
        <ul role="list" className={styles.needsList}>
          {REQUIREMENTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className={cx('container', styles.installer)}>
        {/* The key gives every module its own installer state. */}
        <Installer key={module.slug} module={module} stepParam={stepParam} />
      </div>
    </>
  )
}
