import { InstallGuide } from '../components/install/InstallGuide'
import type { ModuleDefinition } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx } from '../utils/cx'
import styles from './ModulePage.module.css'

/** A module page is its name followed directly by the installation steps. */
export function ModulePage({ module }: { module: ModuleDefinition }) {
  useDocumentTitle(`Install ${module.name}`)

  return (
    <div className={cx('container', styles.page)}>
      <h1 className={styles.title}>{module.name}</h1>
      <InstallGuide module={module} />
    </div>
  )
}
