/** Site-wide names and links. Rename the project here. */
const repoUrl = 'https://github.com/sawyer100/medieval-shit-and-violence-script'

export const site = {
  name: 'VIOLENCE',
  platform: 'JanitorAI',
  title: 'Script Modules for JanitorAI',
  repoUrl,
  /** Link to a file on the main branch. */
  fileUrl: (path: string) => `${repoUrl}/blob/main/${path}`,
} as const
