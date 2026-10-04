import { site } from './site'

/*
 * The ripper is the code in src/ripper. This file only holds the words the
 * site shows about it. If the ripper learns a new input format, add it here.
 */

export interface RipperInput {
  term: string
  /** Rich text. See the marks listed in types.ts. */
  detail: string
}

const accepts: RipperInput[] = [
  {
    term: 'JSON exports',
    detail: 'A lorebook export, a World Info file, a character card with a lorebook inside, or a saved script record.',
  },
  {
    term: 'JavaScript',
    detail: 'A script file or an advanced lorebook written as code. It is read, never run. Values that only exist when the code runs are left out and listed.',
  },
  {
    term: 'Plain text',
    detail: 'Notes with `Name:` and `Keys:` lines, `## headings`, or `---` between entries. With none of those, each paragraph becomes one entry.',
  },
  {
    term: 'Assembled prompts',
    detail: 'A chat request printed by the Scraper, or pasted prompt text. Sections wrapped in tags become entries named after the tag.',
  },
]

/** Loaded by the "Try an example" button. Small on purpose, and shows two input styles side by side. */
const example = `Name: The Harbor
Keys: harbor, docks
Category: place
Order: 10
A crowded harbor that smells of tar. The chain goes up at dusk.

Name: Captain Voss
Keys: voss, the captain
Runs the night watch. Limps on her left leg since the fire.
---
A loose note with no name or keys.
`

export const ripper = {
  name: 'The Ripper',
  /** One sentence for the home page and the top of the ripper page. */
  blurb: 'Paste a lorebook export, a script file or plain notes and get one clean, consistent list of entries back.',
  /** Shown next to the input. What it does not do matters as much as what it does. */
  privacy:
    'It runs in this browser tab. Nothing you paste is uploaded, and it never logs in to, reads from or talks to JanitorAI. Use it on your own scripts and on data you are allowed to have.',
  folderUrl: `${site.repoUrl}/tree/main/src/ripper`,
  accepts,
  example,
  /** Files larger than this are refused instead of freezing the tab. */
  maxFileBytes: 5 * 1024 * 1024,
}
