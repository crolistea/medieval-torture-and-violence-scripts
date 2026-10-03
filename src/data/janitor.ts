/*
 * What we know about the JanitorAI Scripts interface, and where we know it from.
 *
 * Every button and menu name used in the install steps comes from this file.
 * Labels under `ui` were checked against JanitorAI's own help centre on
 * 2026-10-02. Anything we could not confirm is listed under `unverified` and
 * is shown to readers with an "Unconfirmed" notice instead of being presented
 * as fact. If JanitorAI changes its interface, this is the one file to update.
 */

export const janitorLinks = {
  site: 'https://janitorai.com',
  /** "What Are Scripts - A Beginner Friendly Overview" */
  overview: 'https://help.janitorai.com/en/article/what-are-scripts-a-beginner-friendly-overview-1s89w2x/',
  /** "How to Use Scripts - Your Beginner Friendly Step-by-Step Guide" */
  howTo: 'https://help.janitorai.com/en/article/how-to-use-scripts-your-beginner-friendly-step-by-step-guide-1bdk5hc/',
  /** Help centre category that lists every Scripts article. */
  helpCategory: 'https://help.janitorai.com/en/category/scripts-1qzakwc/',
  /** "Scripts beta is here" announcement. */
  announcement: 'https://janitorai.com/news/announcements/10/',
} as const

/** Labels quoted from JanitorAI's official step-by-step guide. */
export const ui = {
  scriptsMenu: 'Scripts',
  createNewScript: 'Create New Script',
  lorebookType: 'Lorebook',
  createScript: 'Create Script',
  addEntry: 'Add Entry',
  advancedEntry: 'Advanced (Script)',
  save: 'Save',
  assignSection: 'Assign to your Characters',
  assignButton: 'Assign to Script',
  testChat: 'Test Chat',
  newChat: '+ New Chat',
  showDebugPanel: 'Show Debug Panel',
  changesTab: 'Changes',
} as const

/**
 * Details the official documentation does not spell out. The announcement
 * confirms that scripts have a "lorebooks" visual mode and an "advanced" code
 * editor mode, but the step-by-step guide only walks through Lorebook.
 */
export const unverified = {
  advancedTypeLabel: 'Advanced',
} as const

export interface SourceNote {
  title: string
  url: string
  covers: string
}

export const sources: SourceNote[] = [
  {
    title: 'How to Use Scripts: step-by-step guide',
    url: janitorLinks.howTo,
    covers:
      'Where the Scripts menu is, creating a script, saving, assigning it to a character, Test Chat and the debug panel.',
  },
  {
    title: 'What Are Scripts: overview',
    url: janitorLinks.overview,
    covers: 'What scripts are and the two script types, Lorebook and Advanced.',
  },
  {
    title: 'Scripts beta announcement',
    url: janitorLinks.announcement,
    covers:
      'Advanced mode is a code editor. One script can serve several characters, and one character can stack several scripts.',
  },
]
