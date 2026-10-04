import raw from '../../../the_quiet_part.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'
const script = createScriptSource('the_quiet_part.js', raw)
const name = 'The Quiet Part'
export const theQuietPart: ModuleDefinition = {
  slug: 'the-quiet-part', name, theme: 'blood',
  tagline: 'Allows suitable characters to use silence, withholding, incomplete answers and emotional restraint instead of explaining everything on demand.',
  blurb: 'Not every question deserves an answer.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'Recent dialogue considered for questioning and pressure.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Maximum approximate size of the silence/withholding guidance.' },
    { key: 'MIN_SCORE', value: readSetting(script, 'MIN_SCORE'), meaning: 'Character-and-scene evidence required before activation.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the activation score while testing.' },
  ],
  steps: buildInstallSteps({ scriptName: name, marker: '[THE QUIET PART]', testMessage: 'Why did you do it? Tell me exactly what you were thinking.' }),
  completeNote: 'It permits silence or concealment when characterization supports it; it does not force every character to become mysterious.',
}
