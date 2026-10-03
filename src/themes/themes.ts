/**
 * Theme ids. The colour values for each id live in themes.css.
 * A module picks one of these and the whole site shifts to it while
 * that module is open.
 */
export const THEME_IDS = ['blue', 'aqua', 'blood', 'orange'] as const

export type ThemeId = (typeof THEME_IDS)[number]

/** Used on the home page, About, and anything that is not a module. */
export const DEFAULT_THEME: ThemeId = 'blood'
