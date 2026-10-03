import type { AnchorHTMLAttributes } from 'react'
import { toHref } from './hashRouter'

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Route path, for example "/about". */
  to: string
}

/** Internal link. Renders a normal anchor that points at a hash route. */
export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={toHref(to)} {...rest}>
      {children}
    </a>
  )
}
