import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'lg'

interface BaseProps {
  variant?: Variant
  size?: Size
  /** Stretch to the full width of the container on small screens. */
  fullWidthOnMobile?: boolean
  children: ReactNode
  className?: string
}

type ButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined }
type AnchorProps = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string }

/** Square, hard-edged button. Renders a link when `href` is given. */
export function Button(props: ButtonProps | AnchorProps) {
  const { variant = 'primary', size = 'md', fullWidthOnMobile = false, className, children, ...rest } = props
  const classes = cx(styles.button, styles[variant], styles[size], fullWidthOnMobile && styles.fluid, className)

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
