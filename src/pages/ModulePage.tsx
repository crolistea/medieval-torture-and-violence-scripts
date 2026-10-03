import { useState, type CSSProperties } from 'react'
import { ScriptRail } from '../components/module/ScriptRail'
import { CopyButton } from '../components/ui/CopyButton'
import { FisheyeImage } from '../components/ui/FisheyeImage'
import { ArrowLeftIcon } from '../components/ui/icons'
import { catalogueImage } from '../data/catalogueImages'
import type { ModuleDefinition } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Link } from '../router/Link'
import { paths } from '../router/paths'
import { cx } from '../utils/cx'
import styles from './ModulePage.module.css'

/**
 * A script page is one stage: the script's image, a panel holding its code
 * with a copy button, and the rail of the other scripts.
 * On a narrow screen the image moves behind the panel as a dimmed backdrop.
 */
export function ModulePage({ module }: { module: ModuleDefinition }) {
  useDocumentTitle(module.name)

  const image = catalogueImage(module.slug)
  const backdrop = image ? ({ '--backdrop': `url("${image}")` } as CSSProperties) : undefined

  // The code panel waits near the middle until the image appears, then moves aside for it.
  const [imageShown, setImageShown] = useState(!image)

  return (
    <div className={styles.page} style={backdrop}>
      <div className={cx('container', styles.inner)}>
        <div className={styles.top}>
          <Link to={paths.home} className={styles.back} aria-label="Back to the catalogue">
            <ArrowLeftIcon aria-hidden="true" weight="bold" />
          </Link>
          <h1 className={styles.title}>{module.name}</h1>
        </div>

        <div className={styles.body}>
          <ScriptRail current={module} />

          <div className={cx(styles.stage, imageShown && styles.settled)}>
            {image ? (
              <FisheyeImage src={image} className={styles.shot} onShown={() => setImageShown(true)} />
            ) : (
              <div className={cx(styles.shot, styles.empty)} />
            )}

            <section className={styles.panel} aria-label={`${module.name} code`}>
              <div className={styles.bar}>
                <span className={styles.filename}>{module.script.filename}</span>
                <CopyButton
                  value={module.script.code}
                  label="Copy code"
                  subject={`${module.name} code`}
                  size="large"
                  className={styles.copy}
                />
              </div>
              <pre className={styles.code} tabIndex={0}>
                <code>{module.script.code}</code>
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
