import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { catalogueImage } from '../../data/catalogueImages'
import { modules } from '../../data/modules'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import { Button } from '../ui/Button'
import { ArrowRightIcon } from '../ui/icons'
import styles from './Catalogue.module.css'

/** How many scripts show before the "View all" button takes over. */
const FIRST_PAGE = 9

/*
 * Leans a tile toward the pointer. The position goes straight into CSS
 * variables, so moving the mouse never re-renders anything.
 */
function lean(event: PointerEvent<HTMLLIElement>) {
  if (event.pointerType !== 'mouse') return
  const item = event.currentTarget
  const box = item.getBoundingClientRect()
  item.style.setProperty('--px', ((event.clientX - box.left) / box.width - 0.5).toFixed(3))
  item.style.setProperty('--py', ((event.clientY - box.top) / box.height - 0.5).toFixed(3))
}

function settle(event: PointerEvent<HTMLLIElement>) {
  event.currentTarget.style.removeProperty('--px')
  event.currentTarget.style.removeProperty('--py')
}

/**
 * The script catalogue on the home page: an image, the name and a few words
 * per module, with no heading above it. Images are picked up from
 * src/assets/catalogue/ by slug.
 */
export function Catalogue() {
  const [showAll, setShowAll] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  const hasMore = modules.length > FIRST_PAGE
  const visible = showAll ? modules : modules.slice(0, FIRST_PAGE)

  // The button disappears once it is used, so hand focus to the first script it revealed.
  useEffect(() => {
    if (showAll) listRef.current?.querySelectorAll('a')[FIRST_PAGE]?.focus()
  }, [showAll])

  return (
    <section className={styles.catalogue} aria-label="Catalogue">
      <div className="container">
        <ul role="list" className={styles.grid} ref={listRef}>
          {visible.map((module) => {
            const image = catalogueImage(module.slug)
            return (
              <li key={module.slug} className={styles.item} onPointerMove={lean} onPointerLeave={settle}>
                <div className={styles.frame}>
                  {image && <img src={image} alt="" loading="lazy" decoding="async" />}
                </div>

                <h2 className={styles.name}>
                  {/* The link's hit area is stretched over the whole item in CSS. */}
                  <Link to={paths.module(module.slug)} className={styles.link}>
                    {module.name}
                    <ArrowRightIcon aria-hidden="true" weight="bold" className={styles.arrow} />
                  </Link>
                </h2>

                <p className={styles.blurb}>{module.blurb}</p>
              </li>
            )
          })}
        </ul>

        {hasMore && !showAll && (
          <div className={styles.more}>
            <Button variant="secondary" size="lg" onClick={() => setShowAll(true)}>
              View all
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
