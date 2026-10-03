import { useLayoutEffect, useRef } from 'react'
import { catalogueImage } from '../../data/catalogueImages'
import { modules } from '../../data/modules'
import type { ModuleDefinition } from '../../data/types'
import { Link } from '../../router/Link'
import { paths } from '../../router/paths'
import { cx } from '../../utils/cx'
import styles from './ScriptRail.module.css'

/**
 * The whole catalogue in order, opened on the current script: the ones before
 * it on one side, the ones after it on the other, both dimmed and smaller.
 * It scrolls by itself, so a mouse wheel over it moves through the scripts
 * and leaves the page where it is. It runs down the page on a wide screen and
 * across it on a narrow one.
 */
export function ScriptRail({ current }: { current: ModuleDefinition }) {
  const railRef = useRef<HTMLElement>(null)
  const hereRef = useRef<HTMLLIElement>(null)

  // Start with the open script in the middle, whichever way the rail runs.
  useLayoutEffect(() => {
    const rail = railRef.current
    const here = hereRef.current
    if (!rail || !here) return
    rail.scrollTop = here.offsetTop - (rail.clientHeight - here.offsetHeight) / 2
    rail.scrollLeft = here.offsetLeft - (rail.clientWidth - here.offsetWidth) / 2
  }, [current])

  return (
    <nav ref={railRef} className={styles.rail} aria-label="All scripts">
      <ol role="list" className={styles.list}>
        {modules.map((module) => {
          const image = catalogueImage(module.slug)
          const isHere = module === current
          const content = (
            <>
              <span className={styles.thumb}>
                {image && <img src={image} alt="" loading="lazy" decoding="async" />}
              </span>
              <span className={styles.label}>{module.name}</span>
            </>
          )

          return (
            <li key={module.slug} ref={isHere ? hereRef : undefined} className={cx(isHere && styles.hereItem)}>
              {isHere ? (
                <p className={cx(styles.entry, styles.here)} aria-current="page">
                  {content}
                </p>
              ) : (
                <Link to={paths.module(module.slug)} className={styles.entry}>
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
