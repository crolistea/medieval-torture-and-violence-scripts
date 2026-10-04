import raw from '../../../say_something_horrible.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'
const script = createScriptSource('say_something_horrible.js', raw)
const name = 'Say Something Horrible'
export const saySomethingHorrible: ModuleDefinition = {
  slug: 'say-something-horrible', name, theme: 'blood',
  tagline: 'Lets established cruel, vulgar or sadistic characters use genuinely vicious or disturbing dialogue when the situation supports it.',
  blurb: 'Some characters should be allowed to say awful things.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'Recent messages considered for hostile dialogue context.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Maximum approximate size of the dialogue guidance.' },
    { key: 'MIN_SCORE', value: readSetting(script, 'MIN_SCORE'), meaning: 'Character-and-scene evidence required before activation.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the activation score while testing.' },
  ],
  steps: buildInstallSteps({ scriptName: name, marker: '[DIALOGUE INTENSITY]', testMessage: 'He threatens me again. What does he actually say this time?' }),
  completeNote: 'It stays quiet unless both characterization and the current situation support harsher speech.',
}
