import { Fragment } from 'react'
import styles from './RichText.module.css'

/*
 * Renders the three inline marks used in the content files:
 *   **Create New Script**   a label the reader has to find on screen
 *   `"use worker";`         literal code or text
 *   [help page](https://…)  an external link
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/

export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className={styles.label}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={index} className={styles.code}>
              {part.slice(1, -1)}
            </code>
          )
        }
        const link = LINK.exec(part)
        if (link) {
          return (
            <a key={index} className="text-link" href={link[2]} target="_blank" rel="noreferrer">
              {link[1]}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )
        }
        return <Fragment key={index}>{part}</Fragment>
      })}
    </>
  )
}
