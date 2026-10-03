import { useEffect } from 'react'
import type { ThemeId } from '../themes/themes'

/**
 * Applies a theme to the whole document. The accent colours are animated in
 * CSS, so changing this attribute is what produces the colour shift between
 * sections.
 */
export function useTheme(theme: ThemeId): void {
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
