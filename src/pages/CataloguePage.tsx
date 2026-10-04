import { Catalogue } from '../components/home/Catalogue'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import styles from './CataloguePage.module.css'

export function CataloguePage() {
  useDocumentTitle('Script Catalogue')

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1>ALL SCRIPTS</h1>
        </header>
      </div>
      <Catalogue showAll />
    </div>
  )
}
