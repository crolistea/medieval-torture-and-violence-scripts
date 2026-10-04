import { Catalogue } from '../components/home/Catalogue'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import styles from './CataloguePage.module.css'

export function CataloguePage() {
  useDocumentTitle('Script Catalogue')

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <p>ALL SCRIPTS</p>
          <h1>Script Catalogue</h1>
          <span>Browse every available script. Select one to view and copy its code.</span>
        </header>
      </div>
      <Catalogue showAll />
    </div>
  )
}
